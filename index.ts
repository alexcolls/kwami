/**
 * @kwami - A 3D Interactive AI Companion Library
 *
 * Kwami is a reusable library for creating interactive 3D AI companions
 * with visual (blob), audio, and AI capabilities.
 *
 * @example
 * ```typescript
 * import { Kwami } from '@kwami';
 *
 * const canvas = document.querySelector('canvas');
 * const kwami = new Kwami(canvas, {
 *   body: {
 *     audioFiles: ['/audio/track1.mp3'],
 *     initialSkin: 'tricolor'
 *   }
 * });
 *
 * // Play audio
 * kwami.body.audio.play();
 *
 * // Randomize appearance
 * kwami.body.blob.setRandomBlob();
 * ```
 */

// Main exports
export { Kwami } from './src/core/Kwami';
export { KwamiBody } from './src/core/Body';
export { KwamiAudio } from './src/core/Audio';
export { Blob } from './src/blob/Blob';

// Utilities
export * from './src/utils/randoms';
export { default as SpeechSynthesisRecorder } from './src/utils/recorder';

// Scene setup
export { setupScene } from './src/scene/setup';

// Skins
export { createSkin, createTricolorSkin, createZebraSkin } from './src/blob/skins';

// Configuration
export { defaultBlobConfig } from './src/blob/config';

// Types
export type {
  KwamiConfig,
  KwamiState,
  BodyConfig,
  AudioConfig,
  SceneConfig,
  BlobConfig,
  BlobSkinType,
  BlobOptions,
  MindConfig,
  SoulConfig,
  TricolorSkinConfig,
  ZebraSkinConfig,
  EventHandler,
  EventHandlers,
} from './src/types';

// Default export
export { Kwami as default } from './src/core/Kwami';
