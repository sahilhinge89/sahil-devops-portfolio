// Per-frame material animation for small detail parts (lock indicators, lights, bow foam,
// mooring ropes, radar). Called once per frame by the Stepper after every pose.
// Pure function of the script frame + time; allocation-free.
import * as THREE from "three";
import type { Kit } from "../models/kit";
import type { Frame } from "../timeline/script";
import type { Registry } from "./registry";

const LOCK_OPEN = new THREE.Color("#e2574c");
const LOCK_SHUT = new THREE.Color("#3fd38a");

/** Mooring lines are cast off before the helm turn ends; the ship leaves at T_DEPART (8.0). */
export const ROPE_IN: readonly [number, number] = [0.75, 0.95];
export const ROPE_OFF: readonly [number, number] = [7.35, 7.75];

function ramp(t: number, a: number, b: number) {
  return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a);
}

export function ropeOpacity(t: number) {
  return ramp(t, ROPE_IN[0], ROPE_IN[1]) * (1 - ramp(t, ROPE_OFF[0], ROPE_OFF[1]));
}

export function animateDetails(kit: Kit, reg: Registry, f: Frame, t: number): void {
  // Spreader indicator lamps: red while open, green once the twist-locks are closed.
  kit.lockLamp.emissive.copy(LOCK_OPEN).lerp(LOCK_SHUT, f.lock);
  kit.lockLamp.color.copy(kit.lockLamp.emissive).multiplyScalar(0.7);

  // Forklift amber beacon blinks only while the forklift is moving / lifting.
  const forkBusy = f.forkX > -33.0 && t < 2.6 ? 1 : 0;
  kit.fx.amber.emissiveIntensity = forkBusy * (Math.sin(t * 9) > 0 ? 1.6 : 0.25);

  // Navigation lights pulse gently once sailing.
  const nav = 1.2 + 0.6 * f.sailing * (0.5 + 0.5 * Math.sin(t * 2.4));
  kit.fx.navRed.emissiveIntensity = nav;
  kit.fx.navGreen.emissiveIntensity = nav;

  // Bow foam builds up with speed.
  kit.fx.bowFoam.opacity = 0.55 * f.sailing * (0.85 + 0.15 * Math.sin(t * 5.3));

  // Mooring ropes: fade in after the quay rises, cast off before departure.
  const ro = ropeOpacity(t);
  kit.fx.rope.opacity = ro;
  if (reg.ropes) {
    reg.ropes.visible = ro > 0.01;
    reg.ropes.position.y = f.landY;
  }

  // Radar scanner sweeps continuously.
  if (reg.radar) reg.radar.rotation.y = t * 2.2;
}
