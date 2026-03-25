import type { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import type { KwamiAudio } from '../../audio/KwamiAudio'

// =============================================================================
// BLOB TYPES
// =============================================================================

/**
 * Blob skin system
 * The only skin is Tricolor, with 3 subtypes.
 */
export type BlobXyzSkin = 'tricolor'
export type TricolorSubtype = 'poles' | 'donut' | 'vintage' | 'marble' | 'fresnel' | 'iridescent'

/**
 * Skin selection (extensible discriminated union).
 */
export type BlobXyzSkinSelection = {
  skin: 'tricolor'
  subtype?: TricolorSubtype
}

/**
 * Tricolor skin configuration
 */
export interface TricolorSkinConfig {
  wireframe: boolean
  lightPosition: { x: number; y: number; z: number }
  shininess: number
  color1: string
  color2: string
  color3: string
  opacity: number
}

/**
 * Blob configuration options
 */
export interface BlobXyzConfig {
  skin?: BlobXyzSkinSelection
  resolution?: number
  spikes?: { x: number; y: number; z: number }
  time?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  colors?: { x: string; y: string; z: string }
  shininess?: number
  wireframe?: boolean
  position?: { x: number; y: number } // Normalized position (0-1)
}

/**
 * Blob constructor options
 */
export interface BlobXyzOptions {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  audio: KwamiAudio

  skin?: BlobXyzSkinSelection
  resolution?: number
  spikes?: { x: number; y: number; z: number }
  time?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  colors?: { x: string; y: string; z: string }
  shininess?: number
  wireframe?: boolean
  onAfterRender?: () => void
}

/**
 * Blob options configuration (defaults)
 */
export interface BlobXyzOptionsConfig {
  spikes: {
    min: number
    max: number
    step: number
    digits: number
    rMin: number
    rMax: number
    default: number
  }
  speed: {
    min: number
    max: number
    default: number
  }
  processing: {
    min: number
    max: number
    default: number
  }
  resolution: {
    min: number
    max: number
    default: number
    step: number
  }
  skins: {
    tricolor: {
      poles: TricolorSkinConfig
      donut: TricolorSkinConfig
      vintage: TricolorSkinConfig
      marble: TricolorSkinConfig
      fresnel: TricolorSkinConfig
      iridescent: TricolorSkinConfig
    }
  }
}

/**
 * Audio effect parameters for blob animation
 */
export interface BlobXyzAudioEffects {
  bassSpike: number
  midSpike: number
  highSpike: number
  midTime: number
  highTime: number
  ultraTime: number
  enabled: boolean
  timeEnabled: boolean
  reactivity?: number
  sensitivity?: number
  breathing?: number
  responseSpeed?: number
  transientBoost?: number
}
