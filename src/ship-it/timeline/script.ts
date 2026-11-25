// The master script: every actor's motion as a function of ONE clock t (seconds).
// Pure TS. Rendering reads `evalFrame`; cargo ownership changes come from EVENTS.

import {
  CONTAINER,
  CRANE,
  FORKLIFT,
  GATES_X,
  H_GROUND_TOP,
  H_SLOT_TOP,
  H_TRUCK_TOP,
  SHIP,
  SHIP_PATH,
  STAGED,
  TRUCK,
  T_END,
  T_HERO,
} from "./layout";
import { bump, clamp01, ramp, sample, smoother, type Track } from "./tracks";
import type { ItemId, OwnerRef } from "../state/ownership";

const [S1, S2, S3] = SHIP.slotX;

export const TRACKS = {
  forkX: [
    [0.8, FORKLIFT.start],
    [1.0, FORKLIFT.inserted],
    [1.18, FORKLIFT.inserted],
    [1.64, FORKLIFT.atContainer],
    [1.8, FORKLIFT.atContainer],
    [2.12, FORKLIFT.parked],
  ],
  forkH: [
    [1.0, 0],
    [1.18, FORKLIFT.carryH],
    [1.64, FORKLIFT.carryH],
    [1.74, FORKLIFT.releaseH],
    [1.8, FORKLIFT.clearH],
    [2.12, FORKLIFT.clearH],
    [2.4, 0.05],
  ],
  doors: [
    [0.8, 0],
    [1.12, 1],
    [1.98, 1],
    [2.3, 0],
  ],
  truckX: [
    [2.4, TRUCK.x0],
    [3.75, TRUCK.xPick],
    [4.5, TRUCK.xPick],
    [6.6, TRUCK.xExit],
  ],
  gx: [
    [5.08, S1],
    [5.32, S2],
    [6.08, S2],
    [6.3, S3],
  ],
  tz: [
    [3.8, CRANE.restTz],
    [3.98, -3.5],
    [4.3, -3.5],
    [4.72, SHIP.z],
    [5.06, SHIP.z],
    [5.34, STAGED[0].z],
    [5.6, STAGED[0].z],
    [5.86, SHIP.z],
    [6.06, SHIP.z],
    [6.32, STAGED[1].z],
    [6.54, STAGED[1].z],
    [6.78, SHIP.z],
    [7.06, SHIP.z],
    [7.4, CRANE.restTz],
  ],
  h: [
    [3.94, CRANE.highH],
    [4.16, H_TRUCK_TOP],
    [4.24, H_TRUCK_TOP],
    [4.46, CRANE.carryH],
    [4.62, CRANE.carryH],
    [4.92, H_SLOT_TOP],
    [5.0, H_SLOT_TOP],
    [5.14, CRANE.carryH],
    [5.32, CRANE.carryH],
    [5.48, H_GROUND_TOP],
    [5.54, H_GROUND_TOP],
    [5.7, CRANE.carryH],
    [5.8, CRANE.carryH],
    [5.98, H_SLOT_TOP],
    [6.04, H_SLOT_TOP],
    [6.16, CRANE.carryH],
    [6.3, CRANE.carryH],
    [6.44, H_GROUND_TOP],
    [6.5, H_GROUND_TOP],
    [6.64, CRANE.carryH],
    [6.72, CRANE.carryH],
    [6.88, H_SLOT_TOP],
    [6.94, H_SLOT_TOP],
    [7.1, CRANE.highH],
  ],
  lock: [
    [4.16, 0],
    [4.24, 1],
    [4.92, 1],
    [5.0, 0],
    [5.48, 0],
    [5.54, 1],
    [5.98, 1],
    [6.04, 0],
    [6.44, 0],
    [6.5, 1],
    [6.88, 1],
    [6.94, 0],
  ],
  helm: [
    [6.7, 0],
    [7.9, Math.PI * 1.5],
  ],
} satisfies Record<string, Track>;

export interface CargoEvent {
  t: number;
  item: ItemId;
  to: OwnerRef;
}

// Ownership changes, in time order. Each fires at the instant the new owner physically holds the item.
export const EVENTS: CargoEvent[] = [
  { t: 1.0, item: "crate", to: { kind: "forklift" } },
  { t: 1.74, item: "crate", to: { kind: "container", id: "c1" } },
  { t: 4.24, item: "c1", to: { kind: "crane" } },
  { t: 5.0, item: "c1", to: { kind: "ship", slot: 0 } },
  { t: 5.54, item: "c2", to: { kind: "crane" } },
  { t: 6.04, item: "c2", to: { kind: "ship", slot: 1 } },
  { t: 6.5, item: "c3", to: { kind: "crane" } },
  { t: 6.94, item: "c3", to: { kind: "ship", slot: 2 } },
];

export const SLOT_SCHEDULED = [4.3, 5.6, 6.56] as const;
export const T_DEPART = 8.0;

export interface CaptionCue {
  key: CaptionKey;
  from: number;
  to: number;
}
export type CaptionKey =
  | "terraform"
  | "docker"
  | "actions"
  | "argocd"
  | "rollout"
  | "running"
  | "monitoring"
  | "shipped";

export const CAPTION_CUES: CaptionCue[] = [
  { key: "terraform", from: 0.1, to: 0.78 },
  { key: "docker", from: 0.85, to: 2.35 },
  { key: "actions", from: 2.45, to: 3.75 },
  { key: "argocd", from: 3.85, to: 6.55 },
  { key: "rollout", from: 6.62, to: 7.24 },
  { key: "running", from: 7.3, to: 7.95 },
  { key: "monitoring", from: 8.02, to: 8.7 },
  { key: "shipped", from: 8.76, to: 9.4 },
];

export function captionAt(t: number): number {
  for (let i = 0; i < CAPTION_CUES.length; i++) {
    const c = CAPTION_CUES[i]!;
    if (t >= c.from && t < c.to) return i;
  }
  return -1;
}

type P2 = { x: number; z: number };
// ── Ship departure ────────────────────────────────────────────────────────────
function bez(p0: number, p1: number, p2: number, p3: number, s: number) {
  const u = 1 - s;
  return u * u * u * p0 + 3 * u * u * s * p1 + 3 * u * s * s * p2 + s * s * s * p3;
}
function bezD(p0: number, p1: number, p2: number, p3: number, s: number) {
  const u = 1 - s;
  return 3 * u * u * (p1 - p0) + 6 * u * s * (p2 - p1) + 3 * s * s * (p3 - p2);
}
export function shipProgress(t: number) {
  return smoother((t - T_DEPART) / (T_END - T_DEPART));
}
/** Ship pose on its departure path at progress s ∈ [0,1]. yaw: rotation about +y (0 = bow towards +x). */
export function shipPathPose(s: number, out: { x: number; z: number; yaw: number }) {
  const [a, b, c, d] = SHIP_PATH as unknown as [P2, P2, P2, P2];
  out.x = bez(a.x, b.x, c.x, d.x, s);
  out.z = bez(a.z, b.z, c.z, d.z, s);
  const dx = bezD(a.x, b.x, c.x, d.x, s);
  const dz = bezD(a.z, b.z, c.z, d.z, s);
  // heading (cos yaw, -sin yaw) in xz → yaw = atan2(-dz, dx)
  out.yaw = Math.atan2(-dz, dx);
  return out;
}

// ── Frame ─────────────────────────────────────────────────────────────────────
export interface Frame {
  t: number;
  landY: number;
  shipRiseY: number;
  grid: number;
  forkX: number;
  forkH: number;
  forkWheel: number;
  doors: number;
  crateGlow: number;
  tag: number;
  stamp: number;
  truckX: number;
  truckWheel: number;
  gateFlash: [number, number, number];
  gatePassed: [number, number, number];
  gx: number;
  tz: number;
  h: number;
  lock: number;
  slotLit: [number, number, number];
  slotPulse: number;
  helm: number;
  beacon: number;
  ship: { x: number; y: number; z: number; yaw: number; roll: number; pitch: number };
  sailing: number;
  hero: number;
}

export function createFrame(): Frame {
  return {
    t: 0,
    landY: 0,
    shipRiseY: 0,
    grid: 0,
    forkX: FORKLIFT.start,
    forkH: 0,
    forkWheel: 0,
    doors: 0,
    crateGlow: 0,
    tag: 0,
    stamp: 0,
    truckX: TRUCK.x0,
    truckWheel: 0,
    gateFlash: [0, 0, 0],
    gatePassed: [0, 0, 0],
    gx: S1,
    tz: CRANE.restTz,
    h: CRANE.highH,
    lock: 0,
    slotLit: [0, 0, 0],
    slotPulse: 0,
    helm: 0,
    beacon: 0,
    ship: { x: SHIP.x, y: 0, z: SHIP.z, yaw: 0, roll: 0, pitch: 0 },
    sailing: 0,
    hero: 0,
  };
}

const RISE_DEPTH = 4.6;

/** Fill `f` with every actor's state at master time `t`. Allocation-free. */
export function evalFrame(t: number, f: Frame): Frame {
  const tc = Math.min(t, T_END);
  f.t = t;
  f.landY = -RISE_DEPTH * (1 - ramp(tc, 0, 0.72));
  f.shipRiseY = -RISE_DEPTH * (1 - ramp(tc, 0.1, 0.8));
  f.grid = bump(tc, 0.45, 0.6);

  f.forkX = sample(TRACKS.forkX, tc);
  f.forkH = sample(TRACKS.forkH, tc);
  f.forkWheel = (f.forkX - FORKLIFT.start) / 0.22;
  f.doors = sample(TRACKS.doors, tc);
  f.crateGlow = 0.55 + 0.45 * ramp(tc, 0.8, 1.2);
  f.tag = ramp(tc, 2.2, 2.4);

  f.truckX = sample(TRACKS.truckX, tc);
  f.truckWheel = (f.truckX - TRUCK.x0) / TRUCK.wheelR;
  for (let i = 0; i < 3; i++) {
    const d = f.truckX - GATES_X[i as 0 | 1 | 2];
    f.gateFlash[i] = bump(d, 0, 2.2);
    f.gatePassed[i] = clamp01(d / 1.2);
  }
  f.stamp = clamp01((f.truckX - (GATES_X[2] + 1.5)) / 1.5);

  f.gx = sample(TRACKS.gx, tc);
  f.tz = sample(TRACKS.tz, tc);
  f.h = sample(TRACKS.h, tc);
  f.lock = sample(TRACKS.lock, tc);
  for (const i of [0, 1, 2] as const) f.slotLit[i] = ramp(tc, SLOT_SCHEDULED[i], SLOT_SCHEDULED[i] + 0.2);
  f.slotPulse = tc >= 7.25 ? 0.5 + 0.5 * Math.sin((tc - 7.25) * 14 - Math.PI / 2) : 0;

  f.helm = sample(TRACKS.helm, tc);
  f.beacon = ramp(tc, 8.0, 8.25);

  const s = shipProgress(tc);
  shipPathPose(s, f.ship);
  f.sailing = ramp(tc, T_DEPART, T_DEPART + 0.6);
  // Bobbing: none while loading, eases in on departure and keeps going after the script ends.
  const amp = f.sailing;
  f.ship.y = f.shipRiseY + amp * Math.sin(t * 1.7) * 0.07;
  f.ship.roll = amp * Math.sin(t * 1.15 + 0.6) * 0.022;
  f.ship.pitch = amp * Math.sin(t * 0.9 + 1.3) * 0.012;

  f.hero = ramp(tc, T_HERO, T_END);
  return f;
}

export const CONTAINER_HALF_H = CONTAINER.H / 2;
