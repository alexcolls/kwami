import { ShaderMaterial, Color, Vector3 } from 'three';
import vertexShader from './vertex.glsl?raw';
import fragmentShader from './fragment.glsl?raw';
import type { ZebraSkinConfig } from '../../../types/index';

/**
 * Create a zebra stripe shader material for the blob
 * Black and white stripes with specular highlights
 */
export function createZebraSkin(config: ZebraSkinConfig): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: config.wireframe,
    uniforms: {
      lightPosition: {
        value: new Vector3(
          config.lightPosition.x,
          config.lightPosition.y,
          config.lightPosition.z,
        ),
      },
      shininess: {
        value: config.shininess,
      },
      specular_color: {
        value: new Color(0xFFFFFF),
      },
    },
  });
}

export { vertexShader, fragmentShader };
