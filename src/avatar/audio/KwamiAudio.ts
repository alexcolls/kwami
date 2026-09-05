import type { AudioConfig } from '../../types/index.js'
import { logger } from '../../utils/logger.js'

/**
 * KwamiAudio - Manages audio playback and frequency analysis for Kwami
 * Handles audio files, speech synthesis, and provides real-time frequency data
 */
export class KwamiAudio {
  private instance: HTMLAudioElement
  private files: string[]
  private currentFileIndex: number = 0
  private frequencyData: Uint8Array
  private analyser: AnalyserNode | null = null
  private audioContext: AudioContext | null = null
  private streamSource: MediaStreamAudioSourceNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private highpassFilter: BiquadFilterNode | null = null
  private isHighpassEnabled = false
  private highpassDefaults = {
    frequency: 1200,
    q: 0.85,
  }
  private lowpassFilters: BiquadFilterNode[] = []
  private readonly maxLowpassStages = 3
  private isLowpassEnabled = false
  private lowpassDefaults = {
    frequency: 220,
    q: 0.85,
  }

  constructor(audioFiles: string[] = [], config?: AudioConfig) {
    this.files = audioFiles
    const initialFile = audioFiles[this.currentFileIndex]
    this.instance = new Audio(initialFile || undefined)
    this.instance.preload = config?.preload || 'auto'
    this.instance.crossOrigin = 'anonymous'
    this.frequencyData = new Uint8Array()

    if (config?.autoInitialize !== false) {
      this.initialize()
    }
  }

  /**
   * Initialize the Web Audio API analyser
   */
  private initialize(): void {
    if (!this.instance || this.analyser) {
      return
    }

    try {
      const AudioContextClass = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()
      this.audioContext = audioContext

      const sourceNode = audioContext.createMediaElementSource(this.instance)
      const analyser = audioContext.createAnalyser()
      this.sourceNode = sourceNode
      this.analyser = analyser

      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.35
      analyser.minDecibels = -90
      analyser.maxDecibels = -10

      this.ensureHighpassFilter()
      this.ensureLowpassFilters()
      this.rebuildAudioGraph()

      this.frequencyData = new Uint8Array(analyser.frequencyBinCount)
    } catch (error) {
      logger.warn('Failed to initialize Web Audio API:', error)
    }
  }

  private ensureHighpassFilter(): void {
    if (!this.audioContext || this.highpassFilter) {
      return
    }

    const filter = this.audioContext.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = this.highpassDefaults.frequency
    filter.Q.value = this.highpassDefaults.q
    this.highpassFilter = filter
  }

  private ensureLowpassFilters(): void {
    if (!this.audioContext) {
      return
    }

    if (this.lowpassFilters.length === this.maxLowpassStages) {
      return
    }

    while (this.lowpassFilters.length < this.maxLowpassStages) {
      const filter = this.audioContext.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = this.lowpassDefaults.frequency
      filter.Q.value = this.lowpassDefaults.q
      this.lowpassFilters.push(filter)
    }
  }

  private rebuildAudioGraph(): void {
    if (!this.audioContext || !this.analyser || !this.sourceNode) {
      return
    }

    try {
      this.sourceNode.disconnect()
    } catch {
      // Ignore disconnect errors when nodes aren't connected yet
    }

    if (this.highpassFilter) {
      try {
        this.highpassFilter.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }

    this.lowpassFilters.forEach(filter => {
      try {
        filter.disconnect()
      } catch {
        // Ignore disconnect errors
      }
    })

    try {
      this.analyser.disconnect()
    } catch {
      // Ignore disconnect errors
    }

    let currentNode: AudioNode = this.sourceNode

    if (this.isHighpassEnabled && this.highpassFilter) {
      currentNode.connect(this.highpassFilter)
      currentNode = this.highpassFilter
    }

    if (this.isLowpassEnabled && this.lowpassFilters.length > 0) {
      this.lowpassFilters.forEach(filter => {
        currentNode.connect(filter)
        currentNode = filter
      })
    }

    currentNode.connect(this.analyser)

    this.analyser.connect(this.audioContext.destination)
  }

  /**
   * Play the current audio track
   */
  async play(): Promise<void> {
    if (!this.instance) return

    if (!this.analyser) {
      this.initialize()
    }

    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume()
      } catch (error) {
        logger.warn('Failed to resume AudioContext:', error)
      }
    }

    try {
      await this.instance.play()
    } catch (error) {
      logger.warn('Audio playback failed:', error)
    }
  }

  /**
   * Pause the current audio track
   */
  pause(): void {
    this.instance?.pause()
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    if (this.instance) {
      this.instance.pause()
      this.instance.currentTime = 0
    }
  }

  /**
   * Play the next audio track in the playlist
   */
  next(): void {
    this.currentFileIndex = (this.currentFileIndex + 1) % this.files.length
    const nextFile = this.files[this.currentFileIndex]
    if (nextFile) {
      this.loadAudioSource(nextFile)
      this.play()
    }
  }

  /**
   * Play the previous audio track in the playlist
   */
  previous(): void {
    this.currentFileIndex = this.currentFileIndex === 0
      ? this.files.length - 1
      : this.currentFileIndex - 1
    const prevFile = this.files[this.currentFileIndex]
    if (prevFile) {
      this.loadAudioSource(prevFile)
      this.play()
    }
  }

  /**
   * Load audio from URL
   */
  loadAudioSource(audioSrc: string): void {
    if (this.instance) {
      this.instance.src = audioSrc
    }
  }

  /**
   * Load audio from ArrayBuffer (uploaded files)
   */
  async loadAudio(arrayBuffer: ArrayBuffer): Promise<void> {
    try {
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' })
      const audioURL = URL.createObjectURL(blob)
      
      this.loadAudioSource(audioURL)
      
      if (!this.analyser) {
        this.initialize()
      }
      if (
        (this.highpassFilter && this.isHighpassEnabled)
        || (this.lowpassFilters.length > 0 && this.isLowpassEnabled)
      ) {
        this.rebuildAudioGraph()
      }
    } catch (error) {
      logger.error('Failed to load audio from ArrayBuffer:', error)
      throw error
    }
  }

  /**
   * Load audio from base64 string
   */
  loadAudioFromBase64(base64Audio: string): void {
    try {
      const byteCharacters = atob(base64Audio)
      const byteNumbers = new Array(byteCharacters.length)

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'audio/mp3' })
      const audioURL = URL.createObjectURL(blob)

      this.loadAudioSource(audioURL)
    } catch (error) {
      logger.error('Failed to load audio from base64:', error)
    }
  }

  /**
   * Get real-time frequency data for audio visualization
   */
  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData as Uint8Array<ArrayBuffer>)
    }
    return this.frequencyData
  }

  /**
   * Get the analyser node for direct access
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  /**
   * Get the audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  /**
   * Get current audio element for direct manipulation
   */
  getAudioElement(): HTMLAudioElement {
    return this.instance
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.instance) {
      this.instance.volume = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.instance?.volume || 0
  }

  /**
   * Load an audio file from a File object (for file uploads)
   */
  async loadAudioFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('audio/')) {
        reject(new Error('Invalid audio file'))
        return
      }

      const url = URL.createObjectURL(file)
      this.loadAudioSource(url)
      
      this.instance.addEventListener('loadeddata', () => {
        resolve()
      }, { once: true })
      
      this.instance.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load audio file'))
      }, { once: true })
    })
  }

  /**
   * Get current playback time in seconds
   */
  getCurrentTime(): number {
    return this.instance?.currentTime || 0
  }

  /**
   * Set playback time in seconds
   */
  setCurrentTime(time: number): void {
    if (this.instance) {
      this.instance.currentTime = Math.max(0, Math.min(time, this.getDuration()))
    }
  }

  /**
   * Get audio duration in seconds
   */
  getDuration(): number {
    return this.instance?.duration || 0
  }

  /**
   * Format time in MM:SS format
   */
  formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.instance ? !this.instance.paused : false
  }

  /**
   * Toggle play/pause
   */
  async togglePlayPause(): Promise<void> {
    if (this.isPlaying()) {
      this.pause()
    } else {
      await this.play()
    }
  }

  /**
   * Connect a MediaStream (e.g., from LiveKit) to the audio analyzer
   * Note: This is for VISUALIZATION ONLY - audio playback is handled by the audio element
   * We do NOT connect to audioContext.destination to avoid echo/double playback
   */
  async connectMediaStream(stream: MediaStream): Promise<void> {
    if (!this.audioContext) {
      const AudioContextClass = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioContextClass()
    }

    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    if (this.streamSource) {
      this.streamSource.disconnect()
    }

    if (!this.analyser && this.audioContext) {
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.35
      this.analyser.minDecibels = -90
      this.analyser.maxDecibels = -10
      // DO NOT connect to destination - this causes echo!
      // The audio element handles playback, analyser is only for visualization
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount)
    }

    if (this.audioContext && this.analyser) {
      this.streamSource = this.audioContext.createMediaStreamSource(stream)
      this.streamSource.connect(this.analyser)
    }
  }

  /**
   * Disconnect the current MediaStream
   */
  disconnectMediaStream(): void {
    if (this.streamSource) {
      this.streamSource.disconnect()
      this.streamSource = null
    }
  }

  /**
   * Check if a MediaStream is currently connected
   */
  isStreamConnected(): boolean {
    return this.streamSource !== null
  }

  /**
   * Start listening to microphone input
   */
  async startMicrophoneListening(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      await this.connectMediaStream(stream)
    } catch (error) {
      logger.error('Failed to access microphone:', error)
      throw error
    }
  }

  /**
   * Stop listening to microphone input
   */
  stopMicrophoneListening(): void {
    if (this.streamSource && this.streamSource.mediaStream) {
      this.streamSource.mediaStream.getTracks().forEach(track => track.stop())
    }
    this.disconnectMediaStream()
  }

  /**
   * Enable highpass filter
   */
  enableHighpassFilter(settings?: { frequency?: number; q?: number }): void {
    if (settings?.frequency) {
      this.highpassDefaults.frequency = settings.frequency
    }
    if (settings?.q) {
      this.highpassDefaults.q = settings.q
    }

    if (!this.analyser || !this.audioContext || !this.sourceNode) {
      this.initialize()
    }

    this.ensureHighpassFilter()

    if (this.highpassFilter) {
      this.highpassFilter.frequency.value = this.highpassDefaults.frequency
      this.highpassFilter.Q.value = this.highpassDefaults.q
    }

    this.isHighpassEnabled = true
    this.rebuildAudioGraph()
  }

  /**
   * Disable the highpass filter
   */
  disableHighpassFilter(): void {
    if (!this.isHighpassEnabled) return

    this.isHighpassEnabled = false
    this.rebuildAudioGraph()
  }

  /**
   * Enable lowpass filter
   */
  enableLowpassFilter(settings?: { frequency?: number; q?: number }): void {
    if (settings?.frequency) {
      this.lowpassDefaults.frequency = settings.frequency
    }
    if (settings?.q) {
      this.lowpassDefaults.q = settings.q
    }

    if (!this.analyser || !this.audioContext || !this.sourceNode) {
      this.initialize()
    }

    this.ensureLowpassFilters()

    if (this.lowpassFilters.length > 0) {
      const baseFreq = this.lowpassDefaults.frequency
      const baseQ = this.lowpassDefaults.q

      this.lowpassFilters.forEach((filter, index) => {
        const stageFreq = Math.max(10, baseFreq * Math.pow(0.6, index))
        const stageQ = baseQ + index * 0.35
        filter.frequency.value = stageFreq
        filter.Q.value = stageQ
      })
    }

    this.isLowpassEnabled = true
    this.rebuildAudioGraph()
  }

  /**
   * Disable the lowpass filter
   */
  disableLowpassFilter(): void {
    if (!this.isLowpassEnabled) return

    this.isLowpassEnabled = false
    this.rebuildAudioGraph()
  }

  /**
   * Cleanup and dispose resources
   */
  dispose(): void {
    this.pause()
    this.stopMicrophoneListening()
    try {
      this.sourceNode?.disconnect()
    } catch {
      // ignore
    }
    try {
      this.analyser?.disconnect()
    } catch {
      // ignore
    }
    try {
      this.highpassFilter?.disconnect()
    } catch {
      // ignore
    }
    this.lowpassFilters.forEach(filter => {
      try {
        filter.disconnect()
      } catch {
        // ignore
      }
    })
    this.analyser = null
    this.highpassFilter = null
    this.lowpassFilters = []
    this.sourceNode = null
    this.isHighpassEnabled = false
    this.isLowpassEnabled = false
    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        // Ignore errors during cleanup
      })
    }
  }
}
