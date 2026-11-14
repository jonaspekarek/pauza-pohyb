export type LimitAction = "exercise" | "reminder" | "lock";

export type ExerciseId = "drepy" | "jumping-jacks" | "plank" | "kliky-o-zed" | "protazeni";

export interface AppRule {
  id: string;
  /** Catalog id (e.g. "tiktok") or "custom". */
  appId: string;
  name: string;
  limitMinutes: number;
  /** Simulated usage today, in minutes. */
  usedMinutes: number;
  /** Extra minutes earned today by finishing movement breaks. */
  bonusMinutes: number;
  action: LimitAction;
  exerciseId: ExerciseId;
  enabled: boolean;
  /** True once today's limit expiry has been handled, so it fires only once. */
  breakTriggered: boolean;
}

export interface BreakLog {
  id: string;
  /** ISO timestamp. */
  at: string;
  exerciseId: ExerciseId;
  ruleId?: string | undefined;
  mode: "manual" | "camera";
  completed: boolean;
  bonusGranted: number;
}

export interface Settings {
  userName: string;
  rewardMinutes: number;
  cameraFeedback: boolean;
  onboarded: boolean;
}

export interface PersistedState {
  version: 1;
  rules: AppRule[];
  history: BreakLog[];
  settings: Settings;
  /** Local date key (YYYY-MM-DD) when usage counters were last reset. */
  dayKey: string;
}

export interface AppState extends PersistedState {
  /** Not persisted. */
  hydrated: boolean;
  simulatingRuleId: string | null;
}
