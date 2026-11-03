import type { Edge } from "./molecular-geometry";

export type EdgeStrand = Readonly<{
  start: number;
  end: number;
  lane: number;
}>;

type Point = Readonly<{ x: number; y: number }>;
type StrandOptions = Readonly<{ width: number; collapse: number }>;

/** Keeps parallel strands symmetric and consistently oriented for either input direction. */
export function createEdgeStrands(edges: readonly Edge[]): readonly EdgeStrand[] {
  const pairs = edges.map(([from, to]) => ({
    start: Math.min(from, to),
    end: Math.max(from, to),
    key: `${Math.min(from, to)}:${Math.max(from, to)}`,
  }));
  const counts = pairs.reduce((groups, pair) => {
    groups.set(pair.key, (groups.get(pair.key) ?? 0) + 1);
    return groups;
  }, new Map<string, number>());
  const occurrences = new Map<string, number>();

  return pairs.map(({ start, end, key }) => {
    const occurrence = occurrences.get(key) ?? 0;
    occurrences.set(key, occurrence + 1);
    return { start, end, lane: occurrence - ((counts.get(key) ?? 1) - 1) / 2 };
  });
}

/** Returns a quadratic control point; the renderer supplies the unchanged endpoints. */
export function strandControlPoint(
  start: Point,
  end: Point,
  lane: number,
  options: StrandOptions,
): Point {
  const midpoint = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
  const horizontal = end.x - start.x;
  const vertical = end.y - start.y;
  const length = Math.hypot(horizontal, vertical);
  if (length === 0) return midpoint;

  const collapse = Math.max(0, Math.min(1, options.collapse));
  const separation = Math.min(options.width < 600 ? 9 : 16, length * 0.12);
  const offset = lane * separation * (1 - collapse);

  return {
    x: midpoint.x - vertical / length * offset,
    y: midpoint.y + horizontal / length * offset,
  };
}
