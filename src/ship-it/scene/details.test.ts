import { describe, expect, it } from "vitest";
import { ropeOpacity, ROPE_OFF } from "./details";
import { SLOT_SCHEDULED, T_DEPART } from "../timeline/script";

describe("mooring ropes", () => {
  it("hold the ship for the whole loading sequence", () => {
    for (const t of [1, ...SLOT_SCHEDULED, 7.0]) expect(ropeOpacity(t)).toBe(1);
  });
  it("are fully cast off before the ship departs", () => {
    expect(ROPE_OFF[1]).toBeLessThan(T_DEPART);
    expect(ropeOpacity(T_DEPART)).toBe(0);
  });
});
