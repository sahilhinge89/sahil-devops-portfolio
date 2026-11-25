import { describe, expect, it } from "vitest";
import { projectGlobe } from "@/lib/globe-math";
import { T_END, T_HERO } from "./layout";
import { NYC, T_STORY, T_TOTAL, createOpeningFrame, openingFrame, storyTime, wallAtStory } from "./opening";
import { RATE_MIN, SLOWMO, rateAt, scriptFromWall, wallFromScript } from "./timescale";
import { CAPTION_CUES } from "./script";

describe("opening timeline", () => {
  it("the whole opening (globe + port story) lasts under 20 seconds", () => {
    expect(T_TOTAL).toBeLessThan(20);
    expect(T_TOTAL).toBeGreaterThan(15);
  });

  it("the port story starts at 5.2 s", () => {
    expect(T_STORY).toBe(5.2);
    expect(storyTime(T_STORY)).toBeCloseTo(0, 6);
  });

  it("slow motion eases to 0.25–0.45× inside each close-up and is 1× between them", () => {
    for (const w of SLOWMO) {
      const mid = (w.from + w.to) / 2;
      expect(rateAt(mid)).toBeCloseTo(w.rate, 2);
      expect(rateAt(mid)).toBeGreaterThanOrEqual(RATE_MIN);
      expect(rateAt(mid)).toBeLessThanOrEqual(0.45);
    }
    expect(rateAt(0.5)).toBe(1);
    expect(rateAt(6.0)).toBe(1);
  });

  it("the rate never jumps: no hard change between neighbouring instants", () => {
    for (let t = 0; t < T_END; t += 0.001) {
      expect(Math.abs(rateAt(t + 0.001) - rateAt(t))).toBeLessThan(0.03);
    }
  });

  it("wall ↔ script time are inverse and monotonic", () => {
    let prev = -1;
    for (let t = 0; t <= T_END + 1; t += 0.05) {
      const w = wallFromScript(t);
      expect(w).toBeGreaterThan(prev);
      prev = w;
      expect(scriptFromWall(w)).toBeCloseTo(t, 3);
    }
  });

  it("captions keep their order and never overlap in wall time", () => {
    for (let i = 1; i < CAPTION_CUES.length; i++) {
      expect(wallAtStory(CAPTION_CUES[i]!.from)).toBeGreaterThanOrEqual(wallAtStory(CAPTION_CUES[i - 1]!.to));
    }
    expect(wallAtStory(T_HERO)).toBeLessThan(T_TOTAL);
  });

  it("the globe ends its spin with New York dead centre", () => {
    const f = openingFrame(3.95, createOpeningFrame());
    const p = projectGlobe(NYC, f.phi, f.theta, 1);
    expect(p.x).toBeCloseTo(0.5, 3);
    expect(p.y).toBeCloseTo(0.5, 3);
    expect(p.depth).toBeGreaterThan(0.79);
  });

  it("the globe spins fast at the start and has stopped before the zoom", () => {
    const a = openingFrame(0.2, createOpeningFrame()).phi;
    const b = openingFrame(0.3, createOpeningFrame()).phi;
    expect((b - a) / 0.1).toBeGreaterThan(10); // rad/s
    const c = openingFrame(3.9, createOpeningFrame()).phi;
    const d = openingFrame(4.4, createOpeningFrame()).phi;
    expect(d).toBeCloseTo(c, 6);
  });

  it("letterbox bars are in during the story and gone by the end", () => {
    expect(openingFrame(T_STORY + 3, createOpeningFrame()).letterbox).toBeCloseTo(1, 3);
    expect(openingFrame(T_TOTAL + 0.5, createOpeningFrame()).letterbox).toBe(0);
    expect(openingFrame(1, createOpeningFrame()).letterbox).toBe(0);
  });
});
