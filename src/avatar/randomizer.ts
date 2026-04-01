import { getRandomHexColor } from '../utils/randoms'
import type { BlobSkinType } from './presets'

export const BLOB_SKINS: readonly BlobSkinType[] = [
  'radial',
  'banded',
  'striped',
  'marble',
  'fresnel',
  'iridescent',
  'spiral',
  'plasma',
  'gradient',
  'matte',
  'glossy',
  'metallic',
  'subsurface',
  'chrome',
  'clay',
  'jade',
  'toon-matcap',
  'hologram',
  'flat',
  'stepped',
  'halftone',
  'outlined',
] as const

export const BLOB_SKIN_LABELS: Record<BlobSkinType, string> = {
  radial: 'Radial',
  banded: 'Banded',
  striped: 'Striped',
  marble: 'Veined Marble',
  fresnel: 'Edge Glow',
  iridescent: 'Prism Shift',
  spiral: 'Vortex',
  plasma: 'Plasma Storm',
  gradient: 'Soft Blend',
  matte: 'Matte',
  glossy: 'Gloss',
  metallic: 'Metal',
  subsurface: 'Soft Scatter',
  chrome: 'Chrome',
  clay: 'Clay',
  jade: 'Jade',
  'toon-matcap': 'Toon Shine',
  hologram: 'Hologram',
  flat: 'Flat',
  stepped: 'Stepped',
  halftone: 'Halftone',
  outlined: 'Outlined',
}

function randomInRange(min: number, max: number, step = 0.01): number {
  const range = (max - min) / step
  return min + Math.round(Math.random() * range) * step
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T
}

export interface BlobRandomizerState {
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
    touch: { strength: number; duration: number; maxPoints: number }
  }
  audio: {
    enabled: boolean
    reactivity: number
    sensitivity: number
    responseSpeed: number
    transientBoost: number
    spikeDensity: number
    rotateWhilePlaying: boolean
    frequencySpikes: { bass: number; mid: number; high: number }
  }
}

export function randomBlobSkinType(): BlobSkinType {
  return pick(BLOB_SKINS)
}

export function randomBlobColors() {
  return { x: getRandomHexColor(), y: getRandomHexColor(), z: getRandomHexColor() }
}

export function randomBlobSurface() {
  const forceFullOpacity = Math.random() < 0.5
  return {
    // At least 50% of the time use full opacity.
    opacity: forceFullOpacity ? 1 : randomInRange(0.1, 0.99, 0.01),
    shininess: randomInRange(20, 150, 1),
    lightIntensity: randomInRange(0, 2, 0.1),
    resolution: randomInRange(64, 256, 8),
    wireframe: Math.random() > 0.8,
    glassMode: Math.random() > 0.85,
  }
}

export function randomBlobScale(): number {
  return randomInRange(1.5, 5, 0.1)
}

export function randomBlobVector3Degrees(linked = false) {
  if (linked) {
    const value = randomInRange(0, 360, 1)
    return { x: value, y: value, z: value }
  }
  return {
    x: randomInRange(0, 360, 1),
    y: randomInRange(0, 360, 1),
    z: randomInRange(0, 360, 1),
  }
}

export function randomBlobSpikes(linked = false) {
  if (linked) {
    const value = randomInRange(0, 3, 0.05)
    return { x: value, y: value, z: value }
  }
  return {
    x: randomInRange(0, 3, 0.05),
    y: randomInRange(0, 3, 0.05),
    z: randomInRange(0, 3, 0.05),
  }
}

export function randomBlobAmplitude(linked = false) {
  if (linked) {
    const value = randomInRange(0.3, 1.5, 0.05)
    return { x: value, y: value, z: value }
  }
  return {
    x: randomInRange(0.3, 1.5, 0.05),
    y: randomInRange(0.3, 1.5, 0.05),
    z: randomInRange(0.3, 1.5, 0.05),
  }
}

export function randomBlobTime(linked = false) {
  if (linked) {
    const value = randomInRange(0.5, 5, 0.1)
    return { x: value, y: value, z: value }
  }
  return {
    x: randomInRange(0.5, 5, 0.1),
    y: randomInRange(0.5, 5, 0.1),
    z: randomInRange(0.5, 5, 0.1),
  }
}

export function randomBlobRotation(linked = false) {
  const disabled = Math.random() < 0.5
  if (disabled) {
    return { x: 0, y: 0, z: 0 }
  }

  if (linked) {
    const value = randomInRange(0.001, 0.004, 0.001)
    return { x: value, y: value, z: value }
  }
  return {
    x: randomInRange(0.001, 0.004, 0.001),
    y: randomInRange(0.001, 0.004, 0.001),
    z: randomInRange(0.001, 0.004, 0.001),
  }
}

export function randomBlobBreathing(): number {
  return randomInRange(0, 0.15, 0.005)
}

export function randomBlobTouch() {
  return {
    strength: randomInRange(0.5, 2.5, 0.1),
    duration: randomInRange(500, 2000, 100),
    maxPoints: Math.floor(randomInRange(3, 12, 1)),
  }
}

export function randomBlobAudio() {
  return {
    enabled: Math.random() > 0.1,
    reactivity: randomInRange(1.0, 3.0, 0.1),
    sensitivity: randomInRange(0.03, 0.12, 0.005),
    responseSpeed: randomInRange(0.3, 0.85, 0.05),
    transientBoost: randomInRange(0.2, 0.7, 0.05),
    spikeDensity: randomInRange(0.5, 2.5, 0.1),
    rotateWhilePlaying: Math.random() > 0.5,
  }
}

export function randomBlobFrequencyBands() {
  return {
    bass: randomInRange(0.3, 1.5, 0.05),
    mid: randomInRange(0.2, 1.2, 0.05),
    high: randomInRange(0.1, 1.0, 0.05),
  }
}

export function randomizeBlobState(state: BlobRandomizerState): void {
  state.skin.type = randomBlobSkinType()
  state.skin.colors = randomBlobColors()
  // Keep legacy app behavior: don't randomize scale in full randomize.
  const forceFullOpacity = Math.random() < 0.5
  state.skin.opacity = forceFullOpacity ? 1 : randomInRange(0.1, 0.99, 0.01)
  const surface = randomBlobSurface()
  state.skin.shininess = surface.shininess
  state.skin.lightIntensity = surface.lightIntensity
  state.skin.wireframe = surface.wireframe
  state.skin.glassMode = surface.glassMode
  state.skin.resolution = surface.resolution
  state.shape.position = randomBlobVector3Degrees(false)
  state.shape.spikes = randomBlobSpikes(false)
  state.shape.amplitude = randomBlobAmplitude(false)
  state.animation.time = randomBlobTime(false)
  state.animation.rotation = randomBlobRotation(false)
  state.animation.breathing = randomBlobBreathing()
  state.cursorTouch.touch = randomBlobTouch()
  Object.assign(state.audio, randomBlobAudio())
  state.audio.frequencySpikes = randomBlobFrequencyBands()
}
