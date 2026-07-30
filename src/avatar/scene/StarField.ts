/**
 * StarField - A reusable 3D star field effect
 * 
 * Creates a sphere of twinkling stars that surrounds the scene.
 * Can be enabled independently of the avatar renderer.
 */

import * as THREE from 'three'

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

export interface StarFieldConfig {
  count?: number
  fieldRadius?: number
  minSize?: number
  maxSize?: number
  twinkleSpeed?: number
  rotationSpeed?: number
  colorPalette?: THREE.Color[]
}

interface StarShaderUniforms {
  [uniform: string]: THREE.IUniform<number>
  uTime: THREE.IUniform<number>
  uPixelRatio: THREE.IUniform<number>
  uTwinkleSpeed: THREE.IUniform<number>
  uAudioHigh: THREE.IUniform<number>
}

const defaultConfig: Required<StarFieldConfig> = {
  count: 8000,
  fieldRadius: 500,
  minSize: 0.6,
  maxSize: 3.0,
  twinkleSpeed: 1.5,
  rotationSpeed: 0.0003,
  colorPalette: STAR_PALETTE,
}

export class StarField {
  private scene: THREE.Scene
  private renderer: THREE.WebGLRenderer
  private starPoints: THREE.Points | null = null
  private uniforms: StarShaderUniforms | null = null
  private config: Required<StarFieldConfig>
  private clock = new THREE.Clock()
  private disposed = false
  private _enabled = false

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    config?: StarFieldConfig
  ) {
    this.scene = scene
    this.renderer = renderer
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Check if star field is enabled
   */
  get enabled(): boolean {
    return this._enabled
  }

  /**
   * Enable the star field
   */
  enable(): void {
    if (this._enabled || this.disposed) return
    this._enabled = true
    this.createStarField()
  }

  /**
   * Disable the star field
   */
  disable(): void {
    if (!this._enabled) return
    this._enabled = false
    this.removeStarField()
  }

  /**
   * Toggle the star field
   */
  toggle(): void {
    if (this._enabled) {
      this.disable()
    } else {
      this.enable()
    }
  }

  /**
   * Create the star field geometry and material
   */
  private createStarField(): void {
    const geometry = new THREE.BufferGeometry()
    const { count, fieldRadius, minSize, maxSize, colorPalette } = this.config

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
      const starColor = colorPalette[Math.floor(Math.random() * colorPalette.length)].clone()
      starColor.multiplyScalar(Math.random() * 0.7 + 0.3)
      colors[i3] = starColor.r
      colors[i3 + 1] = starColor.g
      colors[i3 + 2] = starColor.b

      sizes[i] = THREE.MathUtils.randFloat(minSize, maxSize)
      twinkle[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('twinkle', new THREE.BufferAttribute(twinkle, 1))

    this.uniforms = this.createUniforms()
    const material = this.createMaterial()

    this.starPoints = new THREE.Points(geometry, material)
    this.scene.add(this.starPoints)
  }

  /**
   * Remove the star field from the scene
   */
  private removeStarField(): void {
    if (this.starPoints) {
      this.scene.remove(this.starPoints)
      this.starPoints.geometry.dispose()
      ;(this.starPoints.material as THREE.Material).dispose()
      this.starPoints = null
      this.uniforms = null
    }
  }

  /**
   * Create shader uniforms
   */
  private createUniforms(): StarShaderUniforms {
    return {
      uTime: { value: 0 },
      uPixelRatio: { value: this.renderer.getPixelRatio() },
      uTwinkleSpeed: { value: this.config.twinkleSpeed },
      uAudioHigh: { value: 0 },
    }
  }

  /**
   * Create the star shader material
   */
  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: this.uniforms!,
      vertexShader: `
        attribute float size;
        attribute float twinkle;
        varying vec3 vColor;
        varying float vTwinkle;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform float uTwinkleSpeed;
        uniform float uAudioHigh;
        
        void main() {
          vColor = color;
          vTwinkle = twinkle;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Twinkle effect
          float twinkleFactor = 0.5 + 0.5 * sin(uTime * uTwinkleSpeed + twinkle * 6.28);
          twinkleFactor = mix(twinkleFactor, 1.0, uAudioHigh);
          
          gl_PointSize = size * uPixelRatio * twinkleFactor * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        
        void main() {
          // Soft circular point
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= alpha; // More falloff
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })
  }

  /**
   * Update the star field animation
   */
  update(deltaTime?: number): void {
    if (!this._enabled || !this.starPoints || !this.uniforms) return

    const dt = deltaTime ?? this.clock.getDelta()
    const elapsedTime = this.clock.getElapsedTime()

    this.uniforms.uTime.value = elapsedTime

    // Slow rotation
    this.starPoints.rotation.y += dt * this.config.rotationSpeed
    this.starPoints.rotation.x += dt * this.config.rotationSpeed * 0.3
  }

  /**
   * Set audio reactivity level (0-1)
   */
  setAudioLevel(level: number): void {
    if (this.uniforms) {
      this.uniforms.uAudioHigh.value = level
    }
  }

  // Configuration setters
  setCount(count: number): void {
    this.config.count = count
    if (this._enabled) {
      this.removeStarField()
      this.createStarField()
    }
  }

  setFieldRadius(radius: number): void {
    this.config.fieldRadius = radius
    if (this._enabled) {
      this.removeStarField()
      this.createStarField()
    }
  }

  setTwinkleSpeed(speed: number): void {
    this.config.twinkleSpeed = speed
    if (this.uniforms) {
      this.uniforms.uTwinkleSpeed.value = speed
    }
  }

  setRotationSpeed(speed: number): void {
    this.config.rotationSpeed = speed
  }

  setMinSize(size: number): void {
    this.config.minSize = size
    if (this._enabled) {
      this.removeStarField()
      this.createStarField()
    }
  }

  setMaxSize(size: number): void {
    this.config.maxSize = size
    if (this._enabled) {
      this.removeStarField()
      this.createStarField()
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<StarFieldConfig> {
    return { ...this.config }
  }

  /**
   * Handle resize
   */
  onResize(): void {
    if (this.uniforms) {
      this.uniforms.uPixelRatio.value = this.renderer.getPixelRatio()
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.removeStarField()
  }
}
