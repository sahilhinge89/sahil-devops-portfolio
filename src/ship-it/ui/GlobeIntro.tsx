// Globe chapter of the opening: white backdrop, the cobe globe, a pulse ring on New York.
// Purely driven by `update(frame)` from the stage's master clock — no timers of its own.
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Globe, type GlobeArc, type GlobeHandle, type GlobeMarker } from "@/components/ui/cobe-globe";
import { config } from "@/config";
import type { OpeningFrame } from "../timeline/opening";

export interface GlobeIntroHandle {
  update: (f: OpeningFrame) => void;
}

const markers = config.globe.markers as unknown as GlobeMarker[];
const arcs = config.globe.arcs as unknown as GlobeArc[];
const focus = markers.find((m) => m.id === config.globe.focusId)!;

export const GlobeIntro = forwardRef<GlobeIntroHandle, { lowDetail: boolean; onReady?: () => void }>(function GlobeIntro(
  { lowDetail, onReady },
  ref,
) {
  const layer = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const globe = useRef<GlobeHandle>(null);

  useImperativeHandle(ref, () => ({
    update: (f) => {
      if (layer.current) {
        layer.current.style.opacity = f.globe.toFixed(3);
        layer.current.style.visibility = f.globe > 0.001 ? "visible" : "hidden";
      }
      if (backdrop.current) backdrop.current.style.opacity = f.backdrop.toFixed(3);
      if (f.globe <= 0.001) return;
      globe.current?.render({
        phi: f.phi,
        theta: f.theta,
        scale: f.scale,
        others: f.others,
        labels: f.labels * (1 - f.pulse),
        focusId: focus.id,
      });
      const r = ring.current;
      const p = globe.current?.project(focus.location);
      if (r && p) {
        r.style.opacity = (f.pulse * (p.visible ? 1 : 0) * (1 - Math.min(1, (f.scale - 1) / 2))).toFixed(3);
        r.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
    },
  }));

  return (
    <>
      <div ref={backdrop} aria-hidden className="pointer-events-none absolute inset-0 bg-opening" />
      <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 opacity-0">
        <Globe
          ref={globe}
          markers={markers}
          arcs={arcs}
          markerColor={[0.3, 0.45, 0.85]}
          baseColor={[1, 1, 1]}
          arcColor={[0.3, 0.45, 0.85]}
          glowColor={[0.94, 0.93, 0.91]}
          dark={0}
          mapBrightness={10}
          markerSize={0.025}
          markerElevation={0.01}
          mapSamples={lowDetail ? 10000 : 16000}
          maxDpr={lowDetail ? 1.5 : 2}
          {...(onReady ? { onReady } : {})}
        />
        <div ref={ring} className="absolute left-0 top-0 opacity-0">
          <span className="block size-10 rounded-full border-2 border-globe-marker animate-ping-soft" />
          <span className="absolute left-1/2 top-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-globe-marker shadow-soft" />
        </div>
      </div>
    </>
  );
});
