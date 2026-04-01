import type { ShaderMaterial } from 'three'
import { createPolesSkin } from './poles'
import { createDonutSkin } from './donut'
import { createVintageSkin } from './vintage'
import { createMarbleSkin } from './marble'
import { createFresnelSkin } from './fresnel'
import { createIridescentSkin } from './iridescent'
import { createSpiralSkin } from './spiral'
import { createPlasmaSkin } from './plasma'
import { createGradientSkin } from './gradient'
import { createMatteSkin } from './matte'
import { createGlossySkin } from './glossy'
import { createMetallicSkin } from './metallic'
import { createSubsurfaceSkin } from './subsurface'
import { createChromeSkin } from './chrome'
import { createClaySkin } from './clay'
import { createJadeSkin } from './jade'
import { createToonMatcapSkin } from './toon-matcap'
import { createHologramSkin } from './hologram'
import { createFlatSkin } from './flat'
import { createSteppedSkin } from './stepped'
import { createHalftoneSkin } from './halftone'
import { createOutlinedSkin } from './outlined'
import type { BlobXyzSkin, TricolorSkinConfig } from '../types'

const skinFactories: Record<BlobXyzSkin, (config: TricolorSkinConfig) => ShaderMaterial> = {
  radial: createPolesSkin,
  banded: createDonutSkin,
  striped: createVintageSkin,
  marble: createMarbleSkin,
  fresnel: createFresnelSkin,
  iridescent: createIridescentSkin,
  spiral: createSpiralSkin,
  plasma: createPlasmaSkin,
  gradient: createGradientSkin,
  matte: createMatteSkin,
  glossy: createGlossySkin,
  metallic: createMetallicSkin,
  subsurface: createSubsurfaceSkin,
  chrome: createChromeSkin,
  clay: createClaySkin,
  jade: createJadeSkin,
  'toon-matcap': createToonMatcapSkin,
  hologram: createHologramSkin,
  flat: createFlatSkin,
  stepped: createSteppedSkin,
  halftone: createHalftoneSkin,
  outlined: createOutlinedSkin,
}

export function createSkin(
  skin: BlobXyzSkin,
  config: TricolorSkinConfig,
): ShaderMaterial {
  const factory = skinFactories[skin]
  return factory ? factory(config) : createPolesSkin(config)
}

export {
  createPolesSkin, createDonutSkin, createVintageSkin,
  createMarbleSkin, createFresnelSkin, createIridescentSkin,
  createSpiralSkin, createPlasmaSkin, createGradientSkin,
  createMatteSkin, createGlossySkin, createMetallicSkin, createSubsurfaceSkin,
  createChromeSkin, createClaySkin, createJadeSkin, createToonMatcapSkin, createHologramSkin,
  createFlatSkin, createSteppedSkin, createHalftoneSkin, createOutlinedSkin,
}
