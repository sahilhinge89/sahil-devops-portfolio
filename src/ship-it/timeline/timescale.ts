// Cinematic time-scale: the story's script clock runs at 1× except inside slow-motion
// windows, where it eases down to `rate` and back. Wall time ↔ script time are pure,
// monotonic functions, so captions, the simulation and the camera all share one scaled clock.
import { T_END } from "./layout";
import { smoother } from "./tracks";

export interface SlowMo {
  key: string;
  from: number; // script time
  to: number;
  rate: number; // slowest playback rate inside the window
}

/** Script-time windows for the key close-ups. */
export const SLOWMO: readonly SlowMo[] = [
  { key: "crate-into-container", from: 1.56, to: 2.3, rate: 0.45 },
  { key: "gates-flash", from: 2.78, to: 3.42, rate: 0.45 },
  { key: "twist-locks-engage", from: 4.04, to: 4.34, rate: 0.3 },
  { key: "touchdown-release", from: 4.82, to: 5.1, rate: 0.3 },
  { key: "helm", from: 6.72, to: 7.35, rate: 0.45 },
  { key: "pull-away", from: 8.0, to: 8.7, rate: 0.45 },
];

const EDGE = 0.1;
export const RATE_MIN = 0.25;

/** 0 outside, eases to 1 inside window w. */
function plateau(t: number, w: SlowMo) {
  if (t <= w.from || t >= w.to) return 0;
  return smoother((t - w.from) / EDGE) * smoother((w.to - t) / EDGE);
}

/** Playback rate (script seconds per wall second) at script time t. Never below RATE_MIN. */
export function rateAt(t: number): number {
  let r = 1;
  for (const w of SLOWMO) {
    const k = plateau(t, w);
    if (k > 0) r = Math.min(r, 1 - (1 - w.rate) * k);
  }
  return Math.max(RATE_MIN, r);
}

/** How "close-up" the moment is (0 = normal, 1 = deepest slow motion). Drives depth of field. */
export function closeupAt(t: number): number {
  let c = 0;
  for (const w of SLOWMO) c = Math.max(c, plateau(t, w));
  return c;
}

// Precomputed integral W(t) = ∫ 1/rate. Built lazily (no work at module scope).
const STEP = 0.002;
const T_MAX = T_END + 0.5;
let table: Float64Array | null = null;
function getTable() {
  if (table) return table;
  const n = Math.ceil(T_MAX / STEP) + 1;
  const w = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const tm = (i - 0.5) * STEP;
    w[i] = w[i - 1]! + STEP / rateAt(tm);
  }
  table = w;
  return w;
}

/** Wall seconds from story start until script time t (identity outside the table range). */
export function wallFromScript(t: number): number {
  if (t <= 0) return t;
  const w = getTable();
  const last = w.length - 1;
  const f = t / STEP;
  if (f >= last) return w[last]! + (t - last * STEP);
  const i = Math.floor(f);
  return w[i]! + (w[i + 1]! - w[i]!) * (f - i);
}

/** Script time reached after `wall` seconds of story playback. Inverse of wallFromScript. */
export function scriptFromWall(wall: number): number {
  if (wall <= 0) return wall;
  const w = getTable();
  const last = w.length - 1;
  if (wall >= w[last]!) return last * STEP + (wall - w[last]!);
  let lo = 0;
  let hi = last;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (w[mid]! <= wall) lo = mid;
    else hi = mid;
  }
  const span = w[hi]! - w[lo]!;
  return (lo + (span > 0 ? (wall - w[lo]!) / span : 0)) * STEP;
}
