import { describe, expect, it } from 'vitest';
import { Soul } from '../../src/soul';
import type { EmotionalTraits } from '../../src/types';

/** A trait sheet at rest — every dimension neutral, so a test can move exactly one. */
function neutralTraits(): EmotionalTraits {
  return {
    happiness: 0,
    energy: 0,
    confidence: 0,
    calmness: 0,
    optimism: 0,
    socialness: 0,
    creativity: 0,
    patience: 0,
    empathy: 0,
    curiosity: 0,
  };
}

describe('Soul defaults', () => {
  it('names itself Kwami and starts with neutral emotional traits', () => {
    const soul = new Soul();

    expect(soul.getName()).toBe('Kwami');
    expect(soul.getLanguage()).toBe('en');
    expect(soul.getEmotionalTraits()).toEqual(neutralTraits());
  });

  it('folds personality, traits, style and length into the system prompt', () => {
    const prompt = new Soul().getSystemPrompt();

    expect(prompt).toContain('You are Kwami');
    expect(prompt).toContain('Personality: A friendly and helpful AI companion');
    expect(prompt).toContain('Key traits: friendly, helpful, curious');
    expect(prompt).toContain('Conversation style: friendly');
    expect(prompt).toContain('(2-4 sentences)');
    expect(prompt).toContain('Express warmth and friendliness');
  });
});

describe('Soul emotional trait shaping', () => {
  it('omits traits whose weighted magnitude stays under the noise floor', () => {
    // empathy is weighted 1.35, so 5 lands at 6.75 — below the magnitude-10 cutoff.
    const soul = new Soul({ emotionalTraits: { ...neutralTraits(), empathy: 5 } });

    expect(soul.getSystemPrompt()).not.toContain('Voice emotion profile');
  });

  it('describes a strong trait with its direction and intensity', () => {
    const soul = new Soul({ emotionalTraits: { ...neutralTraits(), empathy: 90 } });

    // 90 × 1.35 = 121.5, clamped to 100 → "very strongly".
    expect(soul.getSystemPrompt()).toContain('Voice emotion profile: very strongly more empathic');
  });

  it('flips to the low-side label for a negative value', () => {
    const soul = new Soul({ emotionalTraits: { ...neutralTraits(), happiness: -80 } });

    expect(soul.getSystemPrompt()).toContain('strongly sadder');
  });

  it('keeps only the five strongest directives, ordered by weighted magnitude', () => {
    const soul = new Soul({
      emotionalTraits: {
        happiness: 40,
        energy: 45,
        confidence: 50,
        calmness: 55,
        optimism: 60,
        socialness: 65,
        creativity: 70,
        patience: 75,
        empathy: 80,
        curiosity: 85,
      },
    });

    const profile = soul.getSystemPrompt().split('Voice emotion profile: ')[1] ?? '';
    const directives = profile.split('.')[0].split(', ');

    expect(directives).toHaveLength(5);
    // empathy 80×1.35 = 108 → clamped 100, the largest; happiness 40×1.1 = 44, not in the top five.
    expect(directives[0]).toContain('more empathic');
    expect(profile).not.toContain('happier');
  });

  it('clamps a trait set through the setter to the -100..100 range', () => {
    const soul = new Soul();

    soul.setEmotionalTrait('energy', 500);
    soul.setEmotionalTrait('calmness', -500);

    expect(soul.getEmotionalTraits()?.energy).toBe(100);
    expect(soul.getEmotionalTraits()?.calmness).toBe(-100);
  });
});

describe('Soul memory context', () => {
  it('appends the remembered summary and facts to the prompt', () => {
    const prompt = new Soul().getSystemPrompt({
      summary: 'Prefers short answers.',
      facts: ['Lives in Barcelona', 'Ships on Fridays'],
    });

    expect(prompt).toContain('## What you remember about this user:\nPrefers short answers.');
    expect(prompt).toContain('## Key facts:\n- Lives in Barcelona\n- Ships on Fridays');
  });

  it('leaves the prompt untouched when the context is empty', () => {
    const soul = new Soul();

    expect(soul.getSystemPrompt({})).toBe(soul.getSystemPrompt());
  });
});

describe('Soul traits list', () => {
  it('adds a trait once and removes it again', () => {
    const soul = new Soul({ traits: ['curious'] });

    soul.addTrait('bold');
    soul.addTrait('bold');
    expect(soul.getTraits()).toEqual(['curious', 'bold']);

    soul.removeTrait('curious');
    expect(soul.getTraits()).toEqual(['bold']);
  });
});

describe('Soul serialisation', () => {
  it('round-trips through JSON', () => {
    const soul = new Soul({ name: 'Luna', traits: ['sharp'] });
    const restored = new Soul();

    restored.importFromJSON(soul.exportAsJSON());

    expect(restored.getName()).toBe('Luna');
    expect(restored.getTraits()).toEqual(['sharp']);
  });

  it('throws on malformed JSON rather than silently keeping the old config', () => {
    expect(() => new Soul().importFromJSON('{ not json')).toThrow();
  });

  it('hands back a copy of the config, not the live object', () => {
    const soul = new Soul({ name: 'Luna' });

    soul.getConfig().name = 'Mutated';

    expect(soul.getName()).toBe('Luna');
  });
});
