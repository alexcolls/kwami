/**
 * Black Hole Renderer
 * 
 * A stunning black hole visualization featuring:
 * - Event horizon with fresnel glow
 * - Animated accretion disk with turbulent noise
 * - Massive star field with twinkling
 * - Gravitational lensing post-processing effect
 * - Audio reactivity for immersive experiences
 */

import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import type {
  BlackHoleConfig,
  BlackHoleOptions,
  BlackHoleDiskColors,
  DiskShaderUniforms,
  StarShaderUniforms,
  EventHorizonShaderUniforms,
  LensingShaderUniforms,
  BlackHoleColorScheme,
} from './types.js'
import {
  getDefaultBlackHoleConfig,
  getColorsForScheme,
  getEffectsForScheme,
} from './config.js'
import {
  createDiskUniforms,
  createDiskMaterial,
  createStarUniforms,
  createStarMaterial,
  createEventHorizonUniforms,
  createEventHorizonMaterial,
  lensingShader,
  updateDiskColors,
} from './materials.js'
import type { KwamiState } from '../../../types/index.js'

// Star color palette
const STAR_PALETTE = [
  new THREE.Color(0x88aaff),
  new THREE.Color(0xffaaff),
  new THREE.Color(0xaaffff),
  new THREE.Color(0xffddaa),
  new THREE.Color(0xffeecc),
  new THREE.Color(0xffffff),
  new THREE.Color(0xff8888),
  new THREE.Color(0x88ff88),
  new THREE.Color(0xffff88),
  new THREE.Color(0x88ffff),
]

export class BlackHole {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  
  // Three.js objects
  private blackHoleMesh!: THREE.Mesh
  private eventHorizonMesh!: THREE.Mesh
  private accretionDiskMesh!: THREE.Mesh
  private starPoints!: THREE.Points
  private group: THREE.Group
  
  // Shader uniforms
  private diskUniforms!: DiskShaderUniforms
  private starUniforms!: StarShaderUniforms
  private eventHorizonUniforms!: EventHorizonShaderUniforms
  private lensingUniforms!: LensingShaderUniforms
  
  // Post-processing (internal)
  private composer: EffectComposer
  private bloomPass: UnrealBloomPass
  private lensingPass: ShaderPass
  
  // Configuration
  private config: BlackHoleConfig
  
  // Animation state
  private clock = new THREE.Clock()
  private blackHoleScreenPos = new THREE.Vector3()
  private disposed = false
  private animationFrameId: number | null = null
  
  // Audio reactivity
  public audioEffects: BlackHoleConfig['audioEffects']
  private audioBass = 0
  private audioMid = 0
  private audioHigh = 0
  
  // Orientation (base rotation in radians)
  public orientation = { x: 0, y: 0, z: 0 }
  
  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    options: BlackHoleOptions = {}
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    
    // Merge options with defaults
    const defaults = getDefaultBlackHoleConfig()
    this.config = {
      colorScheme: { ...defaults.colorScheme, ...options.colorScheme },
      core: { ...defaults.core, ...options.core },
      disk: { ...defaults.disk, ...options.disk },
      colors: { ...defaults.colors, ...options.colors },
      stars: { ...defaults.stars, ...options.stars },
      animation: { ...defaults.animation, ...options.animation },
      effects: { ...defaults.effects, ...options.effects },
      audioEffects: { ...defaults.audioEffects, ...options.audioEffects },
      scale: options.scale ?? defaults.scale,
    }
    
    // Apply color scheme if specified
    if (options.colorScheme?.scheme) {
      this.config.colors = getColorsForScheme(options.colorScheme.scheme)
      const schemeEffects = getEffectsForScheme(options.colorScheme.scheme)
      this.config.effects = { ...this.config.effects, ...schemeEffects }
    }
    
    this.audioEffects = this.config.audioEffects
    
    // Create group for organization
    this.group = new THREE.Group()
    this.group.scale.setScalar(this.config.scale)
    this.scene.add(this.group)
    
    // Initialize components
    this.createBlackHole()
    this.createEventHorizon()
    this.createAccretionDisk()
    this.createStarField()
    
    // Setup post-processing
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.renderer.domElement.width, this.renderer.domElement.height),
      this.config.effects.bloomIntensity,
      this.config.effects.bloomRadius,
      this.config.effects.bloomThreshold
    )
    this.composer.addPass(this.bloomPass)
    
    this.lensingPass = new ShaderPass(lensingShader)
    this.lensingUniforms = this.lensingPass.uniforms as unknown as LensingShaderUniforms
    this.lensingUniforms.lensingStrength.value = this.config.effects.lensingStrength
    this.lensingUniforms.lensingRadius.value = this.config.effects.lensingRadius
    this.lensingUniforms.chromaticAberration.value = this.config.effects.chromaticAberration
    this.lensingUniforms.aspectRatio.value = this.renderer.domElement.width / this.renderer.domElement.height
    this.composer.addPass(this.lensingPass)
    
    // Configure renderer for better visuals
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.2
    
    // Start animation loop
    this.startAnimation()
  }
  
  // =====================================================
  // INITIALIZATION
  // =====================================================
  
  private createBlackHole(): void {
    // Use blackHoleRadius if available, otherwise fall back to radius
    const bhRadius = this.config.core.blackHoleRadius ?? this.config.core.radius
    const geometry = new THREE.SphereGeometry(bhRadius, 128, 64)
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 })
    this.blackHoleMesh = new THREE.Mesh(geometry, material)
    this.blackHoleMesh.renderOrder = 0
    this.group.add(this.blackHoleMesh)
  }
  
  private createEventHorizon(): void {
    // Use eventHorizonRadius if available, otherwise fall back to radius * 1.05
    const ehRadius = this.config.core.eventHorizonRadius ?? (this.config.core.radius * 1.05)
    const geometry = new THREE.SphereGeometry(ehRadius, 128, 64)
    this.eventHorizonUniforms = createEventHorizonUniforms(
      this.config.core.glowIntensity,
      this.config.core.pulseSpeed,
      this.camera.position
    )
    const material = createEventHorizonMaterial(this.eventHorizonUniforms)
    this.eventHorizonMesh = new THREE.Mesh(geometry, material)
    this.group.add(this.eventHorizonMesh)
  }
  
  private createAccretionDisk(): void {
    // Use blackHoleRadius for disk inner calculation
    const bhRadius = this.config.core.blackHoleRadius ?? this.config.core.radius
    const innerRadius = bhRadius + this.config.disk.innerRadius
    const outerRadius = this.config.disk.outerRadius
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 256, 128)
    this.diskUniforms = createDiskUniforms(
      innerRadius,
      outerRadius,
      this.config.colors,
      this.config.disk.flowSpeed,
      this.config.disk.noiseScale,
      this.config.disk.density
    )
    const material = createDiskMaterial(this.diskUniforms)
    
    this.accretionDiskMesh = new THREE.Mesh(geometry, material)
    this.accretionDiskMesh.rotation.x = this.config.disk.tiltAngle
    this.accretionDiskMesh.renderOrder = 1
    this.group.add(this.accretionDiskMesh)
  }
  
  private createStarField(): void {
    const geometry = new THREE.BufferGeometry()
    const count = this.config.stars.count
    const fieldRadius = this.config.stars.fieldRadius
    
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const twinkle = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Spherical distribution
      const phi = Math.acos(-1 + (2 * i) / count)
      const theta = Math.sqrt(count * Math.PI) * phi
      const radius = Math.cbrt(Math.random()) * fieldRadius + 100
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      // Random color from palette
      const starColor = STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)].clone()
      starColor.multiplyScalar(Math.random() * 0.7 + 0.3)
      colors[i3] = starColor.r
      colors[i3 + 1] = starColor.g
      colors[i3 + 2] = starColor.b
      
      sizes[i] = THREE.MathUtils.randFloat(0.6, 3.0)
      twinkle[i] = Math.random() * Math.PI * 2
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('twinkle', new THREE.BufferAttribute(twinkle, 1))
    
    this.starUniforms = createStarUniforms(
      this.renderer.getPixelRatio(),
      this.config.stars.twinkleSpeed
    )
    const material = createStarMaterial(this.starUniforms)
    
    this.starPoints = new THREE.Points(geometry, material)
    this.scene.add(this.starPoints) // Add to scene, not group (background)
  }
  
  // =====================================================
  // ANIMATION
  // =====================================================
  
  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      if (this.disposed) return
      
      // Update all animation
      this.update()
      
      // Render through post-processing composer
      this.composer.render()
      
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
  
  public update(deltaTime?: number): void {
    if (this.disposed) return
    
    const dt = deltaTime ?? this.clock.getDelta()
    const elapsedTime = this.clock.getElapsedTime()
    
    // Update audio smoothing
    this.updateAudio()
    
    // Update shader uniforms
    this.diskUniforms.uTime.value = elapsedTime
    this.starUniforms.uTime.value = elapsedTime
    this.eventHorizonUniforms.uTime.value = elapsedTime
    this.eventHorizonUniforms.uCameraPosition.value.copy(this.camera.position)
    
    // Audio reactivity
    if (this.audioEffects.enabled) {
      this.diskUniforms.uAudioBass.value = this.audioBass * this.audioEffects.bassDiskGlow
      this.diskUniforms.uAudioMid.value = this.audioMid * this.audioEffects.midDiskSpeed
      this.starUniforms.uAudioHigh.value = this.audioHigh * this.audioEffects.highStarTwinkle
      this.eventHorizonUniforms.uAudioBass.value = this.audioBass * this.audioEffects.bassDiskGlow
    }
    
    // Rotate disk
    this.accretionDiskMesh.rotation.z += dt * this.config.animation.diskRotationSpeed
    
    // Rotate stars slowly
    this.starPoints.rotation.y += dt * this.config.animation.starsRotationSpeed
    this.starPoints.rotation.x += dt * this.config.animation.starsRotationSpeed * 0.3
    
    // Update lensing position
    this.blackHoleScreenPos.copy(this.blackHoleMesh.position)
    this.blackHoleScreenPos.applyMatrix4(this.group.matrixWorld)
    this.blackHoleScreenPos.project(this.camera)
    
    this.lensingUniforms.blackHoleScreenPos.value.set(
      (this.blackHoleScreenPos.x + 1) / 2,
      (this.blackHoleScreenPos.y + 1) / 2
    )
  }
  
  private updateAudio(): void {
    // Values are set externally via setAudioLevels()
    // Smoothing is applied in setAudioLevels method
  }
  
  // =====================================================
  // PUBLIC API
  // =====================================================
  
  public setState(state: KwamiState): void {
    // Adjust visuals based on state
    const reactivity = this.config.audioEffects.reactivity
    switch (state) {
      case 'listening':
        this.config.animation.diskRotationSpeed = 0.008
        this.audioEffects.reactivity = reactivity * 1.5
        break
      case 'thinking':
        this.config.animation.diskRotationSpeed = 0.015
        this.diskUniforms.uFlowSpeed.value = this.config.disk.flowSpeed * 1.5
        break
      case 'speaking':
        this.config.animation.diskRotationSpeed = 0.01
        this.audioEffects.reactivity = reactivity * 2.0
        break
      case 'idle':
      default:
        this.config.animation.diskRotationSpeed = 0.005
        this.diskUniforms.uFlowSpeed.value = this.config.disk.flowSpeed
        this.audioEffects.reactivity = reactivity
    }
  }
  
  public setAudioLevels(bass: number, mid: number, high: number): void {
    const smoothing = this.audioEffects.smoothing
    this.audioBass = THREE.MathUtils.lerp(this.audioBass, bass, 1 - smoothing)
    this.audioMid = THREE.MathUtils.lerp(this.audioMid, mid, 1 - smoothing)
    this.audioHigh = THREE.MathUtils.lerp(this.audioHigh, high, 1 - smoothing)
  }
  
  // Setters for configuration
  public setColorScheme(scheme: BlackHoleColorScheme): void {
    this.config.colorScheme.scheme = scheme
    this.config.colors = getColorsForScheme(scheme)
    const schemeEffects = getEffectsForScheme(scheme)
    Object.assign(this.config.effects, schemeEffects)
    updateDiskColors(this.diskUniforms, this.config.colors)
    this.updateEffects()
  }
  
  public setColors(colors: Partial<BlackHoleDiskColors>): void {
    Object.assign(this.config.colors, colors)
    updateDiskColors(this.diskUniforms, this.config.colors)
  }
  
  /**
   * Set both black hole and event horizon radius together (convenience method)
   */
  public setCoreRadius(radius: number): void {
    this.config.core.radius = radius
    this.setBlackHoleRadius(radius)
    this.setEventHorizonRadius(radius * 1.05)
  }
  
  /**
   * Set only the black hole center sphere radius
   */
  public setBlackHoleRadius(radius: number): void {
    this.config.core.blackHoleRadius = radius
    
    // Rebuild black hole mesh geometry
    this.blackHoleMesh.geometry.dispose()
    this.blackHoleMesh.geometry = new THREE.SphereGeometry(radius, 128, 64)
    
    // Also update event horizon to maintain proportion (slightly larger than black hole)
    const eventHorizonRadius = radius * 1.05
    this.config.core.eventHorizonRadius = eventHorizonRadius
    this.eventHorizonMesh.geometry.dispose()
    this.eventHorizonMesh.geometry = new THREE.SphereGeometry(eventHorizonRadius, 128, 64)
    
    // Update disk inner radius based on black hole
    const innerRadius = radius + this.config.disk.innerRadius
    const outerRadius = this.config.disk.outerRadius
    this.diskUniforms.uInnerRadius.value = innerRadius
    
    // Rebuild accretion disk geometry
    this.accretionDiskMesh.geometry.dispose()
    this.accretionDiskMesh.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 256, 128)
  }
  
  /**
   * Set only the event horizon glow shell radius
   */
  public setEventHorizonRadius(radius: number): void {
    this.config.core.eventHorizonRadius = radius
    
    // Rebuild event horizon geometry
    this.eventHorizonMesh.geometry.dispose()
    this.eventHorizonMesh.geometry = new THREE.SphereGeometry(radius, 128, 64)
  }
  
  public setDiskOuterRadius(radius: number): void {
    this.config.disk.outerRadius = radius
    
    const innerRadius = this.config.core.radius + this.config.disk.innerRadius
    this.diskUniforms.uOuterRadius.value = radius
    
    // Rebuild accretion disk geometry
    this.accretionDiskMesh.geometry.dispose()
    this.accretionDiskMesh.geometry = new THREE.RingGeometry(innerRadius, radius, 256, 128)
  }
  
  public setDiskInnerRadius(offset: number): void {
    this.config.disk.innerRadius = offset
    
    const innerRadius = this.config.core.radius + offset
    const outerRadius = this.config.disk.outerRadius
    this.diskUniforms.uInnerRadius.value = innerRadius
    
    // Rebuild accretion disk geometry
    this.accretionDiskMesh.geometry.dispose()
    this.accretionDiskMesh.geometry = new THREE.RingGeometry(innerRadius, outerRadius, 256, 128)
  }
  
  public setGlowIntensity(intensity: number): void {
    this.config.core.glowIntensity = intensity
    this.eventHorizonUniforms.uGlowIntensity.value = intensity
  }
  
  public setPulseSpeed(speed: number): void {
    this.config.core.pulseSpeed = speed
    this.eventHorizonUniforms.uPulseSpeed.value = speed
  }
  
  public setDiskFlowSpeed(speed: number): void {
    this.config.disk.flowSpeed = speed
    this.diskUniforms.uFlowSpeed.value = speed
  }
  
  public setDiskNoiseScale(scale: number): void {
    this.config.disk.noiseScale = scale
    this.diskUniforms.uNoiseScale.value = scale
  }
  
  public setDiskDensity(density: number): void {
    this.config.disk.density = density
    this.diskUniforms.uDensity.value = density
  }
  
  public setDiskTiltAngle(angle: number): void {
    this.config.disk.tiltAngle = angle
    this.accretionDiskMesh.rotation.x = angle
  }
  
  public setTwinkleSpeed(speed: number): void {
    this.config.stars.twinkleSpeed = speed
    this.starUniforms.uTwinkleSpeed.value = speed
  }
  
  public setAutoRotate(enabled: boolean): void {
    this.config.animation.autoRotate = enabled
  }
  
  public setDiskRotationSpeed(speed: number): void {
    this.config.animation.diskRotationSpeed = speed
  }
  
  public setStarsRotationSpeed(speed: number): void {
    this.config.animation.starsRotationSpeed = speed
  }
  
  public setBloomIntensity(intensity: number): void {
    this.config.effects.bloomIntensity = intensity
    this.bloomPass.strength = intensity
  }
  
  public setBloomThreshold(threshold: number): void {
    this.config.effects.bloomThreshold = threshold
    this.bloomPass.threshold = threshold
  }
  
  public setBloomRadius(radius: number): void {
    this.config.effects.bloomRadius = radius
    this.bloomPass.radius = radius
  }
  
  public setLensingStrength(strength: number): void {
    this.config.effects.lensingStrength = strength
    this.lensingUniforms.lensingStrength.value = strength
  }
  
  public setLensingRadius(radius: number): void {
    this.config.effects.lensingRadius = radius
    this.lensingUniforms.lensingRadius.value = radius
  }
  
  public setChromaticAberration(amount: number): void {
    this.config.effects.chromaticAberration = amount
    this.lensingUniforms.chromaticAberration.value = amount
  }
  
  public setScale(scale: number): void {
    this.config.scale = scale
    this.group.scale.setScalar(scale)
  }
  
  /**
   * Set camera zoom level (affects how close/far the view appears)
   */
  public setCameraZoom(zoom: number): void {
    this.camera.zoom = zoom
    this.camera.updateProjectionMatrix()
  }
  
  /**
   * Get current camera zoom level
   */
  public getCameraZoom(): number {
    return this.camera.zoom
  }
  
  public setAudioEnabled(enabled: boolean): void {
    this.audioEffects.enabled = enabled
    if (!enabled) {
      this.diskUniforms.uAudioBass.value = 0
      this.diskUniforms.uAudioMid.value = 0
      this.starUniforms.uAudioHigh.value = 0
      this.eventHorizonUniforms.uAudioBass.value = 0
    }
  }
  
  public setAudioReactivity(reactivity: number): void {
    this.audioEffects.reactivity = reactivity
  }
  
  private updateEffects(): void {
    this.bloomPass.strength = this.config.effects.bloomIntensity
    this.bloomPass.threshold = this.config.effects.bloomThreshold
    this.bloomPass.radius = this.config.effects.bloomRadius
    this.lensingUniforms.lensingStrength.value = this.config.effects.lensingStrength
    this.lensingUniforms.lensingRadius.value = this.config.effects.lensingRadius
    this.lensingUniforms.chromaticAberration.value = this.config.effects.chromaticAberration
  }
  
  // Getters
  public getColorScheme(): { scheme: BlackHoleColorScheme } {
    return { ...this.config.colorScheme }
  }
  
  public getColors(): BlackHoleDiskColors {
    return { ...this.config.colors }
  }
  
  public getScale(): number {
    return this.config.scale
  }
  
  public getConfig(): BlackHoleConfig {
    return JSON.parse(JSON.stringify(this.config))
  }
  
  public getGroup(): THREE.Group {
    return this.group
  }
  
  public getMesh(): THREE.Mesh {
    return this.blackHoleMesh
  }
  
  /**
   * Set base orientation (in radians)
   */
  public setOrientation(x: number, y: number, z: number): void {
    this.orientation = { x, y, z }
    // Apply orientation directly to group
    this.group.rotation.x = x
    this.group.rotation.y = y
    this.group.rotation.z = z
  }
  
  /**
   * Get base orientation
   */
  public getOrientation(): { x: number; y: number; z: number } {
    return { ...this.orientation }
  }
  
  // Handle resize
  public onResize(width: number, height: number): void {
    this.composer.setSize(width, height)
    this.bloomPass.resolution.set(width, height)
    this.lensingUniforms.aspectRatio.value = width / height
    this.starUniforms.uPixelRatio.value = this.renderer.getPixelRatio()
  }
  
  // =====================================================
  // CLEANUP
  // =====================================================
  
  public dispose(): void {
    if (this.disposed) return
    this.disposed = true
    
    // Stop animation loop
    this.stopAnimation()
    
    // Dispose post-processing
    this.composer.dispose()
    this.bloomPass.dispose()
    
    // Dispose geometries
    this.blackHoleMesh.geometry.dispose()
    this.eventHorizonMesh.geometry.dispose()
    this.accretionDiskMesh.geometry.dispose()
    this.starPoints.geometry.dispose()
    
    // Dispose materials
    ;(this.blackHoleMesh.material as THREE.Material).dispose()
    ;(this.eventHorizonMesh.material as THREE.Material).dispose()
    ;(this.accretionDiskMesh.material as THREE.Material).dispose()
    ;(this.starPoints.material as THREE.Material).dispose()
    
    // Remove from scene
    this.group.remove(this.blackHoleMesh)
    this.group.remove(this.eventHorizonMesh)
    this.group.remove(this.accretionDiskMesh)
    this.scene.remove(this.starPoints)
    this.scene.remove(this.group)
  }
}
