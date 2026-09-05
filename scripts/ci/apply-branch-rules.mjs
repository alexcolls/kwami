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
      // Repository admins, so the owner is never locked out of their own branches by a
      // ruleset this script created.
      { actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' },
      // `always`, not `pull_request`: the release push is not a PR. Dropped automatically
      // when the organization has not installed GitHub Actions as a bypass actor — see the
      // 422 fallback below.
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

let botBypassBlocked = false;

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

    const write = (body) =>
      match
        ? gh(['api', '-X', 'PUT', `repos/${REPO}/rulesets/${match.id}`], body)
        : gh(['api', '-X', 'POST', `repos/${REPO}/rulesets`], body);

    let result;
    try {
      result = write(rules);
    } catch (error) {
      // A repository-level ruleset can only name the GitHub Actions app as a bypass actor
      // when the owning organization has installed it as one. Without that, GitHub answers
      // 422 "Actor GitHub Actions integration must be part of the ruleset source or owner
      // organization". Apply the protection anyway — it is the valuable part — and say
      // plainly what the operator has to do so releases can still push.
      const message = String(error.stdout ?? error.stderr ?? error.message ?? '');
      if (!message.includes('must be part of the ruleset source')) throw error;

      console.log('  ! GitHub Actions cannot be added as a bypass actor from the API here.');
      botBypassBlocked = true;
      result = write({
        ...rules,
        bypass_actors: rules.bypass_actors.filter((a) => a.actor_type !== 'Integration'),
      });
    }
    console.log(`  → ruleset ${result.id} (${result.enforcement})`);
  }

  console.log('\nDone. Verify at: https://github.com/' + REPO + '/settings/rules');

  if (botBypassBlocked) {
    console.log('');
    console.log('ACTION REQUIRED — releases will be blocked until you do this:');
    console.log('  The rulesets were created WITHOUT a bypass for github-actions[bot], so');
    console.log('  release.yml cannot push the release commit, the tag or the back-merges.');
    console.log('');
    console.log('  Fix it in one of two ways:');
    console.log(`    1. https://github.com/${REPO}/settings/rules — open each ruleset, add`);
    console.log('       "GitHub Actions" to the bypass list, and set it to "Always".');
    console.log('    2. Or give release.yml a PAT belonging to a repository admin and use it');
    console.log('       in place of GITHUB_TOKEN for the git remote.');
  }
}

main();
