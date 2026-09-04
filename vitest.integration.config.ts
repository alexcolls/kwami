import { defineConfig } from 'vitest/config';

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
