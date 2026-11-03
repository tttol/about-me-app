/** A three-dimensional point in the molecular object's local coordinates. */
export type Vector3 = Readonly<{ x: number; y: number; z: number }>;

/** Indices of two connected vertices. */
export type Edge = readonly [number, number];

export type MolecularGeometry = Readonly<{
  vertices: readonly Vector3[];
  edges: readonly Edge[];
  anchors: Readonly<{ career: number; speaking: number; writing: number }>;
}>;

export type ProjectionOptions = Readonly<{
  yaw: number;
  pitch: number;
  collapse: number;
  width: number;
  height: number;
}>;

/** Screen coordinates and depth cues, suitable for a canvas or DOM overlay. */
export type ProjectedVertex = Readonly<{
  x: number;
  y: number;
  depth: number;
  opacity: number;
  radius: number;
}>;

const RING_COUNT = 15;
const RING_SIZE = 20;
const FOCAL_DISTANCE = 4.5;

type RadialField = Readonly<{
  direction: Vector3;
  strength: number;
  spread: number;
}>;

const RADIAL_FIELDS: readonly RadialField[] = [
  { direction: { x: -0.65, y: 0.5, z: 0.57 }, strength: 0.55, spread: 0.16 },
  { direction: { x: 0.92, y: -0.2, z: 0.33 }, strength: 0.48, spread: 0.12 },
  { direction: { x: -0.5, y: -0.65, z: -0.58 }, strength: 0.46, spread: 0.15 },
  { direction: { x: 0.25, y: 0.86, z: -0.44 }, strength: 0.35, spread: 0.12 },
  { direction: { x: 0.08, y: 0.15, z: 0.985 }, strength: -0.58, spread: 0.11 },
  { direction: { x: 0.66, y: 0.56, z: -0.5 }, strength: -0.4, spread: 0.13 },
  { direction: { x: -0.15, y: -0.8, z: 0.58 }, strength: -0.43, spread: 0.12 },
];

function noise(index: number, seed: number): number {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function nearestVertex(vertices: readonly Vector3[], target: Vector3): number {
  return vertices.reduce((nearest, vertex, index) => {
    const distance = (point: Vector3): number =>
      (point.x - target.x) ** 2 +
      (point.y - target.y) ** 2 +
      (point.z - target.z) ** 2;

    return distance(vertex) < distance(vertices[nearest]) ? index : nearest;
  }, 0);
}

function deformDirection(direction: Vector3, index: number): Vector3 {
  const lobes = RADIAL_FIELDS.reduce((radius, field) => {
    const length = Math.hypot(field.direction.x, field.direction.y, field.direction.z);
    const alignment = (
      direction.x * field.direction.x +
      direction.y * field.direction.y +
      direction.z * field.direction.z
    ) / length;

    return radius + field.strength * Math.exp((alignment - 1) / field.spread);
  }, 1);
  const ripple = Math.sin(direction.x * 6 + direction.y * 3) *
    Math.cos(direction.z * 5 - direction.y * 4) * 0.075;
  const radius = clamp(lobes + ripple + (noise(index, 2) - 0.5) * 0.09, 0.42, 1.65);

  return {
    x: direction.x * radius * 1.28,
    y: direction.y * radius * 1.06 +
      Math.sin(direction.x * 4 + direction.z * 3) * Math.hypot(direction.x, direction.z) * 0.045,
    z: direction.z * radius * 0.88,
  };
}

/**
 * Creates a deterministic, connected polyhedral shell with a few internal braces.
 * Adjacent, staggered rings form local triangular cells rather than an arbitrary
 * all-to-all graph. Directional radial fields create broad lobes and deep dents
 * in three dimensions; smaller angular variations break the latitude symmetry.
 * The three anchors occupy readable foreground positions.
 */
export function createMolecularGeometry(): MolecularGeometry {
  const rings = Array.from({ length: RING_COUNT }, (_, ring) =>
    Array.from({ length: RING_SIZE }, (_, segment): Vector3 => {
      const index = ring * RING_SIZE + segment;
      const latitude =
        (Math.PI * (ring + 1)) / (RING_COUNT + 1) +
        (noise(index, 3) - 0.5) * 0.14;
      const longitude =
        (2 * Math.PI * (segment + (ring % 2) * 0.36)) / RING_SIZE +
        Math.sin(latitude * 2.3) * 0.2 +
        Math.sin(ring * 1.73) * 0.055 +
        (noise(index, 1) - 0.5) * 0.18;

      return deformDirection({
        x: Math.sin(latitude) * Math.cos(longitude),
        y: Math.cos(latitude),
        z: Math.sin(latitude) * Math.sin(longitude),
      }, index);
    }),
  );
  const vertices: readonly Vector3[] = [
    ...rings.flat(),
    deformDirection({ x: 0, y: 1, z: 0 }, RING_COUNT * RING_SIZE),
    deformDirection({ x: 0, y: -1, z: 0 }, RING_COUNT * RING_SIZE + 1),
  ];
  const ringEdges = rings.flatMap((_, ring) =>
    Array.from({ length: RING_SIZE }, (_, segment): Edge => [
      ring * RING_SIZE + segment,
      ring * RING_SIZE + ((segment + 1) % RING_SIZE),
    ]),
  );
  const connectingEdges = rings.slice(0, -1).flatMap((_, ring) =>
    Array.from({ length: RING_SIZE }, (_, segment): readonly Edge[] => [
      [ring * RING_SIZE + segment, (ring + 1) * RING_SIZE + segment],
      [
        ring * RING_SIZE + segment,
        (ring + 1) * RING_SIZE +
          ((segment + (ring % 2 === 0 ? RING_SIZE - 1 : 1)) % RING_SIZE),
      ],
    ]).flat(),
  );
  const polarEdges = Array.from({ length: RING_SIZE }, (_, segment): readonly Edge[] => [
    [RING_COUNT * RING_SIZE, segment],
    [RING_COUNT * RING_SIZE + 1, (RING_COUNT - 1) * RING_SIZE + segment],
  ]).flat();
  const braces = Array.from({ length: 10 }, (_, index): Edge => [
    (index + 1) * RING_SIZE + ((index * 7) % RING_SIZE),
    (index + 3) * RING_SIZE + ((index * 7 + 5) % RING_SIZE),
  ]);

  return {
    vertices,
    edges: [...ringEdges, ...connectingEdges, ...polarEdges, ...braces],
    anchors: {
      career: nearestVertex(vertices, { x: -0.91, y: 0.55, z: 0.4 }),
      speaking: nearestVertex(vertices, { x: 1.2, y: 0.02, z: 0.25 }),
      writing: nearestVertex(vertices, { x: -0.79, y: -0.63, z: 0.4 }),
    },
  };
}

function foldVertex(vertex: Vector3, index: number, collapse: number): Vector3 {
  const delay = noise(index, 4) * 0.2;
  const progress = clamp((collapse - delay) / (1 - delay), 0, 1);
  const contraction = (1 - progress) ** 2.2 + progress * 0.022;
  const twist = progress * (1.7 + (noise(index, 5) - 0.5) * 1.1);
  const cosine = Math.cos(twist);
  const sine = Math.sin(twist);
  const crease = Math.sin(index * 2.4) * progress * (1 - progress) * 0.1;

  return {
    x: (vertex.x * cosine - vertex.z * sine) * contraction + crease,
    y: vertex.y * contraction + (noise(index, 6) - 0.5) * progress * 0.016,
    z: (vertex.x * sine + vertex.z * cosine) * contraction - crease * 0.6,
  };
}

/**
 * Rotates, crumples, and perspective-projects the object into a viewport.
 * Angles are radians. Collapse is clamped to 0–1; 1 leaves a small folded core.
 * The returned coordinates are CSS pixels with room around the shell for labels.
 */
export function projectGeometry(
  geometry: MolecularGeometry,
  options: ProjectionOptions,
): readonly ProjectedVertex[] {
  const width = Math.max(1, options.width);
  const height = Math.max(1, options.height);
  const horizontalPadding = Math.min(width * 0.16, width < 600 ? 55 : 100);
  const verticalPadding = Math.min(height * 0.06, 20);
  const yawCosine = Math.cos(options.yaw);
  const yawSine = Math.sin(options.yaw);
  const pitchCosine = Math.cos(options.pitch);
  const pitchSine = Math.sin(options.pitch);
  const collapse = clamp(options.collapse, 0, 1);
  const rotate = (vertex: Vector3): Vector3 => {
    const x = vertex.x * yawCosine + vertex.z * yawSine;
    const yawDepth = vertex.z * yawCosine - vertex.x * yawSine;
    const y = vertex.y * pitchCosine - yawDepth * pitchSine;
    const z = vertex.y * pitchSine + yawDepth * pitchCosine;
    const perspective = FOCAL_DISTANCE / (FOCAL_DISTANCE - z);

    return { x: x * perspective, y: y * perspective, z };
  };

  // Fit the unfolded pose, so tilting cannot clip the shell and folding cannot
  // accidentally enlarge it again by fitting the shrinking core to the stage.
  const unfolded = geometry.vertices.map(rotate);
  const minimumX = Math.min(...unfolded.map(({ x }) => x));
  const maximumX = Math.max(...unfolded.map(({ x }) => x));
  const minimumY = Math.min(...unfolded.map(({ y }) => y));
  const maximumY = Math.max(...unfolded.map(({ y }) => y));
  const scale = Math.min(
    (width - horizontalPadding * 2) / Math.max(0.001, maximumX - minimumX),
    (height - verticalPadding * 2) / Math.max(0.001, maximumY - minimumY),
  );
  const centerX = ((minimumX + maximumX) / 2) * (1 - collapse);
  const centerY = ((minimumY + maximumY) / 2) * (1 - collapse);

  return geometry.vertices.map((vertex, index): ProjectedVertex => {
    const projected = rotate(foldVertex(vertex, index, collapse));
    const depth = clamp((projected.z + 1.5) / 3, 0, 1);

    return {
      x: width / 2 + (projected.x - centerX) * scale,
      y: height / 2 - (projected.y - centerY) * scale,
      depth,
      opacity: clamp(0.13 + depth ** 1.8 * 1.45, 0, 1),
      radius: 0.8 + depth * 1.9,
    };
  });
}
