export type BlobSkinType =
  | 'radial' | 'banded' | 'striped' | 'marble' | 'fresnel' | 'iridescent' | 'spiral' | 'plasma' | 'gradient'
  | 'matte' | 'glossy' | 'metallic' | 'subsurface'
  | 'chrome' | 'clay' | 'jade' | 'toon-matcap' | 'hologram'
  | 'flat' | 'stepped' | 'halftone' | 'outlined'

export interface BlobPresetState {
  skin: {
    type: BlobSkinType
    colors: { x: string; y: string; z: string }
    opacity: number
    shininess: number
    lightIntensity: number
    wireframe: boolean
    glassMode: boolean
    resolution: number
  }
  shape: {
    scale: number
    position: { x: number; y: number; z: number }
    spikes: { x: number; y: number; z: number }
    amplitude: { x: number; y: number; z: number }
  }
  animation: {
    time: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    breathing: number
  }
  cursorTouch: {
    hover: { enabled: boolean; highlightOnHover: boolean; cursorStyle: 'pointer' | 'grab' | 'crosshair' | 'default' }
    drag: { enabled: boolean; sensitivity: number }
    touch: { strength: number; duration: number; maxPoints: number }
  }
}

export interface AvatarBlobPreset {
  id: string
  name: string
  icon: string
  blob: Partial<BlobPresetState>
}

export type BlackHoleColorScheme = 'classic' | 'fire' | 'ice' | 'nebula' | 'void'

export interface BlackHolePresetState {
  colorScheme: { preset: BlackHoleColorScheme }
  colors: { hot: string; mid1: string; mid2: string; mid3: string; outer: string }
  core: { radius: number; blackHoleRadius: number; eventHorizonRadius: number; glowIntensity: number; pulseSpeed: number }
  disk: { innerRadius: number; outerRadius: number; tiltAngle: number; flowSpeed: number; noiseScale: number; density: number }
  effects: {
    bloomIntensity: number
    bloomThreshold: number
    bloomRadius: number
    lensingStrength: number
    lensingRadius: number
    chromaticAberration: number
  }
  animation: { autoRotate: boolean; autoRotateSpeed: number; diskRotationSpeed: number; starsRotationSpeed: number }
}

export interface AvatarBlackHolePreset {
  id: string
  name: string
  icon: string
  blackHole: Partial<BlackHolePresetState>
}

export interface EyeIrisPresetState {
  palettePreset: 'light-brown' | 'hazel' | 'blue-grey' | 'green-blue'
  geometry: { irisRadius: number; pupilRadius: number; limbalRingWidth: number }
  detail: {
    fiberDensity: number
    radialStreakStrength: number
    collaretteStrength: number
    limbalIntensity: number
    noiseStrength: number
    cryptStrength: number
    furrowStrength: number
    ringContrast: number
    sectorMix: number
  }
  color: {
    base: string
    secondary: string
    accent: string
    limbal: string
    collarette: string
    crypt: string
    streak: string
  }
  animation: { shimmerSpeed: number; shimmerStrength: number; patternFlow: number; patternRotation: number }
  audioEffects: {
    enabled: boolean
    reactivity: number
    pupilResponse: number
    shimmerResponse: number
    smoothing: number
  }
  scale: number
}

export interface AvatarEyeIrisPreset {
  id: string
  name: string
  icon: string
  eyeIris: Partial<EyeIrisPresetState>
}

export const avatarBlobPresets: AvatarBlobPreset[] = [
  {
    id: 'rgb-pulse',
    name: 'RGB Pulse',
    icon: 'ph:lightning-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#ff0066', y: '#00ff66', z: '#6600ff' },
        opacity: 1,
        shininess: 80,
        lightIntensity: 1.3,
        wireframe: false,
        glassMode: false,
        resolution: 200,
      },
      shape: {
        scale: 3.2,
        position: { x: 56, y: 208, z: 78 },
        spikes: { x: 0.8, y: 1.2, z: 0.6 },
        amplitude: { x: 1.5, y: 0.8, z: 1.2 },
      },
      animation: {
        time: { x: 12, y: 9, z: 14 },
        rotation: { x: 0.02, y: 0, z: 0 },
        breathing: 0.02,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 1.5, duration: 800, maxPoints: 8 },
      },
    },
  },
  {
    id: 'ocean-wave',
    name: 'Ocean Wave',
    icon: 'ph:waves-duotone',
    blob: {
      skin: {
        type: 'banded',
        colors: { x: '#0077be', y: '#00d4ff', z: '#001a33' },
        opacity: 0.85,
        shininess: 120,
        lightIntensity: 1,
        wireframe: false,
        glassMode: false,
        resolution: 220,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 2.65, y: 2.4, z: 0.35 },
        amplitude: { x: 0.5, y: 2.0, z: 0.6 },
      },
      animation: {
        time: { x: 5, y: 3, z: 4 },
        rotation: { x: 0.01, y: 0.003, z: 0.002 },
        breathing: 0.03,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 0.8, duration: 1500, maxPoints: 4 },
      },
    },
  },
  {
    id: 'sunset-glow',
    name: 'Sunset',
    icon: 'ph:sun-horizon-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#ff6b35', y: '#f7c59f', z: '#8b1e3f' },
        opacity: 0.33,
        shininess: 200,
        lightIntensity: 10.4,
        wireframe: false,
        glassMode: false,
        resolution: 160,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 8, y: 8, z: 8 },
        amplitude: { x: 1.1, y: 0.7, z: 1.0 },
      },
      animation: {
        time: { x: 6, y: 8, z: 7 },
        rotation: { x: 0.001, y: 0.002, z: 0.001 },
        breathing: 0.015,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 1.2, duration: 1200, maxPoints: 6 },
      },
    },
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora',
    icon: 'ph:star-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#00ff87', y: '#60efff', z: '#7b2cbf' },
        opacity: 0.95,
        shininess: 100,
        lightIntensity: 3.5,
        wireframe: false,
        glassMode: false,
        resolution: 240,
      },
      shape: {
        scale: 3.2,
        position: { x: 306, y: 40, z: 300 },
        spikes: { x: 0, y: 0, z: 4.6 },
        amplitude: { x: 0, y: 0, z: 2 },
      },
      animation: {
        time: { x: 0, y: 0, z: 10 },
        rotation: { x: 0, y: 0, z: 0.004 },
        breathing: 0.04,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 0.6, duration: 2000, maxPoints: 3 },
      },
    },
  },
  {
    id: 'lava-flow',
    name: 'Lava',
    icon: 'ph:fire-simple-duotone',
    blob: {
      skin: {
        type: 'banded',
        colors: { x: '#ff4500', y: '#ff8c00', z: '#8b0000' },
        opacity: 1,
        shininess: 30,
        lightIntensity: 1.8,
        wireframe: false,
        glassMode: false,
        resolution: 150,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 1.2, y: 0.9, z: 1.4 },
        amplitude: { x: 1.3, y: 1.1, z: 1.5 },
      },
      animation: {
        time: { x: 10, y: 12, z: 8 },
        rotation: { x: 0.002, y: 0.001, z: 0.003 },
        breathing: 0.05,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.2 },
        touch: { strength: 2.0, duration: 600, maxPoints: 10 },
      },
    },
  },
  {
    id: 'cotton-candy',
    name: 'Cotton Candy',
    icon: 'ph:cloud-duotone',
    blob: {
      skin: {
        type: 'banded',
        colors: { x: '#ffb6c1', y: '#87ceeb', z: '#dda0dd' },
        opacity: 0.15,
        shininess: 176,
        lightIntensity: 1.6,
        wireframe: true,
        glassMode: false,
        resolution: 204,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 1.2, y: 1, z: 0.95 },
        amplitude: { x: 3.6, y: 1.3, z: 0.9 },
      },
      animation: {
        time: { x: 7.3, y: 0.1, z: 6.5 },
        rotation: { x: 0.003, y: 0.002, z: 0.004 },
        breathing: 0.025,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 0.8 },
        touch: { strength: 0.5, duration: 1800, maxPoints: 4 },
      },
    },
  },
  {
    id: 'midnight-void',
    name: 'Midnight',
    icon: 'ph:moon-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#1a1a2e', y: '#16213e', z: '#0f3460' },
        opacity: 1,
        shininess: 0,
        lightIntensity: 200.5,
        wireframe: false,
        glassMode: false,
        resolution: 260,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 0.4, y: 1.6, z: 0.3 },
        amplitude: { x: 0.8, y: 0.5, z: 1.0 },
      },
      animation: {
        time: { x: 4, y: 6, z: 5 },
        rotation: { x: 0.001, y: 0.0015, z: 0.0008 },
        breathing: 0.01,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: false, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 0.5 },
        touch: { strength: 2.4, duration: 2500, maxPoints: 2 },
      },
    },
  },
  {
    id: 'toxic-slime',
    name: 'Toxic',
    icon: 'ph:skull-duotone',
    blob: {
      skin: {
        type: 'striped',
        colors: { x: '#39ff14', y: '#16bb16', z: '#32cd32' },
        opacity: 0.7,
        shininess: 60,
        lightIntensity: 1.6,
        wireframe: true,
        glassMode: false,
        resolution: 140,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 1.8, y: 1.2, z: 2.0 },
        amplitude: { x: 1.5, y: 1.3, z: 1.7 },
      },
      animation: {
        time: { x: 11, y: 14, z: 9 },
        rotation: { x: 0.005, y: 0.003, z: 0.006 },
        breathing: 0.06,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'crosshair' },
        drag: { enabled: true, sensitivity: 1.5 },
        touch: { strength: 2.5, duration: 500, maxPoints: 12 },
      },
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    icon: 'ph:crown-duotone',
    blob: {
      skin: {
        type: 'banded',
        colors: { x: '#ffd700', y: '#daa520', z: '#b8860b' },
        opacity: 1,
        shininess: 200,
        lightIntensity: 1.3,
        wireframe: false,
        glassMode: false,
        resolution: 200,
      },
      shape: {
        scale: 3.2,
        position: { x: 17, y: 277, z: 18 },
        spikes: { x: 2.2, y: 0.35, z: 0.2 },
        amplitude: { x: 0.6, y: 0.7, z: 2.5 },
      },
      animation: {
        time: { x: 3, y: 5, z: 4 },
        rotation: { x: 0.00, y: 0.00, z: 0.0002 },
        breathing: 0.015,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 0.7 },
        touch: { strength: 0.7, duration: 1400, maxPoints: 5 },
      },
    },
  },
  {
    id: 'ice-crystal',
    name: 'Ice',
    icon: 'ph:snowflake-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#e0ffff', y: '#add8e6', z: '#87ceeb' },
        opacity: 1,
        shininess: 180,
        lightIntensity: 1.7,
        wireframe: false,
        glassMode: true,
        resolution: 280,
      },
      shape: {
        scale: 3.2,
        position: { x: 70, y: 305, z: 294 },
        spikes: { x: 1.0, y: 1.8, z: 0.2 },
        amplitude: { x: 0.4, y: 2, z: 0.5 },
      },
      animation: {
        time: { x: 0, y: 0, z: 1 },
        rotation: { x: 0.001, y: 0.001, z: 0.001 },
        breathing: 0.008,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 0.5 },
        touch: { strength: 0.3, duration: 3000, maxPoints: 2 },
      },
    },
  },
  {
    id: 'forest-moss',
    name: 'Forest',
    icon: 'ph:tree-duotone',
    blob: {
      skin: {
        type: 'banded',
        colors: { x: '#228b22', y: '#006400', z: '#8fbc8f' },
        opacity: 1,
        shininess: 40,
        lightIntensity: 10,
        wireframe: false,
        glassMode: false,
        resolution: 170,
      },
      shape: {
        scale: 3.2,
        position: { x: 22, y: 260, z: 260 },
        spikes: { x: 0, y: 5, z: 1.6 },
        amplitude: { x: 0, y: 2, z: 3 },
      },
      animation: {
        time: { x: 5, y: 5, z: 5 },
        rotation: { x: 0, y: 0.001, z: 0 },
        breathing: 0.02,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 1.0, duration: 1100, maxPoints: 5 },
      },
    },
  },
  {
    id: 'planet-swirl',
    name: 'Planet',
    icon: 'ph:planet-duotone',
    blob: {
      skin: {
        type: 'radial',
        colors: { x: '#663399', y: '#ff1493', z: '#00ced1' },
        opacity: 0.9,
        shininess: 100,
        lightIntensity: 1.2,
        wireframe: false,
        glassMode: false,
        resolution: 210,
      },
      shape: {
        scale: 3.2,
        position: { x: 0, y: 0, z: 0 },
        spikes: { x: 0.1, y: 0.1, z: 0.1 },
        amplitude: { x: 1.4, y: 1.9, z: 0.2 },
      },
      animation: {
        time: { x: 13, y: 5, z: 10 },
        rotation: { x: 0.003, y: 0.005, z: 0.002 },
        breathing: 0.025,
      },
      cursorTouch: {
        hover: { enabled: true, highlightOnHover: true, cursorStyle: 'pointer' },
        drag: { enabled: true, sensitivity: 1.0 },
        touch: { strength: 1.3, duration: 900, maxPoints: 7 },
      },
    },
  },
]

export const avatarBlackHolePresets: AvatarBlackHolePreset[] = [
  {
    id: 'black-hole-classic',
    name: 'Classic',
    icon: 'ph:circle-duotone',
    blackHole: {
      colorScheme: { preset: 'classic' },
      colors: {
        hot: '#ffffff',
        mid1: '#ff7733',
        mid2: '#ff4477',
        mid3: '#7744ff',
        outer: '#4477ff',
      },
      core: { radius: 1.3, blackHoleRadius: 1.3, eventHorizonRadius: 1.365, glowIntensity: 1.0, pulseSpeed: 2.5 },
      disk: { innerRadius: 0.2, outerRadius: 8.0, tiltAngle: Math.PI / 3.0, flowSpeed: 0.22, noiseScale: 2.5, density: 1.3 },
      effects: { bloomIntensity: 0.8, bloomThreshold: 0.8, bloomRadius: 0.7, lensingStrength: 0.12, lensingRadius: 0.3, chromaticAberration: 0.005 },
      animation: { autoRotate: false, autoRotateSpeed: 0.1, diskRotationSpeed: 0.005, starsRotationSpeed: 0.003 },
    },
  },
  {
    id: 'black-hole-inferno',
    name: 'Inferno',
    icon: 'ph:fire-duotone',
    blackHole: {
      colorScheme: { preset: 'fire' },
      colors: {
        hot: '#ffffff',
        mid1: '#ffcc00',
        mid2: '#ff6600',
        mid3: '#ff3300',
        outer: '#990000',
      },
      core: { radius: 1.3, blackHoleRadius: 1.3, eventHorizonRadius: 1.365, glowIntensity: 1.3, pulseSpeed: 3.0 },
      disk: { innerRadius: 0.15, outerRadius: 9.0, tiltAngle: Math.PI / 2.5, flowSpeed: 0.3, noiseScale: 3.0, density: 1.5 },
      effects: { bloomIntensity: 1.0, bloomThreshold: 0.7, bloomRadius: 0.8, lensingStrength: 0.14, lensingRadius: 0.35, chromaticAberration: 0.008 },
      animation: { autoRotate: false, autoRotateSpeed: 0.1, diskRotationSpeed: 0.008, starsRotationSpeed: 0.002 },
    },
  },
  {
    id: 'black-hole-frozen',
    name: 'Frozen',
    icon: 'ph:snowflake-duotone',
    blackHole: {
      colorScheme: { preset: 'ice' },
      colors: {
        hot: '#ffffff',
        mid1: '#aaffff',
        mid2: '#66ccff',
        mid3: '#3399ff',
        outer: '#0066cc',
      },
      core: { radius: 1.3, blackHoleRadius: 1.3, eventHorizonRadius: 1.365, glowIntensity: 0.8, pulseSpeed: 1.8 },
      disk: { innerRadius: 0.25, outerRadius: 7.0, tiltAngle: Math.PI / 4.0, flowSpeed: 0.15, noiseScale: 2.0, density: 1.1 },
      effects: { bloomIntensity: 0.9, bloomThreshold: 0.85, bloomRadius: 0.6, lensingStrength: 0.1, lensingRadius: 0.28, chromaticAberration: 0.006 },
      animation: { autoRotate: false, autoRotateSpeed: 0.08, diskRotationSpeed: 0.003, starsRotationSpeed: 0.004 },
    },
  },
  {
    id: 'black-hole-nebula',
    name: 'Nebula',
    icon: 'ph:planet-duotone',
    blackHole: {
      colorScheme: { preset: 'nebula' },
      colors: {
        hot: '#ffccff',
        mid1: '#ff66ff',
        mid2: '#cc33ff',
        mid3: '#6633cc',
        outer: '#330066',
      },
      core: { radius: 1.4, blackHoleRadius: 1.4, eventHorizonRadius: 1.47, glowIntensity: 1.1, pulseSpeed: 2.2 },
      disk: { innerRadius: 0.2, outerRadius: 10.0, tiltAngle: Math.PI / 3.5, flowSpeed: 0.18, noiseScale: 3.5, density: 1.4 },
      effects: { bloomIntensity: 1.0, bloomThreshold: 0.75, bloomRadius: 0.9, lensingStrength: 0.15, lensingRadius: 0.32, chromaticAberration: 0.01 },
      animation: { autoRotate: false, autoRotateSpeed: 0.12, diskRotationSpeed: 0.004, starsRotationSpeed: 0.003 },
    },
  },
  {
    id: 'black-hole-void',
    name: 'Void',
    icon: 'ph:moon-duotone',
    blackHole: {
      colorScheme: { preset: 'void' },
      colors: {
        hot: '#666666',
        mid1: '#444444',
        mid2: '#333333',
        mid3: '#222222',
        outer: '#111111',
      },
      core: { radius: 1.5, blackHoleRadius: 1.5, eventHorizonRadius: 1.575, glowIntensity: 0.5, pulseSpeed: 1.5 },
      disk: { innerRadius: 0.3, outerRadius: 6.0, tiltAngle: Math.PI / 2.8, flowSpeed: 0.1, noiseScale: 1.8, density: 0.8 },
      effects: { bloomIntensity: 0.4, bloomThreshold: 0.9, bloomRadius: 0.5, lensingStrength: 0.18, lensingRadius: 0.4, chromaticAberration: 0.003 },
      animation: { autoRotate: false, autoRotateSpeed: 0.05, diskRotationSpeed: 0.002, starsRotationSpeed: 0.001 },
    },
  },
  {
    id: 'black-hole-interstellar',
    name: 'Interstellar',
    icon: 'ph:star-duotone',
    blackHole: {
      colorScheme: { preset: 'classic' },
      colors: {
        hot: '#ffffff',
        mid1: '#ffdd88',
        mid2: '#ffaa44',
        mid3: '#ff6622',
        outer: '#cc3300',
      },
      core: { radius: 1.2, blackHoleRadius: 1.2, eventHorizonRadius: 1.26, glowIntensity: 0.9, pulseSpeed: 2.0 },
      disk: { innerRadius: 0.18, outerRadius: 12.0, tiltAngle: Math.PI / 2.0, flowSpeed: 0.25, noiseScale: 2.8, density: 1.2 },
      effects: { bloomIntensity: 0.85, bloomThreshold: 0.82, bloomRadius: 0.75, lensingStrength: 0.16, lensingRadius: 0.38, chromaticAberration: 0.007 },
      animation: { autoRotate: true, autoRotateSpeed: 0.08, diskRotationSpeed: 0.006, starsRotationSpeed: 0.002 },
    },
  },
  {
    id: 'black-hole-quasar',
    name: 'Quasar',
    icon: 'ph:sun-duotone',
    blackHole: {
      colorScheme: { preset: 'classic' },
      colors: {
        hot: '#ffffff',
        mid1: '#88ffff',
        mid2: '#44aaff',
        mid3: '#2266ff',
        outer: '#0033cc',
      },
      core: { radius: 1.1, blackHoleRadius: 1.1, eventHorizonRadius: 1.155, glowIntensity: 1.5, pulseSpeed: 3.5 },
      disk: { innerRadius: 0.12, outerRadius: 15.0, tiltAngle: Math.PI / 6.0, flowSpeed: 0.35, noiseScale: 4.0, density: 1.8 },
      effects: { bloomIntensity: 1.2, bloomThreshold: 0.65, bloomRadius: 1.0, lensingStrength: 0.08, lensingRadius: 0.25, chromaticAberration: 0.012 },
      animation: { autoRotate: false, autoRotateSpeed: 0.15, diskRotationSpeed: 0.01, starsRotationSpeed: 0.004 },
    },
  },
  {
    id: 'black-hole-aurora',
    name: 'Aurora',
    icon: 'ph:rainbow-duotone',
    blackHole: {
      colorScheme: { preset: 'classic' },
      colors: {
        hot: '#aaffaa',
        mid1: '#44ff88',
        mid2: '#00ffcc',
        mid3: '#00aaff',
        outer: '#4488ff',
      },
      core: { radius: 1.3, blackHoleRadius: 1.3, eventHorizonRadius: 1.365, glowIntensity: 1.0, pulseSpeed: 2.8 },
      disk: { innerRadius: 0.22, outerRadius: 8.5, tiltAngle: Math.PI / 3.2, flowSpeed: 0.2, noiseScale: 2.2, density: 1.3 },
      effects: { bloomIntensity: 0.9, bloomThreshold: 0.78, bloomRadius: 0.72, lensingStrength: 0.11, lensingRadius: 0.3, chromaticAberration: 0.006 },
      animation: { autoRotate: false, autoRotateSpeed: 0.1, diskRotationSpeed: 0.005, starsRotationSpeed: 0.003 },
    },
  },
]

export const avatarEyeIrisPresets: AvatarEyeIrisPreset[] = [
  {
    id: 'eye-iris-light-brown',
    name: 'Light Brown',
    icon: 'ph:eye-duotone',
    eyeIris: {
      palettePreset: 'light-brown',
      geometry: { irisRadius: 0.92, pupilRadius: 0.24, limbalRingWidth: 0.07 },
      detail: { fiberDensity: 162, radialStreakStrength: 0.92, collaretteStrength: 0.74, limbalIntensity: 1.0, noiseStrength: 0.24, cryptStrength: 0.94, furrowStrength: 0.78, ringContrast: 0.88, sectorMix: 0.52 },
      color: { base: '#8f4b24', secondary: '#b06a34', accent: '#e2a24d', limbal: '#3b1d10', collarette: '#a35a2c', crypt: '#2a160d', streak: '#f0b265' },
      animation: { shimmerSpeed: 0.14, shimmerStrength: 0.08, patternFlow: 0.22, patternRotation: 0.06 },
      scale: 5.0,
    },
  },
  {
    id: 'eye-iris-hazel',
    name: 'Hazel',
    icon: 'ph:eye-duotone',
    eyeIris: {
      palettePreset: 'hazel',
      geometry: { irisRadius: 0.94, pupilRadius: 0.22, limbalRingWidth: 0.06 },
      detail: { fiberDensity: 170, radialStreakStrength: 0.98, collaretteStrength: 0.74, limbalIntensity: 1.02, noiseStrength: 0.28, cryptStrength: 0.92, furrowStrength: 0.74, ringContrast: 0.86, sectorMix: 0.58 },
      color: { base: '#6b4b23', secondary: '#a37229', accent: '#d0a73c', limbal: '#2b190a', collarette: '#845223', crypt: '#1d1208', streak: '#d6b45b' },
      animation: { shimmerSpeed: 0.16, shimmerStrength: 0.1, patternFlow: 0.24, patternRotation: 0.08 },
      scale: 5.0,
    },
  },
  {
    id: 'eye-iris-blue-grey',
    name: 'Blue Grey',
    icon: 'ph:eye-duotone',
    eyeIris: {
      palettePreset: 'blue-grey',
      geometry: { irisRadius: 0.94, pupilRadius: 0.21, limbalRingWidth: 0.07 },
      detail: { fiberDensity: 182, radialStreakStrength: 1.04, collaretteStrength: 0.62, limbalIntensity: 1.08, noiseStrength: 0.2, cryptStrength: 1.0, furrowStrength: 0.8, ringContrast: 0.92, sectorMix: 0.44 },
      color: { base: '#73879b', secondary: '#9db2c4', accent: '#d6e3ef', limbal: '#2b3540', collarette: '#8398ab', crypt: '#1d2530', streak: '#dce7f0' },
      animation: { shimmerSpeed: 0.12, shimmerStrength: 0.08, patternFlow: 0.18, patternRotation: 0.05 },
      scale: 5.0,
    },
  },
  {
    id: 'eye-iris-green-blue',
    name: 'Green Blue',
    icon: 'ph:eye-duotone',
    eyeIris: {
      palettePreset: 'green-blue',
      geometry: { irisRadius: 0.94, pupilRadius: 0.2, limbalRingWidth: 0.065 },
      detail: { fiberDensity: 190, radialStreakStrength: 1.06, collaretteStrength: 0.68, limbalIntensity: 1.04, noiseStrength: 0.24, cryptStrength: 0.96, furrowStrength: 0.82, ringContrast: 0.9, sectorMix: 0.66 },
      color: { base: '#2f8f84', secondary: '#4ac1aa', accent: '#a1e75c', limbal: '#12483e', collarette: '#3ea892', crypt: '#0d3129', streak: '#9fe5b2' },
      animation: { shimmerSpeed: 0.14, shimmerStrength: 0.09, patternFlow: 0.22, patternRotation: 0.07 },
      scale: 5.0,
    },
  },
]
