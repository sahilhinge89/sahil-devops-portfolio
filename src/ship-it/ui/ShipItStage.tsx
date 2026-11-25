// Hero stage for the whole opening: globe → cloud wipe → 3D port story → hero.
// Owns the ONE master clock (wall seconds) and its frame loop; the 3D Stepper reads the
// same clock. Handles Skip/Replay, play-once per session, reduced motion and WebGL fallback.
import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { RotateCcw, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { config } from "@/config";
import { CAPTION_CUES, captionAt, type CaptionKey } from "../timeline/script";
import {
  T_HERO_WALL,
  T_NEED_SCENE,
  T_STORY,
  T_TOTAL,
  createOpeningFrame,
  openingFrame,
  storyTime,
} from "../timeline/opening";
import { MasterClock } from "../state/clock";
import { GlobeIntro, type GlobeIntroHandle } from "./GlobeIntro";
import type { CanvasMode, ShipItApi } from "../scene/ShipItCanvas";

const ShipItCanvas = lazy(() => import("../scene/ShipItCanvas"));

const SESSION_KEY = "shipit:played";

function markPlayed() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage unavailable: play again next time */
  }
}
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch(error: unknown) {
    console.warn("[ship-it] 3D scene unavailable, showing static hero", error);
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Phase = "boot" | "intro" | "hero";
type CaptionId = CaptionKey | "globe" | null;

export function ShipItStage({ onReveal, children }: { onReveal: (v: boolean) => void; children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [mode, setMode] = useState<CanvasMode | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [caption, setCaption] = useState<CaptionId>(null);
  const [device, setDevice] = useState({ coarse: false, low: false });
  const [globeOn, setGlobeOn] = useState(false);
  const [sceneActive, setSceneActive] = useState(false);

  const clock = useRef(new MasterClock());
  const api = useRef<ShipItApi | null>(null);
  const section = useRef<HTMLElement>(null);
  const globe = useRef<GlobeIntroHandle>(null);
  const decided = useRef(false);
  const live = useRef({ phase: "boot" as Phase, ready: false, globeOn: false, sceneActive: false, caption: null as CaptionId, low: false });
  live.current.phase = phase;
  live.current.ready = ready;
  live.current.globeOn = globeOn;
  live.current.sceneActive = sceneActive;
  live.current.low = device.low;

  // Decide how to start, on the client only (once, even under StrictMode).
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const low = coarse || window.innerWidth < 768;
    setDevice({ coarse, low });
    const c = clock.current;
    if (!hasWebGL()) {
      setFailed(true);
      setPhase("hero");
      return;
    }
    // Always autoplay the intro from t = 0 on initial load — no click needed.
    c.seek(0);
    c.playing = true;
    setMode("play");
    setPhase("intro");
    setGlobeOn(true);
    if (import.meta.env.DEV) {
      const q = new URLSearchParams(window.location.search).get("opening");
      if (q !== null && !Number.isNaN(Number(q))) {
        c.seek(Number(q));
        c.playing = false;
        setMode("play");
        setPhase(Number(q) >= T_HERO_WALL ? "hero" : "intro");
        setGlobeOn(Number(q) < T_STORY + 0.5);
      }
    }
  }, []);

  useEffect(() => {
    onReveal(phase === "hero");
    if (phase === "hero") markPlayed();
  }, [phase, onReveal]);

  // The master frame loop: advances the clock and writes every DOM overlay from it.
  useEffect(() => {
    if (mode === null || failed) return;
    const f = createOpeningFrame();
    const vars = { lb: -1, dof: -1, vig: -1, cloud: -1, grow: -1, story: -1 };
    const setVar = (name: keyof typeof vars, css: string, v: number) => {
      if (Math.abs(vars[name] - v) < 0.002) return;
      vars[name] = v;
      section.current?.style.setProperty(css, v.toFixed(3));
    };
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const c = clock.current;
      const L = live.current;
      c.holdAt = L.ready ? null : T_NEED_SCENE;
      c.tick(dt);
      const T = c.T;
      openingFrame(T, f);
      if (L.globeOn) globe.current?.update(f);
      setVar("lb", "--lb", f.letterbox);
      setVar("dof", "--dof", L.low ? 0 : f.dof);
      setVar("vig", "--vig", f.vignette);
      setVar("cloud", "--cloud", f.cloud);
      setVar("grow", "--cloudgrow", f.cloudGrow);
      setVar("story", "--story", L.globeOn ? f.story : 1);

      if (!L.sceneActive && T >= T_NEED_SCENE - 0.3) setSceneActive(true);
      if (L.globeOn && T > T_STORY + 0.6) setGlobeOn(false);

      let cap: CaptionId = null;
      if (L.phase === "intro") {
        if (f.globeCaption) cap = "globe";
        else if (T >= T_STORY) {
          const i = captionAt(storyTime(T));
          if (i >= 0) cap = CAPTION_CUES[i]!.key;
        }
        if (T >= T_HERO_WALL) setPhase("hero");
      }
      if (cap !== L.caption) {
        L.caption = cap;
        setCaption(cap);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [mode, failed]);

  const skip = useCallback(() => {
    const c = clock.current;
    c.seek(Math.max(c.T, T_TOTAL));
    api.current?.skip();
    setCaption(null);
    setGlobeOn(false);
    setSceneActive(true);
    setPhase("hero");
  }, []);

  const replay = useCallback(() => {
    const c = clock.current;
    c.seek(0);
    c.playing = true;
    setGlobeOn(true);
    setPhase("intro");
    if (mode === "still") setMode("play");
    else api.current?.replay();
  }, [mode]);

  // Esc / Enter skip the intro.
  useEffect(() => {
    if (phase !== "intro") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        skip();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, skip]);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => {
    setFailed(true);
    setGlobeOn(false);
    setPhase("hero");
  }, []);

  const captionText = caption ? config.captions[caption] : "";
  const showCanvas = mode !== null && !failed;
  const revealed = phase === "hero";

  return (
    <section
      ref={section}
      id="top"
      aria-label="Introduction"
      className="stage-vars relative isolate h-[100svh] min-h-[560px] w-full overflow-hidden bg-sky-gradient"
    >
      {showCanvas && (
        <CanvasBoundary onError={onError}>
          <Suspense fallback={null}>
            <ShipItCanvas
              mode={mode}
              active={sceneActive}
              clock={clock.current}
              api={api}
              onReady={onReady}
              lowDetail={device.low}
              coarse={device.coarse}
            />
          </Suspense>
        </CanvasBoundary>
      )}

      {/* cinematic overlays: vignette + cheap depth of field on close-ups (desktop only) */}
      <div aria-hidden className="stage-vignette pointer-events-none absolute inset-0" />
      {!device.low && <div aria-hidden className="stage-dof pointer-events-none absolute inset-0" />}

      {/* lightweight loading state (returning visitors / reduced motion) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-sky-gradient transition-opacity duration-700 ${
          showCanvas && !ready && !globeOn ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="animate-pulse-soft font-mono text-xs tracking-widest text-muted-foreground">preparing the port…</p>
      </div>

      {/* globe chapter + cloud wipe */}
      {globeOn && <GlobeIntro ref={globe} lowDetail={device.low} />}
      {globeOn && (
        <div aria-hidden className="stage-cloud pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-opening" style={{ opacity: "var(--cloud)" }} />
          {CLOUDS.map((c, i) => (
            <span key={i} className="stage-cloud-blob" style={{ left: c[0], top: c[1], width: c[2], height: c[2] }} />
          ))}
        </div>
      )}

      {/* smooth bottom gradient fade into the next section (active both during intro and hero) */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-background sm:h-32" />

      {/* veil behind hero copy */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 bg-veil transition-opacity duration-1000 ${
          revealed ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* hero copy (always in the DOM; resolves in when the animation settles) */}
      <div
        data-revealed={revealed}
        className={`group pointer-events-none absolute inset-0 flex items-end pb-24 sm:pb-28 md:items-center md:pb-0 ${
          revealed ? "" : "invisible"
        }`}
      >
        <div className="pointer-events-auto mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</div>
      </div>

      {/* captions, floating smoothly over the bottom blend */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4 sm:bottom-8 sm:px-6">
        <p
          className={`glass-panel max-w-full truncate rounded-full px-4 py-2 font-mono text-xs text-foreground shadow-soft transition-opacity duration-200 md:text-sm ${
            phase === "intro" && captionText ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="mr-2 text-primary">$</span>
          {captionText}
        </p>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase === "intro" ? captionText : ""}
      </p>

      {/* skip / replay (top right, transparent overlay with floating frosted-glass pills) */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 bg-transparent md:right-6 md:top-6">
        {phase === "intro" && (
          <Button
            variant="chip"
            size="sm"
            onClick={skip}
            aria-label="Skip intro animation (Esc)"
            className="rounded-full border border-slate-900/10 bg-white/60 text-slate-800 shadow-sm backdrop-blur-md hover:bg-white/80"
          >
            Skip <SkipForward />
          </Button>
        )}
        {phase === "hero" && showCanvas && (
          <>
            <span className="hidden rounded-full border border-slate-900/10 bg-white/60 px-3 py-1 font-mono text-[11px] text-slate-800 shadow-sm backdrop-blur-md md:inline">
              drag to look around
            </span>
            <Button
              variant="chip"
              size="sm"
              onClick={replay}
              aria-label="Replay intro animation"
              className="rounded-full border border-slate-900/10 bg-white/60 text-slate-800 shadow-sm backdrop-blur-md hover:bg-white/80"
            >
              <RotateCcw /> Replay
            </Button>
          </>
        )}
      </div>
    </section>
  );
}

// Cloud wipe blobs: [left, top, size]
const CLOUDS: [string, string, string][] = [
  ["50%", "50%", "70vmax"],
  ["18%", "30%", "48vmax"],
  ["82%", "28%", "52vmax"],
  ["25%", "78%", "56vmax"],
  ["78%", "76%", "50vmax"],
  ["50%", "10%", "40vmax"],
];
