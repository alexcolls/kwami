import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Kwami } from '../../src/Kwami';

// Not `import.meta.url`: happy-dom replaces it with an http: URL, which `readFileSync` rejects.
const pkg = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf-8')) as {
  version: string;
};

/**
 * `Kwami.getVersion()` used to return a hand-written `'2.0.0'` string. It was already two
 * releases stale when this test was written, and semantic-release would have widened the gap
 * on every merge to a channel. It now reads a constant substituted from `package.json` at
 * build time; this test is what keeps the wiring honest.
 */
describe('Kwami.getVersion', () => {
  it('reports the version in package.json', () => {
    expect(Kwami.getVersion()).toBe(pkg.version);
  });

  it('is a plain semver string, not a placeholder', () => {
    expect(Kwami.getVersion()).toMatch(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/);
  });
});
