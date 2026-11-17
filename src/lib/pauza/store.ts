import { useSyncExternalStore } from "react";
import { getExercise, exerciseSeconds, isExerciseId } from "./exercises";
import {
  applyUsage,
  bonusForCompletedBreak,
  estimateKcal,
  grantBonus,
  ignoreForToday,
  latestWeight,
  resetForNewDay,
  todayKey,
  upsertWeight,
} from "./logic";
import { createSeedState } from "./seed";
import type { AppRule, AppState, BodyData, BreakLog, Lang, PersistedState, Settings } from "./types";

const STORAGE_KEY = "pauza-pohyb:v1";
/** Used for calorie estimates until the user enters a weight. */
export const DEFAULT_WEIGHT_KG = 70;

let state: AppState | null = null;
// Stable pre-hydration snapshot: SSR and every hydrating subtree render the same demo data.
let serverSnapshot: AppState | null = null;
const listeners = new Set<() => void>();

function get(): AppState {
  if (!state) state = createSeedState();
  return state;
}

function getServerSnapshot(): AppState {
  if (!serverSnapshot) serverSnapshot = createSeedState();
  return serverSnapshot;
}

function emit() {
  for (const l of listeners) l();
}

function persist(s: AppState) {
  if (typeof window === "undefined") return;
  const data: PersistedState = {
    version: 1,
    rules: s.rules,
    history: s.history.slice(0, 300),
    settings: s.settings,
    body: s.body,
    favorites: s.favorites,
    exerciseTargets: s.exerciseTargets,
    dayKey: s.dayKey,
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* storage full or blocked: keep working in memory */
  }
}

function set(next: AppState) {
  state = next;
  persist(next);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePauzaState(): AppState {
  return useSyncExternalStore(subscribe, get, getServerSnapshot);
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Fills fields added in later versions so older saved data keeps working. */
function normalizeRule(r: Partial<AppRule> & Pick<AppRule, "id" | "name">): AppRule {
  const exerciseId = isExerciseId(r.exerciseId) ? r.exerciseId : "drepy";
  return {
    appId: "custom",
    limitMinutes: 30,
    usedMinutes: 0,
    bonusMinutes: 0,
    action: "exercise",
    enabled: true,
    breakTriggered: false,
    ...r,
    exerciseId,
    exerciseTarget: typeof r.exerciseTarget === "number" && r.exerciseTarget > 0 ? r.exerciseTarget : getExercise(exerciseId).target,
    autoCamera: r.autoCamera ?? false,
    ignoredToday: r.ignoredToday ?? false,
  };
}

function detectLanguage(): Lang {
  const l = (navigator.language || "cs").slice(0, 2).toLowerCase();
  return l === "en" || l === "es" ? l : "cs";
}

/** Loads saved data from this device. Call once from an effect after mount. */
export function hydrateStore() {
  const current = get();
  if (current.hydrated) return;
  let loaded: AppState = { ...current, settings: { ...current.settings, language: detectLanguage() } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed?.version === 1 && Array.isArray(parsed.rules)) {
        loaded = {
          ...current,
          rules: parsed.rules.map((r) => normalizeRule(r)),
          history: (parsed.history ?? []).map((h) => ({ ...h, exerciseId: isExerciseId(h.exerciseId) ? h.exerciseId : "drepy" })),
          settings: { ...current.settings, ...parsed.settings },
          body: { ...current.body, ...(parsed.body ?? {}) },
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites.filter(isExerciseId) : [],
          exerciseTargets: typeof parsed.exerciseTargets === "object" && parsed.exerciseTargets ? parsed.exerciseTargets : {},
          dayKey: parsed.dayKey ?? todayKey(),
        };
      }
    }
  } catch {
    /* corrupted data: fall back to demo data */
  }
  set({ ...resetForNewDay(loaded, todayKey()), hydrated: true });
}

export type RuleInput = Pick<AppRule, "appId" | "name" | "limitMinutes" | "action" | "exerciseId" | "exerciseTarget" | "autoCamera">;

function currentWeight(body: BodyData): number {
  return latestWeight(body.weights) ?? DEFAULT_WEIGHT_KG;
}

export const pauzaActions = {
  addRule(input: RuleInput) {
    const s = get();
    const rule: AppRule = {
      ...input,
      id: newId("rule"),
      usedMinutes: 0,
      bonusMinutes: 0,
      enabled: true,
      breakTriggered: false,
      ignoredToday: false,
    };
    set({ ...s, rules: [...s.rules, rule] });
    return rule;
  },
  updateRule(id: string, patch: Partial<AppRule>) {
    const s = get();
    set({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  },
  deleteRule(id: string) {
    const s = get();
    set({
      ...s,
      rules: s.rules.filter((r) => r.id !== id),
      simulatingRuleId: s.simulatingRuleId === id ? null : s.simulatingRuleId,
    });
  },
  addUsage(id: string, minutes: number): { crossed: boolean; rule?: AppRule } {
    const s = get();
    const rule = s.rules.find((r) => r.id === id);
    if (!rule) return { crossed: false };
    const result = applyUsage(rule, minutes);
    set({ ...s, rules: s.rules.map((r) => (r.id === id ? result.rule : r)) });
    return result;
  },
  resetUsage(id: string) {
    pauzaActions.updateRule(id, { usedMinutes: 0, bonusMinutes: 0, breakTriggered: false });
  },
  /** The limit stops applying until tomorrow; the rule itself stays as configured. */
  ignoreToday(id: string) {
    const s = get();
    set({
      ...s,
      rules: s.rules.map((r) => (r.id === id ? ignoreForToday(r) : r)),
    });
  },
  unignoreToday(id: string) {
    pauzaActions.updateRule(id, { ignoredToday: false, breakTriggered: false });
  },
  setSimulating(id: string | null) {
    set({ ...get(), simulatingRuleId: id });
  },
  logBreak(entry: Omit<BreakLog, "id" | "at" | "bonusGranted" | "kcal">): { bonus: number; kcal: number } {
    const s = get();
    const rule = entry.ruleId ? s.rules.find((r) => r.id === entry.ruleId) : undefined;
    const bonus = entry.completed ? bonusForCompletedBreak(rule, s.settings.rewardMinutes) : 0;
    const ex = getExercise(entry.exerciseId);
    const kcal = entry.completed && entry.amount ? estimateKcal(ex.met, exerciseSeconds(ex, entry.amount), currentWeight(s.body)) : 0;
    const log: BreakLog = { ...entry, id: newId("break"), at: new Date().toISOString(), bonusGranted: bonus, kcal };
    set({
      ...s,
      history: [log, ...s.history],
      rules: bonus > 0 && rule ? s.rules.map((r) => (r.id === rule.id ? grantBonus(r, bonus) : r)) : s.rules,
    });
    return { bonus, kcal };
  },
  updateSettings(patch: Partial<Settings>) {
    const s = get();
    set({ ...s, settings: { ...s.settings, ...patch } });
  },
  setHeight(cm: number | null) {
    const s = get();
    set({ ...s, body: { ...s.body, heightCm: cm } });
  },
  /** Saves today's weight. The first real entry replaces the bundled sample weights. */
  logWeight(kg: number) {
    const s = get();
    const base = s.body.sample ? [] : s.body.weights;
    set({ ...s, body: { ...s.body, sample: false, weights: upsertWeight(base, todayKey(), kg) } });
  },
  clearWeights() {
    const s = get();
    set({ ...s, body: { ...s.body, sample: false, weights: [] } });
  },
  resetDemo() {
    const seed = createSeedState();
    const s = get();
    set({ ...seed, hydrated: true, settings: { ...seed.settings, onboarded: true, language: s.settings.language } });
  },
};

/** Kcal for a log entry; older entries without a stored value are estimated. */
export function logKcal(h: BreakLog, weightKg: number): number {
  if (!h.completed) return 0;
  if (typeof h.kcal === "number") return h.kcal;
  const ex = getExercise(h.exerciseId);
  return estimateKcal(ex.met, exerciseSeconds(ex, h.amount ?? ex.target), weightKg);
}
