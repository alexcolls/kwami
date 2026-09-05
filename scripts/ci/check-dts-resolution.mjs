#!/usr/bin/env node
/**
 * Guard: the emitted declarations must be resolvable by a consumer on
 * `moduleResolution: "node16"` / `"nodenext"`.
 *
 * This library builds with `moduleResolution: "bundler"`, which permits extensionless
 * relative specifiers — and `tsc` copies them verbatim into the `.d.ts` files. A consumer on
 * node16 then gets TS2834/TS2835 on *every* relative import in `dist/index.d.ts` and cannot
 * type the package at all. That shipped undetected in 2.1.1: the library's own typecheck is
 * green because it never resolves its output the way a consumer does.
 *
 * The same check covers asset specifiers (`./vertex.glsl?raw`), which leak into declarations
 * whenever a module re-exports a raw import without annotating its type, and which a consumer
 * cannot resolve either.
 *
 * Grepping the artifact catches both in a fraction of a second, without adding a second
 * tsconfig or a scratch install to the build.
 *
 * Usage: node scripts/ci/check-dts-resolution.mjs [dist-dir]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The only relative specifiers a consumer's TypeScript can follow out of a shipped `.d.ts`.
 *
 * Asset specifiers are deliberately NOT on this list. A declaration that says
 * `import s from './vertex.glsl?raw'` needs an ambient `*.glsl?raw` module in the *consumer's*
 * project; the build-time one in `src/types/modules.d.ts` is not published and would not apply
 * if it were. Annotate the re-export as `string` instead — the import then leaves the emitted
 * declaration entirely.
 */
const RESOLVABLE = /\.(js|mjs|cjs|json)$/;

/** `from './x'`, `import('./x')`, and the `import('./x').T` form tsc inlines into types. */
const SPECIFIER = /(?:from\s*|import\s*\(\s*)'(\.\.?\/[^']*)'/g;

/**
 * @param {string} source contents of one `.d.ts`
 * @returns {string[]} relative specifiers a node16 consumer cannot resolve
 */
export function findUnresolvableSpecifiers(source) {
  const bad = [];
  for (const [, spec] of source.matchAll(SPECIFIER)) {
    if (!RESOLVABLE.test(spec)) bad.push(spec);
  }
  return bad;
}

/** @param {string} dir @returns {string[]} */
function declarationFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...declarationFiles(path));
    else if (entry.name.endsWith('.d.ts')) out.push(path);
  }
  return out;
}

function main() {
  const dist = process.argv[2] ?? 'dist';
  try {
    if (!statSync(dist).isDirectory()) throw new Error('not a directory');
  } catch {
    console.error(`error: ${dist} is not a directory — run \`pnpm build\` first.`);
    process.exit(1);
  }

  const files = declarationFiles(dist);
  if (files.length === 0) {
    console.error(`error: no .d.ts files under ${dist} — the declaration build did not run.`);
    process.exit(1);
  }

  let failures = 0;
  for (const file of files) {
    const bad = findUnresolvableSpecifiers(readFileSync(file, 'utf8'));
    if (bad.length === 0) continue;
    failures += bad.length;
    const unique = [...new Set(bad)];
    console.error(`${file}: ${bad.length} unresolvable relative import(s)`);
    for (const spec of unique.slice(0, 5)) {
      console.error(
        /\.\w+(\?|$)/.test(spec)
          ? `  '${spec}' — an asset specifier; annotate the re-export as a plain type instead`
          : `  '${spec}' — did you mean '${spec}.js'?`,
      );
    }
    if (unique.length > 5) console.error(`  … and ${unique.length - 5} more`);
  }

  if (failures > 0) {
    console.error(
      `\n${failures} specifier(s) a node16/nodenext consumer cannot resolve.\n` +
        `Fix: give a module import in src/ an explicit '.js' extension (TypeScript maps it back to\n` +
        `the .ts), or annotate an asset re-export so the specifier never reaches the declaration.`,
    );
    process.exit(1);
  }

  console.log(`ok: ${files.length} declaration files resolve under node16.`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
