import { ShaderMaterial, Color, Vector3 } from 'three'
import vertexShader from './vertex.glsl?raw'
import fragmentShader from './fragment.glsl?raw'
import type { TricolorSkinConfig } from '../../types'

export function createSubsurfaceSkin(config: TricolorSkinConfig): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader, fragmentShader, wireframe: config.wireframe, lights: false,
    transparent: true, depthWrite: false,
    uniforms: {
      lightPosition: { value: new Vector3(config.lightPosition.x, config.lightPosition.y, config.lightPosition.z) },
      shininess: { value: config.shininess },
      specular_color: { value: new Color(0xFFFFFF) },
      _color1: { value: new Color(config.color1) },
      _color2: { value: new Color(config.color2) },
      _color3: { value: new Color(config.color3) },
      opacity: { value: config.opacity },
      backgroundTexture: { value: null },
      useBackgroundTexture: { value: false },
      lightIntensity: { value: 0 },
    },
  })
}
export { vertexShader, fragmentShader }
