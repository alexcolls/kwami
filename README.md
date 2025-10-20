# 🌟 @kwami/core

A 3D Interactive AI Companion Library for creating engaging AI companions with visual (blob), audio, and AI capabilities.

## ✨ Features

- 🎨 **3D Blob Body** - Morphing sphere that reacts to audio in real-time
- 🎵 **Audio Integration** - Built-in audio playback and frequency analysis
- 🎭 **Multiple Skins** - Tricolor and Zebra shader materials with easy extensibility
- 🔊 **Audio Visualization** - Real-time audio-reactive animations
- 🎮 **Interactive** - Event system for user interactions
- 🧠 **AI Ready** - Prepared for LLM, TTS, and STT integration
- 🎯 **TypeScript** - Fully typed for better DX
- 🚀 **Performant** - Optimized WebGL rendering
- 📦 **Modular** - Use only what you need

## 📦 Installation

```bash
npm install @kwami/core three simplex-noise
```

## 🚀 Quick Start

```typescript
import { Kwami } from '@kwami/core';

// Get your canvas element
const canvas = document.querySelector('canvas') as HTMLCanvasElement;

// Create a Kwami instance
const kwami = new Kwami(canvas, {
  body: {
    audioFiles: [
      '/audio/track1.mp3',
      '/audio/track2.mp3'
    ],
    initialSkin: 'tricolor',
    blob: {
      resolution: 180,
      colors: {
        x: '#ff0066',
        y: '#00ff66',
        z: '#6600ff'
      }
    }
  }
});

// Play audio
await kwami.body.audio.play();

// Randomize appearance
kwami.body.blob.setRandomBlob();
```

## 📚 Documentation

### Core Concepts

Kwami is composed of three main parts:

1. **Body** - The visual 3D blob representation
2. **Mind** - The AI configuration and capabilities (LLM, TTS, STT)
3. **Soul** - The AI personality and behavior

### Body Configuration

The body manages the 3D scene, renderer, camera, and the blob mesh.

```typescript
const kwami = new Kwami(canvas, {
  body: {
    // Audio files for the playlist
    audioFiles: ['/audio/track1.mp3'],
    
    // Initial skin type
    initialSkin: 'tricolor', // or 'zebra'
    
    // Audio configuration
    audio: {
      preload: 'auto',
      autoInitialize: true,
      volume: 0.8
    },
    
    // Scene configuration
    scene: {
      fov: 100,
      near: 0.1,
      far: 1000,
      cameraPosition: { x: 0, y: 6, z: 0 },
      enableShadows: true,
      enableControls: true
    },
    
    // Blob configuration
    blob: {
      resolution: 180,
      spikes: { x: 0.2, y: 0.2, z: 0.2 },
      time: { x: 1, y: 1, z: 1 },
      rotation: { x: 0.01, y: 0.01, z: 0 },
      colors: {
        x: '#ff0066',
        y: '#00ff66',
        z: '#6600ff'
      },
      shininess: 100,
      wireframe: false
    }
  }
});
```

### Audio Management

```typescript
// Play audio
await kwami.body.audio.play();

// Pause audio
kwami.body.audio.pause();

// Next track
kwami.body.audio.next();

// Previous track
kwami.body.audio.previous();

// Set volume (0-1)
kwami.body.audio.setVolume(0.5);

// Get frequency data for visualization
const frequencyData = kwami.body.audio.getFrequencyData();
```

### Blob Customization

```typescript
// Change skin
kwami.body.blob.setSkin('zebra');

// Set custom colors (tricolor skin)
kwami.body.blob.setColors('#ff0000', '#00ff00', '#0000ff');

// Set single color
kwami.body.blob.setColor('x', '#ff00ff');

// Randomize appearance
kwami.body.blob.setRandomBlob();

// Set spike intensity
kwami.body.blob.setSpikes(0.3, 0.3, 0.3);

// Set rotation speed
kwami.body.blob.setRotation(0.01, 0.01, 0);

// Set resolution (segments)
kwami.body.blob.setResolution(200);

// Enable wireframe
kwami.body.blob.setWireframe(true);

// Export as GLB
kwami.body.blob.exportGLTF();
```

### States

Kwami can have different states that affect its behavior:

```typescript
// Get current state
const state = kwami.getState(); // 'idle' | 'listening' | 'thinking' | 'speaking'

// Set state
kwami.setState('listening');

// State-specific methods
await kwami.listen();  // Start listening (STT)
kwami.think();         // Thinking state
await kwami.speak('Hello!'); // Speak (TTS)
```

### Creating Custom Skins

You can create custom shader materials for the blob:

```typescript
import { ShaderMaterial, Color } from 'three';

const customSkin = new ShaderMaterial({
  vertexShader: yourVertexShader,
  fragmentShader: yourFragmentShader,
  uniforms: {
    // Your custom uniforms
  }
});

// Apply to blob
kwami.body.blob.getMesh().material = customSkin;
```

## 🎨 Examples

### Basic Setup with HTML

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { width: 100vw; height: 100vh; display: block; }
  </style>
</head>
<body>
  <canvas id="kwami-canvas"></canvas>
  <script type="module">
    import { Kwami } from '@kwami/core';
    
    const canvas = document.getElementById('kwami-canvas');
    const kwami = new Kwami(canvas, {
      body: {
        audioFiles: ['/audio/music.mp3'],
        initialSkin: 'tricolor'
      }
    });
    
    // Play on user interaction
    canvas.addEventListener('click', () => {
      kwami.body.audio.play();
    });
    
    // Randomize on double click
    canvas.addEventListener('dblclick', () => {
      kwami.body.blob.setRandomBlob();
    });
  </script>
</body>
</html>
```

### Interactive Controls

```typescript
// Change skin with buttons
document.getElementById('tricolor-btn')?.addEventListener('click', () => {
  kwami.body.blob.setSkin('tricolor');
});

document.getElementById('zebra-btn')?.addEventListener('click', () => {
  kwami.body.blob.setSkin('zebra');
});

// Random blob button
document.getElementById('random-btn')?.addEventListener('click', () => {
  kwami.body.blob.setRandomBlob();
});

// Color picker
document.getElementById('color-x')?.addEventListener('change', (e) => {
  kwami.body.blob.setColor('x', e.target.value);
});
```

### Audio Reactive Visualization

```typescript
import { Kwami } from '@kwami/core';

const kwami = new Kwami(canvas, {
  body: {
    audioFiles: ['/audio/music.mp3'],
    blob: {
      // Higher spike values = more reactive
      spikes: { x: 0.5, y: 0.5, z: 0.5 }
    }
  }
});

// The blob automatically reacts to audio!
await kwami.body.audio.play();
```

## 🏗️ Architecture

```
@kwami/
├── src/
│   ├── core/           # Core classes
│   │   ├── Kwami.ts    # Main class
│   │   ├── Body.ts     # Body management
│   │   └── Audio.ts    # Audio management
│   ├── blob/           # Blob implementation
│   │   ├── Blob.ts     # Main blob class
│   │   ├── geometry.ts # Geometry creation
│   │   ├── animation.ts# Animation logic
│   │   ├── config.ts   # Default config
│   │   └── skins/      # Shader materials
│   ├── scene/          # THREE.js scene setup
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── assets/             # Audio and textures
└── index.ts            # Main exports
```

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Credits

Built with:
- [THREE.js](https://threejs.org/) - 3D graphics
- [simplex-noise](https://github.com/jwagner/simplex-noise.js/) - Smooth noise generation
- TypeScript - Type safety

## 🔮 Roadmap

- [ ] AI Mind integration (LLM support)
- [ ] AI Soul (personality system)
- [ ] Speech-to-Text integration
- [ ] Text-to-Speech integration
- [ ] More built-in skins
- [ ] Animation presets
- [ ] WebXR support
- [ ] Mobile optimizations
- [ ] React/Vue/Svelte wrappers

## 📧 Support

For questions and support, please open an issue on GitHub.

---

Made with ❤️ by the Quami team
