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
import { Kwami } from 'kwami'

// Get a canvas element
const canvas = document.getElementById('canvas') as HTMLCanvasElement

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
})

// Connect and start conversation
await kwami.connect('user-123', {
  onUserTranscript: (text) => console.log('User:', text),
  onAgentResponse: (text) => console.log('Agent:', text),
  onStateChange: (state) => console.log('State:', state),
})

// Send a message
kwami.sendMessage('Hello!')

// Cleanup when done
await kwami.disconnect()
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
})
```

### Dynamic Updates

Update configuration on-the-fly:

```typescript
// Update voice settings
kwami.updateVoice({
  tts: { voice: 'alloy' },
})

// Update soul
kwami.updateSoul({
  emotionalTone: 'enthusiastic',
})

// Register a new tool
kwami.registerTool({
  name: 'getWeather',
  description: 'Get current weather',
  // ...
})
```

## Development Setup

### Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) (recommended) or npm/yarn

### Installation

```bash
pnpm install
```

### Scripts

```bash
# Build the library
pnpm build

# Watch mode (TypeScript)
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Clean build artifacts
pnpm clean
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
├── scripts/            # Build scripts
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
