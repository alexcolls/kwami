import type { LLMProvider, RealtimeProvider, STTProvider, TTSProvider, VoicePipelineConfig } from './types'

export interface VoiceProviderOption<T extends string> {
  provider: T
  label: string
  icon: string
}

export interface VoiceModelOption {
  model: string
  name: string
}

export interface VoiceOption {
  id: string
  name: string
  category?: string
}

export interface LanguageOption {
  value: string
  label: string
}

export interface VoicePipelineUiPreset {
  id: string
  label: string
  icon: string
  title: string
  config: Pick<VoicePipelineConfig, 'stt' | 'llm' | 'tts'>
}

export const VOICE_STT_PROVIDERS: VoiceProviderOption<STTProvider>[] = [
  { provider: 'deepgram', label: 'Deepgram', icon: 'simple-icons:deepgram' },
  { provider: 'openai', label: 'OpenAI Whisper', icon: 'simple-icons:openai' },
  { provider: 'assemblyai', label: 'AssemblyAI', icon: 'ph:waveform-duotone' },
  { provider: 'google', label: 'Google Cloud', icon: 'simple-icons:googlecloud' },
  { provider: 'elevenlabs', label: 'ElevenLabs', icon: 'ph:speaker-high-duotone' },
]

export const VOICE_LLM_PROVIDERS: VoiceProviderOption<LLMProvider>[] = [
  { provider: 'openai', label: 'OpenAI', icon: 'simple-icons:openai' },
  { provider: 'gemini', label: 'Google Gemini', icon: 'simple-icons:googlegemini' },
  { provider: 'anthropic', label: 'Anthropic Claude', icon: 'simple-icons:anthropic' },
  { provider: 'groq', label: 'Groq', icon: 'ph:lightning-duotone' },
  { provider: 'deepseek', label: 'DeepSeek', icon: 'ph:brain-duotone' },
  { provider: 'mistral', label: 'Mistral AI', icon: 'ph:wind-duotone' },
  { provider: 'cerebras', label: 'Cerebras', icon: 'ph:cpu-duotone' },
  { provider: 'ollama', label: 'Ollama (Local)', icon: 'ph:house-duotone' },
]

export const VOICE_TTS_PROVIDERS: VoiceProviderOption<TTSProvider>[] = [
  { provider: 'cartesia', label: 'Cartesia', icon: 'ph:speaker-high-duotone' },
  { provider: 'elevenlabs', label: 'ElevenLabs', icon: 'ph:waveform-duotone' },
  { provider: 'openai', label: 'OpenAI TTS', icon: 'simple-icons:openai' },
  { provider: 'deepgram', label: 'Deepgram Aura', icon: 'simple-icons:deepgram' },
  { provider: 'google', label: 'Google Cloud', icon: 'simple-icons:googlecloud' },
]

export const VOICE_REALTIME_PROVIDERS: VoiceProviderOption<RealtimeProvider>[] = [
  { provider: 'openai', label: 'OpenAI Realtime', icon: 'simple-icons:openai' },
  { provider: 'gemini', label: 'Google Gemini Live', icon: 'simple-icons:googlegemini' },
]

export const VOICE_STT_MODELS: Partial<Record<STTProvider, VoiceModelOption[]>> = {
  deepgram: [
    { model: 'nova-3', name: 'Nova 3 (Latest)' },
    { model: 'nova-2', name: 'Nova 2' },
    { model: 'nova-2-conversationalai', name: 'Nova 2 Conversational' },
    { model: 'nova-2-phonecall', name: 'Nova 2 Phone Call' },
    { model: 'nova-2-meeting', name: 'Nova 2 Meeting' },
    { model: 'enhanced', name: 'Enhanced' },
    { model: 'base', name: 'Base' },
  ],
  openai: [
    { model: 'whisper-1', name: 'Whisper v1' },
    { model: 'whisper-large-v3', name: 'Whisper Large v3' },
    { model: 'whisper-large-v3-turbo', name: 'Whisper Large v3 Turbo' },
  ],
  assemblyai: [
    { model: 'best', name: 'Best (Recommended)' },
    { model: 'nano', name: 'Nano (Fast)' },
    { model: 'conformer-2', name: 'Conformer 2' },
  ],
  google: [
    { model: 'chirp', name: 'Chirp (Universal)' },
    { model: 'chirp-2', name: 'Chirp 2' },
    { model: 'telephony', name: 'Telephony' },
    { model: 'command_and_search', name: 'Command & Search' },
  ],
  elevenlabs: [{ model: 'scribe_v1', name: 'Scribe v1' }],
}

export const VOICE_LLM_MODELS: Partial<Record<LLMProvider, VoiceModelOption[]>> = {
  openai: [
    { model: 'gpt-4o', name: 'GPT-4o' },
    { model: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { model: 'gpt-4.1', name: 'GPT-4.1' },
    { model: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { model: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { model: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { model: 'gpt-4', name: 'GPT-4' },
    { model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { model: 'o1', name: 'o1 (Reasoning)' },
    { model: 'o1-mini', name: 'o1 Mini' },
    { model: 'o3-mini', name: 'o3 Mini' },
  ],
  gemini: [
    { model: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { model: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    { model: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { model: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { model: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B' },
  ],
  anthropic: [
    { model: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet' },
    { model: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku' },
    { model: 'claude-3-opus-latest', name: 'Claude 3 Opus' },
    { model: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  ],
}

export const VOICE_TTS_MODELS: Partial<Record<TTSProvider, VoiceModelOption[]>> = {
  cartesia: [
    { model: 'sonic-2', name: 'Sonic 2 (Latest)' },
    { model: 'sonic-english', name: 'Sonic English' },
    { model: 'sonic-multilingual', name: 'Sonic Multilingual' },
  ],
  elevenlabs: [
    { model: 'eleven_turbo_v2_5', name: 'Turbo v2.5' },
    { model: 'eleven_turbo_v2', name: 'Turbo v2' },
    { model: 'eleven_multilingual_v2', name: 'Multilingual v2' },
    { model: 'eleven_monolingual_v1', name: 'Monolingual v1' },
    { model: 'eleven_flash_v2_5', name: 'Flash v2.5' },
    { model: 'eleven_flash_v2', name: 'Flash v2' },
  ],
  openai: [
    { model: 'tts-1', name: 'TTS-1' },
    { model: 'tts-1-hd', name: 'TTS-1 HD' },
    { model: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS' },
  ],
  deepgram: [
    { model: 'aura-asteria-en', name: 'Aura Asteria' },
    { model: 'aura-luna-en', name: 'Aura Luna' },
    { model: 'aura-stella-en', name: 'Aura Stella' },
    { model: 'aura-athena-en', name: 'Aura Athena' },
  ],
  google: [
    { model: 'en-US-Studio-O', name: 'Studio O (Female)' },
    { model: 'en-US-Studio-Q', name: 'Studio Q (Male)' },
  ],
}

export const VOICE_REALTIME_MODELS: Partial<Record<RealtimeProvider, VoiceModelOption[]>> = {
  openai: [
    { model: 'gpt-4o-realtime-preview', name: 'GPT-4o Realtime Preview' },
    { model: 'gpt-4o-realtime-preview-2024-10-01', name: 'GPT-4o Realtime (Oct 2024)' },
    { model: 'gpt-4o-realtime-preview-2024-12-17', name: 'GPT-4o Realtime (Dec 2024)' },
  ],
  gemini: [{ model: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Live' }],
}

export const VOICE_FALLBACK_STT_LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'multi', label: 'Multi-language' },
]

export const VOICE_FALLBACK_TTS_VOICES: Partial<Record<TTSProvider, VoiceOption[]>> = {
  cartesia: [
    { id: '79a125e8-cd45-4c13-8a67-188112f4dd22', name: 'British Lady (Sophia)', category: 'Female EN' },
    { id: 'c2ac25f9-ecc4-4f56-9095-651354df60c0', name: 'California Girl', category: 'Female EN' },
  ],
  elevenlabs: [
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'Female' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', category: 'Male' },
  ],
  openai: [
    { id: 'alloy', name: 'Alloy', category: 'Neutral' },
    { id: 'nova', name: 'Nova', category: 'Female' },
    { id: 'onyx', name: 'Onyx', category: 'Male' },
  ],
  deepgram: [
    { id: 'asteria', name: 'Asteria', category: 'Female' },
    { id: 'zeus', name: 'Zeus', category: 'Male' },
  ],
  google: [
    { id: 'en-US-Studio-O', name: 'Studio O (Female)', category: 'Female' },
    { id: 'en-US-Studio-Q', name: 'Studio Q (Male)', category: 'Male' },
  ],
}

export const VOICE_FALLBACK_REALTIME_VOICES: Partial<Record<RealtimeProvider, VoiceOption[]>> = {
  openai: [
    { id: 'alloy', name: 'Alloy' },
    { id: 'ash', name: 'Ash' },
    { id: 'ballad', name: 'Ballad' },
    { id: 'coral', name: 'Coral' },
    { id: 'echo', name: 'Echo' },
    { id: 'sage', name: 'Sage' },
    { id: 'shimmer', name: 'Shimmer' },
    { id: 'verse', name: 'Verse' },
  ],
  gemini: [
    { id: 'Puck', name: 'Puck' },
    { id: 'Charon', name: 'Charon' },
    { id: 'Kore', name: 'Kore' },
    { id: 'Fenrir', name: 'Fenrir' },
    { id: 'Aoede', name: 'Aoede' },
  ],
}

export const VOICE_UI_PRESETS: VoicePipelineUiPreset[] = [
  {
    id: 'fast',
    label: 'Fast',
    icon: 'ph:rocket-duotone',
    title: 'Optimized for lowest latency',
    config: {
      stt: { provider: 'deepgram', model: 'nova-3', language: 'en' },
      llm: { provider: 'groq', model: 'llama-3.1-8b-instant', temperature: 0.7, maxTokens: 512 },
      tts: { provider: 'openai', model: 'tts-1', voice: 'nova', speed: 1.0 },
    },
  },
  {
    id: 'balanced',
    label: 'Balanced',
    icon: 'ph:scales-duotone',
    title: 'Good balance of speed and quality',
    config: {
      stt: { provider: 'deepgram', model: 'nova-2', language: 'en' },
      llm: { provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7, maxTokens: 1024 },
      tts: { provider: 'openai', model: 'tts-1', voice: 'nova', speed: 1.0 },
    },
  },
  {
    id: 'quality',
    label: 'Quality',
    icon: 'ph:star-duotone',
    title: 'Best possible quality',
    config: {
      stt: { provider: 'deepgram', model: 'nova-3', language: 'en' },
      llm: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 2048 },
      tts: { provider: 'openai', model: 'tts-1-hd', voice: 'nova', speed: 1.0 },
    },
  },
]
