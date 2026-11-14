import { todayKey } from "./logic";
import type { AppState, BreakLog } from "./types";

function daysAgo(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

export function createSeedState(): AppState {
  const history: BreakLog[] = [
    { id: "seed-h1", at: daysAgo(0, 9), exerciseId: "protazeni", mode: "manual", completed: true, bonusGranted: 0 },
    { id: "seed-h2", at: daysAgo(1, 18), exerciseId: "drepy", ruleId: "seed-tiktok", mode: "camera", completed: true, bonusGranted: 10 },
    { id: "seed-h3", at: daysAgo(1, 14), exerciseId: "kliky-o-zed", mode: "manual", completed: true, bonusGranted: 0 },
    { id: "seed-h4", at: daysAgo(2, 20), exerciseId: "plank", mode: "manual", completed: false, bonusGranted: 0 },
    { id: "seed-h5", at: daysAgo(2, 16), exerciseId: "jumping-jacks", ruleId: "seed-instagram", mode: "manual", completed: true, bonusGranted: 10 },
  ];
  return {
    version: 1,
    dayKey: todayKey(),
    hydrated: false,
    simulatingRuleId: null,
    settings: { userName: "", rewardMinutes: 10, cameraFeedback: true, onboarded: false },
    history,
    rules: [
      { id: "seed-tiktok", appId: "tiktok", name: "TikTok", limitMinutes: 30, usedMinutes: 22, bonusMinutes: 0, action: "exercise", exerciseId: "drepy", enabled: true, breakTriggered: false },
      { id: "seed-instagram", appId: "instagram", name: "Instagram", limitMinutes: 45, usedMinutes: 41, bonusMinutes: 0, action: "exercise", exerciseId: "jumping-jacks", enabled: true, breakTriggered: false },
      { id: "seed-youtube", appId: "youtube", name: "YouTube", limitMinutes: 60, usedMinutes: 18, bonusMinutes: 0, action: "reminder", exerciseId: "protazeni", enabled: true, breakTriggered: false },
      { id: "seed-roblox", appId: "roblox", name: "Roblox", limitMinutes: 40, usedMinutes: 33, bonusMinutes: 0, action: "lock", exerciseId: "plank", enabled: true, breakTriggered: false },
    ],
  };
}
