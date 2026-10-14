# Kwami

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/kwami.svg)](https://www.npmjs.com/package/kwami)
[![npm rc](https://img.shields.io/npm/v/kwami/rc.svg?label=rc)](https://www.npmjs.com/package/kwami?activeTab=versions)
[![npm dev](https://img.shields.io/npm/v/kwami/dev.svg?label=dev)](https://www.npmjs.com/package/kwami?activeTab=versions)
[![CI](https://github.com/kwami-labs/kwami/actions/workflows/ci.yml/badge.svg)](https://github.com/kwami-labs/kwami/actions/workflows/ci.yml)
[![Release](https://github.com/kwami-labs/kwami/actions/workflows/release.yml/badge.svg)](https://github.com/kwami-labs/kwami/actions/workflows/release.yml)
[![CD](https://github.com/kwami-labs/kwami/actions/workflows/cd.yml/badge.svg)](https://github.com/kwami-labs/kwami/actions/workflows/cd.yml)
[![Node](https://img.shields.io/node/v/kwami.svg)](./.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10-F69220.svg?logo=pnpm&logoColor=white)](https://pnpm.io/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/module-ESM-ed2c6e.svg)](https://nodejs.org/api/esm.html)
[![types](https://img.shields.io/npm/types/kwami.svg)](https://www.npmjs.com/package/kwami)
[![bundle size](https://img.shields.io/bundlephobia/minzip/kwami.svg)](https://bundlephobia.com/package/kwami)
[![npm downloads](https://img.shields.io/npm/dm/kwami.svg)](https://www.npmjs.com/package/kwami)
[![npm downloads total](https://img.shields.io/npm/dt/kwami.svg)](https://www.npmjs.com/package/kwami)
[![GitHub release](https://img.shields.io/github/v/release/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/releases)
[![GitHub stars](https://img.shields.io/github/stars/kwami-labs/kwami.svg?style=social)](https://github.com/kwami-labs/kwami/stargazers)

[![last commit](https://img.shields.io/github/last-commit/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/commits)
[![commit activity](https://img.shields.io/github/commit-activity/m/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/commits)
[![issues](https://img.shields.io/github/issues/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/issues)
[![pull requests](https://img.shields.io/github/issues-pr/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/pulls)
[![contributors](https://img.shields.io/github/contributors/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami/graphs/contributors)
[![code size](https://img.shields.io/github/languages/code-size/kwami-labs/kwami.svg)](https://github.com/kwami-labs/kwami)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier&logoColor=white)](https://prettier.io/)
[![linted with eslint](https://img.shields.io/badge/linted-ESLint-4B32C3.svg?logo=eslint&logoColor=white)](https://eslint.org/)
[![conventional commits](https://img.shields.io/badge/commits-conventional-FE5196.svg?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org/)
[![semantic-release](https://img.shields.io/badge/release-semantic--release-e10079.svg?logo=semantic-release&logoColor=white)](https://semantic-release.gitbook.io/)
[![Vite](https://img.shields.io/badge/bundler-Vite-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/unit-Vitest-6E9F18.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/e2e-Playwright-2EAD33.svg?logo=playwright&logoColor=white)](https://playwright.dev/)

[![three.js](https://img.shields.io/badge/3D-three.js-000000.svg?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![LiveKit](https://img.shields.io/badge/voice-LiveKit-1C1C1C.svg)](https://livekit.io/)
[![MCP](https://img.shields.io/badge/tools-MCP-412991.svg)](https://modelcontextprotocol.io/)
[![WebGL](https://img.shields.io/badge/graphics-WebGL-990000.svg)](https://www.khronos.org/webgl/)
[![STT](https://img.shields.io/badge/speech-STT-0A7CFF.svg)](./src/agent/voice)
[![LLM](https://img.shields.io/badge/model-LLM-10A37F.svg)](./src/agent/voice)
[![TTS](https://img.shields.io/badge/speech-TTS-7C3AED.svg)](./src/agent/voice)
[![website](https://img.shields.io/badge/website-kwami.io-111111.svg)](https://kwami.io)

**Kwami** is a browser TypeScript library for 3D AI companions. Drop a canvas on the page, give the companion a soul, and it can speak, listen, remember, and use tools — with a WebGL avatar that reacts in real time.

> Avatar · voice · memory · tools · skills

Site: [kwami.io](https://kwami.io) · Package: [npmjs.com/package/kwami](https://www.npmjs.com/package/kwami)

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [Releases](#releases)
- [License](#license)

---

## Overview

Each `Kwami` instance is an independent agent:

| Piece      | What it does                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| **Avatar** | WebGL renderer on an `HTMLCanvasElement` (blob, black hole, particles, iris)    |
| **Agent**  | Voice pipeline over [LiveKit](https://livekit.io/) — STT, LLM, TTS, or realtime |
| **Soul**   | Name, personality, emotional traits, and system prompt                          |
| **Memory** | Long-term recall (Zep adapter)                                                  |
| **Tools**  | External capabilities via [MCP](https://modelcontextprotocol.io/)               |
| **Skills** | Native in-process behaviors                                                     |

Several instances can share a page. Configuration can change after `connect()` without tearing the room down.

```ts
import { Kwami } from 'kwami';

const luna = new Kwami(canvas, {
  soul: { name: 'Luna', personality: 'friendly and creative' },
  agent: { voice: { llm: { model: 'gpt-4o' } } },
});

await luna.connect('user-123', {
  onStateChange: (state) => console.log(state),
  onUserTranscript: (text) => console.log('user:', text),
  onAgentResponse: (text) => console.log('luna:', text),
});
```

---

## Features

- **3D avatars** — `blob-xyz`, `black-hole`, `particles-face`, and `eye-iris`, with skins, presets, and audio-reactive motion
- **Voice pipeline** — mix-and-match STT / LLM / TTS, or a realtime provider, dispatched through LiveKit
- **Provider catalog** — Deepgram, OpenAI, Anthropic, Gemini, ElevenLabs, Groq, Cartesia, AssemblyAI, and more
- **Soul presets** — ready-made personalities (Kaya, Nexus, Phoenix, Haven, …) plus live trait updates
- **Memory** — optional long-term context so the companion remembers the user across sessions
- **MCP tools** — connect Model Context Protocol servers and expose their tools to the agent
- **Skills** — register native behaviors that run in the page
- **Typed ESM** — `kwami` ships as ESM with generated `.d.ts`; `three` is a peer dependency

---

## Architecture

```text
                         ┌─────────────────────────────────────┐
                         │              Kwami                  │
                         │  id · state · connect / disconnect  │
                         └───────────────┬─────────────────────┘
          ┌──────────┬───────────┬───────┼────────┬──────────┬──────────┐
          ▼          ▼           ▼       ▼        ▼          ▼
       Avatar      Agent        Soul   Memory   Tools      Skills
      (WebGL)    (LiveKit)   (persona)  (Zep)   (MCP)     (native)
          │          │
          │          └── VoiceSession  STT → LLM → TTS
          └── Scene · skins · audio bands · renderer
```

| Concept            | Detail                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Construct**      | `new Kwami(canvas, config?)` creates avatar, agent, soul, memory, tools, and skills               |
| **Connect**        | `connect(userId)` initializes memory, builds the system prompt, and dispatches a LiveKit agent    |
| **Speak / listen** | User speech and agent replies update avatar state: `idle` → `listening` → `thinking` → `speaking` |
| **Update live**    | Soul, voice, tools, and skills can change while the room is up                                    |
| **Dispose**        | Call `dispose()` so the WebGL context, LiveKit room, and registry entry are released              |

---

## Quick start

```bash
pnpm add kwami three
```

`three` is a **peer** dependency. Install it beside `kwami`; do not rely on a transitive copy.

```ts
import { Kwami } from 'kwami';

const canvas = document.querySelector('canvas')!;
const kwami = new Kwami(canvas, {
  soul: { name: 'Kaya', personality: 'A warm, friendly AI companion' },
});

await kwami.connect('user-123');
kwami.sendMessage('Hello — who are you?');

// Later
await kwami.disconnect();
kwami.dispose();
```

Channels:

```bash
pnpm add kwami          # latest stable (main)
pnpm add kwami@rc       # release candidate (stg)
pnpm add kwami@dev      # prerelease (dev)
```

---

## Getting started

### Prerequisites

| Tool                           | Requirement                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| [Node.js](https://nodejs.org/) | Version in [`.nvmrc`](./.nvmrc) (`>= 22.14`) — `nvm use`                                    |
| [pnpm](https://pnpm.io/)       | `>= 10` — `corepack enable` picks up `packageManager` from [`package.json`](./package.json) |

`pnpm-lock.yaml` is the lockfile of record. CI installs with `--frozen-lockfile`; an `npm install` here produces a lockfile CI will reject.

### Install

```bash
git clone https://github.com/kwami-labs/kwami.git
cd kwami
nvm use
corepack enable
pnpm install    # also installs husky hooks
```

### Build & verify

```bash
pnpm build
pnpm lint && pnpm typecheck && pnpm test:run
```

---

## Scripts

```bash
# Build
pnpm build              # bundle + type declarations → dist/
pnpm dev                # rebuild on change
pnpm clean              # remove dist/, coverage/, and test output

# Quality
pnpm lint
pnpm lint:fix
pnpm format
pnpm format:check
pnpm typecheck
pnpm audit:ci

# Tests — see docs/testing.md
pnpm test               # unit
pnpm test:watch
pnpm test:coverage      # unit + coverage ratchet (CI)
pnpm test:integration
pnpm test:e2e           # built bundle in a real browser (WebGL)
pnpm test:all

# Releases — see docs/releases.md
pnpm release:dry-run    # print next version; change nothing
```

---

## Project structure

```text
kwami/
├── src/                  # Library source
│   ├── agent/            # Voice pipeline, LiveKit adapter, VoiceSession
│   ├── avatar/           # WebGL renderers, scene, skins, audio
│   ├── memory/           # Memory adapters
│   ├── soul/             # Personality and presets
│   ├── skills/           # Native behaviors
│   ├── tools/            # Tool registry (MCP)
│   ├── types/            # TypeScript definitions
│   └── Kwami.ts          # Public entry surface
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── ci/               # Pipeline gates
│   └── release/          # Baseline tag, back-merge
├── docs/                 # Deep-dive guides
├── .github/              # Workflows, PR template, CODEOWNERS
├── CHANGELOG.md          # Generated by semantic-release
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE               # Apache-2.0
└── package.json
```

---

## Documentation

| Document                               | Description                                  |
| -------------------------------------- | -------------------------------------------- |
| [CONTRIBUTING.md](./CONTRIBUTING.md)   | Setup, branches, commits, PR checklist       |
| [SECURITY.md](./SECURITY.md)           | Supported versions & vulnerability reporting |
| [CHANGELOG.md](./CHANGELOG.md)         | Released changes (generated)                 |
| [docs/ci-cd.md](./docs/ci-cd.md)       | CI pipeline & promotion gate                 |
| [docs/releases.md](./docs/releases.md) | Channels, version bumps, troubleshooting     |
| [docs/testing.md](./docs/testing.md)   | Unit / integration / e2e layers              |
| [LICENSE](./LICENSE)                   | Apache License 2.0 (full text)               |

---

## Contributing

Contributions are welcome. Please read **[CONTRIBUTING.md](./CONTRIBUTING.md)** before opening a PR.

**Branch promotion** (enforced in CI):

```text
feature/* ──► dev ──► stg ──► main
```

- Branch off `dev`; open PRs against `dev`
- Use [Conventional Commits](https://www.conventionalcommits.org/) — versions, tags, changelog, and npm publishes are derived from them
- Feature PRs are **squash-merged**; the PR title becomes the release subject
- Before push: `pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:integration`

Issue tracker: [github.com/kwami-labs/kwami/issues](https://github.com/kwami-labs/kwami/issues)

---

## Security

**Do not open public issues for vulnerabilities.**

Report privately via [GitHub Security Advisories](https://github.com/kwami-labs/kwami/security/advisories/new) or see **[SECURITY.md](./SECURITY.md)** for supported versions, scope, and response expectations.

---

## Releases

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/). Do not hand-edit `CHANGELOG.md` or the `version` field.

| Branch | npm tag  | Channel           |
| ------ | -------- | ----------------- |
| `main` | `latest` | Stable            |
| `stg`  | `rc`     | Release candidate |
| `dev`  | `dev`    | Prerelease        |

Details: [docs/releases.md](./docs/releases.md) · History: [CHANGELOG.md](./CHANGELOG.md)

---

## License

Copyright © 2025–2026 [Alex Colls Outumuro](https://github.com/alexcolls)

Licensed under the **Apache License, Version 2.0**. See the [LICENSE](./LICENSE) file for the full text.

```text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
