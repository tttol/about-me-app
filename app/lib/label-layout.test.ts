import { describe, expect, it } from "vitest";
import { layoutLabels, type LabelPlacement, type LabelRequest } from "./label-layout";

const CATEGORIES = [
  { id: "work-experience", width: 174, side: -1 },
  { id: "speakings", width: 105, side: 1 },
  { id: "articles", width: 86, side: -1 },
  { id: "awards", width: 75, side: 1 },
  { id: "certifications", width: 134, side: 1 },
] as const;

type Viewport = Readonly<{ width: number; height: number }>;

function rotatingRequests(angle: number, viewport: Viewport): readonly LabelRequest[] {
  return CATEGORIES.map((category, index) => ({
    ...category,
    anchor: {
      x: viewport.width * (0.5 + Math.cos(angle + index * 1.1) * 0.42),
      y: viewport.height * (0.5 + Math.sin(angle + index * 1.1) * 0.4),
    },
    height: 44,
    verticalOffset: index % 2 === 0 ? -24 : 24,
  }));
}

function bounds(placement: LabelPlacement, request: LabelRequest): Readonly<{
  left: number; right: number; top: number; bottom: number;
}> {
  const left = placement.x - (placement.side === -1 ? request.width : 0);
  return {
    left,
    right: left + request.width,
    top: placement.y - request.height / 2,
    bottom: placement.y + request.height / 2,
  };
}

describe("layoutLabels", () => {
  it.each([
    { width: 296, height: 288 },
    { width: 320, height: 318 },
    { width: 700, height: 360 },
    { width: 1100, height: 620 },
  ].flatMap((viewport) => Array.from({ length: 16 }, (_, step) => ({
    ...viewport,
    angle: step * Math.PI / 8,
  }))))("keeps five navigation targets visible and separated at $width × $height, angle $angle", (viewport) => {
    // Given five wide labels whose vertices rotate through the viewport.
    const requests = rotatingRequests(viewport.angle, viewport);
    const minimumGap = 6;
    const minimumMargin = 8;

    // When the labels are laid out.
    const placements = layoutLabels(requests, viewport);

    // Then every target stays inside the stage and clear of every other target.
    expect(placements.map(({ id, side }) => ({ id, side })))
      .toEqual(CATEGORIES.map(({ id, side }) => ({ id, side })));
    const rectangles = placements.map((placement, index) => bounds(placement, requests[index]));
    expect(rectangles.every(({ left, right, top, bottom }) =>
      left >= minimumMargin - 0.000001 && right <= viewport.width - minimumMargin + 0.000001 &&
      top >= minimumMargin - 0.000001 && bottom <= viewport.height - minimumMargin + 0.000001,
    )).toBe(true);
    const pairGaps = rectangles.flatMap((a, index) => rectangles.slice(index + 1).map((b) =>
      Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom),
    ));
    expect(pairGaps.every((gap) => gap >= minimumGap)).toBe(true);
  });

  it("separates all five targets even when their vertices share one screen position", () => {
    // Given a tightly clustered projection on a narrow phone.
    const viewport = { width: 296, height: 268 };
    const requests = rotatingRequests(0, viewport).map((request) => ({
      ...request,
      anchor: { x: 148, y: 134 },
      verticalOffset: 0,
    }));

    // When every label competes for the same space.
    const placements = layoutLabels(requests, viewport);

    // Then the complete navigation remains available without overlapping targets.
    const rectangles = placements.map((placement, index) => bounds(placement, requests[index]));
    expect(rectangles.every(({ left, right, top, bottom }) =>
      left >= 8 && right <= viewport.width - 8 && top >= 8 && bottom <= viewport.height - 8,
    )).toBe(true);
    expect(rectangles.flatMap((a, index) => rectangles.slice(index + 1).map((b) =>
      Math.max(b.left - a.right, a.left - b.right, b.top - a.bottom, a.top - b.bottom),
    )).every((gap) => gap >= 6)).toBe(true);
  });

  it("is deterministic and leaves the caller's measurements unchanged", () => {
    // Given caller-owned label measurements.
    const viewport = { width: 320, height: 300 };
    const requests = rotatingRequests(1.7, viewport);
    const originalRequests = structuredClone(requests);
    const expected = layoutLabels(requests, viewport);

    // When the same projection is processed again.
    const actual = layoutLabels(requests, viewport);

    // Then the layout is stable and no caller-owned value was mutated.
    expect(actual).toEqual(expected);
    expect(requests).toEqual(originalRequests);
  });

  it("returns no placements when there are no categories", () => {
    // Given an empty scene.
    const requests: readonly LabelRequest[] = [];
    const expected: readonly LabelPlacement[] = [];

    // When it is laid out.
    const actual = layoutLabels(requests, { width: 320, height: 300 });

    // Then no navigation targets are invented.
    expect(actual).toEqual(expected);
  });
});
