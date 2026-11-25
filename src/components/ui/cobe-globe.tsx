// Reusable <Globe /> around `cobe` (v2): WebGL canvas, devicePixelRatio aware, resize-safe,
// cleaned up on unmount. Marker/arc labels are a lightweight DOM overlay positioned with the
// same projection maths. Drive rotation/scale either with props or the imperative `render()`.
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import createGlobe, { type COBEOptions, type Globe as CobeGlobe } from "cobe";
import { projectGlobe, type LatLon, type Projected } from "@/lib/globe-math";
import { cn } from "@/lib/utils";

type RGB = [number, number, number];

export interface GlobeMarker {
  id: string;
  location: LatLon;
  label?: string;
}
export interface GlobeArc {
  id: string;
  from: LatLon;
  to: LatLon;
  label?: string;
}
export interface GlobeView {
  phi: number;
  theta: number;
  scale?: number;
  /** 0..1 fade for every marker/arc except `focusId`. */
  others?: number;
  /** 0..1 label opacity. */
  labels?: number;
  focusId?: string;
}
export interface GlobeHandle {
  render: (view: GlobeView) => void;
  /** Pixel position of a location inside the globe box for the last rendered view. */
  project: (loc: LatLon) => { x: number; y: number; visible: boolean };
}

export interface GlobeProps {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  markerColor?: RGB;
  baseColor?: RGB;
  arcColor?: RGB;
  glowColor?: RGB;
  dark?: number;
  mapBrightness?: number;
  markerSize?: number;
  markerElevation?: number;
  mapSamples?: number;
  maxDpr?: number;
  /** Uncontrolled initial / controlled view (ignored once `render()` is used imperatively). */
  phi?: number;
  theta?: number;
  scale?: number;
  showLabels?: boolean;
  className?: string;
  labelClassName?: string;
  onReady?: () => void;
}

const lerp3 = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

export const Globe = forwardRef<GlobeHandle, GlobeProps>(function Globe(
  {
    markers = [],
    arcs = [],
    markerColor = [0.3, 0.45, 0.85],
    baseColor = [1, 1, 1],
    arcColor = [0.3, 0.45, 0.85],
    glowColor = [0.94, 0.93, 0.91],
    dark = 0,
    mapBrightness = 10,
    markerSize = 0.025,
    markerElevation = 0.01,
    mapSamples = 16000,
    maxDpr = 2,
    phi = 0,
    theta = 0.25,
    scale = 1,
    showLabels = true,
    className,
    labelClassName,
    onReady,
  },
  ref,
) {
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const labelEls = useRef<Record<string, HTMLSpanElement | null>>({});
  const globe = useRef<CobeGlobe | null>(null);
  const box = useRef({ w: 1, h: 1 });
  const view = useRef<Required<Omit<GlobeView, "focusId">> & { focusId: string | undefined }>({
    phi,
    theta,
    scale,
    others: 1,
    labels: 1,
    focusId: undefined,
  });
  const fadeStep = useRef(-1);
  const proj = useRef<Projected>({ x: 0, y: 0, visible: false, depth: 0 });
  const cfg = useRef({ markers, arcs, markerColor, baseColor, arcColor, markerSize, markerElevation });
  cfg.current = { markers, arcs, markerColor, baseColor, arcColor, markerSize, markerElevation };
  const readyCb = useRef(onReady);
  readyCb.current = onReady;

  const baseScale = () => {
    // cobe draws the globe 0.8 × canvas height across; keep it inside narrow screens too.
    const { w, h } = box.current;
    return Math.min(1, (1.05 * w) / h);
  };

  const draw = () => {
    const g = globe.current;
    if (!g) return;
    const v = view.current;
    const c = cfg.current;
    const sc = v.scale * baseScale();
    const state: Partial<COBEOptions> = { phi: v.phi, theta: v.theta, scale: sc };
    // Re-upload markers/arcs only when the fade changes noticeably (no per-frame churn).
    const step = Math.round(v.others * 20);
    if (step !== fadeStep.current) {
      fadeStep.current = step;
      const k = step / 20;
      state.markers = c.markers.map((m) => ({
        location: [m.location[0], m.location[1]] as [number, number],
        size: m.id === v.focusId ? c.markerSize * 1.6 : c.markerSize * k,
      }));
      state.arcs =
        k > 0.02 ? c.arcs.map((a) => ({ from: [a.from[0], a.from[1]] as [number, number], to: [a.to[0], a.to[1]] as [number, number] })) : [];
      state.arcColor = lerp3(c.baseColor, c.arcColor, k);
    }
    g.update(state);

    if (!showLabels) return;
    const { w, h } = box.current;
    const aspect = w / h;
    const items: { id: string; loc: LatLon; arc: boolean }[] = [];
    for (const m of c.markers) if (m.label) items.push({ id: m.id, loc: m.location, arc: false });
    for (const a of c.arcs) {
      if (!a.label) continue;
      items.push({ id: a.id, loc: midpoint(a.from, a.to), arc: true });
    }
    for (const it of items) {
      const el = labelEls.current[it.id];
      if (!el) continue;
      const p = projectGlobe(it.loc, v.phi, v.theta, aspect, sc, c.markerElevation + (it.arc ? 0.18 : 0), proj.current);
      const focus = it.id === v.focusId;
      const a = (p.visible && p.depth > 0 ? 1 : 0) * v.labels * (focus ? 1 : v.others);
      el.style.opacity = a.toFixed(3);
      el.style.transform = `translate3d(${(p.x * w).toFixed(1)}px, ${(p.y * h).toFixed(1)}px, 0) translate(-50%, -150%)`;
    }
  };

  useImperativeHandle(ref, () => ({
    render: (v) => {
      Object.assign(view.current, { others: 1, labels: 1, scale: 1 }, v);
      draw();
    },
    project: (loc) => {
      const { w, h } = box.current;
      const v = view.current;
      const p = projectGlobe(loc, v.phi, v.theta, w / h, v.scale * baseScale(), cfg.current.markerElevation, proj.current);
      return { x: p.x * w, y: p.y * h, visible: p.visible && p.depth > 0 };
    },
  }));

  // Controlled props → redraw.
  useEffect(() => {
    Object.assign(view.current, { phi, theta, scale });
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phi, theta, scale]);

  useEffect(() => {
    const el = host.current;
    const r = root.current;
    if (!el || !r) return;
    let timer = 0;
    let canvas: HTMLCanvasElement | null = null;

    const build = () => {
      globe.current?.destroy();
      el.replaceChildren();
      const w = Math.max(1, r.clientWidth);
      const h = Math.max(1, r.clientHeight);
      box.current = { w, h };
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      canvas = document.createElement("canvas");
      canvas.style.cssText = "width:100%;height:100%;display:block";
      canvas.setAttribute("aria-hidden", "true");
      el.appendChild(canvas);
      const c = cfg.current;
      globe.current = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: w,
        height: h,
        phi: view.current.phi,
        theta: view.current.theta,
        dark,
        diffuse: 1.2,
        mapSamples,
        mapBrightness,
        baseColor: c.baseColor,
        markerColor: c.markerColor,
        glowColor,
        arcColor: c.arcColor,
        markerElevation: c.markerElevation,
        scale: view.current.scale * baseScale(),
        markers: [],
        arcs: [],
      });
      fadeStep.current = -1;
      draw();
    };

    build();
    readyCb.current?.();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (Math.abs(r.clientWidth - box.current.w) > 1 || Math.abs(r.clientHeight - box.current.h) > 1) build();
      }, 120);
    });
    ro.observe(r);
    return () => {
      ro.disconnect();
      window.clearTimeout(timer);
      globe.current?.destroy();
      globe.current = null;
      el.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dark, mapBrightness, mapSamples, maxDpr]);

  const labelled = [
    ...markers.filter((m) => m.label).map((m) => ({ id: m.id, label: m.label!, arc: false })),
    ...arcs.filter((a) => a.label).map((a) => ({ id: a.id, label: a.label!, arc: true })),
  ];

  return (
    <div ref={root} className={cn("relative h-full w-full", className)}>
      {/* cobe inserts its own wrapper here; React never renders children into this node */}
      <div ref={host} className="absolute inset-0" />
      {showLabels && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {labelled.map((l) => (
            <span
              key={l.id}
              ref={(n) => {
                labelEls.current[l.id] = n;
              }}
              className={cn(
                "absolute left-0 top-0 whitespace-nowrap font-mono text-[10px] tracking-wide opacity-0 will-change-transform",
                l.arc ? "text-primary" : "text-muted-foreground",
                labelClassName,
              )}
            >
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

function midpoint(a: LatLon, b: LatLon): LatLon {
  // great-circle midpoint
  const R = Math.PI / 180;
  const [la1, lo1] = [a[0] * R, a[1] * R];
  const [la2, lo2] = [b[0] * R, b[1] * R];
  const bx = Math.cos(la2) * Math.cos(lo2 - lo1);
  const by = Math.cos(la2) * Math.sin(lo2 - lo1);
  const lat = Math.atan2(Math.sin(la1) + Math.sin(la2), Math.sqrt((Math.cos(la1) + bx) ** 2 + by ** 2));
  const lon = lo1 + Math.atan2(by, Math.cos(la1) + bx);
  return [lat / R, lon / R];
}
