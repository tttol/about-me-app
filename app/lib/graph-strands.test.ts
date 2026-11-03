import { describe, expect, it } from "vitest";
import type { Edge } from "./molecular-geometry";
import { createEdgeStrands, strandControlPoint } from "./graph-strands";

type Point = Readonly<{ x: number; y: number }>;

function curvePoint(start: Point, control: Point, end: Point, progress: number): Point {
  const remaining = 1 - progress;
  return {
    x: remaining ** 2 * start.x + 2 * remaining * progress * control.x + progress ** 2 * end.x,
    y: remaining ** 2 * start.y + 2 * remaining * progress * control.y + progress ** 2 * end.y,
  };
}

describe("createEdgeStrands", () => {
  it("assigns five parallel connections symmetric lanes with shared endpoints", () => {
    // Given five intentional connections between the same two vertices.
    const edges: readonly Edge[] = Array.from({ length: 5 }, (): Edge => [3, 8]);
    const expected = [-2, -1, 0, 1, 2].map((lane) => ({ start: 3, end: 8, lane }));

    // When the renderer's strands are created.
    const actual = createEdgeStrands(edges);

    // Then all connections survive in separate, symmetric lanes.
    expect(actual).toEqual(expected);
  });

  it("groups reversed and interleaved pairs without changing their orientation or input order", () => {
    // Given two groups with mixed endpoint directions.
    const edges: readonly Edge[] = [[7, 2], [9, 11], [2, 7], [7, 2], [11, 9]];
    const original = structuredClone(edges);
    const expected = [
      { start: 2, end: 7, lane: -1 },
      { start: 9, end: 11, lane: -0.5 },
      { start: 2, end: 7, lane: 0 },
      { start: 2, end: 7, lane: 1 },
      { start: 9, end: 11, lane: 0.5 },
    ];

    // When connections are grouped for drawing.
    const actual = createEdgeStrands(edges);

    // Then reversing a source pair cannot flip or duplicate a drawing lane.
    expect(actual).toEqual(expected);
    expect(edges).toEqual(original);
  });

  it("keeps singleton connections in the straight center lane", () => {
    // Given two unrelated connections.
    const edges: readonly Edge[] = [[4, 1], [2, 8]];
    const expected = [{ start: 1, end: 4, lane: 0 }, { start: 2, end: 8, lane: 0 }];

    // When their drawing strands are created.
    const actual = createEdgeStrands(edges);

    // Then neither connection gains an artificial curve.
    expect(actual).toEqual(expected);
  });

  it("does not invent strands for an empty graph", () => {
    // Given no connections.
    const edges: readonly Edge[] = [];
    const expected: readonly unknown[] = [];

    // When drawing strands are created.
    const actual = createEdgeStrands(edges);

    // Then there is nothing to render.
    expect(actual).toEqual(expected);
  });
});

describe("strandControlPoint", () => {
  it.each([
    { width: 390, midpointSeparation: 4.5 },
    { width: 1000, midpointSeparation: 8 },
  ])("visibly separates five curves on a $width px stage while sharing their endpoints", ({ width, midpointSeparation }) => {
    // Given five curves between the same screen positions.
    const start = { x: 100, y: 200 };
    const end = { x: 500, y: 200 };
    const lanes = [-2, -1, 0, 1, 2];
    const expectedMidpoints = lanes.map((lane) => ({ x: 300, y: 200 + lane * midpointSeparation }));

    // When each curve receives its own quadratic control point.
    const controls = lanes.map((lane) => strandControlPoint(start, end, lane, { width, collapse: 0 }));

    // Then the visible curve centers separate symmetrically and converge at both ends.
    expect(controls.map((control) => curvePoint(start, control, end, 0.5))).toEqual(expectedMidpoints);
    expect(controls.map((control) => curvePoint(start, control, end, 0)))
      .toEqual(lanes.map(() => start));
    expect(controls.map((control) => curvePoint(start, control, end, 1)))
      .toEqual(lanes.map(() => end));
  });

  it("keeps the center lane straight without mutating supplied points or options", () => {
    // Given caller-owned projection values.
    const start = { x: -12, y: 40 };
    const end = { x: 88, y: 80 };
    const options = { width: 800, collapse: 0.3 };
    const original = structuredClone({ start, end, options });
    const expected = { x: 38, y: 60 };

    // When the center lane is projected.
    const actual = strandControlPoint(start, end, 0, options);

    // Then its control lies on the straight bond and the inputs remain unchanged.
    expect(actual).toEqual(expected);
    expect({ start, end, options }).toEqual(original);
  });

  it("gathers every strand onto the midpoint when the graph finishes collapsing", () => {
    // Given separated lanes on a diagonal bond.
    const start = { x: 40, y: 30 };
    const end = { x: 260, y: 170 };
    const lanes = [-2, -1, 0, 1, 2];
    const expected = lanes.map(() => ({ x: 150, y: 100 }));

    // When the collapse reaches its endpoint.
    const actual = lanes.map((lane) => strandControlPoint(start, end, lane, { width: 1000, collapse: 1 }));

    // Then parallel offsets cannot leave stray curves outside the folded core.
    expect(actual).toEqual(expected);
  });

  it.each([
    { collapse: -1, expected: { x: 100, y: 32 } },
    { collapse: 2, expected: { x: 100, y: 0 } },
  ])("clamps collapse=$collapse to the supported interval", ({ collapse, expected }) => {
    // Given an animation value beyond one endpoint.
    const start = { x: 0, y: 0 };
    const end = { x: 200, y: 0 };

    // When the outer lane is projected.
    const actual = strandControlPoint(start, end, 2, { width: 1000, collapse });

    // Then the offset remains within its normal range.
    expect(actual).toEqual(expected);
  });

  it.each([
    { end: { x: 0, y: 0 }, lane: -2 },
    { end: { x: 0, y: 0 }, lane: 2 },
    { end: { x: 0.000001, y: -0.000001 }, lane: -2 },
    { end: { x: 3, y: 4 }, lane: 2 },
    { end: { x: -3, y: -4 }, lane: -2 },
  ])("keeps short or coincident bonds finite and locally bounded: $end, lane $lane", ({ end, lane }) => {
    // Given a bond shorter than the standard strand spacing.
    const start = { x: 0, y: 0 };
    const midpoint = { x: end.x / 2, y: end.y / 2 };
    const maximumOffset = Math.hypot(end.x, end.y) * 0.12 * Math.abs(lane) * 0.65;

    // When its control point is projected partway through a fold.
    const actual = strandControlPoint(start, end, lane, { width: 390, collapse: 0.35 });

    // Then no division singularity or oversized loop appears.
    expect(Object.values(actual).every(Number.isFinite)).toBe(true);
    expect(Math.hypot(actual.x - midpoint.x, actual.y - midpoint.y)).toBeLessThanOrEqual(maximumOffset + 0.000001);
    expect((actual.x - midpoint.x) * end.x + (actual.y - midpoint.y) * end.y).toBeCloseTo(0, 10);
  });
});
