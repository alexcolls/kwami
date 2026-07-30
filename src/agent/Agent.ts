import type { AgentConfig, AgentPipeline, PipelineConnectOptions, SoulConfig, ToolDefinition } from '../types'
import type { AgentAdapter } from './adapters/types'
import type { VoicePipelineConfig } from './voice/types'
import { LiveKitAdapter } from './adapters/LiveKitAdapter'
import { logger } from '../utils/logger'

// Forward declaration to avoid circular dependency
interface KwamiRef {
  id: string
  soul: { getConfig(): SoulConfig }
}

/**
 * Agent - Manages AI processing pipelines
 * 
 * The Agent is responsible for:
 * - Creating and managing the appropriate pipeline (voice, realtime, multimodal)
 * - Connecting to backend services via adapters (LiveKit, etc.)
 * - Handling conversation flow
 * - Syncing configuration updates to the backend in real-time
 * 
 * The actual AI processing happens on the backend (Python agent deployed to LiveKit).
 * This class manages the frontend connection and configuration.
 */
export class Agent {
  private config: AgentConfig
  private adapter: AgentAdapter | null = null
  private pipeline: AgentPipeline | null = null
  private clientTools: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map()

  // Callbacks
  private onUserSpeechCallback?: (transcript: string) => void
  private onAgentTextCallback?: (text: string) => void
  private onInterimTranscriptCallback?: (text: string) => void
  private _onErrorCallback?: (error: Error) => void
  private onAgentAudioStreamCallback?: (stream: MediaStream) => void

  constructor(config?: AgentConfig, _kwamiRef?: KwamiRef) {
    this.config = config ?? {}
    this.initAdapter()
  }

  private initAdapter(): void {
    const adapterType = this.config.adapter ?? 'livekit'

    switch (adapterType) {
      case 'livekit':
        this.adapter = new LiveKitAdapter(this.config.livekit)
        break
      default:
        logger.warn(`Unknown adapter type: ${adapterType}, falling back to livekit`)
        this.adapter = new LiveKitAdapter(this.config.livekit)
    }

    logger.debug(`Agent initialized with ${this.adapter.getName()} adapter`)
  }

  /**
   * Connect to the AI backend and start conversation
   * Dispatches a unique agent instance with the provided configuration
   */
  async connect(options?: PipelineConnectOptions): Promise<void> {
    if (!this.adapter) {
      throw new Error('No adapter configured')
    }

    if (!this.adapter.isConfigured()) {
      throw new Error('Adapter is not properly configured. Check your credentials.')
    }

    // Create pipeline from adapter
    this.pipeline = this.adapter.createPipeline()

    // Wire up callbacks
    if (this.onUserSpeechCallback) {
      this.pipeline.onUserSpeech(this.onUserSpeechCallback)
    }
    if (this.onAgentTextCallback) {
      this.pipeline.onAgentText(this.onAgentTextCallback)
    }
    if (this.onInterimTranscriptCallback && typeof this.pipeline.onInterimTranscript === 'function') {
      this.pipeline.onInterimTranscript(this.onInterimTranscriptCallback)
    }

    // Wire up agent audio stream callback for avatar visualization
    if (this.onAgentAudioStreamCallback && 'onAgentAudioStream' in this.pipeline) {
      (this.pipeline as AgentPipeline & { onAgentAudioStream: (cb: (s: MediaStream) => void) => void })
        .onAgentAudioStream(this.onAgentAudioStreamCallback)
    }

    // Register tool executor
    this.pipeline.setToolExecutor(this.handleToolExecution.bind(this))

    // Append dynamically registered tools to options
    const optionsWithTools = options ? { ...options } : {}
    if (this.clientTools.size > 0) {
      if (!optionsWithTools.tools) {
        optionsWithTools.tools = []
      }
      // Note: We currently rely on the user passing 'tools' definitions in options.
      // Ideally 'registerTool' would take definitions too.
    }

    // Connect with full Kwami config for agent dispatch
    await this.pipeline.connect(optionsWithTools)
    logger.info('Agent connected')
  }

  /**
   * Disconnect from the AI backend
   */
  async disconnect(): Promise<void> {
    await this.pipeline?.disconnect()
    this.pipeline = null
    logger.info('Agent disconnected')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.pipeline?.isConnected() ?? false
  }

  // ---------------------------------------------------------------------------
  // Voice Configuration
  // ---------------------------------------------------------------------------

  /**
   * Get the current voice pipeline configuration
   */
  getVoiceConfig(): VoicePipelineConfig | undefined {
    return this.config.livekit?.voice
  }

  /**
   * Update voice pipeline configuration
   * Use syncConfigToBackend() to push changes to the running agent
   */
  updateVoiceConfig(config: Partial<VoicePipelineConfig>): void {
    if (!this.config.livekit) {
      this.config.livekit = {}
    }
    this.config.livekit.voice = {
      ...this.config.livekit.voice,
      ...config,
    }

    // Update adapter config
    if (this.adapter && 'updateConfig' in this.adapter) {
      (this.adapter as LiveKitAdapter).updateConfig({ voice: this.config.livekit.voice })
    }
  }

  /**
   * Sync configuration changes to the backend agent in real-time
   * This sends a data message to the running agent to update its config
   */
  syncConfigToBackend(
    type: 'voice' | 'soul' | 'tools' | 'full' | 'llm' | 'memory',
    config: VoicePipelineConfig | SoulConfig | ToolDefinition[] | Record<string, unknown>
  ): void {
    if (!this.pipeline?.isConnected()) {
      logger.warn('Cannot sync config: not connected')
      return
    }

    // Send config update via the pipeline's data channel
    if (this.pipeline && 'sendConfigUpdate' in this.pipeline) {
      (this.pipeline as AgentPipeline & { sendConfigUpdate: (type: string, config: unknown) => void })
        .sendConfigUpdate(type, config)
    }
  }

  /**
   * Get the current pipeline (for direct access to sendConfigUpdate, sendSearchSimilar, etc.)
   */
  getPipeline(): AgentPipeline | null {
    return this.pipeline
  }

  /**
   * Ask the agent to search for similar products to the given result (e.g. from "Find similar" on a card).
   */
  sendSearchSimilar(title: string, url: string): void {
    const pipeline = this.getPipeline()
    if (pipeline && 'sendSearchSimilar' in pipeline) {
      (pipeline as AgentPipeline & { sendSearchSimilar: (title: string, url: string) => void })
        .sendSearchSimilar(title, url)
    }
  }

  /**
   * Update voice settings mid-conversation (TTS and STT)
   * This is a convenience method for common voice updates
   */
  updateVoiceLive(options: {
    // TTS options
    tts_provider?: string
    tts_model?: string
    tts_voice?: string
    tts_speed?: number
    // STT options
    stt_provider?: string
    stt_model?: string
    stt_language?: string
    // Legacy aliases
    voice?: string
    speed?: number
    language?: string
    model?: string
  }): void {
    logger.info('🔊 updateVoiceLive called with:', options)
    logger.info('🔌 Pipeline connected:', this.pipeline?.isConnected() ?? false)
    this.syncConfigToBackend('voice', options)
  }

  /**
   * Update LLM settings mid-conversation (provider, model, temperature)
   * Note: Changing LLM provider requires agent restart on the backend
   */
  updateLlmLive(options: {
    provider?: string
    model?: string
    temperature?: number
  }): void {
    logger.info('🧠 updateLlmLive called with:', options)
    logger.info('🔌 Pipeline connected:', this.pipeline?.isConnected() ?? false)
    this.syncConfigToBackend('llm', options)
  }

  /**
   * Update STT settings mid-conversation (provider, model, language)
   * Note: Changing STT provider requires agent restart on the backend
   */
  updateSttLive(options: {
    provider?: string
    model?: string
    language?: string
  }): void {
    logger.info('🎤 updateSttLive called with:', options)
    logger.info('🔌 Pipeline connected:', this.pipeline?.isConnected() ?? false)
    this.syncConfigToBackend('voice', {
      stt_provider: options.provider,
      stt_model: options.model,
      stt_language: options.language,
    })
  }

  /**
   * Update TTS settings mid-conversation (provider, model, voice, speed)
   * Note: Changing TTS provider requires agent restart on the backend
   */
  updateTtsLive(options: {
    provider?: string
    model?: string
    voice?: string
    speed?: number
  }): void {
    logger.info('🔊 updateTtsLive called with:', options)
    logger.info('🔌 Pipeline connected:', this.pipeline?.isConnected() ?? false)
    this.syncConfigToBackend('voice', {
      tts_provider: options.provider,
      tts_model: options.model,
      tts_voice: options.voice,
      tts_speed: options.speed,
    })
  }

  /**
   * Update Realtime model settings mid-conversation (provider, model, voice)
   * Note: Changing provider requires agent restart on the backend
   */
  updateRealtimeLive(options: {
    provider?: string
    model?: string
    voice?: string
  }): void {
    logger.info('⚡ updateRealtimeLive called with:', options)
    logger.info('🔌 Pipeline connected:', this.pipeline?.isConnected() ?? false)
    this.syncConfigToBackend('voice', {
      realtime_provider: options.provider,
      realtime_model: options.model,
      realtime_voice: options.voice,
    })
  }

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  /**
   * Register callback for user speech transcripts
   */
  onUserSpeech(callback: (transcript: string) => void): void {
    const previous = this.onUserSpeechCallback
    this.onUserSpeechCallback = (transcript: string) => {
      previous?.(transcript)
      callback(transcript)
    }
    this.pipeline?.onUserSpeech(this.onUserSpeechCallback)
  }

  /**
   * Register callback for agent text responses
   */
  onAgentText(callback: (text: string) => void): void {
    const previous = this.onAgentTextCallback
    this.onAgentTextCallback = (text: string) => {
      previous?.(text)
      callback(text)
    }
    this.pipeline?.onAgentText(this.onAgentTextCallback)
  }

  /**
   * Register callback for interim user speech (STT in progress)
   */
  onInterimTranscript(callback: (text: string) => void): void {
    const previous = this.onInterimTranscriptCallback
    this.onInterimTranscriptCallback = (text: string) => {
      previous?.(text)
      callback(text)
    }
    if (this.pipeline && typeof this.pipeline.onInterimTranscript === 'function') {
      this.pipeline.onInterimTranscript(this.onInterimTranscriptCallback)
    }
  }

  /**
   * Register callback for agent audio responses
   */
  onAgentSpeech(callback: (audio: ArrayBuffer) => void): void {
    this.pipeline?.onAgentSpeech(callback)
  }

  /**
   * Register error callback
   */
  onError(callback: (error: Error) => void): void {
    this._onErrorCallback = callback
  }

  /**
   * Register callback for agent audio stream (for avatar visualization)
   */
  onAgentAudioStream(callback: (stream: MediaStream) => void): void {
    this.onAgentAudioStreamCallback = callback
    // If pipeline exists and has the method, register immediately
    if (this.pipeline && 'onAgentAudioStream' in this.pipeline) {
      (this.pipeline as AgentPipeline & { onAgentAudioStream: (cb: (s: MediaStream) => void) => void })
        .onAgentAudioStream(callback)
    }
  }

  /**
   * Register callback for voice session state changes
   */
  onStateChange(callback: (state: 'idle' | 'listening' | 'thinking' | 'speaking' | 'initializing') => void): void {
    // Wire up via adapter's voice session
    if (this.adapter && 'getVoiceSession' in this.adapter) {
      const voiceSession = (this.adapter as LiveKitAdapter).getVoiceSession()
      voiceSession.on({
        onStateChange: callback
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Send text message to agent
   */
  send(text: string): void {
    if (!this.pipeline?.isConnected()) {
      logger.warn('Cannot send text: not connected')
      return
    }
    this.pipeline.sendText(text)
  }

  /**
   * Interrupt the current agent response
   */
  interrupt(): void {
    this.pipeline?.interrupt()
  }

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  /**
   * Get the error callback
   */
  getErrorCallback(): ((error: Error) => void) | undefined {
    return this._onErrorCallback
  }

  /**
   * Get current configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config }
  }

  /**
   * Update configuration (may require reconnect for some changes)
   */
  updateConfig(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config }

    // Reinitialize adapter if adapter type changed
    if (config.adapter) {
      this.adapter?.dispose()
      this.initAdapter()
    }

    // Update adapter config for livekit changes
    if (config.livekit && this.adapter && 'updateConfig' in this.adapter) {
      (this.adapter as LiveKitAdapter).updateConfig(config.livekit)
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.pipeline?.dispose()
    this.adapter?.dispose()
    this.pipeline = null
    this.adapter = null
  }

  // ---------------------------------------------------------------------------
  // Tooling
  // ---------------------------------------------------------------------------

  /**
   * Register a client-side tool that the agent can call
   */
  registerTool(
    name: string,
    handler: (args: Record<string, unknown>) => Promise<unknown>
  ): void {
    this.clientTools.set(name, handler)
    logger.info(`Registered client tool: ${name}`)
  }

  /**
   * Unregister a client-side tool so the backend can no longer invoke it.
   */
  unregisterTool(name: string): void {
    this.clientTools.delete(name)
    logger.info(`Unregistered client tool: ${name}`)
  }

  /**
   * Handle dynamic tool execution
   */
  private async handleToolExecution(name: string, args: Record<string, unknown>): Promise<string> {
    const handler = this.clientTools.get(name)
    if (!handler) {
      throw new Error(`Tool not found: ${name}`)
    }

    try {
      logger.info(`Executing tool ${name} with args:`, args)
      const result = await handler(args)

      if (typeof result === 'string') return result
      return JSON.stringify(result)
    } catch (error) {
      logger.error(`Error executing tool ${name}:`, error)
      return `Error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
