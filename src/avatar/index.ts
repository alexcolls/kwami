export { Avatar } from './Avatar'
export { Scene, StarField, type StarFieldConfig } from './scene'
export { KwamiAudio } from './audio'
export { BlobXyz, BlobXyzPosition, defaultBlobXyzConfig, createSkin } from './renderers/blob-xyz'
export { ParticlesFace, defaultParticlesFaceConfig } from './renderers/particles-face'
export {
  avatarBlobPresets,
  avatarBlackHolePresets,
} from './presets'
export {
  BLOB_SKINS,
  BLOB_SKIN_LABELS,
  randomBlobSkinType,
  randomBlobColors,
  randomBlobSurface,
  randomBlobScale,
  randomBlobVector3Degrees,
  randomBlobSpikes,
  randomBlobAmplitude,
  randomBlobTime,
  randomBlobRotation,
  randomBlobBreathing,
  randomBlobTouch,
  randomBlobAudio,
  randomBlobFrequencyBands,
  randomizeBlobState,
} from './randomizer'
export type {
  AvatarBlobPreset,
  AvatarBlackHolePreset,
  BlobPresetState,
  BlackHolePresetState,
  BlobSkinType,
} from './presets'
export type { BlobRandomizerState } from './randomizer'
export * from './renderers/types'

// Re-export blob types for convenience
export type {
  BlobXyzConfig,
  BlobXyzOptions,
  BlobXyzSkin,
  TricolorSkinConfig,
  BlobXyzAudioEffects,
} from './renderers/blob-xyz/types'

// Re-export particles-face types for convenience
export type {
  ParticlesFaceConfig,
  ParticlesFaceOptions,
  ParticlesFaceAudioEffects,
} from './renderers/particles-face/types'
