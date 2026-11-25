// Director: owns the master clock and the cargo state, and applies ownership events in
// time order. Pure TS — the scene only reads from it.

import { CONTAINER, CRATE, DECK_Y, FORKLIFT, GROUND_Y, ROAD_Z, SHIP, STAGED, T_END } from "../timeline/layout";
import { EVENTS, createFrame, evalFrame, type CargoEvent, type Frame } from "../timeline/script";
import {
  composePose,
  isDev,
  poseIsFinite,
  transfer,
  type CargoState,
  type ItemId,
  type OwnerRef,
  type Pose,
} from "./ownership";

export const ITEMS: readonly ItemId[] = ["c1", "c2", "c3", "crate"];

export function initialCargo(): CargoState {
  return {
    crate: {
      owner: { kind: "ground" },
      local: { x: FORKLIFT.inserted + FORKLIFT.crateOnFork, y: GROUND_Y, z: ROAD_Z, yaw: 0 },
    },
    c1: { owner: { kind: "truck" }, local: { x: 0, y: 0, z: 0, yaw: 0 } },
    c2: { owner: { kind: "ground" }, local: { x: STAGED[0].x, y: GROUND_Y, z: STAGED[0].z, yaw: 0 } },
    c3: { owner: { kind: "ground" }, local: { x: STAGED[1].x, y: GROUND_Y, z: STAGED[1].z, yaw: 0 } },
  };
}

export function anchorPose(owner: OwnerRef, f: Frame, cargo: CargoState, out: Pose): Pose {
  switch (owner.kind) {
    case "ground":
      out.x = 0;
      out.y = f.landY;
      out.z = 0;
      out.yaw = 0;
      return out;
    case "forklift":
      out.x = f.forkX;
      out.y = GROUND_Y + f.landY + f.forkH;
      out.z = ROAD_Z;
      out.yaw = 0;
      return out;
    case "truck":
      out.x = f.truckX;
      out.y = DECK_Y + f.landY;
      out.z = ROAD_Z;
      out.yaw = 0;
      return out;
    case "crane":
      out.x = f.gx;
      out.y = f.h + f.landY;
      out.z = f.tz;
      out.yaw = 0;
      return out;
    case "ship": {
      const ship = { x: f.ship.x, y: f.ship.y, z: f.ship.z, yaw: f.ship.yaw };
      return composePose(ship, { x: SHIP.slotX[owner.slot], y: SHIP.deckTop, z: 0, yaw: 0 }, out);
    }
    case "container":
      return itemWorld(owner.id, f, cargo, out);
  }
}

export function itemWorld(id: ItemId, f: Frame, cargo: CargoState, out: Pose): Pose {
  const h = cargo[id];
  const a = anchorPose(h.owner, f, cargo, { x: 0, y: 0, z: 0, yaw: 0 });
  return composePose(a, h.local, out);
}

export type Logger = (msg: string) => void;
const devLog: Logger = (m) => {
  if (isDev()) console.warn(`[ship-it/cargo] ${m}`);
};

export class Director {
  t = 0;
  cargo: CargoState = initialCargo();
  private next = 0;
  private scratch = createFrame();
  readonly frame = createFrame();
  errors: string[] = [];

  constructor(private log: Logger = devLog) {}

  reset() {
    this.t = 0;
    this.cargo = initialCargo();
    this.next = 0;
    this.errors = [];
    evalFrame(0, this.frame);
  }

  /** Advance the master clock and apply every ownership event that is due. */
  advance(dt: number) {
    this.seek(this.t + dt);
  }

  seek(t: number) {
    if (t < this.t) this.reset();
    for (let ev = EVENTS[this.next]; ev && ev.t <= t; ev = EVENTS[this.next]) {
      this.apply(ev);
      this.next++;
    }
    this.t = t;
    evalFrame(t, this.frame);
    if (isDev()) this.checkFinite();
  }

  get finished() {
    return this.t >= T_END;
  }

  private report(msg: string) {
    this.errors.push(msg);
    this.log(msg);
  }

  private apply(ev: CargoEvent) {
    const f = evalFrame(ev.t, this.scratch);
    const world = itemWorld(ev.item, f, this.cargo, { x: 0, y: 0, z: 0, yaw: 0 });
    const anchor = anchorPose(ev.to, f, this.cargo, { x: 0, y: 0, z: 0, yaw: 0 });
    // Physical checks: the new owner must actually support / grip the item.
    if (ev.to.kind === "ship") {
      const gap = Math.abs(world.y - anchor.y) + Math.hypot(world.x - anchor.x, world.z - anchor.z);
      if (gap > 0.03) this.report(`${ev.item} released ${gap.toFixed(3)} away from slot ${ev.to.slot}`);
    }
    if (ev.to.kind === "crane" && f.lock < 0.999) this.report(`${ev.item} lifted before twist-locks closed`);
    if (ev.to.kind === "container") {
      const floor = anchor.y + CONTAINER.floor;
      if (Math.abs(world.y - floor) > 0.03) this.report(`${ev.item} not resting on container floor`);
      const inside = world.x - anchor.x;
      if (Math.abs(inside) + CRATE.size / 2 > CONTAINER.L / 2) this.report(`${ev.item} not inside container`);
    }
    const r = transfer(this.cargo, ev.item, ev.to, world, anchor, (m) => this.report(m));
    if (!r.ok) return;
  }

  private checkFinite() {
    const p = { x: 0, y: 0, z: 0, yaw: 0 };
    for (const id of ITEMS) {
      itemWorld(id, this.frame, this.cargo, p);
      if (!poseIsFinite(p)) this.report(`NaN world pose for ${id} at t=${this.t.toFixed(2)}`);
    }
  }
}
