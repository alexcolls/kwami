# Security Policy

Usage questions and non-security bugs belong in [`SUPPORT.md`](./SUPPORT.md), not
here.

## Supported versions

Kwami releases from three channels; only the stable line receives security fixes.

| Channel                      | npm tag  | Supported                                   |
| ---------------------------- | -------- | ------------------------------------------- |
| `main` — latest stable `2.x` | `latest` | ✅                                          |
| `stg` — release candidates   | `rc`     | ⚠️ fixed in the next stable, not backported |
| `dev` — prereleases          | `dev`    | ❌ not supported                            |
| `1.x` and earlier            | —        | ❌ end of life                              |

## Reporting a vulnerability

**Do not open a public issue.**

Use GitHub's private reporting — [Security → Report a
vulnerability](https://github.com/kwami-labs/kwami/security/advisories/new) — or email
<alexcollsoutumuro@gmail.com>.

Please include the affected version, what an attacker can do with it, and the smallest
reproduction you have. A proof of concept helps; a working exploit against a third party's
deployment does not, and please do not attach one.

You can expect an acknowledgement within 3 working days and an assessment within 10. If the
report is accepted we will agree a disclosure timeline with you and credit you in the advisory
and the changelog unless you would rather stay anonymous.

## Scope

Kwami is a browser library. It renders WebGL avatars, connects to a LiveKit room, and talks to a
Kwami backend over HTTP. In scope:

- anything that lets attacker-controlled data reach `eval`, the DOM, or a shader compile in a
  way that escapes its intended sandbox;
- credential or token handling in `src/utils/api-client.ts` and the LiveKit adapter — leakage
  into URLs, logs, or cross-origin requests;
- a supply-chain issue in a **runtime** dependency (`three`, `livekit-client`, `simplex-noise`);
- anything that lets a caller of the public API reach beyond the canvas and the configured
  endpoints.

Out of scope:

- vulnerabilities in a consumer's own backend, LiveKit deployment or API keys;
- advisories in devDependencies that do not ship — those are tracked by the CI audit gate
  ([`scripts/ci/check-audit.mjs`](./scripts/ci/check-audit.mjs)), not by this policy;
- denial of service achieved by passing deliberately absurd config to your own instance;
- missing hardening headers on a page you control.

## Deploying safely

Two things are your deployment's responsibility, because the library cannot enforce them from
the browser.

**Pin the agent's participant identity.** The adapter treats one participant in the LiveKit room
as authoritative: it auto-plays that participant's audio, emits its transcripts as agent text,
drives the UI state machine from its attributes, and — most importantly — executes the
`tool_call` data messages it sends against the tools you registered with `registerTool()`.
Participants choose their own identity, so tell the library which one is the agent:

```ts
new Kwami(canvas, {
  agent: {
    livekit: {
      tokenEndpoint: '/api/livekit/token',
      agentIdentity: 'agent-7f3a', // or agentIdentityPrefix: 'kwami-agent:'
    },
  },
});
```

Set it from the same backend that mints the room token, and have that backend refuse to issue a
token for that identity to anyone else. Without it the library falls back to a name heuristic
(`agent*`, or `*kwami*` without `user`) that another participant can satisfy by choosing a
matching name.

**Do not put provider API keys in the browser.** `VoicePipelineConfig` accepts `llm.apiKey`,
`tts.apiKey`, `realtime.apiKey` and `stt.extra.apiKey` because the backend agent needs them, but
anything you pass there ships to every visitor's browser and travels over the room's data
channel. Hold those keys on your agent backend and leave the client fields unset. The logger
masks them (see [`src/utils/logger.ts`](./src/utils/logger.ts)) so they do not reach the console,
but masking a log line is not the same as the key not being there.

## Handling secrets

Kwami never persists credentials. A LiveKit token or backend auth token passed into the library
lives in memory for the session and travels only to the endpoint it was issued for. If you find
one reaching anywhere else — a log line, a query string, a third-party host — that is a
vulnerability, and we want to hear about it.
