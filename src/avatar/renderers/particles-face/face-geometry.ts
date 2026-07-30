import type { FaceRegion } from './types'

/**
 * Generates a realistic 3D human face as a dense particle surface.
 * Uses a 2D grid filtered to an egg-shaped outline, with Z-depth computed
 * from anatomical features (dome, eye sockets, nose, lips, chin, etc.)
 */
export function generateFaceGeometry(
  particleCount: number,
  faceScale: number,
  depthSpread: number,
  ambientCount: number,
  ambientRadius: number,
): { positions: Float32Array; regions: FaceRegion[]; totalCount: number } {
  const allPoints: number[] = []
  const regionBuckets = new Map<string, { indices: number[]; basePositions: number[] }>()
  const names = [
    'forehead', 'leftEyebrow', 'rightEyebrow',
    'leftEye', 'rightEye', 'nose',
    'cheeks', 'mouth', 'mouthInner',
    'chin', 'faceSurface', 'ambient',
  ]
  for (const n of names) regionBuckets.set(n, { indices: [], basePositions: [] })

  let idx = 0
  const push = (region: string, x: number, y: number, z: number) => {
    const sx = x * faceScale
    const sy = y * faceScale
    const sz = z * faceScale
    allPoints.push(sx, sy, sz)
    const b = regionBuckets.get(region)!
    b.indices.push(idx)
    b.basePositions.push(sx, sy, sz)
    idx++
  }

  const targetSurfaceCount = Math.max(2500, particleCount)
  const cols = Math.max(80, Math.round(Math.sqrt(targetSurfaceCount * 0.75)))
  const rows = Math.max(110, Math.round(Math.sqrt(targetSurfaceCount * 1.35)))

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = ((col / (cols - 1)) * 2 - 1)
      const y = 1.1 - (row / (rows - 1)) * 2.3 // y from +1.1 (top) to -1.2 (chin)

      const hw = faceHalfWidth(y)
      if (hw <= 0.01 || Math.abs(x) > hw) continue

      const z = faceDepth(x, y) * depthSpread
      const region = classify(x, y)
      push(region, x, y, z)
    }
  }

  // Ambient scatter
  for (let i = 0; i < ambientCount; i++) {
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2
    const r = (0.6 + Math.random() * 0.8) * ambientRadius
    push('ambient',
      r * Math.sin(phi) * Math.cos(theta) / faceScale,
      r * Math.sin(phi) * Math.sin(theta) / faceScale,
      r * Math.cos(phi) * 0.2 / faceScale,
    )
  }

  const regions: FaceRegion[] = []
  for (const n of names) {
    const b = regionBuckets.get(n)!
    if (b.indices.length === 0) continue
    regions.push({ name: n, indices: b.indices, basePositions: new Float32Array(b.basePositions) })
  }

  return { positions: new Float32Array(allPoints), regions, totalCount: idx }
}

// =============================================================================
// FACE OUTLINE - egg shaped, wider at cheeks, narrow at chin
// =============================================================================

function faceHalfWidth(y: number): number {
  if (y > 1.0) {
    const t = (y - 1.0) / 0.1
    return Math.max(0, 0.45 * (1 - t))
  }
  if (y > 0.4) {
    // Forehead
    const t = (y - 0.4) / 0.6
    return 0.62 - t * 0.17
  }
  if (y > -0.1) {
    // Mid-face / cheekbones - widest
    return 0.62 + (0.1 - Math.abs(y - 0.1)) * 0.06
  }
  if (y > -0.6) {
    // Lower cheeks to jaw
    const t = (-y - 0.1) / 0.5
    return 0.64 * (1 - t * 0.35)
  }
  if (y > -1.0) {
    // Jaw taper
    const t = (-y - 0.6) / 0.4
    return 0.42 * (1 - t * 0.55)
  }
  // Chin point
  const t = (-y - 1.0) / 0.2
  return Math.max(0, 0.19 * (1 - t))
}

// =============================================================================
// DEPTH MAP - computes Z for each face point
// =============================================================================

function faceDepth(x: number, y: number): number {
  const hw = faceHalfWidth(y)
  if (hw < 0.01) return 0
  const nx = x / hw // normalized x: -1 to 1 within face

  // Base dome: sphere-like curvature
  let z = Math.sqrt(Math.max(0, 1 - nx * nx * 0.85)) * 0.55

  // Vertical curvature (rounder at top, flatter at bottom)
  const vy = (y + 0.1) / 1.2
  z *= 0.6 + 0.4 * Math.sqrt(Math.max(0, 1 - vy * vy * 0.4))

  // Brow ridge
  z += bump2d(x, y, 0, 0.38, 0.35, 0.05) * 0.08
  z += bump2d(x, y, -0.3, 0.35, 0.12, 0.04) * 0.06
  z += bump2d(x, y, 0.3, 0.35, 0.12, 0.04) * 0.06

  // Eye sockets (inward)
  z -= bump2d(x, y, -0.28, 0.18, 0.12, 0.07) * 0.2
  z -= bump2d(x, y, 0.28, 0.18, 0.12, 0.07) * 0.2

  // Nose bridge
  const noseBlend = smoothstep(y, 0.25, 0.0) * smoothstep(y, -0.35, -0.15)
  z += Math.exp(-x * x / 0.006) * noseBlend * 0.25

  // Nose tip
  z += bump2d(x, y, 0, -0.28, 0.06, 0.05) * 0.28

  // Nostril wings
  z += bump2d(x, y, -0.08, -0.3, 0.04, 0.03) * 0.06
  z += bump2d(x, y, 0.08, -0.3, 0.04, 0.03) * 0.06

  // Cheekbones
  z += bump2d(x, y, -0.42, 0.0, 0.15, 0.12) * 0.08
  z += bump2d(x, y, 0.42, 0.0, 0.15, 0.12) * 0.08

  // Philtrum (groove nose→lip)
  z -= Math.exp(-x * x / 0.002) * bump1d(y, -0.35, 0.06) * 0.06

  // Lips
  z += bump2d(x, y, 0, -0.42, 0.18, 0.03) * 0.07
  z += bump2d(x, y, 0, -0.48, 0.16, 0.03) * 0.05

  // Chin
  z += bump2d(x, y, 0, -0.8, 0.12, 0.1) * 0.1

  // Temple depression
  z -= bump2d(x, y, -0.5, 0.3, 0.1, 0.1) * 0.04
  z -= bump2d(x, y, 0.5, 0.3, 0.1, 0.1) * 0.04

  return z
}

// =============================================================================
// REGION CLASSIFIER
// =============================================================================

function classify(x: number, y: number): string {
  const ax = Math.abs(x)

  // Eyes
  if (inEllipse(x, y, -0.28, 0.18, 0.13, 0.08)) return 'leftEye'
  if (inEllipse(x, y, 0.28, 0.18, 0.13, 0.08)) return 'rightEye'

  // Eyebrows
  if (inEllipse(x, y, -0.28, 0.34, 0.16, 0.035)) return 'leftEyebrow'
  if (inEllipse(x, y, 0.28, 0.34, 0.16, 0.035)) return 'rightEyebrow'

  // Nose
  if (ax < 0.1 && y < 0.2 && y > -0.35) return 'nose'

  // Mouth inner (lip gap)
  if (ax < 0.16 && y > -0.48 && y < -0.41) return 'mouthInner'

  // Mouth (lips area)
  if (ax < 0.22 && y > -0.54 && y < -0.36) return 'mouth'

  // Chin
  if (y < -0.65 && ax < 0.25) return 'chin'

  // Cheeks
  if (ax > 0.28 && y > -0.5 && y < 0.15) return 'cheeks'

  // Forehead
  if (y > 0.4) return 'forehead'

  return 'faceSurface'
}

// =============================================================================
// MATH HELPERS
// =============================================================================

function bump2d(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  const d = dx * dx + dy * dy
  return d < 1 ? (1 - d) * (1 - d) : 0
}

function bump1d(v: number, center: number, width: number): number {
  const t = (v - center) / width
  const d = t * t
  return d < 1 ? (1 - d) * (1 - d) : 0
}

function smoothstep(x: number, edge0: number, edge1: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  const dx = (x - cx) / rx
  const dy = (y - cy) / ry
  return dx * dx + dy * dy < 1
}

export function getRegionByName(regions: FaceRegion[], name: string): FaceRegion | undefined {
  return regions.find(r => r.name === name)
}
