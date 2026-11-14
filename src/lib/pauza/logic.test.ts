import { describe, expect, it } from "vitest";
import {
  applyUsage,
  bonusForCompletedBreak,
  computeStreak,
  grantBonus,
  remainingMinutes,
  resetForNewDay,
} from "./logic";
import { createSeedState } from "./seed";
import type { AppRule, BreakLog } from "./types";

const base: AppRule = {
  id: "r1",
  appId: "tiktok",
  name: "TikTok",
  limitMinutes: 30,
  usedMinutes: 25,
  bonusMinutes: 0,
  action: "exercise",
  exerciseId: "drepy",
  enabled: true,
  breakTriggered: false,
};

describe("limit rules", () => {
  it("fires the break exactly when the daily limit is used up", () => {
    const before = applyUsage(base, 4);
    expect(before.crossed).toBe(false);
    expect(remainingMinutes(before.rule)).toBe(1);

    const at = applyUsage(before.rule, 1);
    expect(at.crossed).toBe(true);
    expect(remainingMinutes(at.rule)).toBe(0);
  });

  it("does not fire again for the same expiry", () => {
    const first = applyUsage(base, 10);
    expect(first.crossed).toBe(true);
    expect(applyUsage(first.rule, 5).crossed).toBe(false);
  });

  it("disabled rules never fire", () => {
    expect(applyUsage({ ...base, enabled: false }, 60).crossed).toBe(false);
  });

  it("completed movement break adds the reward minutes and re-arms the limit", () => {
    const expired = applyUsage(base, 5).rule;
    const rewarded = grantBonus(expired, 10);
    expect(remainingMinutes(rewarded)).toBe(10);
    expect(applyUsage(rewarded, 10).crossed).toBe(true);
  });

  it("only the movement-break action earns bonus minutes", () => {
    expect(bonusForCompletedBreak(base, 10)).toBe(10);
    expect(bonusForCompletedBreak({ ...base, action: "lock" }, 10)).toBe(0);
    expect(bonusForCompletedBreak({ ...base, action: "reminder" }, 10)).toBe(0);
    expect(bonusForCompletedBreak(undefined, 10)).toBe(0);
  });

  it("usage and bonus reset on a new day", () => {
    const state = { ...createSeedState(), dayKey: "2026-01-01" };
    const next = resetForNewDay(state, "2026-01-02");
    expect(next.rules.every((r) => r.usedMinutes === 0 && r.bonusMinutes === 0)).toBe(true);
  });
});

describe("streak", () => {
  const log = (at: string, completed = true): BreakLog => ({
    id: at,
    at,
    exerciseId: "drepy",
    mode: "manual",
    completed,
    bonusGranted: 0,
  });

  it("counts consecutive days with a completed break; skipped breaks do not count", () => {
    const history = [log("2026-03-10T10:00:00"), log("2026-03-09T10:00:00"), log("2026-03-08T10:00:00", false)];
    expect(computeStreak(history, "2026-03-10")).toBe(2);
  });

  it("keeps yesterday's streak when nothing is done yet today", () => {
    expect(computeStreak([log("2026-03-09T10:00:00")], "2026-03-10")).toBe(1);
  });
});
