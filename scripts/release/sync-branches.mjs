#!/usr/bin/env node
/**
 * Back-merge `main` into `stg` and `dev` after a stable release.
 *
 * A release commit only ever lands on the branch that produced it, so once `main` publishes
 * 2.2.0 the downstream channels still carry the `-rc` / `-dev` baseline. Left alone they would
 * keep cutting prereleases of a version that already shipped, and the next promote PR would
 * conflict on exactly the two files semantic-release wrote. Merging the other way immediately,
 * with those two conflicts resolved the only way they can be, keeps every channel on the same
 * version baseline and keeps promote PRs merge-clean.
 *
 * Conflict policy — nothing else is auto-resolved, because a real conflict is a real problem:
 *   package.json   keep the branch's own contents, adopt main's released version
 *   CHANGELOG.md   take main's copy wholesale; its stable section already covers every
 *                  prerelease entry it replaces
 *
 * Invoked by the `@semantic-release/exec` successCmd in `.releaserc.cjs`, so it runs after
 * every release and no-ops on the prerelease channels.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SOURCE_BRANCH = 'main';
const TARGET_BRANCHES = ['stg', 'dev'];
const AUTO_RESOLVE = new Set(['package.json', 'CHANGELOG.md']);

function git(args, { allowFailure = false, quiet = false } = {}) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: quiet ? 'pipe' : ['pipe', 'pipe', 'inherit'],
    }).trim();
  } catch (error) {
    if (allowFailure) return null;
    throw error;
  }
}

function branchExists(branch) {
  return Boolean(
    git(['ls-remote', '--exit-code', '--heads', 'origin', branch], {
      allowFailure: true,
      quiet: true,
    }),
  );
}

function conflictedFiles() {
  const output = git(['diff', '--name-only', '--diff-filter=U'], { quiet: true });
  return output
    ? output
        .split('\n')
        .map((file) => file.trim())
        .filter(Boolean)
    : [];
}

/** `:2:` is the branch being merged into (ours), `:3:` is `main` (theirs). */
function resolvePackageJson() {
  const ours = JSON.parse(git(['show', ':2:package.json'], { quiet: true }));
  const theirs = JSON.parse(git(['show', ':3:package.json'], { quiet: true }));
  ours.version = theirs.version;
  writeFileSync('package.json', `${JSON.stringify(ours, null, 2)}\n`);
}

function resolveChangelog() {
  writeFileSync('CHANGELOG.md', `${git(['show', ':3:CHANGELOG.md'], { quiet: true })}\n`);
}

function mergeInto(branch) {
  const message = `chore: sync ${branch} with ${SOURCE_BRANCH} after release [skip actions]`;
  if (
    git(['merge', `origin/${SOURCE_BRANCH}`, '--no-edit', '-m', message], {
      allowFailure: true,
    }) !== null
  ) {
    return;
  }

  const files = conflictedFiles();
  const unresolved = files.filter((file) => !AUTO_RESOLVE.has(file));
  if (unresolved.length > 0) {
    git(['merge', '--abort'], { allowFailure: true });
    console.error(`Cannot auto-resolve merge conflicts in: ${unresolved.join(', ')}`);
    console.error(`Merge ${SOURCE_BRANCH} into ${branch} by hand.`);
    process.exit(1);
  }

  for (const file of files) {
    if (file === 'package.json') resolvePackageJson();
    else resolveChangelog();
    git(['add', file]);
  }
  git(['commit', '-m', message]);
}

function main() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch !== SOURCE_BRANCH) {
    console.log(`On ${branch}, not ${SOURCE_BRANCH} — nothing to sync.`);
    return;
  }

  // Explicit refspec: a CI checkout may have configured origin to track only the branch it built.
  git(['fetch', 'origin', '+refs/heads/*:refs/remotes/origin/*', '--tags']);

  for (const target of TARGET_BRANCHES) {
    if (!branchExists(target)) {
      console.log(`${target}: does not exist on origin — skipping.`);
      continue;
    }

    if (
      git(['merge-base', '--is-ancestor', `origin/${SOURCE_BRANCH}`, `origin/${target}`], {
        allowFailure: true,
        quiet: true,
      }) !== null
    ) {
      console.log(`${target}: already contains ${SOURCE_BRANCH}.`);
      continue;
    }

    console.log(`${target}: merging ${SOURCE_BRANCH}`);
    git(['checkout', '-B', target, `origin/${target}`]);
    mergeInto(target);
    git(['push', 'origin', target]);
  }

  git(['checkout', SOURCE_BRANCH]);
}

main();
