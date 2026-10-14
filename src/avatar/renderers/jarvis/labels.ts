import * as THREE from 'three'
import { markerVertexShader, labelFragmentShader } from './shaders.js'
import type { LabelPlacement } from './layout.js'

/**
 * HUD text, drawn into canvases and shown as additive alpha masks.
 *
 * Channels carry meaning, not colour: red is body text, green is "hot" text that the shader
 * renders brighter and whiter. The palette is applied in the shader, so a palette change never
 * redraws a canvas. Canvases redraw only when their content string changes.
 */

const TEXT_FONT = '"Rajdhani", "Orbitron", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
const MONO_FONT = '"Share Tech Mono", "Roboto Mono", Consolas, "Courier New", monospace'
const SCRAMBLE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/\\'
const CANVAS_WIDTH = 1024

const BODY = 'rgb(255,0,0)'
const BODY_DIM = 'rgb(120,0,0)'
const BODY_FAINT = 'rgb(70,0,0)'
const HOT = 'rgb(0,255,0)'

export class HudLabel {
  readonly mesh: THREE.Mesh
  readonly material: THREE.ShaderMaterial
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private readonly texture: THREE.CanvasTexture
  private lastKey = ''
  private placement: LabelPlacement

  constructor(placement: LabelPlacement, uniforms: { uColor: THREE.Uniform<THREE.Color>; uHot: THREE.Uniform<THREE.Color>; uTime: THREE.Uniform<number> }) {
    this.placement = placement
    this.canvas = document.createElement('canvas')
    const context = this.canvas.getContext('2d')
    if (!context) throw new Error('2D canvas unavailable for Jarvis labels')
    this.context = context

    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.colorSpace = THREE.NoColorSpace
    this.texture.minFilter = THREE.LinearMipmapLinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.anisotropy = 4

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: new THREE.Uniform(this.texture),
        uColor: uniforms.uColor,
        uHot: uniforms.uHot,
        uTime: uniforms.uTime,
        uOpacity: new THREE.Uniform(1),
      },
      vertexShader: markerVertexShader,
      fragmentShader: labelFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      premultipliedAlpha: true,
    })

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.material)
    this.mesh.renderOrder = 6
    this.applyPlacement(placement)
  }

  get align(): LabelPlacement['align'] {
    return this.placement.align
  }

  applyPlacement(placement: LabelPlacement): void {
    this.placement = placement
    this.mesh.position.set(placement.x, placement.y, 0.35)
    this.mesh.scale.set(placement.width, placement.height, 1)
    const height = Math.round((CANVAS_WIDTH * placement.height) / placement.width)
    if (this.canvas.width !== CANVAS_WIDTH || this.canvas.height !== height) {
      this.canvas.width = CANVAS_WIDTH
      this.canvas.height = height
      // three.js cannot resize an uploaded texture in place.
      this.texture.dispose()
      this.lastKey = ''
    }
  }

  /** Force the next `update` to redraw (e.g. a web font finished loading). */
  invalidate(): void {
    this.lastKey = ''
  }

  /** Redraw only when `key` differs from the previous draw. */
  update(key: string, draw: (context: CanvasRenderingContext2D, width: number, height: number) => void): void {
    if (key === this.lastKey) return
    this.lastKey = key
    const { width, height } = this.canvas
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.fillStyle = '#000'
    this.context.fillRect(0, 0, width, height)
    draw(this.context, width, height)
    this.texture.needsUpdate = true
  }

  dispose(): void {
    this.texture.dispose()
    this.material.dispose()
    this.mesh.geometry.dispose()
  }
}

/** Left-to-right "decode" of a string: unresolved characters cycle through random glyphs. */
export class ScrambleText {
  private target = ''
  private startedAt = 0

  set(text: string, now: number): void {
    if (text === this.target) return
    this.target = text
    this.startedAt = now
  }

  read(now: number): string {
    const elapsed = now - this.startedAt
    const frame = Math.floor(now * 30)
    let out = ''
    for (let index = 0; index < this.target.length; index++) {
      const char = this.target[index]!
      const resolvesAt = 0.1 + index * 0.035
      if (char === ' ' || elapsed >= resolvesAt) {
        out += char
      } else {
        const pick = Math.abs(Math.sin((index + 1) * 12.9898 + frame * 78.233)) * 43758.5453
        out += SCRAMBLE_GLYPHS[Math.floor((pick - Math.floor(pick)) * SCRAMBLE_GLYPHS.length)]
      }
    }
    return out
  }
}

function setFont(context: CanvasRenderingContext2D, weight: number, size: number, family: string, spacing: number): void {
  context.font = `${weight} ${size}px ${family}`
  // letterSpacing is widely supported but not in every lib.dom version.
  ;(context as unknown as { letterSpacing: string }).letterSpacing = `${spacing}px`
}

function anchorX(align: LabelPlacement['align'], width: number, padding: number): number {
  if (align === 'left') return padding
  if (align === 'right') return width - padding
  return width / 2
}

export interface TitleBlockContent {
  title: string
  /** Already-scrambled state text. */
  state: string
  subtitle: string
  /** 0–1 characters of the title revealed (boot typing). */
  reveal: number
}

export function drawTitleBlock(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  align: LabelPlacement['align'],
  content: TitleBlockContent,
): void {
  const padding = 18
  const x = anchorX(align, width, padding)
  context.textAlign = align
  context.textBaseline = 'alphabetic'

  const visibleTitle = content.title.slice(0, Math.ceil(content.title.length * content.reveal))
  setFont(context, 600, 78, TEXT_FONT, 16)
  context.fillStyle = BODY
  context.fillText(visibleTitle, x, height * 0.36)

  // Rule with a hot tick at the anchored end.
  const ruleY = height * 0.47
  const ruleLength = width * 0.82 * content.reveal
  const ruleStart = align === 'right' ? x - ruleLength : align === 'left' ? x : x - ruleLength / 2
  context.fillStyle = BODY_DIM
  context.fillRect(ruleStart, ruleY, ruleLength, 3)
  context.fillStyle = HOT
  const tickX = align === 'right' ? x - 46 : align === 'left' ? x : x - 23
  context.fillRect(tickX, ruleY - 4, 46, 11)

  setFont(context, 600, 40, TEXT_FONT, 10)
  context.fillStyle = HOT
  context.fillText(content.state, x, height * 0.7)

  setFont(context, 500, 24, MONO_FONT, 6)
  context.fillStyle = BODY_DIM
  context.fillText(content.subtitle, x, height * 0.9)
}

export interface TelemetryContent {
  db: number
  hz: number
  uptimeSeconds: number
  bars: ArrayLike<number>
  active: boolean
}

function formatUptime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function telemetryKey(content: TelemetryContent): string {
  let bars = ''
  for (let index = 0; index < content.bars.length; index++) {
    bars += Math.round((content.bars[index] ?? 0) * 12).toString(16)
  }
  return `${content.active ? Math.round(content.db) : 'x'}|${content.active ? Math.round(content.hz / 2) : 'x'}|${Math.floor(content.uptimeSeconds)}|${bars}`
}

export function drawTelemetryBlock(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  align: LabelPlacement['align'],
  content: TelemetryContent,
): void {
  const padding = 18
  const rows: Array<[string, string]> = [
    ['VOX', content.active ? `${content.db.toFixed(1)} dB` : '--.- dB'],
    ['PITCH', content.active && content.hz > 0 ? `${String(Math.round(content.hz)).padStart(4, '0')} Hz` : '---- Hz'],
    ['UPTIME', formatUptime(content.uptimeSeconds)],
  ]

  const blockWidth = Math.min(width - padding * 2, 600)
  const left = align === 'left' ? padding : align === 'right' ? width - padding - blockWidth : (width - blockWidth) / 2
  const rowHeight = height * 0.2

  rows.forEach(([label, value], index) => {
    const y = height * 0.2 + index * rowHeight
    context.textAlign = 'left'
    setFont(context, 500, 42, MONO_FONT, 6)
    context.fillStyle = BODY_DIM
    context.fillText(label, left, y)
    context.textAlign = 'right'
    setFont(context, 600, 48, MONO_FONT, 4)
    context.fillStyle = index === 0 && content.active ? HOT : BODY
    context.fillText(value, left + blockWidth, y)
    context.fillStyle = BODY_FAINT
    context.fillRect(left, y + 12, blockWidth, 2)
  })

  // Mini spectrum.
  const barCount = content.bars.length
  if (barCount > 0) {
    const top = height * 0.7
    const bottom = height * 0.95
    const gap = 6
    const barWidth = (blockWidth - gap * (barCount - 1)) / barCount
    for (let index = 0; index < barCount; index++) {
      const value = Math.max(0.04, Math.min(1, content.bars[index] ?? 0))
      const barHeight = (bottom - top) * value
      context.fillStyle = value > 0.7 ? HOT : BODY
      context.fillRect(left + index * (barWidth + gap), bottom - barHeight, barWidth, barHeight)
    }
  }
}
