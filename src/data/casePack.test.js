import { describe, expect, it } from "vitest";
import { CASE_PACK, FICTIONAL_NOTE } from "./casePack";

const EXPECTED_IDS = ["c1", "c2", "c3", "o1", "o2", "o3"];

describe("casePack", () => {
  it("has exactly the six expected case ids", () => {
    expect(CASE_PACK.map((c) => c.id)).toEqual(EXPECTED_IDS);
  });

  it("every case has id, lane, title, usedFor, and non-empty text", () => {
    for (const c of CASE_PACK) {
      expect(typeof c.id).toBe("string");
      expect(c.id.length).toBeGreaterThan(0);
      expect(["clinical", "operational"]).toContain(c.lane);
      expect(typeof c.title).toBe("string");
      expect(c.title.length).toBeGreaterThan(0);
      expect(typeof c.usedFor).toBe("string");
      expect(c.usedFor.length).toBeGreaterThan(0);
      expect(typeof c.text).toBe("string");
      expect(c.text.trim().length).toBeGreaterThan(0);
    }
  });

  it("lanes match clinical (c*) / operational (o*) id prefixes", () => {
    for (const c of CASE_PACK) {
      const expectedLane = c.id.startsWith("c") ? "clinical" : "operational";
      expect(c.lane).toBe(expectedLane);
    }
  });

  it("exports the fictional-content note", () => {
    expect(FICTIONAL_NOTE).toMatch(/fictional/i);
    expect(FICTIONAL_NOTE.length).toBeGreaterThan(0);
  });
});
