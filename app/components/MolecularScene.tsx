"use client";

import { useEffect, useRef } from "react";
import { createMolecularGeometry, projectGeometry } from "../lib/molecular-geometry";
import { PORTFOLIO_SECTIONS, type SectionId } from "../lib/portfolio-content";

type Phase = "exploring" | "collapsing" | "reading" | "expanding";

type SceneProps = Readonly<{
  phase: Phase;
  paused: boolean;
  reducedMotion: boolean;
  onSelect: (section: SectionId) => void;
  onTransitionComplete: () => void;
}>;

const GEOMETRY = createMolecularGeometry();
const ANCHORS = new Set(Object.values(GEOMETRY.anchors));
const NAVIGATION_NODE_COLOR = "#4ade80";
const LABEL_PLACEMENT: Readonly<Record<SectionId, Readonly<{ side: -1 | 1; vertical: number }>>> = {
  career: { side: -1, vertical: -26 },
  speaking: { side: 1, vertical: -24 },
  writing: { side: -1, vertical: 27 },
};

function easeInOut(value: number): number {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

export default function MolecularScene(props: SceneProps): React.JSX.Element {
  const { phase, onSelect } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
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
    let pointer: Readonly<{ id: number; x: number; y: number }> | null = null;
    let hovered: SectionId | null = null;
    let focused: SectionId | null = null;
    const buttonWidths: Partial<Record<SectionId, number>> = {};

    const resize = (): void => {
      const bounds = surface.getBoundingClientRect();
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      PORTFOLIO_SECTIONS.forEach(({ id }) => {
        buttonWidths[id] = buttonsRef.current[id]?.getBoundingClientRect().width ?? 90;
      });
    };

    const render = (now: number): void => {
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
      lastTime = now;
      const settings = settingsRef.current;

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

      const vertices = projectGeometry(GEOMETRY, {
        yaw,
        pitch: pitch + Math.sin(elapsed * 0.19) * 0.12,
        collapse,
        width,
        height,
      });

      context.clearRect(0, 0, width, height);
      GEOMETRY.edges.forEach(([start, end]) => {
        const a = vertices[start];
        const b = vertices[end];
        const activeSection = hovered ?? focused;
        const selected = activeSection !== null && (start === GEOMETRY.anchors[activeSection] || end === GEOMETRY.anchors[activeSection]);
        context.strokeStyle = `rgba(255,255,255,${selected ? 0.98 : (a.opacity + b.opacity) * 0.48})`;
        context.lineWidth = selected ? 1.4 : 0.7 + (a.depth + b.depth) * 0.25;
        context.beginPath();
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      });

      vertices.forEach((vertex, index) => {
        context.fillStyle = ANCHORS.has(index)
          ? NAVIGATION_NODE_COLOR
          : `rgba(255,255,255,${vertex.opacity})`;
        context.beginPath();
        const anchorRadius = (width < 600 ? 4.3 : 5.5) - collapse * 2;
        context.arc(vertex.x, vertex.y, ANCHORS.has(index) ? anchorRadius : vertex.radius, 0, Math.PI * 2);
        context.fill();
      });

      PORTFOLIO_SECTIONS.forEach(({ id }) => {
        const button = buttonsRef.current[id];
        if (!button) return;
        const vertex = vertices[GEOMETRY.anchors[id]];
        const placement = LABEL_PLACEMENT[id];
        const labelWidth = buttonWidths[id] ?? 90;
        const gap = width < 600 ? 18 : 29;
        const desiredX = vertex.x + placement.side * gap;
        const x = Math.max(placement.side < 0 ? labelWidth + 10 : 10,
          Math.min(desiredX, width - (placement.side > 0 ? labelWidth + 10 : 10)));
        const y = Math.max(26, Math.min(height - 26, vertex.y + placement.vertical));
        button.style.transform = `translate3d(${x}px,${y}px,0) translate(${placement.side < 0 ? "-100%" : "0"},-50%)`;

        if (settings.phase === "exploring") {
          context.strokeStyle = "rgba(255,255,255,0.85)";
          context.lineWidth = 0.8;
          context.beginPath();
          context.moveTo(vertex.x, vertex.y);
          context.lineTo(x - placement.side * 10, y);
          context.lineTo(x, y);
          context.stroke();
        }
      });

      if (!document.hidden) frame = requestAnimationFrame(render);
    };

    const startPointer = (event: PointerEvent): void => {
      if (settingsRef.current.phase !== "exploring" || event.button !== 0) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const movePointer = (event: PointerEvent): void => {
      if (!pointer || pointer.id !== event.pointerId) return;
      if (event.buttons === 0) {
        endPointer();
        return;
      }
      yaw += (event.clientX - pointer.x) * 0.006;
      pitch = Math.max(-0.7, Math.min(0.7, pitch + (event.clientY - pointer.y) * 0.004));
      pointer = { ...pointer, x: event.clientX, y: event.clientY };
    };
    const endPointer = (): void => {
      pointer = null;
      canvas.style.cursor = "grab";
    };
    const trackHover = (event: Event): void => {
      const button = event.currentTarget;
      const sectionId = button instanceof HTMLButtonElement
        ? PORTFOLIO_SECTIONS.find(({ id }) => id === button.dataset.section)?.id ?? null
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
      if (!document.hidden) frame = requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(surface);
    resize();
    canvas.addEventListener("pointerdown", startPointer);
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("lostpointercapture", endPointer);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", endPointer);
    const buttons = Object.values(buttonsRef.current);
    buttons.forEach((button) => {
      button?.addEventListener("pointerenter", trackHover);
      button?.addEventListener("focus", trackHover);
      button?.addEventListener("pointerleave", clearHover);
      button?.addEventListener("blur", clearHover);
    });
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", startPointer);
      canvas.removeEventListener("pointermove", movePointer);
      canvas.removeEventListener("pointerup", endPointer);
      canvas.removeEventListener("pointercancel", endPointer);
      canvas.removeEventListener("lostpointercapture", endPointer);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", endPointer);
      buttons.forEach((button) => {
        button?.removeEventListener("pointerenter", trackHover);
        button?.removeEventListener("focus", trackHover);
        button?.removeEventListener("pointerleave", clearHover);
        button?.removeEventListener("blur", clearHover);
      });
    };
  }, []);

  return (
    <div ref={surfaceRef} className="molecular-surface" inert={phase !== "exploring"}>
      <canvas ref={canvasRef} className="molecular-canvas" data-testid="molecular-canvas" aria-hidden="true" />
      <nav className="vertices" aria-label="Explore my connections">
        {PORTFOLIO_SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            ref={(element) => { buttonsRef.current[id] = element; }}
            className={`vertex vertex--${id}`}
            data-section={id}
            disabled={phase !== "exploring"}
            onClick={() => onSelect(id)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
