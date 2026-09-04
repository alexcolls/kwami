import { describe, expect, it, vi } from 'vitest';
import { ToolRegistry } from '../../src/tools';

describe('ToolRegistry registration', () => {
  it('registers the tools supplied through config', () => {
    const registry = new ToolRegistry({
      custom: [{ name: 'weather', description: 'Look up the weather' }],
    });

    expect(registry.get('weather')?.description).toBe('Look up the weather');
    expect(registry.getAll()).toHaveLength(1);
  });

  it('overwrites a name that is registered twice', () => {
    const registry = new ToolRegistry();

    registry.register({ name: 'search', description: 'first' });
    registry.register({ name: 'search', description: 'second' });

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('search')?.description).toBe('second');
  });

  it('unregisters a tool', () => {
    const registry = new ToolRegistry({ custom: [{ name: 'search', description: 'x' }] });

    registry.unregister('search');

    expect(registry.get('search')).toBeUndefined();
  });
});

describe('ToolRegistry.getToolDefinitions', () => {
  it('gives a parameterless tool an empty JSON-Schema object rather than undefined', () => {
    const registry = new ToolRegistry({ custom: [{ name: 'ping', description: 'Ping' }] });

    expect(registry.getToolDefinitions()[0].parameters).toEqual({
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });

  it('wraps a bare property bag into an object schema', () => {
    const registry = new ToolRegistry({
      custom: [{ name: 'echo', description: 'Echo', parameters: { text: { type: 'string' } } }],
    });

    expect(registry.getToolDefinitions()[0].parameters).toEqual({
      type: 'object',
      properties: { text: { type: 'string' } },
      required: [],
      additionalProperties: false,
    });
  });

  it('passes an already-valid object schema through untouched', () => {
    const schema = {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    };
    const registry = new ToolRegistry({
      custom: [{ name: 'weather', description: 'Weather', parameters: schema }],
    });

    expect(registry.getToolDefinitions()[0].parameters).toEqual(schema);
  });

  it('strips the handler — definitions are what goes over the wire to the model', () => {
    const registry = new ToolRegistry({
      custom: [{ name: 'echo', description: 'Echo', handler: async () => 'hi' }],
    });

    expect(registry.getToolDefinitions()[0]).not.toHaveProperty('handler');
  });
});

describe('ToolRegistry.execute', () => {
  it('calls the handler with the params', async () => {
    const handler = vi.fn(async (params: Record<string, unknown>) => `hi ${params.name}`);
    const registry = new ToolRegistry({ custom: [{ name: 'greet', description: 'G', handler }] });

    await expect(registry.execute('greet', { name: 'Ada' })).resolves.toBe('hi Ada');
    expect(handler).toHaveBeenCalledWith({ name: 'Ada' });
  });

  it('rejects for an unknown tool', async () => {
    await expect(new ToolRegistry().execute('nope', {})).rejects.toThrow('Tool not found: nope');
  });

  it('rejects for a tool that was registered without a handler', async () => {
    const registry = new ToolRegistry({ custom: [{ name: 'stub', description: 'S' }] });

    await expect(registry.execute('stub', {})).rejects.toThrow('Tool stub has no handler');
  });

  it('propagates a handler failure instead of swallowing it', async () => {
    const registry = new ToolRegistry({
      custom: [
        {
          name: 'boom',
          description: 'B',
          handler: async () => {
            throw new Error('upstream 500');
          },
        },
      ],
    });

    await expect(registry.execute('boom', {})).rejects.toThrow('upstream 500');
  });
});

describe('ToolRegistry.dispose', () => {
  it('drops every tool', async () => {
    const registry = new ToolRegistry({ custom: [{ name: 'a', description: 'a' }] });

    await registry.dispose();

    expect(registry.getAll()).toEqual([]);
  });
});
