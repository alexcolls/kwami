import { getRandomHexColor, getRandomBoolean } from '../../../utils/randoms'
import type { BlobXyzOptionsConfig } from './types'

/**
 * Default configuration for blob behavior and appearance
 */
export const defaultBlobXyzConfig: BlobXyzOptionsConfig = {
  spikes: {
    min: 0,
    max: 20,
    step: 0.1,
    digits: 2,
    rMin: 0.15,
    rMax: 4.0,
    default: 0.2,
  },
  speed: {
    min: 20,
    max: 50,
    default: 20,
  },
  processing: {
    min: 0.4,
    max: 1,
    default: 0.5,
  },
  resolution: {
    min: 120,
    max: 220,
    default: 180,
    step: 1,
  },
  skins: {
    tricolor: {
      poles: {
        wireframe: getRandomBoolean(0.1),
        lightPosition: { x: 1000, y: 2500, z: 200 },
        shininess: 50,
        color1: getRandomHexColor(),
        color2: getRandomHexColor(),
        color3: getRandomHexColor(),
        opacity: 1,
      },
      donut: {
        wireframe: getRandomBoolean(0.1),
        lightPosition: { x: 800, y: 2200, z: 300 },
        shininess: 45,
        color1: getRandomHexColor(),
        color2: getRandomHexColor(),
        color3: getRandomHexColor(),
        opacity: 1,
      },
      vintage: {
        wireframe: false,
        lightPosition: { x: 0, y: 500, z: 200 },
        shininess: 50,
        opacity: 1,
        color1: '#ff0066',
        color2: '#00ff66',
        color3: '#6600ff',
      },
      marble: {
        wireframe: false,
        lightPosition: { x: 600, y: 2000, z: 400 },
        shininess: 65,
        color1: getRandomHexColor(),
        color2: getRandomHexColor(),
        color3: getRandomHexColor(),
        opacity: 1,
      },
      fresnel: {
        wireframe: false,
        lightPosition: { x: 500, y: 1800, z: 500 },
        shininess: 120,
        color1: getRandomHexColor(),
        color2: getRandomHexColor(),
        color3: getRandomHexColor(),
        opacity: 0.9,
      },
      iridescent: {
        wireframe: false,
        lightPosition: { x: 800, y: 2200, z: 300 },
        shininess: 90,
        color1: getRandomHexColor(),
        color2: getRandomHexColor(),
        color3: getRandomHexColor(),
        opacity: 1,
      },
    },
  },
}
