import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  DirectionalLight,
  AmbientLight,
  PCFSoftShadowMap,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import type { SceneConfig } from '../types';

/**
 * Setup the THREE.js scene with renderer, camera, lights, and optional controls
 */
export function setupScene(canvas: HTMLCanvasElement, config?: SceneConfig) {
  const renderer = createRenderer(canvas, config);
  const camera = createCamera(canvas, config);
  const scene = new Scene();
  const lights = createLights(config);

  // Add lights to scene
  scene.add(lights.top);
  scene.add(lights.bottom);
  scene.add(lights.ambient);

  // Optional orbit controls
  const controls = config?.enableControls !== false
    ? createControls(camera, renderer)
    : null;

  return { renderer, camera, scene, lights, controls };
}

/**
 * Create and configure the WebGL renderer
 */
function createRenderer(
  canvas: HTMLCanvasElement,
  config?: SceneConfig,
): WebGLRenderer {
  const renderer = new WebGLRenderer({
    canvas,
    context: canvas.getContext('webgl2')!,
    antialias: true,
    alpha: true,
  });

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio || 1);

  if (config?.enableShadows !== false) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
  }

  return renderer;
}

/**
 * Create and configure the perspective camera
 */
function createCamera(
  canvas: HTMLCanvasElement,
  config?: SceneConfig,
): PerspectiveCamera {
  const fov = config?.fov || 100;
  const near = config?.near || 0.1;
  const far = config?.far || 1000;

  const camera = new PerspectiveCamera(
    fov,
    canvas.clientWidth / canvas.clientHeight,
    near,
    far,
  );

  const position = config?.cameraPosition || { x: 0, y: 6, z: 0 };
  camera.position.set(position.x, position.y, position.z);

  return camera;
}

/**
 * Create and configure scene lighting
 */
function createLights(config?: SceneConfig) {
  const intensity = config?.lightIntensity || {};
  const topIntensity = intensity.top ?? 0.7;
  const bottomIntensity = intensity.bottom ?? 0.4;
  const ambientIntensity = intensity.ambient ?? 1;

  const top = new DirectionalLight(0xFFFFFF, topIntensity);
  top.position.set(0, 500, 2000);
  top.castShadow = true;
  top.shadow.mapSize.width = 4048;
  top.shadow.mapSize.height = 4048;
  top.shadow.camera.near = 0;
  top.shadow.camera.far = 1000;
  top.shadow.camera.left = -200;
  top.shadow.camera.right = 200;
  top.shadow.camera.top = 200;
  top.shadow.camera.bottom = -200;

  const bottom = new DirectionalLight(0xFFFFFF, bottomIntensity);
  bottom.position.set(0, -500, 400);
  bottom.castShadow = true;
  bottom.shadow.mapSize.width = 5048;
  bottom.shadow.mapSize.height = 5048;
  bottom.shadow.camera.near = 0.5;
  bottom.shadow.camera.far = 1000;
  bottom.shadow.camera.left = -200;
  bottom.shadow.camera.right = 200;
  bottom.shadow.camera.top = 200;
  bottom.shadow.camera.bottom = -200;

  const ambient = new AmbientLight(0x798296, ambientIntensity);

  return { top, bottom, ambient };
}

/**
 * Create orbit controls for camera manipulation
 */
function createControls(
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
) {
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}
