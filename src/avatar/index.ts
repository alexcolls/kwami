export { Avatar } from './Avatar.js'
export { Scene, StarField, type StarFieldConfig } from './scene/index.js'
export { KwamiAudio } from './audio/index.js'
export { BlobXyz, BlobXyzPosition, defaultBlobXyzConfig, createSkin } from './renderers/blob-xyz/index.js'
export { ParticlesFace, defaultParticlesFaceConfig } from './renderers/particles-face/index.js'
export { EyeIris, getDefaultEyeIrisConfig, eyeIrisPalettePresets, getEyeIrisPalette } from './renderers/eye-iris/index.js'
export {
  avatarBlobPresets,
  avatarBlackHolePresets,
  avatarEyeIrisPresets,
} from './presets.js'
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
} from './randomizer.js'
export type {
  AvatarBlobPreset,
  AvatarBlackHolePreset,
  AvatarEyeIrisPreset,
  BlobPresetState,
  BlackHolePresetState,
  EyeIrisPresetState,
  BlobSkinType,
} from './presets.js'
export type { BlobRandomizerState } from './randomizer.js'
export * from './renderers/types.js'

// Re-export blob types for convenience
export type {
  BlobXyzConfig,
  BlobXyzOptions,
  BlobXyzSkin,
  TricolorSkinConfig,
  BlobXyzAudioEffects,
} from './renderers/blob-xyz/types.js'

// Re-export particles-face types for convenience
export type {
  ParticlesFaceConfig,
  ParticlesFaceOptions,
  ParticlesFaceAudioEffects,
} from './renderers/particles-face/types.js'
export type {
  EyeIrisConfig,
  EyeIrisOptions,
  EyeIrisPalettePreset,
  EyeIrisAudioEffects,
} from './renderers/eye-iris/types.js'
