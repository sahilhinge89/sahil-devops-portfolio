// The full opening on ONE wall clock T (seconds):
//   0.0–2.5  globe fades in on white, spins fast and eases out
//   2.5–4.0  settles on New York, other markers fade, NYC pulses ("New York · Port")
//   4.0–5.2  zoom into New York, cloud wipe into the 3D port
//   5.2–end  the port story (script time via the slow-motion time-scale), then the hero
// Pure TS: the stage writes DOM overlays from `openingFrame`, the 3D Stepper reads `storyTime`.
import { focusAngles } from "@/lib/globe-math";
import { T_END, T_HERO } from "./layout";
import { closeupAt, scriptFromWall, wallFromScript } from "./timescale";
import { clamp01, lerp, ramp } from "./tracks";

export const NYC = [40.7128, -74.006] as const;
const FOCUS = focusAngles(NYC);

export const T_STORY = 5.2; // wall time at which script time 0 plays
export const T_HERO_WALL = T_STORY + wallFromScript(T_HERO);
export const T_TOTAL = T_STORY + wallFromScript(T_END);
/** The 3D scene must be loaded by now; the clock holds here otherwise. */
export const T_NEED_SCENE = 3.9;
export const GLOBE_CAPTION = { from: 2.9, to: 4.2 } as const;
const SPIN = Math.PI * 6; // three fast turns before settling

/** Script time of the port story at wall time T (negative during the globe pre-roll). */
export function storyTime(T: number): number {
  return scriptFromWall(T - T_STORY);
}
/** Wall time at which the story reaches script time t. */
export function wallAtStory(t: number): number {
  return T_STORY + wallFromScript(t);
}

export interface OpeningFrame {
  globe: number; // globe layer opacity
  backdrop: number; // white backdrop behind the globe
  phi: number;
  theta: number;
  scale: number; // globe zoom multiplier
  others: number; // visibility of non-NYC markers, arcs and labels
  labels: number;
  pulse: number; // NYC pulse ring
  globeCaption: boolean;
  cloud: number; // cloud wipe opacity
  cloudGrow: number; // cloud wipe progress (blob scale)
  letterbox: number; // 0 hidden, 1 bars fully in
  dof: number; // close-up depth of field strength
  vignette: number;
  story: number; // 0 before the port is visible, 1 after the wipe
}

export function createOpeningFrame(): OpeningFrame {
  return {
    globe: 0,
    backdrop: 1,
    phi: 0,
    theta: 0,
    scale: 1,
    others: 1,
    labels: 0,
    pulse: 0,
    globeCaption: false,
    cloud: 0,
    cloudGrow: 0,
    letterbox: 0,
    dof: 0,
    vignette: 0,
    story: 0,
  };
}

const easeOutCubic = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const easeInCubic = (x: number) => Math.pow(clamp01(x), 3);

export function openingFrame(T: number, o: OpeningFrame): OpeningFrame {
  o.globe = ramp(T, 0.1, 0.9) * (1 - ramp(T, 4.55, 5.0));
  o.backdrop = 1 - ramp(T, 4.5, 4.8);
  o.phi = FOCUS.phi - SPIN * (1 - easeOutCubic(T / 3.9));
  o.theta = lerp(0.18, FOCUS.theta, ramp(T, 1.3, 3.8));
  o.scale = 1 + 5.5 * easeInCubic((T - 4.0) / 1.0);
  o.others = 1 - ramp(T, 2.6, 3.4);
  o.labels = ramp(T, 0.9, 1.5);
  o.pulse = ramp(T, 2.8, 3.1) * (1 - ramp(T, 4.05, 4.4));
  o.globeCaption = T >= GLOBE_CAPTION.from && T < GLOBE_CAPTION.to;
  o.cloud = ramp(T, 4.2, 4.7) * (1 - ramp(T, 4.85, 5.55));
  o.cloudGrow = ramp(T, 4.1, 5.6);
  o.story = ramp(T, 4.6, 4.9);
  o.letterbox = ramp(T, 4.9, 5.7) * (1 - ramp(T, T_HERO_WALL - 0.2, T_HERO_WALL + 0.6));
  const t = storyTime(T);
  o.dof = T >= T_STORY ? closeupAt(t) : 0;
  o.vignette = o.letterbox * (0.55 + 0.45 * o.dof);
  return o;
}
