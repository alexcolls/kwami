import type {
  TrackPublication,
  RemoteTrack,
  RemoteParticipant,
  Participant,
  LocalParticipant,
  DataPacket_Kind,
  LocalAudioTrack,
  TranscriptionSegment,
} from 'livekit-client';
import {
  Room,
  RoomEvent,
  Track,
  ConnectionState,
  createLocalTracks
} from 'livekit-client'
import type { AgentPipeline, PipelineConnectOptions, ToolExecutor } from '../../types'
import type { AgentAdapter, LiveKitAdapterConfig } from './types'
import type { VoiceLatencyMetrics, VoicePipelineMetrics } from '../voice/types'
import { VoiceSession } from '../voice/VoiceSession'
import { logger } from '../../utils/logger'

/**
 * LiveKit Adapter
 * 
 * Connects Kwami to LiveKit for real-time voice AI.
 * Supports full configuration of the voice pipeline including:
 * - VAD (Voice Activity Detection)
 * - STT (Speech-to-Text)
 * - LLM (Large Language Model)
 * - TTS (Text-to-Speech)
 * - Realtime models
 * - Voice enhancements (turn detection, noise cancellation)
 * - Metrics collection
 */
export class LiveKitAdapter implements AgentAdapter {
  private config: LiveKitAdapterConfig
  private voiceSession: VoiceSession

  constructor(config?: LiveKitAdapterConfig) {
    this.config = config ?? {}

    // Initialize voice session with config
    this.voiceSession = new VoiceSession({
      pipeline: this.config.voice,
      instructions: this.config.instructions,
      events: this.config.events,
      userAwayTimeout: this.config.userAwayTimeout,
      minConsecutiveSpeechDelay: this.config.minConsecutiveSpeechDelay,
    })
  }

  getName(): string {
    return 'livekit'
  }

  isConfigured(): boolean {
    // Need either a token or token endpoint
    return !!(this.config.token || this.config.tokenEndpoint)
  }

  createPipeline(): AgentPipeline {
    return new LiveKitPipeline(this.config, this.voiceSession)
  }

  /**
   * Get the voice session for configuration
   */
  getVoiceSession(): VoiceSession {
    return this.voiceSession
  }

  /**
   * Get current configuration
   */
  getConfig(): LiveKitAdapterConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LiveKitAdapterConfig>): void {
    this.config = { ...this.config, ...config }

    // Update voice session if voice config changed
    if (config.voice) {
      this.voiceSession.updateConfig(config.voice)
    }
    if (config.instructions !== undefined) {
      this.voiceSession.setInstructions(config.instructions)
    }
  }

  dispose(): void {
    // Nothing to cleanup at adapter level
  }
}

/**
 * Data message types from the backend agent
 */
interface AgentDataMessage {
  type: 'transcript' | 'agent_text' | 'state' | 'error' | 'metrics' | 'tool_call' | 'search_results' | 'remove_result' | 'nav_command'
  toolCallId?: string
  function?: { name: string; arguments: string }
  transcript?: string
  text?: string
  isFinal?: boolean
  state?: 'listening' | 'thinking' | 'speaking'
  error?: string
  metrics?: VoiceLatencyMetrics
  /** search_results payload from agent web_search tool */
  query?: string
  results?: Array<{
    title: string
    url: string
    content: string
    image?: string
    features?: string[]
    product_name?: string
    price?: string | null
  }>
  answer?: string
  /** remove_result: agent asks client to remove card at this index */
  index?: number
  /** nav_command fields */
  action?: string
  url?: string
  description?: string
  inputText?: string
  element_id?: string
}

/**
 * LiveKit agent state participant attribute key.
 * The LiveKit Agents SDK automatically sets this attribute on the agent
 * participant to reflect the current pipeline state.
 */
const AGENT_STATE_ATTRIBUTE = 'lk.agent.state'

/**
 * Check whether a participant is the agent (not a regular user).
 */
function isAgentParticipant(participant: Participant | RemoteParticipant): boolean {
  const identity = participant.identity.toLowerCase()
  return identity.startsWith('agent') ||
    (identity.includes('kwami') && !identity.includes('user'))
}

/**
 * LiveKit Pipeline Implementation
 * 
 * Handles the actual WebRTC connection to LiveKit and voice pipeline management.
 */
class LiveKitPipeline implements AgentPipeline {
  private config: LiveKitAdapterConfig
  private voiceSession: VoiceSession
  private room: Room | null = null
  private localAudioTrack: LocalAudioTrack | null = null
  private agentAudioStream: MediaStream | null = null
  private _sendDataHandler: EventListener | null = null

  // Timestamps for latency tracking
  private sttStartTime = 0
  private llmStartTime = 0
  private ttsStartTime = 0
  private turnStartTime = 0

  // Callbacks
  private userSpeechCb?: (transcript: string) => void
  private agentTextCb?: (text: string) => void
  private interimTranscriptCb?: (text: string) => void
  private onAgentAudioStreamCb?: (stream: MediaStream) => void
  private toolExecutor?: ToolExecutor

  constructor(config: LiveKitAdapterConfig, voiceSession: VoiceSession) {
    this.config = config
    this.voiceSession = voiceSession
  }

  setToolExecutor(executor: ToolExecutor): void {
    this.toolExecutor = executor
  }

  async connect(options: PipelineConnectOptions): Promise<void> {
    logger.info('LiveKit pipeline connecting...')

    // Get token
    let token = this.config.token

    if (!token && this.config.tokenEndpoint) {
      token = await this.fetchToken()
    }

    if (!token) {
      throw new Error('No LiveKit token available. Provide token or tokenEndpoint.')
    }

    const serverUrl = this.config.url
    if (!serverUrl) {
      throw new Error('No LiveKit server URL configured.')
    }

    // Start voice session metrics
    this.voiceSession.startMetrics()
    this.voiceSession.setState('initializing')

    // Create Room instance
    this.room = new Room({
      adaptiveStream: this.config.adaptiveStream ?? true,
      dynacast: this.config.dynacast ?? true,
      audioCaptureDefaults: {
        echoCancellation: this.config.echoCancellation ?? true,
        noiseSuppression: this.config.noiseSuppression ?? true,
        autoGainControl: this.config.autoGainControl ?? true,
      },
    })

    // Set up event listeners
    this.setupRoomEvents()

    try {
      // Connect to the room
      await this.room.connect(serverUrl, token, {
        autoSubscribe: this.config.autoSubscribe ?? true,
      })

      logger.info(`Connected to LiveKit room: ${this.room.name}`)

      // Check for agent participant that may already be in the room
      for (const [, p] of this.room.remoteParticipants) {
        if (isAgentParticipant(p)) {
          const agentState = p.attributes?.[AGENT_STATE_ATTRIBUTE]
          if (agentState) {
            logger.info('Found existing agent state on connect:', agentState)
            this.applyAgentState(agentState)
          }
        }
      }

      // Publish local audio track (microphone)
      if (this.config.audioInputEnabled !== false) {
        await this.publishMicrophone()
      }

      // Send voice config to backend agent via data channel
      await this.sendVoiceConfig(options)

      // Listen for data that the client wants to send back to the agent
      this.setupClientToAgentDataRelay()

      this.voiceSession.setState('listening')
      logger.info('LiveKit pipeline connected')
    } catch (error) {
      logger.error('Failed to connect to LiveKit:', error)
      this.voiceSession.setState('idle')
      throw error
    }
  }

  /**
   * Relay data from the client to the agent via the LiveKit data channel.
   * Clients dispatch kwami:send_data with a Uint8Array payload.
   */
  private setupClientToAgentDataRelay(): void {
    if (typeof window === 'undefined') return
    this._sendDataHandler = ((e: CustomEvent) => {
      if (!this.room) return
      const payload = e.detail as Uint8Array
      if (payload) {
        this.room.localParticipant.publishData(payload, { reliable: true })
          .catch(err => logger.warn('Failed to relay data to agent:', err))
      }
    }) as EventListener
    window.addEventListener('kwami:send_data', this._sendDataHandler)
  }

  /**
   * Set up room event listeners
   */
  private setupRoomEvents(): void {
    if (!this.room) return

    // Connection state changes
    this.room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      logger.debug('Connection state changed:', state)

      if (state === ConnectionState.Disconnected) {
        this.voiceSession.setState('idle')
      }
    })

    // Track subscribed - agent audio comes through here
    this.room.on(RoomEvent.TrackSubscribed, (
      track: RemoteTrack,
      _publication: TrackPublication,
      participant: RemoteParticipant
    ) => {
      logger.debug(`Track subscribed: ${track.kind} from ${participant.identity}`)

      if (track.kind === Track.Kind.Audio) {
        // Only play audio from the agent participant, not other users
        if (!isAgentParticipant(participant)) {
          logger.debug(`Skipping audio from non-agent participant: ${participant.identity}`)
          return
        }

        // This is the agent's audio response
        // Attach to an audio element to play it
        const audioElement = track.attach()
        audioElement.id = 'kwami-agent-audio'

        document.body.appendChild(audioElement)

        // Connect agent audio to the avatar's audio analyzer for visualization
        this.connectAgentAudioToAvatar(track)
      }

    })

    // Track unsubscribed
    this.room.on(RoomEvent.TrackUnsubscribed, (
      track: RemoteTrack,
      _publication: TrackPublication,
      participant: RemoteParticipant
    ) => {
      logger.debug(`Track unsubscribed: ${track.kind} from ${participant.identity}`)
      track.detach()
    })

    // Data received - transcripts and agent messages come through here
    this.room.on(RoomEvent.DataReceived, (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind
    ) => {
      try {
        const decoder = new TextDecoder()
        const jsonStr = decoder.decode(payload)
        const data: AgentDataMessage = JSON.parse(jsonStr)
        if (data.type === 'search_results') {
          logger.info('DataReceived search_results', {
            from: participant?.identity ?? 'unknown',
            query: data.query,
            resultsCount: data.results?.length ?? 0,
          })
        }
        this.handleAgentData(data)
      } catch (error) {
        logger.error('Failed to parse data message:', error)
      }
    })

    // Transcriptions from the LiveKit Agents SDK (user speech + agent text).
    // The agent's STT publishes transcriptions for the user's track, and the
    // agent's LLM/TTS text is published for the agent's track.
    this.room.on(RoomEvent.TranscriptionReceived, (
      segments: TranscriptionSegment[],
      participant?: Participant,
      _publication?: TrackPublication,
    ) => {
      const fromAgent = participant ? isAgentParticipant(participant) : false

      for (const segment of segments) {
        if (fromAgent) {
          // Agent text output (LLM response transcript)
          if (segment.final && segment.text) {
            this.agentTextCb?.(segment.text)
            this.voiceSession.triggerAgentSpeechEnded(segment.text)
          }
        } else {
          // User speech transcript from the agent's STT
          if (segment.final && segment.text) {
            this.userSpeechCb?.(segment.text)
            this.voiceSession.triggerUserSpeechEnded(segment.text)
            // Immediate thinking fallback; lk.agent.state will refine it.
            this.voiceSession.setState('thinking')
          } else if (segment.text) {
            this.interimTranscriptCb?.(segment.text)
            this.voiceSession.triggerTranscript(segment.text, false)
          }
        }
      }
    })

    // Participant disconnected
    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      logger.info(`Participant disconnected: ${participant.identity}`)
    })

    // Local track published
    this.room.on(RoomEvent.LocalTrackPublished, (publication, _participant: LocalParticipant) => {
      logger.debug(`Local track published: ${publication.kind}`)
    })

    // Agent state via participant attributes (ground truth from LiveKit Agents SDK).
    // The agent pipeline automatically sets `lk.agent.state` on its participant
    // to reflect the real pipeline state (listening, thinking, speaking).
    // This overrides the local fallback states set in handleAgentData / audio events.
    this.room.on(RoomEvent.ParticipantAttributesChanged, (
      changedAttributes: Record<string, string>,
      participant: Participant
    ) => {
      if (!isAgentParticipant(participant)) return

      const agentState = changedAttributes[AGENT_STATE_ATTRIBUTE]
      if (agentState) {
        logger.info('Agent state (lk.agent.state):', agentState)
        this.applyAgentState(agentState)
      }
    })

    // When the agent participant connects, read its current attributes
    // to pick up any state set before we joined.
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      logger.info(`Participant connected: ${participant.identity}`)
      if (isAgentParticipant(participant)) {
        const agentState = participant.attributes?.[AGENT_STATE_ATTRIBUTE]
        if (agentState) {
          logger.info('Initial agent state from attributes:', agentState)
          this.applyAgentState(agentState)
        }
      }
    })

    // Audio playback status changed
    this.room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!this.room?.canPlaybackAudio) {
        logger.warn('Audio playback blocked. User interaction required.')
        // You may want to show a UI prompt to the user
      }
    })

    // Disconnected
    this.room.on(RoomEvent.Disconnected, (reason) => {
      logger.info('Disconnected from room:', reason)
      this.voiceSession.setState('idle')
    })

    // Reconnecting
    this.room.on(RoomEvent.Reconnecting, () => {
      logger.info('Reconnecting to room...')
    })

    // Reconnected
    this.room.on(RoomEvent.Reconnected, () => {
      logger.info('Reconnected to room')
    })
  }

  /**
   * Apply a validated agent state string to the voice session.
   */
  private applyAgentState(agentState: string): void {
    const validStates = ['initializing', 'listening', 'thinking', 'speaking'] as const
    type AgentStateValue = typeof validStates[number]

    if ((validStates as readonly string[]).includes(agentState)) {
      this.voiceSession.setState(agentState as AgentStateValue)
    }
  }

  /**
   * Connect agent audio track to avatar for visualization
   * Creates a MediaStream from the track that can be analyzed
   */
  private connectAgentAudioToAvatar(track: RemoteTrack): void {
    try {
      // Get the MediaStreamTrack from the LiveKit track
      const mediaStreamTrack = track.mediaStreamTrack
      if (mediaStreamTrack) {
        // Create a MediaStream containing the agent's audio
        this.agentAudioStream = new MediaStream([mediaStreamTrack])

        // Notify any listeners that agent audio is available
        this.onAgentAudioStreamCb?.(this.agentAudioStream)

        logger.debug('Connected agent audio to avatar visualization')
      }
    } catch (error) {
      logger.warn('Failed to connect agent audio to avatar:', error)
    }
  }

  /**
   * Handle data messages from the backend agent
   */
  private handleAgentData(data: AgentDataMessage): void {
    switch (data.type) {
      case 'transcript':
        // User speech transcript from STT
        if (data.isFinal && data.transcript) {
          this.endSTTTracking()
          this.userSpeechCb?.(data.transcript)
          this.voiceSession.triggerUserSpeechEnded(data.transcript)
          // Immediate local fallback so the avatar reacts right away.
          // The real agent state from lk.agent.state will override if needed.
          this.voiceSession.setState('thinking')
        } else if (data.transcript) {
          // Interim transcript
          this.interimTranscriptCb?.(data.transcript)
          this.voiceSession.triggerTranscript(data.transcript, false)
        }
        break

      case 'agent_text':
        // Agent's text response (for display)
        if (data.text) {
          this.agentTextCb?.(data.text)
          this.voiceSession.triggerAgentSpeechEnded(data.text)
        }
        break

      case 'state':
        // Agent state change
        if (data.state) {
          this.voiceSession.setState(data.state)
        }
        break

      case 'metrics':
        // Latency metrics from backend
        if (data.metrics) {
          this.voiceSession.updateLatency(data.metrics)
        }
        break

      case 'error':
        // Error from agent
        logger.error('Agent error:', data.error)
        break

      case 'tool_call':
        // Handle dynamic tool call from agent
        if (data.toolCallId && data.function && this.toolExecutor) {
          const { toolCallId, function: fn } = data

          let args: Record<string, unknown> = {}
          try {
            args = JSON.parse(fn.arguments)
          } catch {
            logger.error('Failed to parse tool arguments', fn.arguments)
          }

          this.toolExecutor(fn.name, args)
            .then(result => {
              this.sendToolResult(toolCallId, result)
            })
            .catch(err => {
              this.sendToolResult(toolCallId, '', String(err))
            })
        } else {
          logger.warn('Received tool_call but no executor configured or missing data', data)
        }
        break

      case 'search_results':
        // Server-side web search results (from LiveKit agent) for UI display
        if (data.query !== undefined && Array.isArray(data.results)) {
          const payload = {
            query: data.query,
            results: data.results,
            answer: data.answer ?? null,
          }
          const withImage = data.results?.filter((r: { image?: string }) => r?.image).length ?? 0
          logger.info('Search results received, updating UI', { query: data.query, resultsCount: data.results.length, withImage })
          this.config.onSearchResults?.(payload)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('kwami:search_results', {
                detail: payload,
              }),
            )
          }
        } else {
          logger.warn('search_results ignored: missing query/results or not in browser', {
            hasQuery: data.query !== undefined,
            isArray: Array.isArray(data.results),
            inBrowser: typeof window !== 'undefined',
          })
        }
        break

      case 'remove_result':
        if (typeof data.index === 'number') {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('kwami:remove_result', { detail: { index: data.index } }))
          }
        }
        break

      case 'nav_command':
        logger.info('Navigation command:', data.action, data.url || data.description)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kwami:nav_command', {
            detail: {
              action: data.action,
              url: data.url,
              description: data.description,
              text: data.inputText,
              elementId: data.element_id ?? (data as { elementId?: string }).elementId,
            },
          }))
        }
        break
    }
  }

  /**
   * Send "find similar" request to the agent (from a search result card).
   * The agent will run a new product search for similar items.
   */
  sendSearchSimilar(title: string, url: string): void {
    if (!this.room) return
    const message = { type: 'search_similar' as const, title: String(title).slice(0, 200), url: String(url).slice(0, 500) }
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(message))
    this.room.localParticipant.publishData(data, { reliable: true })
      .then(() => logger.info('Sent search_similar to agent'))
      .catch((err) => logger.warn('Failed to send search_similar:', err))
  }

  /**
   * Publish microphone audio track
   */
  private async publishMicrophone(): Promise<void> {
    if (!this.room) return

    try {
      const tracks = await createLocalTracks({
        audio: {
          echoCancellation: this.config.echoCancellation ?? true,
          noiseSuppression: this.config.noiseSuppression ?? true,
          autoGainControl: this.config.autoGainControl ?? true,
        },
        video: false,
      })

      const audioTrack = tracks.find(t => t.kind === Track.Kind.Audio) as LocalAudioTrack
      if (audioTrack) {
        this.localAudioTrack = audioTrack
        await this.room.localParticipant.publishTrack(audioTrack)
        logger.info('Microphone published')
      }
    } catch (error) {
      logger.error('Failed to publish microphone:', error)
      throw error
    }
  }

  /**
   * Send full Kwami config to backend agent for initial setup
   * This includes soul, voice pipeline, tools, and unique identifiers
   */
  private async sendVoiceConfig(options: PipelineConnectOptions): Promise<void> {
    if (!this.room) return

    // Build the full configuration message for agent dispatch
    const configMessage = {
      type: 'config',
      // Unique identifiers for this Kwami instance
      // Use options.kwamiId, or fall back to config.userId for memory persistence
      kwamiId: options.kwamiId ?? this.config.userId,
      kwamiName: options.kwamiName,
      // Voice pipeline configuration (STT, LLM, TTS, etc.)
      voice: options.voice ?? this.voiceSession.toLiveKitConfig(),
      // Soul configuration (personality, system prompt, traits)
      soul: options.soul,
      // Tool definitions
      tools: options.tools,
      // Timestamp for debugging
      timestamp: Date.now(),
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(configMessage))

    // Log detailed config being sent
    logger.info('📤 Sending config to agent:', {
      kwamiId: options.kwamiId,
      kwamiName: options.kwamiName,
      voice: configMessage.voice,
    })

    await this.room.localParticipant.publishData(data, {
      reliable: true,
    })

    logger.info('✅ Config sent to agent')
  }

  async disconnect(): Promise<void> {
    logger.info('LiveKit pipeline disconnecting...')

    // Remove client-to-agent data relay
    if (this._sendDataHandler && typeof window !== 'undefined') {
      window.removeEventListener('kwami:send_data', this._sendDataHandler)
      this._sendDataHandler = null
    }

    // Stop local audio track
    if (this.localAudioTrack) {
      this.localAudioTrack.stop()
      this.localAudioTrack = null
    }

    // Clean up agent audio stream
    if (this.agentAudioStream) {
      this.agentAudioStream.getTracks().forEach(track => track.stop())
      this.agentAudioStream = null
    }

    // Remove agent audio element from DOM
    const audioEl = document.getElementById('kwami-agent-audio')
    if (audioEl) {
      audioEl.remove()
    }

    // Disconnect from room
    if (this.room) {
      await this.room.disconnect()
      this.room = null
    }

    // Clear cached room name so the next connection creates a fresh room.
    // Reusing the same room name can cause the old (shutting-down) agent to
    // receive config meant for the new session, or LiveKit to dispatch a
    // second agent into a room that still has a lingering one.
    this.config.roomName = undefined

    this.voiceSession.setState('idle')
  }

  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected
  }

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  onUserSpeech(callback: (transcript: string) => void): void {
    this.userSpeechCb = callback
    this.voiceSession.on({
      onUserSpeechEnded: callback,
    })
  }

  onAgentSpeech(_callback: (audio: ArrayBuffer) => void): void {
    // Reserved for raw audio streaming - not yet implemented
    // Audio is currently handled via Track subscription
  }

  onAgentText(callback: (text: string) => void): void {
    this.agentTextCb = callback
    this.voiceSession.on({
      onAgentSpeechEnded: callback,
    })
  }

  onInterimTranscript(callback: (text: string) => void): void {
    this.interimTranscriptCb = callback
    this.voiceSession.on({
      onTranscript: (text, isFinal) => {
        if (!isFinal) callback(text)
      },
    })
  }

  /**
   * Register callback for when agent audio stream becomes available
   * This allows connecting the audio to avatar visualization
   */
  onAgentAudioStream(callback: (stream: MediaStream) => void): void {
    this.onAgentAudioStreamCb = callback
    // If stream already exists, call immediately
    if (this.agentAudioStream) {
      callback(this.agentAudioStream)
    }
  }

  /**
   * Get the current agent audio stream if available
   */
  getAgentAudioStream(): MediaStream | null {
    return this.agentAudioStream
  }

  // ---------------------------------------------------------------------------
  // Latency Tracking
  // ---------------------------------------------------------------------------

  startSTTTracking(): void {
    this.sttStartTime = Date.now()
  }

  endSTTTracking(): void {
    if (this.sttStartTime > 0) {
      const sttLatency = Date.now() - this.sttStartTime
      this.voiceSession.updateLatency({ stt: sttLatency })
      this.sttStartTime = 0
    }
  }

  startTurnTracking(): void {
    this.turnStartTime = Date.now()
  }

  endTurnTracking(): void {
    if (this.turnStartTime > 0) {
      const turnLatency = Date.now() - this.turnStartTime
      this.voiceSession.updateLatency({ endOfTurn: turnLatency })
      this.turnStartTime = 0
    }
  }

  startLLMTracking(): void {
    this.llmStartTime = Date.now()
  }

  endLLMTracking(): void {
    if (this.llmStartTime > 0) {
      const llmLatency = Date.now() - this.llmStartTime
      this.voiceSession.updateLatency({ llm: llmLatency })
      this.llmStartTime = 0
    }
  }

  startTTSTracking(): void {
    this.ttsStartTime = Date.now()
  }

  endTTSTracking(): void {
    if (this.ttsStartTime > 0) {
      const ttsLatency = Date.now() - this.ttsStartTime
      this.voiceSession.updateLatency({ tts: ttsLatency })
      this.ttsStartTime = 0
    }
  }

  recordOverallLatency(overallMs: number): void {
    this.voiceSession.updateLatency({ overall: overallMs })
  }

  getMetrics(): VoicePipelineMetrics {
    return this.voiceSession.getMetrics()
  }

  getLatency(): VoiceLatencyMetrics {
    return this.voiceSession.getMetrics().latency
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Send a configuration update to the backend agent in real-time
   * Allows changing soul, voice settings, or tools without reconnecting
   */
  sendConfigUpdate(type: string, config: unknown): void {
    logger.info(`📤 sendConfigUpdate called: type=${type}`)
    logger.info(`📤 Room exists: ${!!this.room}`)
    logger.info(`📤 Room connected: ${this.room?.state}`)

    if (!this.room) {
      logger.warn('Cannot send config update: room not available')
      return
    }

    const message = {
      type: 'config_update',
      updateType: type,  // 'voice' | 'soul' | 'tools' | 'full' | 'llm'
      config,
      timestamp: Date.now(),
    }

    logger.info(`📤 Sending message:`, message)

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(message))

    this.room.localParticipant.publishData(data, { reliable: true })
      .then(() => {
        logger.info(`✅ Successfully sent ${type} config update to agent`)
      })
      .catch((err) => {
        logger.error(`❌ Failed to send ${type} config update:`, err)
      })
  }

  /**
   * Send tool execution result back to backend
   */
  private sendToolResult(toolCallId: string, result: string, error?: string): void {
    if (!this.room) return

    const message = {
      type: 'tool_result',
      toolCallId,
      result,
      error
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(message))
    this.room.localParticipant.publishData(data, { reliable: true })
  }

  interrupt(): void {
    logger.info('Interrupting agent...')
    this.voiceSession.triggerInterruption()

    // Send interrupt signal via data channel
    if (this.room) {
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify({ type: 'interrupt' }))
      this.room.localParticipant.publishData(data, { reliable: true })
    }
  }

  sendText(text: string): void {
    logger.info('Sending text to agent:', text)

    // Send text via data channel
    if (this.room) {
      const encoder = new TextEncoder()
      const data = encoder.encode(JSON.stringify({ type: 'text', text }))
      this.room.localParticipant.publishData(data, { reliable: true })

      // Also trigger as user speech
      this.userSpeechCb?.(text)
    }
  }

  dispose(): void {
    this.disconnect()
  }

  // ---------------------------------------------------------------------------
  // Token Management
  // ---------------------------------------------------------------------------

  private async fetchToken(): Promise<string> {
    if (!this.config.tokenEndpoint) {
      throw new Error('No token endpoint configured')
    }

    const roomName = this.config.roomName || `kwami-room-${Date.now()}`
    
    // Use configured userId, or get/create persistent ID from localStorage
    let participantName = this.config.userId
    if (!participantName) {
      const storageKey = 'kwami-user-id'
      participantName = localStorage.getItem(storageKey) ?? undefined
      if (!participantName) {
        participantName = `kwami-user-${Date.now()}`
        localStorage.setItem(storageKey, participantName)
      }
    }

    // Build headers with optional auth token
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`
    }

    const response = await fetch(this.config.tokenEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        room_name: roomName,
        participant_name: participantName,
        kwamiId: this.config.userId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`)
    }

    const data = await response.json()

    // Update room name from response if provided
    if (data.room_name) {
      this.config.roomName = data.room_name
    }

    return data.token
  }

}
