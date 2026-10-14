import { describe, expect, it } from 'vitest';
import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three';
import { animateBlobXyz, getAudioSmoothing } from '../../src/avatar/renderers/blob-xyz/animation';

/**
 * three.js geometry and meshes are CPU-side objects — no GL context needed to displace their
 * vertices, which is what lets the displacement maths be tested here rather than in a browser.
 */
function blobMesh(): Mesh {
  return new Mesh(new SphereGeometry(1, 12, 12), new MeshBasicMaterial());
}

/** An analyser that always reports the given loudness across every frequency bin. */
function analyserAt(level: number): { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer> } {
  const data = new Uint8Array(1024);
  const analyser = {
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: (target: Uint8Array) => target.fill(level),
  } as unknown as AnalyserNode;
  return { analyser, data };
}

function animate(mesh: Mesh, level: number): void {
  const { analyser, data } = analyserAt(level);
  animateBlobXyz(mesh, data, analyser, 1, 1, 1, 1, 1, 1, 1, 1, 1);
}

/**
 * How spiky the surface is: the standard deviation of the vertex radii.
 *
 * Mean radius is the wrong measure — audio displacement pushes vertices both outward and
 * inward, so the average barely moves while the surface visibly deforms.
 */
function spikiness(mesh: Mesh): number {
  const positions = mesh.geometry.attributes.position;
  const radii: number[] = [];
  for (let i = 0; i < positions.count; i++) {
    radii.push(Math.hypot(positions.getX(i), positions.getY(i), positions.getZ(i)));
  }
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  const variance = radii.reduce((a, r) => a + (r - mean) ** 2, 0) / radii.length;
  return Math.sqrt(variance);
}

describe('blob audio smoothing isolation', () => {
  /**
   * The smoothing state used to be a single module-level object shared by every BlobXyz on the
   * page. Two avatars — the multi-instance case the library's own docs open with — fed each
   * other's audio into their own animation. It is keyed per mesh now, like the displacement
   * state beside it.
   *
   * Assert on the smoother directly: idle noise is driven by `performance.now()`, so vertex
   * positions from two sequential silent runs will never match even when isolation is correct.
   */
  it('keeps two meshes from bleeding audio into each other', () => {
    const loud = blobMesh();
    const silent = blobMesh();

    // Drive one hard and the other not at all, interleaved the way two live avatars would be.
    for (let frame = 0; frame < 30; frame++) {
      animate(loud, 255);
      animate(silent, 0);
    }

    expect(getAudioSmoothing(loud).level).toBeGreaterThan(getAudioSmoothing(silent).level);
    expect(getAudioSmoothing(silent).level).toBeLessThan(0.05);
  });

  it('gives a silent mesh the same result whether or not a loud one is also running', () => {
    const aloneSilent = blobMesh();
    for (let frame = 0; frame < 30; frame++) animate(aloneSilent, 0);

    const alongsideSilent = blobMesh();
    const loud = blobMesh();
    for (let frame = 0; frame < 30; frame++) {
      animate(loud, 255);
      animate(alongsideSilent, 0);
    }

    expect(getAudioSmoothing(alongsideSilent).level).toBeCloseTo(
      getAudioSmoothing(aloneSilent).level,
      5,
    );
    expect(getAudioSmoothing(loud).level).toBeGreaterThan(getAudioSmoothing(alongsideSilent).level);
  });

  it('builds up smoothed energy over successive loud frames', () => {
    const mesh = blobMesh();

    animate(mesh, 255);
    const afterOne = spikiness(mesh);
    for (let frame = 0; frame < 20; frame++) animate(mesh, 255);
    const afterMany = spikiness(mesh);

    expect(afterMany).toBeGreaterThan(afterOne);
  });

  it('produces finite vertex positions rather than propagating NaN', () => {
    const mesh = blobMesh();

    for (let frame = 0; frame < 10; frame++) animate(mesh, 128);

    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      expect(Number.isFinite(positions.getX(i))).toBe(true);
      expect(Number.isFinite(positions.getY(i))).toBe(true);
      expect(Number.isFinite(positions.getZ(i))).toBe(true);
    }
  });
});

describe('blob rest directions', () => {
  it('does not bake liquid stretch into a cone the mesh cannot leave', () => {
    const mesh = blobMesh();
    const positions = mesh.geometry.attributes.position!;
    const originals: [number, number, number][] = [];
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const length = Math.hypot(x, y, z) || 1;
      originals.push([x / length, y / length, z / length]);
    }

    const { analyser, data } = analyserAt(0);
    const liquid = { velocityX: 0, velocityY: 0.08, stretch: 0.6 };
    for (let frame = 0; frame < 80; frame++) {
      animateBlobXyz(
        mesh,
        data,
        analyser,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        [],
        0,
        0,
        0,
        undefined,
        liquid,
      );
    }

    liquid.velocityY = 0;
    for (let frame = 0; frame < 40; frame++) {
      animateBlobXyz(
        mesh,
        data,
        analyser,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        1,
        [],
        0,
        0,
        0,
        undefined,
        liquid,
      );
    }

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const length = Math.hypot(x, y, z) || 1;
      const original = originals[i]!;
      const alignment =
        (x / length) * original[0] + (y / length) * original[1] + (z / length) * original[2];
      expect(alignment).toBeGreaterThan(0.98);
    }
  });
});
