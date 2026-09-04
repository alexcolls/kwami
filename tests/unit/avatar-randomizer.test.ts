import { describe, expect, it } from 'vitest';
import {
  BLOB_SKIN_LABELS,
  BLOB_SKINS,
  randomBlobAmplitude,
  randomBlobColors,
  randomBlobRotation,
  randomBlobSkinType,
  randomBlobSpikes,
  randomBlobSurface,
  randomBlobTime,
  randomBlobTouch,
  randomizeBlobState,
} from '../../src/avatar';
import type { BlobRandomizerState } from '../../src/avatar';

/**
 * A blob state at rest. `randomizeBlobState` mutates in place, so every assertion below is
 * about what it wrote back onto this object.
 */
function baseState(): BlobRandomizerState {
  return {
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
    animation: {
      time: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      breathing: 0,
    },
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
}

describe('blob skin catalogue', () => {
  it('labels every skin the renderer can be set to', () => {
    for (const skin of BLOB_SKINS) {
      expect(BLOB_SKIN_LABELS[skin], skin).toBeTruthy();
    }
  });

  it('has no label for a skin the renderer does not know', () => {
    expect(Object.keys(BLOB_SKIN_LABELS).sort()).toEqual([...BLOB_SKINS].sort());
  });

  it('only ever picks a skin from the catalogue', () => {
    const skins = new Set(BLOB_SKINS);

    for (let i = 0; i < 300; i++) {
      expect(skins.has(randomBlobSkinType())).toBe(true);
    }
  });
});

describe('blob randomizer ranges', () => {
  it('emits three parseable hex colours', () => {
    const colors = randomBlobColors();

    for (const channel of ['x', 'y', 'z'] as const) {
      expect(colors[channel]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('keeps surface values inside the ranges the shaders expect', () => {
    for (let i = 0; i < 200; i++) {
      const surface = randomBlobSurface();

      expect(surface.opacity).toBeGreaterThanOrEqual(0.1);
      expect(surface.opacity).toBeLessThanOrEqual(1);
      expect(surface.shininess).toBeGreaterThanOrEqual(20);
      expect(surface.shininess).toBeLessThanOrEqual(150);
      expect(surface.lightIntensity).toBeGreaterThanOrEqual(0);
      expect(surface.lightIntensity).toBeLessThanOrEqual(2);
      expect(surface.resolution).toBeGreaterThanOrEqual(64);
      expect(surface.resolution).toBeLessThanOrEqual(256);
    }
  });

  it('locks all three axes together when asked to link them', () => {
    for (const axes of [randomBlobSpikes(true), randomBlobAmplitude(true), randomBlobTime(true)]) {
      expect(axes.x).toBe(axes.y);
      expect(axes.y).toBe(axes.z);
    }
  });

  it('keeps rotation either fully stopped or inside the drift range', () => {
    for (let i = 0; i < 300; i++) {
      const rotation = randomBlobRotation(false);
      const stopped = rotation.x === 0 && rotation.y === 0 && rotation.z === 0;

      if (stopped) continue;
      for (const axis of ['x', 'y', 'z'] as const) {
        expect(rotation[axis]).toBeGreaterThanOrEqual(0.001);
        expect(rotation[axis]).toBeLessThanOrEqual(0.004);
      }
    }
  });

  it('gives cursor touch a whole number of points', () => {
    for (let i = 0; i < 100; i++) {
      const touch = randomBlobTouch();

      expect(Number.isInteger(touch.maxPoints)).toBe(true);
      expect(touch.maxPoints).toBeGreaterThanOrEqual(3);
      expect(touch.maxPoints).toBeLessThanOrEqual(12);
    }
  });
});

describe('randomizeBlobState', () => {
  it('rewrites skin, shape, animation, touch and audio in place', () => {
    const state = baseState();

    randomizeBlobState(state);

    expect(state.skin.colors.x).toMatch(/^#[0-9a-f]{6}$/);
    expect(state.skin.resolution).toBeGreaterThanOrEqual(64);
    expect(state.cursorTouch.touch.maxPoints).toBeGreaterThanOrEqual(3);
    expect(state.audio.frequencySpikes.bass).toBeGreaterThan(0);
  });

  it('leaves scale alone — full randomize deliberately keeps the blob the same size', () => {
    const state = baseState();
    state.shape.scale = 3.7;

    randomizeBlobState(state);

    expect(state.shape.scale).toBe(3.7);
  });
});
