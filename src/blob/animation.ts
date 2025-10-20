import { createNoise3D } from 'simplex-noise';
import { type Mesh, Vector3 } from 'three';

const noise3D = createNoise3D();

/**
 * Extract frequency bands from the full frequency data
 */
function getFrequencyBands(frequencyData: Uint8Array): {
  low: number;
  mid: number;
  high: number;
  ultra: number;
} {
  const dataLength = frequencyData.length;

  // Split into frequency bands (normalized 0-1)
  const lowEnd = Math.floor(dataLength * 0.1); // 0-10% (bass)
  const midEnd = Math.floor(dataLength * 0.4); // 10-40% (mids)
  const highEnd = Math.floor(dataLength * 0.7); // 40-70% (highs)
  // 70-100% (ultra high)

  let lowSum = 0, midSum = 0, highSum = 0, ultraSum = 0;

  for (let i = 0; i < dataLength; i++) {
    const value = (frequencyData[i] ?? 0) / 255; // Normalize

    if (i < lowEnd) lowSum += value;
    else if (i < midEnd) midSum += value;
    else if (i < highEnd) highSum += value;
    else ultraSum += value;
  }

  return {
    low: lowSum / lowEnd,
    mid: midSum / (midEnd - lowEnd),
    high: highSum / (highEnd - midEnd),
    ultra: ultraSum / (dataLength - highEnd),
  };
}

/**
 * Animate the blob mesh based on audio frequency data
 * Creates a liquid, speaking effect that reacts naturally to sound frequencies
 */
export function animateBlob(
  mesh: Mesh,
  frequencyData: Uint8Array<ArrayBuffer>,
  analyser: AnalyserNode,
  spikeX: number,
  spikeY: number,
  spikeZ: number,
  timeX: number,
  timeY: number,
  timeZ: number,
): void {
  // Time calculation - faster for more responsive animation
  const reduction = 0.00003;
  const perf = performance.now() * reduction;
  const tX = perf * timeX;
  const tY = perf * timeY;
  const tZ = perf * timeZ;

  const positions = mesh.geometry.attributes.position;
  if (!positions) return;

  const vertex = new Vector3();

  // Get frequency data
  analyser.getByteFrequencyData(frequencyData);

  // Extract frequency bands for natural sound reaction
  const bands = getFrequencyBands(frequencyData);

  // Very subtle overall scale based only on low frequencies (bass)
  // This creates a "breathing" effect without dominating the animation
  const breathScale = 1 + (bands.low * 0.08);
  mesh.scale.set(breathScale, breathScale, breathScale);

  // Calculate noise frequencies for smooth, organic movement
  const baseFreqX = Math.max(0.025, spikeX);
  const baseFreqY = Math.max(0.025, spikeY);
  const baseFreqZ = Math.max(0.025, spikeZ);

  // Apply frequency-reactive noise to each vertex
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i);

    // Normalize to get the direction
    const direction = vertex.clone().normalize();

    // Calculate vertex position factors
    const heightFactor = (direction.y + 1) * 0.5; // 0 at bottom, 1 at top
    const radialFactor = Math.sqrt(
      direction.x * direction.x + direction.z * direction.z,
    );
    const angleFactor = Math.atan2(direction.z, direction.x) / Math.PI;

    // Map frequency bands to different parts of the blob for liquid effect
    // Low frequencies (bass) - affect bottom/center more
    const lowInfluence = (1 - heightFactor * 0.7) * bands.low;

    // Mid frequencies - affect middle regions and create "speaking" motion
    const midInfluence
      = (0.5 + Math.sin(angleFactor * 6 + tY * 2) * 0.5) * bands.mid;

    // High frequencies - affect top and create detail/texture
    const highInfluence = (heightFactor * 0.8 + 0.2) * bands.high;

    // Ultra high - create surface ripples
    const ultraInfluence = bands.ultra * radialFactor;

    // Combine all influences for natural, varied amplitude
    const combinedAmplitude = 0.12
      + lowInfluence * 0.25
      + midInfluence * 0.35
      + highInfluence * 0.25
      + ultraInfluence * 0.15;

    // Add frequency-modulated time offset for more dynamic movement
    const timeOffset = bands.mid * 2 + bands.high * 3;

    // Generate multi-layered noise for liquid texture
    const noise1 = noise3D(
      direction.x * baseFreqX + tX + timeOffset,
      direction.y * baseFreqY + tY + timeOffset * 0.5,
      direction.z * baseFreqZ + tZ + timeOffset * 0.3,
    );

    // Second noise layer for detail (faster, smaller)
    const noise2 = noise3D(
      direction.x * baseFreqX * 2.5 + tX * 1.5 + bands.high * 5,
      direction.y * baseFreqY * 2.5 + tY * 1.5 + bands.mid * 4,
      direction.z * baseFreqZ * 2.5 + tZ * 1.5 + bands.ultra * 6,
    );

    // Combine noises with frequency weighting
    const finalNoise = noise1 * 0.7 + noise2 * 0.3;

    // Apply displacement with natural liquid motion
    const displacement = 1 + combinedAmplitude * finalNoise;

    vertex.normalize().multiplyScalar(displacement);
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }

  positions.needsUpdate = true;
  mesh.geometry.computeVertexNormals();
}
