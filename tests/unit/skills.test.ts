import { describe, expect, it, vi } from 'vitest';
import { SkillManager } from '../../src/skills';
import type { SkillContext } from '../../src/types';

const noop = async () => ({ success: true });

describe('SkillManager registration', () => {
  it('registers the skills supplied through config', () => {
    const skills = new SkillManager({
      definitions: [{ name: 'greet', description: 'Wave', execute: noop }],
    });

    expect(skills.has('greet')).toBe(true);
    expect(skills.count()).toBe(1);
    expect(skills.getSkillNames()).toEqual(['greet']);
  });

  it('overwrites a name that is registered twice', () => {
    const skills = new SkillManager();

    skills.register({ name: 'greet', description: 'first', execute: noop });
    skills.register({ name: 'greet', description: 'second', execute: noop });

    expect(skills.count()).toBe(1);
    expect(skills.get('greet')?.description).toBe('second');
  });

  it('filters by trigger', () => {
    const skills = new SkillManager({
      definitions: [
        { name: 'wave', description: 'w', trigger: 'action', execute: noop },
        { name: 'listen', description: 'l', trigger: 'voice', execute: noop },
      ],
    });

    expect(skills.getByTrigger('voice').map((s) => s.name)).toEqual(['listen']);
    expect(skills.getByTrigger('event')).toEqual([]);
  });
});

describe('SkillManager.execute', () => {
  it('passes the Kwami reference and params through the skill context', async () => {
    const kwami = { id: 'abc123' };
    const execute = vi.fn(async (context: SkillContext) => ({
      success: true,
      data: context.params,
    }));
    const skills = new SkillManager({ definitions: [{ name: 'echo', description: 'E', execute }] });
    skills.setKwamiRef(kwami);

    const result = await skills.execute('echo', { volume: 3 });

    expect(execute).toHaveBeenCalledWith({ kwami, params: { volume: 3 } });
    expect(result).toEqual({ success: true, data: { volume: 3 } });
  });

  it('rejects for an unknown skill', async () => {
    await expect(new SkillManager().execute('nope')).rejects.toThrow('Skill not found: nope');
  });
});

describe('SkillManager.dispose', () => {
  it('clears the registry and drops the Kwami reference', async () => {
    const seen: SkillContext[] = [];
    const skills = new SkillManager({
      definitions: [
        {
          name: 'peek',
          description: 'P',
          execute: async (context) => {
            seen.push(context);
            return { success: true };
          },
        },
      ],
    });
    skills.setKwamiRef({ id: 'abc' });

    skills.dispose();
    expect(skills.count()).toBe(0);

    skills.register({
      name: 'peek',
      description: 'P',
      execute: async (context) => {
        seen.push(context);
        return { success: true };
      },
    });
    await skills.execute('peek');

    expect(seen.at(-1)?.kwami).toBeNull();
  });
});
