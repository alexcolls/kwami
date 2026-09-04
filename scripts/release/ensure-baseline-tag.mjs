#!/usr/bin/env node
/**
 * Give semantic-release a starting point on a repository that has never been released by it.
 *
 * Without a `v*` tag, semantic-release treats the branch as a first release and jumps straight
 * to 1.0.0 — which for Kwami would be a *downgrade* from the 2.1.0 already on npm, and would
 * drag the whole pre-Conventional-Commits history into the first changelog. This tags the point
 * where the current branch left `main` with the version already in package.json, so the first
 * real release is a normal bump over it and CHANGELOG.md starts at the work that introduced the
 * release pipeline.
 *
 * Idempotent: if any `v*` tag exists, this does nothing. Run from the repo root.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

/** The commit this branch shares with `main`, so the tag is reachable from every channel. */
function baselineCommit() {
  return (
    git(['merge-base', 'HEAD', 'origin/main'], { allowFailure: true }) ?? git(['rev-parse', 'HEAD'])
  );
}

const existing = git(['tag', '--list', 'v*']);
if (existing) {
  console.log(`Already released: ${existing.split('\n').length} tag(s) — no baseline needed.`);
  process.exit(0);
}

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const tag = `v${version}`;
const commit = baselineCommit();

console.log(`Tagging ${tag} at ${commit.slice(0, 8)} as the release baseline`);
git(['tag', tag, commit]);
git(['push', 'origin', tag]);
