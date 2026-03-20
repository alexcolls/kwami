import type { AvatarConfig, AvatarRendererType, KwamiState, BlackHoleColorScheme } from '../types'
import type { BlobXyzSkinSelection } from './renderers/blob-xyz/types'
import { Scene } from './scene'
import { BlobXyz } from './renderers/blob-xyz'
import { BlackHole } from './renderers/black-hole'
import { ParticlesFace } from './renderers/particles-face'
import { KwamiAudio } from './audio'
import { logger } from '../utils/logger'

/**
 * Avatar - Manages the visual representation of Kwami
 *
 * Supports blob-xyz and black-hole renderers.
 */
export class Avatar {
  private canvas: HTMLCanvasElement
  private config: AvatarConfig
  private scene: Scene
  private blobXyz: BlobXyz | null = null
  private blackHole: BlackHole | null = null
  private particlesFace: ParticlesFace | null = null
  private audio: KwamiAudio
  private currentState: KwamiState = 'idle'
  private resizeObserver: ResizeObserver | null = null
  private currentRenderer: AvatarRendererType = 'blob-xyz'

  constructor(canvas: HTMLCanvasElement, config?: AvatarConfig) {
    this.canvas = canvas
    this.config = config ?? {}

    // Initialize audio
    this.audio = new KwamiAudio(config?.audio?.files ?? [])

    // Initialize scene
    this.scene = new Scene(canvas, config?.scene)

    // Initialize renderer
    this.initRenderer()

    // Setup resize handling
    this.setupResizeHandling()
  }

  private initRenderer(): void {
    const rendererType = this.config.renderer ?? 'blob-xyz'

    if (rendererType === 'blob-xyz') {
      this.currentRenderer = 'blob-xyz'
      this.initBlobXyzRenderer()
    } else if (rendererType === 'black-hole') {
      this.currentRenderer = 'black-hole'
      this.initBlackHoleRenderer()
    } else if (rendererType === 'particles-face') {
      this.currentRenderer = 'particles-face'
      this.initParticlesFaceRenderer()
    } else {
      logger.warn(`Renderer type "${rendererType}" not supported, falling back to blob-xyz`)
      this.currentRenderer = 'blob-xyz'
      this.initBlobXyzRenderer()
    }
  }

  private initBlobXyzRenderer(): void {
    const blobConfig = this.config.blob ?? {}

    this.blobXyz = new BlobXyz({
      scene: this.scene.scene,
      camera: this.scene.camera,
      renderer: this.scene.renderer,
      audio: this.audio,
      skin: blobConfig.skin,
      resolution: blobConfig.resolution,
      spikes: blobConfig.spikes,
      time: blobConfig.time,
      rotation: blobConfig.rotation,
      colors: blobConfig.colors,
      shininess: blobConfig.shininess,
      wireframe: blobConfig.wireframe,
    })

    // Add blob mesh to scene
    this.scene.scene.add(this.blobXyz.getMesh())

    // Apply initial position if provided
    if (blobConfig.position) {
      this.blobXyz.position.set(blobConfig.position.x, blobConfig.position.y)
    }

    // Enable click interaction by default
    this.blobXyz.enableClickInteraction()
  }

  private initBlackHoleRenderer(): void {
    const blackHoleConfig = this.config.blackHole ?? {}

    this.blackHole = new BlackHole(
      this.scene.scene,
      this.scene.camera,
      this.scene.renderer,
      {
        colorScheme: blackHoleConfig.colorScheme,
        core: blackHoleConfig.core,
        disk: blackHoleConfig.disk,
        colors: blackHoleConfig.colors,
        stars: blackHoleConfig.stars,
        animation: blackHoleConfig.animation,
        effects: blackHoleConfig.effects,
        audioEffects: blackHoleConfig.audioEffects,
        scale: blackHoleConfig.scale,
      }
    )

    // Black hole adds itself to scene in constructor via group
  }

  private initParticlesFaceRenderer(): void {
    const pfConfig = this.config.particlesFace ?? {}

    this.particlesFace = new ParticlesFace({
      scene: this.scene.scene,
      camera: this.scene.camera,
      renderer: this.scene.renderer,
      audio: this.audio,
      ...pfConfig,
    })
  }

  private setupResizeHandling(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          this.scene.resize(width, height)
          // Only blob has position management
          if (this.currentRenderer === 'blob-xyz') {
            this.blobXyz?.position.refresh()
          }
        }
      }
    })

    this.resizeObserver.observe(this.canvas)
  }

  /**
   * Set the avatar state (affects visual appearance)
   */
  setState(state: KwamiState): void {
    if (this.currentState === state) return

    const previousState = this.currentState
    this.currentState = state

    // Handle state for blob renderer
    if (this.currentRenderer === 'blob-xyz' && this.blobXyz) {
      // Clean up previous state
      if (previousState === 'listening' && state !== 'listening') this.blobXyz.stopListening()
      if (previousState === 'thinking' && state !== 'thinking') this.blobXyz.stopThinking()

      switch (state) {
        case 'listening':
          this.blobXyz.startListening()
          break
        case 'thinking':
          this.blobXyz.startThinking()
          break
        case 'speaking':
        case 'idle':
          // These states are driven by audio / connection lifecycle
          break
      }
    }

    // Handle state for black-hole renderer
    if (this.currentRenderer === 'black-hole' && this.blackHole) {
      this.blackHole.setState(state)
    }

    // Handle state for particles-face renderer
    if (this.currentRenderer === 'particles-face' && this.particlesFace) {
      this.particlesFace.setState(state)
    }

    logger.debug(`Avatar state changed: ${previousState} → ${state}`)
  }

  /**
   * Get the current state
   */
  getState(): KwamiState {
    return this.currentState
  }

  // ===========================================================================
  // RENDERER ACCESS METHODS
  // ===========================================================================

  /**
   * Get the current renderer type
   */
  getRendererType(): AvatarRendererType {
    return this.currentRenderer
  }

  /**
   * Switch to a different renderer type dynamically
   * Preserves the connection and state
   */
  switchRenderer(newRenderer: AvatarRendererType): void {
    if (this.currentRenderer === newRenderer) {
      logger.debug(`Already using ${newRenderer} renderer`)
      return
    }

    logger.info(`Switching renderer from ${this.currentRenderer} to ${newRenderer}`)

    // Save current state
    const savedState = this.currentState

    // Dispose current renderer
    if (this.currentRenderer === 'blob-xyz' && this.blobXyz) {
      this.scene.scene.remove(this.blobXyz.getMesh())
      this.blobXyz.dispose()
      this.blobXyz = null
    } else if (this.currentRenderer === 'black-hole' && this.blackHole) {
      this.blackHole.dispose()
      this.blackHole = null
    } else if (this.currentRenderer === 'particles-face' && this.particlesFace) {
      this.particlesFace.dispose()
      this.particlesFace = null
    }

    // Initialize new renderer
    this.currentRenderer = newRenderer
    if (newRenderer === 'blob-xyz') {
      this.initBlobXyzRenderer()
    } else if (newRenderer === 'black-hole') {
      this.initBlackHoleRenderer()
    } else if (newRenderer === 'particles-face') {
      this.initParticlesFaceRenderer()
    }

    // Restore state
    this.currentState = 'idle' // Reset first
    this.setState(savedState)

    // Note: Background is now controlled by ScenePanel, not by renderer switching
    // This ensures consistent scene appearance across avatar changes

    logger.info(`Renderer switched to ${newRenderer}`)
  }

  /**
   * Get the blob instance (for direct control)
   */
  getBlob(): BlobXyz | null {
    return this.blobXyz
  }

  /**
   * Get the black hole instance (for direct control)
   */
  getBlackHole(): BlackHole | null {
    return this.blackHole
  }

  /**
   * Get the particles face instance (for direct control)
   */
  getParticlesFace(): ParticlesFace | null {
    return this.particlesFace
  }

  /**
   * Get the audio instance
   */
  getAudio(): KwamiAudio {
    return this.audio
  }

  /**
   * Get the scene instance
   */
  getScene(): Scene {
    return this.scene
  }

  /**
   * Set blob colors
   */
  setColors(x: string, y: string, z: string): void {
    this.blobXyz?.setColors(x, y, z)
  }

  /**
   * Set blob skin
   */
  setSkin(selection: BlobXyzSkinSelection): void {
    this.blobXyz?.setSkin(selection)
  }

  /**
   * Set blob scale
   */
  setScale(scale: number): void {
    this.blobXyz?.setScale(scale)
  }

  /**
   * Set blob spikes (noise frequency)
   */
  setSpikes(x: number, y: number, z: number): void {
    this.blobXyz?.setSpikes(x, y, z)
  }

  /**
   * Set blob position (normalized 0-1)
   */
  setPosition(x: number, y: number): void {
    this.blobXyz?.position.set(x, y)
  }

  /**
   * Set blob rotation speed
   */
  setRotation(x: number, y: number, z: number): void {
    this.blobXyz?.setRotation(x, y, z)
  }

  /**
   * Set blob shininess
   */
  setShininess(value: number): void {
    this.blobXyz?.setShininess(value)
  }

  /**
   * Set blob wireframe mode
   */
  setWireframe(enabled: boolean): void {
    this.blobXyz?.setWireframe(enabled)
  }

  /**
   * Set blob opacity
   */
  setOpacity(value: number): void {
    this.blobXyz?.setOpacity(value)
  }

  /**
   * Randomize avatar appearance
   */
  randomize(): void {
    if (this.currentRenderer === 'blob-xyz') {
      this.blobXyz?.setRandomBlob()
    } else if (this.currentRenderer === 'black-hole') {
      const schemes: BlackHoleColorScheme[] = ['classic', 'fire', 'ice', 'nebula', 'void']
      const randomScheme = schemes[Math.floor(Math.random() * schemes.length)]
      this.blackHole?.setColorScheme(randomScheme as BlackHoleColorScheme)
    } else if (this.currentRenderer === 'particles-face') {
      const randomHue = Math.floor(Math.random() * 360)
      const color = `hsl(${randomHue}, 80%, 75%)`
      const secondaryHue = (randomHue + 60 + Math.floor(Math.random() * 120)) % 360
      const secondaryColor = `hsl(${secondaryHue}, 70%, 60%)`
      this.particlesFace?.setColor(color)
      this.particlesFace?.setSecondaryColor(secondaryColor)
    }
  }

  /**
   * Set callback for conversation toggle (double-click)
   */
  onConversationToggle(callback: () => Promise<void>): void {
    if (this.blobXyz) {
      this.blobXyz.onConversationToggle = callback
    }
  }

  /**
   * Set callback for double-click
   */
  onDoubleClick(callback: () => void | Promise<void>): void {
    if (this.blobXyz) {
      this.blobXyz.onDoubleClick = callback
    }
  }

  /**
   * Connect a media stream for audio visualization
   */
  async connectMediaStream(stream: MediaStream): Promise<void> {
    await this.audio.connectMediaStream(stream)
  }

  /**
   * Disconnect the current media stream
   */
  disconnectMediaStream(): void {
    this.audio.disconnectMediaStream()
  }

  /**
   * Export avatar as GLTF file
   */
  exportGLTF(): void {
    if (this.currentRenderer === 'blob-xyz') {
      this.blobXyz?.exportGLTF()
    } else if (this.currentRenderer === 'black-hole') {
      logger.warn('GLTF export not supported for black-hole renderer')
    }
  }

  /**
   * Cleanup and dispose all resources
   */
  dispose(): void {
    this.resizeObserver?.disconnect()
    this.blobXyz?.dispose()
    this.blackHole?.dispose()
    this.particlesFace?.dispose()
    this.audio.dispose()
    this.scene.dispose()
  }

}
