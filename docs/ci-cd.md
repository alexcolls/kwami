# CI/CD

How a change gets from a feature branch to a published package.

- Pipeline: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Releases: [`.github/workflows/release.yml`](../.github/workflows/release.yml) · [`docs/releases.md`](./releases.md)
- Promotion gate: [`.github/workflows/branch-promotion.yml`](../.github/workflows/branch-promotion.yml)
- Test matrix: [`docs/testing.md`](./testing.md)

## Overview

```text
feature/*  ──PR──►  dev  ──PR──►  stg  ──PR──►  main
                     │             │             │
                  ci gates      ci gates      ci gates
                     │             │             │
                 2.2.0-dev.N   2.2.0-rc.N      2.2.0
                  npm @dev      npm @rc      npm @latest
                                                 │
                                    back-merge into stg and dev
```

Three channels, one release line. `dev` is where work lands, `stg` is the release candidate,
`main` is what `npm install kwami` gives you. Every channel releases automatically on a green
push; nothing is versioned by hand.

## Branch model

| Branch               | Role              | Accepts                          | Publishes                 |
| -------------------- | ----------------- | -------------------------------- | ------------------------- |
| `feature/*`, `fix/*` | your work         | —                                | nothing                   |
| `dev`                | integration       | any branch, forks included       | `x.y.z-dev.N` → npm `dev` |
| `stg`                | release candidate | this repo's current tip of `dev` | `x.y.z-rc.N` → npm `rc`   |
| `main`               | production        | this repo's current tip of `stg` | `x.y.z` → npm `latest`    |

The direction is enforced, not merely documented. [`branch-promotion.yml`](../.github/workflows/branch-promotion.yml)
runs [`scripts/ci/assert-promotion-path.mjs`](../scripts/ci/assert-promotion-path.mjs) on every
PR into a channel and fails — with a comment explaining why — when:

- a PR into `stg` does not come from `dev`, or into `main` does not come from `stg`;
- the PR head is not the **current tip** of that branch (`dev` moved on while the PR sat open);
- the head is a **fork**, even one whose branch is also called `dev`. A fully synced fork shares
  the tip SHA, so name and SHA matching alone would let an outside repository promote itself
  into production;
- someone tries to open a back-merge PR from `stg` or `main` into `dev`. Those are pushed by
  [`sync-branches.mjs`](../scripts/release/sync-branches.mjs), not merged by hand.

The rules are pure functions with their own unit tests
([`assert-promotion-path.test.mjs`](../scripts/ci/assert-promotion-path.test.mjs)), so a change
to the gate is itself gated.

Locally, [`.husky/pre-push`](../.husky/pre-push) refuses a direct push to `dev`, `stg` or `main`.

## Pipeline

Every job runs on PRs into `dev`, `stg` and `main`, and again on the push that lands them.
There is no cheaper tier for the lower channels: the artifact _is_ the product, so a broken
build is never survivable.

```text
              ┌─ commits (PR only)
checkout ──►  ├─ verify ──┬─ unit ────────┐
              │           ├─ integration ─┤
              │           └─ build ──► e2e┴──► gate
```

### `commits` — commitlint (pull requests only)

Lints every first-parent commit in the PR range against
[`commitlint.config.mjs`](../commitlint.config.mjs). First-parent only: a promote PR absorbs
history from the channel below it, and re-litigating subjects that already shipped would fail
every promotion. semantic-release derives the version, tag and changelog from this history, so a
non-conventional subject is silently unreleasable work.

### `verify` — lint · format · typecheck · audit

- `pnpm lint` — ESLint over `src/`, `tests/` and `scripts/`.
- `pnpm format:check` — Prettier, check mode.
- `pnpm typecheck` — `tsc --noEmit` over `src/`, then again over `tests/` and the config files
  via [`tsconfig.test.json`](../tsconfig.test.json). Tests that do not typecheck are tests that
  do not test what you think.
- `pnpm audit:ci` — [`check-audit.mjs`](../scripts/ci/check-audit.mjs). A **hard gate**,
  ratcheted against [`audit-baseline.json`](../scripts/ci/audit-baseline.json): any critical or
  high advisory not already listed fails the build. `continue-on-error: true` on an audit step
  is not a gate, it is a log line. The baseline only ever shrinks.

### `unit` — vitest + node:test

`pnpm test:coverage` runs the unit suite with the coverage ratchet in
[`vitest.config.ts`](../vitest.config.ts), and `pnpm test:ci-scripts` runs the CI scripts' own
`node --test` suite. Coverage is uploaded as an artifact.

### `integration` — vitest

`pnpm test:integration` boots a real `node:http` server that speaks the Kwami backend contract
and drives `src/utils/api-client.ts` against it over a real socket. No mocked `fetch`.

### `build` — dist

`pnpm build` produces `dist/`, then the job asserts `dist/index.js` and `dist/index.d.ts` exist
and are non-empty — a build that emits no entry point or no types is a broken publish, and
neither Vite nor `tsc` necessarily says so loudly. `dist/` is uploaded as an artifact.

### `e2e` — playwright

Downloads the `dist` artifact (the same bytes that would be published, not a second build of
it), bundles a consumer app around it, and drives it in headless Chromium with a real WebGL2
context on SwiftShader. This is the only layer that catches a broken `exports` map, a shader
that fails to compile, or a renderer that mounts but never draws. Traces, video and the HTML
report are uploaded on failure.

### `gate` — one required check

Aggregates every job into a single status. `skipped` counts as passing (the `commits` job is
skipped on push); `failure` and `cancelled` never do. Protect the branches with **`ci gate`**
alone rather than six checks that have to be re-added by name whenever a job is renamed.

## Repository settings

These live in GitHub, not in this repo, and the pipeline assumes them. They are declared as code
in [`apply-branch-rules.mjs`](../scripts/ci/apply-branch-rules.mjs) so they can be diffed and
re-applied rather than clicked in and forgotten:

```bash
gh auth login                          # needs admin on the repository
pnpm rules:apply --dry-run             # print the rulesets, change nothing
pnpm rules:apply                       # create or update them, idempotently
```

The rulesets it applies:

**Rulesets / branch protection on `main` and `stg`:**

- Require a pull request before merging, 1 approval, dismiss stale approvals.
- Require review from Code Owners ([`CODEOWNERS`](../.github/CODEOWNERS)).
- Required status checks: **`ci gate`** and **`enforce promotion path`**.
- Require branches to be up to date before merging.
- Block force pushes and deletions.
- Allow the `github-actions[bot]` actor to bypass the pull-request requirement — `release.yml`
  pushes the release commit and the back-merges directly.

**On `dev`:** the same, minus the Code Owner review, and with `enforce promotion path` optional
(the gate lets any feature branch in; it is only strict about `stg` and `main`).

**Merge strategy:** squash merge for `feature/* → dev` — the PR title becomes the commit subject
that semantic-release reads. Use a **merge commit** for `dev → stg` and `stg → main` so the
individual subjects survive into the higher channel's changelog.

**Secrets:**

| Secret         | Where             | Purpose                                                |
| -------------- | ----------------- | ------------------------------------------------------ |
| `GITHUB_TOKEN` | automatic         | tags, release commits, GitHub Releases, PR comments    |
| `NPM_TOKEN`    | repository secret | publishing to npm. Absent → everything else still runs |

## Loop safety

The release commit is pushed with `GITHUB_TOKEN`, and GitHub deliberately does not trigger
workflows for pushes made with it — the version bump cannot re-run CI or release itself. The
`[skip actions]` marker in the message is the belt to that braces, for anything watching the
repo from outside Actions.

`release.yml` also refuses to release a tip that has drifted ahead of the commit `ci` actually
tested: a push that landed mid-run has its own run behind it, and that one releases instead.

## Local gates

Not a substitute for CI, but they catch the obvious before it costs a round trip:

| Hook                                        | Runs                                                       |
| ------------------------------------------- | ---------------------------------------------------------- |
| [`.husky/commit-msg`](../.husky/commit-msg) | `commitlint` on the message                                |
| [`.husky/pre-commit`](../.husky/pre-commit) | `lint-staged` — ESLint + Prettier on staged files          |
| [`.husky/pre-push`](../.husky/pre-push)     | blocks direct pushes to channels; `typecheck` + unit suite |
