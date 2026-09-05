import { createNoise3D } from 'simplex-noise'
import { type Mesh, Vector3 } from 'three'
import type { BlobXyzAudioEffects } from './types.js'

const noise3D = createNoise3D()

const previousDisplacementMap = new WeakMap<Mesh, Float32Array>()

const audioSmoothing = {
  low: 0,
  mid: 0,
  high: 0,
  level: 0,
}

function getFrequencyBands(frequencyData: Uint8Array): {
  low: number
  mid: number
  high: number
  ultra: number
} {
  const dataLength = frequencyData.length

  const lowEnd = Math.floor(dataLength * 0.1)
  const midEnd = Math.floor(dataLength * 0.4)
  const highEnd = Math.floor(dataLength * 0.7)

  let lowSum = 0, midSum = 0, highSum = 0, ultraSum = 0

  for (let i = 0; i < dataLength; i++) {
    const value = (frequencyData[i] ?? 0) / 255

    if (i < lowEnd) lowSum += value
    else if (i < midEnd) midSum += value
    else if (i < highEnd) highSum += value
    else ultraSum += value
  }

  return {
    low: lowSum / lowEnd,
    mid: midSum / (midEnd - lowEnd),
    high: highSum / (highEnd - midEnd),
    ultra: ultraSum / (dataLength - highEnd),
  }
}

export interface LiquidPhysics {
  velocityX: number
  velocityY: number
  stretch: number
}

export function animateBlobXyz(
  mesh: Mesh,
  frequencyData: Uint8Array<ArrayBuffer>,
  analyser: AnalyserNode,
  spikeX: number,
  spikeY: number,
  spikeZ: number,
  amplitudeX: number = 1.0,
  amplitudeY: number = 1.0,
  amplitudeZ: number = 1.0,
  timeX: number,
  timeY: number,
  timeZ: number,
  baseScale: number = 1.0,
  touchPoints: Array<{
    position: Vector3
    strength: number
    startTime: number
    duration: number
  }> = [],
  listeningBlend: number = 0,
  thinkingBlend: number = 0,
  thinkingProgress: number = 0,
  audioEffects: BlobXyzAudioEffects = {
    bassSpike: 0.55,
    midSpike: 0.65,
    highSpike: 0.35,
    enabled: true,
    reactivity: 1.8,
    sensitivity: 0.08,
    breathing: 0.035,
    responseSpeed: 0.65,
    transientBoost: 0.4,
  },
  liquidPhysics?: LiquidPhysics,
): boolean {
  const positions = mesh.geometry.attributes.position
  if (!positions) return false

  const vertex = new Vector3()

  let previousDisplacements = previousDisplacementMap.get(mesh)
  if (!previousDisplacements || previousDisplacements.length !== positions.count) {
    previousDisplacements = new Float32Array(positions.count)
    previousDisplacements.fill(1)
    previousDisplacementMap.set(mesh, previousDisplacements)
  }

  const reduction = 0.00003
  const perf = performance.now() * reduction

  const isEnabled = audioEffects.enabled

  analyser.getByteFrequencyData(frequencyData)
  const bands = isEnabled ? getFrequencyBands(frequencyData) : { low: 0, mid: 0, high: 0, ultra: 0 }

  const responseSpeed = Math.min(1, Math.max(0, audioEffects.responseSpeed ?? 0.65))
  const transientBoost = Math.min(1, Math.max(0, audioEffects.transientBoost ?? 0.35))
  const reactivity = audioEffects.reactivity ?? 1.8
  const breathing = audioEffects.breathing ?? 0.035

  const smoothFactor = 0.12 + responseSpeed * 0.35
  audioSmoothing.low += (bands.low - audioSmoothing.low) * smoothFactor
  audioSmoothing.mid += (bands.mid - audioSmoothing.mid) * smoothFactor
  audioSmoothing.high += (bands.high - audioSmoothing.high) * smoothFactor
  const averageLevel = (bands.low * 0.4 + bands.mid * 0.35 + bands.high * 0.2 + bands.ultra * 0.05)
  audioSmoothing.level += (averageLevel - audioSmoothing.level) * smoothFactor

  const fastBlend = 0.15 + transientBoost * 0.5
  const fastBands = {
    low: audioSmoothing.low * (1 - fastBlend) + bands.low * fastBlend,
    mid: audioSmoothing.mid * (1 - fastBlend) + bands.mid * fastBlend,
    high: audioSmoothing.high * (1 - fastBlend) + bands.high * fastBlend,
  }
  const fastLevel = audioSmoothing.level * (1 - fastBlend) + averageLevel * fastBlend

  const sensitivity = audioEffects.sensitivity ?? 0.075
  const activationThreshold = Math.max(0.01, sensitivity) * 0.75
  const audioActive = isEnabled && fastLevel > activationThreshold

  // No scale change — blob stays the same size. Audio drives surface displacement only.
  const bassEnergy = isEnabled ? fastBands.low * audioEffects.bassSpike : 0
  const midEnergy = isEnabled ? fastBands.mid * audioEffects.midSpike : 0
  const highEnergy = isEnabled ? fastBands.high * audioEffects.highSpike : 0

  const idlePulse = audioActive ? 0 : breathing * 0.15 * Math.sin(perf * 60)
  const targetScale = baseScale * (1 + idlePulse)
  mesh.scale.set(targetScale, targetScale, targetScale)

  // Audio-driven displacement intensity: how far spikes push outward.
  // Louder audio = bigger surface deformation, like sound pushing from inside.
  const audioPush = isEnabled && audioActive
    ? Math.min(3.0, (bassEnergy * 0.7 + midEnergy * 0.9 + highEnergy * 0.5) * reactivity)
    : 0

  const tX = perf * timeX
  const tY = perf * timeY
  const tZ = perf * timeZ

  const baseFreqX = Math.max(0.025, spikeX)
  const baseFreqY = Math.max(0.025, spikeY)
  const baseFreqZ = Math.max(0.025, spikeZ)

  const spikeDensity = audioEffects.spikeDensity ?? 1.5
  const audioFreqBoost = 1 + audioPush * spikeDensity

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)

    const direction = vertex.clone().normalize()

    const amplitudeMultiplier =
      Math.abs(direction.x) * amplitudeX +
      Math.abs(direction.y) * amplitudeY +
      Math.abs(direction.z) * amplitudeZ

    // Idle noise: low frequency, gentle organic morphing
    const idleNoise = noise3D(
      direction.x * baseFreqX * 0.5 + tX,
      direction.y * baseFreqY * 0.5 + tY,
      direction.z * baseFreqZ * 0.5 + tZ,
    ) * 0.6 + noise3D(
      direction.x * baseFreqX * 0.3 + tX * 0.7,
      direction.y * baseFreqY * 0.3 + tY * 0.7,
      direction.z * baseFreqZ * 0.3 + tZ * 0.7,
    ) * 0.4

    // Audio spike noise: higher frequency, MORE spikes when louder.
    // audioFreqBoost increases the noise frequency with audio energy,
    // creating new spikes that didn't exist in the idle state.
    const spikeNoise = noise3D(
      direction.x * baseFreqX * audioFreqBoost + tX * 1.3,
      direction.y * baseFreqY * audioFreqBoost + tY * 1.3,
      direction.z * baseFreqZ * audioFreqBoost + tZ * 1.3,
    )

    // High-frequency detail that only appears during loud audio
    const detailNoise = audioPush > 0.2 ? noise3D(
      direction.x * baseFreqX * audioFreqBoost * 2 + tX * 1.8,
      direction.y * baseFreqY * audioFreqBoost * 2 + tY * 1.8,
      direction.z * baseFreqZ * audioFreqBoost * 2 + tZ * 1.8,
    ) * Math.min(1, (audioPush - 0.2) * 1.5) : 0

    const idleAmp = 0.14 * amplitudeMultiplier

    // Audio amplitude: sound pushes spikes outward from inside.
    // spikeNoise provides the spike pattern, audioPush controls how far they push.
    // Positive spikeNoise = spike bursts outward, negative = surface dents inward.
    const audioAmp = audioPush * 0.25 * amplitudeMultiplier
    const audioDetail = audioPush * 0.08 * amplitudeMultiplier

    // Blend: idle morphing + audio-driven spikes bursting out
    const speakingDisplacement = idleAmp * idleNoise
      + audioAmp * spikeNoise
      + audioDetail * detailNoise

    const listeningDisplacement = -idleAmp * idleNoise * 0.7
      + audioAmp * 0.4 * spikeNoise

    let thinkingDisplacement = 0
    if (thinkingBlend > 0.01) {
      const thinkNoise1 = noise3D(
        direction.x * 2 + tX * 3.5 + Math.sin(thinkingProgress * Math.PI * 2) * 1.5,
        direction.y * 2 + tY * 3.5 + Math.cos(thinkingProgress * Math.PI * 2.5) * 1.5,
        direction.z * 2 + tZ * 3.5 + Math.sin(thinkingProgress * Math.PI * 3) * 1.5,
      )
      const thinkNoise2 = noise3D(
        direction.x * 1 + tX * 2.5 - thinkingProgress * 3,
        direction.y * 1 + tY * 2.5 + thinkingProgress * 2.5,
        direction.z * 1 + tZ * 2.5 - thinkingProgress * 3.5,
      )
      const thinkNoise3 = noise3D(
        direction.x * 0.5 + tX * 1.5,
        direction.y * 0.5 + tY * 1.5,
        direction.z * 0.5 + tZ * 1.5,
      )
      const pulse = Math.sin(thinkingProgress * Math.PI * 5) * 0.3 + 0.7
      const fadeOut = 1 - Math.pow(thinkingProgress, 2)
      const thinkingNoise = (thinkNoise1 * 0.4 + thinkNoise2 * 0.35 + thinkNoise3 * 0.25) * pulse
      thinkingDisplacement = thinkingNoise * 0.35 * fadeOut * amplitudeMultiplier
    }

    let finalDisplacement
    if (thinkingBlend > 0.01) {
      const normalDisp = speakingDisplacement * (1 - listeningBlend) + listeningDisplacement * listeningBlend
      finalDisplacement = normalDisp * (1 - thinkingBlend) + thinkingDisplacement * thinkingBlend
    } else {
      finalDisplacement = speakingDisplacement * (1 - listeningBlend) + listeningDisplacement * listeningBlend
    }

    let displacement = 1 + finalDisplacement

    if (touchPoints.length > 0) {
      const currentTime = Date.now()
      let touchDisplacement = 0

      for (const touch of touchPoints) {
        const elapsed = currentTime - touch.startTime
        const progress = elapsed / touch.duration

        let easeFactor
        if (progress < 0.25) {
          const t = progress / 0.25
          easeFactor = t * t
        } else {
          const t = (progress - 0.25) / 0.75
          easeFactor = 1 - Math.pow(t, 3)
        }

        if (easeFactor <= 0.01) continue

        const dist = vertex.distanceTo(touch.position)
        const influenceRadius = 2.1
        if (dist > influenceRadius) continue

        const influence = Math.max(0, 1 - dist / influenceRadius)
        const smoothInfluence = Math.pow(influence, 3.2)

        const sink = -touch.strength * 0.42 * smoothInfluence * easeFactor
        const wave = Math.sin(dist * 2.4 - progress * 5.4) * 0.24 * smoothInfluence * easeFactor

        touchDisplacement += sink + wave
      }

      if (touchDisplacement !== 0) {
        touchDisplacement = Math.max(-0.7, Math.min(0.5, touchDisplacement))
        displacement += touchDisplacement
      }
    }

    const minDisplacement = 0.55
    const maxDisplacement = 1.45
    const targetDisplacement = Math.max(minDisplacement, Math.min(maxDisplacement, displacement))

    const previous = previousDisplacements[i]
    const smoothing = audioActive ? 0.3 + responseSpeed * 0.4 : 0.25
    const smoothedDisplacement = previous + (targetDisplacement - previous) * smoothing
    previousDisplacements[i] = smoothedDisplacement

    vertex.normalize().multiplyScalar(smoothedDisplacement)

    if (liquidPhysics) {
      const { velocityX, velocityY, stretch } = liquidPhysics
      const velocityMagnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY)

      if (velocityMagnitude > 0.0005) {
        const velDirX = velocityX / velocityMagnitude
        const velDirY = velocityY / velocityMagnitude
        const alignment = direction.x * velDirX + direction.y * velDirY
        const velocityInfluence = Math.min(velocityMagnitude * 8, 0.8)
        const stretchAmount = alignment * velocityInfluence * stretch
        const deformation = stretchAmount > 0
          ? stretchAmount * 0.25
          : stretchAmount * 0.15
        const radialScale = smoothedDisplacement
        vertex.x += velDirX * deformation * radialScale
        vertex.y += velDirY * deformation * radialScale
      }
    }

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  positions.needsUpdate = true
  mesh.geometry.computeVertexNormals()

  return audioActive
}
