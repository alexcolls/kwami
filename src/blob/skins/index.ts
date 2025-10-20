import type { ShaderMaterial } from 'three';
import { createTricolorSkin } from './tricolor';
import { createZebraSkin } from './zebra';
import type { BlobSkinType, TricolorSkinConfig, ZebraSkinConfig } from '../../types';

/**
 * Create a skin material based on type and configuration
 */
export function createSkin(
  type: BlobSkinType,
  config: TricolorSkinConfig | ZebraSkinConfig,
): ShaderMaterial {
  switch (type) {
    case 'tricolor':
      return createTricolorSkin(config as TricolorSkinConfig);
    case 'zebra':
      return createZebraSkin(config as ZebraSkinConfig);
    default:
      return createTricolorSkin(config as TricolorSkinConfig);
  }
}

export { createTricolorSkin, createZebraSkin };
