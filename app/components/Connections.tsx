"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import { PORTFOLIO_NAVIGATION, type SectionId } from "../lib/navigation";
import MolecularScene from "./MolecularScene";

type ViewState =
  | Readonly<{ phase: "exploring" }>
  | Readonly<{ phase: "collapsing" | "reading" | "expanding"; sectionId: SectionId }>;

type ViewAction =
  | Readonly<{ type: "select"; sectionId: SectionId; immediate: boolean }>
  | Readonly<{ type: "back"; immediate: boolean }>
  | Readonly<{ type: "route-change"; sectionId?: SectionId; immediate: boolean }>
  | Readonly<{ type: "transition-complete" }>;

function changeView(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case "route-change":
      if (action.sectionId) return { phase: "reading", sectionId: action.sectionId };
      return state.phase === "reading" && !action.immediate
        ? { phase: "expanding", sectionId: state.sectionId }
        : state.phase === "expanding" ? state : { phase: "exploring" };
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

const BackNavigation = createContext<(() => void) | null>(null);

export function BackLink({ className = "back-link" }: Readonly<{ className?: string }>): React.JSX.Element {
  const goBack = useContext(BackNavigation);
  return (
    <Link href="/" className={className} onClick={(event) => {
      if (goBack && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0) {
        event.preventDefault();
        goBack();
      }
    }}>←Back</Link>
  );
}

export default function Connections({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const routeSection = PORTFOLIO_NAVIGATION.find((section) => section.kind === "section" && pathname === `/${section.id}`);
  const [previousPath, setPreviousPath] = useState(pathname);
  const [view, dispatch] = useReducer(changeView, routeSection
    ? { phase: "reading", sectionId: routeSection.id }
    : { phase: "exploring" });
  const [paused, setPaused] = useState(false);
  const [reshapeVersion, setReshapeVersion] = useState(0);
  const [deformationCount, setDeformationCount] = useState(0);
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, readMotionPreference, () => false);
  const stageRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<SectionId | null>(null);

  // Synchronize browser history before rendering the destination's content.
  if (pathname !== previousPath) {
    setPreviousPath(pathname);
    dispatch({ type: "route-change", sectionId: routeSection?.id, immediate: reducedMotion });
  }

  const finishTransition = useCallback(() => {
    if (view.phase === "collapsing") router.push(`/${view.sectionId}`, { scroll: false });
    dispatch({ type: "transition-complete" });
  }, [view, router]);
  const recordDent = useCallback(() => setDeformationCount((count) => count + 1), []);
  const goBack = useCallback(() => {
    if (view.phase !== "reading") return;
    selectedRef.current = view.sectionId;
    dispatch({ type: "back", immediate: reducedMotion });
    router.push("/", { scroll: false });
  }, [reducedMotion, router, view]);

  useEffect(() => {
    if (view.phase === "reading") {
      selectedRef.current = view.sectionId;
      window.scrollTo({ top: 0, behavior: "auto" });
      stageRef.current?.querySelector<HTMLElement>(".connection-content")?.focus({ preventScroll: true });
    }
    if (view.phase === "exploring" && selectedRef.current) {
      if (selectedRef.current === "work-experience") window.scrollTo({ top: 0, behavior: "auto" });
      stageRef.current?.querySelector<HTMLAnchorElement>(`[data-section="${selectedRef.current}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [view, pathname, children]);

  useEffect(() => {
    if (view.phase !== "reading") return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") goBack();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view.phase, goBack]);

  const selectSection = (sectionId: SectionId): void => {
    const destination = PORTFOLIO_NAVIGATION.find(({ id }) => id === sectionId);
    if (destination?.kind === "external") {
      window.open(destination.href, "_blank", "noopener,noreferrer");
      return;
    }
    selectedRef.current = sectionId;
    dispatch({ type: "select", sectionId, immediate: reducedMotion });
    if (reducedMotion) router.push(`/${sectionId}`, { scroll: false });
  };

  return (
    <div
      ref={stageRef}
      className="molecular-stage"
      data-testid="molecular-stage"
      data-phase={view.phase}
      data-deformation-count={deformationCount}
      aria-busy={view.phase === "collapsing" || view.phase === "expanding"}
    >
      <MolecularScene
        phase={view.phase}
        paused={paused}
        reducedMotion={reducedMotion}
        reshapeVersion={reshapeVersion}
        onDent={recordDent}
        onSelect={selectSection}
        onTransitionComplete={finishTransition}
      />
      <BackNavigation.Provider value={goBack}>
        {(view.phase === "reading" || (!routeSection && pathname !== "/")) && children}
      </BackNavigation.Provider>
      <div className="scene-controls" hidden={view.phase !== "exploring"}>
        <div className="scene-controls__actions">
          <span>Drag to rotate</span>
          <span aria-hidden="true">·</span>
          <button onClick={() => setReshapeVersion((version) => version + 1)} aria-label="Indent a white point">
            Reshape
          </button>
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
      </div>
      <p className="sr-only" role="status">
        {view.phase === "collapsing" ? "Gathering the connections." : deformationCount > 0 ? `Shape changed. Total dents: ${deformationCount}.` : ""}
      </p>
    </div>
  );
}
