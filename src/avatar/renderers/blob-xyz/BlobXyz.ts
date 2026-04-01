import type {
  Vector3,
  Texture
} from 'three';
import {
  Mesh,
  Color,
  PointLight,
  Vector2,
  Raycaster,
  AlwaysStencilFunc,
  KeepStencilOp,
  ReplaceStencilOp,
  type ShaderMaterial,
} from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { createBlobXyzGeometry } from './geometry'
import { animateBlobXyz, type LiquidPhysics } from './animation'
import { createSkin } from './skins'
import { defaultBlobXyzConfig } from './config'
import { BlobXyzPosition } from './position'
import {
  getRandomBetween,
  getRandomBoolean,
  getRandomHexColor,
  genDNA,
} from '../../../utils/randoms'
import type { BlobXyzOptions, BlobXyzSkinSelection, BlobXyzAudioEffects, AnySkinSubtype, TricolorSkinConfig } from './types'
import { logger } from '../../../utils/logger'


/**
 * BlobXyz - The 3D visual body of Kwami
 * A morphing sphere that reacts to audio and can have different skins
 */
export class BlobXyz {
  private mesh: Mesh
  private config = defaultBlobXyzConfig
  public currentSkin: BlobXyzSkinSelection
  public currentSkinSubtype: AnySkinSubtype
  private skins: Map<AnySkinSubtype, ShaderMaterial> = new Map()

  private animationFrameId: number | null = null

  // Tricolor lights
  private lights: { x: PointLight; y: PointLight; z: PointLight } | null = null
  public lightIntensity = 0

  // Touch interaction
  private touchPoints: Array<{
    position: Vector3
    strength: number
    startTime: number
    duration: number
  }> = []
  private clickEnabled = false

  // Touch configuration
  public touchStrength = 1.0
  public touchDuration = 1100
  public maxTouchPoints = 5

  // Conversation callback
  public onConversationToggle?: () => Promise<void>

  // Custom click callbacks
  public onClick?: () => void | Promise<void>
  public onDoubleClick?: () => void | Promise<void>

  // Right-click callbacks
  public onRightClick?: () => void | Promise<void>
  public onDoubleRightClick?: () => void | Promise<void>

  // Right-click tracking
  private lastRightClickTime = 0
  private rightClickTimeout: number | null = null

  // Listening mode
  public isListening = false
  private listeningTransition = 0

  // Thinking mode
  public isThinking = false
  private thinkingTimeout: number | null = null
  private thinkingStartTime: number = 0
  private thinkingTransition = 0
  public thinkingDuration = 10000

  // State transition speed
  public transitionSpeed = 0.05

  // Animation parameters
  public spikes = { x: 0.2, y: 0.2, z: 0.2 }
  public amplitude = { x: 0.8, y: 0.8, z: 0.8 }
  public time = { x: 1, y: 1, z: 1 }
  public rotation = { x: 0, y: 0, z: 0 }

  // Liquid physics velocity tracking
  private prevMeshX = 0
  private prevMeshY = 0
  private smoothVelocityX = 0
  private smoothVelocityY = 0
  private liquidPhysics: LiquidPhysics = { velocityX: 0, velocityY: 0, stretch: 0.6 }

  // Audio effect parameters
  public audioEffects: BlobXyzAudioEffects = {
    bassSpike: 0.55,
    midSpike: 0.65,
    highSpike: 0.35,
    enabled: true,
    reactivity: 1.8,
    sensitivity: 0.075,
    breathing: 0.035,
    responseSpeed: 0.65,
    transientBoost: 0.35,
    spikeDensity: 1.5,
    rotateWhilePlaying: true,
  }
  public colors = { x: '#ff0000', y: '#00ff00', z: '#0000ff' }
  public opacity = 1
  public baseScale = 3.2
  public dna = ''
  private backgroundTexture: Texture | null = null
  private glassModeEnabled = false

  // Position management system
  public position: BlobXyzPosition

  constructor(private options: BlobXyzOptions) {
    const selection: BlobXyzSkinSelection = options.skin ?? { skin: 'tricolor', subtype: 'poles' }
    const subtype: AnySkinSubtype = (selection.subtype ?? 'poles') as AnySkinSubtype

    this.currentSkin = selection
    this.currentSkinSubtype = subtype

    this.initializeSkins(options.colors)

    const activeSkinConfig = this.getSkinConfig(selection.skin, subtype)

    if (options.colors) {
      this.colors = {
        x: options.colors.x,
        y: options.colors.y,
        z: options.colors.z
      }
    } else if ('color1' in activeSkinConfig) {
      this.colors = {
        x: activeSkinConfig.color1,
        y: activeSkinConfig.color2,
        z: activeSkinConfig.color3
      }
    }

    this.opacity = activeSkinConfig.opacity ?? 1
    this.updateMaterialOpacity(this.opacity)

    const geometry = createBlobXyzGeometry(
      options.resolution || this.config.resolution.default,
    )

    const material = this.skins.get(this.currentSkinSubtype)!
    this.mesh = new Mesh(geometry, material)
    this.updateMaterialOpacity(this.opacity)
    this.updateLightIntensityUniforms()

    this.position = new BlobXyzPosition(
      this.mesh,
      options.camera,
      options.renderer.domElement as HTMLCanvasElement
    )

    if (options.spikes) {
      this.setSpikes(options.spikes.x, options.spikes.y, options.spikes.z)
    }
    if (options.time) {
      this.setTime(options.time.x, options.time.y, options.time.z)
    }
    if (options.rotation) {
      this.rotation = options.rotation
    }

    if (options.shininess !== undefined) {
      this.setShininess(options.shininess)
    }

    if (options.wireframe !== undefined) {
      this.setWireframe(options.wireframe)
    }

    this.startAnimation()
  }

  /**
   * Initialize all available skins
   */
  private getSkinConfig(family: string, subtype: AnySkinSubtype): TricolorSkinConfig {
    const familyConfigs = this.config.skins[family as keyof typeof this.config.skins]
    if (familyConfigs && subtype in familyConfigs) {
      return (familyConfigs as Record<string, TricolorSkinConfig>)[subtype]
    }
    return this.config.skins.tricolor.poles
  }

  private initializeSkins(colorOverride?: { x: string; y: string; z: string }): void {
    const families = [
      { skin: 'tricolor' as const, subtypes: ['poles', 'donut', 'vintage', 'marble', 'fresnel', 'iridescent', 'spiral', 'plasma', 'gradient'] },
      { skin: 'monochrome' as const, subtypes: ['matte', 'glossy', 'metallic', 'subsurface'] },
      { skin: 'matcap' as const, subtypes: ['chrome', 'clay', 'jade', 'toon-matcap', 'hologram'] },
      { skin: 'toon' as const, subtypes: ['flat', 'stepped', 'halftone', 'outlined'] },
    ] as const

    const getConfigWithColors = <T extends { color1: string; color2: string; color3: string }>(baseConfig: T) => {
      if (colorOverride) {
        return {
          ...baseConfig,
          color1: colorOverride.x,
          color2: colorOverride.y,
          color3: colorOverride.z,
        }
      }
      return baseConfig
    }

    for (const family of families) {
      for (const subtype of family.subtypes) {
        const baseConfig = this.getSkinConfig(family.skin, subtype as AnySkinSubtype)
        const material = createSkin({ skin: family.skin, subtype } as BlobXyzSkinSelection, getConfigWithColors(baseConfig))
        this.applyBackgroundTextureToMaterial(material)
        this.skins.set(subtype as AnySkinSubtype, material)
      }
    }
  }

  private applyBackgroundTextureToMaterial(material: ShaderMaterial): void {
    if (!material.uniforms) return

    if (Object.prototype.hasOwnProperty.call(material.uniforms, 'backgroundTexture')) {
      material.uniforms.backgroundTexture.value = this.backgroundTexture
    }

    if (Object.prototype.hasOwnProperty.call(material.uniforms, 'useBackgroundTexture')) {
      material.uniforms.useBackgroundTexture.value = Boolean(this.backgroundTexture)
    }

    this.applyGlassModeState(material)

    material.needsUpdate = true
  }

  private applyBackgroundTextureToAllSkins(): void {
    this.skins.forEach((material) => this.applyBackgroundTextureToMaterial(material))

    if (this.mesh) {
      this.applyBackgroundTextureToMaterial(this.mesh.material as ShaderMaterial)
    }
  }

  public setBackgroundTexture(texture: Texture | null): void {
    this.backgroundTexture = texture
    this.applyBackgroundTextureToAllSkins()
    this.updateLightIntensityUniforms()
  }

  public setGlassMode(enabled: boolean): void {
    if (this.glassModeEnabled === enabled) return
    this.glassModeEnabled = enabled
    this.applyGlassModeStateToAllMaterials()
  }

  private applyGlassModeState(material: ShaderMaterial): void {
    if (!material) return

    if (this.glassModeEnabled) {
      material.stencilWrite = true
      material.stencilRef = 1
      material.stencilFunc = AlwaysStencilFunc
      material.stencilFuncMask = 0xff
      material.stencilWriteMask = 0xff
      material.stencilFail = KeepStencilOp
      material.stencilZFail = KeepStencilOp
      material.stencilZPass = ReplaceStencilOp
      material.depthWrite = true
    } else {
      material.stencilWrite = false
      material.stencilRef = 0
      material.stencilFunc = AlwaysStencilFunc
      material.stencilFuncMask = 0xff
      material.stencilWriteMask = 0xff
      material.stencilFail = KeepStencilOp
      material.stencilZFail = KeepStencilOp
      material.stencilZPass = ReplaceStencilOp
      material.depthWrite = !material.transparent
    }

    material.needsUpdate = true
  }

  private applyGlassModeStateToAllMaterials(): void {
    this.skins.forEach((material) => this.applyGlassModeState(material))

    if (this.mesh) {
      this.applyGlassModeState(this.mesh.material as ShaderMaterial)
    }
  }

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      // Update state transitions smoothly
      if (this.isListening) {
        this.listeningTransition = Math.min(1, this.listeningTransition + this.transitionSpeed)
      } else {
        this.listeningTransition = Math.max(0, this.listeningTransition - this.transitionSpeed)
      }

      if (this.isThinking) {
        this.thinkingTransition = Math.min(1, this.thinkingTransition + this.transitionSpeed)
      } else {
        this.thinkingTransition = Math.max(0, this.thinkingTransition - this.transitionSpeed)
      }

      const currentX = this.mesh.position.x
      const currentY = this.mesh.position.y
      const rawVX = currentX - this.prevMeshX
      const rawVY = currentY - this.prevMeshY
      const smoothing = 0.15
      this.smoothVelocityX += (rawVX - this.smoothVelocityX) * smoothing
      this.smoothVelocityY += (rawVY - this.smoothVelocityY) * smoothing
      this.liquidPhysics.velocityX = this.smoothVelocityX
      this.liquidPhysics.velocityY = this.smoothVelocityY
      this.prevMeshX = currentX
      this.prevMeshY = currentY

      const analyser = this.options.audio.getAnalyser()
      if (analyser) {
        const frequencyData = this.options.audio.getFrequencyData() as Uint8Array<ArrayBuffer>

        const thinkingProgress = this.isThinking
          ? (Date.now() - this.thinkingStartTime) / this.thinkingDuration
          : 0

        const audioDriven = animateBlobXyz(
          this.mesh,
          frequencyData,
          analyser,
          this.spikes.x,
          this.spikes.y,
          this.spikes.z,
          this.amplitude.x,
          this.amplitude.y,
          this.amplitude.z,
          this.time.x,
          this.time.y,
          this.time.z,
          this.baseScale,
          this.touchPoints,
          this.listeningTransition,
          this.thinkingTransition,
          thinkingProgress,
          this.audioEffects,
          this.liquidPhysics,
        )

        const keepRotating = this.audioEffects.rotateWhilePlaying ?? true
        const rotationScale = audioDriven && !keepRotating ? 0 : audioDriven ? 0.4 : 1
        this.mesh.rotation.x += this.rotation.x * rotationScale
        this.mesh.rotation.y += this.rotation.y * rotationScale
        this.mesh.rotation.z += this.rotation.z * rotationScale
      } else {
        this.mesh.rotation.x += this.rotation.x
        this.mesh.rotation.y += this.rotation.y
        this.mesh.rotation.z += this.rotation.z
      }

      // Clean up expired touch points
      const currentTime = Date.now()
      this.touchPoints = this.touchPoints.filter(
        tp => (currentTime - tp.startTime) < tp.duration
      )

      const activeMaterial = this.mesh.material as ShaderMaterial
      if (activeMaterial.uniforms?.uTime) {
        activeMaterial.uniforms.uTime.value = performance.now() * 0.001
      }

      this.options.renderer.render(this.options.scene, this.options.camera)
      this.options.onAfterRender?.()

      this.animationFrameId = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Stop the animation loop
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Get the THREE.js mesh
   */
  getMesh(): Mesh {
    return this.mesh
  }

  /**
   * Change the blob's skin
   */
  setSkin(selection: BlobXyzSkinSelection): void {
    const subtype = (selection.subtype ?? 'poles') as AnySkinSubtype
    const material = this.skins.get(subtype)

    if (material) {
      const currentMaterial = this.mesh.material as ShaderMaterial
      const currentShininess = currentMaterial.uniforms?.shininess?.value || 50
      const currentWireframe = currentMaterial.wireframe

      this.currentSkin = selection
      this.currentSkinSubtype = subtype
      this.mesh.material = material
      this.applyBackgroundTextureToMaterial(material)

      if ((material as ShaderMaterial).uniforms?.opacity) {
        (material as ShaderMaterial).uniforms.opacity.value = this.opacity
      }
      this.updateMaterialOpacity(this.opacity)

      this.setColor('x', this.colors.x)
      this.setColor('y', this.colors.y)
      this.setColor('z', this.colors.z)

      if (material.uniforms.shininess) {
        material.uniforms.shininess.value = currentShininess
      }

      material.wireframe = currentWireframe

      this.updateLightIntensityUniforms()
    }
  }

  /**
   * Get current skin type
   */
  getCurrentSkin(): BlobXyzSkinSelection {
    return this.currentSkin
  }

  getCurrentSkinSubtype(): AnySkinSubtype {
    return this.currentSkinSubtype
  }

  /**
   * Get spike values
   */
  getSpikes(): { x: number; y: number; z: number } {
    return { ...this.spikes }
  }

  /**
   * Set spike values for noise frequency
   */
  setSpikes(x: number, y: number, z: number): void {
    this.spikes = { x, y, z }
  }

  /**
   * Get amplitude values
   */
  getAmplitude(): { x: number; y: number; z: number } {
    return { ...this.amplitude }
  }

  /**
   * Set amplitude values for noise depth
   */
  setAmplitude(x: number, y: number, z: number): void {
    this.amplitude = { x, y, z }
  }

  /**
   * Get time values
   */
  getTime(): { x: number; y: number; z: number } {
    return { ...this.time }
  }

  /**
   * Set time values for animation speed
   */
  setTime(x: number, y: number, z: number): void {
    this.time = { x, y, z }
  }

  /**
   * Get rotation values
   */
  getRotation(): { x: number; y: number; z: number } {
    return { ...this.rotation }
  }

  /**
   * Set rotation speed
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation = { x, y, z }
  }

  /**
   * Get colors
   */
  getColors(): { x: string; y: string; z: string } {
    return { ...this.colors }
  }

  /**
   * Set colors
   */
  setColors(x: string, y: string, z: string): void {
    this.setColor('x', x)
    this.setColor('y', y)
    this.setColor('z', z)
  }

  /**
   * Set a single color by axis
   */
  setColor(axis: 'x' | 'y' | 'z', color: string): void {
    this.colors[axis] = color
    const uniformMap = { x: '_color1', y: '_color2', z: '_color3' }

    this.skins.forEach((material) => {
      const shader = material as ShaderMaterial
      const key = uniformMap[axis]
      if (shader?.uniforms?.[key]) {
        shader.uniforms[key].value = new Color(color)
      }
    })

    this.updateLightColors()
  }

  getOpacity(): number {
    return this.opacity
  }

  setOpacity(value: number): void {
    const clamped = Math.max(0, Math.min(1, value))
    this.opacity = clamped
    this.updateMaterialOpacity(clamped)
  }

  private updateMaterialOpacity(value: number): void {
    const isTransparent = value < 0.999

    this.skins.forEach((material) => {
      const shader = material as ShaderMaterial
      if (shader.uniforms?.opacity) {
        shader.uniforms.opacity.value = value
      }
      shader.transparent = isTransparent
      shader.depthWrite = !isTransparent
      shader.opacity = value
      shader.needsUpdate = true
    })

    if (this.mesh) {
      const meshMaterial = this.mesh.material as ShaderMaterial
      if (meshMaterial.uniforms?.opacity) {
        meshMaterial.uniforms.opacity.value = value
      }
      meshMaterial.transparent = isTransparent
      meshMaterial.depthWrite = !isTransparent
      meshMaterial.opacity = value
      meshMaterial.needsUpdate = true
    }
  }

  /**
   * Set mesh resolution
   */
  setResolution(resolution: number): void {
    const geometry = createBlobXyzGeometry(resolution)
    this.mesh.geometry.dispose()
    this.mesh.geometry = geometry
  }

  /**
   * Get scale value
   */
  getScale(): number {
    return this.baseScale
  }

  /**
   * Set scale
   */
  setScale(scale: number): void {
    logger.info('BlobXyz.setScale called with:', scale)
    this.baseScale = scale
    logger.info('Base scale set to:', this.baseScale)
  }

  /**
   * Get wireframe mode
   */
  getWireframe(): boolean {
    return (this.mesh.material as ShaderMaterial).wireframe
  }

  /**
   * Set wireframe mode
   */
  setWireframe(wireframe: boolean): void {
    (this.mesh.material as ShaderMaterial).wireframe = wireframe
  }

  /**
   * Get shininess value
   */
  getShininess(): number {
    const material = this.mesh.material as ShaderMaterial
    return material.uniforms.shininess?.value || 0
  }

  /**
   * Set shininess
   */
  setShininess(value: number): void {
    const material = this.mesh.material as ShaderMaterial
    if (material.uniforms.shininess) {
      material.uniforms.shininess.value = value
    }
  }

  /**
   * Set light intensity
   */
  setLightIntensity(intensity: number): void {
    this.lightIntensity = intensity

    if (intensity > 0) {
      if (!this.lights) {
        this.initializeLights()
      }
      if (this.lights) {
        this.lights.x.intensity = intensity
        this.lights.y.intensity = intensity
        this.lights.z.intensity = intensity
      }
    } else {
      if (this.lights) {
        this.lights.x.intensity = 0
        this.lights.y.intensity = 0
        this.lights.z.intensity = 0
      }
    }

    this.updateLightIntensityUniforms()
  }

  /**
   * Set light position for shader lighting
   */
  setLightPosition(x: number, y: number, z: number): void {
    const applyPosition = (material: ShaderMaterial) => {
      if (!material.uniforms) return

      if (Object.prototype.hasOwnProperty.call(material.uniforms, 'lightPosition')) {
        material.uniforms.lightPosition.value.x = x
        material.uniforms.lightPosition.value.y = y
        material.uniforms.lightPosition.value.z = z
        material.needsUpdate = true
      }
    }

    this.skins.forEach(applyPosition)

    if (this.mesh) {
      applyPosition(this.mesh.material as ShaderMaterial)
    }
  }

  /**
   * Get current light position
   */
  getLightPosition(): { x: number; y: number; z: number } {
    const material = this.mesh.material as ShaderMaterial
    if (material.uniforms.lightPosition) {
      const pos = material.uniforms.lightPosition.value
      return { x: pos.x, y: pos.y, z: pos.z }
    }
    return { x: 1000, y: 2500, z: 200 } // default
  }

  /**
   * Set touch strength
   */
  setTouchStrength(strength: number): void {
    this.touchStrength = strength
  }

  /**
   * Get touch strength
   */
  getTouchStrength(): number {
    return this.touchStrength
  }

  /**
   * Set touch duration in milliseconds
   */
  setTouchDuration(duration: number): void {
    this.touchDuration = duration
  }

  /**
   * Get touch duration
   */
  getTouchDuration(): number {
    return this.touchDuration
  }

  /**
   * Set maximum touch points
   */
  setMaxTouchPoints(max: number): void {
    this.maxTouchPoints = max
  }

  /**
   * Get maximum touch points
   */
  getMaxTouchPoints(): number {
    return this.maxTouchPoints
  }

  /**
   * Set transition speed for state changes
   */
  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = speed
  }

  /**
   * Get transition speed
   */
  getTransitionSpeed(): number {
    return this.transitionSpeed
  }

  /**
   * Set thinking duration in milliseconds
   */
  setThinkingDuration(duration: number): void {
    this.thinkingDuration = duration
  }

  /**
   * Get thinking duration
   */
  getThinkingDuration(): number {
    return this.thinkingDuration
  }

  /**
   * Set click callback
   */
  setClickCallback(callback: () => void | Promise<void>): void {
    this.onClick = callback
  }

  /**
   * Trigger a visual pulse effect at the center of the blob
   */
  triggerPulse(): void {
    if (this.touchPoints.length >= this.maxTouchPoints) {
      this.touchPoints.shift()
    }

    this.touchPoints.push({
      position: this.mesh.position.clone(),
      strength: this.touchStrength,
      startTime: Date.now(),
      duration: this.touchDuration,
    })
  }

  /**
   * Set right-click callback
   */
  setRightClickCallback(callback: () => void | Promise<void>): void {
    this.onRightClick = callback
  }

  /**
   * Set double right-click callback
   */
  setDoubleRightClickCallback(callback: () => void | Promise<void>): void {
    this.onDoubleRightClick = callback
  }

  /**
   * Initialize tricolor lights
   */
  private initializeLights(): void {
    const lightX = new PointLight(new Color(this.colors.x).getHex(), this.lightIntensity, 10)
    const lightY = new PointLight(new Color(this.colors.y).getHex(), this.lightIntensity, 10)
    const lightZ = new PointLight(new Color(this.colors.z).getHex(), this.lightIntensity, 10)

    lightX.position.set(3, 0, 0)
    lightY.position.set(0, 3, 0)
    lightZ.position.set(0, 0, 3)

    this.options.scene.add(lightX)
    this.options.scene.add(lightY)
    this.options.scene.add(lightZ)

    this.lights = { x: lightX, y: lightY, z: lightZ }
  }

  /**
   * Update light colors when blob colors change
   */
  private updateLightColors(): void {
    if (this.lights) {
      this.lights.x.color.setHex(new Color(this.colors.x).getHex())
      this.lights.y.color.setHex(new Color(this.colors.y).getHex())
      this.lights.z.color.setHex(new Color(this.colors.z).getHex())
    }
  }

  private updateLightIntensityUniforms(): void {
    const applyIntensity = (material: ShaderMaterial) => {
      if (!material.uniforms) return

      if (Object.prototype.hasOwnProperty.call(material.uniforms, 'lightIntensity')) {
        material.uniforms.lightIntensity.value = this.lightIntensity
        material.needsUpdate = true
      }
    }

    this.skins.forEach(applyIntensity)

    if (this.mesh) {
      applyIntensity(this.mesh.material as ShaderMaterial)
    }
  }

  /**
   * Generate random blob appearance
   */
  setRandomBlob(): void {
    this.dna = genDNA()

    this.spikes = {
      x: getRandomBetween(
        this.config.spikes.rMin,
        this.config.spikes.rMax,
        this.config.spikes.digits,
      ),
      y: getRandomBetween(
        this.config.spikes.rMin,
        this.config.spikes.rMax,
        this.config.spikes.digits,
      ),
      z: getRandomBetween(
        this.config.spikes.rMin,
        this.config.spikes.rMax,
        this.config.spikes.digits,
      ),
    }

    this.amplitude = {
      x: getRandomBetween(0.3, 1.2, 1),
      y: getRandomBetween(0.3, 1.2, 1),
      z: getRandomBetween(0.3, 1.2, 1),
    }

    this.time = {
      x: getRandomBetween(0.5, 10, 1),
      y: getRandomBetween(0.5, 10, 1),
      z: getRandomBetween(0.5, 10, 1),
    }

    if (getRandomBoolean()) {
      this.rotation = {
        x: getRandomBetween(0, 0.01, 3),
        y: getRandomBetween(0, 0.01, 3),
        z: getRandomBetween(0, 0.01, 3),
      }
    } else {
      this.rotation = { x: 0, y: 0, z: 0 }
    }

    const resolution = getRandomBetween(
      this.config.resolution.min,
      this.config.resolution.max,
    )
    this.setResolution(resolution)

    this.setColors(
      getRandomHexColor(),
      getRandomHexColor(),
      getRandomHexColor(),
    )

    this.setShininess(getRandomBetween(1, 200, 1))
    this.setWireframe(getRandomBoolean(0.1))
  }

  /**
   * Export blob as GLTF file
   */
  exportGLTF(): void {
    const exporter = new GLTFExporter()

    exporter.parse(
      this.options.scene,
      (result: ArrayBuffer | { [key: string]: unknown }) => {
        const blobData = new globalThis.Blob([result as ArrayBuffer], {
          type: 'model/gltf-binary',
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blobData)
        link.download = 'kwami-blob.glb'
        link.click()
      },
      (error: unknown) => {
        logger.error('Failed to export GLTF:', error)
      },
      { binary: true },
    )
  }

  /**
   * Enable click interaction on the blob
   */
  enableClickInteraction(): void {
    if (this.clickEnabled) return
    this.clickEnabled = true

    const canvas = this.options.renderer.domElement
    const raycaster = new Raycaster()
    const mouse = new Vector2()

    let isDragging = false
    let previousMousePosition = { x: 0, y: 0 }

    const handleClick = async (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, this.options.camera)

      const intersects = raycaster.intersectObject(this.mesh)

      if (intersects.length > 0) {
        const intersect = intersects[0]
        if (intersect.point) {
          // Execute custom click callback if set, otherwise do default pulse
          if (this.onClick) {
            await this.onClick()
          } else {
            // Default behavior: add touch point for visual pulse
            const localPoint = this.mesh.worldToLocal(intersect.point.clone())

            if (this.touchPoints.length >= this.maxTouchPoints) {
              this.touchPoints.shift()
            }

            this.touchPoints.push({
              position: localPoint,
              strength: this.touchStrength,
              startTime: Date.now(),
              duration: this.touchDuration,
            })
          }
        }
      }
    }

    const handleDoubleClick = async (event: MouseEvent) => {
      event.preventDefault()

      const rect = canvas.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, this.options.camera)

      const intersects = raycaster.intersectObject(this.mesh)

      if (intersects.length > 0) {
        if (this.onDoubleClick) {
          await this.onDoubleClick()
        } else if (this.onConversationToggle) {
          await this.onConversationToggle()
        } else {
          if (this.isListening) {
            this.stopListening()
          } else {
            await this.startListening()
          }
        }
      }
    }

    const handleContextMenu = async (event: MouseEvent) => {
      event.preventDefault()

      const rect = canvas.getBoundingClientRect()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(mouse, this.options.camera)

      const intersects = raycaster.intersectObject(this.mesh)

      if (intersects.length > 0) {
        const now = Date.now()
        const DOUBLE_CLICK_THRESHOLD = 300 // ms

        if (now - this.lastRightClickTime < DOUBLE_CLICK_THRESHOLD) {
          // Double right-click detected
          if (this.rightClickTimeout) {
            clearTimeout(this.rightClickTimeout)
            this.rightClickTimeout = null
          }
          if (this.onDoubleRightClick) {
            await this.onDoubleRightClick()
          }
        } else {
          // Potential single right-click, wait to see if it's a double
          this.rightClickTimeout = window.setTimeout(async () => {
            if (this.onRightClick) {
              await this.onRightClick()
            }
            this.rightClickTimeout = null
          }, DOUBLE_CLICK_THRESHOLD)
        }

        this.lastRightClickTime = now
      }
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 2) return // Ignore right-click for drag
      isDragging = true
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return

      const deltaX = event.clientX - previousMousePosition.x
      const deltaY = event.clientY - previousMousePosition.y

      this.mesh.rotation.y += deltaX * 0.01
      this.mesh.rotation.x += deltaY * 0.01

      const diagonalMovement = (Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : -deltaY) * 0.005
      this.mesh.rotation.z += diagonalMovement

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const handleMouseUp = () => {
      isDragging = false
    }

    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('dblclick', handleDoubleClick)
    canvas.addEventListener('contextmenu', handleContextMenu)
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)

      // Store handlers for cleanup
      ; (this as unknown as Record<string, unknown>)._clickHandler = handleClick
      ; (this as unknown as Record<string, unknown>)._dblClickHandler = handleDoubleClick
      ; (this as unknown as Record<string, unknown>)._contextMenuHandler = handleContextMenu
      ; (this as unknown as Record<string, unknown>)._mouseDownHandler = handleMouseDown
      ; (this as unknown as Record<string, unknown>)._mouseMoveHandler = handleMouseMove
      ; (this as unknown as Record<string, unknown>)._mouseUpHandler = handleMouseUp
  }

  /**
   * Disable click interaction
   */
  disableClickInteraction(): void {
    if (!this.clickEnabled) return
    this.clickEnabled = false

    const canvas = this.options.renderer.domElement
    const handlers = this as unknown as Record<string, EventListener | undefined>

    if (handlers._clickHandler) {
      canvas.removeEventListener('click', handlers._clickHandler)
      delete handlers._clickHandler
    }

    if (handlers._dblClickHandler) {
      canvas.removeEventListener('dblclick', handlers._dblClickHandler)
      delete handlers._dblClickHandler
    }

    if (handlers._contextMenuHandler) {
      canvas.removeEventListener('contextmenu', handlers._contextMenuHandler)
      delete handlers._contextMenuHandler
    }

    if (handlers._mouseDownHandler) {
      canvas.removeEventListener('mousedown', handlers._mouseDownHandler)
      delete handlers._mouseDownHandler
    }

    if (handlers._mouseMoveHandler) {
      canvas.removeEventListener('mousemove', handlers._mouseMoveHandler)
      delete handlers._mouseMoveHandler
    }

    if (handlers._mouseUpHandler) {
      canvas.removeEventListener('mouseup', handlers._mouseUpHandler)
      canvas.removeEventListener('mouseleave', handlers._mouseUpHandler)
      delete handlers._mouseUpHandler
    }

    // Clean up right-click timeout
    if (this.rightClickTimeout) {
      clearTimeout(this.rightClickTimeout)
      this.rightClickTimeout = null
    }

    if (this.isListening) {
      this.stopListening()
    }

    this.touchPoints = []
  }

  /**
   * Start listening to microphone input
   */
  async startListening(): Promise<void> {
    try {
      await this.options.audio.startMicrophoneListening()
      this.isListening = true
      logger.info('🎤 Started listening to microphone')
    } catch (error) {
      logger.error('Failed to start listening:', error)
      throw error
    }
  }

  /**
   * Stop listening to microphone input
   */
  stopListening(): void {
    this.options.audio.stopMicrophoneListening()
    this.isListening = false
    logger.info('🔇 Stopped listening to microphone')
  }

  /**
   * Start thinking mode
   */
  startThinking(): void {
    if (this.thinkingTimeout !== null) {
      clearTimeout(this.thinkingTimeout)
    }

    this.isThinking = true
    this.thinkingStartTime = Date.now()
    logger.info(`🤔 Started thinking mode (${this.thinkingDuration / 1000}s)`)

    this.thinkingTimeout = window.setTimeout(() => {
      this.stopThinking()
    }, this.thinkingDuration)
  }

  /**
   * Stop thinking mode
   */
  stopThinking(): void {
    if (this.thinkingTimeout !== null) {
      clearTimeout(this.thinkingTimeout)
      this.thinkingTimeout = null
    }

    this.isThinking = false
    logger.info('💭 Stopped thinking mode')
  }

  /**
   * Cleanup and dispose resources
   */
  dispose(): void {
    this.disableClickInteraction()
    this.stopThinking()
    this.stopAnimation()
    this.mesh.geometry.dispose()

    this.skins.forEach(material => material.dispose())
    this.skins.clear()
    if (this.backgroundTexture) {
      this.backgroundTexture.dispose()
      this.backgroundTexture = null
    }

    if (this.lights) {
      this.options.scene.remove(this.lights.x)
      this.options.scene.remove(this.lights.y)
      this.options.scene.remove(this.lights.z)
      this.lights = null
    }
  }
}
