// Keyframe tracks with eased segments: every key is a full stop (zero velocity), so
// motion always accelerates and brakes smoothly. Overlapping tracks on different
// channels produce natural arcs. Pure TS.

export type Key = readonly [time: number, value: number];
export type Track = readonly Key[];

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smoother = (v: number) => {
  const x = clamp01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** 0 → 1 over [a, b] with smootherstep. */
export const ramp = (t: number, a: number, b: number) => smoother((t - a) / (b - a));
/** 0 → 1 → 0 bump centred on c with half-width w. */
export const bump = (t: number, c: number, w: number) => {
  const d = Math.abs(t - c) / w;
  return d >= 1 ? 0 : smooth(1 - d);
};

export function sample(track: Track, t: number): number {
  const n = track.length;
  const first = track[0]!;
  const last = track[n - 1]!;
  if (t <= first[0]) return first[1];
  if (t >= last[0]) return last[1];
  for (let i = 0; i < n - 1; i++) {
    const [t0, v0] = track[i]!;
    const [t1, v1] = track[i + 1]!;
    if (t >= t0 && t <= t1) {
      if (t1 === t0) return v1;
      return lerp(v0, v1, smoother((t - t0) / (t1 - t0)));
    }
  }
  return last[1];
}
