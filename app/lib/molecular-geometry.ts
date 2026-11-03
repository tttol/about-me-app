import type { SectionId } from "./portfolio-content";

/** A three-dimensional point in the molecular object's local coordinates. */
export type Vector3 = Readonly<{ x: number; y: number; z: number }>;

/** Indices of two connected vertices. */
export type Edge = readonly [number, number];

export type MolecularGeometry = Readonly<{
  vertices: readonly Vector3[];
  edges: readonly Edge[];
  anchors: Readonly<Record<SectionId, number>>;
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

const EDGE_COUNT = 255;
const BRIDGE_COUNT = 42;
const SCATTER_SEED = 0x71c4a9d3;
const FOCAL_DISTANCE = 4.5;
const MINIMUM_DENT_RADIUS = 0.28;

type ScatterCluster = Readonly<{
  count: number;
  center: Vector3;
  spread: Vector3;
}>;

type OutlierArm = Readonly<{ count: number; start: Vector3; end: Vector3 }>;

type EdgeCandidate = Readonly<{ from: number; to: number; distanceSquared: number }>;

const ANCHOR_POINTS: readonly Vector3[] = [
  { x: -1.1, y: 0.78, z: 0.3 },
  { x: 1.35, y: 0.12, z: 0.32 },
  { x: -0.98, y: -0.82, z: 0.34 },
  { x: 0.65, y: 0.86, z: 0.26 },
  { x: 0.86, y: -0.91, z: 0.3 },
];

const CLUSTERS: readonly ScatterCluster[] = [
  { count: 26, center: { x: -0.28, y: 0.33, z: 0.1 }, spread: { x: 0.55, y: 0.6, z: 0.48 } },
  { count: 22, center: { x: -0.08, y: -0.22, z: 0.14 }, spread: { x: 0.55, y: 0.52, z: 0.5 } },
  { count: 16, center: { x: 0.3, y: 0.18, z: -0.28 }, spread: { x: 0.5, y: 0.5, z: 0.5 } },
];

const OUTLIER_ARMS: readonly OutlierArm[] = [
  { count: 6, start: { x: -0.6, y: 0.35, z: 0.05 }, end: { x: -1.75, y: 0.08, z: -0.48 } },
  { count: 6, start: { x: 0.6, y: 0.45, z: -0.42 }, end: { x: 1.7, y: 0.32, z: 0.48 } },
  { count: 5, start: { x: 0.05, y: -0.48, z: 0.25 }, end: { x: 0.38, y: -1.35, z: -0.64 } },
];

function noise(index: number, seed: number): number {
  const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function sample(index: number, stream: number): number {
  let value = SCATTER_SEED ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(stream + 1, 0x85ebca6b);
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

function scatterOffset(index: number, stream: number): number {
  return (sample(index, stream) + sample(index, stream + 1) + sample(index, stream + 2) - 1.5) * 1.15;
}

function keepPointDentable(point: Vector3): Vector3 {
  const radius = Math.hypot(point.x, point.y, point.z);
  if (radius === 0) return { x: 0.33, y: 0, z: 0 };
  const scale = Math.max(1, 0.33 / radius);

  return {
    x: point.x * scale,
    y: point.y * scale,
    z: point.z * scale,
  };
}

function connectScatter(vertices: readonly Vector3[], outlierStart: number): readonly Edge[] {
  const candidates = vertices.flatMap((vertex, from) =>
    vertices.slice(from + 1).map((neighbor, offset): EdgeCandidate => ({
      from,
      to: from + offset + 1,
      distanceSquared: (vertex.x - neighbor.x) ** 2 +
        (vertex.y - neighbor.y) ** 2 + (vertex.z - neighbor.z) ** 2,
    })),
  ).sort((left, right) => left.distanceSquared - right.distanceSquared || left.from - right.from || left.to - right.to);
  const reached = new Set([0]);
  const tree: EdgeCandidate[] = [];

  // A distance-based spanning tree connects the scattered groups and their wisps.
  while (reached.size < vertices.length) {
    const connection = candidates.find(({ from, to }) => reached.has(from) !== reached.has(to));
    if (!connection) throw new Error("Unable to connect the scattered vertices.");
    tree.push(connection);
    reached.add(connection.from);
    reached.add(connection.to);
  }

  const key = ({ from, to }: EdgeCandidate): number => from * vertices.length + to;
  const selected = new Set(tree.map(key));
  const bridges = candidates.filter((candidate) =>
    candidate.to < outlierStart &&
    candidate.distanceSquared > 0.3 && candidate.distanceSquared < 2 &&
    !selected.has(key(candidate)),
  ).sort((left, right) => sample(key(left), 42) - sample(key(right), 42)).slice(0, BRIDGE_COUNT);
  bridges.forEach((bridge) => selected.add(key(bridge)));
  const local = candidates.filter((candidate) => !selected.has(key(candidate)))
    .slice(0, EDGE_COUNT - tree.length - bridges.length);

  return [...tree, ...local, ...bridges].map(({ from, to }): Edge => [from, to]);
}

/**
 * Creates a seeded volumetric network with dense knots, open gaps, and wispy
 * outliers. Local links concentrate in the knots; a spanning tree and longer
 * bridges connect the groups through the interior without forming a shell.
 */
export function createMolecularGeometry(): MolecularGeometry {
  const clusters = CLUSTERS.flatMap((cluster, clusterIndex) =>
    Array.from({ length: cluster.count }, (_, pointIndex): Vector3 => {
      const index = clusterIndex * 100 + pointIndex;
      return keepPointDentable({
        x: cluster.center.x + scatterOffset(index, 0) * cluster.spread.x,
        y: cluster.center.y + scatterOffset(index, 3) * cluster.spread.y,
        z: cluster.center.z + scatterOffset(index, 6) * cluster.spread.z,
      });
    }),
  );
  const outliers = OUTLIER_ARMS.flatMap((arm, armIndex) =>
    Array.from({ length: arm.count }, (_, pointIndex): Vector3 => {
      const index = 500 + armIndex * 100 + pointIndex;
      const progress = (pointIndex + 0.35 + sample(index, 11) * 0.6) / arm.count;
      const bend = Math.sin(progress * Math.PI) * 0.12;
      return keepPointDentable({
        x: arm.start.x + (arm.end.x - arm.start.x) * progress + scatterOffset(index, 12) * 0.08,
        y: arm.start.y + (arm.end.y - arm.start.y) * progress + scatterOffset(index, 15) * 0.1 + bend,
        z: arm.start.z + (arm.end.z - arm.start.z) * progress + scatterOffset(index, 18) * 0.1 - bend,
      });
    }),
  );
  const vertices = [...ANCHOR_POINTS, ...clusters, ...outliers];

  return {
    vertices,
    edges: connectScatter(vertices, ANCHOR_POINTS.length + clusters.length),
    anchors: {
      "work-experience": 0,
      speakings: 1,
      articles: 2,
      awards: 3,
      certifications: 4,
    },
  };
}

/**
 * Pulls an unlabelled point and nearby graph nodes inward.
 * Returns the original geometry for invalid, anchored, or fully dented points.
 * Bonds and anchor indices are shared; vertices are copied for interpolation.
 * Existing vertices never move farther from the center, even after repeated use.
 */
export function dentGeometry(
  geometry: MolecularGeometry,
  vertexIndex: number,
  strength = 0.26,
): MolecularGeometry {
  const anchorIndices = new Set(Object.values(geometry.anchors));
  const selected = geometry.vertices[vertexIndex];
  if (!Number.isInteger(vertexIndex) || !selected || anchorIndices.has(vertexIndex) ||
      !Number.isFinite(strength) || strength <= 0) {
    return geometry;
  }

  const selectedRadius = Math.hypot(selected.x, selected.y, selected.z);
  if (selectedRadius <= MINIMUM_DENT_RADIUS + 0.001) {
    return geometry;
  }

  const amount = clamp(strength, 0, 0.55);
  const falloff = 0.55 + selectedRadius * 0.18;
  const direction = {
    x: selected.x / selectedRadius,
    y: selected.y / selectedRadius,
    z: selected.z / selectedRadius,
  };
  const vertices = geometry.vertices.map((vertex, index): Vector3 => {
    if (anchorIndices.has(index)) return vertex;

    const distanceSquared = (vertex.x - selected.x) ** 2 +
      (vertex.y - selected.y) ** 2 + (vertex.z - selected.z) ** 2;
    const influence = Math.exp(-distanceSquared / (falloff * falloff));
    const contraction = amount * (0.035 + influence * 0.965);
    const pull = amount * influence * 0.085;
    const bent = {
      x: vertex.x * (1 - contraction) - direction.x * pull,
      y: vertex.y * (1 - contraction) - direction.y * pull,
      z: vertex.z * (1 - contraction) - direction.z * pull,
    };
    const previousRadius = Math.hypot(vertex.x, vertex.y, vertex.z);
    const bentRadius = Math.hypot(bent.x, bent.y, bent.z);
    const boundedRadius = Math.min(previousRadius, Math.max(MINIMUM_DENT_RADIUS, bentRadius));
    const scale = bentRadius > 0 ? boundedRadius / bentRadius : 1;

    return { x: bent.x * scale, y: bent.y * scale, z: bent.z * scale };
  });

  return { vertices, edges: geometry.edges, anchors: geometry.anchors };
}

/** Finds a nearby projected point, favoring foreground points in close overlaps. */
export function hitTestVertex(
  projectedVertices: readonly ProjectedVertex[],
  x: number,
  y: number,
  radius: number,
): number | null {
  if (![x, y, radius].every(Number.isFinite) || radius <= 0) return null;

  const hit = projectedVertices.reduce<Readonly<{ index: number | null; score: number }>>(
    (closest, vertex, index) => {
      const distanceSquared = (vertex.x - x) ** 2 + (vertex.y - y) ** 2;
      if (!Number.isFinite(distanceSquared) || distanceSquared > radius * radius) return closest;

      const score = distanceSquared / (radius * radius) + (1 - clamp(vertex.depth, 0, 1)) * 0.14;
      return score < closest.score ? { index, score } : closest;
    },
    { index: null, score: Number.POSITIVE_INFINITY },
  );

  return hit.index;
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
 * The returned coordinates are CSS pixels with room around the graph for labels.
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

  // Fit the unfolded pose, so tilting cannot clip the graph and folding cannot
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
