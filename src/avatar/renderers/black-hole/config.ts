/**
 * Black Hole Renderer Configuration
 * 
 * Default configuration and color scheme presets.
 */

import type {
  BlackHoleConfig,
  BlackHoleCoreConfig,
  BlackHoleDiskConfig,
  BlackHoleDiskColors,
  BlackHoleStarsConfig,
  BlackHoleAnimationConfig,
  BlackHoleEffectsConfig,
  BlackHoleAudioEffects,
  BlackHoleColorSchemeSelection,
  ColorSchemePreset,
} from './types.js'

// Color scheme presets
export const colorSchemePresets: Record<string, ColorSchemePreset> = {
  classic: {
    colors: {
      hot: '#ffffff',
      mid1: '#ff7733',
      mid2: '#ff4477',
      mid3: '#7744ff',
      outer: '#4477ff',
    },
  },
  fire: {
    colors: {
      hot: '#ffffff',
      mid1: '#ffcc00',
      mid2: '#ff6600',
      mid3: '#ff3300',
      outer: '#990000',
    },
    effects: {
      bloomIntensity: 1.0,
    },
  },
  ice: {
    colors: {
      hot: '#ffffff',
      mid1: '#aaffff',
      mid2: '#66ccff',
      mid3: '#3399ff',
      outer: '#0066cc',
    },
    effects: {
      bloomIntensity: 0.9,
    },
  },
  nebula: {
    colors: {
      hot: '#ffccff',
      mid1: '#ff66ff',
      mid2: '#cc33ff',
      mid3: '#6633cc',
      outer: '#330066',
    },
    effects: {
      bloomIntensity: 1.0,
      chromaticAberration: 0.008,
    },
  },
  void: {
    colors: {
      hot: '#666666',
      mid1: '#444444',
      mid2: '#333333',
      mid3: '#222222',
      outer: '#111111',
    },
    effects: {
      bloomIntensity: 0.4,
      lensingStrength: 0.18,
    },
  },
}

// Default configurations
export function getDefaultColorScheme(): BlackHoleColorSchemeSelection {
  return { scheme: 'classic' }
}

export function getDefaultCore(): BlackHoleCoreConfig {
  return {
    radius: 1.3,
    blackHoleRadius: 1.3,            // Dark center sphere
    eventHorizonRadius: 1.3 * 1.05,  // Glowing shell (slightly larger)
    glowIntensity: 1.0,
    pulseSpeed: 2.5,
  }
}

export function getDefaultDisk(): BlackHoleDiskConfig {
  return {
    innerRadius: 0.2, // Relative to core radius
    outerRadius: 8.0,
    tiltAngle: Math.PI / 3.0,
    flowSpeed: 0.22,
    noiseScale: 2.5,
    density: 1.3,
  }
}

export function getDefaultColors(): BlackHoleDiskColors {
  return colorSchemePresets.classic.colors
}

export function getDefaultStars(): BlackHoleStarsConfig {
  return {
    count: 150000,
    fieldRadius: 2000,
    twinkleSpeed: 2.5,
  }
}

export function getDefaultAnimation(): BlackHoleAnimationConfig {
  return {
    autoRotate: false,
    autoRotateSpeed: 0.1,
    diskRotationSpeed: 0.005,
    starsRotationSpeed: 0.003,
  }
}

export function getDefaultEffects(): BlackHoleEffectsConfig {
  return {
    bloomIntensity: 0.8,
    bloomThreshold: 0.8,
    bloomRadius: 0.7,
    lensingStrength: 0.12,
    lensingRadius: 0.3,
    chromaticAberration: 0.005,
  }
}

export function getDefaultAudioEffects(): BlackHoleAudioEffects {
  return {
    enabled: true,
    reactivity: 1.0,
    bassDiskGlow: 0.5,
    midDiskSpeed: 0.3,
    highStarTwinkle: 0.4,
    smoothing: 0.8,
  }
}

export function getDefaultBlackHoleConfig(): BlackHoleConfig {
  return {
    colorScheme: getDefaultColorScheme(),
    core: getDefaultCore(),
    disk: getDefaultDisk(),
    colors: getDefaultColors(),
    stars: getDefaultStars(),
    animation: getDefaultAnimation(),
    effects: getDefaultEffects(),
    audioEffects: getDefaultAudioEffects(),
    scale: 1.0,
  }
}

// Helper to get colors for a scheme
export function getColorsForScheme(scheme: string): BlackHoleDiskColors {
  return colorSchemePresets[scheme]?.colors ?? colorSchemePresets.classic.colors
}

// Helper to get effects overrides for a scheme
export function getEffectsForScheme(scheme: string): Partial<BlackHoleEffectsConfig> {
  return colorSchemePresets[scheme]?.effects ?? {}
}
