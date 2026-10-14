/**
 * Jarvis Renderer
 *
 * A holographic assistant interface in the style of a film HUD:
 * - Fragmented "reactor" ring of instanced data blocks that doubles as a circular voice
 *   spectrum (mirrored left/right, low frequencies at 12 o'clock)
 * - ~20 analytically anti-aliased HUD rings (ticks, dashes, circuit nodes, a voice meter),
 *   spread through depth so pointer tilt produces real parallax
 * - Circuit traces whose data pulses flow outward while speaking and inward while listening
 * - Core, radar sweep, syllable shockwaves, sparks, dust and bokeh
 * - Live text readouts (state decode, voice level, pitch, uptime)
 * - Bloom + hologram post-processing (chromatic aberration, scanlines, glitch, grain)
 *
 * Voice comes from the shared `KwamiAudio` analyser, to which `Kwami` connects the agent's
 * LiveKit track — so the HUD reacts to the agent speaking with no extra wiring.
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { KwamiState } from '../../../types/index.js'
import type {
  JarvisColorConfig,
  JarvisConfig,
  JarvisOptions,
  JarvisPalettePreset,
  JarvisQuality,
} from './types.js'
import { getDefaultJarvisConfig, getJarvisPalette, jarvisQualityProfiles } from './config.js'
import { JarvisAudioAnalyzer, synthesizeSpeechSpectrum, type JarvisAudioFrame } from './audio.js'
import {
  createBokeh,
  createCircuitTraces,
  createDust,
  createLeaderTraces,
  createMarkers,
  createReactorBlocks,
  createRingSpecs,
  getLabelPlacements,
  type HudRingSpec,
  type JarvisColorRole,
  type LabelLayout,
  type MarkerSpec,
  type TracePath,
} from './layout.js'
import * as shaders from './shaders.js'
import {
  HudLabel,
  ScrambleText,
  drawTelemetryBlock,
  drawTitleBlock,
  telemetryKey,
  type TelemetryContent,
} from './labels.js'

const CAMERA_FOV = 35
const CAMERA_DISTANCE = 8
const SPECTRUM_BANDS = 64
const TELEMETRY_BARS = 20
const WAVE_SLOTS = 4
/** Circuit traces float behind the reactor plane, so they separate from it when tilted. */
const TRACE_Z = -0.38
/** After this long "speaking" with a silent analyser, animate from a synthetic voice. */
const SILENT_SPEECH_FALLBACK_S = 0.35

interface Mood {
  /** Ring rotation multiplier. */
  spin: number
  /** Base brightness. */
  glow: number
  /** Radar sweep visibility. */
  sweep: number
  /** Voice-meter chase (thinking). */
  chase: number
  /** Trace pulse direction and amount: +1 outward, -1 inward. */
  flow: number
  /** Reactor radius multiplier. */
  focus: number
  /** Core pulse amount. */
  core: number
  /** Voice-meter idle fill. */
  meter: number
  /** Dust orbit speed. */
  dust: number
}

const MOODS: Record<KwamiState, Mood> = {
  idle: { spin: 1, glow: 0.55, sweep: 0, chase: 0, flow: 0.35, focus: 1, core: 0.25, meter: 0.1, dust: 0.6 },
  listening: { spin: 0.55, glow: 0.8, sweep: 1, chase: 0, flow: -1, focus: 0.962, core: 0.45, meter: 0.18, dust: 0.45 },
  thinking: { spin: 3.2, glow: 0.92, sweep: 0, chase: 1, flow: 0.6, focus: 1, core: 1, meter: 0, dust: 1.6 },
  speaking: { spin: 1.35, glow: 0.75, sweep: 0, chase: 0, flow: 1, focus: 1.015, core: 0.35, meter: 0, dust: 1.1 },
}

const STATE_TEXT: Record<KwamiState, string> = {
  idle: '[ STANDBY ]',
  listening: '[ LISTENING ]',
  thinking: '[ PROCESSING ]',
  speaking: '[ RESPONDING ]',
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

function easeOutCubic(t: number): number {
  const u = 1 - clamp01(t)
  return 1 - u * u * u
}

interface RingEntry {
  spec: HudRingSpec
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
  wallUniforms: Record<string, THREE.IUniform> | null
  angle: number
}

interface MarkerEntry {
  spec: MarkerSpec
  mesh: THREE.Mesh
  uniforms: Record<string, THREE.IUniform>
}

interface Shockwave {
  radius: number
  strength: number
  width: number
  speed: number
}

interface SparkPool {
  points: THREE.Points
  positions: Float32Array
  velocities: Float32Array
  life: Float32Array
  decay: Float32Array
  cursor: number
}

export class Jarvis {
  private readonly scene: THREE.Scene
  private readonly camera: THREE.PerspectiveCamera
  private readonly renderer: THREE.WebGLRenderer
  private readonly audio: JarvisOptions['audio']
  private config: JarvisConfig

  /** Optional double-click callback (e.g. toggle conversation). */
  public onDoubleClick: (() => void | Promise<void>) | null = null

  // Scene graph: root (in scene) -> tilt (pointer/drag) -> hud (viewport fit).
  private readonly root = new THREE.Group()
  private readonly tilt = new THREE.Group()
  private readonly hud = new THREE.Group()

  // Shared uniforms. Materials hold references, so a palette change is six assignments.
  private readonly colors: Record<JarvisColorRole | 'background' | 'backgroundGlow', THREE.Uniform<THREE.Color>>
  private readonly uTime = new THREE.Uniform(0)
  // Motion phases, integrated on the CPU so a speed change never makes anything jump.
  private readonly uRunnerPhase = new THREE.Uniform(0)
  private readonly uWavePhase = new THREE.Uniform(0)
  private readonly uWaveAmp = new THREE.Uniform(0.12)
  private readonly uStreamPhase = new THREE.Uniform(0)
  private streamDirection = 1

  private rings: RingEntry[] = []
  private reactorMesh!: THREE.Mesh
  private reactorUniforms!: Record<string, THREE.IUniform>
  private reactorAngle = 0
  private readonly spectrumData = new Uint8Array(SPECTRUM_BANDS)
  private readonly spectrumTexture: THREE.DataTexture
  private fxMesh!: THREE.Mesh
  private fxUniforms!: Record<string, THREE.IUniform>
  private coreMesh!: THREE.Mesh
  private coreUniforms!: Record<string, THREE.IUniform>
  private globe!: THREE.Points
  private globeUniforms!: Record<string, THREE.IUniform>
  private crosshairs: Array<{ mesh: THREE.Mesh; uniforms: Record<string, THREE.IUniform> }> = []
  private markers: MarkerEntry[] = []
  private tracker!: MarkerEntry
  private traceMesh: THREE.Mesh | null = null
  private traceUniforms!: Record<string, THREE.IUniform>
  private padMesh: THREE.Mesh | null = null
  private padUniforms!: Record<string, THREE.IUniform>
  private readonly circuitTraces: TracePath[] = createCircuitTraces()
  private backdropMesh!: THREE.Mesh
  private backdropUniforms!: Record<string, THREE.IUniform>
  private dust: THREE.Points | null = null
  private dustUniforms!: Record<string, THREE.IUniform>
  private bokeh: THREE.Points | null = null
  private bokehUniforms!: Record<string, THREE.IUniform>
  private sparks: SparkPool | null = null
  private sparkUniforms!: Record<string, THREE.IUniform>

  private titleLabel!: HudLabel
  private telemetryLabel!: HudLabel
  private readonly stateText = new ScrambleText()
  private telemetryClock = 0
  private readonly telemetryBars = new Float32Array(TELEMETRY_BARS)

  // Post-processing.
  private readonly composer: EffectComposer
  private readonly renderPass: RenderPass
  private readonly bloomPass: UnrealBloomPass
  private readonly hologramPass: ShaderPass
  private readonly outputPass: OutputPass
  private readonly drawingBufferSize = new THREE.Vector2()
  private readonly scratch = new THREE.Vector2()

  // Restored on dispose: the WebGLRenderer and camera are shared with the next renderer.
  private readonly previousToneMapping: THREE.ToneMapping
  private readonly previousToneMappingExposure: number
  private readonly previousPixelRatio: number
  private readonly previousCamera: { fov: number; position: THREE.Vector3; quaternion: THREE.Quaternion }

  // Animation state.
  private state: KwamiState = 'idle'
  private readonly mood: Mood = { ...MOODS.idle }
  private elapsed = 0
  private lastFrameTime = 0
  private animationFrameId: number | null = null
  private disposed = false
  private flowPhase = 0
  private sweepAngle = Math.PI / 2
  private glitch = 0
  private aberrationKick = 0
  private flash = 0
  private readonly waves: Shockwave[] = Array.from({ length: WAVE_SLOTS }, () => ({ radius: 0, strength: 0, width: 0.02, speed: 0 }))

  // Audio.
  private readonly analyzer = new JarvisAudioAnalyzer({ bandCount: SPECTRUM_BANDS })
  private readonly syntheticAnalyzer = new JarvisAudioAnalyzer({ bandCount: SPECTRUM_BANDS })
  private readonly syntheticSpectrum = new Uint8Array(1024)
  private silentSpeech = 0
  private drive = 0
  private lastFrame: JarvisAudioFrame | null = null
  private externalLevel = 0
  private externalLevelAt = -1

  // Layout / fit.
  private layout: LabelLayout = 'wide'
  private fitScale = 1
  private lastAspect = 0

  // Pointer.
  private readonly pointer = new THREE.Vector2()
  private pointerSeenAt = -10
  private hover = 0
  private hoverTarget = 0
  private readonly tiltCurrent = new THREE.Vector2()
  private readonly dragOffset = new THREE.Vector2()
  private readonly dragVelocity = new THREE.Vector2()
  private drag = { active: false, lastX: 0, lastY: 0, lastT: 0, moved: 0, downAt: 0 }
  /** Pointer projected onto the HUD plane, in HUD units. */
  private readonly pointerLocal = new THREE.Vector2(99, 99)
  private pointerInfluence = 0
  private readonly raycaster = new THREE.Raycaster()
  private readonly hudPlane = new THREE.Plane()
  private readonly scratch3 = new THREE.Vector3()
  private readonly scratchMatrix = new THREE.Matrix4()
  private readonly removeListeners: Array<() => void> = []

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    options: JarvisOptions = {},
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.audio = options.audio

    // Explicit undefined in options must not override a default.
    const defined = <T extends object>(value: T | undefined): Partial<T> =>
      Object.fromEntries(Object.entries(value ?? {}).filter(([, v]) => v !== undefined)) as Partial<T>
    const { audio: _audio, color, ...rest } = options
    const defaults = getDefaultJarvisConfig()
    const merged = { ...defaults, ...defined(rest) }
    this.config = {
      ...merged,
      color: { ...getJarvisPalette(merged.palettePreset), ...defined(color) },
    }

    this.colors = {
      primary: new THREE.Uniform(new THREE.Color()),
      secondary: new THREE.Uniform(new THREE.Color()),
      accent: new THREE.Uniform(new THREE.Color()),
      alert: new THREE.Uniform(new THREE.Color()),
      background: new THREE.Uniform(new THREE.Color()),
      backgroundGlow: new THREE.Uniform(new THREE.Color()),
    }
    this.applyColors()

    this.spectrumTexture = new THREE.DataTexture(this.spectrumData, SPECTRUM_BANDS, 1, THREE.RedFormat, THREE.UnsignedByteType)
    this.spectrumTexture.minFilter = THREE.LinearFilter
    this.spectrumTexture.magFilter = THREE.LinearFilter
    this.spectrumTexture.wrapS = THREE.ClampToEdgeWrapping
    this.spectrumTexture.needsUpdate = true

    // Camera: a long lens flattens the perspective the way a projected hologram reads, while
    // keeping enough depth for the layered parallax. Restored in dispose().
    this.previousCamera = {
      fov: camera.fov,
      position: camera.position.clone(),
      quaternion: camera.quaternion.clone(),
    }
    this.camera.fov = CAMERA_FOV
    this.camera.updateProjectionMatrix()
    this.resetCamera()

    this.previousToneMapping = renderer.toneMapping
    this.previousToneMappingExposure = renderer.toneMappingExposure
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05

    this.root.name = 'jarvis'
    this.root.add(this.tilt)
    this.tilt.add(this.hud)
    this.scene.add(this.root)

    this.createBackdrop()
    this.createFx()
    this.createRings()
    this.createReactor()
    this.createCore()
    this.createGlobe()
    this.createCrosshairs()
    this.createMarkers()
    this.createLabels()
    this.createParticles()
    this.computeFit(true)

    // Post-processing. Rendering into the composer's targets bypasses the canvas's own
    // antialiasing, so the targets carry MSAA themselves, and on a 1x display the HUD is
    // supersampled: hairline holograms are exactly what aliasing destroys first.
    this.previousPixelRatio = renderer.getPixelRatio()
    renderer.setPixelRatio(this.renderScale())
    const size = renderer.getSize(new THREE.Vector2())
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: this.msaaSamples(),
    })
    this.composer = new EffectComposer(renderer, target)
    this.composer.setPixelRatio(renderer.getPixelRatio())
    this.composer.setSize(size.x, size.y)
    this.renderPass = new RenderPass(scene, camera)
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 1.1, 0.55, 0.06)
    this.hologramPass = new ShaderPass(shaders.hologramShader)
    this.outputPass = new OutputPass()
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.bloomPass)
    this.composer.addPass(this.hologramPass)
    this.composer.addPass(this.outputPass)
    renderer.getDrawingBufferSize(this.drawingBufferSize)
    ;(this.hologramPass.uniforms.uResolution!.value as THREE.Vector2).copy(this.drawingBufferSize)

    this.stateText.set(STATE_TEXT.idle, 0)
    this.setupPointer()
    this.setupFontReload()
    this.startAnimation()
  }

  // =====================================================
  // CONSTRUCTION
  // =====================================================

  private additive(material: Omit<THREE.ShaderMaterialParameters, 'blending'>): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      // Double-sided: the reactor's polar mapping flips triangle winding, and a hologram has
      // no back anyway — tilted past edge-on it should still read.
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
      ...material,
    })
  }

  private createBackdrop(): void {
    this.backdropUniforms = {
      uBase: this.colors.background,
      uGlow: this.colors.backgroundGlow,
      uSecondary: this.colors.secondary,
      uResolution: new THREE.Uniform(new THREE.Vector2(1, 1)),
      uCenter: new THREE.Uniform(new THREE.Vector2(0.5, 0.5)),
      uTime: this.uTime,
      uLevel: new THREE.Uniform(0),
    }
    const material = new THREE.ShaderMaterial({
      uniforms: this.backdropUniforms,
      vertexShader: shaders.backdropVertexShader,
      fragmentShader: shaders.backdropFragmentShader,
      depthWrite: false,
      depthTest: false,
    })
    this.backdropMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
    this.backdropMesh.frustumCulled = false
    this.backdropMesh.renderOrder = -100
    this.backdropMesh.visible = this.config.backdrop
    this.root.add(this.backdropMesh)
  }

  private createFx(): void {
    this.fxUniforms = {
      uPrimary: this.colors.primary,
      uSecondary: this.colors.secondary,
      uHot: this.colors.accent,
      uTime: this.uTime,
      uCore: new THREE.Uniform(1),
      uSweep: new THREE.Uniform(0),
      uSweepAngle: new THREE.Uniform(0),
      uHover: new THREE.Uniform(0),
      uLevel: new THREE.Uniform(0),
      uWaveAmp: this.uWaveAmp,
      uWavePhase: this.uWavePhase,
      uWaves: new THREE.Uniform(Array.from({ length: WAVE_SLOTS }, () => new THREE.Vector4())),
    }
    this.fxMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(7.6, 7.6),
      this.additive({ uniforms: this.fxUniforms, vertexShader: shaders.fxVertexShader, fragmentShader: shaders.fxFragmentShader }),
    )
    this.fxMesh.position.z = -0.01
    this.fxMesh.renderOrder = 1
    this.hud.add(this.fxMesh)
  }

  private createRings(): void {
    for (const spec of createRingSpecs()) {
      const tickReach = Math.abs(spec.tickLength) * Math.max(1, spec.majorScale)
      const extent = Math.max(spec.width * 3, spec.nodeSize * 0.6) + tickReach + 0.02
      const inner = Math.max(0, spec.radius - extent)
      const outer = spec.radius + extent
      const segments = Math.min(512, Math.max(64, Math.round(spec.radius * 180)))
      const seed = spec.radius * 7.31

      const uniforms: Record<string, THREE.IUniform> = {
        uColor: this.colors[spec.role],
        uHot: this.colors.accent,
        uOpacity: new THREE.Uniform(spec.opacity),
        uRadius: new THREE.Uniform(spec.radius),
        uWidth: new THREE.Uniform(spec.width),
        uArcStart: new THREE.Uniform(spec.arcStart),
        uArcLength: new THREE.Uniform(spec.arcLength),
        uReveal: new THREE.Uniform(0),
        uDashCount: new THREE.Uniform(spec.dashCount),
        uDashDuty: new THREE.Uniform(spec.dashDuty),
        uTickCount: new THREE.Uniform(spec.tickCount),
        uTickLength: new THREE.Uniform(spec.tickLength),
        uTickWidth: new THREE.Uniform(spec.tickWidth),
        uMajorEvery: new THREE.Uniform(spec.majorEvery),
        uMajorScale: new THREE.Uniform(spec.majorScale),
        uNodeCount: new THREE.Uniform(spec.nodeCount),
        uNodeSize: new THREE.Uniform(spec.nodeSize),
        uNodeDensity: new THREE.Uniform(spec.nodeDensity),
        uMeter: new THREE.Uniform(spec.meter ? 1 : 0),
        uMeterValue: new THREE.Uniform(0),
        uChase: new THREE.Uniform(0),
        uTime: this.uTime,
        uGain: new THREE.Uniform(1),
        uSeed: new THREE.Uniform(seed),
        uRunners: new THREE.Uniform(spec.runners),
        uRunnerSpeed: new THREE.Uniform(spec.runnerSpeed),
        uFlowPhase: this.uRunnerPhase,
        uWaveAmp: this.uWaveAmp,
        uWavePhase: this.uWavePhase,
      }
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(inner, outer, segments, 1),
        this.additive({ uniforms, vertexShader: shaders.ringVertexShader, fragmentShader: shaders.ringFragmentShader }),
      )
      mesh.position.z = spec.z
      mesh.renderOrder = 3
      this.hud.add(mesh)

      // Cylindrical wall behind the ring: edge-on (invisible) head-on, a glowing band when tilted.
      let wallUniforms: Record<string, THREE.IUniform> | null = null
      if (spec.wall > 0) {
        wallUniforms = {
          uColor: this.colors[spec.role],
          uHot: this.colors.accent,
          uOpacity: new THREE.Uniform(spec.opacity * 0.85),
          uHeight: new THREE.Uniform(spec.wall),
          uArcStart: uniforms.uArcStart!,
          uArcLength: uniforms.uArcLength!,
          uReveal: uniforms.uReveal!,
          uDashCount: new THREE.Uniform(spec.meter ? 0 : spec.dashCount),
          uDashDuty: uniforms.uDashDuty!,
          uRunners: uniforms.uRunners!,
          uRunnerSpeed: uniforms.uRunnerSpeed!,
          uFlowPhase: this.uRunnerPhase,
          uSeed: uniforms.uSeed!,
          uGain: uniforms.uGain!,
          uWaveAmp: this.uWaveAmp,
          uWavePhase: this.uWavePhase,
          uRadius: uniforms.uRadius!,
        }
        const wallGeometry = new THREE.CylinderGeometry(spec.radius, spec.radius, spec.wall, segments, 1, true)
        wallGeometry.rotateX(Math.PI / 2)
        const wall = new THREE.Mesh(
          wallGeometry,
          this.additive({ uniforms: wallUniforms, vertexShader: shaders.wallVertexShader, fragmentShader: shaders.wallFragmentShader }),
        )
        wall.position.z = -spec.wall / 2
        wall.renderOrder = 3
        mesh.add(wall)
      }

      this.rings.push({ spec, mesh, uniforms, wallUniforms, angle: 0 })
    }
  }

  private createReactor(): void {
    const blocks = createReactorBlocks()
    // Boxes, not quads: head-on they read exactly like the flat reference, but each block has
    // real depth, and the voice extrudes them toward the camera.
    const base = new THREE.BoxGeometry(1, 1, 1, 3, 1, 1)
    const geometry = new THREE.InstancedBufferGeometry()
    geometry.index = base.index
    geometry.setAttribute('position', base.getAttribute('position'))
    geometry.setAttribute('normal', base.getAttribute('normal'))
    geometry.setAttribute('uv', base.getAttribute('uv'))

    const blockData = new Float32Array(blocks.length * 4)
    const metaData = new Float32Array(blocks.length * 4)
    const depthData = new Float32Array(blocks.length)
    blocks.forEach((block, index) => {
      blockData.set([block.angle, block.radius, block.arc, block.thickness], index * 4)
      metaData.set([block.row, block.seed, block.z, block.kind], index * 4)
      depthData[index] = block.depth
    })
    geometry.setAttribute('aBlock', new THREE.InstancedBufferAttribute(blockData, 4))
    geometry.setAttribute('aMeta', new THREE.InstancedBufferAttribute(metaData, 4))
    geometry.setAttribute('aDepth', new THREE.InstancedBufferAttribute(depthData, 1))
    geometry.instanceCount = blocks.length

    this.reactorUniforms = {
      uSpectrum: new THREE.Uniform(this.spectrumTexture),
      uTime: this.uTime,
      uRotation: new THREE.Uniform(0),
      uReactivity: new THREE.Uniform(this.config.reactivity),
      uLevel: new THREE.Uniform(0),
      uFocus: new THREE.Uniform(1),
      uBoot: new THREE.Uniform(0),
      uRowCount: new THREE.Uniform(5),
      uPointerAngle: new THREE.Uniform(0),
      uPointerNear: new THREE.Uniform(0),
      uWaveAmp: this.uWaveAmp,
      uWavePhase: this.uWavePhase,
      uPrimary: this.colors.primary,
      uHot: this.colors.accent,
      uAlert: this.colors.alert,
      uGain: new THREE.Uniform(1),
    }
    const material = this.additive({
      uniforms: this.reactorUniforms,
      vertexShader: shaders.reactorVertexShader,
      fragmentShader: shaders.reactorFragmentShader,
    })
    // Front faces only: the polar mapping keeps the box right-handed, so this culls exactly
    // the faces turned away and the blocks read as solid light rather than doubled glass.
    material.side = THREE.FrontSide
    this.reactorMesh = new THREE.Mesh(geometry, material)
    this.reactorMesh.frustumCulled = false
    this.reactorMesh.renderOrder = 4
    this.hud.add(this.reactorMesh)
  }

  /** Dotted latitude/longitude sphere floating in the reactor chamber. */
  private createGlobe(): void {
    const positions: number[] = []
    const seeds: number[] = []
    const latitudes = 9
    for (let lat = 1; lat < latitudes; lat++) {
      const phi = (lat / latitudes) * Math.PI
      const ringRadius = Math.sin(phi)
      const count = Math.round(150 * ringRadius) + 12
      for (let i = 0; i < count; i++) {
        const theta = (i / count) * Math.PI * 2
        positions.push(Math.cos(theta) * ringRadius, Math.cos(phi), Math.sin(theta) * ringRadius)
        seeds.push(Math.random())
      }
    }
    const meridians = 12
    for (let m = 0; m < meridians; m++) {
      const theta = (m / meridians) * Math.PI * 2
      for (let i = 1; i < 90; i++) {
        const phi = (i / 90) * Math.PI
        positions.push(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi))
        seeds.push(Math.random())
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
    this.globeUniforms = {
      uColor: this.colors.primary,
      uTime: this.uTime,
      uRadius: new THREE.Uniform(0.58),
      uSize: new THREE.Uniform(2.6),
      uPixelRatio: new THREE.Uniform(this.renderer.getPixelRatio()),
      uDistance: new THREE.Uniform(CAMERA_DISTANCE),
      uLevel: new THREE.Uniform(0),
      uReveal: new THREE.Uniform(0),
      uOpacity: new THREE.Uniform(0.32),
    }
    this.globe = new THREE.Points(
      geometry,
      this.additive({ uniforms: this.globeUniforms, vertexShader: shaders.globeVertexShader, fragmentShader: shaders.globeFragmentShader }),
    )
    this.globe.rotation.x = 0.38
    this.globe.renderOrder = 2
    this.hud.add(this.globe)
  }

  private createCore(): void {
    this.coreUniforms = {
      uPrimary: this.colors.primary,
      uHot: this.colors.accent,
      uCore: new THREE.Uniform(1),
    }
    this.coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 32, 16),
      this.additive({ uniforms: this.coreUniforms, vertexShader: shaders.coreVertexShader, fragmentShader: shaders.coreFragmentShader }),
    )
    this.coreMesh.renderOrder = 5
    this.hud.add(this.coreMesh)
  }

  private createCrosshairs(): void {
    const halfLength = 4.2
    const planeHeight = 0.03
    for (const rotation of [0, Math.PI / 2]) {
      const uniforms: Record<string, THREE.IUniform> = {
        uColor: this.colors.primary,
        uOpacity: new THREE.Uniform(0.9),
        uHalfLength: new THREE.Uniform(halfLength),
        uPlaneHeight: new THREE.Uniform(planeHeight),
        uLineHalf: new THREE.Uniform(0.0022),
        uReveal: new THREE.Uniform(0),
        uTime: this.uTime,
      }
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(halfLength * 2, planeHeight),
        this.additive({ uniforms, vertexShader: shaders.markerVertexShader, fragmentShader: shaders.crosshairFragmentShader }),
      )
      mesh.rotation.z = rotation
      mesh.position.z = 0.01
      mesh.renderOrder = 2
      this.hud.add(mesh)
      this.crosshairs.push({ mesh, uniforms })
    }
  }

  private createMarker(spec: MarkerSpec): MarkerEntry {
    const uniforms: Record<string, THREE.IUniform> = {
      uColor: this.colors[spec.role],
      uHot: this.colors.accent,
      uShape: new THREE.Uniform(spec.shape === 'bracket' ? 0 : spec.shape === 'square' ? 1 : 2),
      uOpacity: new THREE.Uniform(0),
      uTime: this.uTime,
      uLevel: new THREE.Uniform(0),
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      this.additive({ uniforms, vertexShader: shaders.markerVertexShader, fragmentShader: shaders.markerFragmentShader }),
    )
    mesh.position.set(spec.x, spec.y, spec.z)
    mesh.scale.set(spec.width, spec.height, 1)
    mesh.rotation.z = spec.rotation
    mesh.renderOrder = 5
    this.hud.add(mesh)
    return { spec, mesh, uniforms }
  }

  private createMarkers(): void {
    this.markers = createMarkers().map((spec) => this.createMarker(spec))
    this.tracker = this.createMarker({
      shape: 'caret', x: 0, y: 1.43, z: 0.12, width: 0.045, height: 0.036, rotation: Math.PI, role: 'accent', opacity: 0,
    })
  }

  /** Ribbon geometry for traces: wider than the drawn line so thin lines never drop fragments. */
  private buildTraces(paths: TracePath[]): void {
    if (this.traceMesh) {
      this.hud.remove(this.traceMesh)
      this.traceMesh.geometry.dispose()
    }
    if (this.padMesh) {
      this.hud.remove(this.padMesh)
      this.padMesh.geometry.dispose()
    }

    const positions: number[] = []
    const dists: number[] = []
    const sides: number[] = []
    const traceData: number[] = []
    const indices: number[] = []
    const pads: number[] = []

    for (const path of paths) {
      let total = 0
      for (let index = 1; index < path.points.length; index++) {
        const [ax, ay] = path.points[index - 1]!
        const [bx, by] = path.points[index]!
        total += Math.hypot(bx - ax, by - ay)
      }
      const lineHalf = path.width * 0.5
      const geometryHalf = Math.max(lineHalf * 3, 0.012)

      let distance = 0
      for (let index = 1; index < path.points.length; index++) {
        const [ax, ay] = path.points[index - 1]!
        const [bx, by] = path.points[index]!
        const length = Math.hypot(bx - ax, by - ay)
        if (length < 1e-5) continue
        const nx = (-(by - ay) / length) * geometryHalf
        const ny = ((bx - ax) / length) * geometryHalf
        const base = positions.length / 3
        positions.push(ax + nx, ay + ny, TRACE_Z, ax - nx, ay - ny, TRACE_Z, bx + nx, by + ny, TRACE_Z, bx - nx, by - ny, TRACE_Z)
        dists.push(distance, distance, distance + length, distance + length)
        sides.push(geometryHalf, -geometryHalf, geometryHalf, -geometryHalf)
        for (let corner = 0; corner < 4; corner++) traceData.push(total, path.seed, path.boost, lineHalf)
        indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3)
        distance += length
      }

      if (path.pad) {
        const [ex, ey] = path.points[path.points.length - 1]!
        pads.push(ex, ey, 0.026, path.seed)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aDist', new THREE.Float32BufferAttribute(dists, 1))
    geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1))
    geometry.setAttribute('aTrace', new THREE.Float32BufferAttribute(traceData, 4))
    geometry.setIndex(indices)

    if (!this.traceUniforms) {
      this.traceUniforms = {
        uColor: this.colors.secondary,
        uPulseColor: this.colors.primary,
        uTime: this.uTime,
        uFlow: new THREE.Uniform(1),
        uFlowPhase: new THREE.Uniform(0),
        uPulse: new THREE.Uniform(0.4),
        uOpacity: new THREE.Uniform(1),
        uReveal: new THREE.Uniform(0),
        uWaveAmp: this.uWaveAmp,
        uWavePhase: this.uWavePhase,
      }
    }
    const material = (this.traceMesh?.material as THREE.ShaderMaterial | undefined) ??
      this.additive({ uniforms: this.traceUniforms, vertexShader: shaders.traceVertexShader, fragmentShader: shaders.traceFragmentShader })
    this.traceMesh = new THREE.Mesh(geometry, material)
    this.traceMesh.frustumCulled = false
    this.traceMesh.renderOrder = 2
    this.hud.add(this.traceMesh)

    const padBase = new THREE.PlaneGeometry(1, 1)
    const padGeometry = new THREE.InstancedBufferGeometry()
    padGeometry.index = padBase.index
    padGeometry.setAttribute('position', padBase.getAttribute('position'))
    padGeometry.setAttribute('aPad', new THREE.InstancedBufferAttribute(new Float32Array(pads), 4))
    padGeometry.instanceCount = pads.length / 4
    if (!this.padUniforms) {
      this.padUniforms = {
        uColor: this.colors.primary,
        uTime: this.uTime,
        uOpacity: new THREE.Uniform(0.85),
        uReveal: new THREE.Uniform(0),
      }
    }
    const padMaterial = (this.padMesh?.material as THREE.ShaderMaterial | undefined) ??
      this.additive({ uniforms: this.padUniforms, vertexShader: shaders.padVertexShader, fragmentShader: shaders.padFragmentShader })
    this.padMesh = new THREE.Mesh(padGeometry, padMaterial)
    this.padMesh.frustumCulled = false
    this.padMesh.position.z = TRACE_Z
    this.padMesh.renderOrder = 2
    this.hud.add(this.padMesh)
  }

  private createLabels(): void {
    const placements = getLabelPlacements(this.layout)
    const uniforms = { uColor: this.colors.primary, uHot: this.colors.accent, uTime: this.uTime }
    this.titleLabel = new HudLabel(placements.title, uniforms)
    this.telemetryLabel = new HudLabel(placements.telemetry, uniforms)
    this.hud.add(this.titleLabel.mesh, this.telemetryLabel.mesh)
    this.titleLabel.mesh.visible = this.config.labels
    this.telemetryLabel.mesh.visible = this.config.labels
  }

  private createParticles(): void {
    this.disposeParticles()
    const profile = jarvisQualityProfiles[this.config.quality]
    const pixelRatio = this.renderer.getPixelRatio()

    // Dust.
    const dust = createDust(profile.dust)
    const dustGeometry = new THREE.BufferGeometry()
    const dustData = new Float32Array(dust.length * 4)
    const dustKind = new Float32Array(dust.length)
    const dustStream = new Float32Array(dust.length)
    dust.forEach((point, index) => {
      dustData.set([point.x, point.y, point.z, point.seed], index * 4)
      dustKind[index] = point.kind
      dustStream[index] = point.stream ?? 0
    })
    // `position` is required by three.js for draw-range/bounds; the shader ignores it.
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(dust.length * 3), 3))
    dustGeometry.setAttribute('aDust', new THREE.BufferAttribute(dustData, 4))
    dustGeometry.setAttribute('aKind', new THREE.BufferAttribute(dustKind, 1))
    dustGeometry.setAttribute('aStream', new THREE.BufferAttribute(dustStream, 1))
    this.dustUniforms = {
      uColor: this.colors.primary,
      uAlert: this.colors.alert,
      uTime: this.uTime,
      uSpeed: new THREE.Uniform(1),
      uSize: new THREE.Uniform(2.4),
      uStreamPhase: this.uStreamPhase,
      uPointer: new THREE.Uniform(this.pointerLocal),
      uPointerAmt: new THREE.Uniform(0),
      uPixelRatio: new THREE.Uniform(pixelRatio),
      uLevel: new THREE.Uniform(0),
      uDistance: new THREE.Uniform(CAMERA_DISTANCE),
      uOpacity: new THREE.Uniform(0.85),
    }
    this.dust = new THREE.Points(
      dustGeometry,
      this.additive({ uniforms: this.dustUniforms, vertexShader: shaders.dustVertexShader, fragmentShader: shaders.dustFragmentShader }),
    )
    this.dust.frustumCulled = false
    this.dust.renderOrder = 0
    this.hud.add(this.dust)

    // Bokeh.
    if (profile.bokeh > 0) {
      const bokeh = createBokeh(profile.bokeh)
      const geometry = new THREE.BufferGeometry()
      const data = new Float32Array(bokeh.length * 4)
      const kind = new Float32Array(bokeh.length)
      bokeh.forEach((point, index) => {
        data.set([point.x, point.y, point.z, point.seed], index * 4)
        kind[index] = point.kind
      })
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bokeh.length * 3), 3))
      geometry.setAttribute('aDust', new THREE.BufferAttribute(data, 4))
      geometry.setAttribute('aKind', new THREE.BufferAttribute(kind, 1))
      this.bokehUniforms = {
        uColor: this.colors.primary,
        uAlert: this.colors.alert,
        uTime: this.uTime,
        uSize: new THREE.Uniform(72),
        uPixelRatio: new THREE.Uniform(pixelRatio),
        uLevel: new THREE.Uniform(0),
        uDistance: new THREE.Uniform(CAMERA_DISTANCE),
        uOpacity: new THREE.Uniform(1),
      }
      this.bokeh = new THREE.Points(
        geometry,
        this.additive({ uniforms: this.bokehUniforms, vertexShader: shaders.bokehVertexShader, fragmentShader: shaders.bokehFragmentShader }),
      )
      this.bokeh.frustumCulled = false
      this.bokeh.renderOrder = 7
      this.tilt.add(this.bokeh)
    }

    // Sparks (CPU pool).
    const count = profile.sparks
    const positions = new Float32Array(count * 3)
    const life = new Float32Array(count)
    const sparkGeometry = new THREE.BufferGeometry()
    sparkGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    sparkGeometry.setAttribute('aLife', new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage))
    this.sparkUniforms = {
      uColor: this.colors.primary,
      uHot: this.colors.accent,
      uSize: new THREE.Uniform(4.5),
      uPixelRatio: new THREE.Uniform(pixelRatio),
      uDistance: new THREE.Uniform(CAMERA_DISTANCE),
    }
    const points = new THREE.Points(
      sparkGeometry,
      this.additive({ uniforms: this.sparkUniforms, vertexShader: shaders.sparkVertexShader, fragmentShader: shaders.sparkFragmentShader }),
    )
    points.frustumCulled = false
    points.renderOrder = 6
    this.hud.add(points)
    this.sparks = {
      points,
      positions,
      velocities: new Float32Array(count * 3),
      life,
      decay: new Float32Array(count),
      cursor: 0,
    }
  }

  private disposeParticles(): void {
    for (const object of [this.dust, this.bokeh, this.sparks?.points ?? null]) {
      if (!object) continue
      object.parent?.remove(object)
      object.geometry.dispose()
      ;(object.material as THREE.Material).dispose()
    }
    this.dust = null
    this.bokeh = null
    this.sparks = null
  }

  // =====================================================
  // INPUT
  // =====================================================

  private setupPointer(): void {
    if (typeof window === 'undefined') return
    const dom = this.renderer.domElement

    /** Pointer position and reactor hover, from any pointer event (touch has no hover phase). */
    const measure = (event: PointerEvent): boolean => {
      const rect = dom.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      this.pointer.set(THREE.MathUtils.clamp(x, -1.2, 1.2), THREE.MathUtils.clamp(y, -1.2, 1.2))
      this.pointerSeenAt = this.elapsed

      // Hover over the reactor, measured in pixels against the fitted radius.
      const pixelsPerUnit = rect.height / this.visibleHeight()
      const reactorPixels = this.fitScale * this.config.scale * pixelsPerUnit
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      this.hoverTarget = Math.hypot(dx, dy) < reactorPixels * 1.15 ? 1 : 0
      return true
    }

    const onMove = (event: PointerEvent): void => {
      if (!measure(event)) return
      if (this.drag.active) {
        const now = performance.now()
        const mx = event.clientX - this.drag.lastX
        const my = event.clientY - this.drag.lastY
        const seconds = Math.max(0.008, (now - this.drag.lastT) / 1000)
        this.drag.lastX = event.clientX
        this.drag.lastY = event.clientY
        this.drag.lastT = now
        this.drag.moved += Math.abs(mx) + Math.abs(my)
        this.dragOffset.x = THREE.MathUtils.clamp(this.dragOffset.x + mx * 0.0055, -1.35, 1.35)
        this.dragOffset.y = THREE.MathUtils.clamp(this.dragOffset.y + my * 0.0055, -0.95, 0.95)
        // Release velocity, smoothed so a last jittery sample does not fling the HUD.
        this.dragVelocity.x = THREE.MathUtils.lerp(this.dragVelocity.x, (mx * 0.0055) / seconds, 0.35)
        this.dragVelocity.y = THREE.MathUtils.lerp(this.dragVelocity.y, (my * 0.0055) / seconds, 0.35)
      }
    }
    const onDown = (event: PointerEvent): void => {
      if (event.button !== 0) return
      measure(event)
      const now = performance.now()
      this.drag = { active: true, lastX: event.clientX, lastY: event.clientY, lastT: now, moved: 0, downAt: now }
      this.dragVelocity.set(0, 0)
    }
    const onUp = (): void => {
      if (!this.drag.active) return
      this.drag.active = false
      if (this.drag.moved < 6 && performance.now() - this.drag.downAt < 350 && this.hoverTarget > 0) {
        this.pulse()
      }
    }
    const onDoubleClick = (): void => {
      void this.onDoubleClick?.()
    }
    const onLeave = (): void => {
      this.hoverTarget = 0
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    dom.addEventListener('dblclick', onDoubleClick)
    dom.addEventListener('pointerleave', onLeave)
    this.removeListeners.push(
      () => window.removeEventListener('pointermove', onMove),
      () => dom.removeEventListener('pointerdown', onDown),
      () => window.removeEventListener('pointerup', onUp),
      () => dom.removeEventListener('dblclick', onDoubleClick),
      () => dom.removeEventListener('pointerleave', onLeave),
    )
  }

  /** Canvas text is drawn once; redraw it when a web font arrives after the first draw. */
  private setupFontReload(): void {
    if (typeof document === 'undefined' || !document.fonts) return
    const onLoaded = (): void => {
      this.titleLabel.invalidate()
      this.telemetryLabel.invalidate()
    }
    document.fonts.addEventListener('loadingdone', onLoaded)
    this.removeListeners.push(() => document.fonts.removeEventListener('loadingdone', onLoaded))
    void document.fonts.ready.then(onLoaded)
  }

  // =====================================================
  // LAYOUT
  // =====================================================

  private visibleHeight(): number {
    return 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * CAMERA_DISTANCE
  }

  /** Fit the reactor (and the label blocks, when shown) to the viewport. */
  private computeFit(force = false): void {
    const aspect = this.camera.aspect || 1
    if (!force && aspect === this.lastAspect) return
    this.lastAspect = aspect

    const visibleHeight = this.visibleHeight()
    const visibleWidth = visibleHeight * aspect
    const layout: LabelLayout = aspect >= 1.05 ? 'wide' : 'stacked'

    if (!this.config.labels) {
      this.fitScale = 0.31 * Math.min(visibleHeight, visibleWidth)
    } else if (layout === 'wide') {
      this.fitScale = Math.min(0.31 * visibleHeight, visibleWidth / 5.8)
    } else {
      this.fitScale = Math.min(0.3 * visibleWidth, visibleHeight / 4.6)
    }

    if (force || layout !== this.layout || !this.traceMesh) {
      this.layout = layout
      this.buildTraces([...this.circuitTraces, ...createLeaderTraces(layout)])
      const placements = getLabelPlacements(layout)
      this.titleLabel.applyPlacement(placements.title)
      this.telemetryLabel.applyPlacement(placements.telemetry)
    }
  }

  private resetCamera(): void {
    this.camera.position.set(0, 0, CAMERA_DISTANCE)
    this.camera.up.set(0, 1, 0)
    this.camera.lookAt(0, 0, 0)
  }

  // =====================================================
  // ANIMATION
  // =====================================================

  private startAnimation(): void {
    const frame = (now: number): void => {
      if (this.disposed) return
      this.animationFrameId = requestAnimationFrame(frame)
      const dt = this.lastFrameTime === 0 ? 1 / 60 : Math.min((now - this.lastFrameTime) / 1000, 0.05)
      this.lastFrameTime = now
      this.update(dt)
      this.composer.render(dt)
    }
    this.animationFrameId = requestAnimationFrame(frame)
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private readAudio(dt: number): JarvisAudioFrame {
    const data = this.audio?.getFrequencyData() ?? new Uint8Array(0)
    const sampleRate = this.audio?.getAudioContext?.()?.sampleRate ?? 48000
    let frame = this.analyzer.analyze(data, sampleRate, dt * 1000)

    // Speaking with no audio reaching the analyser: animate from a synthetic voice so the
    // interface never sits frozen while the agent talks.
    if (this.state === 'speaking' && !frame.active) {
      this.silentSpeech += dt
    } else {
      this.silentSpeech = 0
    }
    if (this.silentSpeech > SILENT_SPEECH_FALLBACK_S) {
      synthesizeSpeechSpectrum(this.elapsed, 48000, this.syntheticSpectrum)
      frame = this.syntheticAnalyzer.analyze(this.syntheticSpectrum, 48000, dt * 1000)
    } else if (this.state !== 'speaking') {
      this.syntheticAnalyzer.reset()
    }

    // Levels pushed from outside (music player) when the analyser itself is silent.
    if (!frame.active && this.elapsed - this.externalLevelAt < 0.25) {
      frame = { ...frame, level: Math.max(frame.level, this.externalLevel) }
    }
    return frame
  }

  private update(dt: number): void {
    this.elapsed += dt
    const t = this.elapsed
    this.uTime.value = t

    // Keep the view locked: OrbitControls (disabled for this renderer) still runs update().
    this.resetCamera()
    this.computeFit()
    this.syncComposerSize()

    // ---- audio ----------------------------------------------------------------------
    const frame = this.readAudio(dt)
    this.lastFrame = frame
    const reactivity = this.config.reactivity
    const stateWeight = this.state === 'speaking' ? 1 : 0.7
    const targetDrive = frame.level * reactivity * stateWeight
    this.drive = damp(this.drive, targetDrive, targetDrive > this.drive ? 30 : 9, dt)
    const drive = this.drive

    for (let band = 0; band < SPECTRUM_BANDS; band++) {
      this.spectrumData[band] = Math.round(clamp01((frame.spectrum[band] ?? 0) * stateWeight) * 255)
    }
    this.spectrumTexture.needsUpdate = true

    if (frame.onset > 0 && reactivity > 0) {
      this.spawnShockwave(0.1 + frame.onset * 0.22 * Math.min(1.5, reactivity))
      this.spawnSparks(Math.round(4 + frame.onset * 16 * Math.min(1.5, reactivity)), frame)
      this.glitch = Math.max(this.glitch, frame.onset * 0.22)
      this.aberrationKick = Math.max(this.aberrationKick, frame.onset * 0.8)
    }

    // ---- mood -----------------------------------------------------------------------
    const target = MOODS[this.state]
    const mood = this.mood
    for (const key of Object.keys(target) as Array<keyof Mood>) {
      mood[key] = damp(mood[key], target[key], key === 'spin' ? 2.2 : 3.5, dt)
    }
    this.glitch *= Math.exp(-dt * 7)
    this.aberrationKick *= Math.exp(-dt * 5)
    this.flash *= Math.exp(-dt * 4)
    this.hover = damp(this.hover, this.hoverTarget, 6, dt)

    // ---- boot -----------------------------------------------------------------------
    const intro = easeOutCubic(t / 1.4)
    const glow = 0.6 + mood.glow * 0.55 + this.hover * 0.12
    const intensity = this.config.intensity

    // ---- motion phases ----------------------------------------------------------------
    // Comets speed up with the voice and when thinking; the radial wave rolls faster and
    // harder while speaking; the dust current flows out when speaking, in when listening.
    this.uRunnerPhase.value += dt * (0.18 + mood.chase * 0.5 + drive * 0.9) * this.config.rotationSpeed
    this.uWavePhase.value += dt * (1.1 + drive * 7 + mood.chase * 2)
    this.uWaveAmp.value = damp(this.uWaveAmp.value, 0.1 + drive * 0.55 + mood.chase * 0.12, 6, dt)
    this.streamDirection = damp(this.streamDirection, mood.flow >= 0 ? 1 : -1, 2, dt)
    this.uStreamPhase.value += dt * (0.05 + drive * 0.3 + Math.abs(mood.flow) * 0.04) * this.streamDirection

    // ---- transform ------------------------------------------------------------------
    this.updateTilt(dt)
    this.updatePointerLocal(dt)
    const breath = 1 + Math.sin(t * 0.8) * 0.004 + drive * 0.014
    this.hud.scale.setScalar(this.fitScale * this.config.scale * (0.86 + 0.14 * intro) * breath)

    // ---- rings ----------------------------------------------------------------------
    const spin = mood.spin * this.config.rotationSpeed
    const meterValue = Math.max(mood.meter * (0.75 + 0.25 * Math.sin(t * 1.4)), Math.min(1, drive * 1.2))
    for (const ring of this.rings) {
      ring.angle += ring.spec.speed * spin * dt
      if (ring.spec.gyroTilt > 0) {
        // Precessing tilt axis: the ring wobbles like a gyroscope while it spins.
        const axis = t * ring.spec.gyroSpeed * this.config.rotationSpeed + ring.spec.radius * 3
        ring.mesh.rotation.set(
          ring.spec.gyroTilt * Math.cos(axis),
          ring.spec.gyroTilt * Math.sin(axis),
          ring.angle,
        )
      } else {
        ring.mesh.rotation.z = ring.angle
      }
      const reveal = easeOutCubic((t - ring.spec.bootDelay) / 0.9)
      ring.uniforms.uReveal!.value = reveal
      ring.uniforms.uGain!.value = (glow + drive * ring.spec.audioGain * 0.6) * Math.sqrt(intensity)
      if (ring.spec.meter) {
        ring.uniforms.uMeterValue!.value = meterValue
        ring.uniforms.uChase!.value = mood.chase
      }
    }

    // ---- reactor --------------------------------------------------------------------
    this.reactorAngle += 0.035 * spin * dt
    this.reactorMesh.rotation.z = this.reactorAngle
    const ru = this.reactorUniforms
    ru.uRotation!.value = this.reactorAngle
    ru.uReactivity!.value = reactivity
    ru.uLevel!.value = drive
    ru.uFocus!.value = mood.focus * (1 + drive * 0.012)
    ru.uBoot!.value = clamp01((t - 0.2) / 1.1)
    ru.uGain!.value = (0.64 + mood.glow * 0.42 + this.hover * 0.3 + this.flash * 0.6) * Math.sqrt(intensity)
    // Blocks under the pointer lift toward it (pointer bearing in the reactor's own frame).
    ru.uPointerAngle!.value = Math.atan2(this.pointerLocal.y, this.pointerLocal.x)
    const pointerRadius = this.pointerLocal.length()
    ru.uPointerNear!.value = this.pointerInfluence * Math.exp(-Math.pow((pointerRadius - 0.9) / 0.35, 2))

    // Globe: slow turn, a thinking spin-up, and a voice swell.
    this.globe.rotation.y += dt * (0.12 + mood.chase * 0.9 + drive * 0.4) * this.config.rotationSpeed
    this.globeUniforms.uLevel!.value = drive
    this.globeUniforms.uReveal!.value = clamp01((t - 0.3) / 1.2)
    this.globeUniforms.uOpacity!.value = (0.38 + mood.glow * 0.15) * Math.sqrt(intensity)

    // ---- core & fx ------------------------------------------------------------------
    const thinkingPulse = mood.core * (0.5 + 0.5 * Math.sin(t * 6.2))
    const core = (1 + thinkingPulse * 1.4 + drive * 2.2 + this.flash * 2) * intro * intensity
    this.coreUniforms.uCore!.value = core
    this.coreMesh.scale.setScalar(1 + drive * 0.5 + thinkingPulse * 0.25)

    this.sweepAngle -= dt * 2.2
    const fx = this.fxUniforms
    fx.uCore!.value = core * 0.55
    fx.uSweep!.value = mood.sweep * intro
    fx.uSweepAngle!.value = this.sweepAngle
    fx.uHover!.value = this.hover
    fx.uLevel!.value = drive
    this.updateWaves(dt)

    // ---- traces, crosshair, markers ---------------------------------------------------
    const traceReveal = clamp01((t - 0.8) / 1.1)
    this.flowPhase += dt * (0.35 + Math.abs(mood.flow) * 0.55 + drive * 1.8)
    const tu = this.traceUniforms
    tu.uFlow!.value = mood.flow >= 0 ? 1 : -1
    tu.uFlowPhase!.value = this.flowPhase
    tu.uPulse!.value = (0.25 + Math.abs(mood.flow) * 0.35 + drive * 0.9 + mood.chase * 0.3) * Math.sqrt(intensity)
    tu.uReveal!.value = traceReveal
    this.padUniforms.uReveal!.value = traceReveal

    for (const { uniforms } of this.crosshairs) {
      uniforms.uReveal!.value = easeOutCubic((t - 0.15) / 1.2)
    }
    const markerOpacity = clamp01((t - 0.9) / 0.5)
    for (const marker of this.markers) {
      marker.uniforms.uOpacity!.value = marker.spec.opacity * markerOpacity * (0.85 + glow * 0.15)
      marker.uniforms.uLevel!.value = drive
    }
    this.updateTracker(dt)

    // ---- labels ---------------------------------------------------------------------
    this.updateLabels(dt, frame, t)

    // ---- particles ------------------------------------------------------------------
    this.dustUniforms.uSpeed!.value = mood.dust * this.config.rotationSpeed + drive * 1.5
    this.dustUniforms.uLevel!.value = drive
    this.dustUniforms.uPointerAmt!.value = this.pointerInfluence
    this.dustUniforms.uOpacity!.value = 0.85 * intro
    if (this.bokeh) {
      this.bokehUniforms.uLevel!.value = drive
      this.bokehUniforms.uOpacity!.value = intro
    }
    this.updateSparks(dt)

    this.backdropUniforms.uLevel!.value = drive
    this.backdropUniforms.uResolution!.value.copy(this.drawingBufferSize)

    // ---- post -----------------------------------------------------------------------
    const profile = jarvisQualityProfiles[this.config.quality]
    this.bloomPass.strength = (0.38 + mood.glow * 0.3 + drive * 0.7 + this.flash * 0.6) * intensity * profile.bloomScale
    this.bloomPass.radius = 0.34 + drive * 0.12
    this.bloomPass.threshold = 0.2
    const hu = this.hologramPass.uniforms
    hu.uTime!.value = t
    hu.uAberration!.value = 0.0004 + this.aberrationKick * 0.003
    hu.uGlitch!.value = this.glitch
    hu.uGrain!.value = profile.grain ? 0.008 : 0
    hu.uVignette!.value = this.config.backdrop ? 0.35 : 0
    // Hologram flicker: almost always steady, with rare brief dips.
    const flickerDip = Math.sin(t * 0.73) > 0.995 ? 0.9 : 1
    hu.uFlicker!.value = (0.988 + 0.012 * Math.sin(t * 47)) * flickerDip
  }

  private updateTilt(dt: number): void {
    // Released: keeps the flick's momentum, then a soft spring brings it home with a little
    // overshoot. Slow enough that the 3D stays on screen long enough to look at.
    if (!this.drag.active) {
      const stiffness = 7
      const damping = 3.6
      this.dragVelocity.x += (-stiffness * this.dragOffset.x - damping * this.dragVelocity.x) * dt
      this.dragVelocity.y += (-stiffness * this.dragOffset.y - damping * this.dragVelocity.y) * dt
      this.dragOffset.addScaledVector(this.dragVelocity, dt)
      this.dragOffset.x = THREE.MathUtils.clamp(this.dragOffset.x, -1.5, 1.5)
      this.dragOffset.y = THREE.MathUtils.clamp(this.dragOffset.y, -1.1, 1.1)
    }

    const parallax = this.config.parallax
    const pointerWeight = clamp01(1 - (this.elapsed - this.pointerSeenAt - 4) / 2)
    const t = this.elapsed
    const idleX = Math.sin(t * 0.31) * 0.035
    const idleY = Math.cos(t * 0.27) * 0.025
    const targetYaw = (this.pointer.x * 0.36 * pointerWeight + idleX) * parallax + this.dragOffset.x
    const targetPitch = (-this.pointer.y * 0.26 * pointerWeight + idleY) * parallax + this.dragOffset.y
    this.tiltCurrent.x = damp(this.tiltCurrent.x, targetYaw, this.drag.active ? 16 : 5, dt)
    this.tiltCurrent.y = damp(this.tiltCurrent.y, targetPitch, this.drag.active ? 16 : 5, dt)
    this.tilt.rotation.set(this.tiltCurrent.y, this.tiltCurrent.x, 0)
  }

  /**
   * Project the pointer onto the HUD plane (through the current tilt) so the particle vortex
   * and the reactor lift land exactly under the cursor, whatever the orientation.
   */
  private updatePointerLocal(dt: number): void {
    const recent = this.elapsed - this.pointerSeenAt < 2.5
    this.pointerInfluence = damp(this.pointerInfluence, recent ? 1 : 0, recent ? 4 : 1.5, dt)
    if (!recent) return
    this.hud.updateWorldMatrix(true, false)
    this.raycaster.setFromCamera(this.pointer, this.camera)
    const normal = this.scratch3.set(0, 0, 1).transformDirection(this.hud.matrixWorld)
    const origin = new THREE.Vector3().setFromMatrixPosition(this.hud.matrixWorld)
    this.hudPlane.setFromNormalAndCoplanarPoint(normal, origin)
    const hit = this.raycaster.ray.intersectPlane(this.hudPlane, origin)
    if (!hit) return
    hit.applyMatrix4(this.scratchMatrix.copy(this.hud.matrixWorld).invert())
    this.pointerLocal.set(hit.x, hit.y)
  }

  /** A caret on the outer ring that follows the pointer's bearing. */
  private updateTracker(dt: number): void {
    const active = this.elapsed - this.pointerSeenAt < 2.5 && this.pointer.lengthSq() > 0.0004 ? 1 : 0
    const uniforms = this.tracker.uniforms
    uniforms.uOpacity!.value = damp(uniforms.uOpacity!.value as number, active * 0.95, 5, dt)
    const aspect = this.camera.aspect || 1
    const bearing = Math.atan2(this.pointer.y, this.pointer.x * aspect)
    const mesh = this.tracker.mesh
    const current = Math.atan2(mesh.position.y, mesh.position.x)
    let delta = bearing - current
    delta = Math.atan2(Math.sin(delta), Math.cos(delta))
    const angle = current + delta * (1 - Math.exp(-8 * dt))
    mesh.position.set(Math.cos(angle) * 1.43, Math.sin(angle) * 1.43, 0.12)
    mesh.rotation.z = angle - Math.PI / 2
  }

  private updateLabels(dt: number, frame: JarvisAudioFrame, t: number): void {
    if (!this.config.labels) return
    const titleReveal = clamp01((t - 0.9) / 0.9)
    const state = this.stateText.read(t)
    this.titleLabel.update(`${this.config.title}|${state}|${titleReveal.toFixed(2)}|${this.titleLabel.align}`, (context, width, height) => {
      drawTitleBlock(context, width, height, this.titleLabel.align, {
        title: this.config.title,
        state,
        subtitle: 'VOICE INTERFACE  ·  ONLINE',
        reveal: titleReveal,
      })
    })

    const titleOpacity = clamp01((t - 0.85) / 0.3)
    this.titleLabel.material.uniforms.uOpacity!.value = titleOpacity
    this.telemetryLabel.material.uniforms.uOpacity!.value = clamp01((t - 1.2) / 0.4)

    // Telemetry at ~12 Hz: a readout that changes every frame is unreadable.
    this.telemetryClock += dt
    if (this.telemetryClock < 1 / 12) return
    this.telemetryClock = 0
    const perBar = SPECTRUM_BANDS / TELEMETRY_BARS
    for (let bar = 0; bar < TELEMETRY_BARS; bar++) {
      let max = 0
      for (let band = Math.floor(bar * perBar); band < Math.floor((bar + 1) * perBar); band++) {
        max = Math.max(max, frame.spectrum[band] ?? 0)
      }
      this.telemetryBars[bar] = max
    }
    const content: TelemetryContent = {
      db: frame.db,
      hz: frame.peakHz,
      uptimeSeconds: t,
      bars: this.telemetryBars,
      active: frame.active,
    }
    this.telemetryLabel.update(`${telemetryKey(content)}|${this.telemetryLabel.align}`, (context, width, height) => {
      drawTelemetryBlock(context, width, height, this.telemetryLabel.align, content)
    })
  }

  private spawnShockwave(strength: number): void {
    let slot = this.waves[0]!
    for (const wave of this.waves) {
      if (wave.strength < slot.strength) slot = wave
    }
    slot.radius = 0.8
    slot.strength = Math.min(1.2, strength)
    slot.width = 0.012
    slot.speed = 1.4 + strength * 1.1
  }

  private updateWaves(dt: number): void {
    const uniforms = this.fxUniforms.uWaves!.value as THREE.Vector4[]
    this.waves.forEach((wave, index) => {
      if (wave.strength > 0.001) {
        wave.radius += wave.speed * dt
        wave.speed *= Math.exp(-dt * 0.6)
        wave.width += dt * 0.025
        wave.strength *= Math.exp(-dt * 2.2)
        if (wave.radius > 3.8) wave.strength = 0
      }
      uniforms[index]!.set(wave.radius, wave.strength, wave.width, 0)
    })
  }

  private spawnSparks(count: number, frame: JarvisAudioFrame | null): void {
    const pool = this.sparks
    if (!pool) return
    const capacity = pool.life.length
    for (let n = 0; n < count; n++) {
      // Bias emission toward the loudest bands, using the reactor's mirrored mapping.
      let fromTop = Math.random()
      if (frame) {
        const band = Math.floor(Math.random() * SPECTRUM_BANDS)
        const alt = Math.floor(Math.random() * SPECTRUM_BANDS)
        fromTop = ((frame.spectrum[band] ?? 0) >= (frame.spectrum[alt] ?? 0) ? band : alt) / SPECTRUM_BANDS
      }
      const side = Math.random() < 0.5 ? -1 : 1
      const angle = Math.PI / 2 + side * fromTop * Math.PI
      const radius = 0.9 + (Math.random() - 0.5) * 0.12
      const i = pool.cursor
      pool.cursor = (pool.cursor + 1) % capacity
      pool.positions[i * 3] = Math.cos(angle) * radius
      pool.positions[i * 3 + 1] = Math.sin(angle) * radius
      pool.positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08
      const speed = 0.5 + Math.random() * 1.3
      const tangent = (Math.random() - 0.5) * 0.6
      pool.velocities[i * 3] = Math.cos(angle) * speed - Math.sin(angle) * tangent
      pool.velocities[i * 3 + 1] = Math.sin(angle) * speed + Math.cos(angle) * tangent
      pool.velocities[i * 3 + 2] = (Math.random() - 0.3) * 0.4
      pool.life[i] = 1
      pool.decay[i] = 0.8 + Math.random() * 1.2
    }
  }

  private updateSparks(dt: number): void {
    const pool = this.sparks
    if (!pool) return
    const drag = Math.exp(-dt * 1.6)
    let alive = false
    for (let i = 0; i < pool.life.length; i++) {
      if (pool.life[i]! <= 0) continue
      alive = true
      pool.life[i] = Math.max(0, pool.life[i]! - dt * pool.decay[i]!)
      for (let axis = 0; axis < 3; axis++) {
        const k = i * 3 + axis
        pool.positions[k] = pool.positions[k]! + pool.velocities[k]! * dt
        pool.velocities[k] = pool.velocities[k]! * drag
      }
    }
    if (alive) {
      pool.points.geometry.getAttribute('position').needsUpdate = true
      pool.points.geometry.getAttribute('aLife').needsUpdate = true
    }
  }

  private syncComposerSize(): void {
    const size = this.renderer.getDrawingBufferSize(this.scratch)
    if (size.equals(this.drawingBufferSize)) return
    this.drawingBufferSize.copy(size)
    const css = this.renderer.getSize(this.scratch)
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(css.x, css.y)
    ;(this.hologramPass.uniforms.uResolution!.value as THREE.Vector2).copy(this.drawingBufferSize)
    const pixelRatio = this.renderer.getPixelRatio()
    this.dustUniforms.uPixelRatio!.value = pixelRatio
    this.sparkUniforms.uPixelRatio!.value = pixelRatio
    this.globeUniforms.uPixelRatio!.value = pixelRatio
    if (this.bokeh) this.bokehUniforms.uPixelRatio!.value = pixelRatio
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  public setState(state: KwamiState): void {
    if (state === this.state) return
    this.state = state
    this.stateText.set(STATE_TEXT[state], this.elapsed)
    this.glitch = Math.max(this.glitch, 0.5)
    this.aberrationKick = Math.max(this.aberrationKick, 0.6)
    this.spawnShockwave(0.3)
    if (state !== 'speaking') this.silentSpeech = 0
  }

  public getState(): KwamiState {
    return this.state
  }

  /** Click feedback: shockwave, spark burst, flash. */
  public pulse(): void {
    this.spawnShockwave(0.75)
    this.spawnSparks(26, this.lastFrame)
    this.glitch = Math.max(this.glitch, 0.35)
    this.aberrationKick = 1
    this.flash = 1
  }

  /** Alias used by the app's interaction actions. */
  public triggerPulse(): void {
    this.pulse()
  }

  /**
   * Push band levels from outside (e.g. a music player that does its own analysis). Used only
   * while the shared analyser is silent.
   */
  public setAudioLevels(bass: number, mid: number, high: number): void {
    this.externalLevel = clamp01(bass * 0.4 + mid * 0.45 + high * 0.15)
    this.externalLevelAt = this.elapsed
  }

  public onResize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return
    this.computeFit(true)
    this.syncComposerSize()
  }

  public setPalettePreset(preset: JarvisPalettePreset): void {
    this.config.palettePreset = preset
    this.config.color = getJarvisPalette(preset)
    this.applyColors()
  }

  public setColors(colors: Partial<JarvisColorConfig>): void {
    this.config.color = { ...this.config.color, ...colors }
    this.applyColors()
  }

  public setIntensity(value: number): void {
    this.config.intensity = Math.max(0, value)
  }

  public setReactivity(value: number): void {
    this.config.reactivity = Math.max(0, value)
  }

  public setRotationSpeed(value: number): void {
    this.config.rotationSpeed = Math.max(0, value)
  }

  public setParallax(value: number): void {
    this.config.parallax = Math.max(0, value)
  }

  public setQuality(quality: JarvisQuality): void {
    if (quality === this.config.quality) return
    this.config.quality = quality
    this.createParticles()
    this.renderer.setPixelRatio(this.renderScale())
    const samples = this.msaaSamples()
    for (const target of [this.composer.renderTarget1, this.composer.renderTarget2]) {
      target.samples = samples
      target.dispose()
    }
    this.syncComposerSize()
  }

  /**
   * Internal render scale. A 1x display gets supersampled (hairlines are what aliasing
   * destroys first); a HiDPI display is already sharp and keeps its own ratio, capped at 2.
   */
  private renderScale(): number {
    const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
    if (this.config.quality === 'high') return Math.min(2, Math.max(device, 1.5))
    if (this.config.quality === 'medium') return Math.min(2, Math.max(device, 1.25))
    return Math.min(device, 1.5)
  }

  private msaaSamples(): number {
    return this.config.quality === 'low' ? 0 : 4
  }

  public setBackdrop(enabled: boolean): void {
    this.config.backdrop = enabled
    this.backdropMesh.visible = enabled
  }

  public setLabels(enabled: boolean): void {
    this.config.labels = enabled
    this.titleLabel.mesh.visible = enabled
    this.telemetryLabel.mesh.visible = enabled
    this.computeFit(true)
  }

  public setTitle(title: string): void {
    this.config.title = title.trim().toUpperCase().slice(0, 24) || 'J.A.R.V.I.S.'
  }

  public setScale(scale: number): void {
    this.config.scale = THREE.MathUtils.clamp(scale, 0.3, 2.5)
  }

  public getScale(): number {
    return this.config.scale
  }

  public getConfig(): JarvisConfig {
    return { ...this.config, color: { ...this.config.color } }
  }

  /** Root object, for hit-testing or attaching extra content. */
  public getMesh(): THREE.Object3D {
    return this.root
  }

  private applyColors(): void {
    const c = this.config.color
    this.colors.primary.value.set(c.primary)
    this.colors.secondary.value.set(c.secondary)
    this.colors.accent.value.set(c.accent)
    this.colors.alert.value.set(c.alert)
    this.colors.background.value.set(c.background)
    this.colors.backgroundGlow.value.set(c.backgroundGlow)
  }

  // =====================================================
  // CLEANUP
  // =====================================================

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopAnimation()
    for (const remove of this.removeListeners) remove()
    this.removeListeners.length = 0

    this.renderer.toneMapping = this.previousToneMapping
    this.renderer.toneMappingExposure = this.previousToneMappingExposure
    this.renderer.setPixelRatio(this.previousPixelRatio)
    this.camera.fov = this.previousCamera.fov
    this.camera.position.copy(this.previousCamera.position)
    this.camera.quaternion.copy(this.previousCamera.quaternion)
    this.camera.updateProjectionMatrix()

    this.scene.remove(this.root)
    this.titleLabel.dispose()
    this.telemetryLabel.dispose()
    const materials = new Set<THREE.Material>()
    this.root.traverse((object) => {
      const mesh = object as THREE.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material
      if (Array.isArray(material)) material.forEach((m) => materials.add(m))
      else if (material) materials.add(material)
    })
    materials.forEach((material) => material.dispose())
    this.spectrumTexture.dispose()

    // EffectComposer.dispose() does not release passes added with addPass().
    this.composer.dispose()
    this.renderPass.dispose()
    this.bloomPass.dispose()
    this.hologramPass.dispose()
    this.outputPass.dispose()
  }
}
