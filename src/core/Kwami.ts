import { KwamiBody } from './Body';
import type { KwamiConfig, KwamiState } from '../types/index';

/**
 * Kwami - The main class for the Kwami AI companion
 *
 * Kwami is composed of three main parts:
 * - Body: The visual 3D blob representation
 * - Mind: The AI configuration and capabilities (LLM, TTS, STT)
 * - Soul: The AI personality and behavior
 *
 * @example
 * ```typescript
 * const canvas = document.querySelector('canvas');
 * const kwami = new Kwami(canvas, {
 *   audioFiles: ['/audio/track1.mp3', '/audio/track2.mp3'],
 *   initialSkin: 'tricolor'
 * });
 *
 * // Play audio
 * kwami.body.audio.play();
 *
 * // Change appearance
 * kwami.body.blob.setRandomBlob();
 * ```
 */
export class Kwami {
  public body: KwamiBody;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public mind: any; // TODO: Implement AI configuration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public soul: any; // TODO: Implement AI personality

  private state: KwamiState = 'idle';

  constructor(canvas: HTMLCanvasElement, config?: KwamiConfig) {
    // Initialize the body (visual representation)
    this.body = new KwamiBody(canvas, config?.body);

    // TODO: Initialize mind (AI capabilities)
    this.mind = config?.mind || null;

    // TODO: Initialize soul (AI personality)
    this.soul = config?.soul || null;
  }

  /**
   * Get current state of Kwami
   */
  getState(): KwamiState {
    return this.state;
  }

  /**
   * Set the state of Kwami (affects visual representation)
   */
  setState(state: KwamiState): void {
    this.state = state;
    // TODO: Update blob animation based on state
  }

  /**
   * Kwami starts listening (microphone input)
   */
  async listen(): Promise<void> {
    this.setState('listening');
    // TODO: Implement speech-to-text
  }

  /**
   * Kwami is thinking (processing)
   */
  think(): void {
    this.setState('thinking');
    // TODO: Implement visual thinking animation
  }

  /**
   * Kwami speaks (audio output)
   */
  async speak(_text: string): Promise<void> {
    this.setState('speaking');
    // TODO: Implement text-to-speech
    // For now, just play audio
    await this.body.audio.play();
  }

  /**
   * Cleanup and dispose all resources
   */
  dispose(): void {
    this.body.dispose();
  }
}
