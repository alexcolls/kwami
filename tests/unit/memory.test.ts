import { describe, expect, it } from 'vitest';
import { Memory } from '../../src/memory';

describe('Memory lifecycle', () => {
  it('starts uninitialised', () => {
    expect(new Memory().isInitialized()).toBe(false);
  });

  it('marks itself initialised for a user and resets on dispose', async () => {
    const memory = new Memory();

    await memory.initialize('user-123');
    expect(memory.isInitialized()).toBe(true);

    memory.dispose();
    expect(memory.isInitialized()).toBe(false);
  });
});

describe('Memory frontend stub', () => {
  // Recall moved to the backend agent loop; these are the contracts Kwami.ts relies on so
  // that connect() and the wire-up in wireUp() never throw on a memory-less configuration.
  it('accepts messages without throwing', async () => {
    await expect(new Memory().addMessage('user', 'hello')).resolves.toBeUndefined();
  });

  it('returns an empty context and no search results', async () => {
    const memory = new Memory();

    await expect(memory.getContext()).resolves.toEqual({});
    await expect(memory.search('anything')).resolves.toEqual([]);
  });

  it('hands back a copy of its config', () => {
    const memory = new Memory({ adapter: 'zep' });

    memory.getConfig().adapter = 'other' as never;

    expect(memory.getConfig().adapter).toBe('zep');
  });
});
