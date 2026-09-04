#!/usr/bin/env node
/**
 * Prepare the e2e fixture: build the library, then bundle a consumer app around it.
 *
 * The point of this layer is to exercise what a consumer actually gets — `dist/`, resolved
 * through a bundler, running in a real browser with a real WebGL context. So:
 *
 *   1. `vite build` produces `dist/` if it is missing or older than `src/`.
 *   2. Vite bundles `tests/e2e/fixtures/app.js` (which imports `dist/index.js` and the peer
 *      dependencies) into `tests/e2e/fixtures/.generated/app.js`, exactly the way a downstream
 *      application bundles the package.
 *
 * Run by playwright.config.ts's `webServer` before the static server starts.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const distEntry = join(root, 'dist/index.js');

/** Newest mtime under a directory — cheap staleness check, no hashing. */
function newestMtime(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const mtime = entry.isDirectory() ? newestMtime(path) : statSync(path).mtimeMs;
    if (mtime > newest) newest = mtime;
  }
  return newest;
}

function libraryIsStale() {
  if (!existsSync(distEntry)) return true;
  return newestMtime(join(root, 'src')) > statSync(distEntry).mtimeMs;
}

if (libraryIsStale()) {
  console.log('e2e: building the library …');
  // The declaration emit is irrelevant to a browser, so run the bundle step only.
  execFileSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: root,
    stdio: 'inherit',
  });
} else {
  console.log('e2e: dist/ is up to date');
}

console.log('e2e: bundling the fixture app …');
await build({
  root,
  configFile: false,
  logLevel: 'warn',
  build: {
    outDir: 'tests/e2e/fixtures/.generated',
    emptyOutDir: true,
    // A browser target, not a library build: this is the consumer side of the boundary.
    lib: {
      entry: join(root, 'tests/e2e/fixtures/app.js'),
      formats: ['es'],
      fileName: () => 'app.js',
    },
    // Everything bundled, peer dependencies included — same as a real application build.
    rollupOptions: { external: [] },
    sourcemap: false,
    minify: false,
  },
});
console.log('e2e: fixture ready');
