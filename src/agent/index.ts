// =============================================================================
// AGENT MODULE
// =============================================================================

// Main Agent class
export { Agent } from './Agent.js'

// Adapters
export { LiveKitAdapter } from './adapters/LiveKitAdapter.js'
export type { AgentAdapter, LiveKitAdapterConfig, AdapterFactory } from './adapters/types.js'

// Voice Pipeline
export { VoiceSession } from './voice/VoiceSession.js'
export type { VoiceSessionState, VoiceSessionEvents, VoiceSessionOptions } from './voice/VoiceSession.js'

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
  STTModelOptions,
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
  TTSModelOptions,
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
} from './voice/types.js'

// Voice Utilities
export {
  getVoicePipelinePreset,
  buildSTTDescriptor,
  buildTTSDescriptor,
  buildLLMDescriptor,
  PRESET_VOICES,
  findPresetVoice,
  filterPresetVoices,
} from './voice/types.js'

// Voice UI catalogs
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
} from './voice/catalog.js'

export type {
  VoiceProviderOption,
  VoiceModelOption,
  VoiceOption,
  LanguageOption,
  VoicePipelineUiPreset,
} from './voice/catalog.js'

// Pipeline types
export type {
  VoicePipelineConfig as LegacyVoicePipelineConfig,
  RealtimePipelineConfig,
  MultimodalPipelineConfig,
  PipelineFactory,
  PipelineEvent,
} from './pipelines/types.js'
