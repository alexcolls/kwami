/**
 * GLSL for the Jarvis renderer.
 *
 * Every HUD material draws premultiplied additive light: `rgb = colour * energy`,
 * `a = energy`. Additive light is order-independent, which is what lets dozens of transparent
 * layers at different depths overlap without sorting artefacts, and it is how a hologram
 * actually composes — light on light, never paint on paint.
 *
 * Thin lines are anti-aliased analytically from the screen-space footprint of the fragment,
 * and lines thinner than a pixel are widened to one pixel with their energy scaled down, so
 * they dim instead of shimmering in and out as the HUD rotates. Nothing here draws a pattern
 * at the pixel frequency (scanlines, per-pixel grain, fine grids): on a 1x display those
 * alias into moiré and read as a pixelated image.
 *
 * Motion is driven by three shared phases integrated on the CPU (so speed changes never make
 * anything jump): `uFlowPhase` moves light comets along the lines, `uWavePhase`/`uWaveAmp`
 * roll a radial energy wave through every layer, and `uStreamPhase` carries dust along the
 * spiral currents.
 */

import { Vector2 } from 'three'

const COMMON = /* glsl */ `
  #define TAU 6.28318530718
  #define PI 3.14159265359

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  float hash21(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Coverage of a band of the given half-width at distance d, given the pixel size.
  float aaBand(float d, float halfWidth, float px) {
    float w = max(halfWidth, px * 0.5);
    float coverage = 1.0 - smoothstep(w - px * 0.5, w + px * 0.5, d);
    return coverage * clamp(halfWidth / w, 0.0, 1.0);
  }

  // A light comet travelling around a circle: sharp head, exponential tail behind it.
  // along: 0..1 around the circle; count: comets per turn; phase: integrated flow; speed:
  // signed turns per unit of phase.
  float comet(float along, float count, float phase, float speed, float seed) {
    if (count < 0.5) return 0.0;
    float dir = speed < 0.0 ? -1.0 : 1.0;
    float f = fract(dir * along * count - phase * abs(speed) + seed);
    return pow(f, 26.0);
  }
`

// ---------------------------------------------------------------------------------------------
// HUD rings
// ---------------------------------------------------------------------------------------------

export const ringVertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const ringFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}

  varying vec2 vPos;

  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  uniform float uRadius;
  uniform float uWidth;
  uniform float uArcStart;
  uniform float uArcLength;
  uniform float uReveal;
  uniform float uDashCount;
  uniform float uDashDuty;
  uniform float uTickCount;
  uniform float uTickLength;
  uniform float uTickWidth;
  uniform float uMajorEvery;
  uniform float uMajorScale;
  uniform float uNodeCount;
  uniform float uNodeSize;
  uniform float uNodeDensity;
  uniform float uMeter;      // 1 for the voice meter ring
  uniform float uMeterValue; // 0..1 lit fraction
  uniform float uChase;      // 0..1 thinking chase amount
  uniform float uTime;
  uniform float uGain;
  uniform float uSeed;
  uniform float uRunners;
  uniform float uRunnerSpeed;
  uniform float uFlowPhase;
  uniform float uWaveAmp;
  uniform float uWavePhase;

  void main() {
    float r = length(vPos);
    float px = length(fwidth(vPos));
    float angle = atan(vPos.y, vPos.x);

    // Position along the arc, measured from its start.
    float rel = mod(angle - uArcStart, TAU);
    float arcLength = uArcLength * uReveal;
    if (rel > arcLength + 0.001) discard;
    float isFull = step(TAU - 0.001, arcLength);
    float endFade = smoothstep(0.0, 0.035, rel) * smoothstep(0.0, 0.035, arcLength - rel);
    endFade = mix(endFade, 1.0, isFull);

    float along = rel / TAU; // 0..1 around the full circle
    float pxAngular = px / max(r * TAU, 1e-4); // one pixel, in "turns"
    float dr = abs(r - uRadius);

    // Main line, optionally dashed.
    float solid = uWidth > 0.0 ? aaBand(dr, uWidth * 0.5, px) : 0.0;
    float line = solid;
    float segmentIndex = 0.0;
    if (uDashCount > 0.5) {
      float u = along * uDashCount;
      segmentIndex = floor(u);
      float f = fract(u);
      float fw = pxAngular * uDashCount;
      float dash = smoothstep(0.0, fw, f) * (1.0 - smoothstep(uDashDuty - fw, uDashDuty, f));
      line *= dash;
    }

    // Tick marks.
    float ticks = 0.0;
    if (uTickCount > 0.5) {
      float t = along * uTickCount;
      float index = floor(t + 0.5);
      float distanceAcross = abs(t - index) / uTickCount * TAU * r;
      float isMajor = 0.0;
      if (uMajorEvery > 0.5 && mod(index, uMajorEvery) < 0.5) isMajor = 1.0;
      float len = uTickLength * mix(1.0, uMajorScale, isMajor);
      float lo = min(uRadius, uRadius + len);
      float hi = max(uRadius, uRadius + len);
      float radial = smoothstep(lo - px, lo, r) * (1.0 - smoothstep(hi, hi + px, r));
      ticks = radial * aaBand(distanceAcross, uTickWidth * 0.5 * mix(1.0, 1.5, isMajor), px);
      ticks *= mix(0.7, 1.0, isMajor);
    }

    // Circuit nodes: small outlined rectangles sitting on the line.
    float nodes = 0.0;
    if (uNodeCount > 0.5) {
      float n = along * uNodeCount;
      float index = floor(n + 0.5);
      float present = step(1.0 - uNodeDensity, hash11(index * 7.13 + uSeed * 31.7));
      vec2 q = vec2(abs(n - index) / uNodeCount * TAU * r, dr);
      vec2 d = q - vec2(uNodeSize, uNodeSize * 0.42);
      float sdf = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      float outline = aaBand(abs(sdf), max(uWidth, 0.003) * 0.5, px);
      float fill = (1.0 - smoothstep(-px, px, sdf)) * 0.3;
      nodes = present * max(outline, fill);
    }

    float energy = max(max(line, ticks), nodes);

    // Voice meter / thinking chase.
    float hot = 0.0;
    if (uMeter > 0.5) {
      float segments = max(1.0, uDashCount * (uArcLength / TAU));
      float position = segmentIndex / segments;
      float lit = step(position, uMeterValue);
      float head = fract(uTime * 0.55);
      float trail = fract(head - position);
      float chase = exp(-trail * 7.0) * uChase;
      float flicker = step(0.965, hash11(segmentIndex * 3.7 + floor(uTime * 14.0)));
      energy *= mix(0.16, 1.0, max(max(lit, chase), flicker * 0.6));
      hot = max(lit * smoothstep(0.75, 1.0, uMeterValue), chase * 0.6);
    }

    // Light comets: ride the line (dashes included) with a soft halo that bridges the gaps,
    // so the light reads as travelling through the structure.
    float c = comet(along, uRunners, uFlowPhase, uRunnerSpeed, uSeed);
    float halo = aaBand(dr, max(uWidth, 0.003) * 2.2 + 0.004, px) * 0.35;
    float runner = c * (max(line, ticks * 0.7) * 2.4 + halo + nodes * 0.8);
    hot = max(hot, c);

    // Radial energy wave rolling outward through every ring.
    float wave = 1.0 + uWaveAmp * sin(uRadius * 7.0 - uWavePhase);

    energy = (energy * wave + runner) * endFade * uOpacity * uGain;
    vec3 colour = mix(uColor, uHot, clamp(hot, 0.0, 1.0));
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Ring walls (open cylinders extruded behind a ring)
// ---------------------------------------------------------------------------------------------

export const wallVertexShader = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vViewNormal;
  void main() {
    vLocal = position;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const wallFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}

  varying vec3 vLocal;
  varying vec3 vViewNormal;

  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  uniform float uHeight;
  uniform float uArcStart;
  uniform float uArcLength;
  uniform float uReveal;
  uniform float uDashCount;
  uniform float uDashDuty;
  uniform float uRunners;
  uniform float uRunnerSpeed;
  uniform float uFlowPhase;
  uniform float uSeed;
  uniform float uGain;
  uniform float uWaveAmp;
  uniform float uWavePhase;
  uniform float uRadius;

  void main() {
    float angle = atan(vLocal.y, vLocal.x);
    float rel = mod(angle - uArcStart, TAU);
    float arcLength = uArcLength * uReveal;
    if (rel > arcLength + 0.001) discard;
    float along = rel / TAU;

    // 0 at the back rim, 1 at the front rim (the ring plane).
    float h = clamp(vLocal.z / uHeight + 0.5, 0.0, 1.0);
    float px = fwidth(h);
    float frontRim = 1.0 - smoothstep(0.0, max(px * 1.5, 0.04), 1.0 - h);
    float backRim = 1.0 - smoothstep(0.0, max(px * 1.5, 0.04), h);
    float fill = 0.04 + 0.22 * h * h * h;

    float dash = 1.0;
    if (uDashCount > 0.5) {
      float f = fract(along * uDashCount);
      float fw = fwidth(along * uDashCount);
      dash = smoothstep(0.0, fw, f) * (1.0 - smoothstep(uDashDuty - fw, uDashDuty, f));
    }

    // Walls are glass: brightest where seen at a grazing angle, nearly invisible face-on.
    float grazing = 1.0 - abs(vViewNormal.z);
    float body = (frontRim * 0.9 + backRim * 0.5 + fill * (0.4 + grazing)) * dash;

    float c = comet(along, uRunners, uFlowPhase, uRunnerSpeed, uSeed);
    float wave = 1.0 + uWaveAmp * sin(uRadius * 7.0 - uWavePhase);

    float energy = (body * wave + c * (frontRim * 2.0 + fill * 2.5)) * uOpacity * uGain;
    vec3 colour = mix(uColor, uHot, clamp(c, 0.0, 1.0));
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Reactor blocks (instanced boxes)
// ---------------------------------------------------------------------------------------------

export const reactorVertexShader = /* glsl */ `
  ${COMMON}

  attribute vec4 aBlock; // angle, radius, arc, thickness
  attribute vec4 aMeta;  // row, seed, z, kind
  attribute float aDepth;

  uniform sampler2D uSpectrum;
  uniform float uTime;
  uniform float uRotation;
  uniform float uReactivity;
  uniform float uLevel;
  uniform float uFocus;
  uniform float uBoot;
  uniform float uRowCount;
  uniform float uPointerAngle;
  uniform float uPointerNear;
  uniform float uWaveAmp;
  uniform float uWavePhase;

  varying vec2 vUv;
  varying float vSeed;
  varying float vEnergy;
  varying float vKind;
  varying float vVisible;
  varying float vFace;
  varying float vDepthT;
  varying float vWave;

  void main() {
    float worldAngle = aBlock.x + uRotation;
    // Mirror around the vertical axis: 0 at 12 o'clock, 1 at 6 o'clock.
    float fromTop = abs(atan(sin(worldAngle - PI * 0.5), cos(worldAngle - PI * 0.5))) / PI;
    float spectrum = texture2D(uSpectrum, vec2(0.015 + fromTop * 0.97, 0.5)).r;

    // Blocks under the pointer lift toward it.
    float toPointer = atan(sin(worldAngle - uPointerAngle), cos(worldAngle - uPointerAngle));
    float near = exp(-toPointer * toPointer * 30.0) * uPointerNear;

    float drive = spectrum * uReactivity;
    float rowOut = aMeta.x / max(1.0, uRowCount - 1.0); // 0 inner .. 1 outer
    float push = (drive + near * 0.4) * (0.02 + 0.09 * rowOut);
    float jitter = (hash11(aMeta.y * 91.7 + floor(uTime * 9.0)) - 0.5) * 0.008 * uLevel;

    float thickness = aBlock.w * (1.0 + drive * 0.7);
    float radius = (aBlock.y + push + jitter) * uFocus + position.y * thickness;
    // Minus keeps the box right-handed after the polar mapping, so front-face culling holds.
    float angle = aBlock.x - position.x * aBlock.z;
    // Extrusion toward the camera: the voice raises the reactor into a 3D equaliser.
    float depth = aDepth * (1.0 + drive * 2.8 + near * 2.2) * (0.3 + 0.7 * uBoot);
    float z = aMeta.z + (position.z + 0.5) * depth;

    // Boot: blocks are drawn in as a sweep that starts at 12 o'clock and runs clockwise.
    float sweep = mod(PI * 0.5 - aBlock.x, TAU) / TAU;
    vVisible = smoothstep(sweep, sweep + 0.06, uBoot * 1.06);

    vec3 p = vec3(cos(angle) * radius, sin(angle) * radius, z);
    vUv = uv;
    vSeed = aMeta.y;
    vEnergy = clamp(drive + near * 0.5, 0.0, 1.6);
    vKind = aMeta.w;
    vFace = abs(normal.z);
    vDepthT = position.z + 0.5;
    vWave = 1.0 + uWaveAmp * sin(aBlock.y * 7.0 - uWavePhase);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

export const reactorFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}

  uniform vec3 uPrimary;
  uniform vec3 uHot;
  uniform vec3 uAlert;
  uniform float uTime;
  uniform float uGain;

  varying vec2 vUv;
  varying float vSeed;
  varying float vEnergy;
  varying float vKind;
  varying float vVisible;
  varying float vFace;
  varying float vDepthT;
  varying float vWave;

  void main() {
    // Edge anti-aliasing in UV space.
    vec2 fw = fwidth(vUv) * 1.25;
    vec2 edge = smoothstep(vec2(0.0), fw, vUv) * smoothstep(vec2(0.0), fw, 1.0 - vUv);
    float coverage = edge.x * edge.y;

    // Box edges glow like a hologram wireframe.
    float rim = max(abs(vUv.x - 0.5), abs(vUv.y - 0.5)) * 2.0;
    float edges = smoothstep(0.62, 1.0, rim);

    float body;
    if (vFace > 0.5) {
      // Front/back faces: data cells that re-roll at a per-block rate.
      vec2 cell = floor(vUv * vec2(9.0, 3.0));
      float rate = 5.0 + vSeed * 11.0;
      float data = hash21(cell + vSeed * 17.0 + floor(uTime * rate));
      body = mix(0.62, 1.0, data) * (0.8 + 0.35 * edges);
    } else {
      // Sides: dimmer, fading toward the back so the depth reads as light falling off.
      body = (0.06 + 0.26 * vDepthT * vDepthT) * (0.5 + 0.9 * edges);
    }

    float flicker = 0.8 + 0.2 * sin(uTime * (2.5 + vSeed * 7.0) + vSeed * 40.0);
    float spark = step(0.985, hash11(vSeed * 91.0 + floor(uTime * 4.0)));
    float hot = clamp(smoothstep(0.7, 1.25, vEnergy) + spark, 0.0, 1.0);

    vec3 colour = mix(uPrimary, uHot, hot * 0.6);
    colour = mix(colour, uAlert, vKind);

    float energy = body * flicker * vWave * (0.95 + vEnergy * 0.85 + spark * 1.5) * uGain;
    energy *= coverage * vVisible * mix(1.0, 0.8, vKind);
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Holographic globe (dotted latitude/longitude sphere inside the chamber)
// ---------------------------------------------------------------------------------------------

export const globeVertexShader = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uRadius;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDistance;
  uniform float uLevel;
  uniform float uReveal;
  varying float vAlpha;
  void main() {
    vec3 p = position * uRadius * (1.0 + uLevel * 0.06);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Points on the near hemisphere are brighter: depth you can read without moving.
    float facing = normalize(mat3(modelViewMatrix) * position).z * 0.5 + 0.5;
    // A scan band sweeping pole to pole.
    float scan = exp(-pow((position.y - sin(uTime * 0.55)) * 7.0, 2.0));
    float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aSeed * 50.0);
    // Revealed from the equator outward.
    float reveal = smoothstep(abs(position.y) - 0.1, abs(position.y), uReveal * 1.1);
    gl_PointSize = uSize * uPixelRatio * (uDistance / max(-mv.z, 0.1)) * (0.8 + scan * 0.6);
    vAlpha = (0.12 + 0.88 * facing * facing) * twinkle * (1.0 + scan * 1.8 + uLevel * 0.8) * reveal;
  }
`

export const globeFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.15, 0.5, d);
    float energy = core * vAlpha * uOpacity;
    gl_FragColor = vec4(uColor * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Radial FX plane: core halo, radar sweep, shockwaves, hover highlight
// ---------------------------------------------------------------------------------------------

export const fxVertexShader = ringVertexShader

export const fxFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}

  varying vec2 vPos;

  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uHot;
  uniform float uTime;
  uniform float uCore;
  uniform float uSweep;
  uniform float uSweepAngle;
  uniform float uHover;
  uniform float uLevel;
  uniform float uWaveAmp;
  uniform float uWavePhase;
  uniform vec4 uWaves[4]; // radius, strength, width, unused

  void main() {
    float r = length(vPos);
    float angle = atan(vPos.y, vPos.x);
    vec3 colour = vec3(0.0);

    // Core halo: a tight hot point, a small corona and a faint wide falloff. Kept small on
    // purpose: the reference reads as a dark chamber with a single bright dot in it.
    float halo = exp(-r * r * 420.0) * 1.1 + exp(-r * r * 45.0) * 0.2 + exp(-r * r * 5.0) * 0.03;
    colour += mix(uPrimary, uHot, exp(-r * r * 900.0)) * halo * uCore;

    // Faint glass tint inside the reactor.
    float glass = (1.0 - smoothstep(0.55, 0.78, r)) * (0.018 + uLevel * 0.04);
    colour += uSecondary * glass;

    // Energy field under the reactor band, breathing with the radial wave.
    float wave = 1.0 + uWaveAmp * sin(0.89 * 7.0 - uWavePhase);
    float field = exp(-pow((r - 0.89) / 0.075, 2.0));
    colour += uPrimary * field * (0.07 + uLevel * 0.14) * wave;

    // Radar sweep: bright head, exponential trail behind it.
    if (uSweep > 0.001) {
      float behind = mod(uSweepAngle - angle, TAU);
      // Confined to the inner chamber: a radar scope inside the reactor, not a searchlight.
      float band = smoothstep(0.12, 0.16, r) * (1.0 - smoothstep(0.7, 0.75, r));
      float trail = exp(-behind * 3.2) * 0.2;
      float head = exp(-behind * 140.0) * 1.1;
      float rings = 0.82 + 0.18 * sin(r * 140.0);
      colour += uPrimary * band * (trail * rings + head) * uSweep;
    }

    // Shockwaves.
    for (int i = 0; i < 4; i++) {
      vec4 shock = uWaves[i];
      if (shock.y > 0.001) {
        float d = (r - shock.x) / shock.z;
        // Sharp leading edge, soft trailing wake, faded out as it leaves the HUD.
        float ring = (d > 0.0 ? exp(-d * d * 4.0) : exp(-d * d * 0.6)) * shock.y;
        float fade = 1.0 - smoothstep(1.6, 3.4, shock.x);
        colour += mix(uPrimary, uHot, 0.25) * ring * fade;
      }
    }

    // Hover highlight over the reactor ring.
    float hoverBand = exp(-pow((r - 0.89) / 0.09, 2.0));
    colour += uPrimary * hoverBand * uHover * 0.22;

    float energy = max(max(colour.r, colour.g), colour.b);
    gl_FragColor = vec4(colour, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Core sphere
// ---------------------------------------------------------------------------------------------

export const coreVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

export const coreFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uPrimary;
  uniform vec3 uHot;
  uniform float uCore;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float facing = clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0);
    float rim = pow(1.0 - facing, 2.0);
    vec3 colour = mix(uHot, uPrimary, rim) * (0.85 + rim * 1.1) * uCore;
    float energy = max(max(colour.r, colour.g), colour.b);
    gl_FragColor = vec4(colour, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Circuit traces (ribbons) and pads
// ---------------------------------------------------------------------------------------------

export const traceVertexShader = /* glsl */ `
  attribute float aDist;
  attribute float aSide;
  attribute vec4 aTrace; // length, seed, boost, line half-width
  varying float vDist;
  varying float vSide;
  varying vec4 vTrace;
  varying float vRadius;
  void main() {
    vDist = aDist;
    vSide = aSide;
    vTrace = aTrace;
    vRadius = length(position.xy);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const traceFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}

  uniform vec3 uColor;
  uniform vec3 uPulseColor;
  uniform float uTime;
  uniform float uFlow;      // +1 outward (speaking), -1 inward (listening)
  uniform float uFlowPhase; // integrated on the CPU so speed changes never jump the pulses
  uniform float uPulse;
  uniform float uOpacity;
  uniform float uReveal;
  uniform float uWaveAmp;
  uniform float uWavePhase;

  varying float vDist;
  varying float vSide;
  varying vec4 vTrace;
  varying float vRadius;

  void main() {
    float len = vTrace.x;
    float seed = vTrace.y;
    float boost = vTrace.z;

    // vSide is the world-space offset from the centre line; the ribbon is wider than the line
    // so a one-pixel trace never loses fragments to rasterisation.
    float across = aaBand(abs(vSide), vTrace.w, fwidth(vSide));
    float glow = aaBand(abs(vSide), vTrace.w * 3.0, fwidth(vSide)) * 0.25;

    // Drawn in from the ring outward during boot.
    float reveal = 1.0 - smoothstep(uReveal * (len + 0.2) - 0.2, uReveal * (len + 0.2), vDist);

    float base = 0.24 * smoothstep(0.0, 0.06, vDist);

    // Pulses: a sharp head with an exponential tail behind it.
    float s = uFlow >= 0.0 ? vDist : len - vDist;
    float phase = uFlowPhase * (0.45 + seed * 0.55);
    float period = len + 0.8;
    float head = mod(phase + seed * period, period) - 0.4;
    float d = head - s;
    float pulse = d > 0.0 ? exp(-d * 9.0) : exp(d * 70.0);
    // Second, offset pulse on longer traces.
    float head2 = mod(phase + (seed + 0.5) * period, period) - 0.4;
    float d2 = head2 - s;
    pulse = max(pulse, (d2 > 0.0 ? exp(-d2 * 9.0) : exp(d2 * 70.0)) * step(1.0, len));

    float wave = 1.0 + uWaveAmp * sin(vRadius * 7.0 - uWavePhase);
    float energy = (base * uOpacity * wave * across + pulse * uPulse * (across + glow)) * boost * reveal;
    vec3 colour = mix(uColor, uPulseColor, clamp(pulse * uPulse, 0.0, 1.0));
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

export const padVertexShader = /* glsl */ `
  attribute vec4 aPad; // x, y, size, seed
  uniform float uTime;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    vUv = position.xy + 0.5;
    vSeed = aPad.w;
    vec3 p = vec3(aPad.xy + position.xy * aPad.z, 0.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

export const padFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uReveal;
  varying vec2 vUv;
  varying float vSeed;
  void main() {
    vec2 q = abs(vUv - 0.5) * 2.0;
    float sdf = max(q.x, q.y);
    float px = fwidth(sdf);
    float outline = 1.0 - smoothstep(0.16, 0.16 + px * 1.5, abs(sdf - 0.78));
    float centre = 1.0 - smoothstep(0.28, 0.28 + px * 1.5, sdf);
    // Smooth blink rather than an on/off step: it breathes instead of strobing.
    float blink = 0.55 + 0.45 * smoothstep(-0.4, 0.4, sin(uTime * (1.5 + vSeed * 3.0) + vSeed * 40.0));
    float energy = (outline * 0.55 + centre * blink * 0.7) * uOpacity * uReveal;
    gl_FragColor = vec4(uColor * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Markers (notch bracket, square, carets)
// ---------------------------------------------------------------------------------------------

export const markerVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const markerFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uShape; // 0 bracket, 1 square, 2 caret
  uniform float uOpacity;
  uniform float uTime;
  uniform float uLevel;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float energy = 0.0;
    float hot = 0.0;
    if (uShape < 0.5) {
      // Bracket box with a hot centre slot.
      vec2 q = abs(p) * 2.0;
      float box = max(q.x, q.y);
      float px = fwidth(box);
      float outline = 1.0 - smoothstep(0.08, 0.08 + px * 1.5, abs(box - 0.86));
      // Open the long sides in the middle so it reads as brackets, not a box.
      outline *= step(0.42, q.x);
      float slot = (1.0 - smoothstep(0.22, 0.3, q.x)) * (1.0 - smoothstep(0.32, 0.42, q.y));
      energy = outline * 0.9 + slot * (1.6 + uLevel * 2.0);
      hot = slot;
    } else if (uShape < 1.5) {
      vec2 q = abs(p) * 2.0;
      float box = max(q.x, q.y);
      float px = fwidth(box);
      energy = (1.0 - smoothstep(0.8, 0.8 + px * 1.5, box)) * (1.4 + 0.4 * sin(uTime * 3.0));
      hot = 1.0;
    } else {
      // Caret pointing down (+y is outward before rotation).
      float y = p.y + 0.5;
      float halfWidth = y * 0.5;
      float d = abs(p.x) - halfWidth;
      float px = fwidth(d);
      float fill = (1.0 - smoothstep(0.0, px * 1.5, d)) * step(0.0, y) * step(y, 1.0);
      energy = fill * 1.1;
    }
    energy *= uOpacity;
    vec3 colour = mix(uColor, uHot, clamp(hot, 0.0, 1.0));
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Crosshair lines
// ---------------------------------------------------------------------------------------------

export const crosshairFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}
  uniform vec3 uColor;
  uniform float uPlaneHeight;
  uniform float uLineHalf;
  uniform float uOpacity;
  uniform float uHalfLength;
  uniform float uReveal;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float x = abs((vUv.x - 0.5) * 2.0 * uHalfLength);
    float across = abs(vUv.y - 0.5) * uPlaneHeight;
    float line = aaBand(across, uLineHalf, fwidth(across));

    float gapCore = smoothstep(0.09, 0.12, x);
    float inside = 1.0 - smoothstep(0.72, 0.76, x);
    float outside = smoothstep(1.08, 1.14, x) * (1.0 - smoothstep(1.3, uHalfLength, x));
    // Outer dashes march outward, like data leaving the core.
    float f = fract(x * 7.0 - uTime * 0.9);
    float fw = fwidth(x * 7.0);
    float march = smoothstep(0.45 - fw, 0.45, f) * (1.0 - smoothstep(1.0 - fw, 1.0, f));
    float dashes = mix(1.0, march, step(2.1, x));
    float energy = (inside * 0.3 + outside * 0.22 * dashes) * gapCore;
    energy *= line * uOpacity * step(x, uReveal * uHalfLength);
    gl_FragColor = vec4(uColor * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Labels (canvas-rendered text as an alpha mask)
// ---------------------------------------------------------------------------------------------

export const labelFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform vec3 uHot;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vec4 texel = texture2D(uMap, vUv);
    // Red carries body text, green carries highlighted text (drawn hotter).
    float body = texel.r;
    float hot = texel.g;
    // A slow refresh shimmer rather than texel-frequency scanlines (those alias on 1x screens).
    float shimmer = 0.93 + 0.07 * sin(uTime * 2.3 - vUv.y * 5.0);
    float energy = (body * 1.25 + hot * 2.2) * shimmer * uOpacity;
    vec3 colour = mix(uColor, uHot, clamp(hot, 0.0, 1.0) * 0.7);
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Particles
// ---------------------------------------------------------------------------------------------

export const dustVertexShader = /* glsl */ `
  attribute vec4 aDust; // radius, angle, z, seed
  attribute float aKind;
  attribute float aStream;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uLevel;
  uniform float uDistance;
  uniform float uStreamPhase;
  uniform vec2 uPointer;
  uniform float uPointerAmt;
  varying float vAlpha;
  varying float vKind;
  void main() {
    float seed = aDust.w;
    vec3 p;
    float life = 1.0;
    if (aStream > 0.5) {
      // Spiral current: born on the reactor, carried out along a log spiral (or drawn in when
      // the phase runs backwards while listening), fading at both ends of its path.
      float u = fract(seed * 7.31 + uStreamPhase * (0.35 + seed * 0.65));
      float radius = mix(0.95, 4.8, u);
      float angle = aDust.y + u * 2.4 + uTime * 0.03;
      p = vec3(cos(angle) * radius, sin(angle) * radius, aDust.z * u);
      life = sin(u * 3.14159265);
    } else {
      float radius = aDust.x;
      float angle = aDust.y + uTime * uSpeed * (0.015 + 0.05 / (0.5 + radius));
      radius *= 1.0 + 0.015 * sin(uTime * 0.23 + seed * 31.0);
      p = vec3(cos(angle) * radius, sin(angle) * radius, aDust.z);
    }

    // Gentle turbulence so nothing moves on rails.
    p += 0.07 * vec3(
      sin(uTime * 0.61 + seed * 13.0 + p.y * 1.3),
      cos(uTime * 0.53 + seed * 7.0 + p.x * 1.1),
      sin(uTime * 0.47 + seed * 3.0)
    );

    // Pointer vortex: particles part around the cursor and swirl past it.
    vec2 d = p.xy - uPointer;
    float influence = exp(-dot(d, d) / 0.5) * uPointerAmt;
    vec2 dir = d / max(length(d), 1e-3);
    p.xy += dir * influence * 0.3 + vec2(-dir.y, dir.x) * influence * 0.45;

    // The voice pushes the dust off the reactor rim.
    float rr = length(p.xy);
    p.xy *= 1.0 + uLevel * 0.09 * exp(-pow(rr - 1.0, 2.0) * 3.0);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.5 + 0.5 * sin(uTime * (0.8 + seed * 3.2) + seed * 60.0);
    float size = uSize * (0.45 + seed * 1.3) * (1.0 + aKind * 0.4) * (1.0 + influence * 0.8);
    gl_PointSize = size * uPixelRatio * (uDistance / max(-mv.z, 0.1));
    float fadeNear = smoothstep(0.3, 1.2, length(p.xy));
    vAlpha = (0.18 + 0.82 * twinkle * twinkle) * (0.5 + uLevel * 0.9 + influence * 1.4) * fadeNear * life;
    vKind = aKind;
  }
`

export const bokehVertexShader = /* glsl */ `
  attribute vec4 aDust; // x, y, z, seed
  attribute float aKind;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uLevel;
  uniform float uDistance;
  varying float vAlpha;
  varying float vKind;
  void main() {
    vec3 p = aDust.xyz;
    p.x += sin(uTime * 0.07 + aDust.w * 20.0) * 0.18;
    p.y += sin(uTime * 0.05 + aDust.w * 11.0) * 0.1;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.35 + aDust.w * 0.65) * uPixelRatio * (uDistance / max(-mv.z, 0.1));
    float breathe = 0.65 + 0.35 * sin(uTime * (0.3 + aDust.w * 0.5) + aDust.w * 9.0);
    vAlpha = (0.02 + aDust.w * 0.045) * breathe * (1.0 + uLevel * 0.6);
    vKind = aKind;
  }
`

export const dustFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uAlert;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vKind;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.0, 0.5, d);
    core *= core;
    float energy = core * vAlpha * uOpacity;
    vec3 colour = mix(uColor, uAlert, vKind);
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

export const bokehFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uAlert;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vKind;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    // Lens bokeh: flat disc with a slightly brighter rim.
    float disc = 1.0 - smoothstep(0.44, 0.5, d);
    float rim = smoothstep(0.3, 0.47, d) * 0.5 + 0.5;
    float energy = disc * rim * vAlpha * uOpacity;
    vec3 colour = mix(uColor, uAlert, vKind);
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

export const sparkVertexShader = /* glsl */ `
  attribute float aLife; // 1 at birth -> 0 at death
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDistance;
  varying float vLife;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aLife > 0.0 ? uSize * (0.5 + aLife) * uPixelRatio * (uDistance / max(-mv.z, 0.1)) : 0.0;
    vLife = aLife;
  }
`

export const sparkFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uHot;
  varying float vLife;
  void main() {
    if (vLife <= 0.0) discard;
    float d = length(gl_PointCoord - 0.5);
    float core = 1.0 - smoothstep(0.0, 0.5, d);
    float energy = core * core * vLife * 2.2;
    vec3 colour = mix(uColor, uHot, vLife);
    gl_FragColor = vec4(colour * energy, clamp(energy, 0.0, 1.0));
  }
`

// ---------------------------------------------------------------------------------------------
// Backdrop (full-screen, drawn first)
// ---------------------------------------------------------------------------------------------

export const backdropVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Clip-space quad at the far plane: ignores the camera entirely.
    gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0);
  }
`

export const backdropFragmentShader = /* glsl */ `
  precision highp float;
  ${COMMON}
  uniform vec3 uBase;
  uniform vec3 uGlow;
  uniform vec3 uSecondary;
  uniform vec2 uResolution;
  uniform vec2 uCenter; // HUD centre in UV
  uniform float uTime;
  uniform float uLevel;
  varying vec2 vUv;
  void main() {
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (vUv - uCenter) * aspect;
    float r = length(p);
    vec3 colour = uBase;
    colour += uGlow * (exp(-r * r * 1.4) * 0.4 + exp(-r * r * 7.0) * 0.1) * (1.0 + uLevel * 0.35);
    colour += uGlow * 0.3 * exp(-pow((vUv.y - 0.12) * 4.0, 2.0)); // low horizon haze
    // Edge falloff.
    colour *= mix(0.55, 1.0, 1.0 - smoothstep(0.25, 1.25, r));
    // Ordered dither (sub-LSB) so the dark gradient never bands into visible steps.
    colour += (hash21(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(colour, 1.0);
  }
`

// ---------------------------------------------------------------------------------------------
// Post-processing: hologram pass (aberration, glitch, grain, vignette)
// ---------------------------------------------------------------------------------------------

export const hologramShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uAberration: { value: 0.0004 },
    uGrain: { value: 0 },
    uVignette: { value: 0.35 },
    uGlitch: { value: 0 },
    uFlicker: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    ${COMMON}
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uAberration;
    uniform float uGrain;
    uniform float uVignette;
    uniform float uGlitch;
    uniform float uFlicker;
    varying vec2 vUv;

    void main() {
      vec2 uv = vUv;

      // Glitch: displace a few horizontal slices sideways for a handful of frames.
      if (uGlitch > 0.001) {
        float slice = floor(uv.y * 28.0) + floor(uTime * 24.0) * 7.0;
        float pick = hash11(slice);
        if (pick < uGlitch * 0.4) {
          uv.x += (hash11(slice + 3.1) - 0.5) * 0.07 * uGlitch;
        }
      }

      vec2 centred = uv - 0.5;
      float dist = length(centred);
      vec4 base = texture2D(tDiffuse, uv);
      vec3 colour = base.rgb;
      // Chromatic aberration only toward the edges and on glitches: the centre stays sharp.
      if (uAberration > 0.00001) {
        vec2 shift = centred * uAberration * dist * 2.4 * (1.0 + uGlitch * 6.0);
        colour.r = texture2D(tDiffuse, uv + shift).r;
        colour.b = texture2D(tDiffuse, uv - shift).b;
      }

      // Slow rolling refresh band, far wider than a pixel.
      float roll = exp(-pow((fract(uv.y - uTime * 0.05) - 0.5) * 18.0, 2.0));
      colour *= 1.0 + roll * 0.035;

      if (uGrain > 0.0) colour += (hash21(uv * uResolution + fract(uTime) * 100.0) - 0.5) * uGrain;
      colour *= mix(1.0, 1.0 - smoothstep(0.3, 0.95, dist), uVignette);
      colour *= uFlicker;

      gl_FragColor = vec4(max(colour, 0.0), base.a);
    }
  `,
}
