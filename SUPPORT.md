# Support

Kwami is a browser library. Most questions are answered by the document that
matches the kind of problem you have — please read that first.

## Where to go

| You have…                              | Go here                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------- |
| A usage question ("how do I…")         | This page, the [`README`](./README.md), or a [question issue][question] |
| A bug in the published `kwami` package | A [bug report][bug]                                                     |
| An idea for the library                | A [feature request][feature]                                            |
| A vulnerability                        | [`SECURITY.md`](./SECURITY.md) — **do not** open a public issue         |
| A contribution or a PR                 | [`CONTRIBUTING.md`](./CONTRIBUTING.md)                                  |
| A release / version / npm-tag question | [`docs/releases.md`](./docs/releases.md)                                |
| A CI or promotion-path question        | [`docs/ci-cd.md`](./docs/ci-cd.md)                                      |
| A test-layer question                  | [`docs/testing.md`](./docs/testing.md)                                  |
| A conduct concern                      | [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)                            |

[question]: https://github.com/kwami-labs/kwami/issues/new?template=question.yml
[bug]: https://github.com/kwami-labs/kwami/issues/new?template=bug_report.yml
[feature]: https://github.com/kwami-labs/kwami/issues/new?template=feature_request.yml

Site: [kwami.io](https://kwami.io) · Package:
[npmjs.com/package/kwami](https://www.npmjs.com/package/kwami) · Tracker:
[github.com/kwami-labs/kwami/issues](https://github.com/kwami-labs/kwami/issues)

## Before you open an issue

1. Search [existing issues](https://github.com/kwami-labs/kwami/issues) — open
   and closed.
2. Confirm you are on a [supported version](./SECURITY.md#supported-versions).
   `kwami@dev` and `kwami@rc` move every push; reproduce on `latest` if you can.
3. Include the package version (`Kwami.getVersion()` or the resolved
   `node_modules/kwami/package.json`), the browser, and a **minimal**
   reproduction. A canvas, a `new Kwami(…)`, and the call that fails is enough.
   A whole application is not.

## In scope

- The published `kwami` package: avatar renderers, soul, memory adapters, tools,
  skills, and the LiveKit voice adapter
- Types, the `exports` map, and the documented public surface in
  [`src/index.ts`](./src/index.ts)
- Documentation that is wrong or missing for that surface

## Out of scope

These are your deployment. We cannot debug them from an issue:

- Your LiveKit Cloud (or self-hosted) project, room tokens, or agent worker
- Provider API keys, quotas, or model quality (OpenAI, Deepgram, ElevenLabs, …)
- A page that never calls `connect()`, then reports that the agent is silent
- Framework-specific wrappers (React, Vue, Svelte) that are not in this repo
- Advisories in `devDependencies` that do not ship — those are the CI audit
  gate, not a support ticket

If the avatar mounts and `connect()` rejects, the error message and the network
tab for the token endpoint are the two things that usually locate the fault.

## What we need in a bug report

- **Version** — `kwami` and `three` (peer)
- **Browser** — name and version; WebGL2 is required
- **What you expected**, what you got, and the smallest snippet that does it
- Whether it fails before `connect()`, during it, or only after the room is up
- Console errors. Do **not** paste LiveKit tokens, provider keys, or JWTs —
  the logger already masks secrets; a redacted screenshot of the error is fine

## Response

This is a maintained open-source library, not a helpdesk. Issues are triaged
as time allows. There is no SLA.

Security reports are different: see [`SECURITY.md`](./SECURITY.md) for the
acknowledgement window.

## Community standards

Participation is covered by the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
Reports of conduct issues go to <alexcollsoutumuro@gmail.com>, not to a public
thread about the original incident.
