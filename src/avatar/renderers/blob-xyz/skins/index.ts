import type { ShaderMaterial } from 'three'
import { createPolesSkin } from './poles'
import { createDonutSkin } from './donut'
import { createVintageSkin } from './vintage'
import { createMarbleSkin } from './marble'
import { createFresnelSkin } from './fresnel'
import { createIridescentSkin } from './iridescent'
import type { BlobXyzSkinSelection, TricolorSkinConfig, TricolorSubtype } from '../types'

/**
 * Create a skin material based on skin selection.
 */
export function createSkin(
  selection: BlobXyzSkinSelection,
  config: TricolorSkinConfig,
): ShaderMaterial {
  const subtype: TricolorSubtype = selection.subtype ?? 'poles'

  switch (subtype) {
    case 'poles':
      return createPolesSkin(config)
    case 'donut':
      return createDonutSkin(config)
    case 'vintage':
      return createVintageSkin(config)
    case 'marble':
      return createMarbleSkin(config)
    case 'fresnel':
      return createFresnelSkin(config)
    case 'iridescent':
      return createIridescentSkin(config)
    default:
      return createPolesSkin(config)
  }
}

export { createPolesSkin, createDonutSkin, createVintageSkin, createMarbleSkin, createFresnelSkin, createIridescentSkin }
