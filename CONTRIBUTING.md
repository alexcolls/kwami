# Contributing to Kwami

Thanks for working on Kwami. This covers the workflow; the [`README`](./README.md) covers the
library itself and [`docs/`](./docs) holds the deep dives.

## Setup

Kwami is a **pnpm** repository. `pnpm-lock.yaml` is the lockfile of record and CI installs with
`--frozen-lockfile`, so an `npm install` here will produce a lockfile CI rejects.

```bash
nvm use                # Node from .nvmrc
corepack enable        # pnpm from package.json "packageManager"
pnpm install           # also installs the husky hooks
```

## Branches

Promotion is one-directional and enforced by
[`branch-promotion.yml`](./.github/workflows/branch-promotion.yml):

```text
feature/* ──► dev ──► stg ──► main
```

Branch off `dev` and open your PR against `dev`. Promoting is `dev → stg`, then `stg → main`,
from this repository's current tip each time — not a fork, not a stale head. `main` is
back-merged into `stg` and `dev` automatically after a stable release, so never open a PR in
that direction. Details: [`docs/ci-cd.md`](./docs/ci-cd.md).

Direct pushes to `dev`, `stg` and `main` are blocked by [`.husky/pre-push`](./.husky/pre-push)
and by branch protection.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) are mandatory. `commitlint` runs in
the `commit-msg` hook and again on every PR, and semantic-release derives every version, tag,
GitHub Release and changelog entry from this history — a non-conventional subject is silently
unreleasable work.

```text
feat(avatar): add eye-iris renderer
fix(agent): dedupe interim STT transcripts
docs(testing): document the e2e WebGL setup
build(deps): bump three to 0.184.0
```

- Scope with the module you touched (`avatar`, `agent`, `soul`, `memory`, `tools`, `skills`,
  `voice`) when it helps the changelog read well.
- `feat` bumps the minor, `fix`/`perf`/`refactor` the patch, a `BREAKING CHANGE:` footer the
  major. `docs`, `test`, `ci`, `chore` and `style` release nothing. Full table:
  [`docs/releases.md`](./docs/releases.md).
- Never hand-edit `CHANGELOG.md` or the `version` field — semantic-release owns both.

Feature PRs are **squash merged**, so the PR title becomes the released commit subject. Make it
a good one.

## Making a change

- **Smallest diff that solves the task.** No drive-by refactors, no speculative abstractions.
- **Search before you add.** Extend the existing helper, type or renderer rather than growing a
  parallel one beside it.
- **Match the local shape.** Scout the nearest similar module and mirror its structure, naming
  and error handling.
- The published surface is [`src/index.ts`](./src/index.ts) and [`src/types`](./src/types).
  Adding to it is a `feat`; changing or removing from it is a breaking change and needs the
  footer plus a migration note.
- `three` is a **peer** dependency. Do not turn it into a direct one, and do not rely on a
  version narrower than the declared `peerDependencies` range.

## Tests

Add or update tests when you change prompt shaping, tool or skill dispatch, the API client, the
public surface, or a renderer. The matrix is in [`docs/testing.md`](./docs/testing.md).

| Layer       | Command                 | Add a test here when                                      |
| ----------- | ----------------------- | --------------------------------------------------------- |
| Unit        | `pnpm test:unit`        | a pure-function result would break                        |
| Integration | `pnpm test:integration` | a URL, header, status code or module contract would break |
| E2E         | `pnpm test:e2e`         | only a real browser or the built package would break      |

## Before you push

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
```

The `pre-commit` hook runs ESLint and Prettier on staged files; `pre-push` runs the typecheck
and the unit suite. Neither is a substitute for the CI matrix — they just save a round trip.

## Opening the PR

Fill in [the template](./.github/pull_request_template.md). It asks for the scope, what you ran,
and whether the public surface moved — all three change how the PR is reviewed and what it
releases.

CI runs commitlint, lint, format, typecheck, the dependency audit, all three test layers and the
build on every PR. The single required check is **`ci gate`**; if it is red, open the run and
read the job that failed rather than pushing a blind fix.

## Reporting a vulnerability

See [`SECURITY.md`](./SECURITY.md). Please do not open a public issue for one.
