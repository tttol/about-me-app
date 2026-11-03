export type LabelRequest = Readonly<{
  id: string;
  anchor: Readonly<{ x: number; y: number }>;
  width: number;
  height: number;
  side: -1 | 1;
  verticalOffset: number;
}>;

export type LabelPlacement = Readonly<{
  id: string;
  x: number;
  y: number;
  side: -1 | 1;
}>;

type Viewport = Readonly<{ width: number; height: number }>;
type LabelBox = Readonly<{
  request: LabelRequest;
  index: number;
  left: number;
  y: number;
}>;

const MARGIN = 8;
const GAP = 8;
const ANCHOR_GAP = 24;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function isSeparated(a: LabelBox, b: LabelBox): boolean {
  return a.left + a.request.width + GAP <= b.left ||
    b.left + b.request.width + GAP <= a.left ||
    a.y + a.request.height / 2 + GAP <= b.y - b.request.height / 2 ||
    b.y + b.request.height / 2 + GAP <= a.y - a.request.height / 2;
}

function preferredBox(request: LabelRequest, index: number, viewport: Viewport): LabelBox {
  const left = request.side === 1
    ? request.anchor.x + ANCHOR_GAP
    : request.anchor.x - ANCHOR_GAP - request.width;

  return {
    request,
    index,
    left: clamp(left, MARGIN, viewport.width - MARGIN - request.width),
    y: clamp(request.anchor.y + request.verticalOffset,
      MARGIN + request.height / 2, viewport.height - MARGIN - request.height / 2),
  };
}

function findSpace(box: LabelBox, placed: readonly LabelBox[], viewport: Viewport): LabelBox | undefined {
  const halfHeight = box.request.height / 2;
  const rows = [
    box.y,
    MARGIN + halfHeight,
    viewport.height - MARGIN - halfHeight,
    ...placed.flatMap((other) => [
      other.y - other.request.height / 2 - GAP - halfHeight,
      other.y + other.request.height / 2 + GAP + halfHeight,
    ]),
  ];
  const columns = [box.left, MARGIN, viewport.width - MARGIN - box.request.width];
  const candidates = rows.flatMap((y) => columns.map((left) => ({
    ...box,
    left: clamp(left, MARGIN, viewport.width - MARGIN - box.request.width),
    y: clamp(y, MARGIN + halfHeight, viewport.height - MARGIN - halfHeight),
  })));
  const distance = (candidate: LabelBox): number =>
    (candidate.left - box.left) ** 2 * 0.7 + (candidate.y - box.y) ** 2;

  return candidates
    .sort((a, b) => distance(a) - distance(b) || a.y - b.y || a.left - b.left)
    .find((candidate) => placed.every((other) => isSeparated(candidate, other)));
}

function stackBoxes(boxes: readonly LabelBox[], viewport: Viewport): readonly LabelBox[] {
  const ordered = [...boxes].sort((a, b) => a.y - b.y || a.index - b.index);
  const totalHeight = ordered.reduce((height, box) => height + box.request.height, 0) +
    Math.max(0, ordered.length - 1) * GAP;
  const offsets = ordered.map((_, index) => ordered.slice(0, index)
    .reduce((offset, box) => offset + box.request.height + GAP, 0));
  const preferredTop = ordered.reduce((sum, box, index) =>
    sum + box.y - box.request.height / 2 - offsets[index], 0) / ordered.length;
  const top = clamp(preferredTop, MARGIN, viewport.height - MARGIN - totalHeight);

  return ordered.map((box, index) => ({
    ...box,
    y: top + offsets[index] + box.request.height / 2,
  }));
}

/**
 * Keeps labels near their projected vertices without overlapping each other.
 * Placements use a left edge for side 1, a right edge for side -1, and a vertical
 * center. Five 44px labels fit in a 268px-high viewport with the reserved gaps.
 * Smaller, physically impossible viewports receive a deterministic best effort.
 */
export function layoutLabels(
  requests: readonly LabelRequest[],
  viewport: Viewport,
): readonly LabelPlacement[] {
  if (requests.length === 0) return [];

  const boxes = requests.map((request, index) => preferredBox(request, index, viewport));
  const ordered = [...boxes].sort((a, b) => b.request.width - a.request.width || a.index - b.index);
  const greedy = ordered.reduce<readonly LabelBox[] | null>((placed, box) => {
    if (placed === null) return null;
    const candidate = findSpace(box, placed, viewport);
    return candidate ? [...placed, candidate] : null;
  }, []);
  const arranged = greedy ?? stackBoxes(boxes, viewport);

  return requests.map((request, index) => {
    const box = arranged.find((candidate) => candidate.index === index) ?? boxes[index];
    return {
      id: request.id,
      x: box.left + (request.side === -1 ? request.width : 0),
      y: box.y,
      side: request.side,
    };
  });
}
