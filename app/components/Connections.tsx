"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { PORTFOLIO_SECTIONS, type SectionId } from "../lib/portfolio-content";
import MolecularScene from "./MolecularScene";

type ViewState =
  | Readonly<{ phase: "exploring" }>
  | Readonly<{ phase: "collapsing" | "reading" | "expanding"; sectionId: SectionId }>;

type ViewAction =
  | Readonly<{ type: "select"; sectionId: SectionId; immediate: boolean }>
  | Readonly<{ type: "back"; immediate: boolean }>
  | Readonly<{ type: "transition-complete" }>;

function changeView(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "select":
      return state.phase === "exploring"
        ? { phase: action.immediate ? "reading" : "collapsing", sectionId: action.sectionId }
        : state;
    case "back":
      return state.phase === "reading"
        ? action.immediate
          ? { phase: "exploring" }
          : { phase: "expanding", sectionId: state.sectionId }
        : state;
    case "transition-complete":
      if (state.phase === "collapsing") return { ...state, phase: "reading" };
      if (state.phase === "expanding") return { phase: "exploring" };
      return state;
  }
}

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void): () => void {
  const preference = window.matchMedia(MOTION_QUERY);
  preference.addEventListener("change", onChange);
  return () => preference.removeEventListener("change", onChange);
}

function readMotionPreference(): boolean {
  return window.matchMedia(MOTION_QUERY).matches;
}

export default function Connections(): React.JSX.Element {
  const [view, dispatch] = useReducer(changeView, { phase: "exploring" });
  const [paused, setPaused] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, readMotionPreference, () => false);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const selectedRef = useRef<SectionId | null>(null);
  const section = view.phase === "reading"
    ? PORTFOLIO_SECTIONS.find((item) => item.id === view.sectionId)
    : undefined;

  const finishTransition = useCallback(() => dispatch({ type: "transition-complete" }), []);
  const goBack = useCallback(() => dispatch({ type: "back", immediate: reducedMotion }), [reducedMotion]);

  useEffect(() => {
    if (view.phase === "reading") contentRef.current?.focus({ preventScroll: true });
    if (view.phase === "exploring" && selectedRef.current) {
      stageRef.current?.querySelector<HTMLButtonElement>(`[data-section="${selectedRef.current}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [view.phase]);

  useEffect(() => {
    if (view.phase !== "reading") return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") goBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view.phase, goBack]);

  const selectSection = (sectionId: SectionId): void => {
    selectedRef.current = sectionId;
    dispatch({ type: "select", sectionId, immediate: reducedMotion });
  };

  return (
    <div
      ref={stageRef}
      className="molecular-stage"
      data-testid="molecular-stage"
      data-phase={view.phase}
      aria-busy={view.phase === "collapsing" || view.phase === "expanding"}
    >
      <MolecularScene
        phase={view.phase}
        paused={paused}
        reducedMotion={reducedMotion}
        onSelect={selectSection}
        onTransitionComplete={finishTransition}
      />
      {section && (
        <section
          ref={contentRef}
          className="connection-content"
          aria-labelledby="connection-heading"
          tabIndex={-1}
        >
          <button className="back-link" onClick={goBack}>Back to connections</button>
          <p className="connection-content__eyebrow">{section.eyebrow}</p>
          <h2 id="connection-heading">{section.label}</h2>
          <p className="connection-content__title">{section.title}</p>
          <p className="connection-content__description">{section.description}</p>
          <ul className="connection-list">
            {section.items.map((item) => (
              <li key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.href && (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.linkLabel}<span aria-hidden="true"> ↗</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="scene-controls" hidden={view.phase !== "exploring"}>
        <span>Select a vertex</span>
        <span aria-hidden="true">·</span>
        <span>Drag to rotate</span>
        <span aria-hidden="true">·</span>
        <button
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "Resume animation" : "Pause animation"}
          aria-pressed={paused}
          disabled={reducedMotion}
        >
          {reducedMotion ? "Motion reduced" : paused ? "Resume" : "Pause"}
        </button>
      </div>
      <p className="sr-only" role="status">
        {view.phase === "collapsing" ? "Gathering the connections." : ""}
      </p>
    </div>
  );
}
