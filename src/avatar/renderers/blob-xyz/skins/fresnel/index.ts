import { ShaderMaterial, Color, Vector3 } from 'three'
import vertexShader from './vertex.glsl?raw'
import fragmentShader from './fragment.glsl?raw'
import type { TricolorSkinConfig } from '../../types.js'

export function createFresnelSkin(config: TricolorSkinConfig): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: config.wireframe,
    lights: false,
    transparent: true,
    depthWrite: false,
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
      _color1: {
        value: new Color(config.color1),
      },
      _color2: {
        value: new Color(config.color2),
      },
      _color3: {
        value: new Color(config.color3),
      },
      opacity: {
        value: config.opacity,
      },
      backgroundTexture: {
        value: null,
      },
      useBackgroundTexture: {
        value: false,
      },
      lightIntensity: {
        value: 0,
      },
    },
  })
}

// Re-exported through `string`-annotated bindings on purpose. Exporting the imported
// bindings directly makes `tsc` write `import … from './vertex.glsl?raw'` into the emitted
// declaration, and no consumer's TypeScript can resolve that specifier — it needs an ambient
// `*.glsl?raw` module declaration this package does not ship. The annotation erases the
// dependency; the value is a string either way.
const vertexShaderSource: string = vertexShader
const fragmentShaderSource: string = fragmentShader
export { vertexShaderSource as vertexShader, fragmentShaderSource as fragmentShader }
