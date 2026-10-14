import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string;
};

/**
 * Unit layer — pure logic, no network, no WebGL, no timers you have to wait on.
 *
 * Everything here runs against `src/` directly (Vite resolves the TypeScript), so a unit test
 * never depends on a build. Anything that needs a real HTTP server belongs in
 * `vitest.integration.config.ts`; anything that needs a real browser belongs in
 * `playwright.config.ts`. See docs/testing.md.
 */
export default defineConfig({
  // `Kwami.getVersion()` reads a constant Vite substitutes at build time. Tests run against
  // `src/` with no build, so the same substitution has to happen here or the getter is a
  // ReferenceError.
  define: {
    __KWAMI_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    name: 'unit',
    // The library targets browsers: `happy-dom` gives the DOM globals the avatar and audio
    // modules reach for, without the cost of a real browser.
    environment: 'happy-dom',
    include: ['tests/unit/**/*.test.ts'],
    globals: false,
    testTimeout: 10_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',
        // WebGL renderers, shader materials and the LiveKit transport are covered by the
        // e2e layer in a real browser — v8 counts their module bodies as uncovered here and
        // would drag the ratio down for something unit tests structurally cannot reach.
        'src/avatar/renderers/**',
        'src/avatar/scene/**',
        'src/avatar/audio/**',
        'src/agent/adapters/**',
        // Driven end to end by the integration layer against a real HTTP server
        // (tests/integration/api-client.test.ts). Vitest cannot merge coverage across two
        // configs, so counting it here would report 0% for code that is in fact exercised.
        'src/utils/api-client.ts',
      ],
      reporter: ['text', 'lcov'],
      // Write the report even when a test fails — that is exactly when you want the numbers.
      reportOnFailure: true,
      /**
       * A RATCHET, not a target. Raise it after a clean `pnpm test:coverage`: take the reported
       * totals, round DOWN a couple of points, and commit that. Never lower it to make a red
       * build pass — that turns a ratchet back into a suggestion.
       */
      /**
       * Measured 2026-10-14 after the jarvis orchestration suite landed: 57.11 / 53.51 /
       * 55.20 / 57.76. The floor sits a couple of points under each — v8 drifts slightly run
       * to run, and newly added SOURCE dilutes the ratio until its tests land, so a floor set
       * flush against the last reading turns red for reasons that are not a regression.
       *
       * (Earlier readings: 33.74 / 29.78 / 38.95 / 33.29 at a 31/27/36/31 floor on 2026-09-04,
       * then 38.92 / 37.02 / 42.35 / 38.38 at 36/34/40/36, then 46.35 / 42.58 / 48.04 / 46.36
       * at 44/40/46/44. The September jumps came from tests/helpers/fake-livekit.ts. This one
       * comes from tests/unit/avatar-jarvis.test.ts, which drives Avatar through mocked
       * renderers and took Avatar.ts from 0% to about half.)
       *
       * The big remaining gap is Kwami.ts. It constructs an Avatar, which needs a WebGL
       * context, so it belongs to the browser layer, not this one.
       */
      thresholds: {
        statements: 55,
        branches: 51,
        functions: 53,
        lines: 55,
      },
    },
  },
});
