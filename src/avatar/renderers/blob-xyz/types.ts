import type { Scene, PerspectiveCamera, WebGLRenderer } from 'three'
import type { KwamiAudio } from '../../audio/KwamiAudio'

// =============================================================================
// BLOB TYPES
// =============================================================================

export type BlobXyzSkin =
  | 'radial' | 'banded' | 'striped' | 'marble' | 'fresnel' | 'iridescent' | 'spiral' | 'plasma' | 'gradient'
  | 'matte' | 'glossy' | 'metallic' | 'subsurface'
  | 'chrome' | 'clay' | 'jade' | 'toon-matcap' | 'hologram'
  | 'flat' | 'stepped' | 'halftone' | 'outlined'

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
  skin?: BlobXyzSkin
  resolution?: number
  spikes?: { x: number; y: number; z: number }
  time?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  colors?: { x: string; y: string; z: string }
  shininess?: number
  wireframe?: boolean
  position?: { x: number; y: number } // Normalized position (0-1)
  cursorFollow?: {
    enabled?: boolean
    sensitivity?: number
  }
}

/**
 * Blob constructor options
 */
export interface BlobXyzOptions {
  scene: Scene
  camera: PerspectiveCamera
  renderer: WebGLRenderer
  audio: KwamiAudio

  skin?: BlobXyzSkin
  resolution?: number
  spikes?: { x: number; y: number; z: number }
  time?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  colors?: { x: string; y: string; z: string }
  shininess?: number
  wireframe?: boolean
  cursorFollow?: {
    enabled?: boolean
    sensitivity?: number
  }
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
    presets: Record<BlobXyzSkin, TricolorSkinConfig>
  }
}

/**
 * Audio effect parameters for blob animation
 */
export interface BlobXyzAudioEffects {
  bassSpike: number
  midSpike: number
  highSpike: number
  enabled: boolean
  reactivity?: number
  sensitivity?: number
  breathing?: number
  responseSpeed?: number
  transientBoost?: number
  spikeDensity?: number
  rotateWhilePlaying?: boolean
}
