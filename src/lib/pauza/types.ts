export type Lang = "cs" | "en" | "es";

export type LimitAction = "exercise" | "reminder" | "lock";

export type ExerciseId =
  | "kliky"
  | "kliky-na-kolenou"
  | "kliky-o-zed"
  | "sklapovacky"
  | "sedy-lehy"
  | "plank"
  | "bocni-plank"
  | "drepy"
  | "vypady"
  | "drep-s-vyskokem"
  | "jumping-jacks"
  | "horolezec"
  | "burpees"
  | "most"
  | "vypony"
  | "sed-u-zdi"
  | "beh-na-miste"
  | "zvedani-nohou"
  | "ruske-otacky"
  | "superman"
  | "protazeni"
  | "siroke-kliky"
  | "zkracovacky"
  | "zvedani-kolen"
  | "bird-dog"
  | "protazeni-zad"
  | "protazeni-ramen"
  | "protazeni-nohou"
  | "protazeni-krku";

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
  /** How many reps (or seconds for timed exercises) the break requires. */
  exerciseTarget: number;
  /** Break screen offers to start with the camera on (user still taps start). */
  autoCamera: boolean;
  enabled: boolean;
  /** True once today's limit expiry has been handled, so it fires only once. */
  breakTriggered: boolean;
  /** User chose "ignore for today": the limit does not apply until midnight. */
  ignoredToday: boolean;
}

export interface BreakLog {
  id: string;
  /** ISO timestamp. */
  at: string;
  exerciseId: ExerciseId;
  ruleId?: string | undefined;
  /** "camera" only when the camera counted at least one rep. */
  mode: "manual" | "camera";
  completed: boolean;
  bonusGranted: number;
  /** Reps or seconds actually done. */
  amount?: number | undefined;
  /** Reps the camera counted (approximate). Missing in older entries. */
  cameraReps?: number | undefined;
  /** Reps the user added by hand. Missing in older entries. */
  manualReps?: number | undefined;
  /** Estimated kilocalories burned. */
  kcal?: number | undefined;
}

export interface Settings {
  userName: string;
  rewardMinutes: number;
  cameraFeedback: boolean;
  onboarded: boolean;
  language: Lang;
}

export interface WeightEntry {
  /** Local date key YYYY-MM-DD. */
  date: string;
  kg: number;
}

export interface BodyData {
  heightCm: number | null;
  weights: WeightEntry[];
  /** True while the weights are the bundled sample data. */
  sample: boolean;
}

export interface PersistedState {
  version: 1;
  rules: AppRule[];
  history: BreakLog[];
  settings: Settings;
  body: BodyData;
  /** Exercises the user starred. */
  favorites: ExerciseId[];
  /** User-chosen target (reps or seconds) per exercise for free breaks. */
  exerciseTargets: Partial<Record<ExerciseId, number>>;
  /** Local date key (YYYY-MM-DD) when usage counters were last reset. */
  dayKey: string;
}

export interface AppState extends PersistedState {
  /** Not persisted. */
  hydrated: boolean;
  simulatingRuleId: string | null;
}
