#!/usr/bin/env node
/**
 * Apply this repository's rulesets, as code.
 *
 * The pipeline assumes protections that live in GitHub rather than in this repo (see
 * docs/ci-cd.md). Clicking them into the UI means they drift silently and nobody can diff them,
 * so they are declared as data in `.github/rulesets/*.json` — the literal API payloads — and
 * this script applies them idempotently: an existing ruleset with the same name is updated in
 * place rather than duplicated.
 *
 * The declarations are JSON rather than object literals in this file for one reason: a rule is
 * a decision about who can change what, and a decision should be reviewable on its own. A diff
 * of `.github/rulesets/main.json` says "the approval count went from 1 to 0" in one line, and
 * CODEOWNERS already puts `/.github/` behind a review.
 *
 *   main   PR + 1 approval + Code Owner review, `ci gate` and `enforce promotion path` required,
 *          up to date before merging, no force pushes, no deletion, merge commits only.
 *   stg    the same, minus the Code Owner review.
 *   dev    PR required and `ci gate` required, but no approval count and squash merges — this is
 *          where work lands, and blocking it on a reviewer stalls a solo repo.
 *   tags   `v*` cannot be deleted, moved or force-updated by anyone, bot included.
 *
 * `github-actions[bot]` bypasses the pull-request rule on the branches: release.yml / cd.yml push the
 * release commit, the tag and the post-release back-merges directly. It does NOT bypass the
 * status checks, and it does NOT bypass the tag rules — nothing in the release flow ever needs
 * to delete or move a tag, and semantic-release's entire notion of "what shipped" is those tags.
 *
 * Usage:
 *   gh auth login                       # needs `repo` / admin on the repository
 *   node scripts/ci/apply-branch-rules.mjs [--dry-run] [--repo owner/name]
 */

import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULESETS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../.github/rulesets');

/** The GitHub Actions app id, as committed in the JSON. Resolved from the API when possible. */
const ACTIONS_APP_ID_FALLBACK = 15368;

/**
 * Read the ruleset declarations off disk, in a stable order.
 *
 * Exported for the unit test, which asserts the committed JSON still says what docs/ci-cd.md
 * claims it does — a ruleset that silently loses its status checks is the kind of thing nobody
 * notices until a red PR merges.
 */
export function loadRulesets(dir = RULESETS_DIR) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => ({ file: name, ruleset: JSON.parse(readFileSync(join(dir, name), 'utf8')) }));
}

/**
 * Point every `Integration` bypass actor at the real app id.
 *
 * The id in the JSON is a fallback, not a fact: app ids are per-instance on GitHub Enterprise,
 * and a literal nobody can verify is a literal that will be wrong somewhere. Pure so the test
 * can check it rewrites the id without touching anything else.
 */
export function withResolvedAppId(ruleset, appId) {
  if (!appId || !ruleset.bypass_actors?.length) return ruleset;
  return {
    ...ruleset,
    bypass_actors: ruleset.bypass_actors.map((actor) =>
      actor.actor_type === 'Integration' ? { ...actor, actor_id: appId } : actor,
    ),
  };
}

/** Strip the Actions bypass, for the 422 fallback below. */
export function withoutAppBypass(ruleset) {
  return {
    ...ruleset,
    bypass_actors: (ruleset.bypass_actors ?? []).filter((a) => a.actor_type !== 'Integration'),
  };
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const repoArg = args[args.indexOf('--repo') + 1];

function detectRepo() {
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  const match = url.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) throw new Error(`Could not read owner/name from origin: ${url}`);
  return match[1];
}

function gh(argv, body) {
  const input = body === undefined ? undefined : JSON.stringify(body);
  const withInput = body === undefined ? argv : [...argv, '--input', '-'];
  const out = execFileSync('gh', withInput, { encoding: 'utf8', input });
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

function actionsAppId() {
  try {
    return gh(['api', 'apps/github-actions', '--jq', '{id: .id}']).id;
  } catch {
    console.log(
      `  ! Could not resolve the github-actions app id; using ${ACTIONS_APP_ID_FALLBACK}.`,
    );
    return ACTIONS_APP_ID_FALLBACK;
  }
}

function main() {
  const REPO = args.includes('--repo') ? repoArg : detectRepo();

  requireAuth();
  const appId = actionsAppId();
  console.log(`Repository: ${REPO}`);
  console.log(
    `github-actions app id: ${appId}${dryRun ? '  (dry run — nothing will change)' : ''}`,
  );
  console.log('');

  const declared = loadRulesets();
  if (declared.length === 0) {
    console.error(`No ruleset declarations found in ${RULESETS_DIR}`);
    process.exit(1);
  }

  const existing = gh(['api', `repos/${REPO}/rulesets`, '--jq', '[.[] | {id, name}]']) ?? [];
  let botBypassBlocked = false;

  for (const { file, ruleset } of declared) {
    const payload = withResolvedAppId(ruleset, appId);
    const match = existing.find((entry) => entry.name === payload.name);
    console.log(`${match ? 'updating' : 'creating'} "${payload.name}"  (${file})`);

    if (dryRun) {
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }

    const write = (body) =>
      match
        ? gh(['api', '-X', 'PUT', `repos/${REPO}/rulesets/${match.id}`], body)
        : gh(['api', '-X', 'POST', `repos/${REPO}/rulesets`], body);

    let result;
    try {
      result = write(payload);
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
      result = write(withoutAppBypass(payload));
    }
    console.log(`  → ruleset ${result.id} (${result.enforcement})`);
  }

  console.log(`\nDone. Verify at: https://github.com/${REPO}/settings/rules`);

  if (botBypassBlocked) {
    console.log('');
    console.log('ACTION REQUIRED — releases will be blocked until you do this:');
    console.log('  The rulesets were created WITHOUT a bypass for github-actions[bot], so');
    console.log(
      '  release.yml / cd.yml cannot push the release commit, the tag or the back-merges.',
    );
    console.log('');
    console.log('  Fix it in one of two ways:');
    console.log(`    1. https://github.com/${REPO}/settings/rules — open each ruleset, add`);
    console.log('       "GitHub Actions" to the bypass list, and set it to "Always".');
    console.log(
      '    2. Or give release.yml / cd.yml a PAT belonging to a repository admin and use it',
    );
    console.log('       in place of GITHUB_TOKEN for the git remote.');
  }
}

// Importable by the test without shelling out to `gh`.
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
