export type UtteranceOptions = {
  voice?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
};

export type RecorderOptions = {
  mimeType?: string;
  bitsPerSecond?: number;
};

export type DataType = 'mediaStream' | 'other';

export type ReadableStreamControllerOptions = {
  start?: (controller: ReadableStreamDefaultController) => void;
  pull?: (controller: ReadableStreamDefaultController) => void;
  cancel?: (reason: any) => void;
};

export type ReadableStreamOptions = {
  size?: number;
  controllerOptions?: ReadableStreamControllerOptions;
  rsOptions?: QueuingStrategy;
};

export default class SpeechSynthesisRecorder {
  private text: string;
  private dataType: DataType;
  private mimeType: string;
  private utterance: SpeechSynthesisUtterance;
  private speechSynthesis: SpeechSynthesis;
  private mediaStream_: MediaStream;
  private mediaSource_: MediaSource;
  private mediaRecorder: MediaRecorder;
  private audioContext: AudioContext;
  private audioNode: HTMLAudioElement;
  private chunks: BlobPart[];
  constructor({
    text = '',
    utteranceOptions = {},
    recorderOptions = {},
    dataType = 'other',
    audioNodeControls = false,
  }: {
    text?: string;
    utteranceOptions?: UtteranceOptions;
    recorderOptions?: RecorderOptions;
    dataType?: DataType;
    audioNodeControls?: boolean;
  }) {
    if (!text) { throw new Error('no words to synthesize'); }
    this.dataType = dataType;
    this.text = text;
    this.mimeType = MediaRecorder.isTypeSupported('audio/webm; codecs=opus')
      ? 'audio/webm; codecs=opus'
      : 'audio/ogg; codecs=opus';
    this.utterance = new SpeechSynthesisUtterance(this.text);
    this.speechSynthesis = window.speechSynthesis;
    this.mediaStream_ = new MediaStream();
    this.mediaSource_ = new MediaSource();
    this.mediaRecorder = new MediaRecorder(this.mediaStream_, {
      mimeType: this.mimeType,
      bitsPerSecond: 256 * 8 * 1024,
      ...recorderOptions,
    });
    this.audioContext = new AudioContext();
    this.audioNode = new Audio();
    this.chunks = [];
    if (utteranceOptions) {
      if (utteranceOptions.voice) {
        this.speechSynthesis.onvoiceschanged = () => {
          const voice = this.speechSynthesis
            .getVoices()
            .find(({ name: _name }) => _name === utteranceOptions.voice);
          if (voice) {
            this.utterance.voice = voice;
          }
          console.log(voice, this.utterance);
        };
        this.speechSynthesis.getVoices();
      }
      if (utteranceOptions.lang) {
        this.utterance.lang = utteranceOptions.lang;
      }
      if (
        typeof utteranceOptions.rate === 'number'
        && isFinite(utteranceOptions.rate)
        && utteranceOptions.rate >= 0.1
        && utteranceOptions.rate <= 10
      ) {
        this.utterance.rate = utteranceOptions.rate;
      }
      if (
        typeof utteranceOptions.pitch === 'number'
        && isFinite(utteranceOptions.pitch)
        && utteranceOptions.pitch >= 0
        && utteranceOptions.pitch <= 2
      ) {
        this.utterance.pitch = utteranceOptions.pitch;
      }
    }
    this.audioNode.controls = audioNodeControls;
    if (this.audioNode.controls) {
      document.body.appendChild(this.audioNode as Node);
    }
  }

  async start(
    text: string = '',
  ): Promise<this | { tts: SpeechSynthesisRecorder; data: MediaStream }> {
    if (text) { this.text = text; }
    if (this.text === '') { throw new Error('no words to synthesize'); }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return await new Promise((resolve) => {
      const track: MediaStreamTrack = stream.getAudioTracks()[0];
      this.mediaStream_.addTrack(track);
      if (this.dataType && this.dataType === 'mediaStream') {
        resolve({ tts: this, data: this.mediaStream_ });
      }
      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      this.mediaRecorder.onstop = () => {
        track.stop();
        this.mediaStream_.getAudioTracks()[0].stop();
        this.mediaStream_.removeTrack(track);
        console.log(`Completed recording ${this.utterance.text}`, this.chunks);
        resolve(this);
      };
      this.mediaRecorder.start();
      this.utterance.onstart = () => {
        console.log(
          `Starting recording SpeechSynthesisUtterance ${this.utterance.text}`,
        );
      };
      this.utterance.onend = () => {
        this.mediaRecorder.stop();
        console.log(
          `Ending recording SpeechSynthesisUtterance ${this.utterance.text}`,
        );
      };
      this.speechSynthesis.speak(this.utterance);
    });
  }

  blob(): Promise<{ tts: SpeechSynthesisRecorder; data: Blob | any }> {
    if (!this.chunks.length) { throw new Error('no data to return'); }
    return Promise.resolve({
      tts: this,
      data:
        this.chunks.length === 1
          ? this.chunks[0]
          : new Blob(this.chunks, {
            type: this.mimeType,
          }),
    });
  }

  arrayBuffer(
    blob?: Blob,
  ): Promise<{ tts: SpeechSynthesisRecorder; data: ArrayBuffer }> {
    if (!this.chunks.length) { throw new Error('no data to return'); }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = _ =>
        resolve({
          tts: this,
          data: reader.result as ArrayBuffer,
        });
      if (blob instanceof Blob) {
        reader.readAsArrayBuffer(blob);
      } else if (this.chunks.length === 1) {
        reader.readAsArrayBuffer(this.chunks[0] as Blob);
      } else {
        reader.readAsArrayBuffer(
          new Blob(this.chunks, {
            type: this.mimeType,
          }),
        );
      }
    });
  }

  async audioBuffer(): Promise<{
    tts: SpeechSynthesisRecorder;
    data: AudioBuffer;
  }> {
    if (!this.chunks.length) { throw new Error('no data to return'); }
    const ab = await this.arrayBuffer();
    const buffer = await this.audioContext.decodeAudioData(ab.data);
    return {
      tts: this,
      data: buffer,
    };
  }

  async mediaSource(): Promise<{
    tts: SpeechSynthesisRecorder;
    data: MediaSource;
  }> {
    if (!this.chunks.length) { throw new Error('no data to return'); }
    const { data: ab } = await this.arrayBuffer();
    return await new Promise<{
      tts: SpeechSynthesisRecorder;
      data: MediaSource;
    }>((resolve, reject) => {
      this.mediaSource_.onsourceended = () =>
        resolve({
          tts: this,
          data: this.mediaSource_,
        });
      this.mediaSource_.onsourceopen = () => {
        if (MediaSource.isTypeSupported(this.mimeType)) {
          const sourceBuffer: SourceBuffer = this.mediaSource_.addSourceBuffer(
            this.mimeType,
          );
          sourceBuffer.mode = 'sequence';
          sourceBuffer.onupdateend = () => this.mediaSource_.endOfStream();
          sourceBuffer.appendBuffer(new Uint8Array(ab));
        } else {
          reject(`${this.mimeType} is not supported`);
        }
      };
      this.audioNode.src = URL.createObjectURL(this.mediaSource_);
    });
  }

  readableStream(
    options: ReadableStreamOptions = {},
  ): Promise<{ tts: SpeechSynthesisRecorder; data: ReadableStream }> {
    const { size = 1024, controllerOptions = {}, rsOptions = {} } = options;
    if (!this.chunks.length) { throw new Error('no data to return'); }
    const src: BlobPart[] = this.chunks.slice(0);
    const chunk: number = size;
    return Promise.resolve({
      tts: this,
      data: new ReadableStream(
        {
          start(controller: ReadableStreamDefaultController) {
            console.log(src.length);
            controller.enqueue(src.splice(0, chunk));
          },
          pull(controller: ReadableStreamDefaultController) {
            if (src.length === 0) { controller.close(); }
            controller.enqueue(src.splice(0, chunk));
          },
          ...controllerOptions,
        },
        rsOptions,
      ),
    });
  }
}
