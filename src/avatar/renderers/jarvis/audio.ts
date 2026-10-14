/**
 * Voice analysis for the Jarvis renderer.
 *
 * The shared `AnalyserNode` hands back byte magnitudes already mapped from dB (-90…-10 dB onto
 * 0…255) and already smoothed a little. This turns that into the signals the HUD animates on:
 *
 * - `level`    — loudness envelope over the voice band, fast attack / slow release, so the
 *                interface swells on every syllable and settles between words instead of
 *                flickering frame to frame.
 * - `spectrum` — log-spaced bands from ~90 Hz to ~7.5 kHz. Linear FFT bins put 90% of a voice
 *                in the first tenth of the array; log spacing spreads it across the reactor.
 * - `onset`    — a syllable attack, from spectral flux against an adaptive threshold. Drives
 *                the one-shot effects (shockwaves, sparks, glitch) that make speech read as
 *                speech rather than as a volume meter.
 *
 * Pure and DOM-free so it can be unit tested with synthetic spectra.
 */

export interface JarvisAudioFrame {
  /** 0–1 loudness envelope over the voice band. */
  level: number
  bass: number
  mid: number
  high: number
  /** 0–1 per log band, smoothed. Shared buffer: copy it if you need to keep it. */
  spectrum: Float32Array
  /** 0 on most frames; 0–1 strength on the frame a syllable attack is detected. */
  onset: number
  /** Dominant frequency in the fundamental range, smoothed, in Hz. 0 when silent. */
  peakHz: number
  /** Approximate level in dBFS of the loudest voice band (-90 when silent). */
  db: number
  /** Whether there has been signal above the noise floor in the last ~300 ms. */
  active: boolean
}

export interface JarvisAudioAnalyzerOptions {
  bandCount?: number
  minHz?: number
  maxHz?: number
  /** Gate below which byte magnitudes count as silence (0–1). */
  noiseFloor?: number
  levelAttackMs?: number
  levelReleaseMs?: number
  bandAttackMs?: number
  bandReleaseMs?: number
  /** Minimum gap between two onsets. */
  onsetRefractoryMs?: number
}

const MAX_DELTA_MS = 100

/** Fraction of the way to the target covered in `ms` at time constant `tau`. */
export function smoothingCoefficient(ms: number, tau: number): number {
  if (tau <= 0) return 1
  return 1 - Math.exp(-ms / tau)
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

export class JarvisAudioAnalyzer {
  readonly bandCount: number
  private readonly minHz: number
  private readonly maxHz: number
  private readonly noiseFloor: number
  private readonly levelAttackMs: number
  private readonly levelReleaseMs: number
  private readonly bandAttackMs: number
  private readonly bandReleaseMs: number
  private readonly onsetRefractoryMs: number

  private readonly raw: Float32Array
  private readonly sorted: Float32Array
  private readonly previousRaw: Float32Array
  private readonly smoothed: Float32Array
  /** Band → [firstBin, lastBinExclusive]. Rebuilt when the bin layout changes. */
  private ranges: Int32Array
  private rangesKey = ''

  private level = 0
  private bass = 0
  private mid = 0
  private high = 0
  private peak = 0.5
  private fluxMean = 0
  private sinceOnsetMs = Number.POSITIVE_INFINITY
  private sinceActiveMs = Number.POSITIVE_INFINITY
  private peakHz = 0

  constructor(options: JarvisAudioAnalyzerOptions = {}) {
    this.bandCount = Math.max(8, Math.floor(options.bandCount ?? 64))
    this.minHz = options.minHz ?? 90
    this.maxHz = options.maxHz ?? 7500
    this.noiseFloor = options.noiseFloor ?? 0.3
    this.levelAttackMs = options.levelAttackMs ?? 22
    this.levelReleaseMs = options.levelReleaseMs ?? 170
    this.bandAttackMs = options.bandAttackMs ?? 16
    this.bandReleaseMs = options.bandReleaseMs ?? 130
    this.onsetRefractoryMs = options.onsetRefractoryMs ?? 110

    this.raw = new Float32Array(this.bandCount)
    this.sorted = new Float32Array(this.bandCount)
    this.previousRaw = new Float32Array(this.bandCount)
    this.smoothed = new Float32Array(this.bandCount)
    this.ranges = new Int32Array(this.bandCount * 2)
  }

  reset(): void {
    this.raw.fill(0)
    this.previousRaw.fill(0)
    this.smoothed.fill(0)
    this.level = 0
    this.bass = 0
    this.mid = 0
    this.high = 0
    this.peak = 0.5
    this.fluxMean = 0
    this.sinceOnsetMs = Number.POSITIVE_INFINITY
    this.sinceActiveMs = Number.POSITIVE_INFINITY
    this.peakHz = 0
  }

  /**
   * Advance the analysis by one frame.
   *
   * @param frequencyData - `AnalyserNode.getByteFrequencyData` output (`fftSize / 2` bins).
   * @param sampleRate - Of the `AudioContext` the analyser belongs to.
   * @param deltaMs - Since the previous call; envelopes are framed on it, not on 1/60 s.
   */
  analyze(frequencyData: Uint8Array, sampleRate: number, deltaMs: number): JarvisAudioFrame {
    const ms = Math.min(MAX_DELTA_MS, Math.max(0, deltaMs))
    const binCount = frequencyData.length

    if (binCount === 0) {
      return this.decayToSilence(ms)
    }

    const binHz = sampleRate / (2 * binCount)
    this.ensureRanges(binCount, binHz)

    // 1. Gated log-band magnitudes (max over each band's bins keeps formant peaks crisp).
    const floor = this.noiseFloor
    let weighted = 0
    let weightSum = 0
    let loudest = 0
    for (let band = 0; band < this.bandCount; band++) {
      const from = this.ranges[band * 2]!
      const to = this.ranges[band * 2 + 1]!
      let max = 0
      for (let bin = from; bin < to; bin++) {
        const value = frequencyData[bin] ?? 0
        if (value > max) max = value
      }
      const normalized = max / 255
      if (normalized > loudest) loudest = normalized
      const gated = clamp01((normalized - floor) / (1 - floor))
      this.raw[band] = gated

      // Weight toward the intelligibility range (~150 Hz – 3 kHz).
      const position = band / (this.bandCount - 1)
      const weight = position < 0.08 ? 0.55 : position > 0.78 ? 0.45 : 1
      weighted += gated * weight
      weightSum += weight
    }

    // A voice puts its energy in a handful of formant bands, so a plain mean over 64 bands
    // reads every syllable as quiet. Blend in the mean of the loudest quarter.
    this.sorted.set(this.raw)
    this.sorted.sort()
    const topCount = Math.max(1, Math.floor(this.bandCount / 4))
    let topSum = 0
    for (let index = this.bandCount - topCount; index < this.bandCount; index++) topSum += this.sorted[index]!
    const meanLevel = weightSum > 0 ? weighted / weightSum : 0
    const rawLevel = meanLevel * 0.4 + (topSum / topCount) * 0.6

    // 2. Slow automatic gain so a quiet TTS voice still drives the full range.
    const decay = smoothingCoefficient(ms, 4000)
    this.peak = Math.max(rawLevel, this.peak + (0.22 - this.peak) * decay)
    const gain = Math.min(2.6, Math.max(1, 0.8 / Math.max(this.peak, 0.12)))

    // 3. Onset: positive spectral flux against its own running mean.
    let flux = 0
    for (let band = 0; band < this.bandCount; band++) {
      const rise = this.raw[band]! - this.previousRaw[band]!
      if (rise > 0) flux += rise
      this.previousRaw[band] = this.raw[band]!
    }
    flux /= this.bandCount
    const threshold = this.fluxMean * 1.65 + 0.011
    this.fluxMean += (flux - this.fluxMean) * smoothingCoefficient(ms, 450)
    this.sinceOnsetMs += ms

    let onset = 0
    if (flux > threshold && rawLevel > 0.06 && this.sinceOnsetMs >= this.onsetRefractoryMs) {
      onset = clamp01(0.35 + (flux - threshold) * 9)
      this.sinceOnsetMs = 0
    }

    // 4. Envelopes.
    const target = clamp01(rawLevel * gain)
    this.level += (target - this.level) * smoothingCoefficient(
      ms,
      target > this.level ? this.levelAttackMs : this.levelReleaseMs,
    )

    // Bands get a gentler gain than the level: full gain flattens every band to 1 and the
    // reactor loses the shape of the voice.
    const bandGain = Math.sqrt(gain)
    const attack = smoothingCoefficient(ms, this.bandAttackMs)
    const release = smoothingCoefficient(ms, this.bandReleaseMs)
    let bassSum = 0
    let midSum = 0
    let highSum = 0
    const bassEnd = Math.floor(this.bandCount * 0.22)
    const midEnd = Math.floor(this.bandCount * 0.66)
    for (let band = 0; band < this.bandCount; band++) {
      const value = clamp01(this.raw[band]! * bandGain)
      const current = this.smoothed[band]!
      const next = current + (value - current) * (value > current ? attack : release)
      this.smoothed[band] = next
      if (band < bassEnd) bassSum += next
      else if (band < midEnd) midSum += next
      else highSum += next
    }
    this.bass = bassSum / Math.max(1, bassEnd)
    this.mid = midSum / Math.max(1, midEnd - bassEnd)
    this.high = highSum / Math.max(1, this.bandCount - midEnd)

    // 5. Dominant pitch-ish frequency (80 Hz – 1 kHz), for the readout only.
    const firstBin = Math.max(1, Math.floor(80 / binHz))
    const lastBin = Math.min(binCount - 1, Math.ceil(1000 / binHz))
    let peakBin = -1
    let peakValue = 0
    for (let bin = firstBin; bin <= lastBin; bin++) {
      const value = frequencyData[bin] ?? 0
      if (value > peakValue) {
        peakValue = value
        peakBin = bin
      }
    }
    if (peakBin >= 0 && peakValue / 255 > floor) {
      const hz = peakBin * binHz
      this.peakHz = this.peakHz === 0 ? hz : this.peakHz + (hz - this.peakHz) * smoothingCoefficient(ms, 90)
    } else {
      this.peakHz += (0 - this.peakHz) * smoothingCoefficient(ms, 300)
      if (this.peakHz < 1) this.peakHz = 0
    }

    if (rawLevel > 0.025) this.sinceActiveMs = 0
    else this.sinceActiveMs += ms

    return {
      level: this.level,
      bass: this.bass,
      mid: this.mid,
      high: this.high,
      spectrum: this.smoothed,
      onset,
      peakHz: this.peakHz,
      db: loudest > 0 ? -90 + loudest * 80 : -90,
      active: this.sinceActiveMs < 300,
    }
  }

  private decayToSilence(ms: number): JarvisAudioFrame {
    const release = smoothingCoefficient(ms, this.levelReleaseMs)
    this.level -= this.level * release
    for (let band = 0; band < this.bandCount; band++) {
      this.smoothed[band] = this.smoothed[band]! * (1 - release)
      this.previousRaw[band] = 0
    }
    this.bass -= this.bass * release
    this.mid -= this.mid * release
    this.high -= this.high * release
    this.sinceActiveMs += ms
    this.sinceOnsetMs += ms
    return {
      level: this.level,
      bass: this.bass,
      mid: this.mid,
      high: this.high,
      spectrum: this.smoothed,
      onset: 0,
      peakHz: 0,
      db: -90,
      active: false,
    }
  }

  private ensureRanges(binCount: number, binHz: number): void {
    const key = `${binCount}:${binHz}`
    if (key === this.rangesKey) return
    this.rangesKey = key

    const ratio = this.maxHz / this.minHz
    for (let band = 0; band < this.bandCount; band++) {
      const lowHz = this.minHz * Math.pow(ratio, band / this.bandCount)
      const highHz = this.minHz * Math.pow(ratio, (band + 1) / this.bandCount)
      const from = Math.min(binCount - 1, Math.max(0, Math.floor(lowHz / binHz)))
      const to = Math.min(binCount, Math.max(from + 1, Math.ceil(highHz / binHz)))
      this.ranges[band * 2] = from
      this.ranges[band * 2 + 1] = to
    }
  }
}

/**
 * Fill `out` with a byte spectrum that looks like speech: a ~4–6 Hz syllable envelope over a
 * harmonic series shaped by three formants.
 *
 * Used when the avatar is told it is speaking but no audio reaches the analyser (a muted tab,
 * an agent whose track has not attached yet). Feeding it through the same analyser keeps every
 * downstream effect identical instead of maintaining a second, fake animation path.
 */
export function synthesizeSpeechSpectrum(timeSeconds: number, sampleRate: number, out: Uint8Array): void {
  const binCount = out.length
  if (binCount === 0) return
  const binHz = sampleRate / (2 * binCount)

  // Syllable envelope: two incommensurate rates so the rhythm never visibly loops.
  const syllable =
    Math.max(0, Math.sin(timeSeconds * Math.PI * 2 * 4.3)) * 0.65 +
    Math.max(0, Math.sin(timeSeconds * Math.PI * 2 * 2.7 + 1.3)) * 0.35
  const phrase = 0.55 + 0.45 * Math.max(0, Math.sin(timeSeconds * 0.9))
  const envelope = Math.pow(syllable, 1.4) * phrase

  const fundamental = 120 + 35 * Math.sin(timeSeconds * 1.7)
  const formants = [
    { hz: 520 + 140 * Math.sin(timeSeconds * 3.1), width: 180, gain: 1 },
    { hz: 1500 + 400 * Math.sin(timeSeconds * 2.3 + 0.7), width: 320, gain: 0.7 },
    { hz: 2600 + 300 * Math.sin(timeSeconds * 1.9 + 2.1), width: 420, gain: 0.45 },
  ]

  for (let bin = 0; bin < binCount; bin++) {
    const hz = bin * binHz
    if (hz < 60 || hz > 9000) {
      out[bin] = 0
      continue
    }
    // Harmonic comb: peaks at multiples of the fundamental.
    const harmonic = Math.pow(Math.cos((Math.PI * hz) / fundamental), 8)
    let shape = 0
    for (const formant of formants) {
      const distance = (hz - formant.hz) / formant.width
      shape += formant.gain * Math.exp(-distance * distance)
    }
    // Spectral tilt: a voice keeps some energy (breath, fricatives) well above the formants.
    const tilt = 0.18 * Math.exp(-hz / 4000)
    const magnitude = envelope * (0.5 + 0.5 * harmonic) * Math.min(1, shape + tilt)
    // 60/255 sits under the analyser's noise floor, so the gaps between syllables read as
    // silence and every syllable produces a real onset.
    out[bin] = Math.max(0, Math.min(255, Math.round(60 + magnitude * 175)))
  }
}
