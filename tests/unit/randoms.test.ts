import { describe, expect, it } from 'vitest';
import {
  genDNA,
  getRandomBetween,
  getRandomBoolean,
  getRandomHexColor,
  getRandomUUID,
  randomNumber,
} from '../../src/utils/randoms';

describe('getRandomUUID', () => {
  it('produces a v4-shaped UUID', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomUUID()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });

  it('does not repeat across a batch', () => {
    const ids = Array.from({ length: 200 }, getRandomUUID);

    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getRandomBetween', () => {
  it('stays inside the requested range', () => {
    for (let i = 0; i < 200; i++) {
      const value = getRandomBetween(-5, 5);
      expect(value).toBeGreaterThanOrEqual(-5);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it('honours the requested precision', () => {
    for (let i = 0; i < 50; i++) {
      const decimals = String(getRandomBetween(0, 1, 3)).split('.')[1] ?? '';
      expect(decimals.length).toBeLessThanOrEqual(3);
    }
  });

  it('defaults to the 0..1 unit range', () => {
    const value = getRandomBetween();

    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });
});

describe('getRandomHexColor', () => {
  it('always pads to a full six-digit hex colour', () => {
    // The pre-pad implementation could emit '#1a2b3' for a small random value, which every
    // CSS and three.js colour parser reads as invalid.
    for (let i = 0; i < 500; i++) {
      expect(getRandomHexColor()).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('getRandomBoolean', () => {
  it('is deterministic at the extremes', () => {
    expect(getRandomBoolean(1)).toBe(true);
    expect(getRandomBoolean(0)).toBe(false);
  });

  it('roughly honours the requested probability', () => {
    const trues = Array.from({ length: 4000 }, () => getRandomBoolean(0.25)).filter(Boolean).length;

    expect(trues / 4000).toBeGreaterThan(0.18);
    expect(trues / 4000).toBeLessThan(0.32);
  });
});

describe('randomNumber and genDNA', () => {
  it('returns a digit string of the requested length', () => {
    expect(randomNumber(8)).toMatch(/^\d{8}$/);
  });

  it('joins three digit groups with dashes', () => {
    expect(genDNA(4, 5, 6)).toMatch(/^\d{4}-\d{5}-\d{6}$/);
  });
});
