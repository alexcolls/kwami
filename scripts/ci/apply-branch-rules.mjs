#!/usr/bin/env node
/**
 * Apply this repository's branch rulesets, as code.
 *
 * The pipeline assumes protections that live in GitHub rather than in this repo (see
 * docs/ci-cd.md). Clicking them into the UI means they drift silently and nobody can diff them,
 * so they are declared here instead and applied idempotently: an existing ruleset with the same
 * name is updated in place rather than duplicated.
 *
 *   main   PR + 1 approval + Code Owner review, `ci gate` and `enforce promotion path` required,
 *          up to date before merging, no force pushes, no deletion, merge commits only.
 *   stg    the same, minus the Code Owner review.
 *   dev    PR required and `ci gate` required, but no approval count and squash merges — this is
 *          where work lands, and blocking it on a reviewer stalls a solo repo.
 *
 * `github-actions[bot]` bypasses the pull-request rule everywhere: release.yml pushes the
 * release commit, the tag and the post-release back-merges directly. It does NOT bypass the
 * status checks.
 *
 * Usage:
 *   gh auth login                       # needs `repo` / admin on the repository
 *   node scripts/ci/apply-branch-rules.mjs [--dry-run] [--repo owner/name]
 */

import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const repoArg = args[args.indexOf('--repo') + 1];
const REPO = args.includes('--repo') ? repoArg : detectRepo();

function detectRepo() {
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) throw new Error(`Could not read owner/name from origin: ${url}`);
  return match[1];
}

function gh(args, body) {
  const input = body === undefined ? undefined : JSON.stringify(body);
  const argv = body === undefined ? args : [...args, '--input', '-'];
  const out = execFileSync('gh', argv, { encoding: 'utf8', input });
  return out.trim() ? JSON.parse(out) : null;
}

/**
 * Fail with an instruction rather than a stack trace. An expired `gh` token is by far the most
 * likely reason this script does not run, and the raw execFileSync error buries that in ten
 * lines of Node internals.
 */
function requireAuth() {
  try {
    // `gh auth status` exits 0 even when the stored token has been revoked or expired, so probe
    // an authenticated endpoint instead of trusting it.
    execFileSync('gh', ['api', 'user'], { stdio: 'pipe' });
  } catch {
    console.error('Not authenticated with GitHub.');
    console.error('');
    console.error('  gh auth login -h github.com');
    console.error('');
    console.error('The account needs admin on the repository to write rulesets.');
    process.exit(1);
  }
}

/** The GitHub Actions app, so the release bot can push past the pull-request rule. */
function actionsAppId() {
  return gh(['api', 'apps/github-actions', '--jq', '{id: .id}']).id;
}

function ruleset({ branch, approvals, codeOwners, checks, mergeMethods, botAppId }) {
  return {
    name: `${branch} protection`,
    target: 'branch',
    enforcement: 'active',
    bypass_actors: [
      // `always`, not `pull_request`: the release push is not a PR.
      { actor_id: botAppId, actor_type: 'Integration', bypass_mode: 'always' },
    ],
    conditions: { ref_name: { include: [`refs/heads/${branch}`], exclude: [] } },
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: approvals,
          dismiss_stale_reviews_on_push: true,
          require_code_owner_review: codeOwners,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
          allowed_merge_methods: mergeMethods,
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          // "Require branches to be up to date before merging" — a promote PR must be rebased
          // onto the tip it is promoting, which is what assert-promotion-path.mjs demands too.
          strict_required_status_checks_policy: true,
          required_status_checks: checks.map((context) => ({ context })),
        },
      },
    ],
  };
}

function main() {
  requireAuth();
  const botAppId = actionsAppId();
  console.log(`Repository: ${REPO}`);
  console.log(
    `github-actions app id: ${botAppId}${dryRun ? '  (dry run — nothing will change)' : ''}\n`,
  );

  const desired = [
    ruleset({
      branch: 'main',
      approvals: 1,
      codeOwners: true,
      checks: ['ci gate', 'enforce promotion path'],
      // Merge commit, not squash: a stg → main promotion must carry the individual subjects
      // into main's history, or semantic-release loses them from the stable changelog.
      mergeMethods: ['merge'],
      botAppId,
    }),
    ruleset({
      branch: 'stg',
      approvals: 1,
      codeOwners: false,
      checks: ['ci gate', 'enforce promotion path'],
      mergeMethods: ['merge'],
      botAppId,
    }),
    ruleset({
      branch: 'dev',
      approvals: 0,
      codeOwners: false,
      // `enforce promotion path` runs on dev too, but it lets any feature branch through, so
      // requiring it here only adds a wait.
      checks: ['ci gate'],
      // Squash: the PR title becomes the released commit subject.
      mergeMethods: ['squash'],
      botAppId,
    }),
  ];

  const existing = gh(['api', `repos/${REPO}/rulesets`, '--jq', '[.[] | {id, name}]']) ?? [];

  for (const rules of desired) {
    const match = existing.find((entry) => entry.name === rules.name);
    const verb = match ? 'updating' : 'creating';
    console.log(`${verb} "${rules.name}"`);

    if (dryRun) {
      console.log(JSON.stringify(rules, null, 2));
      continue;
    }

    const result = match
      ? gh(['api', '-X', 'PUT', `repos/${REPO}/rulesets/${match.id}`], rules)
      : gh(['api', '-X', 'POST', `repos/${REPO}/rulesets`], rules);
    console.log(`  → ruleset ${result.id} (${result.enforcement})`);
  }

  console.log('\nDone. Verify at: https://github.com/' + REPO + '/settings/rules');
}

main();
