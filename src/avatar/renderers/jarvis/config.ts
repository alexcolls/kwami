import type {
  JarvisColorConfig,
  JarvisConfig,
  JarvisPalettePreset,
  JarvisQuality,
} from './types.js'

/**
 * Palettes. `holo-cyan` is the reference look (teal hologram on near-black); the others are
 * re-tints that keep the same luminance structure so bloom and contrast behave the same.
 */
export const jarvisPalettePresets: Record<JarvisPalettePreset, JarvisColorConfig> = {
  'holo-cyan': {
    primary: '#3ef2ff',
    secondary: '#127f8c',
    accent: '#e8ffff',
    alert: '#ff3d6e',
    background: '#010b0e',
    backgroundGlow: '#06343d',
  },
  'neon-violet': {
    primary: '#46c4ff',
    secondary: '#9a35ff',
    accent: '#d4f6ff',
    alert: '#ff3fc0',
    background: '#04020c',
    backgroundGlow: '#1c0a3c',
  },
  'arc-white': {
    primary: '#a8e2ff',
    secondary: '#2f6fa8',
    accent: '#ffffff',
    alert: '#ffb347',
    background: '#02060c',
    backgroundGlow: '#0c2238',
  },
  'alert-amber': {
    primary: '#ffb23d',
    secondary: '#8f4c14',
    accent: '#fff2d8',
    alert: '#ff3b30',
    background: '#0b0502',
    backgroundGlow: '#2c1606',
  },
}

export function getJarvisPalette(preset: JarvisPalettePreset): JarvisColorConfig {
  return { ...jarvisPalettePresets[preset] }
}

export function getDefaultJarvisConfig(): JarvisConfig {
  return {
    palettePreset: 'holo-cyan',
    color: getJarvisPalette('holo-cyan'),
    intensity: 1,
    reactivity: 1,
    rotationSpeed: 1,
    parallax: 1,
    quality: 'high',
    backdrop: true,
    labels: true,
    title: 'J.A.R.V.I.S.',
    scale: 1,
  }
}

export interface JarvisQualityProfile {
  dust: number
  bokeh: number
  sparks: number
  bloomScale: number
  grain: boolean
}

export const jarvisQualityProfiles: Record<JarvisQuality, JarvisQualityProfile> = {
  low: { dust: 450, bokeh: 0, sparks: 96, bloomScale: 0.75, grain: false },
  medium: { dust: 1300, bokeh: 16, sparks: 192, bloomScale: 0.9, grain: false },
  high: { dust: 2400, bokeh: 26, sparks: 320, bloomScale: 1, grain: true },
}
