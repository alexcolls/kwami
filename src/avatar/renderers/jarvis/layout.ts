/**
 * Procedural layout of the Jarvis HUD.
 *
 * Everything is in "reactor units": the reactor ring's outer edge sits at radius 1 and the
 * renderer scales the whole group to the viewport. Generation is seeded, so the interface is
 * identical on every load — a HUD that rearranges itself on refresh reads as a bug, not as
 * variety.
 */

export type JarvisColorRole = 'primary' | 'secondary' | 'accent' | 'alert'

export interface HudRingSpec {
  radius: number
  /** Line width in reactor units. 0 draws ticks/nodes only. */
  width: number
  /** Depth offset; spreads the rings through z so pointer tilt produces real parallax. */
  z: number
  role: JarvisColorRole
  opacity: number
  arcStart: number
  arcLength: number
  dashCount: number
  dashDuty: number
  tickCount: number
  /** Positive grows outward, negative inward. */
  tickLength: number
  tickWidth: number
  majorEvery: number
  majorScale: number
  nodeCount: number
  nodeSize: number
  nodeDensity: number
  /** Base angular speed in rad/s; sign is direction. */
  speed: number
  /** Segments light up with the voice level / thinking chase. */
  meter: boolean
  /** How much the voice level brightens this ring. */
  audioGain: number
  bootDelay: number
  /** Light comets running along the line (0 = none). */
  runners: number
  /** Comet speed in turns per flow unit; sign is direction. */
  runnerSpeed: number
  /** Height of a cylindrical wall extruded behind the ring (0 = flat ring). */
  wall: number
  /** Gyroscope tilt in radians (0 = faces the camera). */
  gyroTilt: number
  /** Precession speed of the gyroscope tilt axis, rad/s. */
  gyroSpeed: number
}

export interface ReactorBlock {
  angle: number
  radius: number
  arc: number
  thickness: number
  row: number
  seed: number
  z: number
  /** 0 = data block, 1 = alert-coloured glitch speck. */
  kind: number
  /** Extrusion depth toward the camera, before audio. */
  depth: number
}

export interface TracePath {
  points: Array<[number, number]>
  width: number
  /** Brightness multiplier for the base line and pulses. */
  boost: number
  seed: number
  /** Draw a pad at the far end. */
  pad: boolean
}

export interface MarkerSpec {
  shape: 'bracket' | 'square' | 'caret'
  x: number
  y: number
  z: number
  width: number
  height: number
  /** Rotation in radians. */
  rotation: number
  role: JarvisColorRole
  opacity: number
}

export type LabelLayout = 'wide' | 'stacked'

export interface LabelPlacement {
  /** Plane centre. */
  x: number
  y: number
  width: number
  height: number
  align: 'left' | 'right' | 'center'
}

const TAU = Math.PI * 2

/** Mulberry32: tiny, fast, good enough for layout. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function ring(partial: Partial<HudRingSpec> & Pick<HudRingSpec, 'radius'>): HudRingSpec {
  return {
    width: 0.004,
    z: 0,
    role: 'primary',
    opacity: 0.6,
    arcStart: 0,
    arcLength: TAU,
    dashCount: 0,
    dashDuty: 1,
    tickCount: 0,
    tickLength: 0,
    tickWidth: 0.004,
    majorEvery: 0,
    majorScale: 1,
    nodeCount: 0,
    nodeSize: 0.02,
    nodeDensity: 1,
    speed: 0,
    meter: false,
    audioGain: 0.6,
    bootDelay: 0,
    runners: 0,
    runnerSpeed: 1,
    wall: 0,
    gyroTilt: 0,
    gyroSpeed: 0,
    ...partial,
  }
}

/**
 * Concentric HUD rings, inside-out. Radii, widths and speeds were tuned against the reference
 * frame: fine structure close to the core, a dense tick band just outside the reactor, then
 * progressively fainter and slower arcs that run off the edge of the screen.
 *
 * Depth is spread wide on purpose (+0.3 in front of the reactor to -1.9 behind it): seen head-on
 * the HUD matches the flat reference, but any tilt separates it into distinct floating layers.
 * A few rings carry cylindrical walls and two are gyroscopes, so the interface reads as a
 * volume, not as a decal, when it turns.
 */
export function createRingSpecs(): HudRingSpec[] {
  return [
    // ---- inside the reactor ----------------------------------------------------------
    ring({ radius: 0.115, width: 0.006, z: 0.3, opacity: 0.9, audioGain: 1.2, bootDelay: 0.05, runners: 1, runnerSpeed: 1.6 }),
    ring({
      radius: 0.19, width: 0.012, z: 0.24, opacity: 0.75, dashCount: 3, dashDuty: 0.72,
      speed: 0.35, audioGain: 1, bootDelay: 0.1, wall: 0.08,
    }),
    ring({
      radius: 0.265, width: 0.004, z: 0.17, opacity: 0.6, tickCount: 72, tickLength: 0.035,
      tickWidth: 0.006, majorEvery: 6, majorScale: 1.8, speed: -0.12, bootDelay: 0.16,
      runners: 2, runnerSpeed: -0.8,
    }),
    ring({
      radius: 0.36, width: 0.005, z: 0.11, role: 'secondary', opacity: 0.8, dashCount: 48,
      dashDuty: 0.5, speed: 0.22, bootDelay: 0.22,
    }),
    ring({
      radius: 0.44, width: 0.003, z: 0.06, opacity: 0.5, nodeCount: 8, nodeSize: 0.018,
      nodeDensity: 0.8, speed: -0.06, bootDelay: 0.28, runners: 2, runnerSpeed: 0.6,
    }),
    // Spokes: ticks only, long enough to read as radial data lines.
    ring({
      radius: 0.47, width: 0, z: 0.02, role: 'secondary', opacity: 0.45, tickCount: 12,
      tickLength: 0.2, tickWidth: 0.003, speed: 0.04, audioGain: 0.3, bootDelay: 0.3,
    }),
    ring({
      radius: 0.7, width: 0.004, z: -0.02, opacity: 0.55, dashCount: 160, dashDuty: 0.32,
      speed: -0.1, bootDelay: 0.34,
    }),
    ring({
      radius: 0.74, width: 0.003, z: -0.04, role: 'secondary', opacity: 0.6, bootDelay: 0.36,
      wall: 0.22, runners: 3, runnerSpeed: 0.5,
    }),

    // ---- outside the reactor ---------------------------------------------------------
    ring({
      radius: 1.06, width: 0.005, z: 0.05, opacity: 0.85, tickCount: 180, tickLength: 0.028,
      tickWidth: 0.004, majorEvery: 5, majorScale: 1.9, speed: 0.05, audioGain: 0.8, bootDelay: 0.45,
      wall: 0.14, runners: 2, runnerSpeed: -0.45,
    }),
    ring({
      radius: 1.13, width: 0.014, z: 0.12, opacity: 0.8, arcStart: 0.4, dashCount: 3,
      dashDuty: 0.8, speed: -0.18, audioGain: 0.9, bootDelay: 0.55, runners: 3, runnerSpeed: 0.9,
    }),
    // Voice meter: segments fill with the level, chase while thinking.
    ring({
      radius: 1.22, width: 0.028, z: 0.2, opacity: 0.95, arcStart: Math.PI * 0.69,
      arcLength: Math.PI * 1.62, dashCount: 72, dashDuty: 0.62, meter: true, audioGain: 0,
      bootDelay: 0.62, wall: 0.06,
    }),
    ring({
      radius: 1.34, width: 0.004, z: -0.18, role: 'secondary', opacity: 0.75, arcStart: 1.1,
      arcLength: Math.PI * 1.4, nodeCount: 14, nodeSize: 0.022, nodeDensity: 0.7, speed: 0.07,
      bootDelay: 0.7, runners: 2, runnerSpeed: 0.7,
    }),
    // Gyroscopes: barely elliptical head-on, unmistakably 3D the moment the HUD turns.
    ring({
      radius: 1.4, width: 0.004, z: 0, opacity: 0.55, tickCount: 90, tickLength: 0.02,
      tickWidth: 0.003, majorEvery: 9, majorScale: 2, speed: 0.12, bootDelay: 0.75,
      runners: 2, runnerSpeed: 1.1, gyroTilt: 0.32, gyroSpeed: 0.11,
    }),
    ring({
      radius: 1.47, width: 0.006, z: -0.3, opacity: 0.45, dashCount: 240, dashDuty: 0.28,
      speed: -0.03, bootDelay: 0.78,
    }),
    ring({
      radius: 1.56, width: 0.005, z: 0, role: 'secondary', opacity: 0.6, arcStart: 0.3,
      arcLength: Math.PI * 1.55, speed: -0.09, bootDelay: 0.82, runners: 3, runnerSpeed: -0.8,
      gyroTilt: 0.42, gyroSpeed: -0.08,
    }),
    ring({
      radius: 1.62, width: 0.003, z: -0.45, role: 'secondary', opacity: 0.6, arcStart: 2.2,
      arcLength: Math.PI * 0.9, tickCount: 48, tickLength: -0.04, tickWidth: 0.004, speed: 0.09,
      bootDelay: 0.86,
    }),
    ring({
      radius: 1.9, width: 0.004, z: -0.65, role: 'secondary', opacity: 0.45, dashCount: 5,
      dashDuty: 0.86, speed: -0.025, audioGain: 0.3, bootDelay: 0.95, runners: 2, runnerSpeed: 0.35,
    }),
    ring({
      radius: 2.35, width: 0.003, z: -0.9, role: 'secondary', opacity: 0.36, arcStart: 4.1,
      arcLength: Math.PI * 1.25, tickCount: 30, tickLength: 0.05, tickWidth: 0.004, speed: 0.018,
      audioGain: 0.2, bootDelay: 1.05, runners: 1, runnerSpeed: -0.25,
    }),
    ring({
      radius: 2.9, width: 0.005, z: -1.2, role: 'secondary', opacity: 0.26, dashCount: 2,
      dashDuty: 0.7, speed: -0.012, audioGain: 0.15, bootDelay: 1.15, runners: 2, runnerSpeed: 0.2,
    }),
    ring({ radius: 3.6, width: 0.003, z: -1.5, role: 'secondary', opacity: 0.2, bootDelay: 1.25, runners: 1, runnerSpeed: -0.12 }),
    ring({
      radius: 4.5, width: 0.004, z: -1.9, role: 'secondary', opacity: 0.14, arcStart: 0.8,
      arcLength: Math.PI * 1.2, speed: 0.006, bootDelay: 1.35,
    }),
  ]
}

/** Per-row extrusion: the thick middle rows are the deepest, like a machined drum. */
const REACTOR_DEPTH = [0.03, 0.08, 0.13, 0.07, 0.02]

interface ReactorRowSpec {
  radius: number
  thickness: number
  cells: number
  fill: number
}

/** Rows of the fragmented reactor ring, inner to outer. */
const REACTOR_ROWS: ReactorRowSpec[] = [
  { radius: 0.775, thickness: 0.016, cells: 220, fill: 0.6 },
  { radius: 0.832, thickness: 0.06, cells: 170, fill: 0.9 },
  { radius: 0.9, thickness: 0.085, cells: 140, fill: 0.95 },
  { radius: 0.962, thickness: 0.042, cells: 180, fill: 0.82 },
  { radius: 0.998, thickness: 0.012, cells: 280, fill: 0.5 },
]

/**
 * The fragmented reactor ring: rows of data blocks with irregular gaps, merged runs and depth
 * jitter, plus a sprinkle of loose glitch fragments around it.
 */
export function createReactorBlocks(seed = 0x5eed1): ReactorBlock[] {
  const rng = createRng(seed)
  const blocks: ReactorBlock[] = []

  REACTOR_ROWS.forEach((row, rowIndex) => {
    const cellArc = TAU / row.cells
    let cell = 0
    while (cell < row.cells) {
      if (rng() > row.fill) {
        cell += 1
        continue
      }
      // Occasionally merge 2–3 cells into one long block.
      const span = rng() < 0.32 ? 2 + Math.floor(rng() * 2) : 1
      const arc = cellArc * span * (0.6 + rng() * 0.35)
      const angle = (cell + span * 0.5) * cellArc + (rng() - 0.5) * cellArc * 0.3
      blocks.push({
        angle,
        radius: row.radius + (rng() - 0.5) * row.thickness * 0.35,
        arc,
        thickness: row.thickness * (0.6 + rng() * 0.5),
        row: rowIndex,
        seed: rng(),
        z: (rng() - 0.5) * 0.05,
        kind: 0,
        depth: REACTOR_DEPTH[rowIndex]! * (0.55 + rng() * 0.9),
      })
      cell += span
    }
  })

  // Loose fragments drifting off the ring; a third of them in the alert colour.
  for (let index = 0; index < 72; index++) {
    const radius = 0.7 + rng() * 0.42
    blocks.push({
      angle: rng() * TAU,
      radius,
      arc: (0.006 + rng() * 0.02) / radius,
      thickness: 0.006 + rng() * 0.014,
      row: rng() < 0.5 ? 0 : REACTOR_ROWS.length - 1,
      seed: rng(),
      z: (rng() - 0.5) * 0.3,
      kind: rng() < 0.33 ? 1 : 0,
      depth: 0.008 + rng() * 0.02,
    })
  }

  return blocks
}

const DIRECTIONS: Array<[number, number]> = [
  [1, 0], [Math.SQRT1_2, Math.SQRT1_2], [0, 1], [-Math.SQRT1_2, Math.SQRT1_2],
  [-1, 0], [-Math.SQRT1_2, -Math.SQRT1_2], [0, -1], [Math.SQRT1_2, -Math.SQRT1_2],
]

function nearestDirection(x: number, y: number): number {
  const angle = Math.atan2(y, x)
  return ((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8
}

/**
 * Circuit traces: start on the outer rings, run outward, then bend to the nearest 45° like a
 * PCB route. Angles around 3 and 9 o'clock are left free for the label leaders.
 */
export function createCircuitTraces(seed = 0xc12c): TracePath[] {
  const rng = createRng(seed)
  const paths: TracePath[] = []
  const startRadii = [1.38, 1.52, 1.66, 1.95]

  let attempts = 0
  while (paths.length < 30 && attempts < 400) {
    attempts++
    const angle = rng() * TAU
    const fromHorizontal = Math.abs(Math.sin(angle))
    if (fromHorizontal < 0.42) continue // keep 3 and 9 o'clock clear

    const startRadius = startRadii[Math.floor(rng() * startRadii.length)]!
    let x = Math.cos(angle) * startRadius
    let y = Math.sin(angle) * startRadius
    const points: Array<[number, number]> = [[x, y]]

    // Radial first leg.
    const radialLength = 0.12 + rng() * 0.38
    x += Math.cos(angle) * radialLength
    y += Math.sin(angle) * radialLength
    points.push([x, y])

    // One or two snapped legs.
    let direction = nearestDirection(Math.cos(angle), Math.sin(angle))
    const legs = 1 + Math.floor(rng() * 2)
    for (let leg = 0; leg < legs; leg++) {
      direction = (direction + (rng() < 0.5 ? 1 : 7) + (rng() < 0.3 ? 1 : 0)) % 8
      const [dx, dy] = DIRECTIONS[direction]!
      const length = 0.25 + rng() * 0.9
      const nx = x + dx * length
      const ny = y + dy * length
      if (Math.hypot(nx, ny) > 4.3 || Math.hypot(nx, ny) < 1.4) break
      x = nx
      y = ny
      points.push([x, y])
    }

    paths.push({
      points,
      width: rng() < 0.2 ? 0.009 : 0.005,
      boost: 0.6 + rng() * 0.6,
      seed: rng(),
      pad: rng() < 0.75,
    })
  }

  // The bright horizontal data stream low on the left of the reference frame, and a fainter
  // counterpart high on the right.
  paths.push({ points: [[-1.28, -0.98], [-2.4, -0.98], [-4.2, -0.98]], width: 0.016, boost: 1.5, seed: 0.37, pad: false })
  paths.push({ points: [[1.3, 1.02], [2.2, 1.02], [3.6, 1.02]], width: 0.007, boost: 0.7, seed: 0.81, pad: false })

  return paths
}

/** Leader lines from the ring to the label blocks. Depend on the label layout. */
export function createLeaderTraces(layout: LabelLayout): TracePath[] {
  if (layout === 'wide') {
    const left = (150 * Math.PI) / 180
    const right = (-25 * Math.PI) / 180
    const lx = Math.cos(left) * 1.25
    const ly = Math.sin(left) * 1.25
    const rx = Math.cos(right) * 1.25
    const ry = Math.sin(right) * 1.25
    return [
      { points: [[lx, ly], [-1.66, ly]], width: 0.005, boost: 1.1, seed: 0.13, pad: true },
      { points: [[rx, ry], [1.66, ry]], width: 0.005, boost: 1.1, seed: 0.57, pad: true },
    ]
  }
  return [
    { points: [[0, 1.25], [0, 1.5]], width: 0.005, boost: 1.1, seed: 0.13, pad: true },
    { points: [[0, -1.25], [0, -1.5]], width: 0.005, boost: 1.1, seed: 0.57, pad: true },
  ]
}

export function getLabelPlacements(layout: LabelLayout): { title: LabelPlacement; telemetry: LabelPlacement } {
  if (layout === 'wide') {
    return {
      // Left block: right edge just past the leader end.
      title: { x: -2.22, y: 0.625, width: 1.1, height: 0.44, align: 'right' },
      telemetry: { x: 2.22, y: -0.528, width: 1.1, height: 0.5, align: 'left' },
    }
  }
  return {
    title: { x: 0, y: 1.79, width: 1.5, height: 0.44, align: 'center' },
    telemetry: { x: 0, y: -1.82, width: 1.5, height: 0.5, align: 'center' },
  }
}

export function createMarkers(): MarkerSpec[] {
  const caret = (angle: number): MarkerSpec => ({
    shape: 'caret',
    x: Math.cos(angle) * 1.29,
    y: Math.sin(angle) * 1.29,
    z: 0.1,
    width: 0.032,
    height: 0.026,
    // The caret's apex is local -y; this turns it to point at the centre.
    rotation: angle - Math.PI / 2,
    role: 'primary',
    opacity: 0.85,
  })
  return [
    // Notch at 12 o'clock and the bright square at 3 o'clock from the reference frame.
    { shape: 'bracket', x: 0, y: 1.085, z: 0.08, width: 0.12, height: 0.05, rotation: 0, role: 'primary', opacity: 1 },
    { shape: 'square', x: 1.035, y: -0.02, z: 0.06, width: 0.03, height: 0.022, rotation: 0, role: 'accent', opacity: 1 },
    caret(Math.PI / 4),
    caret((3 * Math.PI) / 4),
    caret((5 * Math.PI) / 4),
    caret((7 * Math.PI) / 4),
  ]
}

export interface PointSeed {
  x: number
  y: number
  z: number
  seed: number
  kind: number
  /** Dust only: 1 = rides the spiral current in and out of the reactor, 0 = orbits. */
  stream?: number
}

/** Data dust: a deep, flattened cloud around the reactor. */
export function createDust(count: number, seed = 0xd057): PointSeed[] {
  const rng = createRng(seed)
  const points: PointSeed[] = []
  for (let index = 0; index < count; index++) {
    const radius = 0.35 + Math.pow(rng(), 0.75) * 4.6
    const angle = rng() * TAU
    points.push({
      x: radius,
      y: angle,
      z: (rng() - 0.6) * 3.4,
      seed: rng(),
      kind: rng() < 0.05 ? 1 : 0,
      stream: rng() < 0.42 ? 1 : 0,
    })
  }
  return points
}

/** Out-of-focus bokeh, mostly low in the frame and in front of the HUD. */
export function createBokeh(count: number, seed = 0xb0ce): PointSeed[] {
  const rng = createRng(seed)
  const points: PointSeed[] = []
  for (let index = 0; index < count; index++) {
    const low = rng() < 0.72
    let x = (rng() - 0.5) * 9
    let y = low ? -1.2 - rng() * 2.4 : (rng() - 0.5) * 6
    // Keep the reactor itself clear: bokeh frames the HUD, it never sits on it.
    if (Math.hypot(x, y) < 2) {
      const angle = Math.atan2(y, x)
      x = Math.cos(angle) * 2.2
      y = Math.sin(angle) * 2.2
    }
    points.push({
      x,
      y,
      z: rng() < 0.7 ? 0.9 + rng() * 2.2 : -1.5 - rng() * 1.8,
      seed: rng(),
      kind: rng() < 0.16 ? 1 : 0,
    })
  }
  return points
}
