import { describe, expect, it } from "vitest";
import {
  clampRequiredTarget,
  getExercise,
  isRequiredAllowed,
  NEW_RULE_EXERCISE_ID,
  REQUIRED_EXERCISE_IDS,
  requiredBreakPlan,
  requiredDefaultTarget,
  requiredTargetBounds,
  voluntaryTarget,
} from "./exercises";

const EXPECTED: Record<string, [number, number, "reps" | "time"]> = {
  "kliky-o-zed": [12, 20, "reps"],
  drepy: [15, 20, "reps"],
  vypony: [20, 25, "reps"],
  "beh-na-miste": [45, 60, "time"],
  "protazeni-zad": [30, 45, "time"],
  "protazeni-ramen": [30, 60, "time"],
  "protazeni-nohou": [30, 45, "time"],
  "protazeni-krku": [30, 40, "time"],
  protazeni: [60, 90, "time"],
};

describe("required breaks", () => {
  it("allows exactly the 9 safe exercises", () => {
    expect([...REQUIRED_EXERCISE_IDS].sort()).toEqual(Object.keys(EXPECTED).sort());
    expect(isRequiredAllowed("kliky")).toBe(false);
    expect(isRequiredAllowed("burpees")).toBe(false);
    expect(isRequiredAllowed("plank")).toBe(false);
  });

  it("has the right defaults, maxima and units", () => {
    for (const [id, [def, max, kind]] of Object.entries(EXPECTED)) {
      const eid = id as (typeof REQUIRED_EXERCISE_IDS)[number];
      expect(requiredDefaultTarget(eid)).toBe(def);
      expect(requiredTargetBounds(eid).max).toBe(max);
      expect(getExercise(eid).kind).toBe(kind);
      expect(clampRequiredTarget(eid, 999)).toBe(max);
    }
  });

  it("new rules default to 15 squats", () => {
    expect(NEW_RULE_EXERCISE_ID).toBe("drepy");
    expect(requiredDefaultTarget(NEW_RULE_EXERCISE_ID)).toBe(15);
  });

  it("uses the rule's own target, capped at the maximum", () => {
    expect(requiredBreakPlan({ exerciseId: "drepy", exerciseTarget: 8 })).toEqual({ exerciseId: "drepy", target: 8, replaced: false });
    expect(requiredBreakPlan({ exerciseId: "drepy", exerciseTarget: 50 }).target).toBe(20);
  });

  it("legacy rule falls back to 60 s full stretch without changing the rule", () => {
    const rule = { exerciseId: "kliky", exerciseTarget: 10 };
    expect(requiredBreakPlan(rule)).toEqual({ exerciseId: "protazeni", target: 60, replaced: true });
    expect(rule).toEqual({ exerciseId: "kliky", exerciseTarget: 10 });
  });

  it("voluntary breaks use the saved default, separate from rule targets", () => {
    const squat = getExercise("drepy");
    expect(voluntaryTarget(squat, {})).toBe(15);
    expect(voluntaryTarget(squat, { drepy: 30 })).toBe(30);
    expect(voluntaryTarget(getExercise("kliky"), { drepy: 30 })).toBe(10);
  });
});
