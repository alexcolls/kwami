import { describe, expect, it } from 'vitest';
import { Soul } from '../../src/soul';
import { ToolRegistry } from '../../src/tools';
import { SkillManager } from '../../src/skills';
import { buildLLMDescriptor, buildSTTDescriptor, buildTTSDescriptor } from '../../src/agent';
import { getVoicePipelinePreset } from '../../src/agent';

/**
 * The payload Kwami sends to the backend agent on connect is assembled from four modules that
 * never import each other: Soul, ToolRegistry, SkillManager and the voice pipeline builders.
 * These tests assemble it the same way `Kwami.getFullConfig()` does — without touching the
 * Avatar, which needs a WebGL context and belongs in the e2e layer — and assert the seams.
 */
function buildDispatchPayload(options: {
  soul: Soul;
  tools: ToolRegistry;
  skills: SkillManager;
  preset: Parameters<typeof getVoicePipelinePreset>[0];
}) {
  const voice = getVoicePipelinePreset(options.preset);

  return {
    kwamiName: options.soul.getName(),
    soul: { ...options.soul.getConfig(), systemPrompt: options.soul.getSystemPrompt() },
    voice: {
      ...voice,
      descriptors: {
        stt: voice.stt
          ? buildSTTDescriptor(voice.stt.provider!, voice.stt.model!, voice.stt.language)
          : null,
        llm: voice.llm ? buildLLMDescriptor(voice.llm.provider!, voice.llm.model!) : null,
        tts: voice.tts ? buildTTSDescriptor(voice.tts.provider!, voice.tts.model!) : null,
      },
    },
    tools: options.tools.getToolDefinitions(),
    skills: options.skills.getSkillNames(),
  };
}

describe('agent dispatch payload', () => {
  it('carries a resolved prompt, JSON-Schema tools, skill names and wire descriptors', () => {
    const soul = new Soul();
    soul.loadTemplate('scientist');
    soul.setEmotionalTrait('curiosity', 95);

    const payload = buildDispatchPayload({
      soul,
      tools: new ToolRegistry({
        custom: [
          { name: 'weather', description: 'Look up the weather', handler: async () => null },
          { name: 'clock', description: 'Read the clock', parameters: { tz: { type: 'string' } } },
        ],
      }),
      skills: new SkillManager({
        definitions: [
          { name: 'wave', description: 'Wave', execute: async () => ({ success: true }) },
        ],
      }),
      preset: 'balanced',
    });

    expect(payload.kwamiName).toBe('Quill');
    expect(payload.soul.systemPrompt).toContain('You are Quill');
    expect(payload.soul.systemPrompt).toContain('more curious');

    // Handlers stay on this side of the wire; the model only ever sees name/description/schema.
    expect(payload.tools).toHaveLength(2);
    for (const tool of payload.tools) {
      expect(tool).not.toHaveProperty('handler');
      expect(tool.parameters).toMatchObject({ type: 'object' });
    }

    expect(payload.skills).toEqual(['wave']);
    expect(payload.voice.descriptors).toEqual({
      stt: 'deepgram/nova-3',
      llm: 'openai/gpt-4.1-mini',
      tts: 'cartesia/sonic-3',
    });
  });

  it('serialises to JSON without losing anything — this payload crosses a data channel', () => {
    const payload = buildDispatchPayload({
      soul: new Soul({ name: 'Luna' }),
      tools: new ToolRegistry({ custom: [{ name: 'echo', description: 'Echo' }] }),
      skills: new SkillManager(),
      preset: 'fast',
    });

    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });

  it('omits stt and tts descriptors on the realtime preset', () => {
    const payload = buildDispatchPayload({
      soul: new Soul(),
      tools: new ToolRegistry(),
      skills: new SkillManager(),
      preset: 'realtime',
    });

    expect(payload.voice.descriptors.stt).toBeNull();
    expect(payload.voice.descriptors.tts).toBeNull();
    expect(payload.voice.realtime?.provider).toBe('openai');
  });
});

describe('live reconfiguration', () => {
  it('reflects a soul change in the next dispatch payload', () => {
    const soul = new Soul();
    const before = soul.getSystemPrompt();

    soul.updateConfig({ emotionalTone: 'serious', conversationStyle: 'terse' });

    const after = soul.getSystemPrompt();
    expect(before).not.toBe(after);
    expect(after).toContain('Use a serious, focused tone');
    expect(after).toContain('Conversation style: terse');
  });

  it('reflects a tool registered after construction, and its removal', () => {
    const tools = new ToolRegistry();

    tools.register({ name: 'search', description: 'Search', handler: async () => null });
    expect(tools.getToolDefinitions().map((tool) => tool.name)).toEqual(['search']);

    tools.unregister('search');
    expect(tools.getToolDefinitions()).toEqual([]);
  });
});
