import type { ShaderMaterial } from 'three'
import { createPolesSkin } from './poles/index.js'
import { createDonutSkin } from './donut/index.js'
import { createVintageSkin } from './vintage/index.js'
import { createMarbleSkin } from './marble/index.js'
import { createFresnelSkin } from './fresnel/index.js'
import { createIridescentSkin } from './iridescent/index.js'
import { createSpiralSkin } from './spiral/index.js'
import { createPlasmaSkin } from './plasma/index.js'
import { createGradientSkin } from './gradient/index.js'
import { createMatteSkin } from './matte/index.js'
import { createGlossySkin } from './glossy/index.js'
import { createMetallicSkin } from './metallic/index.js'
import { createSubsurfaceSkin } from './subsurface/index.js'
import { createChromeSkin } from './chrome/index.js'
import { createClaySkin } from './clay/index.js'
import { createJadeSkin } from './jade/index.js'
import { createToonMatcapSkin } from './toon-matcap/index.js'
import { createHologramSkin } from './hologram/index.js'
import { createFlatSkin } from './flat/index.js'
import { createSteppedSkin } from './stepped/index.js'
import { createHalftoneSkin } from './halftone/index.js'
import { createOutlinedSkin } from './outlined/index.js'
import type { BlobXyzSkin, TricolorSkinConfig } from '../types.js'

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
