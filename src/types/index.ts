// =============================================================================
// KWAMI TYPES
// =============================================================================

// Import types used in this file
import type { VoicePipelineConfig as VoicePipelineConfigType } from '../agent/voice/types'

// Re-export voice types for convenience
export type {
  // Voice Pipeline Types
  VADConfig,
  VADProvider,
  STTConfig,
  STTProvider,
  STTInferenceProvider,
  STTPluginProvider,
  STTLanguage,
  LLMConfig,
  LLMProvider,
  LLMInferenceProvider,
  LLMPluginProvider,
  OpenAIModel,
  GeminiModel,
  TTSConfig,
  TTSProvider,
  TTSInferenceProvider,
  TTSPluginProvider,
  PresetVoice,
  RealtimeConfig,
  RealtimeProvider,
  RealtimeModality,
  TurnDetectionConfig,
  NoiseCancellationConfig,
  VoiceEnhancementsConfig,
  VoiceLatencyMetrics,
  VoicePipelineMetrics,
  VoicePipelineConfig,
  VoicePipelinePreset,
  VoicePipelineType,
} from '../agent/voice/types'

// Re-export voice utilities
export {
  getVoicePipelinePreset,
  buildSTTDescriptor,
  buildTTSDescriptor,
  buildLLMDescriptor,
  PRESET_VOICES,
  findPresetVoice,
  filterPresetVoices,
} from '../agent/voice/types'

// -----------------------------------------------------------------------------
// Core
// -----------------------------------------------------------------------------

export type KwamiState = 'idle' | 'listening' | 'thinking' | 'speaking'

export interface KwamiConfig {
  avatar?: AvatarConfig
  agent?: AgentConfig
  soul?: SoulConfig
  memory?: MemoryConfig
  tools?: ToolsConfig
  skills?: SkillsConfig
}

export interface KwamiCallbacks {
  onStateChange?: (state: KwamiState) => void
  onAgentResponse?: (text: string) => void
  onUserTranscript?: (text: string) => void
  onError?: (error: Error) => void
}

// -----------------------------------------------------------------------------
// Avatar
// -----------------------------------------------------------------------------

export type AvatarRendererType = 'blob-xyz' | 'black-hole' | 'particles-face'

export interface AvatarConfig {
  renderer?: AvatarRendererType
  blob?: BlobXyzConfig
  blackHole?: BlackHoleConfig
  particlesFace?: ParticlesFaceConfig
  scene?: SceneConfig
  interaction?: InteractionConfig
  audio?: {
    files?: string[]
    preload?: 'auto' | 'metadata' | 'none'
    autoInitialize?: boolean
    volume?: number
  }
}

export interface ParticlesFaceConfig {
  particleCount?: number
  particleSize?: number
  faceScale?: number
  color?: string
  secondaryColor?: string
  opacity?: number
  mouthAmplitude?: number
  breathingSpeed?: number
  breathingAmplitude?: number
  driftSpeed?: number
  driftAmplitude?: number
  speakingReactivity?: number
  listeningPulse?: number
  thinkingSpeed?: number
  ambientParticles?: number
  ambientRadius?: number
  depthSpread?: number
}

export interface AudioConfig {
  preload?: 'auto' | 'metadata' | 'none'
  autoInitialize?: boolean
  volume?: number
}

export interface AvatarRenderer {
  setState(state: KwamiState): void
  dispose(): void
}

// -----------------------------------------------------------------------------
// BlobXyz Config (moved from blob-xyz/types.ts for top-level export)
// -----------------------------------------------------------------------------

export type BlobXyzSkin = 'tricolor' | 'monochrome' | 'matcap' | 'toon'
export type TricolorSubtype = 'poles' | 'donut' | 'vintage' | 'marble' | 'fresnel' | 'iridescent' | 'spiral' | 'plasma' | 'gradient'
export type MonochromeSubtype = 'matte' | 'glossy' | 'metallic' | 'subsurface'
export type MatcapSubtype = 'chrome' | 'clay' | 'jade' | 'toon-matcap' | 'hologram'
export type ToonSubtype = 'flat' | 'stepped' | 'halftone' | 'outlined'
export type AnySkinSubtype = TricolorSubtype | MonochromeSubtype | MatcapSubtype | ToonSubtype

export type BlobXyzSkinSelection =
  | { skin: 'tricolor'; subtype?: TricolorSubtype }
  | { skin: 'monochrome'; subtype?: MonochromeSubtype }
  | { skin: 'matcap'; subtype?: MatcapSubtype }
  | { skin: 'toon'; subtype?: ToonSubtype }

export interface BlobXyzConfig {
  skin?: BlobXyzSkinSelection
  resolution?: number
  spikes?: { x: number; y: number; z: number }
  time?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  colors?: { x: string; y: string; z: string }
  shininess?: number
  wireframe?: boolean
  position?: { x: number; y: number }
  amplitude?: { x: number; y: number; z: number }
  touch?: {
    strength?: number
    duration?: number
    maxPoints?: number
  }
  transition?: {
    speed?: number
    thinkingDuration?: number
  }
}

// -----------------------------------------------------------------------------
// Interaction Config
// -----------------------------------------------------------------------------

export type InteractionAction =
  | 'none'
  | 'toggleListening'
  | 'startListening'
  | 'stopListening'
  | 'toggleSpeaking'
  | 'randomize'
  | 'switchRenderer'
  | 'cycleState'
  | 'pulse'
  | 'custom'

export interface InteractionActionConfig {
  action: InteractionAction
  enabled?: boolean
  customHandler?: () => void | Promise<void>
  rendererTarget?: 'blob-xyz'
}

export interface InteractionConfig {
  click?: InteractionActionConfig
  doubleClick?: InteractionActionConfig
  rightClick?: InteractionActionConfig
  doubleRightClick?: InteractionActionConfig
  drag?: {
    enabled?: boolean
    sensitivity?: number
    rotateOnDrag?: boolean
  }
  hover?: {
    enabled?: boolean
    highlightOnHover?: boolean
    cursorStyle?: string
  }
}

// -----------------------------------------------------------------------------
// Black Hole Config
// -----------------------------------------------------------------------------

export type BlackHoleColorScheme = 'classic' | 'fire' | 'ice' | 'nebula' | 'void'

export interface BlackHoleColorSchemeSelection {
  scheme: BlackHoleColorScheme
}

export interface BlackHoleConfig {
  colorScheme?: BlackHoleColorSchemeSelection
  /** Black hole core configuration */
  core?: {
    /** Radius of the event horizon */
    radius?: number
    /** Glow intensity around the event horizon */
    glowIntensity?: number
    /** Pulse animation speed */
    pulseSpeed?: number
  }
  /** Accretion disk configuration */
  disk?: {
    /** Inner radius (relative to black hole radius) */
    innerRadius?: number
    /** Outer radius */
    outerRadius?: number
    /** Tilt angle in radians */
    tiltAngle?: number
    /** Flow speed of the disk material */
    flowSpeed?: number
    /** Noise scale for turbulence */
    noiseScale?: number
    /** Density of the visible material (0-2) */
    density?: number
  }
  /** Disk color configuration */
  colors?: {
    hot: string
    mid1: string
    mid2: string
    mid3: string
    outer: string
  }
  /** Stars field configuration */
  stars?: {
    /** Number of background stars */
    count?: number
    /** Field radius */
    fieldRadius?: number
    /** Twinkle animation speed */
    twinkleSpeed?: number
  }
  /** Animation configuration */
  animation?: {
    /** Auto-rotate camera */
    autoRotate?: boolean
    /** Auto-rotate speed */
    autoRotateSpeed?: number
    /** Disk rotation speed */
    diskRotationSpeed?: number
    /** Stars rotation speed */
    starsRotationSpeed?: number
  }
  /** Post-processing effects */
  effects?: {
    /** Bloom intensity (0-2) */
    bloomIntensity?: number
    /** Bloom threshold (0-1) */
    bloomThreshold?: number
    /** Bloom radius (0-2) */
    bloomRadius?: number
    /** Gravitational lensing strength */
    lensingStrength?: number
    /** Lensing effect radius */
    lensingRadius?: number
    /** Chromatic aberration amount */
    chromaticAberration?: number
  }
  /** Audio reactivity configuration */
  audioEffects?: {
    /** Enable audio reactivity */
    enabled?: boolean
    /** Overall reactivity multiplier (0-3) */
    reactivity?: number
    /** Bass frequency influence on disk glow */
    bassDiskGlow?: number
    /** Mid frequency influence on disk speed */
    midDiskSpeed?: number
    /** High frequency influence on star twinkle */
    highStarTwinkle?: number
    /** Smoothing factor for transitions */
    smoothing?: number
  }
  /** Overall scale */
  scale?: number
}

// -----------------------------------------------------------------------------
// Scene
// -----------------------------------------------------------------------------

export type BackgroundMediaFit = 'cover' | 'contain' | 'stretch'

export interface SceneBackgroundConfig {
  type?: 'transparent' | 'solid' | 'gradient' | 'image' | 'video'
  color?: string
  opacity?: number
  gradient?: {
    colors: string[]
    direction?: 'vertical' | 'horizontal' | 'radial' | 'diagonal'
    opacity?: number
    angle?: number
    stops?: number[]
  }
  image?: {
    url: string
    fit?: BackgroundMediaFit
    opacity?: number
  }
  video?: {
    url: string
    fit?: BackgroundMediaFit
    opacity?: number
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    playbackRate?: number
  }
}

export interface StarFieldConfig {
  count?: number
  fieldRadius?: number
  minSize?: number
  maxSize?: number
  twinkleSpeed?: number
  rotationSpeed?: number
}

export interface SceneConfig {
  fov?: number
  near?: number
  far?: number
  cameraPosition?: { x: number; y: number; z: number }
  lightIntensity?: {
    top?: number
    bottom?: number
    ambient?: number
  }
  enableShadows?: boolean
  enableControls?: boolean
  preserveDrawingBuffer?: boolean
  background?: SceneBackgroundConfig
  starField?: StarFieldConfig
}

export interface CameraConfig {
  fov?: number
  near?: number
  far?: number
  position?: { x: number; y: number; z: number }
}

// -----------------------------------------------------------------------------
// Agent
// -----------------------------------------------------------------------------

import type { VoicePipelineConfig } from '../agent/voice/types'
import type { VoiceSessionEvents } from '../agent/voice/VoiceSession'

export interface AgentConfig {
  /** Adapter type */
  adapter?: 'livekit' | 'custom'
  /** LiveKit-specific configuration */
  livekit?: LiveKitConfig
  /** Pipeline type (legacy - prefer livekit.voice) */
  pipeline?: PipelineConfig
}

export interface LiveKitConfig {
  // ---------------------------------------------------------------------------
  // Connection
  // ---------------------------------------------------------------------------

  /** LiveKit server URL (wss://...) */
  url?: string
  /** Pre-generated access token */
  token?: string
  /** Token endpoint URL for fetching tokens */
  tokenEndpoint?: string
  /** Room name to join */
  roomName?: string
  /** User ID for persistent identity (used for memory recall) */
  userId?: string
  /** Auth token for API authentication (e.g., Supabase JWT) */
  authToken?: string

  // ---------------------------------------------------------------------------
  // Voice Pipeline Configuration
  // ---------------------------------------------------------------------------

  /** Complete voice pipeline configuration */
  voice?: VoicePipelineConfig

  // ---------------------------------------------------------------------------
  // Session Options
  // ---------------------------------------------------------------------------

  /** Agent instructions/system prompt */
  instructions?: string
  /** User away timeout in seconds */
  userAwayTimeout?: number
  /** Minimum consecutive speech delay */
  minConsecutiveSpeechDelay?: number

  // ---------------------------------------------------------------------------
  // Room I/O Options
  // ---------------------------------------------------------------------------

  /** Enable text input */
  textInputEnabled?: boolean
  /** Enable audio input */
  audioInputEnabled?: boolean
  /** Enable video input */
  videoInputEnabled?: boolean
  /** Enable text output (transcription) */
  textOutputEnabled?: boolean
  /** Enable audio output */
  audioOutputEnabled?: boolean
  /** Sync transcription with audio */
  syncTranscription?: boolean

  // ---------------------------------------------------------------------------
  // Room Connection Options
  // ---------------------------------------------------------------------------

  /** Auto-subscribe to tracks */
  autoSubscribe?: boolean
  /** Enable dynacast */
  dynacast?: boolean
  /** Enable adaptive streaming */
  adaptiveStream?: boolean
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean
  /** Number of reconnection attempts */
  reconnectAttempts?: number

  // ---------------------------------------------------------------------------
  // Participant Options
  // ---------------------------------------------------------------------------

  /** Linked participant identity */
  participantIdentity?: string
  /** Close session when participant disconnects */
  closeOnDisconnect?: boolean
  /** Delete room when session ends */
  deleteRoomOnClose?: boolean

  // ---------------------------------------------------------------------------
  // Audio Options (Legacy - prefer voice.enhancements)
  // ---------------------------------------------------------------------------

  /** Enable echo cancellation */
  echoCancellation?: boolean
  /** Enable noise suppression */
  noiseSuppression?: boolean
  /** Enable auto gain control */
  autoGainControl?: boolean

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  /** Voice session event callbacks */
  events?: VoiceSessionEvents
}

export interface PipelineConfig {
  type?: 'voice' | 'realtime' | 'multimodal'
}

export interface AgentPipeline {
  connect(options: PipelineConnectOptions): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  sendText(text: string): void
  interrupt(): void
  onUserSpeech(callback: (transcript: string) => void): void
  onAgentText(callback: (text: string) => void): void
  onAgentSpeech(callback: (audio: ArrayBuffer) => void): void
  dispose(): void
  setToolExecutor(executor: ToolExecutor): void
}

export type ToolExecutor = (name: string, args: Record<string, unknown>) => Promise<string>


export interface PipelineConnectOptions {
  /** Unique identifier for this Kwami instance */
  kwamiId?: string
  /** Display name for this Kwami */
  kwamiName?: string
  /** LiveKit room name (auto-generated if not provided) */
  roomName?: string
  /** LiveKit token */
  token?: string
  /** Soul configuration (personality, system prompt, traits) */
  soul?: SoulConfig & {
    systemPrompt?: string
  }
  /** Voice pipeline configuration (STT, LLM, TTS) */
  voice?: VoicePipelineConfigType
  /** Memory context */
  memory?: MemoryContext
  /** Tool definitions */
  tools?: ToolDefinition[]
}

export interface VoiceConfig {
  provider?: string
  voiceId?: string
  model?: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters?: Record<string, unknown>
  handler?: (params: Record<string, unknown>) => Promise<unknown>
}

// -----------------------------------------------------------------------------
// Soul
// -----------------------------------------------------------------------------

export interface SoulConfig {
  name?: string
  personality?: string
  systemPrompt?: string
  traits?: string[]
  language?: string
  conversationStyle?: string
  responseLength?: 'short' | 'medium' | 'long'
  emotionalTone?: 'neutral' | 'warm' | 'enthusiastic' | 'calm'
  emotionalTraits?: EmotionalTraits
}

export interface EmotionalTraits {
  happiness?: number
  energy?: number
  confidence?: number
  calmness?: number
  optimism?: number
  socialness?: number
  creativity?: number
  patience?: number
  empathy?: number
  curiosity?: number
}

// -----------------------------------------------------------------------------
// Memory
// -----------------------------------------------------------------------------

export interface MemoryConfig {
  adapter?: 'zep' | 'local'
  zep?: ZepConfig
}

export interface ZepConfig {
  apiKey?: string
  baseUrl?: string
  collectionName?: string
}

export interface MemoryAdapter {
  initialize(userId: string): Promise<void>
  addMessage(role: 'user' | 'assistant', content: string): Promise<void>
  getContext(): Promise<MemoryContext>
  search(query: string, limit?: number): Promise<MemorySearchResult[]>
  clear(): Promise<void>
  dispose(): void
}

export interface MemoryContext {
  recentMessages?: Array<{ role: string; content: string }>
  facts?: string[]
  summary?: string
  entities?: Array<{ name: string; type: string }>
}

export interface MemorySearchResult {
  content: string
  score: number
  metadata?: Record<string, unknown>
}

// -----------------------------------------------------------------------------
// Tools
// -----------------------------------------------------------------------------

export interface ToolsConfig {
  mcp?: MCPConfig[]
  custom?: ToolDefinition[]
}

export interface MCPConfig {
  name: string
  url: string
  apiKey?: string
}

// -----------------------------------------------------------------------------
// Skills
// -----------------------------------------------------------------------------

export interface SkillsConfig {
  definitions?: SkillDefinition[]
  enabled?: string[]
}

export interface SkillDefinition {
  name: string
  description: string
  trigger?: 'voice' | 'action' | 'event'
  execute: (context: SkillContext) => Promise<SkillResult>
}

export interface SkillContext {
  kwami: unknown // Reference to Kwami instance
  params?: Record<string, unknown>
  userMessage?: string
}

export interface SkillResult {
  success: boolean
  message?: string
  data?: unknown
}

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

export type KwamiEvent =
  | { type: 'stateChange'; state: KwamiState }
  | { type: 'agentResponse'; text: string }
  | { type: 'userTranscript'; text: string }
  | { type: 'error'; error: Error }
  | { type: 'connected' }
  | { type: 'disconnected' }

export type KwamiEventHandler = (event: KwamiEvent) => void
