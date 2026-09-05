import type * as THREE from 'three'
import type { KwamiAudio } from '../../audio/index.js'

export interface ParticlesFaceConfig {
  particleCount?: number
  particleSize?: number
  faceScale?: number
  color?: string
  secondaryColor?: string
  opacity?: number
  mouthAmplitude?: number
  breathingSpeed?: number
  breathingAmplitude?: number
  driftSpeed?: number
  driftAmplitude?: number
  speakingReactivity?: number
  listeningPulse?: number
  thinkingSpeed?: number
  ambientParticles?: number
  ambientRadius?: number
  depthSpread?: number
}

export interface ParticlesFaceOptions extends ParticlesFaceConfig {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  audio: KwamiAudio
}

export interface FaceRegion {
  name: string
  indices: number[]
  basePositions: Float32Array
}

export interface ParticlesFaceAudioEffects {
  reactivity: number
  smoothing: number
  mouthScale: number
  eyeScale: number
  ambientScale: number
}
