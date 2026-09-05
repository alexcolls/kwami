import type { AgentPipeline, LiveKitConfig } from '../../types/index.js'
import type { VoicePipelineConfig } from '../voice/types.js'
import type { VoiceSessionEvents } from '../voice/VoiceSession.js'

/**
 * Agent Adapter Interface
 * 
 * Adapters connect Kwami to specific backend services (LiveKit, etc.)
 */
export interface AgentAdapter {
  /**
   * Create a pipeline instance using this adapter
   */
  createPipeline(): AgentPipeline
  
  /**
   * Get the adapter name
   */
  getName(): string
  
  /**
   * Check if the adapter is properly configured
   */
  isConfigured(): boolean
  
  /**
   * Cleanup resources
   */
  dispose(): void
}

/**
 * LiveKit-specific adapter configuration
 */
export interface LiveKitAdapterConfig extends LiveKitConfig {
  // ---------------------------------------------------------------------------
  // Connection Options
  // ---------------------------------------------------------------------------
  
  /** Room connection options */
  autoSubscribe?: boolean
  /** Enable dynacast for adaptive bitrate */
  dynacast?: boolean
  /** Enable adaptive streaming */
  adaptiveStream?: boolean
  /** Reconnection attempts */
  reconnectAttempts?: number
  /** Auto-reconnect on disconnect */
  autoReconnect?: boolean

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
  // Voice Pipeline Configuration (NEW)
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
  // Participant Options
  // ---------------------------------------------------------------------------
  
  /** Linked participant identity */
  participantIdentity?: string
  /** Close session when participant disconnects */
  closeOnDisconnect?: boolean
  /** Delete room when session ends */
  deleteRoomOnClose?: boolean

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  
  /** Voice session event callbacks */
  events?: VoiceSessionEvents

  /** Called when agent sends web search results (same data as kwami:search_results event) */
  onSearchResults?: (data: {
    query: string
    results: Array<{
      title: string
      url: string
      content: string
      image?: string
      features?: string[]
      product_name?: string
      price?: string | null
    }>
    answer: string | null
  }) => void

}

/**
 * Adapter factory function type
 */
export type AdapterFactory<TConfig = unknown> = (config?: TConfig) => AgentAdapter
