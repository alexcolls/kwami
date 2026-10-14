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
import type { AgentPipeline, PipelineConnectOptions, ToolExecutor } from '../../types/index.js'
import type { AgentAdapter, LiveKitAdapterConfig } from './types.js'
import type { VoiceLatencyMetrics, VoicePipelineMetrics } from '../voice/types.js'
import { VoiceSession } from '../voice/VoiceSession.js'
import { logger } from '../../utils/logger.js'

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
    // Mutate in place rather than replacing the reference. `createPipeline()` hands this exact
    // object to the LiveKitPipeline, so reassigning it left a connected pipeline reading
    // connect-time values for userId, echoCancellation, roomName and the rest, forever.
    Object.assign(this.config, config)

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
  type: 'transcript' | 'agent_text' | 'state' | 'error' | 'metrics' | 'tool_call' | 'search_results' | 'remove_result' | 'nav_command' | 'browser_session' | 'config_request'
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
  /** nav_command / browser_session fields */
  action?: string
  url?: string
  description?: string
  inputText?: string
  element_id?: string
  /** browser_session fields */
  liveUrl?: string
  title?: string
}

/**
 * LiveKit agent state participant attribute key.
 * The LiveKit Agents SDK automatically sets this attribute on the agent
 * participant to reflect the current pipeline state.
 */
const AGENT_STATE_ATTRIBUTE = 'lk.agent.state'

/** The subset of the adapter config that decides who counts as the agent. */
export interface AgentIdentityConfig {
  agentIdentity?: string
  agentIdentityPrefix?: string
}

/**
 * Decide whether a LiveKit identity is the backend agent.
 *
 * Everything this adapter treats as authoritative — the audio it auto-plays, the transcripts it
 * emits as agent text, the pipeline state it drives the UI from, and the `tool_call` messages it
 * executes in the host application — is gated on this answer. A participant chooses its own
 * identity, so the only trustworthy form of this check is an exact identity (or a namespaced
 * prefix) issued by the same backend that mints the room token.
 *
 * Resolution order:
 *  1. `agentIdentity` — exact match. Use this.
 *  2. `agentIdentityPrefix` — for backends that suffix a session id onto a fixed prefix.
 *  3. The legacy name heuristic, kept so existing deployments keep working. It is a guess about
 *     a self-declared string and must not be relied on where the room is not otherwise trusted.
 */
export function isAgentIdentity(identity: string, config?: AgentIdentityConfig): boolean {
  if (config?.agentIdentity) return identity === config.agentIdentity
  if (config?.agentIdentityPrefix) return identity.startsWith(config.agentIdentityPrefix)

  const lower = identity.toLowerCase()
  return lower.startsWith('agent') ||
    (lower.includes('kwami') && !lower.includes('user'))
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
  /**
   * The agent is dispatched after the client joins, so it usually arrives a second or two
   * later. Data published before it is in the room is delivered to nobody: the full config and
   * every update sent straight after connect used to vanish, and the session ran on the agent's
   * placeholder (default name, default voice) with no error anywhere. Messages for the agent are
   * now held here until it joins, and `agentConfig` is replayed to an agent that (re)joins.
   */
  private pendingForAgent: Array<{ data: Uint8Array<ArrayBuffer>; what: string }> = []
  private agentConfig: Uint8Array<ArrayBuffer> | null = null
  private agentJoins = 0
  private localAudioTrack: LocalAudioTrack | null = null
  private agentAudioStream: MediaStream | null = null
  private _sendDataHandler: EventListener | null = null

  // Timestamps for latency tracking
  private sttStartTime = 0
  private llmStartTime = 0
  private ttsStartTime = 0
  private turnStartTime = 0

  // Callbacks (user/agent text delivered via VoiceSession only — see onUserSpeech / onAgentText)
  private onAgentAudioStreamCb?: (stream: MediaStream) => void
  private onErrorCb?: (error: Error) => void
  private toolExecutor?: ToolExecutor

  /** LiveKit often delivers the same final transcript via TranscriptionReceived and DataReceived — dedupe. */
  private _dedupeUser = { text: '', at: 0 }
  private _dedupeAgent = { text: '', at: 0 }
  private _dedupeInterim = { text: '', at: 0 }
  private readonly _dedupeFinalMs = 2800
  private readonly _dedupeInterimMs = 120

  constructor(config: LiveKitAdapterConfig, voiceSession: VoiceSession) {
    this.config = config
    this.voiceSession = voiceSession
  }

  setToolExecutor(executor: ToolExecutor): void {
    this.toolExecutor = executor
  }

  /** See {@link isAgentIdentity} — gates everything this adapter treats as authoritative. */
  private isAgentParticipant(participant: Participant | RemoteParticipant): boolean {
    return isAgentIdentity(participant.identity, this.config)
  }

  private agentInRoom(): boolean {
    if (!this.room) return false
    for (const [, participant] of this.room.remoteParticipants) {
      if (this.isAgentParticipant(participant)) return true
    }
    return false
  }

  /** Publish to the agent now if it is in the room, otherwise queue it for when it joins. */
  private sendToAgent(data: Uint8Array<ArrayBuffer>, what: string): void {
    if (!this.room) return
    if (!this.agentInRoom()) {
      if (this.pendingForAgent.length >= 100) this.pendingForAgent.shift()
      this.pendingForAgent.push({ data, what })
      logger.debug(`Agent not in the room yet; queued ${what}`)
      return
    }
    this.room.localParticipant.publishData(data, { reliable: true }).catch((err: unknown) => {
      this.emitError(new Error(`Failed to send ${what}: ${err instanceof Error ? err.message : String(err)}`))
    })
  }

  /**
   * The agent joined: give it the full config, then everything queued while it was away, in
   * order. On a re-join (agent restarted or replaced) the queue is empty and the updates the old
   * agent received are gone with it, so the host app is told to sync again.
   */
  private onAgentJoined(): void {
    if (!this.room) return
    this.agentJoins += 1
    const rejoin = this.agentJoins > 1
    const queued = this.pendingForAgent
    this.pendingForAgent = []
    const config = this.agentConfig
    const sends = [
      ...(config && (rejoin || !queued.some((q) => q.data === config))
        ? [{ data: config, what: 'voice config' }]
        : []),
      ...queued,
    ]
    logger.info(`Agent joined${rejoin ? ' again' : ''}; sending ${sends.length} held message(s)`)
    for (const { data, what } of sends) this.sendToAgent(data, what)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('kwami:agent_joined', { detail: { rejoin } }))
    }
  }

  onError(callback: (error: Error) => void): void {
    this.onErrorCb = callback
  }

  /**
   * Publish on the data channel and observe the result.
   *
   * `publishData()` returns a promise. Three call sites used to drop it, so a send that failed
   * because the channel was not ready — reconnecting, or a message fired straight after
   * connect — surfaced as an unhandled rejection instead of an error the app could see.
   */
  private publish(message: unknown, what: string): void {
    if (!this.room) return
    const data = new TextEncoder().encode(JSON.stringify(message))
    this.room.localParticipant.publishData(data, { reliable: true }).catch((err: unknown) => {
      this.emitError(new Error(`Failed to send ${what}: ${err instanceof Error ? err.message : String(err)}`))
    })
  }

  /**
   * Surface an out-of-band failure.
   *
   * Both paths matter: the VoiceSession event is what a consumer subscribed through
   * `adapter.getVoiceSession()` sees, and `onErrorCb` is what `Agent` forwards to the
   * `onError` callback registered on `Kwami`. Before this existed, neither fired — the agent's
   * own `{ type: 'error' }` messages were logged and dropped, `VoiceSession.triggerError()` had
   * no callers at all, and `Agent._onErrorCallback` was stored and never invoked.
   */
  private emitError(error: Error): void {
    logger.error('Pipeline error:', error)
    this.voiceSession.triggerError(error)
    this.onErrorCb?.(error)
  }

  /** Same utterance often arrives via DataReceived and TranscriptionReceived with minor text differences. */
  private dedupeFinalKey(raw: string): string {
    return raw.trim().replace(/\s+/g, ' ').toLowerCase()
  }

  private emitFinalUserTranscript(raw: string): void {
    const text = raw.trim()
    if (!text) return
    const key = this.dedupeFinalKey(text)
    const now = Date.now()
    if (
      key === this.dedupeFinalKey(this._dedupeUser.text) &&
      now - this._dedupeUser.at < this._dedupeFinalMs
    ) {
      return
    }
    this._dedupeUser = { text, at: now }
    // Deliver via VoiceSession — onUserSpeech() wires the Agent callback there.
    this.voiceSession.triggerUserSpeechEnded(text)
    this.voiceSession.setState('thinking')
  }

  private emitFinalAgentText(raw: string): void {
    const text = raw.trim()
    if (!text) return
    const key = this.dedupeFinalKey(text)
    const now = Date.now()
    if (
      key === this.dedupeFinalKey(this._dedupeAgent.text) &&
      now - this._dedupeAgent.at < this._dedupeFinalMs
    ) {
      return
    }
    this._dedupeAgent = { text, at: now }
    // Same as user: onAgentText wires the callback on VoiceSession.
    this.voiceSession.triggerAgentSpeechEnded(text)
  }

  private emitInterimTranscript(raw: string): void {
    const text = raw.trim()
    if (!text) return
    const now = Date.now()
    if (
      text === this._dedupeInterim.text &&
      now - this._dedupeInterim.at < this._dedupeInterimMs
    ) {
      return
    }
    this._dedupeInterim = { text, at: now }
    this.voiceSession.triggerTranscript(text, false)
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
        if (this.isAgentParticipant(p)) {
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
      // Without this the room stays connected when a later step fails — denying microphone
      // permission used to leave a live LiveKit session behind, with isConnected() still
      // reporting true, and every retry leaked another Room and another agent dispatch.
      logger.error('Failed to connect to LiveKit:', error)
      await this.teardownRoom()
      this.voiceSession.setState('idle')
      throw error
    }
  }

  /**
   * Release everything `connect()` acquired. Safe to call when half-built or already torn
   * down, which is what lets both `disconnect()` and the `connect()` failure path share it.
   */
  private async teardownRoom(): Promise<void> {
    if (this._sendDataHandler && typeof window !== 'undefined') {
      window.removeEventListener('kwami:send_data', this._sendDataHandler)
      this._sendDataHandler = null
    }

    if (this.localAudioTrack) {
      this.localAudioTrack.stop()
      this.localAudioTrack = null
    }

    // The agent's tracks belong to the remote participant; dropping our reference is enough,
    // and stopping them would end the track for anything else holding the same stream.
    this.agentAudioStream = null

    this.removeAgentAudioElements()

    if (this.room) {
      const room = this.room
      this.room = null
      room.removeAllListeners()
      try {
        await room.disconnect()
      } catch (error) {
        logger.warn('Error while disconnecting the room:', error)
      }
    }

    // Clear cached room name so the next connection creates a fresh room. Reusing the same
    // room name can cause the old (shutting-down) agent to receive config meant for the new
    // session, or LiveKit to dispatch a second agent into a room that still has a lingering one.
    this.config.roomName = undefined
  }

  /**
   * Remove every `#kwami-agent-audio` element, not just the first. The id is fixed, so a
   * republished agent track could append a second one; `getElementById` would then leave the
   * older, still-playing element behind on teardown.
   */
  private removeAgentAudioElements(): void {
    if (typeof document === 'undefined') return
    for (const el of Array.from(document.querySelectorAll('#kwami-agent-audio'))) {
      ;(el as HTMLAudioElement).pause?.()
      el.remove()
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
      const payload = e.detail as Uint8Array | undefined
      if (payload) {
        const data = new Uint8Array(payload)
        this.room.localParticipant.publishData(data, { reliable: true })
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
        if (!this.isAgentParticipant(participant)) {
          logger.debug(`Skipping audio from non-agent participant: ${participant.identity}`)
          return
        }

        // This is the agent's audio response
        // Attach to an audio element to play it. Clear any previous one first: the id is
        // fixed, so a republished agent track (a backend restart mid-session) would otherwise
        // stack a second element on top of the first and play both.
        this.removeAgentAudioElements()
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

    // Data received - transcripts and agent messages come through here.
    //
    // This handler is the highest-privilege entry point in the adapter: handleAgentData() runs
    // `tool_call` messages against the host application's registered tools, and dispatches
    // `nav_command` / `browser_session` / `search_results` as window events the host acts on.
    // It therefore has to authorize the sender the same way TrackSubscribed,
    // TranscriptionReceived and ParticipantAttributesChanged already do — otherwise any other
    // participant in the room can invoke the host's tools with arguments of their choosing.
    this.room.on(RoomEvent.DataReceived, (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: DataPacket_Kind
    ) => {
      // A packet with no sender cannot be attributed to the agent, so it is not trusted either.
      if (!participant || !this.isAgentParticipant(participant)) {
        logger.warn(
          `Ignoring data message from non-agent participant: ${participant?.identity ?? 'unknown'}`
        )
        return
      }

      try {
        const decoder = new TextDecoder()
        const jsonStr = decoder.decode(payload)
        const data: AgentDataMessage = JSON.parse(jsonStr)
        if (data.type === 'search_results') {
          logger.debug('DataReceived search_results', {
            from: participant.identity,
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
    // LiveKit often delivers the same final line via TranscriptionReceived and DataReceived;
    // emitFinal* dedupes using a normalized key (see dedupeFinalKey).
    this.room.on(RoomEvent.TranscriptionReceived, (
      segments: TranscriptionSegment[],
      participant?: Participant,
      _publication?: TrackPublication,
    ) => {
      const fromAgent = participant ? this.isAgentParticipant(participant) : false

      for (const segment of segments) {
        if (fromAgent) {
          if (segment.final && segment.text) {
            this.emitFinalAgentText(segment.text)
          }
        } else if (segment.final && segment.text) {
          this.endSTTTracking()
          this.emitFinalUserTranscript(segment.text)
        } else if (segment.text) {
          this.emitInterimTranscript(segment.text)
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
      if (!this.isAgentParticipant(participant)) return

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
      if (this.isAgentParticipant(participant)) {
        this.onAgentJoined()
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
      // A drop we did not ask for is the consumer's problem to handle (retry, show a banner).
      // `this.room` is already null when we tore down deliberately.
      if (this.room) {
        this.emitError(new Error(`Disconnected from LiveKit room: ${reason ?? 'unknown reason'}`))
      }
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
        if (data.isFinal && data.transcript) {
          this.endSTTTracking()
          this.emitFinalUserTranscript(data.transcript)
        } else if (data.transcript) {
          this.emitInterimTranscript(data.transcript)
        }
        break

      case 'agent_text':
        if (data.text) {
          this.emitFinalAgentText(data.text)
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
        // Error from the backend agent. This used to be logged and dropped.
        this.emitError(new Error(data.error ?? 'Unknown agent error'))
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

      case 'browser_session':
        logger.info('Browser session event:', data.action, data.liveUrl?.slice(0, 60) || data.url)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kwami:browser_session', {
            detail: {
              action: data.action,  // 'open' | 'close' | 'update'
              liveUrl: data.liveUrl,
              url: data.url,
              title: data.title,
            },
          }))
        }
        break

      case 'config_request':
        // The agent started without our config (it was sent before the agent was in the room
        // and lost, or the agent restarted). Send it again, and let the app resend its updates.
        logger.warn('Agent asked for the config again; resending')
        if (this.agentConfig) this.sendToAgent(this.agentConfig, 'voice config')
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kwami:agent_joined', { detail: { rejoin: true } }))
        }
        break

      default:
        // Messages the SDK has no typed handler for (e.g. `brain_status`) reach
        // the app as a generic event instead of being dropped, so a new agent
        // feature does not need an SDK release to be visible.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('kwami:agent_message', { detail: data }))
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
    this.agentConfig = data

    // The voice config carries provider credentials. `logger` redacts them, but there is no
    // reason to print the whole pipeline at `info` on every connect either.
    logger.debug('Sending config to agent:', {
      kwamiId: options.kwamiId,
      kwamiName: options.kwamiName,
      voice: configMessage.voice,
    })

    if (this.agentInRoom()) {
      this.agentJoins = 1
      await this.room.localParticipant.publishData(data, { reliable: true })
      logger.debug('Config sent to agent')
    } else {
      // Held for the agent's arrival (see `pendingForAgent`).
      this.pendingForAgent.push({ data, what: 'voice config' })
      logger.info('Agent not in the room yet; config will be sent when it joins')
    }
  }

  async disconnect(): Promise<void> {
    logger.info('LiveKit pipeline disconnecting...')
    await this.teardownRoom()
    this.voiceSession.setState('idle')
  }

  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected
  }

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  onUserSpeech(callback: (transcript: string) => void): void {
    this.voiceSession.on({
      onUserSpeechEnded: callback,
    })
  }

  onAgentSpeech(_callback: (audio: ArrayBuffer) => void): void {
    // Reserved for raw audio streaming - not yet implemented
    // Audio is currently handled via Track subscription
  }

  onAgentText(callback: (text: string) => void): void {
    this.voiceSession.on({
      onAgentSpeechEnded: callback,
    })
  }

  onInterimTranscript(callback: (text: string) => void): void {
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
    logger.debug(`sendConfigUpdate: type=${type}, room=${this.room?.state ?? 'none'}`)

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

    logger.debug('Sending config update:', message)

    const encoder = new TextEncoder()
    this.sendToAgent(encoder.encode(JSON.stringify(message)), `${type} config update`)
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

    this.publish(message, 'tool result')
  }

  interrupt(): void {
    logger.info('Interrupting agent...')
    this.voiceSession.triggerInterruption()

    // Send interrupt signal via data channel
    this.publish({ type: 'interrupt' }, 'interrupt')
  }

  sendText(text: string): void {
    logger.info('Sending text to agent:', text)

    // Send text via data channel
    if (this.room) {
      this.publish({ type: 'text', text }, 'text message')

      // Mirror typed input through the same path as voice STT (single listener chain).
      this.voiceSession.triggerUserSpeechEnded(text)
    }
  }

  async dispose(): Promise<void> {
    // `disconnect()` is async. Calling it without awaiting returned before the microphone was
    // released and the room closed, so an app that disposed and immediately reconnected could
    // hold two rooms and a stuck mic indicator.
    await this.disconnect()
    this.onErrorCb = undefined
    this.onAgentAudioStreamCb = undefined
    this.toolExecutor = undefined
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
      // Guarded like every other browser access in this file. Unguarded, this threw a
      // ReferenceError whenever the adapter was evaluated outside a browser (SSR, node tests).
      // Storage can also throw in a private window or with site data blocked.
      const storageKey = 'kwami-user-id'
      try {
        participantName = globalThis.localStorage?.getItem(storageKey) ?? undefined
        if (!participantName) {
          participantName = `kwami-user-${Date.now()}`
          globalThis.localStorage?.setItem(storageKey, participantName)
        }
      } catch {
        participantName = `kwami-user-${Date.now()}`
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
