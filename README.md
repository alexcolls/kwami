# kwami

A 3D AI companion library with voice interaction, memory, tools, and customizable avatars. Build interactive AI agents with real-time voice conversations, persistent memory, and beautiful 3D visualizations.

## Features

- **🎭 3D Avatars**: BlobXyz and Black Hole renderers
- **🎤 Voice Pipeline**: Real-time voice interaction with STT, LLM, and TTS via LiveKit
- **🧠 Memory**: Long-term memory support with Zep integration for context-aware conversations
- **🛠️ Tools**: MCP (Model Context Protocol) integration for external capabilities
- **🎨 Soul**: Customizable personality templates with emotional traits
- **⚡ Skills**: Native behaviors and capabilities
- **🔄 Dynamic Updates**: Update configuration on-the-fly without reconnecting
- **📦 TypeScript**: Fully typed with comprehensive type definitions

## Installation

```bash
npm install kwami
# or
pnpm add kwami
# or
yarn add kwami
```

### Peer Dependencies

Kwami requires `three` (Three.js) as a peer dependency:

```bash
npm install three
```

## Quick Start

```typescript
import { Kwami } from 'kwami';

// Get a canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// Create a Kwami instance
const kwami = new Kwami(canvas, {
  soul: {
    name: 'Luna',
    personality: 'friendly and creative',
  },
  agent: {
    voice: {
      llm: { model: 'gpt-4o' },
      tts: { voice: 'nova' },
    },
  },
  avatar: {
    renderer: 'blob-xyz',
  },
});

// Connect and start conversation
await kwami.connect('user-123', {
  onUserTranscript: (text) => console.log('User:', text),
  onAgentResponse: (text) => console.log('Agent:', text),
  onStateChange: (state) => console.log('State:', state),
});

// Send a message
kwami.sendMessage('Hello!');

// Cleanup when done
await kwami.disconnect();
```

## Core Concepts

### Avatar

The visual representation of your AI companion. Multiple renderer types are available:

- **BlobXyz**: Animated 3D blob with customizable skins (donut, poles, vintage)
- **Black Hole**: Minimalist black hole visualization

### Agent

Handles the voice pipeline and AI processing:

- **Voice Pipeline**: STT (Speech-to-Text), LLM (Language Model), TTS (Text-to-Speech)
- **LiveKit Integration**: Real-time voice communication
- **Dynamic Configuration**: Update voice settings without reconnecting

### Soul

Defines the AI's personality and behavior:

- Customizable traits and emotional characteristics
- Pre-built templates (friendly, professional, creative, etc.)
- System prompts and conversation style
- Emotional state tracking

### Memory

Long-term memory for context-aware conversations:

- Zep integration for persistent memory
- Message history and context retrieval
- Semantic search capabilities

### Tools

External capabilities via MCP (Model Context Protocol):

- Register custom tools
- Execute external functions
- Dynamic tool registration/unregistration

### Skills

Native behaviors and capabilities:

- Built-in skill system
- Custom skill definitions
- Context-aware execution

## Configuration

### Basic Configuration

```typescript
const kwami = new Kwami(canvas, {
  // Avatar configuration
  avatar: {
    renderer: 'blob-xyz', // or 'black-hole'
    scene: {
      background: 'stars',
      camera: { position: [0, 0, 5] },
    },
  },

  // Agent configuration
  agent: {
    voice: {
      llm: {
        provider: 'openai',
        model: 'gpt-4o',
      },
      tts: {
        provider: 'openai',
        voice: 'nova',
      },
      stt: {
        provider: 'deepgram',
      },
    },
  },

  // Soul configuration
  soul: {
    name: 'Luna',
    personality: 'friendly and creative',
    traits: ['curious', 'helpful'],
  },

  // Memory configuration
  memory: {
    adapter: 'zep',
    // Zep configuration...
  },

  // Tools configuration
  tools: {
    mcp: {
      // MCP server configuration...
    },
  },
});
```

### Dynamic Updates

Update configuration on-the-fly:

```typescript
// Update voice settings
kwami.updateVoice({
  tts: { voice: 'alloy' },
});

// Update soul
kwami.updateSoul({
  emotionalTone: 'enthusiastic',
});

// Register a new tool
kwami.registerTool({
  name: 'getWeather',
  description: 'Get current weather',
  // ...
});
```

## Development Setup

### Prerequisites

- Node.js — the version in [`.nvmrc`](./.nvmrc) (`nvm use`)
- [pnpm](https://pnpm.io/) — `corepack enable` picks up the pinned version from `package.json`.
  `pnpm-lock.yaml` is the lockfile of record and CI installs with `--frozen-lockfile`, so an
  `npm install` here produces a lockfile CI rejects.

### Installation

```bash
nvm use
corepack enable
pnpm install    # also installs the husky hooks
```

### Scripts

```bash
# Build
pnpm build              # bundle + type declarations into dist/
pnpm dev                # rebuild on change
pnpm clean              # remove dist/, coverage/ and test output

# Quality
pnpm lint               # ESLint over src/, tests/ and scripts/
pnpm lint:fix
pnpm format             # Prettier
pnpm format:check
pnpm typecheck          # src/, then tests/ and the config files
pnpm audit:ci           # dependency audit gate

# Tests — see docs/testing.md
pnpm test               # unit
pnpm test:watch
pnpm test:coverage      # unit + the coverage ratchet (what CI runs)
pnpm test:integration   # against a real HTTP server
pnpm test:e2e           # the built bundle, in a real browser with WebGL
pnpm test:all

# Releases — see docs/releases.md
pnpm release:dry-run    # print the next version, change nothing
```

### Contributing

Promotion is `feature/* → dev → stg → main`, enforced in CI. Commits must be
[Conventional Commits](https://www.conventionalcommits.org/) — every version, tag, changelog
entry and npm publish is derived from them.

| Guide                                    | Covers                                                         |
| ---------------------------------------- | -------------------------------------------------------------- |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md)   | workflow, branches, commit format, what to run before pushing  |
| [`docs/ci-cd.md`](./docs/ci-cd.md)       | the pipeline, the promotion gate, required repository settings |
| [`docs/releases.md`](./docs/releases.md) | release channels, what each commit type bumps, troubleshooting |
| [`docs/testing.md`](./docs/testing.md)   | the unit / integration / e2e layers and which to add to        |
| [`SECURITY.md`](./SECURITY.md)           | supported versions and how to report a vulnerability           |

### Release channels

```bash
npm install kwami          # latest stable, released from main
npm install kwami@rc       # release candidate, from stg
npm install kwami@dev      # prerelease, from dev
```

## Project Structure

```
kwami/
├── src/
│   ├── agent/          # Voice pipeline and LiveKit integration
│   ├── avatar/         # 3D avatar renderers
│   ├── memory/         # Memory adapters (Zep)
│   ├── soul/           # Personality system
│   ├── skills/         # Native behaviors
│   ├── tools/          # Tool registry (MCP)
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utilities
│   ├── Kwami.ts        # Main class
│   └── index.ts        # Public API exports
├── tests/
│   ├── unit/           # Pure logic, happy-dom
│   ├── integration/    # Real HTTP server, module seams
│   └── e2e/            # The built bundle in a real browser (Playwright)
├── scripts/
│   ├── ci/             # Pipeline gates (promotion path, audit)
│   └── release/        # Baseline tag, post-release back-merge
├── docs/               # ci-cd.md, releases.md, testing.md
├── dist/               # Build output
└── package.json
```

## API Reference

The library exports a comprehensive set of types and utilities. See the TypeScript definitions for full API documentation:

- `Kwami` - Main class
- `Avatar`, `Scene`, `StarField` - Avatar components
- `Agent`, `LiveKitAdapter`, `VoiceSession` - Agent components
- `Soul` - Personality management
- `Memory` - Memory operations
- `ToolRegistry` - Tool management
- `SkillManager` - Skill execution

## License

Apache-2.0
