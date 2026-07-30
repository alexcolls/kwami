import type {
  EyeIrisColorConfig,
  EyeIrisConfig,
  EyeIrisAnimationConfig,
  EyeIrisAudioEffects,
  EyeIrisDetailConfig,
  EyeIrisFollowConfig,
  EyeIrisGeometryConfig,
  EyeIrisPalettePreset,
} from './types'

export const eyeIrisPalettePresets: Record<EyeIrisPalettePreset, EyeIrisColorConfig> = {
  'light-brown': {
    base: '#8f4b24',
    secondary: '#b06a34',
    accent: '#e2a24d',
    limbal: '#3b1d10',
    collarette: '#a35a2c',
    crypt: '#2a160d',
    streak: '#f0b265',
  },
  hazel: {
    base: '#6b4b23',
    secondary: '#a37229',
    accent: '#d0a73c',
    limbal: '#2b190a',
    collarette: '#845223',
    crypt: '#1d1208',
    streak: '#d6b45b',
  },
  'blue-grey': {
    base: '#5f7692',
    secondary: '#9bb6cc',
    accent: '#dceaf7',
    limbal: '#1a2533',
    collarette: '#9a8673',
    crypt: '#132338',
    streak: '#e8f3ff',
  },
  'green-blue': {
    base: '#2f8f84',
    secondary: '#4ac1aa',
    accent: '#a1e75c',
    limbal: '#12483e',
    collarette: '#3ea892',
    crypt: '#0d3129',
    streak: '#9fe5b2',
  },
}

export function getDefaultEyeIrisGeometry(): EyeIrisGeometryConfig {
  return {
    irisRadius: 0.94,
    pupilRadius: 0.22,
    limbalRingWidth: 0.06,
  }
}

export function getDefaultEyeIrisDetail(): EyeIrisDetailConfig {
  return {
    fiberDensity: 168,
    fiberSharpness: 1.0,
    radialStreakStrength: 0.98,
    collaretteStrength: 0.72,
    limbalIntensity: 1.02,
    noiseStrength: 0.28,
    cryptStrength: 0.9,
    furrowStrength: 0.72,
    ringContrast: 0.82,
    sectorMix: 0.56,
    pigmentMottleStrength: 0.95,
    spokesStrength: 0.9,
    innerRingStrength: 0.92,
  }
}

export function getDefaultEyeIrisAnimation(): EyeIrisAnimationConfig {
  return {
    shimmerSpeed: 0.16,
    shimmerStrength: 0.1,
    patternFlow: 0.24,
    patternRotation: 0.08,
  }
}

export function getDefaultEyeIrisAudioEffects(): EyeIrisAudioEffects {
  return {
    enabled: true,
    reactivity: 1.0,
    pupilResponse: 0.22,
    shimmerResponse: 0.35,
    smoothing: 0.82,
  }
}

export function getDefaultEyeIrisFollow(): EyeIrisFollowConfig {
  return {
    enabled: true,
    sensitivity: 1.0,
    pupilMotion: true,
    pupilMotionStrength: 0.12,
  }
}

export function getDefaultEyeIrisConfig(): EyeIrisConfig {
  return {
    palettePreset: 'hazel',
    geometry: getDefaultEyeIrisGeometry(),
    detail: getDefaultEyeIrisDetail(),
    color: eyeIrisPalettePresets.hazel,
    animation: getDefaultEyeIrisAnimation(),
    audioEffects: getDefaultEyeIrisAudioEffects(),
    follow: getDefaultEyeIrisFollow(),
    scale: 5.0,
  }
}

export function getEyeIrisPalette(palette: EyeIrisPalettePreset): EyeIrisColorConfig {
  return eyeIrisPalettePresets[palette]
}
