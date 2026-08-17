import { describe, expect, it } from "vitest";
import { LABS } from "./labs";
import { MODELS, MODEL_IDS } from "./models";

describe("labs", () => {
  it("has all five sections plus intro", () => {
    expect(Object.keys(LABS)).toEqual(
      expect.arrayContaining(["intro", "lab1", "lab2", "lab3", "lab4", "wrapUp"])
    );
  });

  it("lab1 has 4 task options and 4 techniques", () => {
    expect(LABS.lab1.taskOptions).toHaveLength(4);
    expect(LABS.lab1.techniques).toHaveLength(4);
  });

  it("lab1 task options include 2 clinical and 2 operational", () => {
    const lanes = LABS.lab1.taskOptions.map((t) => t.lane);
    expect(lanes.filter((l) => l === "clinical")).toHaveLength(2);
    expect(lanes.filter((l) => l === "operational")).toHaveLength(2);
  });

  it("lab1 comparison reflection is marked graded", () => {
    expect(LABS.lab1.reflections.comparison.graded).toBe(true);
  });

  it("lab3 has 4 failure categories and a min-attempts rule", () => {
    expect(LABS.lab3.failureCategories).toHaveLength(4);
    expect(LABS.lab3.minAttempts).toBe(2);
    expect(LABS.lab3.minDistinctCategories).toBe(2);
  });

  it("intro has the required PHI warning", () => {
    expect(LABS.intro.phiWarning).toMatch(/PHI/);
  });
});

describe("models", () => {
  it("has exactly 4 entries with all fields", () => {
    expect(MODELS).toHaveLength(4);
    for (const m of MODELS) {
      expect(typeof m.id).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.label).toBe("string");
      expect(m.label.length).toBeGreaterThan(0);
      expect(typeof m.openrouterId).toBe("string");
      expect(m.openrouterId.length).toBeGreaterThan(0);
    }
  });

  it("MODEL_IDS matches the openrouterId of each model", () => {
    expect(MODEL_IDS).toEqual(MODELS.map((m) => m.openrouterId));
  });
});
