/**
 * Black Hole Renderer Materials
 * 
 * Shader materials for the accretion disk, event horizon,
 * star field, and gravitational lensing effects.
 */

import * as THREE from 'three'
import type {
  DiskShaderUniforms,
  StarShaderUniforms,
  EventHorizonShaderUniforms,
  LensingShaderUniforms,
  BlackHoleDiskColors,
  BlackHoleEffectsConfig,
} from './types.js'

// =====================================================
// ACCRETION DISK SHADER
// =====================================================

const diskVertexShader = `
  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;
  
  void main() {
    vUv = uv;
    vRadius = length(position.xy);
    vAngle = atan(position.y, position.x);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const diskFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorHot;
  uniform vec3 uColorMid1;
  uniform vec3 uColorMid2;
  uniform vec3 uColorMid3;
  uniform vec3 uColorOuter;
  uniform float uNoiseScale;
  uniform float uFlowSpeed;
  uniform float uDensity;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uAudioBass;
  uniform float uAudioMid;

  varying vec2 vUv;
  varying float vRadius;
  varying float vAngle;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    float normalizedRadius = smoothstep(uInnerRadius, uOuterRadius, vRadius);
    
    // Spiral pattern with audio influence on speed
    float audioSpeedMod = 1.0 + uAudioMid * 0.5;
    float spiral = vAngle * 3.0 - (1.0 / (normalizedRadius + 0.1)) * 2.0;
    vec2 noiseUv = vec2(
      vUv.x + uTime * uFlowSpeed * audioSpeedMod * (2.0 / (vRadius * 0.3 + 1.0)) + sin(spiral) * 0.1,
      vUv.y * 0.8 + cos(spiral) * 0.1
    );
    
    // Multi-octave noise
    float noiseVal1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.15));
    float noiseVal2 = snoise(vec3(noiseUv * uNoiseScale * 3.0 + 0.8, uTime * 0.22));
    float noiseVal3 = snoise(vec3(noiseUv * uNoiseScale * 6.0 + 1.5, uTime * 0.3));
    
    float noiseVal = (noiseVal1 * 0.45 + noiseVal2 * 0.35 + noiseVal3 * 0.2);
    noiseVal = (noiseVal + 1.0) * 0.5;
    
    // Color gradient based on radius
    vec3 color = uColorOuter;
    color = mix(color, uColorMid3, smoothstep(0.0, 0.25, normalizedRadius));
    color = mix(color, uColorMid2, smoothstep(0.2, 0.55, normalizedRadius));
    color = mix(color, uColorMid1, smoothstep(0.5, 0.75, normalizedRadius));
    color = mix(color, uColorHot, smoothstep(0.7, 0.95, normalizedRadius));
    
    color *= (0.5 + noiseVal * 1.0);
    
    // Brightness with audio bass influence
    float audioGlow = 1.0 + uAudioBass * 0.8;
    float brightness = pow(1.0 - normalizedRadius, 1.0) * 3.5 * audioGlow + 0.5;
    brightness *= (0.3 + noiseVal * 2.2);
    
    // Pulse animation
    float pulse = sin(uTime * 1.8 + normalizedRadius * 12.0 + vAngle * 2.0) * 0.15 + 0.85;
    brightness *= pulse;
    
    // Alpha with density
    float alpha = uDensity * (0.2 + noiseVal * 0.9);
    alpha *= smoothstep(0.0, 0.15, normalizedRadius);
    alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
    alpha = clamp(alpha, 0.0, 1.0);

    gl_FragColor = vec4(color * brightness, alpha);
  }
`

// =====================================================
// STAR FIELD SHADER
// =====================================================

const starVertexShader = `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkleSpeed;
  uniform float uAudioHigh;
  
  attribute float size;
  attribute float twinkle;
  
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    vColor = color;
    float audioTwinkle = 1.0 + uAudioHigh * 0.5;
    vTwinkle = sin(uTime * uTwinkleSpeed * audioTwinkle + twinkle) * 0.5 + 0.5;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying vec3 vColor;
  varying float vTwinkle;
  
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    alpha *= (0.2 + vTwinkle * 0.8);
    
    gl_FragColor = vec4(vColor, alpha);
  }
`

// =====================================================
// EVENT HORIZON SHADER
// =====================================================

const eventHorizonVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const eventHorizonFragmentShader = `
  uniform float uTime;
  uniform vec3 uCameraPosition;
  uniform float uGlowIntensity;
  uniform float uPulseSpeed;
  uniform float uAudioBass;
  
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vec3 viewDirection = normalize(uCameraPosition - vPosition);
    float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
    fresnel = pow(fresnel, 2.5);
    
    vec3 glowColor = vec3(1.0, 0.4, 0.1);
    float audioGlow = 1.0 + uAudioBass * 0.5;
    float pulse = sin(uTime * uPulseSpeed) * 0.15 + 0.85;
    
    gl_FragColor = vec4(glowColor * fresnel * pulse * uGlowIntensity * audioGlow, fresnel * 0.4);
  }
`

// =====================================================
// GRAVITATIONAL LENSING SHADER
// =====================================================

export const lensingShader = {
  uniforms: {
    tDiffuse: { value: null },
    blackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    lensingStrength: { value: 0.12 },
    lensingRadius: { value: 0.3 },
    aspectRatio: { value: 1.0 },
    chromaticAberration: { value: 0.005 },
  } as LensingShaderUniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 blackHoleScreenPos;
    uniform float lensingStrength;
    uniform float lensingRadius;
    uniform float aspectRatio;
    uniform float chromaticAberration;
    
    varying vec2 vUv;
    
    void main() {
      vec2 screenPos = vUv;
      vec2 toCenter = screenPos - blackHoleScreenPos;
      toCenter.x *= aspectRatio;
      float dist = length(toCenter);
      
      float distortionAmount = lensingStrength / (dist * dist + 0.003);
      distortionAmount = clamp(distortionAmount, 0.0, 0.7);
      float falloff = smoothstep(lensingRadius, lensingRadius * 0.3, dist);
      distortionAmount *= falloff;
      
      vec2 offset = normalize(toCenter) * distortionAmount;
      offset.x /= aspectRatio;
      
      vec2 distortedUvR = screenPos - offset * (1.0 + chromaticAberration);
      vec2 distortedUvG = screenPos - offset;
      vec2 distortedUvB = screenPos - offset * (1.0 - chromaticAberration);
      
      float r = texture2D(tDiffuse, distortedUvR).r;
      float g = texture2D(tDiffuse, distortedUvG).g;
      float b = texture2D(tDiffuse, distortedUvB).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
}

// =====================================================
// MATERIAL CREATION FUNCTIONS
// =====================================================

export function createDiskUniforms(
  innerRadius: number,
  outerRadius: number,
  colors: BlackHoleDiskColors,
  flowSpeed: number,
  noiseScale: number,
  density: number
): DiskShaderUniforms {
  return {
    uTime: { value: 0.0 },
    uColorHot: { value: new THREE.Color(colors.hot) },
    uColorMid1: { value: new THREE.Color(colors.mid1) },
    uColorMid2: { value: new THREE.Color(colors.mid2) },
    uColorMid3: { value: new THREE.Color(colors.mid3) },
    uColorOuter: { value: new THREE.Color(colors.outer) },
    uNoiseScale: { value: noiseScale },
    uFlowSpeed: { value: flowSpeed },
    uDensity: { value: density },
    uInnerRadius: { value: innerRadius },
    uOuterRadius: { value: outerRadius },
    uAudioBass: { value: 0.0 },
    uAudioMid: { value: 0.0 },
  }
}

export function createDiskMaterial(uniforms: DiskShaderUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader: diskVertexShader,
    fragmentShader: diskFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

export function createStarUniforms(
  pixelRatio: number,
  twinkleSpeed: number
): StarShaderUniforms {
  return {
    uTime: { value: 0.0 },
    uPixelRatio: { value: pixelRatio },
    uTwinkleSpeed: { value: twinkleSpeed },
    uAudioHigh: { value: 0.0 },
  }
}

export function createStarMaterial(uniforms: StarShaderUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

export function createEventHorizonUniforms(
  glowIntensity: number,
  pulseSpeed: number,
  cameraPosition: THREE.Vector3
): EventHorizonShaderUniforms {
  return {
    uTime: { value: 0.0 },
    uCameraPosition: { value: cameraPosition.clone() },
    uGlowIntensity: { value: glowIntensity },
    uPulseSpeed: { value: pulseSpeed },
    uAudioBass: { value: 0.0 },
  }
}

export function createEventHorizonMaterial(uniforms: EventHorizonShaderUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as { [uniform: string]: THREE.IUniform },
    vertexShader: eventHorizonVertexShader,
    fragmentShader: eventHorizonFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
}

export function createLensingUniforms(effects: BlackHoleEffectsConfig): LensingShaderUniforms {
  return {
    tDiffuse: { value: null },
    blackHoleScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    lensingStrength: { value: effects.lensingStrength },
    lensingRadius: { value: effects.lensingRadius },
    aspectRatio: { value: 1.0 },
    chromaticAberration: { value: effects.chromaticAberration },
  }
}

export function updateDiskColors(uniforms: DiskShaderUniforms, colors: BlackHoleDiskColors): void {
  uniforms.uColorHot.value.set(colors.hot)
  uniforms.uColorMid1.value.set(colors.mid1)
  uniforms.uColorMid2.value.set(colors.mid2)
  uniforms.uColorMid3.value.set(colors.mid3)
  uniforms.uColorOuter.value.set(colors.outer)
}
