import type {
  VoicePipelineConfig,
  VoicePipelineMetrics,
  VoiceLatencyMetrics,
  VoicePipelinePreset,
  STTConfig,
  LLMConfig,
  TTSConfig,
  VADConfig,
  RealtimeConfig,
  VoiceEnhancementsConfig,
} from './types.js'
import {
  getVoicePipelinePreset,
  buildSTTDescriptor,
  buildLLMDescriptor,
  buildTTSDescriptor,
} from './types.js'
import { logger } from '../../utils/logger.js'

/**
 * Voice session state
 */
export type VoiceSessionState = 
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'idle'

/**
 * Voice session events
 */
export interface VoiceSessionEvents {
  onStateChange?: (state: VoiceSessionState) => void
  onUserSpeechStarted?: () => void
  onUserSpeechEnded?: (transcript: string) => void
  onAgentSpeechStarted?: () => void
  onAgentSpeechEnded?: (text: string) => void
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onMetrics?: (metrics: VoicePipelineMetrics) => void
  onError?: (error: Error) => void
  onInterruption?: () => void
}

/**
 * Voice session options
 */
export interface VoiceSessionOptions {
  /** Pipeline configuration */
  pipeline?: VoicePipelineConfig
  /** Use a preset configuration */
  preset?: VoicePipelinePreset
  /** Agent instructions/system prompt */
  instructions?: string
  /** Event callbacks */
  events?: VoiceSessionEvents
  /** User away timeout in seconds */
  userAwayTimeout?: number
  /** Minimum consecutive speech delay */
  minConsecutiveSpeechDelay?: number
}

/**
 * VoiceSession - Manages voice AI session state and configuration
 * 
 * This class provides a high-level interface for configuring and managing
 * voice AI sessions with LiveKit Agents. It handles:
 * - Pipeline configuration (STT, LLM, TTS or Realtime models)
 * - Voice activity detection (VAD)
 * - Turn detection and interruptions
 * - Noise cancellation
 * - Metrics collection
 * 
 * @example
 * ```typescript
 * const session = new VoiceSession({
 *   preset: 'balanced',
 *   instructions: 'You are a helpful assistant.',
 * })
 * 
 * // Or with full configuration
 * const session = new VoiceSession({
 *   pipeline: {
 *     stt: { provider: 'deepgram', model: 'nova-3', language: 'en' },
 *     llm: { provider: 'openai', model: 'gpt-4.1-mini' },
 *     tts: { provider: 'cartesia', model: 'sonic-3', voice: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc' },
 *     enhancements: {
 *       turnDetection: { enabled: true, model: 'multilingual' },
 *       noiseCancellation: { enabled: true, mode: 'bvc' },
 *     },
 *   },
 * })
 * ```
 */
export class VoiceSession {
  private config: VoicePipelineConfig
  private events: VoiceSessionEvents
  private state: VoiceSessionState = 'idle'
  private instructions: string
  private userAwayTimeout: number
  private minConsecutiveSpeechDelay: number

  // Metrics tracking
  private metrics: VoicePipelineMetrics = {
    latency: {},
    turnsCompleted: 0,
    interruptions: 0,
    agentSpeakingTime: 0,
    userSpeakingTime: 0,
    sessionStart: 0,
  }

  constructor(options: VoiceSessionOptions = {}) {
    // Apply preset if specified, then override with explicit config
    const presetConfig = options.preset ? getVoicePipelinePreset(options.preset) : {}
    this.config = { ...presetConfig, ...options.pipeline }
    
    // Set defaults if not configured
    if (!this.config.type) {
      this.config.type = 'stt-llm-tts'
    }
    
    this.events = options.events ?? {}
    this.instructions = options.instructions ?? ''
    this.userAwayTimeout = options.userAwayTimeout ?? 15.0
    this.minConsecutiveSpeechDelay = options.minConsecutiveSpeechDelay ?? 0.0
    
    logger.debug('VoiceSession created', { config: this.config })
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Get the current pipeline configuration
   */
  getConfig(): VoicePipelineConfig {
    return { ...this.config }
  }

  /**
   * Update pipeline configuration
   * Note: Some changes may require reconnection
   */
  updateConfig(config: Partial<VoicePipelineConfig>): void {
    this.config = { ...this.config, ...config }
    logger.debug('VoiceSession config updated', { config: this.config })
  }

  /**
   * Set STT configuration
   */
  setSTT(stt: STTConfig): void {
    this.config.stt = stt
  }

  /**
   * Set LLM configuration
   */
  setLLM(llm: LLMConfig): void {
    this.config.llm = llm
  }

  /**
   * Set TTS configuration
   */
  setTTS(tts: TTSConfig): void {
    this.config.tts = tts
  }

  /**
   * Set VAD configuration
   */
  setVAD(vad: VADConfig): void {
    this.config.vad = vad
  }

  /**
   * Set realtime model configuration
   */
  setRealtime(realtime: RealtimeConfig): void {
    this.config.realtime = realtime
    this.config.type = 'realtime'
  }

  /**
   * Set voice enhancements
   */
  setEnhancements(enhancements: VoiceEnhancementsConfig): void {
    this.config.enhancements = enhancements
  }

  /**
   * Set agent instructions
   */
  setInstructions(instructions: string): void {
    this.instructions = instructions
  }

  /**
   * Get agent instructions
   */
  getInstructions(): string {
    return this.instructions
  }

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------

  /**
   * Get current session state
   */
  getState(): VoiceSessionState {
    return this.state
  }

  /**
   * Update session state
   */
  setState(state: VoiceSessionState): void {
    if (this.state !== state) {
      this.state = state
      this.events.onStateChange?.(state)
    }
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  /**
   * Register event handlers
   */
  on(events: VoiceSessionEvents): void {
    this.events = { ...this.events, ...events }
  }

  /**
   * Trigger user speech started
   */
  triggerUserSpeechStarted(): void {
    this.events.onUserSpeechStarted?.()
  }

  /**
   * Trigger user speech ended
   */
  triggerUserSpeechEnded(transcript: string): void {
    this.events.onUserSpeechEnded?.(transcript)
  }

  /**
   * Trigger agent speech started
   */
  triggerAgentSpeechStarted(): void {
    this.events.onAgentSpeechStarted?.()
  }

  /**
   * Trigger agent speech ended
   */
  triggerAgentSpeechEnded(text: string): void {
    this.events.onAgentSpeechEnded?.(text)
    this.metrics.turnsCompleted++
  }

  /**
   * Trigger transcript update
   */
  triggerTranscript(transcript: string, isFinal: boolean): void {
    this.events.onTranscript?.(transcript, isFinal)
  }

  /**
   * Trigger interruption
   */
  triggerInterruption(): void {
    this.events.onInterruption?.()
    this.metrics.interruptions++
  }

  /**
   * Trigger error
   */
  triggerError(error: Error): void {
    this.events.onError?.(error)
  }

  // ---------------------------------------------------------------------------
  // Metrics
  // ---------------------------------------------------------------------------

  /**
   * Start metrics collection
   */
  startMetrics(): void {
    this.metrics.sessionStart = Date.now()
  }

  /**
   * Update latency metrics
   */
  updateLatency(latency: Partial<VoiceLatencyMetrics>): void {
    this.metrics.latency = { ...this.metrics.latency, ...latency, timestamp: Date.now() }
    
    if (this.config.collectMetrics) {
      this.events.onMetrics?.(this.getMetrics())
    }
  }

  /**
   * Add to agent speaking time
   */
  addAgentSpeakingTime(ms: number): void {
    this.metrics.agentSpeakingTime += ms
  }

  /**
   * Add to user speaking time
   */
  addUserSpeakingTime(ms: number): void {
    this.metrics.userSpeakingTime += ms
  }

  /**
   * Get current metrics
   */
  getMetrics(): VoicePipelineMetrics {
    return { ...this.metrics }
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      latency: {},
      turnsCompleted: 0,
      interruptions: 0,
      agentSpeakingTime: 0,
      userSpeakingTime: 0,
      sessionStart: Date.now(),
    }
  }

  // ---------------------------------------------------------------------------
  // Descriptor Builders
  // ---------------------------------------------------------------------------

  /**
   * Build STT descriptor for LiveKit Inference
   */
  buildSTTDescriptor(): string | undefined {
    const stt = this.config.stt
    if (!stt || !stt.provider || !stt.model) return undefined
    if (!stt.useInference) return undefined
    return buildSTTDescriptor(stt.provider, stt.model, stt.language)
  }

  /**
   * Build LLM descriptor for LiveKit Inference
   */
  buildLLMDescriptor(): string | undefined {
    const llm = this.config.llm
    if (!llm || !llm.provider || !llm.model) return undefined
    if (!llm.useInference) return undefined
    return buildLLMDescriptor(llm.provider, llm.model)
  }

  /**
   * Build TTS descriptor for LiveKit Inference
   */
  buildTTSDescriptor(): string | undefined {
    const tts = this.config.tts
    if (!tts || !tts.provider || !tts.model) return undefined
    if (!tts.useInference) return undefined
    return buildTTSDescriptor(tts.provider, tts.model, tts.voice)
  }

  // ---------------------------------------------------------------------------
  // Configuration Export
  // ---------------------------------------------------------------------------

  /**
   * Export configuration for LiveKit AgentSession
   * This generates the configuration object expected by LiveKit's AgentSession
   */
  toLiveKitConfig(): Record<string, unknown> {
    const config: Record<string, unknown> = {}

    // Pipeline type
    if (this.config.type === 'realtime') {
      // Realtime model config
      if (this.config.realtime) {
        config.llm = {
          provider: this.config.realtime.provider,
          model: this.config.realtime.model,
          voice: this.config.realtime.voice,
          modalities: this.config.realtime.modalities,
          temperature: this.config.realtime.temperature,
          maxResponseTokens: this.config.realtime.maxResponseTokens,
          turnDetection: this.config.realtime.turnDetection,
          apiKey: this.config.realtime.apiKey,
          ...this.config.realtime.extra,
        }
      }
    } else {
      // STT-LLM-TTS pipeline
      if (this.config.stt) {
        const sttDescriptor = this.buildSTTDescriptor()
        if (sttDescriptor) {
          config.stt = sttDescriptor
        } else {
          config.stt = {
            provider: this.config.stt.provider,
            model: this.config.stt.model,
            language: this.config.stt.language,
            apiKey: this.config.stt.extra?.apiKey,
            ...this.config.stt.extra,
          }
        }
      }

      if (this.config.llm) {
        const llmDescriptor = this.buildLLMDescriptor()
        if (llmDescriptor) {
          config.llm = llmDescriptor
        } else {
          config.llm = {
            provider: this.config.llm.provider,
            model: this.config.llm.model,
            temperature: this.config.llm.temperature,
            maxTokens: this.config.llm.maxTokens,
            apiKey: this.config.llm.apiKey,
            baseUrl: this.config.llm.baseUrl,
            ...this.config.llm.extra,
          }
        }
      }

      if (this.config.tts) {
        const ttsDescriptor = this.buildTTSDescriptor()
        if (ttsDescriptor) {
          config.tts = ttsDescriptor
        } else {
          config.tts = {
            provider: this.config.tts.provider,
            model: this.config.tts.model,
            voice: this.config.tts.voice,
            speed: this.config.tts.speed,
            apiKey: this.config.tts.apiKey,
            ...this.config.tts.extra,
          }
        }
      }
    }

    // VAD config
    if (this.config.vad) {
      config.vad = {
        provider: this.config.vad.provider ?? 'silero',
        minSpeechDuration: this.config.vad.minSpeechDuration,
        minSilenceDuration: this.config.vad.minSilenceDuration,
        threshold: this.config.vad.threshold,
      }
    }

    // Enhancements
    const enhancements = this.config.enhancements
    if (enhancements) {
      // Turn detection
      if (enhancements.turnDetection) {
        config.turnDetection = enhancements.turnDetection.mode ?? 'model'
        config.allowInterruptions = enhancements.turnDetection.allowInterruptions ?? true
        config.minInterruptionDuration = enhancements.turnDetection.minInterruptionDuration
        config.minInterruptionWords = enhancements.turnDetection.minInterruptionWords
        config.minEndpointingDelay = enhancements.turnDetection.minEndpointingDelay
        config.maxEndpointingDelay = enhancements.turnDetection.maxEndpointingDelay
      }

      // Noise cancellation
      if (enhancements.noiseCancellation?.enabled) {
        config.noiseCancellation = {
          enabled: true,
          mode: enhancements.noiseCancellation.mode ?? 'bvc',
          level: enhancements.noiseCancellation.level,
        }
      }

      // Other enhancements
      config.echoCancellation = enhancements.echoCancellation
      config.autoGainControl = enhancements.autoGainControl
      config.preemptiveGeneration = enhancements.preemptiveGeneration
    }

    // Session options
    config.userAwayTimeout = this.userAwayTimeout
    config.minConsecutiveSpeechDelay = this.minConsecutiveSpeechDelay

    return config
  }

  /**
   * Create a VoiceSession from LiveKit Inference descriptors
   */
  static fromDescriptors(options: {
    stt?: string
    llm?: string
    tts?: string
    instructions?: string
  }): VoiceSession {
    const pipeline: VoicePipelineConfig = { type: 'stt-llm-tts' }

    // Parse STT descriptor (format: provider/model:language)
    if (options.stt) {
      const [providerModel, language] = options.stt.split(':')
      const [provider, model] = providerModel?.split('/') ?? []
      if (provider && model) {
        pipeline.stt = {
          provider: provider as STTConfig['provider'],
          model,
          language: language as STTConfig['language'],
          useInference: true,
        }
      }
    }

    // Parse LLM descriptor (format: provider/model)
    if (options.llm) {
      const [provider, model] = options.llm.split('/')
      if (provider && model) {
        pipeline.llm = {
          provider: provider as LLMConfig['provider'],
          model,
          useInference: true,
        }
      }
    }

    // Parse TTS descriptor (format: provider/model:voice)
    if (options.tts) {
      const [providerModel, voice] = options.tts.split(':')
      const [provider, model] = providerModel?.split('/') ?? []
      if (provider && model) {
        pipeline.tts = {
          provider: provider as TTSConfig['provider'],
          model,
          voice,
          useInference: true,
        }
      }
    }

    return new VoiceSession({
      pipeline,
      instructions: options.instructions,
    })
  }
}
