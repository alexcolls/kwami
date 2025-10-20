import type {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
} from 'three';
import { KwamiAudio } from './Audio';
import { Blob } from '../blob/Blob.js';
import { setupScene } from '../scene/setup.js';
import type { BodyConfig, BlobSkinType } from '../types/index';

/**
 * KwamiBody - Manages the 3D visual representation of Kwami
 * Handles the THREE.js scene, renderer, camera, and the blob mesh
 */
export class KwamiBody {
  private canvas: HTMLCanvasElement;
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private scene: Scene;
  private resizeObserver?: ResizeObserver;

  public audio: KwamiAudio;
  public blob: Blob;

  constructor(canvas: HTMLCanvasElement, config?: BodyConfig) {
    this.canvas = canvas;

    // Setup the 3D scene
    const sceneSetup = setupScene(this.canvas, config?.scene);
    this.renderer = sceneSetup.renderer;
    this.camera = sceneSetup.camera;
    this.scene = sceneSetup.scene;

    // Initialize audio
    this.audio = new KwamiAudio(config?.audioFiles || [], config?.audio);

    // Create the blob
    this.blob = new Blob({
      scene: this.scene,
      camera: this.camera,
      renderer: this.renderer,
      audio: this.audio,
      skin: config?.initialSkin || 'tricolor',
      ...config?.blob,
    });

    // Add blob to scene
    this.scene.add(this.blob.getMesh());

    // Setup resize handling
    this.setupResize();
  }

  /**
   * Setup automatic resize handling
   */
  private setupResize(): void {
    const handleResize = () => {
      const width = this.canvas.clientWidth;
      const height = this.canvas.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    };

    // Use ResizeObserver for better resize handling
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(handleResize);
      this.resizeObserver.observe(this.canvas);
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', handleResize);
    }

    // Initial resize
    handleResize();
  }

  /**
   * Change the blob's skin
   */
  setSkin(skin: BlobSkinType): void {
    this.blob.setSkin(skin);
  }

  /**
   * Get the THREE.js scene
   */
  getScene(): Scene {
    return this.scene;
  }

  /**
   * Get the THREE.js camera
   */
  getCamera(): PerspectiveCamera {
    return this.camera;
  }

  /**
   * Get the THREE.js renderer
   */
  getRenderer(): WebGLRenderer {
    return this.renderer;
  }

  /**
   * Export the blob as GLB file
   */
  exportAsGLB(): void {
    this.blob.exportGLTF();
  }

  /**
   * Cleanup and dispose all resources
   */
  dispose(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    this.blob.dispose();
    this.audio.dispose();
    this.renderer.dispose();

    // Clear scene
    while (this.scene.children.length > 0) {
      const child = this.scene.children[0];
      if (child) {
        this.scene.remove(child);
      }
    }
  }
}
