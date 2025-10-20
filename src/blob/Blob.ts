import { Mesh, Color, type ShaderMaterial } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createBlobGeometry } from './geometry';
import { animateBlob } from './animation';
import { createSkin } from './skins';
import { defaultBlobConfig } from './config';
import {
  getRandomBetween,
  getRandomBoolean,
  getRandomHexColor,
  genDNA,
} from '../utils/randoms';
import type { BlobOptions, BlobSkinType } from '../types';

/**
 * Blob - The 3D visual body of Kwami
 * A morphing sphere that reacts to audio and can have different skins
 */
export class Blob {
  private mesh: Mesh;
  private config = defaultBlobConfig;
  private currentSkin: BlobSkinType;
  private skins: Map<BlobSkinType, ShaderMaterial> = new Map();
  private animationFrameId: number | null = null;

  // Animation parameters
  public spikes = { x: 0.2, y: 0.2, z: 0.2 };
  public time = { x: 1, y: 1, z: 1 };
  public rotation = { x: 0, y: 0, z: 0 };
  public colors = { x: '#ff0000', y: '#00ff00', z: '#0000ff' };
  public dna = '';

  constructor(private options: BlobOptions) {
    this.currentSkin = options.skin || 'tricolor';

    // Initialize skins
    this.initializeSkins();

    // Create geometry
    const geometry = createBlobGeometry(
      options.resolution || this.config.resolution.default,
    );

    // Create mesh with initial skin
    const material = this.skins.get(this.currentSkin)!;
    this.mesh = new Mesh(geometry, material);

    // Apply initial configuration
    if (options.spikes) this.spikes = options.spikes;
    if (options.time) this.time = options.time;
    if (options.rotation) this.rotation = options.rotation;

    // Start animation loop
    this.startAnimation();
  }

  /**
   * Initialize all available skins
   */
  private initializeSkins(): void {
    // Tricolor skin
    const tricolorConfig = this.config.skins.tricolor;
    this.skins.set('tricolor', createSkin('tricolor', tricolorConfig));

    // Zebra skin
    const zebraConfig = this.config.skins.zebra;
    this.skins.set('zebra', createSkin('zebra', zebraConfig));
  }

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    const animate = () => {
      const analyser = this.options.audio.getAnalyser();
      if (analyser) {
        const frequencyData = this.options.audio.getFrequencyData();
        animateBlob(
          this.mesh,
          frequencyData,
          analyser,
          this.spikes.x,
          this.spikes.y,
          this.spikes.z,
          this.time.x,
          this.time.y,
          this.time.z,
        );
      }

      // Apply rotation
      this.mesh.rotation.x += this.rotation.x;
      this.mesh.rotation.y += this.rotation.y;
      this.mesh.rotation.z += this.rotation.z;

      // Render
      this.options.renderer.render(this.options.scene, this.options.camera);

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  /**
   * Stop the animation loop
   */
  private stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Get the THREE.js mesh
   */
  getMesh(): Mesh {
    return this.mesh;
  }

  /**
   * Change the blob's skin
   */
  setSkin(skin: BlobSkinType): void {
    const material = this.skins.get(skin);
    if (material) {
      this.currentSkin = skin;
      this.mesh.material = material;
    }
  }

  /**
   * Get current skin type
   */
  getCurrentSkin(): BlobSkinType {
    return this.currentSkin;
  }

  /**
   * Set spike values for noise frequency
   */
  setSpikes(x: number, y: number, z: number): void {
    this.spikes = { x, y, z };
  }

  /**
   * Set time values for animation speed
   */
  setTime(x: number, y: number, z: number): void {
    this.time = { x, y, z };
  }

  /**
   * Set rotation speed
   */
  setRotation(x: number, y: number, z: number): void {
    this.rotation = { x, y, z };
  }

  /**
   * Set colors (for tricolor skin)
   */
  setColors(x: string, y: string, z: string): void {
    this.colors = { x, y, z };
    const tricolorMaterial = this.skins.get('tricolor') as ShaderMaterial;
    if (tricolorMaterial) {
      tricolorMaterial.uniforms._color1.value = new Color(x);
      tricolorMaterial.uniforms._color2.value = new Color(y);
      tricolorMaterial.uniforms._color3.value = new Color(z);
    }
  }

  /**
   * Set a single color by axis
   */
  setColor(axis: 'x' | 'y' | 'z', color: string): void {
    this.colors[axis] = color;
    const tricolorMaterial = this.skins.get('tricolor') as ShaderMaterial;
    if (tricolorMaterial) {
      const uniformMap = { x: '_color1', y: '_color2', z: '_color3' };
      tricolorMaterial.uniforms[uniformMap[axis]].value = new Color(color);
    }
  }

  /**
   * Set mesh resolution (number of segments)
   */
  setResolution(resolution: number): void {
    const geometry = createBlobGeometry(resolution);
    this.mesh.geometry.dispose();
    this.mesh.geometry = geometry;
  }

  /**
   * Set wireframe mode
   */
  setWireframe(wireframe: boolean): void {
    (this.mesh.material as ShaderMaterial).wireframe = wireframe;
  }

  /**
   * Set shininess (for specular highlights)
   */
  setShininess(value: number): void {
    const material = this.mesh.material as ShaderMaterial;
    if (material.uniforms.shininess) {
      material.uniforms.shininess.value = value;
    }
  }

  /**
   * Generate random blob appearance
   */
  setRandomBlob(): void {
    this.dna = genDNA();

    // Random spikes
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
    };

    // Random time
    this.time = {
      x: getRandomBetween(0, 5, 1),
      y: getRandomBetween(0, 5, 1),
      z: getRandomBetween(0, 5, 1),
    };

    // Random rotation
    if (getRandomBoolean()) {
      this.rotation = {
        x: getRandomBetween(0, 0.01, 3),
        y: getRandomBetween(0, 0.01, 3),
        z: getRandomBetween(0, 0.01, 3),
      };
    } else {
      this.rotation = { x: 0, y: 0, z: 0 };
    }

    // Random resolution
    const resolution = getRandomBetween(
      this.config.resolution.min,
      this.config.resolution.max,
    );
    this.setResolution(resolution);

    // Random colors
    this.setColors(
      getRandomHexColor(),
      getRandomHexColor(),
      getRandomHexColor(),
    );

    // Random shininess
    this.setShininess(getRandomBetween(0, 100000, 1));

    // Random wireframe
    this.setWireframe(getRandomBoolean(0.1));
  }

  /**
   * Export blob as GLTF file
   */
  exportGLTF(): void {
    const exporter = new GLTFExporter();

    exporter.parse(
      this.options.scene,
      (result) => {
        const blob = new Blob([result as ArrayBuffer], {
          type: 'model/gltf-binary',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'kwami-blob.glb';
        link.click();
      },
      (error) => {
        console.error('Failed to export GLTF:', error);
      },
      { binary: true },
    );
  }

  /**
   * Cleanup and dispose resources
   */
  dispose(): void {
    this.stopAnimation();
    this.mesh.geometry.dispose();

    // Dispose all skin materials
    this.skins.forEach(material => material.dispose());
    this.skins.clear();
  }
}
