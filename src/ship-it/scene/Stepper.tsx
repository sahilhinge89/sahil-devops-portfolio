// The ONE per-frame 3D writer: reads the master clock (owned by the stage), syncs the
// Director to the matching script time, then poses every actor, cargo item and the scripted
// camera, in that order. Allocation-free per frame.
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { Director } from "../state/director";
import type { Registry } from "./registry";
import type { Kit } from "../models/kit";
import { easing } from "maath";
import { cameraAt, type CamPose } from "../timeline/camera";
import { shipPathPose, shipProgress, T_DEPART } from "../timeline/script";
import { storyTime } from "../timeline/opening";
import type { MasterClock } from "../state/clock";
import { animateDetails } from "./details";
import { CRANE, DECK_Y, GROUND_Y, ROAD_Z, SHIP, T_END } from "../timeline/layout";
import type { ItemId, OwnerRef } from "../state/ownership";
import { ITEMS } from "../state/director";

export interface StepperControl {
  scripted: boolean; // camera follows the script
  camTarget: THREE.Vector3; // last scripted look-at (handed to OrbitControls)
  wakeCount: number;
}

const WAKE_SAMPLES = 32;

export function Stepper({
  director,
  clock,
  reg,
  kit,
  ctl,
}: {
  director: Director;
  clock: MasterClock;
  reg: Registry;
  kit: Kit;
  ctl: StepperControl;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const tmp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      a: new THREE.Matrix4(),
      ship: new THREE.Matrix4(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(0, 0, 0, "YXZ"),
      v: new THREE.Vector3(),
      one: new THREE.Vector3(1, 1, 1),
      mats: Object.fromEntries(ITEMS.map((id) => [id, new THREE.Matrix4()])) as Record<ItemId, THREE.Matrix4>,
      cam: { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0 } as CamPose,
      path: { x: 0, z: 0, yaw: 0 },
      wakeM: new THREE.Matrix4(),
      teal: new THREE.Color("#2a9d8f"),
      green: new THREE.Color("#6cc58f"),
    }),
    [],
  );

  useFrame((_s, delta) => {
    const st = storyTime(clock.T); // negative during the globe pre-roll
    if (Math.max(0, st) !== director.t) director.seek(Math.max(0, st));
    const f = director.frame;
    const t = director.t;

    // ── environment ──
    kit.waterUniforms.uTime.value = t;
    kit.gridUniforms.uOpacity.value = f.grid;
    if (reg.grid) reg.grid.visible = f.grid > 0.001;
    if (reg.land) reg.land.position.y = f.landY;

    // ── forklift ──
    if (reg.forklift) reg.forklift.position.set(f.forkX, f.landY, ROAD_Z);
    if (reg.forkCarriage) reg.forkCarriage.position.y = GROUND_Y + f.forkH;
    for (const w of reg.forkWheels) w.rotation.z = -f.forkWheel;

    // ── truck + gates ──
    if (reg.truck) reg.truck.position.set(f.truckX, f.landY, ROAD_Z);
    for (const w of reg.truckWheels) w.rotation.z = -f.truckWheel;
    for (let i = 0; i < 3; i++) {
      kit.gateLights[i as 0 | 1 | 2].emissiveIntensity = 0.55 * f.gatePassed[i]! + 1.3 * f.gateFlash[i]!;
    }
    const open = f.doors * DOOR_OPEN;
    if (reg.doors[0]) reg.doors[0].rotation.y = open;
    if (reg.doors[1]) reg.doors[1].rotation.y = -open;
    kit.lm.tag.opacity = f.tag;
    kit.lm.stamp.opacity = f.stamp;
    kit.m.crate.emissiveIntensity = 0.5 + 0.6 * f.crateGlow;

    // ── crane ──
    if (reg.gantry) reg.gantry.position.set(f.gx, f.landY, 0);
    if (reg.trolley) reg.trolley.position.z = f.tz;
    if (reg.spreader) reg.spreader.position.set(0, f.h, f.tz);
    for (const l of reg.locks) l.rotation.y = f.lock * (Math.PI / 2);
    kit.lockMat.emissiveIntensity = f.lock * 0.9;
    const top = CRANE.boomY - 0.08;
    const bottom = f.h + 0.58;
    const len = Math.max(0.01, top - bottom);
    for (const c of reg.cables) {
      c.position.set(c.userData["dx"] as number, bottom + len / 2, f.tz + (c.userData["dz"] as number));
      c.scale.y = len;
    }

    // ── ship ──
    const s = f.ship;
    if (reg.shipRoot) {
      reg.shipRoot.position.set(s.x, s.y, s.z);
      reg.shipRoot.rotation.set(s.roll, s.yaw, s.pitch, "YXZ");
    }
    tmp.e.set(s.roll, s.yaw, s.pitch, "YXZ");
    tmp.q.setFromEuler(tmp.e);
    tmp.ship.compose(tmp.v.set(s.x, s.y, s.z), tmp.q, tmp.one);
    for (let i = 0; i < 3; i++) {
      const pad = kit.slotPads[i as 0 | 1 | 2];
      const lit = f.slotLit[i]!;
      pad.emissive.copy(f.slotPulse > 0 ? tmp.green : tmp.teal);
      pad.emissiveIntensity = lit * 0.6 + f.slotPulse * 1.2;
      kit.lm.node[i as 0 | 1 | 2].opacity = 0.5 + 0.5 * lit;
    }
    if (reg.helm) reg.helm.rotation.x = f.helm;
    if (reg.arms) reg.arms.rotation.x = Math.sin(f.helm) * 0.12;
    const blink = f.beacon * (0.75 + 0.25 * Math.sin(t * 3.2));
    kit.beacon.emissiveIntensity = blink * 2.2;
    if (reg.beaconLight) reg.beaconLight.intensity = blink * 6;
    kit.m.glow.opacity = blink * 0.9;

    // ── cargo: world matrix = owner anchor × local pose ──
    for (const id of ITEMS) {
      const h = director.cargo[id];
      anchorMatrix(h.owner, tmp.a);
      tmp.q.setFromAxisAngle(Y_AXIS, h.local.yaw);
      tmp.m.compose(tmp.v.set(h.local.x, h.local.y, h.local.z), tmp.q, tmp.one);
      const out = tmp.mats[id];
      out.multiplyMatrices(tmp.a, tmp.m);
      const g = reg.items[id];
      if (g) {
        g.matrix.copy(out);
        g.matrixWorldNeedsUpdate = true;
      }
    }

    function anchorMatrix(o: OwnerRef, target: THREE.Matrix4) {
      switch (o.kind) {
        case "ground":
          return target.makeTranslation(0, f.landY, 0);
        case "forklift":
          return target.makeTranslation(f.forkX, GROUND_Y + f.landY + f.forkH, ROAD_Z);
        case "truck":
          return target.makeTranslation(f.truckX, DECK_Y + f.landY, ROAD_Z);
        case "crane":
          return target.makeTranslation(f.gx, f.h + f.landY, f.tz);
        case "ship":
          return target.copy(tmp.ship).multiply(tmp.wakeM.makeTranslation(SHIP.slotX[o.slot], SHIP.deckTop, 0));
        case "container":
          return target.copy(tmp.mats[o.id]);
      }
    }

    // ── wake: foam born along the departure path, growing and sinking with age ──
    if (reg.wake) {
      const tc = Math.min(t, T_END + 4);
      let n = 0;
      for (let i = 0; i < WAKE_SAMPLES; i++) {
        const birth = T_DEPART + 0.15 + (i / WAKE_SAMPLES) * (T_END - T_DEPART);
        const age = tc - birth;
        if (age <= 0 || age > 3.2) continue;
        shipPathPose(shipProgress(birth), tmp.path);
        const c = Math.cos(tmp.path.yaw);
        const sn = Math.sin(tmp.path.yaw);
        const sx = tmp.path.x - (SHIP.length / 2) * c;
        const sz = tmp.path.z + (SHIP.length / 2) * sn;
        const life = 1 - age / 3.2;
        const spread = 0.5 + age * 1.3;
        for (const side of [-1, 1]) {
          // perpendicular to heading: (sin, cos)
          const px = sx + side * spread * sn;
          const pz = sz + side * spread * c;
          const sc = (0.45 + age * 0.8) * (0.35 + 0.65 * life);
          tmp.wakeM.makeRotationY(tmp.path.yaw);
          tmp.wakeM.scale(tmp.v.set(sc * 2.2, 1, sc * 0.8)).setPosition(px, 0.03 + 0.1 * life, pz);
          reg.wake.setMatrixAt(n++, tmp.wakeM);
        }
      }
      reg.wake.count = n;
      reg.wake.instanceMatrix.needsUpdate = true;
    }

    // ── scripted camera ──
    if (ctl.scripted) {
      cameraAt(Math.min(st, T_END), f, size.width / Math.max(1, size.height), tmp.cam);
      // Critically damped follow for silky motion; snap on seeks/skips (large jumps).
      const dt = Math.min(delta, 0.05);
      tmp.v.set(tmp.cam.px, tmp.cam.py, tmp.cam.pz);
      if (camera.position.distanceToSquared(tmp.v) > 400 || dt <= 0) {
        camera.position.copy(tmp.v);
        ctl.camTarget.set(tmp.cam.tx, tmp.cam.ty, tmp.cam.tz);
      } else {
        easing.damp3(camera.position, tmp.v, CAM_SMOOTH, dt);
        easing.damp3(ctl.camTarget, [tmp.cam.tx, tmp.cam.ty, tmp.cam.tz], CAM_SMOOTH, dt);
      }
      camera.lookAt(ctl.camTarget);
    }

    animateDetails(kit, reg, f, t);
  }, 0);

  return null;
}

/** Camera smoothing time (s): small enough to keep close-ups on cue. */
const CAM_SMOOTH = 0.12;
const Y_AXIS = new THREE.Vector3(0, 1, 0);
/** Container doors swing ~260° to lie flat against the side walls. */
const DOOR_OPEN = 4.68;
export const WAKE_COUNT = WAKE_SAMPLES * 2;
