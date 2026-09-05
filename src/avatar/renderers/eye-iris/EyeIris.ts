import * as THREE from 'three'
import type { KwamiState } from '../../../types/index.js'
import {
  getDefaultEyeIrisConfig,
  getEyeIrisPalette,
} from './config.js'
import type {
  EyeIrisColorConfig,
  EyeIrisConfig,
  EyeIrisOptions,
  EyeIrisPalettePreset,
  EyeIrisUniforms,
} from './types.js'

export class EyeIris {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private group: THREE.Group
  private irisMesh!: THREE.Mesh
  private irisMaterial!: THREE.ShaderMaterial
  private config: EyeIrisConfig
  private uniforms!: EyeIrisUniforms
  private clock = new THREE.Clock()
  private animationFrameId: number | null = null
  private disposed = false
  private audioLevel = 0
  private audio?: { getFrequencyData: () => Uint8Array }
  private currentState: KwamiState = 'idle'
  private followTarget = new THREE.Vector2(0, 0)
  private followCurrent = new THREE.Vector2(0, 0)
  private removePointerMoveHandler: (() => void) | null = null
  private lastPointerClientX: number | null = null
  private lastPointerClientY: number | null = null
  /** Smoothed 0–1 from recent pointer speed; drives pupil dilation. */
  private pointerMotionEnergy = 0

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    options: EyeIrisOptions = {},
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer

    const defaults = getDefaultEyeIrisConfig()
    this.config = {
      palettePreset: options.palettePreset ?? defaults.palettePreset,
      geometry: { ...defaults.geometry, ...options.geometry },
      detail: { ...defaults.detail, ...options.detail },
      color: { ...defaults.color, ...options.color },
      animation: { ...defaults.animation, ...options.animation },
      audioEffects: { ...defaults.audioEffects, ...options.audioEffects },
      follow: { ...defaults.follow, ...options.follow },
      scale: options.scale ?? defaults.scale,
    }
    if (options.palettePreset) {
      this.config.color = { ...getEyeIrisPalette(options.palettePreset), ...this.config.color }
    }
    this.audio = options.audio

    this.group = new THREE.Group()
    this.group.scale.setScalar(this.config.scale)
    this.scene.add(this.group)

    this.createIris()
    this.setupPointerFollow()
    this.startAnimation()
  }

  private setupPointerFollow(): void {
    const dom = this.renderer.domElement
    const onPointerMove = (event: PointerEvent) => {
      const rect = dom.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const x = ((event.clientX - rect.left) / rect.width) * 2.0 - 1.0
      const y = ((event.clientY - rect.top) / rect.height) * 2.0 - 1.0
      const range = 0.35 * this.config.follow.sensitivity
      this.followTarget.set(
        THREE.MathUtils.clamp(x * range, -0.5, 0.5),
        THREE.MathUtils.clamp(y * range, -0.5, 0.5),
      )

      if (this.config.follow.pupilMotion) {
        if (this.lastPointerClientX !== null && this.lastPointerClientY !== null) {
          const dx = event.clientX - this.lastPointerClientX
          const dy = event.clientY - this.lastPointerClientY
          const speed = Math.hypot(dx, dy)
          this.pointerMotionEnergy = Math.min(1, this.pointerMotionEnergy + speed * 0.0075)
        }
        this.lastPointerClientX = event.clientX
        this.lastPointerClientY = event.clientY
      }
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    this.removePointerMoveHandler = () => window.removeEventListener('pointermove', onPointerMove)
  }

  private createIris(): void {
    // Use a simple quad and discard outside iris radius.
    // This avoids triangle-fan seam artifacts from CircleGeometry.
    const geometry = new THREE.PlaneGeometry(2, 2, 1, 1)
    this.uniforms = {
      uTime: new THREE.Uniform(0),
      uIrisRadius: new THREE.Uniform(this.config.geometry.irisRadius),
      uPupilRadius: new THREE.Uniform(this.config.geometry.pupilRadius),
      uLimbalRingWidth: new THREE.Uniform(this.config.geometry.limbalRingWidth),
      uFiberDensity: new THREE.Uniform(this.config.detail.fiberDensity),
      uFiberSharpness: new THREE.Uniform(this.config.detail.fiberSharpness),
      uRadialStreakStrength: new THREE.Uniform(this.config.detail.radialStreakStrength),
      uCollaretteStrength: new THREE.Uniform(this.config.detail.collaretteStrength),
      uLimbalIntensity: new THREE.Uniform(this.config.detail.limbalIntensity),
      uNoiseStrength: new THREE.Uniform(this.config.detail.noiseStrength),
      uCryptStrength: new THREE.Uniform(this.config.detail.cryptStrength),
      uFurrowStrength: new THREE.Uniform(this.config.detail.furrowStrength),
      uRingContrast: new THREE.Uniform(this.config.detail.ringContrast),
      uSectorMix: new THREE.Uniform(this.config.detail.sectorMix),
      uPigmentMottleStrength: new THREE.Uniform(this.config.detail.pigmentMottleStrength),
      uSpokesStrength: new THREE.Uniform(this.config.detail.spokesStrength),
      uInnerRingStrength: new THREE.Uniform(this.config.detail.innerRingStrength),
      uShimmerStrength: new THREE.Uniform(this.config.animation.shimmerStrength),
      uPatternFlow: new THREE.Uniform(this.config.animation.patternFlow),
      uPatternRotation: new THREE.Uniform(this.config.animation.patternRotation),
      uBaseColor: new THREE.Uniform(new THREE.Color(this.config.color.base)),
      uSecondaryColor: new THREE.Uniform(new THREE.Color(this.config.color.secondary)),
      uAccentColor: new THREE.Uniform(new THREE.Color(this.config.color.accent)),
      uLimbalColor: new THREE.Uniform(new THREE.Color(this.config.color.limbal)),
      uCollaretteColor: new THREE.Uniform(new THREE.Color(this.config.color.collarette)),
      uCryptColor: new THREE.Uniform(new THREE.Color(this.config.color.crypt)),
      uStreakColor: new THREE.Uniform(new THREE.Color(this.config.color.streak)),
    }

    this.irisMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms as unknown as Record<string, THREE.IUniform>,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        varying vec2 vPos;
        void main() {
          vPos = position.xy;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vPos;
        uniform float uTime;
        uniform float uIrisRadius;
        uniform float uPupilRadius;
        uniform float uLimbalRingWidth;
        uniform float uFiberDensity;
        uniform float uFiberSharpness;
        uniform float uRadialStreakStrength;
        uniform float uCollaretteStrength;
        uniform float uLimbalIntensity;
        uniform float uNoiseStrength;
        uniform float uCryptStrength;
        uniform float uFurrowStrength;
        uniform float uRingContrast;
        uniform float uSectorMix;
        uniform float uPigmentMottleStrength;
        uniform float uSpokesStrength;
        uniform float uInnerRingStrength;
        uniform float uShimmerStrength;
        uniform float uPatternFlow;
        uniform float uPatternRotation;
        uniform vec3 uBaseColor;
        uniform vec3 uSecondaryColor;
        uniform vec3 uAccentColor;
        uniform vec3 uLimbalColor;
        uniform vec3 uCollaretteColor;
        uniform vec3 uCryptColor;
        uniform vec3 uStreakColor;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p *= 2.01;
            amplitude *= 0.5;
          }
          return value;
        }

        float ringBands(float angle, float radialFlow, float harmonic, float flowMul) {
          return 0.5 + 0.5 * sin(angle * harmonic + radialFlow * flowMul);
        }

        void main() {
          vec2 p = vPos;
          float r = length(p);

          if (r > uIrisRadius) discard;

          float irisSpan = max(0.001, uIrisRadius - uPupilRadius);
          float radial = clamp((r - uPupilRadius) / irisSpan, 0.0, 1.0);
          float invRadial = 1.0 - radial;
          float pupilFeather = irisSpan * 0.08;
          float pupilMask = 1.0 - smoothstep(uPupilRadius - pupilFeather, uPupilRadius + pupilFeather, r);
          float irisMask = 1.0 - pupilMask;

          vec2 pNorm = (r > 0.00001) ? (p / r) : vec2(1.0, 0.0);
          float rot = uTime * uPatternRotation;
          float cs = cos(rot);
          float sn = sin(rot);
          vec2 angleVec = mat2(cs, -sn, sn, cs) * pNorm;
          float angle = atan(angleVec.y, angleVec.x);
          float radialFlow = radial + uTime * (0.06 + uPatternFlow * 0.18);
          vec2 tissueDrift = vec2(
            sin(uTime * 0.37 + angle * 2.3),
            cos(uTime * 0.31 - angle * 2.1)
          ) * (0.03 * (0.4 + 0.6 * uPatternFlow)) * (0.25 + 0.75 * radial);
          vec2 sampleP = p + tissueDrift;
          float noiseWarp = fbm(vec2(
            r * 8.0 + radialFlow * 4.0 + uNoiseStrength * 0.35 + sampleP.x * 2.2,
            angleVec.x * (2.7 + uNoiseStrength * 0.8) + angleVec.y * (1.9 + uNoiseStrength * 0.6)
          )) * 0.3;
          float angleWarp = angle + noiseWarp * 0.6;
          float harmonic = max(1.0, floor(uFiberDensity + 0.5));
          // Non-periodic fiber synthesis: domain-warped radial streak ridges.
          // Avoid strong sinusoidal bands that looked like "snake" lines.
          float angle01 = (angle + 3.141592653589793) / 6.283185307179586;
          float sectorCell = floor(angle01 * 34.0);
          float radialCell = floor(radial * 22.0);
          float sectorRand = hash(vec2(sectorCell, radialCell));
          float radialWarp = (fbm(vec2(
            angleVec.x * 8.0 + radialFlow * 4.0,
            angleVec.y * 8.0 - radialFlow * 3.0
          )) - 0.5) * (0.26 + 0.52 * uNoiseStrength);
          float thetaWarp = (fbm(vec2(
            angleVec.x * 14.0 + radialFlow * 7.0,
            angleVec.y * 14.0 - radialFlow * 6.0
          )) - 0.5) * 0.34;
          float streakCoord = (angleWarp + thetaWarp) * (harmonic * mix(0.72, 1.35, sectorRand));
          float radialCut = radialFlow * (38.0 + 24.0 * sectorRand) + radialWarp * 26.0;
          float fiberCarrier = fbm(vec2(
            cos(streakCoord) * 4.6 + radialCut,
            sin(streakCoord) * 4.6 + radialCut * 0.35
          ));
          float ridgedA = 1.0 - abs(2.0 * fiberCarrier - 1.0);
          float ridgedB = 1.0 - abs(2.0 * fbm(vec2(
            cos(streakCoord * 1.7) * 7.0 + radialCut * 1.3,
            sin(streakCoord * 1.7) * 7.0 - radialCut * 0.8
          )) - 1.0);
          float ridgedC = 1.0 - abs(2.0 * fbm(vec2(
            cos(streakCoord * 2.6) * 10.0 + radialCut * 1.9,
            sin(streakCoord * 2.6) * 10.0 - radialCut * 1.4
          )) - 1.0);
          float fibers = ridgedA * 0.42 + ridgedB * 0.34 + ridgedC * 0.24;
          float fiberSharp = mix(1.45, 0.25, clamp(uFiberSharpness, 0.0, 1.5) / 1.5);
          fibers = pow(clamp(fibers, 0.0, 1.0), fiberSharp);
          float fiberContinuity = smoothstep(0.22, 0.9, fbm(vec2(
            angleVec.x * 15.0 + radialFlow * 19.0,
            angleVec.y * 15.0 - radialFlow * 13.0
          )));
          float microCuts = smoothstep(0.66, 0.95, fbm(vec2(
            angleVec.x * 36.0 + radialFlow * 31.0,
            angleVec.y * 36.0 - radialFlow * 27.0
          )));
          fibers *= mix(0.58, 1.34, fiberContinuity);
          fibers *= (1.0 - microCuts * (0.22 + 0.3 * uNoiseStrength));

          // Crypts and furrows produce dark irregular tear-like details.
          float crypts = fbm(vec2(
            angleVec.x * 11.0 + radialFlow * 3.6,
            angleVec.y * 11.0 + radialFlow * 8.4
          ));
          float furrows = fbm(vec2(
            angleVec.x * 24.0 + radialFlow * 8.0,
            angleVec.y * 24.0 + radialFlow * 17.0
          ));
          float cryptMask = smoothstep(0.54, 0.84, crypts) * smoothstep(0.08, 0.86, radial);
          float furrowMask = smoothstep(0.58, 0.9, furrows) * smoothstep(0.12, 0.96, radial);

          // Collarette: broken ring surrounding pupil with high contrast.
          float collaretteCenter = uPupilRadius + irisSpan * 0.18;
          float collaretteBand = exp(-pow((r - collaretteCenter) / (irisSpan * 0.11), 2.0));
          float collaretteBreakup = fbm(vec2(
            angleVec.x * 8.0 + radialFlow * 5.4,
            angleVec.y * 8.0 + radialFlow * 13.0
          ));
          float collaretteMask = collaretteBand * (0.55 + 0.95 * collaretteBreakup);

          // Limbal ring with organic breakup.
          float limbalBase = smoothstep(uIrisRadius - uLimbalRingWidth, uIrisRadius, r);
          float limbalBreak = 0.68 + 0.5 * fbm(vec2(
            angleVec.x * 6.5 + radialFlow * 3.0,
            angleVec.y * 6.5 + radialFlow * 11.5
          ));
          float limbalMask = limbalBase * limbalBreak;

          // Radial depth variation from pupil to edge.
          float depthBands = 0.5 + 0.5 * sin(
            radialFlow * 22.0 +
            angleVec.x * 1.2 + angleVec.y * 1.0 +
            fbm(vec2(radialFlow * 10.0 + angleVec.x * 3.0, angleVec.y * 4.0 + radialFlow * 2.0)) * 2.0
          );
          float warmSpeckles = smoothstep(0.64, 0.92, fbm(vec2(
            angleVec.x * 26.0 + radialFlow * 22.0,
            angleVec.y * 26.0 + radialFlow * 38.0
          )));

          float sectorTintNoise = fbm(vec2(
            cos(angleWarp) * 2.8 + radial * 1.7 + uTime * 0.08,
            sin(angleWarp) * 2.8 - radial * 1.1 - uTime * 0.05
          ));
          float sectorTint = mix(1.0 - uSectorMix * 0.18, 1.0 + uSectorMix * 0.18, sectorTintNoise);
          float spokeNoise = fbm(vec2(
            cos(angleWarp) * (4.0 + harmonic * 0.25) + radialFlow * 6.0,
            sin(angleWarp) * (4.0 + harmonic * 0.25) - radialFlow * 5.0
          ));
          float spokeRidged = 1.0 - abs(2.0 * spokeNoise - 1.0);
          float spokeMask = smoothstep(0.44, 0.9, spokeRidged) * smoothstep(0.05, 0.96, radial);
          float pigmentMottle = fbm(vec2(
            sampleP.x * (12.0 + uNoiseStrength * 4.0) + radialFlow * 5.0,
            sampleP.y * (12.0 + uNoiseStrength * 4.0) - radialFlow * 4.0
          ));
          float pigmentMask = smoothstep(0.32, 0.82, pigmentMottle) * smoothstep(0.07, 0.99, radial);
          float innerRingCenter = uPupilRadius + irisSpan * 0.11;
          float innerRing = exp(-pow((r - innerRingCenter) / (irisSpan * 0.045), 2.0));
          float innerRingBreak = 0.62 + 0.42 * fbm(vec2(
            angleVec.x * 16.0 + radialFlow * 9.0,
            angleVec.y * 16.0 + radialFlow * 15.0
          ));
          float innerRingMask = innerRing * innerRingBreak;
          float cryptLineMap = smoothstep(0.5, 0.92, crypts) * smoothstep(0.07, 0.9, radial);
          float furrowLineMap = smoothstep(0.54, 0.95, furrows) * smoothstep(0.16, 1.0, radial);

          float shimmer = (sin(uTime * 0.82 + angleWarp * 20.0 + radialFlow * 9.0) * 0.5 + 0.5) * (0.28 + 0.72 * invRadial);
          float microPits = smoothstep(0.62, 0.92, fbm(vec2(
            angleVec.x * 46.0 + radialFlow * 74.0,
            angleVec.y * 46.0 + radialFlow * 89.0
          )));
          float poreGrain = fbm(vec2(
            angleVec.x * 82.0 + radialFlow * 31.0,
            angleVec.y * 82.0 - radialFlow * 27.0
          ));
          float poreMask = smoothstep(0.68, 0.96, poreGrain) * smoothstep(0.14, 0.96, radial);
          float sphincterStriae = smoothstep(0.0, 0.42, invRadial) * smoothstep(0.18, 1.0, fibers);
          float melaninRing = smoothstep(0.72, 1.0, radial);
          float irisShadow = smoothstep(0.0, 0.62, radial) * (0.55 + 0.45 * (0.5 + 0.5 * pNorm.y));

          vec3 color = mix(uSecondaryColor, uBaseColor, pow(radial, 0.85));
          color = mix(color, uStreakColor, fibers * uRadialStreakStrength * (0.18 + 0.46 * invRadial));
          color = mix(color, uSecondaryColor, fibers * (0.1 + 0.2 * (1.0 - sectorRand)));
          color = mix(color, uAccentColor, warmSpeckles * 0.26);
          color += (depthBands - 0.5) * (0.16 + 0.26 * uRingContrast);
          color = mix(color, uCollaretteColor, collaretteMask * uCollaretteStrength * 0.92);
          color += warmSpeckles * uNoiseStrength * 0.42 * uAccentColor;
          color = mix(color, uCryptColor, cryptMask * uCryptStrength * 0.78);
          color = mix(color, uStreakColor, spokeMask * uSpokesStrength * 0.98);
          color = mix(color, uAccentColor, pigmentMask * uPigmentMottleStrength * 0.74);
          color = mix(color, uLimbalColor, innerRingMask * uInnerRingStrength * 0.86);
          color = mix(color, uCryptColor, cryptLineMap * uCryptStrength * 0.66);
          color -= furrowLineMap * (0.05 + 0.24 * uFurrowStrength);
          color -= furrowMask * (0.07 + 0.28 * uFurrowStrength);
          color -= melaninRing * 0.18;
          color += uCollaretteColor * (0.08 + 0.3 * uCollaretteStrength) * sphincterStriae;
          color += shimmer * uShimmerStrength * 0.06;
          color -= microPits * 0.11 * (0.65 + 0.45 * uNoiseStrength);
          color -= poreMask * 0.07;
          color *= sectorTint;
          color = mix(color, uLimbalColor, limbalMask * uLimbalIntensity);
          color *= 0.88 + 0.12 * irisShadow;

          // Slight center darkening and peripheral falloff for natural depth.
          float innerShade = smoothstep(uPupilRadius, uPupilRadius + irisSpan * 0.28, r);
          float outerShade = 1.0 - smoothstep(uIrisRadius - irisSpan * 0.25, uIrisRadius, r);
          color *= 0.88 + 0.12 * innerShade;
          color *= 0.86 + 0.14 * outerShade;
          color = clamp(color, 0.0, 1.0);

          // Add a thin corneal sheen and catchlights so the iris reads less "flat".
          float cornea = sqrt(max(0.0, 1.0 - clamp((r / uIrisRadius) * (r / uIrisRadius), 0.0, 1.0)));
          vec3 normal = normalize(vec3(pNorm * sqrt(max(0.0, 1.0 - cornea * cornea)), cornea));
          vec3 lightA = normalize(vec3(-0.28, 0.42, 0.86));
          vec3 lightB = normalize(vec3(0.34, -0.22, 0.9));
          vec3 viewDir = vec3(0.0, 0.0, 1.0);
          float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.6);
          float specA = pow(max(dot(normal, lightA), 0.0), 72.0);
          float specB = pow(max(dot(normal, lightB), 0.0), 120.0) * 0.68;
          float corneaHighlight = (specA + specB) * (0.18 + 0.2 * (0.5 + 0.5 * sin(uTime * 0.32)));

          vec3 pupilColor = vec3(0.018, 0.018, 0.02);
          pupilColor += vec3(0.012, 0.01, 0.008) * (1.0 - cornea);
          vec3 mixed = mix(pupilColor, color, irisMask);
          mixed += vec3(0.82, 0.88, 0.96) * corneaHighlight * (0.3 + 0.7 * irisMask);
          mixed += vec3(0.06, 0.09, 0.14) * fresnel * (0.45 + 0.55 * irisMask);

          gl_FragColor = vec4(clamp(mixed, 0.0, 1.0), 1.0);
        }
      `,
    })

    this.irisMesh = new THREE.Mesh(geometry, this.irisMaterial)
    this.group.add(this.irisMesh)
  }

  private startAnimation(): void {
    const animate = () => {
      if (this.disposed) return
      this.update()
      this.renderer.render(this.scene, this.camera)
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

  public update(deltaTime?: number): void {
    if (this.disposed) return
    const dt = deltaTime ?? this.clock.getDelta()
    this.uniforms.uTime.value += dt * (0.5 + this.config.animation.shimmerSpeed)
    const t = this.uniforms.uTime.value
    const idleDriftX = Math.sin(t * 0.42) * 0.02 + Math.sin(t * 0.93) * 0.008
    const idleDriftY = Math.cos(t * 0.39) * 0.017 + Math.sin(t * 0.88) * 0.007
    if (this.config.follow.enabled) {
      this.followCurrent.lerp(this.followTarget, 0.11)
      this.irisMesh.rotation.y = this.followCurrent.x + idleDriftX * 0.45
      this.irisMesh.rotation.x = this.followCurrent.y + idleDriftY * 0.45
    } else {
      this.followTarget.set(idleDriftX, idleDriftY)
      this.followCurrent.lerp(this.followTarget, 0.15)
      this.irisMesh.rotation.y = this.followCurrent.x
      this.irisMesh.rotation.x = this.followCurrent.y
    }
    this.irisMesh.rotation.z = Math.sin(t * 0.31) * (0.006 + this.config.animation.patternRotation * 0.04)

    if (this.config.follow.pupilMotion) {
      this.pointerMotionEnergy *= 0.93
    } else {
      this.pointerMotionEnergy = 0
    }
    const motionBoost = this.config.follow.pupilMotion
      ? this.pointerMotionEnergy * this.config.follow.pupilMotionStrength
      : 0
    const basePupil = this.config.geometry.pupilRadius

    if (this.config.audioEffects.enabled) {
      let hasSignal = false
      if (this.audio) {
        const levels = this.getBandLevels(this.audio.getFrequencyData())
        hasSignal = levels.bass > 0.01 || levels.mid > 0.01 || levels.high > 0.01
        this.setAudioLevels(levels.bass, levels.mid, levels.high)
      }
      if (!hasSignal && this.currentState === 'speaking') {
        // Fallback "talk pulse" when no analyser stream is available.
        const t = this.uniforms.uTime.value
        const talkPulse = 0.16 + (Math.sin(t * 11.0) * 0.5 + 0.5) * 0.34
        this.audioLevel = THREE.MathUtils.lerp(this.audioLevel, talkPulse, 0.24)
      }
      const audioDrive = Math.pow(THREE.MathUtils.clamp(this.audioLevel, 0, 1), 0.72)
      const dynamicPupil =
        basePupil + audioDrive * this.config.audioEffects.pupilResponse * 0.9 + motionBoost
      this.uniforms.uPupilRadius.value = THREE.MathUtils.clamp(dynamicPupil, 0.12, 0.5)
      this.uniforms.uShimmerStrength.value = this.config.animation.shimmerStrength + audioDrive * this.config.audioEffects.shimmerResponse
    } else {
      this.uniforms.uPupilRadius.value = THREE.MathUtils.clamp(basePupil + motionBoost, 0.12, 0.5)
    }
  }

  private getBandLevels(frequencyData: Uint8Array): { bass: number; mid: number; high: number } {
    const len = frequencyData.length
    if (!len) return { bass: 0, mid: 0, high: 0 }
    const bassEnd = Math.max(1, Math.floor(len * 0.12))
    const midEnd = Math.max(bassEnd + 1, Math.floor(len * 0.45))
    let bass = 0
    let mid = 0
    let high = 0
    for (let i = 0; i < len; i++) {
      const v = (frequencyData[i] ?? 0) / 255
      if (i < bassEnd) bass += v
      else if (i < midEnd) mid += v
      else high += v
    }
    const bassCount = bassEnd
    const midCount = Math.max(1, midEnd - bassEnd)
    const highCount = Math.max(1, len - midEnd)
    return {
      bass: bass / bassCount,
      mid: mid / midCount,
      high: high / highCount,
    }
  }

  public setState(state: KwamiState): void {
    this.currentState = state
    if (state === 'listening') {
      this.setShimmerStrength(0.22)
      this.setPatternFlow(0.36)
    } else if (state === 'thinking') {
      this.setShimmerStrength(0.28)
      this.setShimmerSpeed(0.36)
      this.setPatternRotation(0.2)
      this.setPatternFlow(0.48)
    } else if (state === 'speaking') {
      this.setShimmerStrength(0.3)
      this.setPatternFlow(0.62)
    } else {
      this.setShimmerStrength(0.18)
      this.setShimmerSpeed(0.28)
      this.setPatternRotation(0.08)
      this.setPatternFlow(0.24)
    }
  }

  public setPalettePreset(preset: EyeIrisPalettePreset): void {
    this.config.palettePreset = preset
    this.setColors(getEyeIrisPalette(preset))
  }

  public setColors(colors: Partial<EyeIrisColorConfig>): void {
    this.config.color = { ...this.config.color, ...colors }
    this.uniforms.uBaseColor.value.set(this.config.color.base)
    this.uniforms.uSecondaryColor.value.set(this.config.color.secondary)
    this.uniforms.uAccentColor.value.set(this.config.color.accent)
    this.uniforms.uLimbalColor.value.set(this.config.color.limbal)
    this.uniforms.uCollaretteColor.value.set(this.config.color.collarette)
    this.uniforms.uCryptColor.value.set(this.config.color.crypt)
    this.uniforms.uStreakColor.value.set(this.config.color.streak)
  }

  public setIrisRadius(value: number): void {
    this.config.geometry.irisRadius = value
    this.uniforms.uIrisRadius.value = value
  }

  public setPupilRadius(value: number): void {
    this.config.geometry.pupilRadius = value
    this.uniforms.uPupilRadius.value = value
  }

  public setLimbalRingWidth(value: number): void {
    this.config.geometry.limbalRingWidth = value
    this.uniforms.uLimbalRingWidth.value = value
  }

  public setFiberDensity(value: number): void {
    this.config.detail.fiberDensity = value
    this.uniforms.uFiberDensity.value = value
  }

  public setFiberSharpness(value: number): void {
    this.config.detail.fiberSharpness = value
    this.uniforms.uFiberSharpness.value = value
  }

  public setRadialStreakStrength(value: number): void {
    this.config.detail.radialStreakStrength = value
    this.uniforms.uRadialStreakStrength.value = value
  }

  public setCollaretteStrength(value: number): void {
    this.config.detail.collaretteStrength = value
    this.uniforms.uCollaretteStrength.value = value
  }

  public setLimbalIntensity(value: number): void {
    this.config.detail.limbalIntensity = value
    this.uniforms.uLimbalIntensity.value = value
  }

  public setNoiseStrength(value: number): void {
    this.config.detail.noiseStrength = value
    this.uniforms.uNoiseStrength.value = value
  }

  public setCryptStrength(value: number): void {
    this.config.detail.cryptStrength = value
    this.uniforms.uCryptStrength.value = value
  }

  public setFurrowStrength(value: number): void {
    this.config.detail.furrowStrength = value
    this.uniforms.uFurrowStrength.value = value
  }

  public setRingContrast(value: number): void {
    this.config.detail.ringContrast = value
    this.uniforms.uRingContrast.value = value
  }

  public setSectorMix(value: number): void {
    this.config.detail.sectorMix = value
    this.uniforms.uSectorMix.value = value
  }

  public setPigmentMottleStrength(value: number): void {
    this.config.detail.pigmentMottleStrength = value
    this.uniforms.uPigmentMottleStrength.value = value
  }

  public setSpokesStrength(value: number): void {
    this.config.detail.spokesStrength = value
    this.uniforms.uSpokesStrength.value = value
  }

  public setInnerRingStrength(value: number): void {
    this.config.detail.innerRingStrength = value
    this.uniforms.uInnerRingStrength.value = value
  }

  public setShimmerSpeed(value: number): void {
    this.config.animation.shimmerSpeed = value
  }

  public setShimmerStrength(value: number): void {
    this.config.animation.shimmerStrength = value
    this.uniforms.uShimmerStrength.value = value
  }

  public setPatternFlow(value: number): void {
    this.config.animation.patternFlow = value
    this.uniforms.uPatternFlow.value = value
  }

  public setPatternRotation(value: number): void {
    this.config.animation.patternRotation = value
    this.uniforms.uPatternRotation.value = value
  }

  public setScale(scale: number): void {
    this.config.scale = scale
    this.group.scale.setScalar(scale)
  }

  public setFollowEnabled(enabled: boolean): void {
    this.config.follow.enabled = enabled
  }

  public setFollowSensitivity(value: number): void {
    this.config.follow.sensitivity = value
  }

  public setFollowPupilMotion(enabled: boolean): void {
    this.config.follow.pupilMotion = enabled
    if (!enabled) {
      this.pointerMotionEnergy = 0
      this.lastPointerClientX = null
      this.lastPointerClientY = null
    }
  }

  public setFollowPupilMotionStrength(value: number): void {
    this.config.follow.pupilMotionStrength = THREE.MathUtils.clamp(value, 0, 0.35)
  }

  public setAudioEnabled(enabled: boolean): void {
    this.config.audioEffects.enabled = enabled
  }

  public setAudioReactivity(reactivity: number): void {
    this.config.audioEffects.reactivity = reactivity
  }

  public setPupilResponse(value: number): void {
    this.config.audioEffects.pupilResponse = value
  }

  public setShimmerResponse(value: number): void {
    this.config.audioEffects.shimmerResponse = value
  }

  public setAudioSmoothing(value: number): void {
    this.config.audioEffects.smoothing = value
  }

  public setAudioLevels(bass: number, mid: number, high: number): void {
    const target = ((bass * 0.45) + (mid * 0.35) + (high * 0.2)) * this.config.audioEffects.reactivity
    const smoothing = this.config.audioEffects.smoothing
    this.audioLevel = THREE.MathUtils.lerp(this.audioLevel, target, 1 - smoothing)
  }

  public getScale(): number {
    return this.config.scale
  }

  public getConfig(): EyeIrisConfig {
    return JSON.parse(JSON.stringify(this.config))
  }

  public getMesh(): THREE.Mesh {
    return this.irisMesh
  }

  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.stopAnimation()
    this.removePointerMoveHandler?.()
    this.removePointerMoveHandler = null
    this.irisMesh.geometry.dispose()
    this.irisMaterial.dispose()
    this.group.remove(this.irisMesh)
    this.scene.remove(this.group)
  }
}
