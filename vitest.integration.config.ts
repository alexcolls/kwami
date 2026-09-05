import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

/**
 * Integration layer — modules wired to each other and to a real HTTP server.
 *
 * These tests boot an actual `node:http` server that speaks the Kwami backend contract and
 * drive `src/utils/api-client.ts` against it over a real socket, and they exercise the
 * composition seams between Soul, ToolRegistry, SkillManager and the voice descriptor
 * builders. No mocked `fetch`: if the client and the contract disagree, this layer is what
 * notices. See docs/testing.md.
 */
export default defineConfig({
  // `Kwami.getVersion()` reads a constant Vite substitutes at build time. Tests run against
  // `src/` with no build, so the same substitution has to happen here or the getter is a
  // ReferenceError.
  define: {
    __KWAMI_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    name: 'integration',
    // A real server over a real socket — no DOM shim needed, and `node` keeps `fetch`
    // undici-native rather than routed through happy-dom.
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    globals: false,
    // Each file owns its own server on an ephemeral port, so files may still run in parallel.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
