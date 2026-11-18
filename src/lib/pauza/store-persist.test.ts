import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "pauza-pohyb:v1";

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

describe("store persistence", () => {
  it("keeps legacy rules, history, body data and saves separate voluntary targets", async () => {
    const today = new Date();
    const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const history = [{ id: "b1", at: "2026-01-01T10:00:00Z", exerciseId: "beh-na-miste", mode: "manual", completed: true, amount: 45, bonusGranted: 5, kcal: 3 }];
    const body = { heightCm: 170, weights: [{ date: "2026-01-01", kg: 60 }] };
    localStorage.setItem(KEY, JSON.stringify({
      version: 1,
      rules: [{ id: "r1", appId: "tiktok", name: "TikTok", limitMinutes: 30, usedMinutes: 5, bonusMinutes: 0, action: "exercise", exerciseId: "kliky", exerciseTarget: 10, autoCamera: false, enabled: true, breakTriggered: false, ignoredToday: false }],
      history, settings: {}, body, favorites: ["kliky"], exerciseTargets: { drepy: 12 }, dayKey,
    }));
    const { hydrateStore, pauzaActions, usePauzaState } = await import("./store");
    void usePauzaState;
    hydrateStore();
    pauzaActions.setExerciseTarget("drepy", 18);
    const saved = JSON.parse(localStorage.getItem(KEY)!);
    expect(saved.rules[0].exerciseId).toBe("kliky");
    expect(saved.rules[0].exerciseTarget).toBe(10);
    expect(saved.history[0]).toMatchObject(history[0]!);
    expect(saved.body.heightCm).toBe(170);
    expect(saved.body.weights).toEqual(body.weights);
    expect(saved.favorites).toEqual(["kliky"]);
    expect(saved.exerciseTargets).toEqual({ drepy: 18 });
  });
});
