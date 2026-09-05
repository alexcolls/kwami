import type { AgentPipeline, PipelineConnectOptions, VoiceConfig, ToolDefinition } from '../../types/index.js'

/**
 * Re-export the base pipeline interface
 */
export type { AgentPipeline, PipelineConnectOptions, VoiceConfig, ToolDefinition }

/**
 * Voice Pipeline - Traditional STT → LLM → TTS architecture
 * 
 * This is the standard pipeline used by most voice AI systems today.
 */
export interface VoicePipelineConfig {
  stt?: {
    provider?: string
    model?: string
    language?: string
  }
  llm?: {
    provider?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
  tts?: {
    provider?: string
    voiceId?: string
    model?: string
  }
}

/**
 * Realtime Pipeline - Native voice-to-voice models
 * 
 * Used by GPT-4o Realtime, Gemini Live, etc.
 * Audio goes directly to/from the model without separate STT/TTS.
 */
export interface RealtimePipelineConfig {
  model?: string
  voice?: string
  modalities?: ('text' | 'audio')[]
  turnDetection?: {
    type?: 'server_vad' | 'none'
    threshold?: number
    silenceDuration?: number
  }
}

/**
 * Multimodal Pipeline - Audio + Video native models
 * 
 * Future: Models that natively understand both audio and video streams.
 */
export interface MultimodalPipelineConfig {
  model?: string
  modalities?: ('text' | 'audio' | 'video')[]
  videoResolution?: string
  frameRate?: number
}

/**
 * Pipeline factory function type
 */
export type PipelineFactory<TConfig = unknown> = (config?: TConfig) => AgentPipeline

/**
 * Pipeline events
 */
export type PipelineEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'user_speech_started' }
  | { type: 'user_speech_ended'; transcript: string }
  | { type: 'agent_speech_started' }
  | { type: 'agent_speech_ended'; text: string }
  | { type: 'error'; error: Error }
