import type { AudioConfig } from '../types/index';

/**
 * KwamiAudio - Manages audio playback and frequency analysis for Kwami
 * Handles audio files, speech synthesis, and provides real-time frequency data
 */
export class KwamiAudio {
  private instance: HTMLAudioElement;
  private files: string[];
  private currentFileIndex: number = 0;
  private frequencyData: Uint8Array;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  constructor(audioFiles: string[] = [], config?: AudioConfig) {
    this.files = audioFiles;
    const initialFile = audioFiles[this.currentFileIndex];
    this.instance = new Audio(initialFile || undefined);
    this.instance.preload = config?.preload || 'auto';
    this.instance.crossOrigin = 'anonymous';
    this.frequencyData = new Uint8Array();

    if (config?.autoInitialize !== false) {
      this.initialize();
    }
  }

  /**
   * Initialize the Web Audio API analyser
   */
  private initialize(): void {
    if (!this.instance || this.analyser) {
      return;
    }

    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      this.audioContext = audioContext;

      const sourceNode = audioContext.createMediaElementSource(this.instance);
      const analyser = audioContext.createAnalyser();
      this.analyser = analyser;

      // Configure analyser for liquid, natural frequency response
      // Higher FFT size = better frequency resolution
      analyser.fftSize = 2048; // 1024 frequency bins
      // Lower smoothing = more responsive to quick changes
      analyser.smoothingTimeConstant = 0.7; // 0-1 (0 = no smoothing, 1 = max)
      // Min/max decibels for dynamic range
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;

      sourceNode.connect(analyser);
      analyser.connect(audioContext.destination);

      this.frequencyData = new Uint8Array(analyser.frequencyBinCount);
    } catch (error) {
      console.warn('Failed to initialize Web Audio API:', error);
    }
  }

  /**
   * Play the current audio track
   */
  async play(): Promise<void> {
    if (!this.instance) return;

    if (!this.analyser) {
      this.initialize();
    }

    if (this.audioContext?.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume AudioContext:', error);
      }
    }

    try {
      await this.instance.play();
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  /**
   * Pause the current audio track
   */
  pause(): void {
    this.instance?.pause();
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    if (this.instance) {
      this.instance.pause();
      this.instance.currentTime = 0;
    }
  }

  /**
   * Play the next audio track in the playlist
   */
  next(): void {
    this.currentFileIndex = (this.currentFileIndex + 1) % this.files.length;
    const nextFile = this.files[this.currentFileIndex];
    if (nextFile) {
      this.loadAudioSource(nextFile);
      this.play();
    }
  }

  /**
   * Play the previous audio track in the playlist
   */
  previous(): void {
    this.currentFileIndex = this.currentFileIndex === 0
      ? this.files.length - 1
      : this.currentFileIndex - 1;
    const prevFile = this.files[this.currentFileIndex];
    if (prevFile) {
      this.loadAudioSource(prevFile);
      this.play();
    }
  }

  /**
   * Load audio from URL
   */
  loadAudioSource(audioSrc: string): void {
    if (this.instance) {
      this.instance.src = audioSrc;
    }
  }

  /**
   * Load audio from base64 string
   */
  loadAudioFromBase64(base64Audio: string): void {
    try {
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/mp3' });
      const audioURL = URL.createObjectURL(blob);

      this.loadAudioSource(audioURL);
    } catch (error) {
      console.error('Failed to load audio from base64:', error);
    }
  }

  /**
   * Get real-time frequency data for audio visualization
   */
  getFrequencyData(): Uint8Array {
    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }
    return this.frequencyData;
  }

  /**
   * Get the analyser node for direct access
   */
  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  /**
   * Get the audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  /**
   * Get current audio element for direct manipulation
   */
  getAudioElement(): HTMLAudioElement {
    return this.instance;
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    if (this.instance) {
      this.instance.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.instance?.volume || 0;
  }

  /**
   * Cleanup and dispose resources
   */
  dispose(): void {
    this.pause();
    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        // Ignore errors during cleanup
      });
    }
  }
}
