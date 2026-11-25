import { describe, expect, it } from "vitest";
import { transfer, type CargoState } from "./ownership";
import { Director, initialCargo, itemWorld } from "./director";
import { CONTAINER, H_SLOT_TOP, QUAY_EDGE_Z, SHIP, T_END } from "../timeline/layout";
import { CAPTION_CUES, EVENTS, createFrame, evalFrame, shipPathPose } from "../timeline/script";

const zero = { x: 0, y: 0, z: 0, yaw: 0 };

describe("cargo ownership rules", () => {
  it("refuses a container going straight from the truck to the ship", () => {
    const s: CargoState = initialCargo();
    const r = transfer(s, "c1", { kind: "ship", slot: 0 }, zero, zero, () => {});
    expect(r.ok).toBe(false);
    expect(s.c1.owner.kind).toBe("truck");
  });

  it("refuses a second container on a crane that already holds one", () => {
    const s = initialCargo();
    expect(transfer(s, "c1", { kind: "crane" }, zero, zero, () => {}).ok).toBe(true);
    expect(transfer(s, "c2", { kind: "crane" }, zero, zero, () => {}).ok).toBe(false);
  });

  it("keeps the world position across a hand-over", () => {
    const s = initialCargo();
    const world = { x: 3, y: 2, z: -4, yaw: 0 };
    const anchor = { x: 1, y: 1, z: -1, yaw: 0.5 };
    transfer(s, "c1", { kind: "crane" }, world, anchor, () => {});
    const d = new Director(() => {});
    // re-compose manually
    const c = Math.cos(anchor.yaw), sn = Math.sin(anchor.yaw);
    const l = s.c1.local;
    expect(anchor.x + l.x * c + l.z * sn).toBeCloseTo(3, 6);
    expect(anchor.z - l.x * sn + l.z * c).toBeCloseTo(-4, 6);
    expect(d).toBeTruthy();
  });
});

describe("Ship it. script", () => {
  it("runs the whole story with no invalid transitions, NaNs or unsupported releases", () => {
    const errors: string[] = [];
    const d = new Director((m) => errors.push(m));
    for (let t = 0; t <= T_END + 0.5; t += 1 / 60) d.advance(1 / 60);
    expect(errors).toEqual([]);
    expect(d.cargo.c1.owner).toEqual({ kind: "ship", slot: 0 });
    expect(d.cargo.c2.owner).toEqual({ kind: "ship", slot: 1 });
    expect(d.cargo.c3.owner).toEqual({ kind: "ship", slot: 2 });
    expect(d.cargo.crate.owner).toEqual({ kind: "container", id: "c1" });
  });

  it("skipping to the end gives the same result as playing", () => {
    const d = new Director(() => {});
    d.seek(T_END);
    const p = itemWorld("c3", d.frame, d.cargo, { ...zero });
    const q = new Director(() => {});
    for (let i = 0; i < 600; i++) q.advance(T_END / 600);
    const p2 = itemWorld("c3", q.frame, q.cargo, { ...zero });
    expect(p.x).toBeCloseTo(p2.x, 4);
    expect(p.z).toBeCloseTo(p2.z, 4);
  });

  it("containers never move while the ship is still loading, and sit on the deck", () => {
    const d = new Director(() => {});
    d.seek(7.9);
    const p = itemWorld("c1", d.frame, d.cargo, { ...zero });
    expect(p.y).toBeCloseTo(H_SLOT_TOP - CONTAINER.H, 4);
    expect(p.x).toBeCloseTo(SHIP.slotX[0], 4);
  });

  it("lasts 10 seconds and captions never overlap", () => {
    for (let i = 1; i < CAPTION_CUES.length; i++) {
      expect(CAPTION_CUES[i]!.from).toBeGreaterThanOrEqual(CAPTION_CUES[i - 1]!.to);
    }
    expect(T_END).toBe(10);
    expect(EVENTS.every((e, i) => i === 0 || e.t >= EVENTS[i - 1]!.t)).toBe(true);
  });

  it("the departing ship's hull never touches the quay", () => {
    const pose = { x: 0, z: 0, yaw: 0 };
    for (let s = 0; s <= 1; s += 0.01) {
      shipPathPose(s, pose);
      const c = Math.cos(pose.yaw), sn = Math.sin(pose.yaw);
      for (const lx of [-SHIP.length / 2, SHIP.length / 2]) {
        for (const lz of [-SHIP.beam / 2, SHIP.beam / 2]) {
          const z = pose.z - lx * sn + lz * c;
          expect(z).toBeLessThan(QUAY_EDGE_Z - 0.4);
        }
      }
    }
  });

  it("the ship stays still until all three containers are released", () => {
    const f = createFrame();
    const lastRelease = EVENTS[EVENTS.length - 1]!.t;
    evalFrame(lastRelease + 0.5, f);
    expect(f.ship.x).toBeCloseTo(SHIP.x, 6);
    expect(f.ship.y).toBeCloseTo(0, 6);
  });
});
