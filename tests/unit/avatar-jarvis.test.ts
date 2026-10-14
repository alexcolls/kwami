import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Avatar's jarvis branches live next to a WebGL constructor the unit layer cannot build.
 * The scene, the renderers and the audio graph are mocked so the orchestration — which
 * renderer is chosen, how state and resize reach it, how a switch tears it down — runs
 * here. The renderer bodies themselves stay on the browser layer.
 */

const { jarvisInstances, blobInstances, MockJarvis, MockBlob, MockScene } = vi.hoisted(() => {
  const jarvisInstances: MockJarvis[] = [];
  const blobInstances: MockBlob[] = [];

  class MockJarvis {
    setState = vi.fn();
    dispose = vi.fn();
    onResize = vi.fn();
    setPalettePreset = vi.fn();
    onDoubleClick: (() => void) | null = null;

    constructor() {
      jarvisInstances.push(this);
    }
  }

  class MockBlob {
    position = { refresh: vi.fn(), set: vi.fn() };
    isListening = false;
    startThinking = vi.fn();
    stopThinking = vi.fn();
    setRandomBlob = vi.fn();
    dispose = vi.fn();
    getMesh = vi.fn(() => ({}));
    setAmplitude = vi.fn();
    enableClickInteraction = vi.fn();
    disableClickInteraction = vi.fn();
    onDoubleClick: (() => void) | null = null;
    onConversationToggle: (() => Promise<void>) | null = null;

    constructor() {
      blobInstances.push(this);
    }
  }

  class MockScene {
    controls: { enabled: boolean } | null = { enabled: true };
    scene = { add: vi.fn() };
    camera = {};
    renderer = {};
    resize = vi.fn();
    update = vi.fn();
    dispose = vi.fn();
    onContextChange = vi.fn();
  }

  return { jarvisInstances, blobInstances, MockJarvis, MockBlob, MockScene };
});

vi.mock('../../src/avatar/scene/index.js', () => ({ Scene: MockScene }));
vi.mock('../../src/avatar/renderers/jarvis/index.js', () => ({ Jarvis: MockJarvis }));
vi.mock('../../src/avatar/renderers/blob-xyz/index.js', () => ({ BlobXyz: MockBlob }));
vi.mock('../../src/avatar/renderers/black-hole/index.js', () => ({
  BlackHole: class {
    dispose = vi.fn();
    setState = vi.fn();
    onResize = vi.fn();
  },
}));
vi.mock('../../src/avatar/renderers/particles-face/index.js', () => ({
  ParticlesFace: class {
    dispose = vi.fn();
    setState = vi.fn();
  },
}));
vi.mock('../../src/avatar/renderers/eye-iris/index.js', () => ({
  EyeIris: class {
    dispose = vi.fn();
    setState = vi.fn();
  },
}));
vi.mock('../../src/avatar/audio/index.js', () => ({
  KwamiAudio: class {
    dispose = vi.fn();
    connectMediaStream = vi.fn(async () => {});
    disconnectMediaStream = vi.fn();
  },
}));

const { Avatar } = await import('../../src/avatar/Avatar');

let resizeCallback: ResizeObserverCallback | null = null;

class RecordingResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

function canvas(): HTMLCanvasElement {
  return document.createElement('canvas');
}

afterEach(() => {
  jarvisInstances.length = 0;
  blobInstances.length = 0;
  resizeCallback = null;
  vi.unstubAllGlobals();
});

describe('Avatar jarvis orchestration', () => {
  it('builds a jarvis renderer, disables orbit controls, and forwards state', () => {
    vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
    const avatar = new Avatar(canvas(), { renderer: 'jarvis' });
    const jarvis = jarvisInstances[0]!;

    expect(avatar.getRendererType()).toBe('jarvis');
    expect(avatar.getJarvis()).toBe(jarvis);
    expect(avatar.getScene().controls?.enabled).toBe(false);
    expect(jarvis.setState).toHaveBeenCalledWith('idle');

    avatar.setState('idle');
    expect(jarvis.setState).toHaveBeenCalledTimes(1);

    avatar.setState('speaking');
    expect(avatar.getState()).toBe('speaking');
    expect(jarvis.setState).toHaveBeenCalledWith('speaking');

    avatar.randomize();
    expect(jarvis.setPalettePreset).toHaveBeenCalledWith(
      expect.stringMatching(/^(holo-cyan|neon-violet|arc-white|alert-amber)$/),
    );

    const onDoubleClick = vi.fn();
    avatar.onDoubleClick(onDoubleClick);
    expect(jarvis.onDoubleClick).toBe(onDoubleClick);

    resizeCallback?.(
      [{ contentRect: { width: 320, height: 240 } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    expect(jarvis.onResize).toHaveBeenCalledWith(320, 240);

    resizeCallback?.(
      [{ contentRect: { width: 0, height: 0 } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
    expect(jarvis.onResize).toHaveBeenCalledTimes(1);

    avatar.dispose();
    expect(jarvis.dispose).toHaveBeenCalledOnce();
  });

  it('disposes jarvis when switching away and builds a fresh one when switching back', () => {
    vi.stubGlobal('ResizeObserver', RecordingResizeObserver);
    const avatar = new Avatar(canvas(), { renderer: 'jarvis' });
    const first = jarvisInstances[0]!;

    avatar.switchRenderer('jarvis');
    expect(jarvisInstances).toHaveLength(1);

    avatar.setState('thinking');
    avatar.switchRenderer('blob-xyz');

    expect(first.dispose).toHaveBeenCalledOnce();
    expect(avatar.getJarvis()).toBeNull();
    expect(avatar.getRendererType()).toBe('blob-xyz');
    expect(avatar.getBlob()).toBe(blobInstances[0]);
    expect(avatar.getScene().controls?.enabled).toBe(true);
    expect(avatar.getState()).toBe('thinking');

    avatar.switchRenderer('jarvis');
    const second = jarvisInstances[1]!;
    expect(avatar.getJarvis()).toBe(second);
    expect(second.setState).toHaveBeenCalledWith('thinking');
    expect(avatar.getScene().controls?.enabled).toBe(false);

    avatar.dispose();
  });
});
