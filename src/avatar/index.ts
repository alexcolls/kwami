export { Avatar } from './Avatar'
export { Scene, StarField, type StarFieldConfig } from './scene'
export { KwamiAudio } from './audio'
export { BlobXyz, BlobXyzPosition, defaultBlobXyzConfig, createSkin } from './renderers/blob-xyz'
export { ParticlesFace, defaultParticlesFaceConfig } from './renderers/particles-face'
export * from './renderers/types'

// Re-export blob types for convenience
export type {
  BlobXyzConfig,
  BlobXyzOptions,
  BlobXyzSkinSelection,
  BlobXyzSkin,
  TricolorSubtype,
  TricolorSkinConfig,
  BlobXyzAudioEffects,
} from './renderers/blob-xyz/types'

// Re-export particles-face types for convenience
export type {
  ParticlesFaceConfig,
  ParticlesFaceOptions,
  ParticlesFaceAudioEffects,
} from './renderers/particles-face/types'
