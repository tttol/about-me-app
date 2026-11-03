import { describe, expect, it } from "vitest";
import { createMolecularGeometry, projectGeometry } from "./molecular-geometry";

describe("createMolecularGeometry", () => {
  it("creates a connected shell with valid, unique bonds and distinct anchors", () => {
    // Given
    const minimumVertices = 230;
    const maximumVertices = 255;
    const minimumBonds = 700;
    const maximumBonds = 760;

    // When
    const geometry = createMolecularGeometry();

    // Then
    expect(geometry.vertices.length).toBeGreaterThanOrEqual(minimumVertices);
    expect(geometry.vertices.length).toBeLessThanOrEqual(maximumVertices);
    expect(geometry.edges.length).toBeGreaterThanOrEqual(minimumBonds);
    expect(geometry.edges.length).toBeLessThanOrEqual(maximumBonds);
    expect(geometry.edges.every(([from, to]) =>
      from !== to && from >= 0 && to >= 0 &&
      from < geometry.vertices.length && to < geometry.vertices.length,
    )).toBe(true);
    expect(new Set(geometry.edges.map(([from, to]) =>
      [Math.min(from, to), Math.max(from, to)].join(":"),
    )).size).toBe(geometry.edges.length);
    expect(new Set(Object.values(geometry.anchors)).size).toBe(3);

    const reachable = Array.from({ length: geometry.vertices.length }).reduce<ReadonlySet<number>>(
      (visited) => visited.size === geometry.vertices.length ? visited : geometry.edges.reduce<ReadonlySet<number>>(
        (connected, [from, to]) => connected.has(from) || connected.has(to)
          ? new Set([...connected, from, to])
          : connected,
        visited,
      ),
      new Set([0]),
    );
    expect(reachable.size).toBe(geometry.vertices.length);
  });

  it("returns the same geometry on repeated construction", () => {
    // Given
    const expected = createMolecularGeometry();

    // When
    const actual = createMolecularGeometry();

    // Then
    expect(actual).toEqual(expected);
  });

  it("has pronounced dents and protrusions rather than a smooth ellipsoid", () => {
    // Given
    const minimumRadialVariation = 1.8;

    // When
    const geometry = createMolecularGeometry();

    // Then
    const extent = {
      x: Math.max(...geometry.vertices.map(({ x }) => Math.abs(x))),
      y: Math.max(...geometry.vertices.map(({ y }) => Math.abs(y))),
      z: Math.max(...geometry.vertices.map(({ z }) => Math.abs(z))),
    };
    const normalizedRadii = geometry.vertices.map(({ x, y, z }) =>
      Math.hypot(x / extent.x, y / extent.y, z / extent.z),
    );
    const radialVariation = Math.max(...normalizedRadii) / Math.min(...normalizedRadii);
    expect(radialVariation).toBeGreaterThan(minimumRadialVariation);
  });
});

describe("projectGeometry", () => {
  it.each([
    { width: 1000, height: 620, yaw: 0, pitch: 0 },
    { width: 390, height: 420, yaw: 1.2, pitch: 0.3 },
    { width: 720, height: 500, yaw: Math.PI, pitch: -0.4 },
    { width: 1100, height: 660, yaw: 0, pitch: 0 },
    { width: 1100, height: 660, yaw: 4.89, pitch: -0.4 },
    { width: 0, height: 0, yaw: Math.PI * 2, pitch: 0 },
  ])("keeps projected vertices finite and within a $width × $height stage", (viewport) => {
    // Given
    const geometry = createMolecularGeometry();

    // When
    const projected = projectGeometry(geometry, { ...viewport, collapse: 0 });

    // Then
    expect(projected).toHaveLength(geometry.vertices.length);
    expect(projected.every((vertex) => Object.values(vertex).every(Number.isFinite))).toBe(true);
    expect(projected.every(({ x, y, opacity, radius }) =>
      x >= 0 && x <= Math.max(1, viewport.width) &&
      y >= 0 && y <= Math.max(1, viewport.height) &&
      opacity >= 0 && opacity <= 1 && radius > 0,
    )).toBe(true);
  });

  it("places the initial anchors in separate readable parts of the object", () => {
    // Given
    const geometry = createMolecularGeometry();
    const options = { width: 1000, height: 620, yaw: 0, pitch: 0, collapse: 0 };

    // When
    const projected = projectGeometry(geometry, options);

    // Then
    const career = projected[geometry.anchors.career];
    const speaking = projected[geometry.anchors.speaking];
    const writing = projected[geometry.anchors.writing];
    expect(career.x).toBeLessThan(options.width / 2);
    expect(career.y).toBeLessThan(options.height / 2);
    expect(speaking.x).toBeGreaterThan(options.width / 2);
    expect(writing.x).toBeLessThan(options.width / 2);
    expect(writing.y).toBeGreaterThan(options.height / 2);
  });

  it("uses the desktop stage as a substantial navigation sculpture", () => {
    // Given
    const geometry = createMolecularGeometry();
    const options = { width: 1100, height: 660, yaw: 0, pitch: 0, collapse: 0 };
    const minimumFootprint = { width: 800, height: 560 };

    // When
    const projected = projectGeometry(geometry, options);

    // Then
    const width = Math.max(...projected.map(({ x }) => x)) - Math.min(...projected.map(({ x }) => x));
    const height = Math.max(...projected.map(({ y }) => y)) - Math.min(...projected.map(({ y }) => y));
    expect(width).toBeGreaterThan(minimumFootprint.width);
    expect(height).toBeGreaterThan(minimumFootprint.height);
  });

  it("folds every vertex into a small core at the center", () => {
    // Given
    const geometry = createMolecularGeometry();
    const options = { width: 1000, height: 620, yaw: 0.5, pitch: 0.2, collapse: 1 };
    const maximumDistance = 15;

    // When
    const collapsed = projectGeometry(geometry, options);

    // Then
    expect(collapsed.every(({ x, y }) =>
      Math.hypot(x - options.width / 2, y - options.height / 2) < maximumDistance,
    )).toBe(true);
  });

  it.each([-0.5, 1.5])("clamps collapse outside the animation interval: %s", (collapse) => {
    // Given
    const geometry = createMolecularGeometry();
    const options = { width: 1000, height: 620, yaw: 0, pitch: 0, collapse };
    const expected = projectGeometry(geometry, {
      ...options,
      collapse: Math.max(0, Math.min(1, collapse)),
    });

    // When
    const actual = projectGeometry(geometry, options);

    // Then
    expect(actual).toEqual(expected);
  });
});
