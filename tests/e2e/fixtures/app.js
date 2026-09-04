/**
 * The consumer app under test.
 *
 * Imports the BUILT package (`dist/`), not `src/`, and hangs a small control surface off
 * `window.kwamiE2E` so the Playwright specs can drive it. Everything the specs assert about
 * goes through this file, so the browser only ever sees the published entry point.
 */
import {
  Kwami,
  Soul,
  ToolRegistry,
  getSoulPresetById,
  randomizeBlobState,
  soulPresets,
} from '../../../dist/index.js';

/** The live instance the specs are poking at, if any. */
let current = null;

function canvas() {
  const element = document.getElementById('stage');
  if (!(element instanceof HTMLCanvasElement)) throw new Error('#stage is not a canvas');
  return element;
}

/** How many pixels the renderer has drawn that are not the clear colour. */
function hasRenderedPixels() {
  // The canvas already has a context by now, so these attributes are ignored — the one that
  // matters (preserveDrawingBuffer) was set when the library created it. See `create()`.
  const gl = canvas().getContext('webgl2');
  if (!gl) return 0;

  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  let lit = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i] > 8 || pixels[i + 1] > 8 || pixels[i + 2] > 8) lit++;
  }
  return lit;
}

window.kwamiE2E = {
  /** WebGL2 has to be real for any of this to mean anything — the specs check it first. */
  webglAvailable() {
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2'));
  },

  create(config = {}) {
    // `preserveDrawingBuffer` is the library's own scene option (SceneConfig), and it is what
    // makes the pixel readback below possible: without it the browser clears the drawing
    // buffer on composite, so readPixels after the frame returns all zeros and every render
    // assertion would fail on a renderer that is in fact drawing fine.
    current = new Kwami(canvas(), {
      ...config,
      avatar: {
        ...config.avatar,
        scene: { preserveDrawingBuffer: true, ...config.avatar?.scene },
      },
    });
    return { id: current.id, name: current.soul.getName(), state: current.getState() };
  },

  snapshot() {
    if (!current) throw new Error('no Kwami instance');
    return {
      id: current.id,
      name: current.soul.getName(),
      state: current.getState(),
      connected: current.isConnected(),
      systemPrompt: current.soul.getSystemPrompt(),
      tools: current.tools.getToolDefinitions(),
      skills: current.skills.getSkillNames(),
      instanceCount: Kwami.getInstances().size,
    };
  },

  setState(state) {
    current.setState(state);
    return current.getState();
  },

  updateSoul(config) {
    current.updateSoul(config);
    return current.soul.getSystemPrompt();
  },

  registerTool(name, description) {
    current.registerTool({ name, description, handler: async (params) => ({ echoed: params }) });
    return current.tools.getToolDefinitions().map((tool) => tool.name);
  },

  async executeTool(name, params) {
    return current.executeTool(name, params);
  },

  litPixels: hasRenderedPixels,

  async dispose() {
    if (!current) return { instanceCount: Kwami.getInstances().size };
    const id = current.id;
    await current.dispose();
    current = null;
    return {
      instanceCount: Kwami.getInstances().size,
      stillRegistered: Boolean(Kwami.getInstance(id)),
    };
  },

  /** Exercised standalone, without an instance — proves the named exports survived the build. */
  exports: {
    soulPresetCount: () => soulPresets.length,
    presetName: (id) => getSoulPresetById(id)?.name ?? null,
    promptFor: (id) => {
      const soul = new Soul();
      soul.loadTemplate(id);
      return soul.getSystemPrompt();
    },
    toolSchemaFor: (name) =>
      new ToolRegistry({ custom: [{ name, description: name }] }).getToolDefinitions()[0]
        .parameters,
    randomizesBlobState: () => {
      const state = {
        skin: {
          type: 'flat',
          colors: { x: '#000000', y: '#000000', z: '#000000' },
          opacity: 0,
          shininess: 0,
          lightIntensity: 0,
          wireframe: false,
          glassMode: false,
          resolution: 0,
        },
        shape: {
          scale: 3,
          position: { x: 0, y: 0, z: 0 },
          spikes: { x: 0, y: 0, z: 0 },
          amplitude: { x: 0, y: 0, z: 0 },
        },
        animation: { time: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, breathing: 0 },
        cursorTouch: { touch: { strength: 0, duration: 0, maxPoints: 0 } },
        audio: {
          enabled: false,
          reactivity: 0,
          sensitivity: 0,
          responseSpeed: 0,
          transientBoost: 0,
          spikeDensity: 0,
          rotateWhilePlaying: false,
          frequencySpikes: { bass: 0, mid: 0, high: 0 },
        },
      };
      randomizeBlobState(state);
      return state;
    },
  },
};

// The spec waits on this rather than on a fixed timeout.
window.kwamiE2EReady = true;
