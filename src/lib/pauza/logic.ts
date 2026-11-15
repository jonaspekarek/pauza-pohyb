import type { AppRule, AppState, BreakLog, PersistedState, WeightEntry } from "./types";

/** Local calendar date as YYYY-MM-DD. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function effectiveLimit(rule: AppRule): number {
  return rule.limitMinutes + rule.bonusMinutes;
}

export function remainingMinutes(rule: AppRule): number {
  return Math.max(0, effectiveLimit(rule) - rule.usedMinutes);
}

export function usageRatio(rule: AppRule): number {
  const limit = effectiveLimit(rule);
  if (limit <= 0) return 1;
  return Math.min(1, rule.usedMinutes / limit);
}

export type RuleStatus = "paused" | "ignored" | "ok" | "warning" | "expired";

export function ruleStatus(rule: AppRule): RuleStatus {
  if (!rule.enabled) return "paused";
  if (rule.ignoredToday) return "ignored";
  if (remainingMinutes(rule) === 0) return "expired";
  if (usageRatio(rule) >= 0.8) return "warning";
  return "ok";
}

/** The app is "closed" in the simulation: limit used up and the action is not just a reminder. */
export function isBlocked(rule: AppRule): boolean {
  return ruleStatus(rule) === "expired" && rule.action !== "reminder";
}

/**
 * Adds simulated usage. `crossed` is true exactly once per day: when this
 * usage exhausts the limit and the expiry has not been handled yet.
 * Ignored-for-today rules keep counting time but never expire.
 */
export function applyUsage(rule: AppRule, minutes: number): { rule: AppRule; crossed: boolean } {
  if (!rule.enabled || minutes <= 0) return { rule, crossed: false };
  const next: AppRule = { ...rule, usedMinutes: rule.usedMinutes + minutes };
  if (rule.ignoredToday) return { rule: next, crossed: false };
  const crossed = remainingMinutes(next) === 0 && !rule.breakTriggered;
  if (crossed) next.breakTriggered = true;
  return { rule: next, crossed };
}

/** "Ignore for today": the limit stops applying until the next day's reset. */
export function ignoreForToday(rule: AppRule): AppRule {
  return { ...rule, ignoredToday: true, breakTriggered: true };
}

/** Rewards a completed movement break with extra minutes and re-arms the expiry trigger. */
export function grantBonus(rule: AppRule, minutes: number): AppRule {
  return { ...rule, bonusMinutes: rule.bonusMinutes + minutes, breakTriggered: false };
}

/** Only the "exercise" action rewards bonus minutes; "lock" ends the day, "reminder" never blocks. */
export function bonusForCompletedBreak(rule: AppRule | undefined, rewardMinutes: number): number {
  if (!rule || rule.action !== "exercise") return 0;
  return Math.max(0, rewardMinutes);
}

export function resetForNewDay<T extends PersistedState | AppState>(state: T, today: string): T {
  if (state.dayKey === today) return state;
  return {
    ...state,
    dayKey: today,
    rules: state.rules.map((r) => ({ ...r, usedMinutes: 0, bonusMinutes: 0, breakTriggered: false, ignoredToday: false })),
  };
}

/** A break counts as done once the configured number of reps (or seconds) is reached. */
export function breakTargetReached(done: number, target: number): boolean {
  return target > 0 && done >= target;
}

/** Consecutive days with at least one completed break, ending today (or yesterday if none yet today). */
export function computeStreak(history: BreakLog[], today: string): number {
  const days = new Set(history.filter((h) => h.completed).map((h) => todayKey(new Date(h.at))));
  const cursor = new Date(`${today}T12:00:00`);
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ---------- Body: BMI, weight, calories ---------- */

/** BMI = kg / m², rounded to one decimal. Null when inputs are missing or implausible. */
export function bmi(kg: number | null | undefined, heightCm: number | null | undefined): number | null {
  if (!kg || !heightCm || kg < 20 || kg > 400 || heightCm < 100 || heightCm > 250) return null;
  const m = heightCm / 100;
  return Math.round((kg / (m * m)) * 10) / 10;
}

export type BmiCategory = "under" | "normal" | "over" | "obese";

/** WHO adult categories. */
export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return "under";
  if (value < 25) return "normal";
  if (value < 30) return "over";
  return "obese";
}

/** Estimated kcal: MET × body weight (kg) × hours. One decimal. */
export function estimateKcal(met: number, seconds: number, weightKg: number): number {
  if (met <= 0 || seconds <= 0 || weightKg <= 0) return 0;
  return Math.round(met * weightKg * (seconds / 3600) * 10) / 10;
}

/** Records one weight per day (latest entry for a day wins), sorted by date. */
export function upsertWeight(list: WeightEntry[], date: string, kg: number): WeightEntry[] {
  const rounded = Math.round(kg * 10) / 10;
  return [...list.filter((w) => w.date !== date), { date, kg: rounded }].sort((a, b) => a.date.localeCompare(b.date)).slice(-400);
}

/** Entries from the last `days` days, today included. */
export function weightsInLastDays(list: WeightEntry[], today: string, days: number): WeightEntry[] {
  const from = new Date(`${today}T12:00:00`);
  from.setDate(from.getDate() - (days - 1));
  const fromKey = todayKey(from);
  return list.filter((w) => w.date >= fromKey && w.date <= today);
}

export function latestWeight(list: WeightEntry[]): number | null {
  return list.length ? (list[list.length - 1]?.kg ?? null) : null;
}

export function formatMinutes(total: number): string {
  const m = Math.max(0, Math.round(total));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h} h` : `${h} h ${rest} min`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Czech plural helper: plural(1,"pauza","pauzy","pauz"). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
