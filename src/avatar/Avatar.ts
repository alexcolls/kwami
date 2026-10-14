import type { AvatarConfig, AvatarRendererType, KwamiState, BlackHoleColorScheme } from '../types/index.js'
import type { BlobXyzSkin } from './renderers/blob-xyz/types.js'
import { Scene } from './scene/index.js'
import { BlobXyz } from './renderers/blob-xyz/index.js'
import { BlackHole } from './renderers/black-hole/index.js'
import { ParticlesFace } from './renderers/particles-face/index.js'
import { EyeIris } from './renderers/eye-iris/index.js'
import { Jarvis } from './renderers/jarvis/index.js'
import { KwamiAudio } from './audio/index.js'
import { logger } from '../utils/logger.js'
import * as THREE from 'three'

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
  private eyeIris: EyeIris | null = null
  private jarvis: Jarvis | null = null
  private audio: KwamiAudio
  private currentState: KwamiState = 'idle'
  private resizeObserver: ResizeObserver | null = null
  private tickHandle: number | null = null
  private lastTickTime = 0
  private currentRenderer: AvatarRendererType = 'blob-xyz'
  private sceneControlsInitiallyEnabled = false

  constructor(canvas: HTMLCanvasElement, config?: AvatarConfig) {
    this.canvas = canvas
    this.config = config ?? {}

    // Initialize audio
    this.audio = new KwamiAudio(config?.audio?.files ?? [])

    // Initialize scene
    this.scene = new Scene(canvas, config?.scene)
    this.sceneControlsInitiallyEnabled = this.scene.controls?.enabled ?? false

    // Initialize renderer
    this.initRenderer()

    // Setup resize handling
    this.setupResizeHandling()

    // Recover from GPU context loss instead of dying silently.
    this.scene.onContextChange({
      onLost: () => {
        this.stopTicking()
        this.disposeActiveRenderer()
      },
      onRestored: () => {
        this.initRenderer()
        this.startTicking()
      },
    })

    this.startTicking()
  }

  /**
   * Drive `Scene.update()` once per frame.
   *
   * Each renderer owns its own draw loop but none of them holds this `Scene` wrapper, so its
   * per-frame work — the star field, the OrbitControls damping integrator — had no caller at
   * all. A second rAF callback is cheap; PR-era note: this collapses into the renderers' loop
   * once they share a common interface.
   */
  private startTicking(): void {
    if (this.tickHandle !== null || typeof requestAnimationFrame === 'undefined') return

    this.lastTickTime = 0
    const tick = (now: number): void => {
      // Clamped: returning to a backgrounded tab hands back one enormous delta, which would
      // jump the star field's rotation by seconds in a single frame.
      const deltaSeconds = this.lastTickTime === 0 ? 0 : Math.min((now - this.lastTickTime) / 1000, 0.05)
      this.lastTickTime = now
      this.scene.update(deltaSeconds)
      this.tickHandle = requestAnimationFrame(tick)
    }
    this.tickHandle = requestAnimationFrame(tick)
  }

  private stopTicking(): void {
    if (this.tickHandle !== null) {
      cancelAnimationFrame(this.tickHandle)
      this.tickHandle = null
    }
  }

  /**
   * Tear down whichever renderer is active, leaving `currentRenderer` alone.
   *
   * Shared by the renderer switch, context loss and dispose, so all three release exactly the
   * same things — the switch and the teardown used to differ, which is how the blob's mesh
   * ended up left in the scene graph on a full dispose.
   */
  private disposeActiveRenderer(): void {
    this.blobXyz?.dispose()
    this.blackHole?.dispose()
    this.particlesFace?.dispose()
    this.eyeIris?.dispose()
    this.jarvis?.dispose()
    this.blobXyz = null
    this.blackHole = null
    this.particlesFace = null
    this.eyeIris = null
    this.jarvis = null
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
    } else if (rendererType === 'eye-iris') {
      this.currentRenderer = 'eye-iris'
      this.initEyeIrisRenderer()
    } else if (rendererType === 'jarvis') {
      this.currentRenderer = 'jarvis'
      this.initJarvisRenderer()
    } else {
      logger.warn(`Renderer type "${rendererType}" not supported, falling back to blob-xyz`)
      this.currentRenderer = 'blob-xyz'
      this.initBlobXyzRenderer()
    }
    this.updateSceneControlsForRenderer()
  }

  private updateSceneControlsForRenderer(): void {
    if (!this.scene.controls) return
    // eye-iris and jarvis are camera-facing and handle pointer interaction themselves.
    this.scene.controls.enabled =
      this.sceneControlsInitiallyEnabled && this.currentRenderer !== 'eye-iris' && this.currentRenderer !== 'jarvis'
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
      cursorFollow: blobConfig.cursorFollow,
    })

    // Add blob mesh to scene
    this.scene.scene.add(this.blobXyz.getMesh())

    // Apply initial position if provided
    if (blobConfig.position) {
      this.blobXyz.position.set(blobConfig.position.x, blobConfig.position.y)
    }

    // amplitude, touch and transition are declared on BlobXyzConfig and were accepted here and
    // then dropped — the setters existed but only `avatar.getBlob()` could reach them, so the
    // declarative config silently did nothing for these three.
    if (blobConfig.amplitude) {
      const { x, y, z } = blobConfig.amplitude
      this.blobXyz.setAmplitude(x, y, z)
    }
    if (blobConfig.touch) {
      const { strength, duration, maxPoints } = blobConfig.touch
      if (strength !== undefined) this.blobXyz.setTouchStrength(strength)
      if (duration !== undefined) this.blobXyz.setTouchDuration(duration)
      if (maxPoints !== undefined) this.blobXyz.setMaxTouchPoints(maxPoints)
    }
    if (blobConfig.transition?.speed !== undefined) {
      this.blobXyz.setTransitionSpeed(blobConfig.transition.speed)
    }

    this.applyInteractionConfig()
  }

  /**
   * Apply `AvatarConfig.interaction`.
   *
   * The `InteractionConfig` type has always been part of the public config surface but nothing
   * ever read it: click handling was hardcoded on. Absent config keeps the previous default
   * (click enabled), so this is additive.
   */
  private applyInteractionConfig(): void {
    const interaction = this.config.interaction
    const clickEnabled = interaction?.click?.enabled ?? true

    if (clickEnabled) {
      this.blobXyz?.enableClickInteraction()
    } else {
      this.blobXyz?.disableClickInteraction()
    }

    if (interaction?.hover?.cursorStyle) {
      this.canvas.style.cursor = interaction.hover.cursorStyle
    }

    const dragEnabled = interaction?.drag?.enabled
    if (dragEnabled !== undefined && this.scene.controls) {
      this.scene.controls.enabled = dragEnabled
    }
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

  private initEyeIrisRenderer(): void {
    const eyeIrisConfig = this.config.eyeIris ?? {}
    this.eyeIris = new EyeIris(this.scene.scene, this.scene.camera, this.scene.renderer, {
      ...eyeIrisConfig,
      audio: this.audio,
    })
  }

  private initJarvisRenderer(): void {
    this.jarvis = new Jarvis(this.scene.scene, this.scene.camera, this.scene.renderer, {
      ...(this.config.jarvis ?? {}),
      audio: this.audio,
    })
    this.jarvis.setState(this.currentState)
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
          // BlackHole owns an EffectComposer, a bloom pass and a lensing pass, none of which
          // the Scene knows about. Without this its post-processing chain stayed at the size
          // it was built with, so any resize skewed the lensing and blurred the bloom.
          this.blackHole?.onResize(width, height)
          this.jarvis?.onResize(width, height)
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
      // Keep listening state purely visual here.
      // Mic capture is controlled explicitly by UI (Audio panel), not by agent state.
      this.blobXyz.isListening = state === 'listening'
      if (previousState === 'thinking' && state !== 'thinking') this.blobXyz.stopThinking()

      switch (state) {
        case 'listening':
          // No automatic microphone activation.
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
    if (this.currentRenderer === 'eye-iris' && this.eyeIris) {
      this.eyeIris.setState(state)
    }
    if (this.currentRenderer === 'jarvis' && this.jarvis) {
      this.jarvis.setState(state)
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
    this.disposeActiveRenderer()

    // Initialize new renderer
    this.currentRenderer = newRenderer
    if (newRenderer === 'blob-xyz') {
      this.initBlobXyzRenderer()
    } else if (newRenderer === 'black-hole') {
      this.initBlackHoleRenderer()
    } else if (newRenderer === 'particles-face') {
      this.initParticlesFaceRenderer()
    } else if (newRenderer === 'eye-iris') {
      this.initEyeIrisRenderer()
    } else if (newRenderer === 'jarvis') {
      this.initJarvisRenderer()
    }
    this.updateSceneControlsForRenderer()

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

  getEyeIris(): EyeIris | null {
    return this.eyeIris
  }

  getJarvis(): Jarvis | null {
    return this.jarvis
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
  setSkin(skin: BlobXyzSkin): void {
    this.blobXyz?.setSkin(skin)
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
    } else if (this.currentRenderer === 'eye-iris') {
      const palettes = ['light-brown', 'hazel', 'blue-grey', 'green-blue'] as const
      const palette = palettes[Math.floor(Math.random() * palettes.length)]
      this.eyeIris?.setPalettePreset(palette)
      this.eyeIris?.setFiberDensity(THREE.MathUtils.randFloat(90, 160))
      this.eyeIris?.setRadialStreakStrength(THREE.MathUtils.randFloat(0.4, 1.0))
      this.eyeIris?.setCollaretteStrength(THREE.MathUtils.randFloat(0.3, 0.9))
      this.eyeIris?.setLimbalIntensity(THREE.MathUtils.randFloat(0.5, 1.0))
    } else if (this.currentRenderer === 'jarvis') {
      const palettes = ['holo-cyan', 'neon-violet', 'arc-white', 'alert-amber'] as const
      this.jarvis?.setPalettePreset(palettes[Math.floor(Math.random() * palettes.length)]!)
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
    if (this.jarvis) {
      this.jarvis.onDoubleClick = callback
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
    this.stopTicking()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null

    this.disposeActiveRenderer()
    this.audio.dispose()
    this.scene.dispose()
  }

}
