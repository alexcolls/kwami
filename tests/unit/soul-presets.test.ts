import { describe, expect, it } from 'vitest';
import {
  getSoulPresetById,
  getSoulPresetsByCategory,
  soulPresetCategories,
  soulPresets,
  toSoulConfig,
} from '../../src/soul';
import { Soul } from '../../src/soul';

describe('soul presets catalogue', () => {
  it('has a unique id for every preset', () => {
    const ids = soulPresets.map((preset) => preset.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only uses categories that the category list declares', () => {
    const declared = new Set(soulPresetCategories.map((category) => category.id));

    for (const preset of soulPresets) {
      expect(declared.has(preset.category)).toBe(true);
    }
  });

  it('gives every category at least one preset to show', () => {
    for (const category of soulPresetCategories) {
      expect(getSoulPresetsByCategory(category.id).length).toBeGreaterThan(0);
    }
  });

  it('keeps every emotional trait inside the -100..100 range the UI sliders assume', () => {
    for (const preset of soulPresets) {
      for (const [trait, value] of Object.entries(preset.emotionalTraits)) {
        expect(value, `${preset.id}.${trait}`).toBeGreaterThanOrEqual(-100);
        expect(value, `${preset.id}.${trait}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('resolves a preset by id and misses cleanly on an unknown one', () => {
    expect(getSoulPresetById('zen')?.name).toBe('Zen');
    expect(getSoulPresetById('does-not-exist')).toBeUndefined();
  });
});

describe('toSoulConfig', () => {
  it('projects a preset onto the ten core traits and drops the catalogue-only extras', () => {
    const config = toSoulConfig(getSoulPresetById('friendly')!);

    expect(config.name).toBe('Kaya');
    expect(Object.keys(config.emotionalTraits!).sort()).toEqual([
      'calmness',
      'confidence',
      'creativity',
      'curiosity',
      'empathy',
      'energy',
      'happiness',
      'optimism',
      'patience',
      'socialness',
    ]);
    // `humor` and `adaptability` exist on the preset but are not part of EmotionalTraits.
    expect(config.emotionalTraits).not.toHaveProperty('humor');
  });
});

describe('Soul.loadTemplate', () => {
  it('adopts the preset identity', () => {
    const soul = new Soul();

    soul.loadTemplate('mentor');

    expect(soul.getName()).toBe('Sage');
    expect(soul.getEmotionalTone()).toBe('calm');
  });

  it('accepts a spaced, differently cased name', () => {
    const soul = new Soul();

    soul.loadTemplate('  Zen  ');

    expect(soul.getName()).toBe('Zen');
  });

  it('leaves the soul untouched when the template is unknown', () => {
    const soul = new Soul({ name: 'Luna' });

    soul.loadTemplate('nonexistent');

    expect(soul.getName()).toBe('Luna');
  });
});
