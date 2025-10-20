import type { Scene, PerspectiveCamera, WebGLRenderer } from 'three';
import type { KwamiAudio } from '../core/Audio';

/**
 * Kwami states representing different modes of operation
 */
export type KwamiState = 'idle' | 'listening' | 'thinking' | 'speaking';

/**
 * Available skin types for the blob
 */
export type BlobSkinType = 'tricolor' | 'zebra';

/**
 * Audio configuration options
 */
export interface AudioConfig {
  preload?: 'auto' | 'metadata' | 'none';
  autoInitialize?: boolean;
  volume?: number;
}

/**
 * Scene configuration options
 */
export interface SceneConfig {
  fov?: number;
  near?: number;
  far?: number;
  cameraPosition?: { x: number; y: number; z: number };
  lightIntensity?: {
    top?: number;
    bottom?: number;
    ambient?: number;
  };
  enableShadows?: boolean;
  enableControls?: boolean;
}

/**
 * Blob configuration options
 */
export interface BlobConfig {
  resolution?: number;
  spikes?: { x: number; y: number; z: number };
  time?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  colors?: { x: string; y: string; z: string };
  shininess?: number;
  wireframe?: boolean;
}

/**
 * Body configuration options
 */
export interface BodyConfig {
  audioFiles?: string[];
  audio?: AudioConfig;
  scene?: SceneConfig;
  blob?: BlobConfig;
  initialSkin?: BlobSkinType;
}

/**
 * AI Mind configuration
 */
export interface MindConfig {
  llm?: {
    model: string;
    provider: string;
    temperature?: number;
    maxTokens?: number;
  };
  tts?: {
    model: string;
    provider: string;
    voice?: string;
    language?: string;
  };
  stt?: {
    model: string;
    provider: string;
    language?: string;
  };
}

/**
 * AI Soul (personality) configuration
 */
export interface SoulConfig {
  name?: string;
  personality?: string;
  systemPrompt?: string;
  traits?: string[];
  language?: string;
}

/**
 * Main Kwami configuration
 */
export interface KwamiConfig {
  body?: BodyConfig;
  mind?: MindConfig;
  soul?: SoulConfig;
}

/**
 * Blob constructor options
 */
export interface BlobOptions {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  audio: KwamiAudio;
  skin: BlobSkinType;
  resolution?: number;
  spikes?: { x: number; y: number; z: number };
  time?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
}

/**
 * Skin material uniforms
 */
export interface SkinUniforms {
  lightPosition: { value: any };
  shininess: { value: number };
  specular_color: { value: any };
  [key: string]: any;
}

/**
 * Tricolor skin configuration
 */
export interface TricolorSkinConfig {
  wireframe: boolean;
  lightPosition: { x: number; y: number; z: number };
  shininess: number;
  color1: string;
  color2: string;
  color3: string;
}

/**
 * Zebra skin configuration
 */
export interface ZebraSkinConfig {
  wireframe: boolean;
  lightPosition: { x: number; y: number; z: number };
  shininess: number;
}

/**
 * Blob options configuration
 */
export interface BlobOptionsConfig {
  spikes: {
    min: number;
    max: number;
    step: number;
    digits: number;
    rMin: number;
    rMax: number;
    default: number;
  };
  speed: {
    min: number;
    max: number;
    default: number;
  };
  processing: {
    min: number;
    max: number;
    default: number;
  };
  resolution: {
    min: number;
    max: number;
    default: number;
    step: number;
  };
  skins: {
    tricolor: TricolorSkinConfig;
    zebra: ZebraSkinConfig;
  };
}

/**
 * Event handler type
 */
export type EventHandler = () => void;

/**
 * Event handlers map
 */
export interface EventHandlers {
  onClick?: EventHandler;
  onDoubleClick?: EventHandler;
  onHover?: EventHandler;
  onPress?: EventHandler;
  [key: string]: EventHandler | undefined;
}
