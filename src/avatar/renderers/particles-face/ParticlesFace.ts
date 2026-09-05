import * as THREE from 'three'
import type { KwamiState } from '../../../types/index.js'
import type { KwamiAudio } from '../../audio/index.js'
import type {
  ParticlesFaceOptions,
  ParticlesFaceConfig,
  FaceRegion,
  ParticlesFaceAudioEffects,
} from './types.js'
import { defaultParticlesFaceConfig, defaultAudioEffects } from './config.js'
import { generateFaceGeometry, getRegionByName } from './face-geometry.js'

const vertexShader = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 customColor;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vAlpha = alpha;
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (80.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float softEdge = 1.0 - smoothstep(0.15, 0.5, dist);
    float glow = exp(-dist * dist * 10.0);
    float finalAlpha = vAlpha * mix(softEdge, glow, 0.5);

    gl_FragColor = vec4(vColor, finalAlpha);
  }
`

export class ParticlesFace {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private audio: KwamiAudio

  private points!: THREE.Points
  private geometry!: THREE.BufferGeometry
  private material!: THREE.ShaderMaterial
  private group: THREE.Group

  private config: Required<ParticlesFaceConfig>
  private regions: FaceRegion[] = []
  private totalCount = 0

  private positionsAttr!: THREE.BufferAttribute
  private sizesAttr!: THREE.BufferAttribute
  private alphasAttr!: THREE.BufferAttribute
  private colorsAttr!: THREE.BufferAttribute
  private basePositions!: Float32Array
  private baseSizes!: Float32Array
  private baseAlphas!: Float32Array

  private currentState: KwamiState = 'idle'
  private clock = new THREE.Clock()
  private disposed = false
  private animationFrameId: number | null = null

  private audioEffects: ParticlesFaceAudioEffects
  private smoothedAudio = 0
  private smoothedBass = 0
  private smoothedMid = 0
  private smoothedHigh = 0

  private listeningBlend = 0
  private thinkingBlend = 0
  private speakingBlend = 0
  private targetListening = 0
  private targetThinking = 0
  private targetSpeaking = 0

  private mouthOpenAmount = 0
  private targetMouthOpen = 0

  constructor(options: ParticlesFaceOptions) {
    this.scene = options.scene
    this.camera = options.camera
    this.renderer = options.renderer
    this.audio = options.audio

    this.config = { ...defaultParticlesFaceConfig, ...options }
    this.audioEffects = { ...defaultAudioEffects }

    this.group = new THREE.Group()

    this.buildGeometry()
    this.createMaterial()
    this.createPoints()

    this.scene.add(this.group)
    this.startAnimation()
  }

  private buildGeometry(): void {
    const { positions, regions, totalCount } = generateFaceGeometry(
      this.config.particleCount,
      this.config.faceScale,
      this.config.depthSpread,
      this.config.ambientParticles,
      this.config.ambientRadius,
    )

    this.regions = regions
    this.totalCount = totalCount
    this.geometry = new THREE.BufferGeometry()
    this.basePositions = new Float32Array(positions)

    const live = new Float32Array(positions)
    const sizes = new Float32Array(totalCount)
    const alphas = new Float32Array(totalCount)
    const colors = new Float32Array(totalCount * 3)

    const mainColor = new THREE.Color(this.config.color)
    const secColor = new THREE.Color(this.config.secondaryColor)
    const ambientSet = new Set(getRegionByName(regions, 'ambient')?.indices ?? [])

    let minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < totalCount; i++) {
      if (ambientSet.has(i)) continue
      const z = live[i * 3 + 2]
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    const zRange = maxZ - minZ || 1

    for (let i = 0; i < totalCount; i++) {
      const isAmb = ambientSet.has(i)
      sizes[i] = isAmb
        ? this.config.particleSize * (0.15 + Math.random() * 0.25)
        : this.config.particleSize * (0.7 + Math.random() * 0.5)
      alphas[i] = isAmb
        ? this.config.opacity * (0.04 + Math.random() * 0.1)
        : this.config.opacity * (0.55 + Math.random() * 0.45)

      const z = live[i * 3 + 2]
      const depthBlend = isAmb ? (0.5 + Math.random() * 0.5) : 1 - Math.max(0, Math.min(1, (z - minZ) / zRange))
      const c = mainColor.clone().lerp(secColor, depthBlend * 0.8)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    this.baseSizes = new Float32Array(sizes)
    this.baseAlphas = new Float32Array(alphas)

    this.positionsAttr = new THREE.BufferAttribute(live, 3)
    this.sizesAttr = new THREE.BufferAttribute(sizes, 1)
    this.alphasAttr = new THREE.BufferAttribute(alphas, 1)
    this.colorsAttr = new THREE.BufferAttribute(colors, 3)

    this.geometry.setAttribute('position', this.positionsAttr)
    this.geometry.setAttribute('size', this.sizesAttr)
    this.geometry.setAttribute('alpha', this.alphasAttr)
    this.geometry.setAttribute('customColor', this.colorsAttr)
  }

  private createMaterial(): void {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }

  private createPoints(): void {
    this.points = new THREE.Points(this.geometry, this.material)
    this.group.add(this.points)
  }

  // ===========================================================================
  // ANIMATION
  // ===========================================================================

  private startAnimation(): void {
    const animate = () => {
      if (this.disposed) return
      this.update()
      this.animationFrameId = requestAnimationFrame(animate)
    }
    animate()
  }

  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private update(): void {
    if (this.disposed) return

    const elapsed = this.clock.getElapsedTime()
    const dt = Math.min(this.clock.getDelta(), 0.05)

    this.updateAudioAnalysis()
    this.updateBlends(dt)
    this.updateMouth(dt, elapsed)
    this.animateParticles(elapsed)

    this.positionsAttr.needsUpdate = true
    this.sizesAttr.needsUpdate = true
    this.alphasAttr.needsUpdate = true

    this.renderer.render(this.scene, this.camera)
  }

  private updateAudioAnalysis(): void {
    const analyser = this.audio.getAnalyser()
    if (!analyser) return
    const freqData = this.audio.getFrequencyData()
    if (!freqData || freqData.length === 0) return

    const len = freqData.length
    const bEnd = Math.floor(len * 0.1)
    const mEnd = Math.floor(len * 0.4)

    let bass = 0, mid = 0, high = 0
    for (let i = 0; i < bEnd; i++) bass += freqData[i]
    for (let i = bEnd; i < mEnd; i++) mid += freqData[i]
    for (let i = mEnd; i < len; i++) high += freqData[i]

    bass = (bass / bEnd) / 255
    mid = (mid / (mEnd - bEnd)) / 255
    high = (high / (len - mEnd)) / 255

    const s = this.audioEffects.smoothing
    this.smoothedBass = this.smoothedBass * s + bass * (1 - s)
    this.smoothedMid = this.smoothedMid * s + mid * (1 - s)
    this.smoothedHigh = this.smoothedHigh * s + high * (1 - s)
    this.smoothedAudio = this.smoothedBass * 0.5 + this.smoothedMid * 0.35 + this.smoothedHigh * 0.15
  }

  private updateBlends(dt: number): void {
    const speed = 5.0
    this.listeningBlend += (this.targetListening - this.listeningBlend) * speed * dt
    this.thinkingBlend += (this.targetThinking - this.thinkingBlend) * speed * dt
    this.speakingBlend += (this.targetSpeaking - this.speakingBlend) * speed * dt
  }

  private updateMouth(dt: number, elapsed: number): void {
    if (this.currentState === 'speaking') {
      const speechPulse =
        0.06
        + (Math.sin(elapsed * 16) * 0.5 + 0.5) * 0.08
        + (Math.sin(elapsed * 23 + 1.3) * 0.5 + 0.5) * 0.04
      const audioDriven = this.smoothedAudio * this.audioEffects.reactivity
      const speechEnergy = Math.max(audioDriven, speechPulse)
      this.targetMouthOpen = speechEnergy * this.config.mouthAmplitude * this.audioEffects.mouthScale
    } else {
      this.targetMouthOpen = 0
    }
    this.mouthOpenAmount += (this.targetMouthOpen - this.mouthOpenAmount) * 10.0 * dt
  }

  private animateParticles(elapsed: number): void {
    const pos = this.positionsAttr.array as Float32Array
    const sizes = this.sizesAttr.array as Float32Array
    const alphas = this.alphasAttr.array as Float32Array
    const base = this.basePositions
    const fs = this.config.faceScale

    sizes.set(this.baseSizes)
    alphas.set(this.baseAlphas)

    const breath = Math.sin(elapsed * this.config.breathingSpeed) * this.config.breathingAmplitude
    const drift = elapsed * this.config.driftSpeed

    for (const region of this.regions) {
      const name = region.name
      const isAmbient = name === 'ambient'
      const isMouth = name === 'mouth' || name === 'mouthInner'
      const isChin = name === 'chin'
      const isEye = name === 'leftEye' || name === 'rightEye'
      const isBrow = name === 'leftEyebrow' || name === 'rightEyebrow'
      const isCheek = name === 'cheeks'

      for (let r = 0; r < region.indices.length; r++) {
        const i = region.indices[r]
        const i3 = i * 3
        const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2]
        let dx = 0, dy = 0, dz = 0

        // --- BREATHING (always) ---
        dx += bx * breath
        dy += by * breath
        dz += bz * breath * 0.5

        // --- DRIFT (always, subtle organic float) ---
        const seed = i * 1.618
        dx += Math.sin(drift + seed) * this.config.driftAmplitude * fs
        dy += Math.cos(drift * 0.7 + seed * 0.5) * this.config.driftAmplitude * fs
        dz += Math.sin(drift * 0.5 + seed * 1.3) * this.config.driftAmplitude * fs * 0.3

        // --- SPEAKING ---
        if (isMouth && this.speakingBlend > 0.01) {
          // Y center of mouth is approx -0.45 * faceScale
          const mouthMid = -0.45 * fs
          const dir = by < mouthMid ? -1 : 1
          const open = this.mouthOpenAmount * fs
          dy += dir * open * (name === 'mouthInner' ? 1.5 : 0.8)

          // Jitter
          const jitter = this.smoothedHigh * 0.02 * fs * this.speakingBlend * this.audioEffects.reactivity
          dx += Math.sin(elapsed * 18 + i) * jitter
          dy += Math.cos(elapsed * 22 + i * 0.7) * jitter
        }

        if (isChin && this.speakingBlend > 0.01) {
          dy -= this.mouthOpenAmount * 0.4 * fs
        }

        if (isCheek && this.speakingBlend > 0.01) {
          dx += Math.sign(bx) * this.smoothedBass * 0.025 * fs * this.speakingBlend * this.audioEffects.reactivity
        }

        if (isEye && this.speakingBlend > 0.01) {
          dy -= this.smoothedAudio * 0.008 * fs * this.speakingBlend * this.audioEffects.reactivity
        }

        // --- LISTENING ---
        if (isBrow && this.listeningBlend > 0.01) {
          dy += this.listeningBlend * 0.03 * fs
          dy += this.smoothedMid * 0.015 * fs * this.listeningBlend
        }

        if (this.listeningBlend > 0.01 && !isAmbient) {
          const pulse = Math.sin(elapsed * 3 + i * 0.08) * this.config.listeningPulse * this.listeningBlend
          dz += pulse * 0.01 * fs
        }

        // --- THINKING ---
        if (this.thinkingBlend > 0.01 && !isAmbient) {
          const wave = Math.sin(elapsed * this.config.thinkingSpeed + (bx + by) / fs * 3.0)
          dz += wave * 0.012 * fs * this.thinkingBlend
        }

        // --- AMBIENT ---
        if (isAmbient) {
          const audio = this.smoothedAudio * this.audioEffects.ambientScale * this.speakingBlend * this.audioEffects.reactivity
          const scatter = audio * 0.4 * fs
          dx += Math.sin(elapsed * 1.5 + i * 0.3) * scatter
          dy += Math.cos(elapsed * 1.2 + i * 0.7) * scatter
          alphas[i] = Math.min(1, 0.05 + audio * 0.4)
        }

        pos[i3] = bx + dx
        pos[i3 + 1] = by + dy
        pos[i3 + 2] = bz + dz

        // Size pulse on mouth when speaking
        if (isMouth && this.speakingBlend > 0.01) {
          const baseSz = this.config.particleSize * (0.7 + (i % 4) * 0.08)
          sizes[i] = baseSz * (1 + this.smoothedAudio * 0.6 * this.speakingBlend)
        }
      }
    }
  }

  // ===========================================================================
  // STATE
  // ===========================================================================

  public setState(state: KwamiState): void {
    this.currentState = state
    this.targetListening = state === 'listening' ? 1 : 0
    this.targetThinking = state === 'thinking' ? 1 : 0
    this.targetSpeaking = state === 'speaking' ? 1 : 0
  }

  // ===========================================================================
  // SETTERS (all config properties)
  // ===========================================================================

  public setColor(color: string): void {
    this.config.color = color
    this.rebuildColors()
  }

  public setSecondaryColor(color: string): void {
    this.config.secondaryColor = color
    this.rebuildColors()
  }

  public setParticleSize(size: number): void {
    this.config.particleSize = Math.max(0.02, size)
    const s = this.sizesAttr.array as Float32Array
    const ambSet = new Set(getRegionByName(this.regions, 'ambient')?.indices ?? [])
    for (let i = 0; i < this.totalCount; i++) {
      s[i] = ambSet.has(i)
        ? this.config.particleSize * (0.15 + Math.random() * 0.25)
        : this.config.particleSize * (0.7 + Math.random() * 0.5)
    }
    this.baseSizes = new Float32Array(s)
    this.sizesAttr.needsUpdate = true
  }

  public setOpacity(opacity: number): void {
    this.config.opacity = opacity
    const a = this.alphasAttr.array as Float32Array
    const ambSet = new Set(getRegionByName(this.regions, 'ambient')?.indices ?? [])
    for (let i = 0; i < this.totalCount; i++) {
      a[i] = ambSet.has(i)
        ? opacity * (0.04 + Math.random() * 0.1)
        : opacity * (0.55 + Math.random() * 0.45)
    }
    this.baseAlphas = new Float32Array(a)
    this.alphasAttr.needsUpdate = true
  }

  public setFaceScale(scale: number): void {
    this.config.faceScale = scale
    this.rebuild()
  }

  public setDepthSpread(v: number): void {
    this.config.depthSpread = v
    this.rebuild()
  }

  public setMouthAmplitude(v: number): void { this.config.mouthAmplitude = v }
  public setBreathingSpeed(v: number): void { this.config.breathingSpeed = v }
  public setBreathingAmplitude(v: number): void { this.config.breathingAmplitude = v }
  public setDriftSpeed(v: number): void { this.config.driftSpeed = v }
  public setDriftAmplitude(v: number): void { this.config.driftAmplitude = v }
  public setListeningPulse(v: number): void { this.config.listeningPulse = v }
  public setThinkingSpeed(v: number): void { this.config.thinkingSpeed = v }

  public setSpeakingReactivity(reactivity: number): void {
    this.config.speakingReactivity = reactivity
    this.audioEffects.reactivity = reactivity
  }

  public setScale(scale: number): void {
    this.group.scale.setScalar(scale)
  }

  public getScale(): number {
    return this.group.scale.x
  }

  public setAudioLevels(bass: number, mid: number, high: number): void {
    const s = this.audioEffects.smoothing
    this.smoothedBass = this.smoothedBass * s + bass * (1 - s)
    this.smoothedMid = this.smoothedMid * s + mid * (1 - s)
    this.smoothedHigh = this.smoothedHigh * s + high * (1 - s)
    this.smoothedAudio = this.smoothedBass * 0.5 + this.smoothedMid * 0.35 + this.smoothedHigh * 0.15
  }

  public setAmbientParticles(count: number): void {
    this.config.ambientParticles = count
    this.rebuild()
  }

  public setAmbientRadius(r: number): void {
    this.config.ambientRadius = r
    this.rebuild()
  }

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  public getConfig(): Required<ParticlesFaceConfig> { return { ...this.config } }
  public getGroup(): THREE.Group { return this.group }
  public getMesh(): THREE.Points { return this.points }

  // ===========================================================================
  // REBUILD
  // ===========================================================================

  private rebuildColors(): void {
    const colors = this.colorsAttr.array as Float32Array
    const main = new THREE.Color(this.config.color)
    const sec = new THREE.Color(this.config.secondaryColor)
    const ambSet = new Set(getRegionByName(this.regions, 'ambient')?.indices ?? [])
    const live = this.positionsAttr.array as Float32Array

    let minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < this.totalCount; i++) {
      if (ambSet.has(i)) continue
      const z = live[i * 3 + 2]
      if (z < minZ) minZ = z
      if (z > maxZ) maxZ = z
    }
    const zRange = maxZ - minZ || 1

    for (let i = 0; i < this.totalCount; i++) {
      const isAmb = ambSet.has(i)
      const z = live[i * 3 + 2]
      const blend = isAmb ? (0.5 + Math.random() * 0.5) : (1 - Math.max(0, Math.min(1, (z - minZ) / zRange))) * 0.8
      const c = main.clone().lerp(sec, blend)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    this.colorsAttr.needsUpdate = true
  }

  private rebuild(): void {
    this.group.remove(this.points)
    this.geometry.dispose()
    this.buildGeometry()
    this.createPoints()
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopAnimation()
    this.geometry.dispose()
    this.material.dispose()
    this.group.remove(this.points)
    this.scene.remove(this.group)
  }
}
