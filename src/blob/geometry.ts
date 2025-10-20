import { SphereGeometry } from 'three';

/**
 * Create a sphere geometry for the blob
 * @param segments - Number of segments (resolution) for the sphere
 * @returns SphereGeometry instance
 */
export function createBlobGeometry(segments: number = 180): SphereGeometry {
  return new SphereGeometry(1, segments, segments);
}
