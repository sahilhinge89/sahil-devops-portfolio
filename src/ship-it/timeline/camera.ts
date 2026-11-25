// Scripted camera: a sequence of shots blended with smootherstep — no hard cuts. Shots are
// functions of the (slow-motion scaled) script time, so close-ups linger exactly as long as
// the slow motion does. Pure TS.
import type { Frame } from "./script";
import { DECK_Y, H_SLOT_TOP, H_TRUCK_TOP, ROAD_Z, SHIP, TRUCK } from "./layout";
import { lerp, smoother } from "./tracks";

export interface CamPose {
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
}

type Shot = (t: number, f: Frame, out: CamPose) => void;

const set = (o: CamPose, px: number, py: number, pz: number, tx: number, ty: number, tz: number) => {
  o.px = px;
  o.py = py;
  o.pz = pz;
  o.tx = tx;
  o.ty = ty;
  o.tz = tz;
};
const K = (t: number, a: number, b: number) => smoother((t - a) / (b - a));

const HELM_X = SHIP.x + SHIP.bridgeX - 0.35 + 0.55;
const HELM_Y = 4.45 + 0.62;
const S1 = SHIP.slotX[0];

const SHOTS: Shot[] = [
  // 0 — drone fly-in: drop out of the clouds, swoop low over the water and bank toward the quay
  (t, _f, o) => {
    const k = K(t, -1.3, 0.9);
    const dip = Math.sin(Math.PI * k); // low point mid-swoop
    const yaw = lerp(0.9, 0, k); // banks around the port as it descends
    const r = lerp(62, 30, k);
    set(o, -6 + r * Math.sin(yaw), lerp(44, 9, k) - 3.5 * dip, -5 + r * Math.cos(yaw), lerp(-5, -11, k), lerp(-1, 2, k), lerp(-7, -5, k));
  },
  // 1 — warehouse / forklift picks up the crate
  (t, _f, o) => {
    const k = K(t, 0.8, 1.5);
    set(o, lerp(-32.6, -31.6, k), lerp(7.4, 6.4, k), lerp(7.8, 6.6, k), -29.8, 2.0, ROAD_Z);
  },
  // 2 — (a) close-up: crate slides into the container, doors swing shut (slow motion)
  (t, _f, o) => {
    const k = K(t, 1.45, 2.35);
    const cx = TRUCK.x0 - 1.5; // container door end
    set(o, lerp(cx - 2.7, cx - 2.1, k), lerp(4.3, 3.7, k), lerp(0.6, 0.0, k), cx + 0.7, DECK_Y + 0.55, ROAD_Z);
  },
  // 3 — (b) low tracking shot as the truck rolls through lint · test · scan (slow motion)
  (t, f, o) => {
    const k = K(t, 2.4, 3.6);
    const x = Math.min(f.truckX, -8.5);
    set(o, x + 5.2, lerp(3.2, 2.7, k), ROAD_Z + 5.6, x + 0.2, 3.4, ROAD_Z);
  },
  // 4 — truck arrives under the crane
  (t, f, o) => {
    const k = K(t, 3.5, 4.0);
    set(o, lerp(6, 3.4, k), lerp(8.5, 6.8, k), lerp(9.5, 7.5, k), f.truckX + 0.3, lerp(3.4, 3.2, k), ROAD_Z);
  },
  // 5 — (c) close-up: spreader seats, the four twist-locks turn and light (slow motion)
  (t, _f, o) => {
    const k = K(t, 3.95, 4.4);
    set(o, lerp(-0.6, -1.0, k), lerp(5.0, 4.4, k), lerp(1.4, 0.9, k), TRUCK.xPick, H_TRUCK_TOP + 0.1, ROAD_Z);
  },
  // 6 — wide: the crane carries the container over the water
  (t, f, o) => {
    const k = K(t, 4.3, 4.8);
    set(o, lerp(9, 7.5, k), lerp(9.5, 8.5, k), lerp(5, 2.5, k), f.gx * 0.6, lerp(4.5, 3.8, k), lerp(f.tz, -8.5, k));
  },
  // 7 — (d) close-up: touchdown in node-1's cell guides, locks release (slow motion)
  (t, _f, o) => {
    const k = K(t, 4.72, 5.15);
    set(o, lerp(1.9, 1.4, k), lerp(4.4, 3.9, k), lerp(-6.4, -6.7, k), S1, H_SLOT_TOP - 0.55, SHIP.z);
  },
  // 8 — crane wide for containers two and three
  (t, _f, o) => {
    const k = K(t, 5.1, 6.5);
    set(o, lerp(14, 12, k), lerp(11.5, 10.5, k), lerp(11, 12, k), 0.6, 3.8, -6);
  },
  // 9 — (e) close-up: the captain's hands on the helm (slow motion)
  (t, _f, o) => {
    const k = K(t, 6.5, 7.35);
    set(o, lerp(HELM_X + 1.7, HELM_X + 1.35, k), lerp(HELM_Y + 0.75, HELM_Y + 0.5, k), lerp(SHIP.z + 1.9, SHIP.z + 1.45, k), HELM_X - 0.25, HELM_Y - 0.05, SHIP.z);
  },
  // 10 — over the captain's shoulder, along the deck to the three nodes
  (t, _f, o) => {
    const k = K(t, 7.2, 8.0);
    set(o, lerp(-7.6, -6.6, k), lerp(9.6, 9.2, k), lerp(-5.4, -6.2, k), SHIP.x + 1.5, 3.0, SHIP.z);
  },
  // 11 — (f) low from the quay edge, behind her quarter, as she pulls away with her wake (slow motion)
  (t, f, o) => {
    const k = K(t, 7.95, 8.7);
    set(o, lerp(-10.5, -9.5, k), lerp(2.7, 3.3, k), lerp(-4.5, -4.0, k), f.ship.x + 1, 1.8, f.ship.z);
  },
  // 12 — low chase-cam sweep behind the ship, then a crane-up into the wide shot
  (t, f, o) => {
    const k = K(t, 8.6, 9.8);
    const lift = k * k; // stays low first, then rises
    set(o, lerp(-9.5, -9, k) + 3 * Math.sin(Math.PI * k), lerp(3.3, 17, lift), lerp(-4.0, 31, k), lerp(f.ship.x + 1, 9, k), lerp(1.8, 1.5, k), lerp(f.ship.z, -11, k));
  },
  // 13 — settled hero framing
  (_t, _f, o) => {
    set(o, -9, 17, 31, 9, 1.5, -11);
  },
];

/** [start of blend into shot i, blend duration] — every change is an eased dolly, never a cut. */
const CUTS: [number, number][] = [
  [-99, 0],
  [0.62, 0.55],
  [1.38, 0.4],
  [2.3, 0.5],
  [3.42, 0.4],
  [3.9, 0.3],
  [4.32, 0.25],
  [4.68, 0.25],
  [5.12, 0.45],
  [6.45, 0.4],
  [7.3, 0.4],
  [7.85, 0.35],
  [8.62, 0.6],
  [9.4, 0.8],
];

const a: CamPose = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };
const b: CamPose = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 };

export function cameraAt(t: number, f: Frame, aspect: number, out: CamPose): CamPose {
  let i = 0;
  while (i + 1 < CUTS.length && t >= CUTS[i + 1]![0]) i++;
  SHOTS[i]!(t, f, a);
  const [start, dur] = CUTS[i]!;
  if (i > 0 && dur > 0 && t < start + dur) {
    SHOTS[i - 1]!(t, f, b);
    const k = smoother((t - start) / dur);
    out.px = lerp(b.px, a.px, k);
    out.py = lerp(b.py, a.py, k);
    out.pz = lerp(b.pz, a.pz, k);
    out.tx = lerp(b.tx, a.tx, k);
    out.ty = lerp(b.ty, a.ty, k);
    out.tz = lerp(b.tz, a.tz, k);
  } else {
    Object.assign(out, a);
  }
  // gentle hand-held drift
  out.px += 0.06 * Math.sin(t * 0.9);
  out.py += 0.04 * Math.sin(t * 1.3 + 1.1);
  return portrait(out, aspect);
}

export function finalCamera(f: Frame, aspect: number, out: CamPose): CamPose {
  SHOTS[SHOTS.length - 1]!(10, f, out);
  return portrait(out, aspect);
}

/** Pull the camera back along its view line on narrow (portrait) screens. */
function portrait(o: CamPose, aspect: number): CamPose {
  if (aspect >= 1.2) return o;
  const k = Math.min(1.9, Math.max(1, (1.2 / aspect) * 0.8));
  o.px = o.tx + (o.px - o.tx) * k;
  o.py = o.ty + (o.py - o.ty) * k;
  o.pz = o.tz + (o.pz - o.tz) * k;
  return o;
}

export const CAMERA_SHOT_COUNT = SHOTS.length;
