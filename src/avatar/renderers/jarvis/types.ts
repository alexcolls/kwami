/**
 * Jarvis renderer types.
 *
 * The public surface is deliberately small — palette, a handful of intensities and a few
 * toggles. Everything else (ring layout, timings, shader constants) is procedural and lives in
 * `layout.ts` / `Jarvis.ts`, so the look cannot be broken from a settings panel.
 */

export type JarvisPalettePreset = 'holo-cyan' | 'neon-violet' | 'arc-white' | 'alert-amber'

/** Visual quality tier. Lower tiers drop particle counts and post-processing cost. */
export type JarvisQuality = 'low' | 'medium' | 'high'

/**
 * Colour roles, not literal layers: every HUD element picks a role, so a palette swap
 * recolours the whole interface coherently.
 */
export interface JarvisColorConfig {
  /** Main hologram line colour (rings, reactor blocks, labels). */
  primary: string
  /** Faint structural colour (far rings, circuit traces, backdrop structure). */
  secondary: string
  /** Hot highlight (core, reactor peaks, spark heads). */
  accent: string
  /** Sparse warning specks and glitch fragments. */
  alert: string
  /** Backdrop base colour. */
  background: string
  /** Backdrop glow behind the reactor. */
  backgroundGlow: string
}

export interface JarvisConfig {
  palettePreset: JarvisPalettePreset
  color: JarvisColorConfig
  /** Overall glow / bloom strength. 1 is the reference look. */
  intensity: number
  /** How strongly voice audio drives the interface. 0 disables audio reactivity. */
  reactivity: number
  /** Multiplier on every ring's rotation speed. */
  rotationSpeed: number
  /** Pointer parallax / tilt amount. 0 keeps the HUD flat to the camera. */
  parallax: number
  quality: JarvisQuality
  /** Draw the renderer's own deep-space backdrop instead of the scene background. */
  backdrop: boolean
  /** Draw the HUD text readouts (title, state, telemetry). */
  labels: boolean
  /** Title shown on the HUD. */
  title: string
  /** User scale on top of the automatic viewport fit. */
  scale: number
}

export interface JarvisOptions extends Partial<Omit<JarvisConfig, 'color'>> {
  color?: Partial<JarvisColorConfig>
  /** Shared analyser; the agent's voice track is connected to it by `Kwami`. */
  audio?: {
    getFrequencyData(): Uint8Array
    getAudioContext?(): AudioContext | null
  }
}
