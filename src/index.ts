// =============================================================================
// KWAMI - 3D AI Companion Library
// =============================================================================

// Main class
export { Kwami } from './Kwami.js'

// Modules
export { Avatar, Scene, StarField, type StarFieldConfig, BlobXyz, BlobXyzPosition, KwamiAudio, createSkin, defaultBlobXyzConfig } from './avatar/index.js'
export { Agent } from './agent/index.js'
export { Soul } from './soul/index.js'
export { Memory } from './memory/index.js'
export { ToolRegistry } from './tools/index.js'
export { SkillManager } from './skills/index.js'
export * from './utils/logger.js'
export * from './utils/api-client.js'

// Adapters
export { LiveKitAdapter } from './agent/index.js'


// Voice Pipeline (NEW)
export { VoiceSession } from './agent/index.js'
export type { VoiceSessionState, VoiceSessionEvents, VoiceSessionOptions } from './agent/index.js'

// Voice Types (comprehensive)
export type {
  // VAD
  VADConfig,
  VADProvider,
  // STT
  STTConfig,
  STTProvider,
  STTInferenceProvider,
  STTPluginProvider,
  STTLanguage,
  // LLM
  LLMConfig,
  LLMProvider,
  LLMInferenceProvider,
  LLMPluginProvider,
  OpenAIModel,
  GeminiModel,
  // TTS
  TTSConfig,
  TTSProvider,
  TTSInferenceProvider,
  TTSPluginProvider,
  PresetVoice,
  // Realtime
  RealtimeConfig,
  RealtimeProvider,
  RealtimeModality,
  // Enhancements
  TurnDetectionConfig,
  NoiseCancellationConfig,
  VoiceEnhancementsConfig,
  // Metrics
  VoiceLatencyMetrics,
  VoicePipelineMetrics,
  // Pipeline
  VoicePipelineConfig,
  VoicePipelinePreset,
  VoicePipelineType,
} from './agent/index.js'

// Voice Utilities
export {
  getVoicePipelinePreset,
  buildSTTDescriptor,
  buildTTSDescriptor,
  buildLLMDescriptor,
  PRESET_VOICES,
  findPresetVoice,
  filterPresetVoices,
} from './agent/index.js'

export {
  VOICE_STT_PROVIDERS,
  VOICE_LLM_PROVIDERS,
  VOICE_TTS_PROVIDERS,
  VOICE_REALTIME_PROVIDERS,
  VOICE_STT_MODELS,
  VOICE_LLM_MODELS,
  VOICE_TTS_MODELS,
  VOICE_REALTIME_MODELS,
  VOICE_FALLBACK_STT_LANGUAGES,
  VOICE_FALLBACK_TTS_VOICES,
  VOICE_FALLBACK_REALTIME_VOICES,
  VOICE_UI_PRESETS,
} from './agent/index.js'

// Core Types
export type {
  // Core
  KwamiConfig,
  KwamiState,
  KwamiCallbacks,
  KwamiEvent,

  // Avatar
  AvatarConfig,
  AvatarRenderer,
  AvatarRendererType,
  BlobXyzConfig,
  BlobXyzSkin,
  SceneConfig,
  SceneBackgroundConfig,
  CameraConfig,
  AudioConfig,

  // Agent
  AgentConfig,
  AgentPipeline,
  PipelineConnectOptions,
  PipelineConfig,
  LiveKitConfig,
  VoiceConfig,
  ToolDefinition,

  // Soul
  SoulConfig,
  EmotionalTraits,

  // Memory
  MemoryConfig,
  MemoryAdapter,
  MemoryContext,
  MemorySearchResult,
  ZepConfig,

  // Tools
  ToolsConfig,
  MCPConfig,

  // Skills
  SkillsConfig,
  SkillDefinition,
  SkillContext,
  SkillResult,
} from './types/index.js'

export {
  soulPresets,
  soulPresetCategories,
  getSoulPresetById,
  getSoulPresetsByCategory,
  toSoulConfig,
} from './soul/index.js'
export type { SoulPreset } from './soul/index.js'

// Re-export blob-specific types
export type {
  BlobXyzOptions,
  BlobXyzOptionsConfig,
  TricolorSkinConfig,
  BlobXyzAudioEffects,
} from './avatar/renderers/blob-xyz/types.js'

export {
  avatarBlobPresets,
  avatarBlackHolePresets,
  avatarEyeIrisPresets,
  BLOB_SKINS,
  BLOB_SKIN_LABELS,
  randomBlobSkinType,
  randomBlobColors,
  randomBlobSurface,
  randomBlobScale,
  randomBlobVector3Degrees,
  randomBlobSpikes,
  randomBlobAmplitude,
  randomBlobTime,
  randomBlobRotation,
  randomBlobBreathing,
  randomBlobTouch,
  randomBlobAudio,
  randomBlobFrequencyBands,
  randomizeBlobState,
} from './avatar/index.js'

export type {
  AvatarBlobPreset,
  AvatarBlackHolePreset,
  AvatarEyeIrisPreset,
  BlobPresetState,
  BlackHolePresetState,
  EyeIrisPresetState,
  BlobSkinType,
  BlobRandomizerState,
} from './avatar/index.js'

// Adapter types
export type { LiveKitAdapterConfig, AgentAdapter, AdapterFactory } from './agent/index.js'
