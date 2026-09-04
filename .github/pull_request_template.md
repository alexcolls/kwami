<!--
The PR title must be a Conventional Commit — on a squash merge it becomes the commit subject
that drives semantic-release (version, tag, CHANGELOG, GitHub Release). See docs/releases.md.
Examples: feat(avatar): add eye-iris renderer · fix(agent): dedupe interim transcripts
-->

## Summary

<!-- What changed and why. Link the issue if there is one. -->

## Scope

- [ ] `src/avatar` (renderers, scene, audio)
- [ ] `src/agent` (voice pipeline, LiveKit adapter)
- [ ] `src/soul` / `src/memory` / `src/tools` / `src/skills`
- [ ] Public API — `src/index.ts` or `src/types`
- [ ] Tooling / CI / docs (releases nothing on its own)

## Test plan

<!-- Delete the rows that do not apply. -->

| Check       | Command                 | Result |
| ----------- | ----------------------- | ------ |
| Lint        | `pnpm lint`             |        |
| Types       | `pnpm typecheck`        |        |
| Unit        | `pnpm test:unit`        |        |
| Integration | `pnpm test:integration` |        |
| E2E         | `pnpm test:e2e`         |        |
| Build       | `pnpm build`            |        |

## Public API

- [ ] No change to the published surface
- [ ] Additive only (new export, new optional field)
- [ ] **Breaking** — the commit body carries a `BREAKING CHANGE:` footer and the migration note

## Checklist

- [ ] Targets `dev` (the promote path is `feature/* → dev → stg → main`)
- [ ] Conventional Commit title
- [ ] No secrets, `.env` values, or build output committed
- [ ] `CHANGELOG.md` and the `version` field untouched — semantic-release owns them
