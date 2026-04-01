// =============================================================================
// KWAMI - 3D AI Companion Library
// =============================================================================

// Main class
export { Kwami } from './Kwami'

// Modules
export { Avatar, Scene, StarField, type StarFieldConfig, BlobXyz, BlobXyzPosition, KwamiAudio, createSkin, defaultBlobXyzConfig } from './avatar'
export { Agent } from './agent'
export { Soul } from './soul'
export { Memory } from './memory'
export { ToolRegistry } from './tools'
export { SkillManager } from './skills'
export * from './utils/logger'
export * from './utils/api-client'

// Adapters
export { LiveKitAdapter } from './agent'


// Voice Pipeline (NEW)
export { VoiceSession } from './agent'
export type { VoiceSessionState, VoiceSessionEvents, VoiceSessionOptions } from './agent'

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
} from './agent'

// Voice Utilities
export {
  getVoicePipelinePreset,
  buildSTTDescriptor,
  buildTTSDescriptor,
  buildLLMDescriptor,
  PRESET_VOICES,
  findPresetVoice,
  filterPresetVoices,
} from './agent'

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
} from './agent'

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
  BlobXyzSkinSelection,
  BlobXyzSkin,
  TricolorSubtype,
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
} from './types'

export {
  soulPresets,
  soulPresetCategories,
  getSoulPresetById,
  getSoulPresetsByCategory,
  toSoulConfig,
} from './soul'
export type { SoulPreset } from './soul'

// Re-export blob-specific types
export type {
  BlobXyzOptions,
  BlobXyzOptionsConfig,
  TricolorSkinConfig,
  BlobXyzAudioEffects,
} from './avatar/renderers/blob-xyz/types'

export {
  avatarBlobPresets,
  avatarBlackHolePresets,
  blobSkinSelectionFromSubtype,
  BLOB_SKIN_FAMILIES,
  ALL_BLOB_SKIN_TYPES,
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
} from './avatar'

export type {
  AvatarBlobPreset,
  AvatarBlackHolePreset,
  BlobPresetState,
  BlackHolePresetState,
  BlobSkinSubtype,
  BlobRandomizerState,
} from './avatar'

// Adapter types
export type { LiveKitAdapterConfig, AgentAdapter, AdapterFactory } from './agent'
