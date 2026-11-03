"use client";

import { useEffect, useRef } from "react";
import {
  createMolecularGeometry, dentGeometry, hitTestVertex, projectGeometry,
  type MolecularGeometry, type ProjectedVertex,
} from "../lib/molecular-geometry";
import { layoutLabels } from "../lib/label-layout";
import { createEdgeStrands, strandControlPoint } from "../lib/graph-strands";
import { PORTFOLIO_SECTIONS, type SectionId } from "../lib/portfolio-content";

type Phase = "exploring" | "collapsing" | "reading" | "expanding";

type SceneProps = Readonly<{
  phase: Phase;
  paused: boolean;
  reducedMotion: boolean;
  reshapeVersion: number;
  onDent: () => void;
  onSelect: (section: SectionId) => void;
  onTransitionComplete: () => void;
}>;

const GEOMETRY = createMolecularGeometry();
const EDGE_STRANDS = createEdgeStrands(GEOMETRY.edges);
const ANCHORS = new Set(Object.values(GEOMETRY.anchors));
const NAVIGATION_NODE_COLOR = "#4ade80";
const LABEL_PLACEMENT: Readonly<Record<SectionId, Readonly<{ side: -1 | 1; vertical: number }>>> = {
  "work-experience": { side: -1, vertical: -26 },
  speakings: { side: 1, vertical: -24 },
  articles: { side: -1, vertical: 27 },
  awards: { side: 1, vertical: 28 },
  certifications: { side: 1, vertical: -28 },
};

function easeInOut(value: number): number {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

export default function MolecularScene(props: SceneProps): React.JSX.Element {
  const { phase, onSelect } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<Partial<Record<SectionId, HTMLButtonElement | HTMLAnchorElement | null>>>({});
  const settingsRef = useRef(props);

  useEffect(() => {
    settingsRef.current = props;
  }, [props]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !surface || !context) return;

    let width = 1;
    let height = 1;
    let frame = 0;
    let lastTime = 0;
    let yaw = 0;
    let pitch = 0;
    let elapsed = 0;
    let collapse = 0;
    let fromCollapse = 0;
    let transitionTime = 0;
    let previousPhase = settingsRef.current.phase;
    let finished = false;
    let pointer: Readonly<{
      id: number; x: number; y: number; startX: number; startY: number;
      travel: number; vertex: number | null;
    }> | null = null;
    let hovered: SectionId | null = null;
    let focused: SectionId | null = null;
    let hoveredVertex: number | null = null;
    let hoverPosition: Readonly<{ x: number; y: number; radius: number }> | null = null;
    let geometry = GEOMETRY;
    let projected: readonly ProjectedVertex[] = [];
    let deformation: Readonly<{ from: MolecularGeometry; to: MolecularGeometry }> | null = null;
    let deformationTime = 0;
    let lastDentedVertex: number | null = null;
    let reshapeVersion = settingsRef.current.reshapeVersion;
    const labelSizes: Partial<Record<SectionId, Readonly<{ width: number; height: number }>>> = {};

    const resize = (): void => {
      const bounds = surface.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      PORTFOLIO_SECTIONS.forEach(({ id }) => {
        const bounds = controlsRef.current[id]?.getBoundingClientRect();
        labelSizes[id] = { width: bounds?.width ?? 160, height: bounds?.height ?? 44 };
      });
    };

    const indent = (index: number): void => {
      const target = dentGeometry(geometry, index);
      if (target === geometry) return;
      deformation = { from: geometry, to: target };
      deformationTime = 0;
      lastDentedVertex = index;
      canvas.dataset.lastDentedVertex = String(index);
      settingsRef.current.onDent();
    };

    const indentFrontPoint = (): void => {
      const frontPoint = projected
        .map((vertex, index) => ({ ...vertex, index }))
        .filter(({ index }) => !ANCHORS.has(index) && index !== lastDentedVertex)
        .sort((a, b) => b.depth - a.depth)
        .find(({ index }) => dentGeometry(geometry, index) !== geometry);
      if (frontPoint) indent(frontPoint.index);
    };

    const findVertex = (x: number, y: number, radius: number): number | null => {
      const markerRadius = width < 600 ? 4.3 : 5.5;
      const greenPoint = PORTFOLIO_SECTIONS
        .map(({ id }) => geometry.anchors[id])
        .map((index) => ({ index, distance: Math.hypot(projected[index].x - x, projected[index].y - y) }))
        .filter(({ distance }) => distance <= markerRadius)
        .sort((a, b) => a.distance - b.distance)[0];
      return greenPoint?.index ?? hitTestVertex(projected, x, y, radius);
    };

    const render = (now: number): void => {
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      const settings = settingsRef.current;

      if (settings.reshapeVersion !== reshapeVersion) {
        reshapeVersion = settings.reshapeVersion;
        if (settings.phase === "exploring") indentFrontPoint();
      }
      if (deformation) {
        deformationTime += delta;
        const progress = settings.reducedMotion ? 1 : Math.min(deformationTime / 0.48, 1);
        const amount = easeInOut(progress);
        const { from, to } = deformation;
        geometry = {
          ...to,
          vertices: from.vertices.map((vertex, index) => ({
            x: vertex.x + (to.vertices[index].x - vertex.x) * amount,
            y: vertex.y + (to.vertices[index].y - vertex.y) * amount,
            z: vertex.z + (to.vertices[index].z - vertex.z) * amount,
          })),
        };
        if (progress === 1) {
          geometry = to;
          deformation = null;
        }
      }

      if (settings.phase !== previousPhase) {
        previousPhase = settings.phase;
        transitionTime = 0;
        fromCollapse = collapse;
        finished = false;
      }

      const transitioning = settings.phase === "collapsing" || settings.phase === "expanding";
      if (transitioning) {
        transitionTime += delta;
        const duration = settings.phase === "collapsing" ? 1.05 : 0.85;
        const progress = settings.reducedMotion ? 1 : Math.min(transitionTime / duration, 1);
        const target = settings.phase === "collapsing" ? 1 : 0;
        collapse = fromCollapse + (target - fromCollapse) * easeInOut(progress);
        if (progress === 1 && !finished) {
          finished = true;
          settings.onTransitionComplete();
        }
      } else {
        collapse = settings.phase === "reading" ? 1 : 0;
      }

      if (settings.phase === "exploring" && !settings.paused && !settings.reducedMotion && !pointer) {
        elapsed += delta;
        yaw += delta * 0.105;
      }

      const vertices = projectGeometry(geometry, {
        yaw,
        pitch: pitch + Math.sin(elapsed * 0.19) * 0.12,
        collapse,
        width,
        height,
      });
      projected = vertices;
      if (!pointer && hoverPosition) {
        hoveredVertex = findVertex(hoverPosition.x, hoverPosition.y, hoverPosition.radius);
        canvas.style.cursor = hoveredVertex === null ? "grab" : "pointer";
      }

      context.clearRect(0, 0, width, height);
      EDGE_STRANDS.forEach(({ start, end, lane }) => {
        const a = vertices[start];
        const b = vertices[end];
        const activeSection = hovered ?? focused;
        const selected = activeSection !== null && (start === geometry.anchors[activeSection] || end === geometry.anchors[activeSection]);
        context.strokeStyle = `rgba(255,255,255,${selected ? 0.98 : (a.opacity + b.opacity) * 0.48})`;
        context.lineWidth = selected ? 1.4 : 0.7 + (a.depth + b.depth) * 0.25;
        context.beginPath();
        context.moveTo(a.x, a.y);
        const control = strandControlPoint(a, b, lane, { width, collapse });
        context.quadraticCurveTo(control.x, control.y, b.x, b.y);
        context.stroke();
      });

      const drawVertex = (vertex: ProjectedVertex, index: number): void => {
        context.fillStyle = ANCHORS.has(index)
          ? NAVIGATION_NODE_COLOR
          : `rgba(255,255,255,${vertex.opacity})`;
        context.beginPath();
        const anchorRadius = (width < 600 ? 4.3 : 5.5) - collapse * 2;
        context.arc(vertex.x, vertex.y, ANCHORS.has(index) ? anchorRadius : vertex.radius, 0, Math.PI * 2);
        context.fill();
        if (index === hoveredVertex && settings.phase === "exploring") {
          context.strokeStyle = ANCHORS.has(index) ? NAVIGATION_NODE_COLOR : "rgba(255,255,255,0.8)";
          context.lineWidth = 1;
          context.beginPath();
          context.arc(vertex.x, vertex.y, vertex.radius + 5, 0, Math.PI * 2);
          context.stroke();
        }
      };
      vertices.forEach((vertex, index) => {
        if (!ANCHORS.has(index)) drawVertex(vertex, index);
      });
      PORTFOLIO_SECTIONS.forEach(({ id }) => {
        const index = geometry.anchors[id];
        drawVertex(vertices[index], index);
      });

      const labels = layoutLabels(PORTFOLIO_SECTIONS.map(({ id }) => ({
        id,
        anchor: vertices[geometry.anchors[id]],
        width: labelSizes[id]?.width ?? 160,
        height: labelSizes[id]?.height ?? 44,
        side: LABEL_PLACEMENT[id].side,
        verticalOffset: LABEL_PLACEMENT[id].vertical,
      })), { width, height });
      PORTFOLIO_SECTIONS.forEach(({ id }) => {
        const control = controlsRef.current[id];
        const label = labels.find((placement) => placement.id === id);
        if (!control || !label) return;
        const vertex = vertices[geometry.anchors[id]];
        const { x, y, side } = label;
        control.style.transform = `translate3d(${x}px,${y}px,0) translate(${side < 0 ? "-100%" : "0"},-50%)`;

        if (settings.phase === "exploring") {
          context.strokeStyle = "rgba(255,255,255,0.85)";
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(vertex.x, vertex.y);
          context.lineTo(x - side * 10, y);
          context.lineTo(x, y);
          context.stroke();
        }
      });

      if (!document.hidden) frame = requestAnimationFrame(render);
    };

    const startPointer = (event: PointerEvent): void => {
      if (settingsRef.current.phase !== "exploring" || event.button !== 0 || pointer) return;
      const bounds = canvas.getBoundingClientRect();
      if (projected.length === 0) return;
      const vertex = findVertex(event.clientX - bounds.left, event.clientY - bounds.top, event.pointerType === "touch" ? 18 : 10);
      pointer = {
        id: event.pointerId, x: event.clientX, y: event.clientY,
        startX: event.clientX, startY: event.clientY, travel: 0, vertex,
      };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const movePointer = (event: PointerEvent): void => {
      if (!pointer) {
        const bounds = canvas.getBoundingClientRect();
        hoverPosition = { x: event.clientX - bounds.left, y: event.clientY - bounds.top, radius: event.pointerType === "touch" ? 18 : 10 };
        return;
      }
      if (pointer.id !== event.pointerId) return;
      if (event.buttons === 0) {
        endPointer();
        return;
      }
      yaw += (event.clientX - pointer.x) * 0.006;
      pitch = Math.max(-0.7, Math.min(0.7, pitch + (event.clientY - pointer.y) * 0.004));
      pointer = {
        ...pointer, x: event.clientX, y: event.clientY,
        travel: Math.max(pointer.travel, Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY)),
      };
    };
    const endPointer = (): void => {
      pointer = null;
      canvas.style.cursor = "grab";
    };
    const finishPointer = (event: PointerEvent): void => {
      if (!pointer || pointer.id !== event.pointerId) return;
      const { vertex, travel, startX, startY } = pointer;
      const distance = Math.max(travel, Math.hypot(event.clientX - startX, event.clientY - startY));
      endPointer();
      if (distance > 6 || vertex === null || settingsRef.current.phase !== "exploring") return;
      const section = PORTFOLIO_SECTIONS.find(({ id }) => geometry.anchors[id] === vertex);
      if (section) settingsRef.current.onSelect(section.id);
      else indent(vertex);
    };
    const clearVertexHover = (): void => {
      hoveredVertex = null;
      hoverPosition = null;
    };
    const trackHover = (event: Event): void => {
      const control = event.currentTarget;
      const sectionId = control instanceof HTMLElement
        ? PORTFOLIO_SECTIONS.find(({ id }) => id === control.dataset.section)?.id ?? null
        : null;
      if (event.type === "focus") focused = sectionId;
      else hovered = sectionId;
    };
    const clearHover = (event: Event): void => {
      if (event.type === "blur") focused = null;
      else hovered = null;
    };
    const handleVisibility = (): void => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      endPointer();
      hovered = null;
      hoveredVertex = null;
      hoverPosition = null;
      if (!document.hidden) frame = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    canvas.addEventListener("pointerdown", startPointer);
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerup", finishPointer);
    canvas.addEventListener("pointerleave", clearVertexHover);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("lostpointercapture", endPointer);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", endPointer);
    const controls = Object.values(controlsRef.current);
    controls.forEach((control) => {
      control?.addEventListener("pointerenter", trackHover);
      control?.addEventListener("focus", trackHover);
      control?.addEventListener("pointerleave", clearHover);
      control?.addEventListener("blur", clearHover);
    });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", startPointer);
      canvas.removeEventListener("pointermove", movePointer);
      canvas.removeEventListener("pointerup", finishPointer);
      canvas.removeEventListener("pointerleave", clearVertexHover);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("lostpointercapture", endPointer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", endPointer);
      controls.forEach((control) => {
        control?.removeEventListener("pointerenter", trackHover);
        control?.removeEventListener("focus", trackHover);
        control?.removeEventListener("pointerleave", clearHover);
        control?.removeEventListener("blur", clearHover);
      });
    };
  }, []);

  return (
    <div ref={surfaceRef} className="molecular-surface" inert={phase !== "exploring"}>
      <canvas
        ref={canvasRef}
        className="molecular-canvas"
        data-testid="molecular-canvas"
        data-vertex-count={GEOMETRY.vertices.length}
        data-edge-count={GEOMETRY.edges.length}
        aria-hidden="true"
      />
      <nav className="vertices" aria-label="Explore my connections">
        {PORTFOLIO_SECTIONS.map((entry) => entry.kind === "external" ? (
          <a
            key={entry.id}
            ref={(element) => { controlsRef.current[entry.id] = element; }}
            className={`vertex vertex--${entry.id}`}
            data-section={entry.id}
            href={entry.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-description="Opens in a new tab"
            tabIndex={phase === "exploring" ? undefined : -1}
          >
            {entry.label}
          </a>
        ) : (
          <button
            key={entry.id}
            type="button"
            ref={(element) => { controlsRef.current[entry.id] = element; }}
            className={`vertex vertex--${entry.id}`}
            data-section={entry.id}
            disabled={phase !== "exploring"}
            onClick={() => onSelect(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
