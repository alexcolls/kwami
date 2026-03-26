import { SphereGeometry, type BufferGeometry } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Create a sphere geometry for the blob with merged duplicate vertices.
 * SphereGeometry duplicates vertices along the UV seam and at poles,
 * causing visible crease lines. mergeVertices collapses duplicates into
 * indexed geometry so computeVertexNormals produces smooth normals everywhere.
 */
export function createBlobXyzGeometry(segments: number = 180): BufferGeometry {
  const sphere = new SphereGeometry(1, segments, segments)
  const merged = mergeVertices(sphere, 1e-4)
  sphere.dispose()
  return merged
}
