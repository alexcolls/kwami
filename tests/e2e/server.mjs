#!/usr/bin/env node
/**
 * Static file server for the e2e fixtures.
 *
 * Serves `tests/e2e/fixtures/` at `/` and the built package at `/dist/`, so the fixture page
 * can `import { Kwami } from '/dist/index.js'` exactly the way a consumer's bundler resolves
 * the package's `exports` entry. The peer dependencies (`three`, `livekit-client`,
 * `simplex-noise`) are external in the library build, so they are served straight out of
 * `node_modules` and wired up by an import map in the fixture page.
 *
 * Started by playwright.config.ts; run it by hand with `node tests/e2e/server.mjs 4173` to poke
 * at the fixture in your own browser.
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const fixtures = join(root, 'tests/e2e/fixtures');
const port = Number(process.argv[2] ?? 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
};

/** Resolve a request path to a file, refusing anything that escapes the repo root. */
function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');

  // `/dist/…` and `/node_modules/…` come out of the repo; everything else is a fixture.
  const candidate =
    clean.startsWith('/dist/') || clean.startsWith('/node_modules/')
      ? join(root, clean)
      : join(fixtures, clean === '/' ? 'index.html' : clean);

  const file = resolve(candidate);
  if (!file.startsWith(root)) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
  const file = resolveFile(url.pathname);

  if (!file) {
    res.statusCode = 404;
    res.end(`Not found: ${url.pathname}`);
    return;
  }

  res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
  // The bundle is rebuilt between runs; never let the browser reuse a stale copy.
  res.setHeader('cache-control', 'no-store');
  createReadStream(file).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`e2e fixtures on http://127.0.0.1:${port}`);
});
