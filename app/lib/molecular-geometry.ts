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

const SHELL_COUNT = 220;
const INTERIOR_COUNT = 140;
const CORE_COUNT = 60;
const LOCAL_CONNECTIONS = 8;
const SCATTER_SEED = 0x71c4a9d3;
const FOCAL_DISTANCE = 4.5;
const MINIMUM_DENT_RADIUS = 0.03;

type EdgeCandidate = Readonly<{ from: number; to: number; distanceSquared: number }>;

const ANCHOR_POINTS: readonly Vector3[] = [
  { x: -1.1, y: 0.78, z: 0.3 },
  { x: 1.35, y: 0.12, z: 0.32 },
  { x: -0.98, y: -0.82, z: 0.34 },
  { x: 0.65, y: 0.86, z: 0.26 },
  { x: 0.86, y: -0.91, z: 0.3 },
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

function squaredDistance(first: Vector3, second: Vector3): number {
  return (first.x - second.x) ** 2 + (first.y - second.y) ** 2 + (first.z - second.z) ** 2;
}

/** Samples an uneven, folded shell and its interior without a repeating lattice. */
function createMeshPoint(index: number): Vector3 {
  const shell = index < SHELL_COUNT;
  const core = index >= SHELL_COUNT + INTERIOR_COUNT;
  const angle = index * Math.PI * (3 - Math.sqrt(5)) + (sample(index, 1) - 0.5) * 0.45;
  const vertical = sample(index, 2) * 2 - 1;
  const horizontal = Math.sqrt(1 - vertical * vertical);
  const fold = 1 + Math.sin(angle * 3 + vertical * 4) * 0.18 +
    Math.cos(angle * 5 - vertical * 3) * 0.1;
  const radius = shell ? (0.85 + sample(index, 3) * 0.16) * fold
    : core ? 0.13 + sample(index, 4) * 0.25 : 0.38 + sample(index, 5) * 0.4;

  return {
    x: Math.cos(angle) * horizontal * radius * 1.32,
    y: vertical * radius * 0.96,
    z: Math.sin(angle) * horizontal * radius,
  };
}

/**
 * Builds short triangular neighborhoods, then joins any disconnected components
 * with their shortest available bridge. Navigation points remain peripheral.
 */
function connectMesh(vertices: readonly Vector3[]): readonly Edge[] {
  const firstWhite = ANCHOR_POINTS.length;
  const candidates: EdgeCandidate[] = vertices.slice(firstWhite).flatMap((point, offset) => {
    const from = offset + firstWhite;
    return vertices.slice(from + 1).map((neighbor, index) => ({
      from, to: from + index + 1, distanceSquared: squaredDistance(point, neighbor),
    }));
  }).sort((a, b) => a.distanceSquared - b.distanceSquared || a.from - b.from || a.to - b.to);
  const edges = new Map<number, Edge>();
  const components = vertices.map((_, index) => index);
  const root = (index: number): number => {
    while (components[index] !== index) {
      components[index] = components[components[index]];
      index = components[index];
    }
    return index;
  };
  const connect = (from: number, to: number): void => {
    const low = Math.min(from, to);
    const high = Math.max(from, to);
    edges.set(low * vertices.length + high, [low, high]);
    components[root(high)] = root(low);
  };

  vertices.slice(firstWhite).forEach((_, offset) => {
    const index = offset + firstWhite;
    candidates.filter(({ from, to }) => from === index || to === index)
      .slice(0, LOCAL_CONNECTIONS).forEach(({ from, to }) => connect(from, to));
  });
  candidates.forEach(({ from, to }) => {
    if (root(from) !== root(to)) connect(from, to);
  });
  ANCHOR_POINTS.forEach((anchor, index) => {
    const nearest = vertices.slice(firstWhite).map((point, offset) => ({
      index: offset + firstWhite, distance: squaredDistance(anchor, point),
    })).sort((a, b) => a.distance - b.distance)[0];
    connect(index, nearest.index);
    vertices.slice(firstWhite).map((point, offset) => ({
      index: offset + firstWhite, distance: squaredDistance(vertices[nearest.index], point),
    })).filter((neighbor) => neighbor.index !== nearest.index)
      .sort((a, b) => a.distance - b.distance).slice(0, 2)
      .forEach((neighbor) => connect(index, neighbor.index));
  });

  return [...edges.values()];
}

/** Creates a deterministic volumetric wireframe with a folded shell and dense core. */
export function createMolecularGeometry(): MolecularGeometry {
  const mesh = Array.from({ length: SHELL_COUNT + INTERIOR_COUNT + CORE_COUNT },
    (_, index) => createMeshPoint(index));
  const vertices = [...ANCHOR_POINTS, ...mesh];

  return {
    vertices,
    edges: connectMesh(vertices),
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
      opacity: clamp(0.18 + depth ** 1.5 * 1.3, 0, 1),
      radius: 0.45 + depth * 1.15,
    };
  });
}
