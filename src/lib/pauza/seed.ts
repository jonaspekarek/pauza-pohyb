import { todayKey } from "./logic";
import type { AppState, BreakLog, WeightEntry } from "./types";

function daysAgo(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function dayKeyAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayKey(d);
}

// Fixed values so the server render and the first client render match.
const SAMPLE_WEIGHTS: [daysAgo: number, kg: number][] = [
  [29, 79.4], [27, 79.1], [25, 79.2], [22, 78.8], [20, 78.9], [18, 78.5], [15, 78.3],
  [13, 78.4], [11, 78.0], [8, 77.8], [6, 77.9], [4, 77.5], [2, 77.4], [1, 77.2],
];

export function createSeedState(): AppState {
  const history: BreakLog[] = [
    { id: "seed-h0", at: daysAgo(0, 8), exerciseId: "kliky", mode: "manual", completed: true, bonusGranted: 0, amount: 10 },
    { id: "seed-h1", at: daysAgo(0, 9), exerciseId: "protazeni", mode: "manual", completed: true, bonusGranted: 0, amount: 60 },
    { id: "seed-h2", at: daysAgo(1, 18), exerciseId: "drepy", ruleId: "seed-tiktok", mode: "camera", completed: true, bonusGranted: 10, amount: 15 },
    { id: "seed-h3", at: daysAgo(1, 14), exerciseId: "kliky-o-zed", mode: "manual", completed: true, bonusGranted: 0, amount: 12 },
    { id: "seed-h4", at: daysAgo(2, 20), exerciseId: "plank", mode: "manual", completed: false, bonusGranted: 0 },
    { id: "seed-h5", at: daysAgo(2, 16), exerciseId: "jumping-jacks", ruleId: "seed-instagram", mode: "manual", completed: true, bonusGranted: 10, amount: 20 },
  ];
  const weights: WeightEntry[] = SAMPLE_WEIGHTS.map(([n, kg]) => ({ date: dayKeyAgo(n), kg }));
  return {
    version: 1,
    dayKey: todayKey(),
    hydrated: false,
    simulatingRuleId: null,
    settings: { userName: "", rewardMinutes: 10, cameraFeedback: true, onboarded: false, language: "cs" },
    body: { heightCm: 178, weights, sample: true },
    history,
    rules: [
      { id: "seed-tiktok", appId: "tiktok", name: "TikTok", limitMinutes: 30, usedMinutes: 22, bonusMinutes: 0, action: "exercise", exerciseId: "kliky", exerciseTarget: 10, autoCamera: true, enabled: true, breakTriggered: false, ignoredToday: false },
      { id: "seed-instagram", appId: "instagram", name: "Instagram", limitMinutes: 45, usedMinutes: 41, bonusMinutes: 0, action: "exercise", exerciseId: "sklapovacky", exerciseTarget: 15, autoCamera: false, enabled: true, breakTriggered: false, ignoredToday: false },
      { id: "seed-youtube", appId: "youtube", name: "YouTube", limitMinutes: 60, usedMinutes: 18, bonusMinutes: 0, action: "reminder", exerciseId: "protazeni", exerciseTarget: 60, autoCamera: false, enabled: true, breakTriggered: false, ignoredToday: false },
      { id: "seed-roblox", appId: "roblox", name: "Roblox", limitMinutes: 40, usedMinutes: 33, bonusMinutes: 0, action: "lock", exerciseId: "plank", exerciseTarget: 30, autoCamera: false, enabled: true, breakTriggered: false, ignoredToday: false },
    ],
  };
}
