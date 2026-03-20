import type { AvatarRenderer, BlobXyzConfig, SceneConfig } from '../../types'

/**
 * Base interface for avatar renderers
 */
export type { AvatarRenderer }

/**
 * Blob-specific renderer interface
 */
export interface BlobXyzRendererInterface extends AvatarRenderer {
  setColors(x: string, y: string, z: string): void
  setSpikes(x: number, y: number, z: number): void
  setAmplitude(x: number, y: number, z: number): void
  setTime(x: number, y: number, z: number): void
  setRotation(x: number, y: number, z: number): void
  setScale(scale: number): void
  setResolution(resolution: number): void
  setShininess(shininess: number): void
  setWireframe(wireframe: boolean): void
  setOpacity(opacity: number): void
  setSkin(skin: { skin: string; subtype?: string }): void

  randomize(): void
  resetToDefaults(): void

  exportGLTF(): void
}

/**
 * Particles face renderer interface
 */
export interface ParticlesFaceRendererInterface extends AvatarRenderer {
  setColor(color: string): void
  setSecondaryColor(color: string): void
  setParticleSize(size: number): void
  setOpacity(opacity: number): void
  setFaceScale(scale: number): void
  setMouthAmplitude(amplitude: number): void
  setSpeakingReactivity(reactivity: number): void
  setScale(scale: number): void
  setAudioLevels(bass: number, mid: number, high: number): void
}

/**
 * Renderer factory function type
 */
export type RendererFactory = (
  canvas: HTMLCanvasElement,
  config?: BlobXyzConfig & { scene?: SceneConfig }
) => AvatarRenderer
