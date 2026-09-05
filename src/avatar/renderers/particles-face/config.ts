import type { ParticlesFaceConfig, ParticlesFaceAudioEffects } from './types.js'

export const defaultParticlesFaceConfig: Required<ParticlesFaceConfig> = {
  particleCount: 12000,
  particleSize: 0.1,
  faceScale: 2.8,
  color: '#aaccff',
  secondaryColor: '#7744dd',
  opacity: 0.9,
  mouthAmplitude: 0.7,
  breathingSpeed: 1.0,
  breathingAmplitude: 0.006,
  driftSpeed: 0.18,
  driftAmplitude: 0.002,
  speakingReactivity: 1.6,
  listeningPulse: 0.35,
  thinkingSpeed: 1.8,
  ambientParticles: 40,
  ambientRadius: 4.2,
  depthSpread: 1.1,
}

export const defaultAudioEffects: ParticlesFaceAudioEffects = {
  reactivity: 1.6,
  smoothing: 0.8,
  mouthScale: 2.4,
  eyeScale: 0.3,
  ambientScale: 0.35,
}
