# Migration Guide: @kwami v1.x to v2.0

This guide will help you migrate from the old @kwami structure to the new refactored version.

## 🎯 What Changed

### Architecture
- **Complete refactoring** from nested folder structure to clean, modular architecture
- **Removed** multi-body support (Metamask, etc.) - now focused on single Blob body
- **New** class-based API with better encapsulation
- **Improved** TypeScript types and better IntelliSense support

### Folder Structure

#### Before (v1.x)
```
@kwami/
├── core/
│   └── body/
│       ├── lib/
│       │   ├── Blob/
│       │   └── Metamask/
│       ├── audio.ts
│       └── scene.ts
├── utils/
└── types/
```

#### After (v2.0)
```
@kwami/
├── src/
│   ├── core/          # Core classes (Kwami, Body, Audio)
│   ├── blob/          # Blob implementation
│   ├── scene/         # Scene setup
│   ├── types/         # TypeScript types
│   └── utils/         # Utilities
├── assets/            # Audio and textures
├── index.ts           # Main exports
└── README.md
```

## 📝 Code Migration

### Import Changes

#### Before
```typescript
import Kwami from '~/@kwami';
import KwamiBody from '~/@kwami/core/body';
import KwamiAudio from '~/@kwami/core/body/audio';
```

#### After
```typescript
import { Kwami, KwamiBody, KwamiAudio } from '@kwami/core';
// Or individual imports
import { Kwami } from '@kwami/core';
```

### Instantiation Changes

#### Before
```typescript
const kwami = new Kwami(canvas);
kwami.body = new KwamiBody(canvas);
```

#### After
```typescript
const kwami = new Kwami(canvas, {
  body: {
    audioFiles: ['/audio/track1.mp3'],
    initialSkin: 'tricolor',
    blob: {
      resolution: 180,
      colors: { x: '#ff0000', y: '#00ff00', z: '#0000ff' }
    }
  }
});
```

### API Changes

#### Audio Methods

##### Before
```typescript
kwami.body.audio.playAudio();
kwami.body.audio.pauseAudio();
kwami.body.audio.nextAudio();
kwami.body.audio.prevAudio();
```

##### After
```typescript
await kwami.body.audio.play();
kwami.body.audio.pause();
kwami.body.audio.next();
kwami.body.audio.previous();
```

#### Blob Methods

##### Before
```typescript
kwami.body.blob.vector('x', 0.5);
kwami.body.blob.color('x', 0xff0000);
kwami.body.blob.setRandomXYZColor();
```

##### After
```typescript
kwami.body.blob.setSpikes(0.5, 0.5, 0.5);
kwami.body.blob.setColor('x', '#ff0000');
kwami.body.blob.setColors('#ff0000', '#00ff00', '#0000ff');
```

### Configuration Changes

#### Before
```typescript
// Configuration was spread across multiple places
const blob = new BodyBlob(
  'tricolor',
  'normal',
  scene,
  camera,
  renderer,
  audio
);
```

#### After
```typescript
// Centralized configuration
const kwami = new Kwami(canvas, {
  body: {
    audioFiles: [...],
    initialSkin: 'tricolor',
    audio: {
      preload: 'auto',
      volume: 0.8
    },
    scene: {
      fov: 100,
      enableShadows: true
    },
    blob: {
      resolution: 180,
      spikes: { x: 0.2, y: 0.2, z: 0.2 },
      colors: { x: '#ff0000', y: '#00ff00', z: '#0000ff' }
    }
  }
});
```

## 🔧 Component Updates

### In Vue Components

#### Before
```vue
<script setup lang="ts">
import Kwami from '~/@kwami';
import audioFiles from '~/@kwami/assets/audio';

const initKwami = (canvas: HTMLCanvasElement) => {
  const kwami = new Kwami(canvas);
  kwami.body.audio.playAudio();
};
</script>
```

#### After
```vue
<script setup lang="ts">
import { Kwami } from '@kwami/core';
import audioFiles from '@kwami/assets/audio';

const initKwami = (canvas: HTMLCanvasElement) => {
  const kwami = new Kwami(canvas, {
    body: {
      audioFiles,
      initialSkin: 'tricolor'
    }
  });
  
  kwami.body.audio.play();
};
</script>
```

## 🗑️ Removed Features

1. **Multiple Body Types** - Only Blob is supported now (Metamask removed)
2. **Body Selection System** - No longer need to select body type
3. **Old State System** - Replaced with simpler state management

## ✨ New Features

1. **Automatic Resize Handling** - No need to manually handle window resize
2. **Resource Disposal** - Proper cleanup with `dispose()` methods
3. **Better Type Safety** - Full TypeScript support
4. **Modular Exports** - Import only what you need
5. **Configuration System** - Centralized config for easier setup

## 📚 Additional Resources

- [README.md](./README.md) - Full documentation
- [CHANGELOG.md](./CHANGELOG.md) - Detailed change log
- [GitHub Issues](https://github.com/yourusername/kwami/issues) - Report issues

## ⚠️ Breaking Changes Summary

1. **Import paths changed** - Update all imports
2. **Constructor signature** - Now requires config object
3. **Method names** - More consistent naming (play/pause instead of playAudio/pauseAudio)
4. **No multi-body** - Only Blob body available
5. **Skin structure** - Skins are now in `src/blob/skins/`

## 🚀 Benefits of Migration

- ✅ **Better Performance** - Optimized rendering and memory management
- ✅ **Easier to Use** - Cleaner API and better defaults
- ✅ **Type Safe** - Full TypeScript support
- ✅ **Maintainable** - Better code organization
- ✅ **Documented** - Comprehensive documentation and examples
- ✅ **Future Ready** - Built for AI Mind and Soul integration

## 💡 Tips

1. **Start with one component** - Migrate incrementally
2. **Use TypeScript** - Take advantage of type safety
3. **Read the README** - Check examples for common patterns
4. **Test thoroughly** - Especially audio playback and animations
5. **Cleanup old imports** - Remove unused old code

## 🆘 Need Help?

If you encounter issues during migration:
1. Check the [README.md](./README.md) for examples
2. Review the [CHANGELOG.md](./CHANGELOG.md) for specific changes
3. Open an issue on GitHub with your question

---

**Happy coding!** 🎉

