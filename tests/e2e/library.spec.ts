import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end: the BUILT package, bundled the way a consumer bundles it, running in a real
 * browser with a real WebGL2 context.
 *
 * This is the only layer that catches a broken `exports` map, a shader that fails to compile,
 * a `?raw` import Vite inlined wrongly, or a renderer that mounts but never draws — all things
 * that pass typecheck and pass in happy-dom.
 */

/** Wait for the fixture module to finish evaluating. A failed import shows up here. */
async function boot(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/index.html');
  await page.waitForFunction(
    () => (window as never as { kwamiE2EReady?: boolean }).kwamiE2EReady === true,
  );

  expect(errors, 'the fixture module threw while loading dist/').toEqual([]);
  return errors;
}

test.describe('published bundle', () => {
  test('loads in a browser with a real WebGL2 context', async ({ page }) => {
    await boot(page);

    expect(await page.evaluate(() => window.kwamiE2E.webglAvailable())).toBe(true);
  });

  test('keeps its named exports through the build', async ({ page }) => {
    await boot(page);

    const exported = await page.evaluate(() => ({
      presets: window.kwamiE2E.exports.soulPresetCount(),
      zen: window.kwamiE2E.exports.presetName('zen'),
      missing: window.kwamiE2E.exports.presetName('does-not-exist'),
      schema: window.kwamiE2E.exports.toolSchemaFor('ping'),
    }));

    expect(exported.presets).toBeGreaterThan(0);
    expect(exported.zen).toBe('Zen');
    expect(exported.missing).toBeNull();
    expect(exported.schema).toEqual({
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    });
  });

  test('loads a soul template and shapes the prompt', async ({ page }) => {
    await boot(page);

    const prompt = await page.evaluate(() => window.kwamiE2E.exports.promptFor('scientist'));

    expect(prompt).toContain('You are Quill');
    expect(prompt).toContain('Voice emotion profile');
  });

  test('randomizes a blob state with values the shaders can parse', async ({ page }) => {
    await boot(page);

    const state = await page.evaluate(() => window.kwamiE2E.exports.randomizesBlobState());

    expect(state.skin.colors.x).toMatch(/^#[0-9a-f]{6}$/);
    expect(state.skin.resolution).toBeGreaterThanOrEqual(64);
    // Full randomize deliberately leaves the blob the same size.
    expect(state.shape.scale).toBe(3);
  });
});

test.describe('Kwami on a canvas', () => {
  test('mounts the blob renderer and actually draws frames', async ({ page }) => {
    await boot(page);

    const created = await page.evaluate(() =>
      window.kwamiE2E.create({
        avatar: { renderer: 'blob-xyz' },
        soul: { name: 'Luna', personality: 'calm and precise' },
      }),
    );

    expect(created.id).toMatch(/^[a-z0-9]{8}$/);
    expect(created.name).toBe('Luna');
    expect(created.state).toBe('idle');

    // The render loop runs on requestAnimationFrame; poll until the drawing buffer has
    // non-background pixels rather than sleeping for an arbitrary interval.
    await expect
      .poll(() => page.evaluate(() => window.kwamiE2E.litPixels()), { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test('registers itself, exposes its config, and unregisters on dispose', async ({ page }) => {
    await boot(page);

    await page.evaluate(() =>
      window.kwamiE2E.create({
        avatar: { renderer: 'blob-xyz' },
        soul: { name: 'Atlas' },
        tools: { custom: [{ name: 'clock', description: 'Read the clock' }] },
        skills: { definitions: [] },
      }),
    );

    const snapshot = await page.evaluate(() => window.kwamiE2E.snapshot());
    expect(snapshot.name).toBe('Atlas');
    expect(snapshot.connected).toBe(false);
    expect(snapshot.tools.map((tool) => tool.name)).toEqual(['clock']);
    expect(snapshot.instanceCount).toBe(1);

    const disposed = await page.evaluate(() => window.kwamiE2E.dispose());
    expect(disposed.stillRegistered).toBe(false);
    expect(disposed.instanceCount).toBe(0);
  });

  test('drives avatar state transitions without tearing down the context', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.kwamiE2E.create({ avatar: { renderer: 'blob-xyz' } }));

    for (const state of ['listening', 'thinking', 'speaking', 'idle'] as const) {
      expect(await page.evaluate((s) => window.kwamiE2E.setState(s), state)).toBe(state);
    }

    await expect
      .poll(() => page.evaluate(() => window.kwamiE2E.litPixels()), { timeout: 20_000 })
      .toBeGreaterThan(0);
  });

  test('reconfigures the soul and the tool registry live', async ({ page }) => {
    await boot(page);
    await page.evaluate(() => window.kwamiE2E.create({ soul: { name: 'Luna' } }));

    const prompt = await page.evaluate(() =>
      window.kwamiE2E.updateSoul({ emotionalTone: 'serious', conversationStyle: 'terse' }),
    );
    expect(prompt).toContain('Use a serious, focused tone');
    expect(prompt).toContain('Conversation style: terse');

    const names = await page.evaluate(() => window.kwamiE2E.registerTool('search', 'Search'));
    expect(names).toContain('search');

    const result = await page.evaluate(() => window.kwamiE2E.executeTool('search', { q: 'kwami' }));
    expect(result).toEqual({ echoed: { q: 'kwami' } });
  });

  test('renders the black-hole renderer too', async ({ page }) => {
    await boot(page);

    await page.evaluate(() => window.kwamiE2E.create({ avatar: { renderer: 'black-hole' } }));

    await expect
      .poll(() => page.evaluate(() => window.kwamiE2E.litPixels()), { timeout: 20_000 })
      .toBeGreaterThan(0);
  });
});
