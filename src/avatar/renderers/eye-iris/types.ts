import type * as THREE from 'three'

export type EyeIrisPalettePreset = 'light-brown' | 'hazel' | 'blue-grey' | 'green-blue'

export interface EyeIrisGeometryConfig {
  irisRadius: number
  pupilRadius: number
  limbalRingWidth: number
}

export interface EyeIrisDetailConfig {
  fiberDensity: number
  fiberSharpness: number
  radialStreakStrength: number
  collaretteStrength: number
  limbalIntensity: number
  noiseStrength: number
  cryptStrength: number
  furrowStrength: number
  ringContrast: number
  sectorMix: number
  pigmentMottleStrength: number
  spokesStrength: number
  innerRingStrength: number
}

export interface EyeIrisColorConfig {
  base: string
  secondary: string
  accent: string
  limbal: string
  collarette: string
  crypt: string
  streak: string
}

export interface EyeIrisAnimationConfig {
  shimmerSpeed: number
  shimmerStrength: number
  patternFlow: number
  patternRotation: number
}

export interface EyeIrisAudioEffects {
  enabled: boolean
  reactivity: number
  pupilResponse: number
  shimmerResponse: number
  smoothing: number
}

export interface EyeIrisFollowConfig {
  enabled: boolean
  sensitivity: number
  /** Brief pupil dilation from fast pointer movement (in addition to gaze follow). */
  pupilMotion: boolean
  /** Max extra radius added when pointer motion peaks (typical 0.06–0.2). */
  pupilMotionStrength: number
}

export interface EyeIrisConfig {
  palettePreset: EyeIrisPalettePreset
  geometry: EyeIrisGeometryConfig
  detail: EyeIrisDetailConfig
  color: EyeIrisColorConfig
  animation: EyeIrisAnimationConfig
  audioEffects: EyeIrisAudioEffects
  follow: EyeIrisFollowConfig
  scale: number
}

export interface EyeIrisOptions {
  palettePreset?: EyeIrisPalettePreset
  geometry?: Partial<EyeIrisGeometryConfig>
  detail?: Partial<EyeIrisDetailConfig>
  color?: Partial<EyeIrisColorConfig>
  animation?: Partial<EyeIrisAnimationConfig>
  audioEffects?: Partial<EyeIrisAudioEffects>
  follow?: Partial<EyeIrisFollowConfig>
  scale?: number
  audio?: { getFrequencyData: () => Uint8Array }
}

export interface EyeIrisUniforms {
  uTime: THREE.IUniform<number>
  uIrisRadius: THREE.IUniform<number>
  uPupilRadius: THREE.IUniform<number>
  uLimbalRingWidth: THREE.IUniform<number>
  uFiberDensity: THREE.IUniform<number>
  uFiberSharpness: THREE.IUniform<number>
  uRadialStreakStrength: THREE.IUniform<number>
  uCollaretteStrength: THREE.IUniform<number>
  uLimbalIntensity: THREE.IUniform<number>
  uNoiseStrength: THREE.IUniform<number>
  uCryptStrength: THREE.IUniform<number>
  uFurrowStrength: THREE.IUniform<number>
  uRingContrast: THREE.IUniform<number>
  uSectorMix: THREE.IUniform<number>
  uPigmentMottleStrength: THREE.IUniform<number>
  uSpokesStrength: THREE.IUniform<number>
  uInnerRingStrength: THREE.IUniform<number>
  uShimmerStrength: THREE.IUniform<number>
  uPatternFlow: THREE.IUniform<number>
  uPatternRotation: THREE.IUniform<number>
  uBaseColor: THREE.IUniform<THREE.Color>
  uSecondaryColor: THREE.IUniform<THREE.Color>
  uAccentColor: THREE.IUniform<THREE.Color>
  uLimbalColor: THREE.IUniform<THREE.Color>
  uCollaretteColor: THREE.IUniform<THREE.Color>
  uCryptColor: THREE.IUniform<THREE.Color>
  uStreakColor: THREE.IUniform<THREE.Color>
}
