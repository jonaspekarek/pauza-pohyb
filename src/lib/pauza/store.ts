import { useSyncExternalStore } from "react";
import { applyUsage, bonusForCompletedBreak, grantBonus, resetForNewDay, todayKey } from "./logic";
import { createSeedState } from "./seed";
import type { AppRule, AppState, BreakLog, PersistedState, Settings } from "./types";

const STORAGE_KEY = "pauza-pohyb:v1";

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
    history: s.history.slice(0, 200),
    settings: s.settings,
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

/** Loads saved data from this device. Call once from an effect after mount. */
export function hydrateStore() {
  const current = get();
  if (current.hydrated) return;
  let loaded: AppState = { ...current };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed?.version === 1 && Array.isArray(parsed.rules)) {
        loaded = {
          ...current,
          rules: parsed.rules,
          history: parsed.history ?? [],
          settings: { ...current.settings, ...parsed.settings },
          dayKey: parsed.dayKey ?? todayKey(),
        };
      }
    }
  } catch {
    /* corrupted data: fall back to demo data */
  }
  set({ ...resetForNewDay(loaded, todayKey()), hydrated: true });
}

export type RuleInput = Pick<AppRule, "appId" | "name" | "limitMinutes" | "action" | "exerciseId">;

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
  setSimulating(id: string | null) {
    set({ ...get(), simulatingRuleId: id });
  },
  logBreak(entry: Omit<BreakLog, "id" | "at" | "bonusGranted">): number {
    const s = get();
    const rule = entry.ruleId ? s.rules.find((r) => r.id === entry.ruleId) : undefined;
    const bonus = entry.completed ? bonusForCompletedBreak(rule, s.settings.rewardMinutes) : 0;
    const log: BreakLog = { ...entry, id: newId("break"), at: new Date().toISOString(), bonusGranted: bonus };
    set({
      ...s,
      history: [log, ...s.history],
      rules: bonus > 0 && rule ? s.rules.map((r) => (r.id === rule.id ? grantBonus(r, bonus) : r)) : s.rules,
    });
    return bonus;
  },
  updateSettings(patch: Partial<Settings>) {
    const s = get();
    set({ ...s, settings: { ...s.settings, ...patch } });
  },
  resetDemo() {
    const seed = createSeedState();
    set({ ...seed, hydrated: true, settings: { ...seed.settings, onboarded: true } });
  },
};
