import { describe, expect, it } from 'vitest';
import {
  buildLLMDescriptor,
  buildSTTDescriptor,
  buildTTSDescriptor,
  filterPresetVoices,
  findPresetVoice,
  getVoicePipelinePreset,
  PRESET_VOICES,
  VOICE_LLM_MODELS,
  VOICE_LLM_PROVIDERS,
  VOICE_STT_MODELS,
  VOICE_STT_PROVIDERS,
  VOICE_TTS_MODELS,
  VOICE_TTS_PROVIDERS,
} from '../../src/agent';

describe('LiveKit Inference descriptors', () => {
  // These strings are the wire format the backend agent parses; a stray separator is a
  // runtime failure on a live call, not a type error.
  it('builds an STT descriptor with and without a language', () => {
    expect(buildSTTDescriptor('deepgram', 'nova-3')).toBe('deepgram/nova-3');
    expect(buildSTTDescriptor('deepgram', 'nova-3', 'en')).toBe('deepgram/nova-3:en');
  });

  it('builds a TTS descriptor with and without a voice', () => {
    expect(buildTTSDescriptor('cartesia', 'sonic-3')).toBe('cartesia/sonic-3');
    expect(buildTTSDescriptor('cartesia', 'sonic-3', 'voice-id')).toBe('cartesia/sonic-3:voice-id');
  });

  it('builds an LLM descriptor', () => {
    expect(buildLLMDescriptor('openai', 'gpt-4.1-mini')).toBe('openai/gpt-4.1-mini');
  });
});

describe('getVoicePipelinePreset', () => {
  it('gives every stt-llm-tts preset a full three-stage pipeline', () => {
    for (const name of ['fast', 'quality', 'balanced', 'multilingual'] as const) {
      const preset = getVoicePipelinePreset(name);

      expect(preset.type, name).toBe('stt-llm-tts');
      expect(preset.stt?.provider, name).toBeTruthy();
      expect(preset.llm?.provider, name).toBeTruthy();
      expect(preset.tts?.provider, name).toBeTruthy();
    }
  });

  it('gives the realtime preset a realtime block and no stt/tts stages', () => {
    const preset = getVoicePipelinePreset('realtime');

    expect(preset.type).toBe('realtime');
    expect(preset.realtime?.provider).toBe('openai');
    expect(preset.stt).toBeUndefined();
    expect(preset.tts).toBeUndefined();
  });

  it('asks for multi-language STT on the multilingual preset', () => {
    expect(getVoicePipelinePreset('multilingual').stt?.language).toBe('multi');
  });

  it('returns an empty object for an unknown preset instead of throwing', () => {
    expect(getVoicePipelinePreset('nope' as never)).toEqual({});
  });
});

/**
 * LLM providers that are advertised in the catalogue but ship no model list, so a UI built on
 * `VOICE_LLM_PROVIDERS` renders them with an empty model dropdown.
 *
 * A RATCHET, not a permanent allowance: the test below fails both when a provider outside this
 * list has no models AND when a provider inside it gains some. Add models to
 * `VOICE_LLM_MODELS` and delete the entry — never add an entry to make a red build green.
 */
const LLM_PROVIDERS_WITHOUT_MODELS = ['groq', 'deepseek', 'mistral', 'cerebras', 'ollama'];

describe('voice catalogue integrity', () => {
  it('lists models for every advertised STT provider', () => {
    for (const provider of VOICE_STT_PROVIDERS) {
      expect(VOICE_STT_MODELS[provider.provider]?.length, provider.provider).toBeGreaterThan(0);
    }
  });

  it('lists models for every advertised LLM provider that claims to have them', () => {
    for (const provider of VOICE_LLM_PROVIDERS) {
      if (LLM_PROVIDERS_WITHOUT_MODELS.includes(provider.provider)) continue;
      expect(VOICE_LLM_MODELS[provider.provider]?.length, provider.provider).toBeGreaterThan(0);
    }
  });

  it('shrinks the list of model-less LLM providers as they are filled in', () => {
    const stillEmpty = LLM_PROVIDERS_WITHOUT_MODELS.filter(
      (provider) => !VOICE_LLM_MODELS[provider as keyof typeof VOICE_LLM_MODELS]?.length,
    );

    expect(
      stillEmpty,
      'a provider gained models — remove it from LLM_PROVIDERS_WITHOUT_MODELS',
    ).toEqual(LLM_PROVIDERS_WITHOUT_MODELS);
  });

  it('lists models for every advertised TTS provider', () => {
    for (const provider of VOICE_TTS_PROVIDERS) {
      expect(VOICE_TTS_MODELS[provider.provider]?.length, provider.provider).toBeGreaterThan(0);
    }
  });

  it('keeps preset voice ids unique per provider', () => {
    const keys = PRESET_VOICES.map((voice) => `${voice.provider}/${voice.voiceId}`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('preset voice lookup', () => {
  it('finds a voice by name, case-insensitively', () => {
    expect(findPresetVoice('luna')?.provider).toBe('rime');
    expect(findPresetVoice('LUNA')?.voiceId).toBe('luna');
  });

  it('misses cleanly on an unknown name', () => {
    expect(findPresetVoice('nobody')).toBeUndefined();
  });

  it('filters by provider', () => {
    const voices = filterPresetVoices({ provider: 'cartesia' });

    expect(voices.length).toBeGreaterThan(0);
    expect(voices.every((voice) => voice.provider === 'cartesia')).toBe(true);
  });

  it('matches a language by prefix, so `en` also covers `en-GB`', () => {
    const voices = filterPresetVoices({ language: 'en' });

    expect(voices.some((voice) => voice.language === 'en-GB')).toBe(true);
    expect(voices.every((voice) => voice.language.startsWith('en'))).toBe(true);
  });

  it('combines filters', () => {
    const voices = filterPresetVoices({ provider: 'rime', gender: 'male' });

    expect(voices.map((voice) => voice.name)).toEqual(['Ursa']);
  });

  it('returns the whole list for an empty filter', () => {
    expect(filterPresetVoices({})).toHaveLength(PRESET_VOICES.length);
  });
});
