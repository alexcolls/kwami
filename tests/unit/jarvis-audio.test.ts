import { describe, expect, it } from 'vitest';
import {
  JarvisAudioAnalyzer,
  smoothingCoefficient,
  synthesizeSpeechSpectrum,
} from '../../src/avatar/renderers/jarvis/audio';
import {
  createCircuitTraces,
  createReactorBlocks,
  createRingSpecs,
} from '../../src/avatar/renderers/jarvis/layout';

const SAMPLE_RATE = 48000;
const BINS = 1024;
const FRAME_MS = 1000 / 60;

/** A byte spectrum with a flat magnitude between two frequencies and silence elsewhere. */
function toneBand(lowHz: number, highHz: number, magnitude: number): Uint8Array {
  const data = new Uint8Array(BINS);
  const binHz = SAMPLE_RATE / (2 * BINS);
  for (let bin = 0; bin < BINS; bin++) {
    const hz = bin * binHz;
    if (hz >= lowHz && hz <= highHz) data[bin] = magnitude;
  }
  return data;
}

function run(analyzer: JarvisAudioAnalyzer, data: Uint8Array, frames: number) {
  let frame = analyzer.analyze(data, SAMPLE_RATE, FRAME_MS);
  for (let i = 1; i < frames; i++) frame = analyzer.analyze(data, SAMPLE_RATE, FRAME_MS);
  return frame;
}

describe('JarvisAudioAnalyzer', () => {
  it('stays at rest on silence', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const frame = run(analyzer, new Uint8Array(BINS), 30);
    expect(frame.level).toBe(0);
    expect(frame.onset).toBe(0);
    expect(frame.active).toBe(false);
    expect(frame.db).toBe(-90);
  });

  it('treats noise below the floor as silence', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const frame = run(analyzer, toneBand(100, 6000, 60), 30);
    expect(frame.level).toBe(0);
    expect(frame.active).toBe(false);
  });

  it('rises with a voice-band signal and falls back after it stops', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const loud = run(analyzer, toneBand(150, 3000, 220), 20);
    expect(loud.level).toBeGreaterThan(0.4);
    expect(loud.active).toBe(true);

    const after = run(analyzer, new Uint8Array(BINS), 40);
    expect(after.level).toBeLessThan(0.05);
  });

  it('attacks faster than it releases', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const rise = run(analyzer, toneBand(150, 3000, 220), 3).level;
    const peak = run(analyzer, toneBand(150, 3000, 220), 30).level;
    const fall = run(analyzer, new Uint8Array(BINS), 3).level;
    // Three frames of attack cover more of the distance than three frames of release.
    expect(rise / peak).toBeGreaterThan(1 - fall / peak);
  });

  it('maps low and high energy to opposite ends of the spectrum', () => {
    const low = run(new JarvisAudioAnalyzer(), toneBand(100, 250, 230), 20).spectrum;
    const lowEnergyStart = low.slice(0, 16).reduce((a, b) => a + b, 0);
    const lowEnergyEnd = low.slice(48).reduce((a, b) => a + b, 0);
    expect(lowEnergyStart).toBeGreaterThan(lowEnergyEnd);

    const high = run(new JarvisAudioAnalyzer(), toneBand(4000, 7000, 230), 20).spectrum;
    const highEnergyStart = high.slice(0, 16).reduce((a, b) => a + b, 0);
    const highEnergyEnd = high.slice(48).reduce((a, b) => a + b, 0);
    expect(highEnergyEnd).toBeGreaterThan(highEnergyStart);
  });

  it('detects an onset on a syllable attack, then respects the refractory period', () => {
    const analyzer = new JarvisAudioAnalyzer();
    run(analyzer, new Uint8Array(BINS), 20);
    const attack = analyzer.analyze(toneBand(150, 3000, 230), SAMPLE_RATE, FRAME_MS);
    expect(attack.onset).toBeGreaterThan(0);

    // A second jump right after is suppressed.
    const next = analyzer.analyze(toneBand(150, 4000, 250), SAMPLE_RATE, FRAME_MS);
    expect(next.onset).toBe(0);
  });

  it('does not fire onsets on a steady tone', () => {
    const analyzer = new JarvisAudioAnalyzer();
    run(analyzer, toneBand(150, 3000, 220), 30);
    const steady = run(analyzer, toneBand(150, 3000, 220), 30);
    expect(steady.onset).toBe(0);
  });

  it('reports a pitch inside the band it was fed', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const frame = run(analyzer, toneBand(180, 200, 240), 30);
    expect(frame.peakHz).toBeGreaterThan(160);
    expect(frame.peakHz).toBeLessThan(220);
  });

  it('decays gracefully when the analyser hands back no bins', () => {
    const analyzer = new JarvisAudioAnalyzer();
    run(analyzer, toneBand(150, 3000, 220), 20);
    const frame = run(analyzer, new Uint8Array(0), 60);
    expect(frame.level).toBeLessThan(0.01);
    expect(frame.active).toBe(false);
  });
});

describe('synthesizeSpeechSpectrum', () => {
  it('produces syllables the analyser reads as speech', () => {
    const analyzer = new JarvisAudioAnalyzer();
    const data = new Uint8Array(BINS);
    let onsets = 0;
    let maxLevel = 0;
    for (let i = 0; i < 180; i++) {
      synthesizeSpeechSpectrum(i / 60, SAMPLE_RATE, data);
      const frame = analyzer.analyze(data, SAMPLE_RATE, FRAME_MS);
      if (frame.onset > 0) onsets++;
      maxLevel = Math.max(maxLevel, frame.level);
    }
    // Three seconds of fake speech: several syllables, real level.
    expect(onsets).toBeGreaterThanOrEqual(4);
    expect(maxLevel).toBeGreaterThan(0.3);
  });
});

describe('smoothingCoefficient', () => {
  it('is frame-rate independent', () => {
    const at60 = 1 - Math.pow(1 - smoothingCoefficient(1000 / 60, 100), 60);
    const at120 = 1 - Math.pow(1 - smoothingCoefficient(1000 / 120, 100), 120);
    expect(at60).toBeCloseTo(at120, 10);
  });
});

describe('jarvis layout', () => {
  it('is deterministic', () => {
    expect(createReactorBlocks()).toEqual(createReactorBlocks());
    expect(createCircuitTraces()).toEqual(createCircuitTraces());
  });

  it('keeps reactor blocks around the reactor radius', () => {
    for (const block of createReactorBlocks()) {
      expect(block.radius).toBeGreaterThan(0.65);
      expect(block.radius).toBeLessThan(1.15);
      expect(block.arc).toBeGreaterThan(0);
    }
  });

  it('keeps rings sorted inside-out with sane widths', () => {
    const specs = createRingSpecs();
    for (let i = 1; i < specs.length; i++) {
      expect(specs[i]!.radius).toBeGreaterThan(specs[i - 1]!.radius);
    }
    for (const spec of specs) {
      expect(spec.width).toBeGreaterThanOrEqual(0);
      expect(spec.arcLength).toBeGreaterThan(0);
    }
  });

  it('keeps circuit traces outside the reactor', () => {
    for (const path of createCircuitTraces()) {
      for (const [x, y] of path.points) {
        expect(Math.hypot(x, y)).toBeGreaterThan(1.2);
      }
    }
  });
});
