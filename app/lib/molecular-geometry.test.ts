import { describe, expect, it } from "vitest";
import {
  createMolecularGeometry,
  dentGeometry,
  hitTestVertex,
  projectGeometry,
  type MolecularGeometry,
  type ProjectedVertex,
} from "./molecular-geometry";

describe("createMolecularGeometry", () => {
  it("creates a connected network with valid, unique bonds and distinct anchors", () => {
    // Given
    const expectedCounts = { vertices: 86, bonds: 255 };

    // When
    const geometry = createMolecularGeometry();

    // Then
    expect({ vertices: geometry.vertices.length, bonds: geometry.edges.length }).toEqual(expectedCounts);
    expect(geometry.edges.every(([from, to]) =>
      from !== to && from >= 0 && to >= 0 &&
      from < geometry.vertices.length && to < geometry.vertices.length,
    )).toBe(true);
    expect(new Set(geometry.edges.map(([from, to]) =>
      [Math.min(from, to), Math.max(from, to)].join(":"),
    )).size).toBe(geometry.edges.length);
    expect(new Set(Object.values(geometry.anchors)).size).toBe(5);

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

  it.each(Object.values(createMolecularGeometry().anchors))("connects category vertex %i to one compact cluster of three white points", (index) => {
    // Given
    const expectedConnections = 3;
    const maximumClusterDiameter = 0.35;

    // When
    const geometry = createMolecularGeometry();

    // Then
    const anchors = new Set(Object.values(geometry.anchors));
    const neighbors = geometry.edges.flatMap(([from, to]) => from === index ? [to] : to === index ? [from] : []);
    const targets = neighbors.map((neighbor) => geometry.vertices[neighbor]);
    const pairwiseDistances = targets.flatMap((first, targetIndex) => targets.slice(targetIndex + 1).map((second) =>
      Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z),
    ));
    expect(neighbors).toHaveLength(expectedConnections);
    expect(new Set(neighbors).size).toBe(expectedConnections);
    expect(neighbors.every((neighbor) => !anchors.has(neighbor))).toBe(true);
    expect(Math.max(...pairwiseDistances)).toBeLessThanOrEqual(maximumClusterDiameter);
  });

  it("keeps the white graph connected independently of category vertices", () => {
    // Given
    const expectedWhitePoints = 81;

    // When
    const geometry = createMolecularGeometry();

    // Then
    const anchors = new Set(Object.values(geometry.anchors));
    const whiteIndices = geometry.vertices.map((_, index) => index).filter((index) => !anchors.has(index));
    const coreEdges = geometry.edges.filter(([from, to]) => !anchors.has(from) && !anchors.has(to));
    const reachable = whiteIndices.reduce<ReadonlySet<number>>(
      (visited) => visited.size === expectedWhitePoints ? visited : coreEdges.reduce<ReadonlySet<number>>(
        (connected, [from, to]) => connected.has(from) || connected.has(to)
          ? new Set([...connected, from, to])
          : connected,
        visited,
      ),
      new Set([whiteIndices[0]]),
    );
    expect(reachable.size).toBe(expectedWhitePoints);
  });

  it("populates interior volume on both sides of the viewing plane", () => {
    // Given
    const minimumInteriorPoints = 20;
    const minimumCentralPoints = 10;
    const minimumPointsOnEachSide = 10;

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
    expect(normalizedRadii.filter((radius) => radius < 0.65).length).toBeGreaterThanOrEqual(minimumInteriorPoints);
    expect(normalizedRadii.filter((radius) => radius < 0.4).length).toBeGreaterThanOrEqual(minimumCentralPoints);
    expect(geometry.vertices.filter(({ z }) => z > 0.1).length).toBeGreaterThanOrEqual(minimumPointsOnEachSide);
    expect(geometry.vertices.filter(({ z }) => z < -0.1).length).toBeGreaterThanOrEqual(minimumPointsOnEachSide);
  });

  it("combines dense neighborhoods with sparse outliers and irregular degrees", () => {
    // Given
    const expectedDistribution = { minimumDensePoints: 25, minimumSparsePoints: 3, minimumDistinctDegrees: 6 };

    // When
    const geometry = createMolecularGeometry();

    // Then
    const nearestDistances = geometry.vertices.map((vertex, index) =>
      Math.min(...geometry.vertices.filter((_, candidate) => candidate !== index).map((neighbor) =>
        Math.hypot(vertex.x - neighbor.x, vertex.y - neighbor.y, vertex.z - neighbor.z),
      )),
    );
    const degrees = geometry.vertices.map((_, index) =>
      geometry.edges.filter(([from, to]) => from === index || to === index).length,
    );
    expect(nearestDistances.filter((distance) => distance < 0.2).length)
      .toBeGreaterThanOrEqual(expectedDistribution.minimumDensePoints);
    expect(nearestDistances.filter((distance) => distance > 0.35).length)
      .toBeGreaterThanOrEqual(expectedDistribution.minimumSparsePoints);
    expect(new Set(degrees).size).toBeGreaterThanOrEqual(expectedDistribution.minimumDistinctDegrees);
  });

  it("mixes short local connections with longer bridges through the volume", () => {
    // Given
    const minimumLengthVariation = 3;

    // When
    const geometry = createMolecularGeometry();

    // Then
    const lengths = geometry.edges.map(([from, to]) => {
      const first = geometry.vertices[from];
      const second = geometry.vertices[to];
      return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
    }).sort((left, right) => left - right);
    const shortLength = lengths[Math.floor(lengths.length * 0.1)];
    const longLength = lengths[Math.floor(lengths.length * 0.9)];
    expect(longLength / shortLength).toBeGreaterThan(minimumLengthVariation);
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
    const work = projected[geometry.anchors["work-experience"]];
    const speakings = projected[geometry.anchors.speakings];
    const articles = projected[geometry.anchors.articles];
    const awards = projected[geometry.anchors.awards];
    const certifications = projected[geometry.anchors.certifications];
    expect(work.x).toBeLessThan(options.width / 2);
    expect(work.y).toBeLessThan(options.height / 2);
    expect(speakings.x).toBeGreaterThan(options.width / 2);
    expect(articles.x).toBeLessThan(options.width / 2);
    expect(articles.y).toBeGreaterThan(options.height / 2);
    expect(awards.x).toBeGreaterThan(options.width / 2);
    expect(awards.y).toBeLessThan(options.height / 2);
    expect(certifications.x).toBeGreaterThan(options.width / 2);
    expect(certifications.y).toBeGreaterThan(options.height / 2);
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

describe("dentGeometry", () => {
  it("keeps every initial unlabelled point dentable, including points inside the clusters", () => {
    // Given
    const geometry = createMolecularGeometry();
    const anchors = new Set(Object.values(geometry.anchors));
    const whiteIndices = geometry.vertices.map((_, index) => index).filter((index) => !anchors.has(index));

    // When
    const dents = whiteIndices.map((index) => dentGeometry(geometry, index));

    // Then
    expect(dents.every((dented, candidate) => {
      const index = whiteIndices[candidate];
      const before = geometry.vertices[index];
      const after = dented.vertices[index];
      return dented !== geometry &&
        Math.hypot(after.x, after.y, after.z) < Math.hypot(before.x, before.y, before.z);
    })).toBe(true);
  });

  it("moves the selected point inward and deforms its surroundings without mutating the source", () => {
    // Given
    const geometry = createMolecularGeometry();
    const source = structuredClone(geometry);
    const anchors = Object.values(geometry.anchors);
    const index = geometry.vertices.findIndex((_, candidate) => !anchors.includes(candidate));
    const selected = geometry.vertices[index];
    const previousRadius = Math.hypot(selected.x, selected.y, selected.z);

    // When
    const dented = dentGeometry(geometry, index);

    // Then
    const moved = dented.vertices[index];
    const movedRadius = Math.hypot(moved.x, moved.y, moved.z);
    expect(movedRadius).toBeLessThan(previousRadius * 0.8);
    expect(dented.vertices.filter((vertex, candidate) =>
      vertex.x !== geometry.vertices[candidate].x ||
      vertex.y !== geometry.vertices[candidate].y ||
      vertex.z !== geometry.vertices[candidate].z,
    ).length).toBeGreaterThan(1);
    expect(geometry).toEqual(source);
    expect(dented.edges).toBe(geometry.edges);
    expect(dented.anchors).toBe(geometry.anchors);
    expect(anchors.map((anchor) => dented.vertices[anchor]))
      .toEqual(anchors.map((anchor) => geometry.vertices[anchor]));
  });

  it("keeps repeated dents finite, inward, and away from a collapsed singularity", () => {
    // Given
    const geometry = createMolecularGeometry();
    const anchors = Object.values(geometry.anchors);
    const index = geometry.vertices.findIndex((_, candidate) => !anchors.includes(candidate));
    const attempts = Array.from({ length: 100 });

    // When
    const dented = attempts.reduce<MolecularGeometry>((current) => dentGeometry(current, index), geometry);

    // Then
    expect(dented.vertices.every((vertex, candidate) =>
      Object.values(vertex).every(Number.isFinite) &&
      Math.hypot(vertex.x, vertex.y, vertex.z) >= 0.279 &&
      Math.hypot(vertex.x, vertex.y, vertex.z) <=
        Math.hypot(...Object.values(geometry.vertices[candidate])) + 0.000001,
    )).toBe(true);
    expect(dented.edges).toBe(geometry.edges);
    expect(dented.anchors).toBe(geometry.anchors);
  });

  it.each(Object.values(createMolecularGeometry().anchors))("does not dent category anchor %i", (index) => {
    // Given
    const geometry = createMolecularGeometry();

    // When
    const dented = dentGeometry(geometry, index);

    // Then
    expect(dented).toBe(geometry);
  });

  it.each([-1, 999, 2.5, Number.NaN])("ignores invalid vertex index %s", (index) => {
    // Given
    const geometry = createMolecularGeometry();

    // When
    const dented = dentGeometry(geometry, index);

    // Then
    expect(dented).toBe(geometry);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("ignores invalid dent strength %s", (strength) => {
    // Given
    const geometry = createMolecularGeometry();
    const anchors = Object.values(geometry.anchors);
    const index = geometry.vertices.findIndex((_, candidate) => !anchors.includes(candidate));

    // When
    const dented = dentGeometry(geometry, index, strength);

    // Then
    expect(dented).toBe(geometry);
  });
});

describe("hitTestVertex", () => {
  const vertices: readonly ProjectedVertex[] = [
    { x: 100, y: 100, depth: 0.1, opacity: 0.2, radius: 1 },
    { x: 101, y: 100, depth: 0.9, opacity: 0.9, radius: 2 },
    { x: 140, y: 100, depth: 0.8, opacity: 0.8, radius: 2 },
  ];

  it.each([
    { x: 100, y: 100, radius: 12, expected: 1 },
    { x: 140, y: 100, radius: 12, expected: 2 },
    { x: 120, y: 100, radius: 10, expected: null },
    { x: 140, y: 100, radius: 0, expected: null },
    { x: Number.NaN, y: 100, radius: 12, expected: null },
  ])("resolves a hit at ($x, $y) within $radius pixels", ({ x, y, radius, expected }) => {
    // Given
    const projected = vertices;

    // When
    const index = hitTestVertex(projected, x, y, radius);

    // Then
    expect(index).toBe(expected);
  });

  it("does not choose a distant foreground point over a directly selected rear point", () => {
    // Given
    const projected: readonly ProjectedVertex[] = [
      { x: 100, y: 100, depth: 0.1, opacity: 0.2, radius: 1 },
      { x: 110, y: 100, depth: 1, opacity: 1, radius: 2 },
    ];
    const expected = 0;

    // When
    const index = hitTestVertex(projected, 100, 100, 12);

    // Then
    expect(index).toBe(expected);
  });
});
