import { defineConfig, devices } from '@playwright/test';

/**
 * E2E layer — the built package, in a real browser, with real WebGL.
 *
 * This is the only layer that can answer "does `dist/` actually work when a consumer imports
 * it?". It serves `tests/e2e/fixtures/` over http, loads the built ESM bundle from `dist/` with
 * an import map, mounts a Kwami on a real canvas and asserts the renderer produced frames.
 *
 * It therefore requires a build. `webServer.command` runs one, so `pnpm test:e2e` works from a
 * clean tree; CI builds once and reuses the artifact. See docs/testing.md.
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  // A `.only` left in a file passes locally and silently skips the rest of the suite in CI.
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          // The GitHub runner has no GPU. SwiftShader gives the headless browser a real
          // WebGL2 context in software, so the renderers run the same code path they do on a
          // user's machine instead of silently falling back to "no context".
          args: [
            '--use-gl=angle',
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--disable-gpu-sandbox',
          ],
        },
      },
    },
  ],
  webServer: {
    command: `node tests/e2e/prepare.mjs && node tests/e2e/server.mjs ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
