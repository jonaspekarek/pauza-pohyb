import type { FigureSpec, Pose } from "./figure";
import type { BreakLog, ExerciseId } from "./types";

/** On-device pose counters (MediaPipe). Each one tracks a single joint angle. */
export type CounterKind = "squat" | "pushup" | "situp" | "crunch" | "bridge" | "jack" | "lunge";

export type ExerciseCategory = "chest" | "core" | "legs" | "fullbody" | "back" | "stretch";

/** "hard" exercises are voluntary only: they can never be the required exercise of a limit. */
export type Difficulty = "easy" | "medium" | "hard";

export interface Exercise {
  id: ExerciseId;
  /** "reps" = count repetitions, "time" = hold/perform for seconds. */
  kind: "reps" | "time";
  /** Default target (reps or seconds). */
  target: number;
  category: ExerciseCategory;
  /** Also listed under these categories (e.g. back stretch under stretching). */
  alsoIn?: ExerciseCategory[];
  difficulty: Difficulty;
  /** Easier exercise from the catalogue, offered as a one-tap switch. */
  easierId?: ExerciseId;
  /** Stick-figure illustration. */
  figure: FigureSpec;
  /** Metabolic equivalent (kept for older saved data; not shown in the UI). */
  met: number;
  /** Average seconds per repetition (reps exercises). */
  secPerRep: number;
  /** Camera can count reps on-device (orientation only). */
  counter?: CounterKind;
}

/* ---------- Illustration keyframes ---------- */

const STAND: Pose = { torso: 180, tA: 2, sA: 0, tB: -3, sB: -1, uA: 8, fA: 14, uB: -6, fB: -3 };
const FRONT_STAND: Pose = { torso: 180, tA: 4, sA: 2, tB: -4, sB: -2, uA: 12, fA: 8, uB: -12, fB: -8 };
const PUSH_UP: Pose = { torso: 116, tA: -64, sA: -64, uA: 0, fA: 0 };
const PUSH_DOWN: Pose = { torso: 103, tA: -77, sA: -77, uA: -60, fA: 59 };
const LYING_KNEES: Pose = { torso: 90, tA: -135, sA: -45, uA: -90, fA: -90 };
const ALL_FOURS: Pose = { torso: 111, tA: 0, sA: -90, uA: 0, fA: 0 };
const SQUAT_LOW: Pose = { torso: 150, tA: 90, sA: -20, uA: 100, fA: 95, dx: -9.9 };

const ex = (e: Exercise) => e;

export const EXERCISES: Exercise[] = [
  // Hrudník
  ex({ id: "kliky", kind: "reps", target: 10, category: "chest", difficulty: "medium", easierId: "kliky-na-kolenou", met: 8, secPerRep: 2.5, counter: "pushup",
    figure: { a: PUSH_UP, b: PUSH_DOWN } }),
  ex({ id: "kliky-na-kolenou", kind: "reps", target: 10, category: "chest", difficulty: "easy", easierId: "kliky-o-zed", met: 4, secPerRep: 2.5, counter: "pushup",
    figure: { a: { torso: 128, tA: -52, sA: -95, uA: 0, fA: 0 }, b: { torso: 108, tA: -72, sA: -98, uA: -60, fA: 59 } } }),
  ex({ id: "siroke-kliky", kind: "reps", target: 6, category: "chest", difficulty: "hard", easierId: "kliky", met: 8, secPerRep: 2.5, counter: "pushup",
    figure: { a: { ...PUSH_UP, uA: 12, fA: 12 }, b: { torso: 103, tA: -77, sA: -77, uA: -40, fA: 75 } } }),
  ex({ id: "kliky-o-zed", kind: "reps", target: 12, category: "chest", difficulty: "easy", met: 3.5, secPerRep: 2.5, counter: "pushup",
    figure: { a: { torso: 155, tA: -25, sA: -25, uA: 90, fA: 90 }, b: { torso: 145, tA: -35, sA: -35, uA: 45, fA: 140, dx: 4.5 }, wall: "front" } }),

  // Břicho
  ex({ id: "sklapovacky", kind: "reps", target: 15, category: "core", difficulty: "easy", met: 3.8, secPerRep: 2.5, counter: "crunch",
    figure: { a: { ...LYING_KNEES, uA: 160, fA: 40 }, b: { ...LYING_KNEES, torso: 118, uA: 188, fA: 68 } } }),
  ex({ id: "zkracovacky", kind: "reps", target: 12, category: "core", difficulty: "easy", met: 3.5, secPerRep: 2.5, counter: "crunch",
    figure: { a: { ...LYING_KNEES, uA: -105, fA: -105 }, b: { ...LYING_KNEES, torso: 112, uA: -122, fA: -122 } } }),
  ex({ id: "sedy-lehy", kind: "reps", target: 12, category: "core", difficulty: "medium", easierId: "sklapovacky", met: 4.5, secPerRep: 3, counter: "situp",
    figure: { a: { ...LYING_KNEES, uA: -100, fA: -100 }, b: { torso: 168, tA: -120, sA: -50, uA: -90, fA: -90 } } }),
  ex({ id: "plank", kind: "time", target: 30, category: "core", difficulty: "medium", met: 4, secPerRep: 1,
    figure: { a: { torso: 103, tA: -77, sA: -77, uA: 0, fA: 90 }, b: { torso: 104.5, tA: -75.5, sA: -75.5, uA: 0, fA: 90 } } }),
  ex({ id: "bocni-plank", kind: "time", target: 20, category: "core", difficulty: "medium", met: 4, secPerRep: 1,
    figure: { a: { torso: 104, tA: -76, sA: -76, uA: 0, fA: 90, uB: 178, fB: 180 }, b: { torso: 108, tA: -72, sA: -72, uA: 0, fA: 90, uB: 172, fB: 176 }, front: true } }),
  ex({ id: "zvedani-kolen", kind: "reps", target: 10, category: "core", difficulty: "easy", met: 3.5, secPerRep: 3,
    figure: { a: LYING_KNEES, b: { ...LYING_KNEES, tA: 165, sA: -95 } } }),
  ex({ id: "zvedani-nohou", kind: "reps", target: 10, category: "core", difficulty: "medium", easierId: "zvedani-kolen", met: 3.8, secPerRep: 3,
    figure: { a: { ...LYING_KNEES, tA: -95, sA: -95 }, b: { ...LYING_KNEES, tA: -165, sA: -170 } } }),
  ex({ id: "ruske-otacky", kind: "reps", target: 20, category: "core", difficulty: "medium", met: 4, secPerRep: 1.5,
    figure: { a: { torso: -150, tA: 125, sA: 55, uA: 110, fA: 150, uB: 100, fB: 140 }, b: { torso: -150, tA: 125, sA: 55, uA: 65, fA: 100, uB: 75, fB: 110 } } }),

  // Nohy
  ex({ id: "drepy", kind: "reps", target: 15, category: "legs", difficulty: "easy", met: 5, secPerRep: 3, counter: "squat",
    figure: { a: { torso: 180, tA: 0, sA: 0, uA: 90, fA: 90 }, b: SQUAT_LOW } }),
  ex({ id: "vypady", kind: "reps", target: 10, category: "legs", difficulty: "medium", easierId: "drepy", met: 4, secPerRep: 3, counter: "lunge",
    figure: { a: { torso: 180, tA: 0, sA: 0, uA: 0, fA: 0 }, b: { torso: 180, tA: 85, sA: 0, tB: -15, sB: -80, uA: 0, fA: 0, dx: 12 } } }),
  ex({ id: "vypony", kind: "reps", target: 20, category: "legs", difficulty: "easy", met: 3, secPerRep: 1.5,
    figure: { a: STAND, b: { ...STAND, lift: 4 } } }),
  ex({ id: "sed-u-zdi", kind: "time", target: 30, category: "legs", difficulty: "medium", easierId: "drepy", met: 4, secPerRep: 1,
    figure: { a: { torso: 180, tA: 90, sA: 0, uA: 30, fA: 90 }, b: { torso: 180, tA: 90, sA: 0, uA: 26, fA: 86 }, wall: "back" } }),
  ex({ id: "most", kind: "reps", target: 12, category: "legs", difficulty: "easy", met: 3.5, secPerRep: 3, counter: "bridge",
    figure: { a: LYING_KNEES, b: { torso: 70, tA: -110, sA: -33, uA: -80, fA: -90, dx: 1.3 } } }),
  ex({ id: "drep-s-vyskokem", kind: "reps", target: 10, category: "legs", difficulty: "hard", easierId: "drepy", met: 8, secPerRep: 2.5, counter: "squat",
    figure: { a: { ...SQUAT_LOW, uA: -30, fA: -20 }, b: { torso: 180, tA: 2, sA: 6, uA: 155, fA: 165, lift: 7 } } }),

  // Celé tělo
  ex({ id: "jumping-jacks", kind: "reps", target: 20, category: "fullbody", difficulty: "medium", easierId: "beh-na-miste", met: 8, secPerRep: 1.2, counter: "jack",
    figure: { a: FRONT_STAND, b: { torso: 180, tA: 22, sA: 22, tB: -22, sB: -22, uA: 130, fA: 165, uB: -130, fB: -165 }, front: true } }),
  ex({ id: "horolezec", kind: "time", target: 30, category: "fullbody", difficulty: "hard", easierId: "beh-na-miste", met: 8, secPerRep: 1,
    figure: { a: { ...PUSH_UP, tA: 60, sA: -100, tB: -64, sB: -64 }, b: { ...PUSH_UP, tA: -64, sA: -64, tB: 60, sB: -100 } } }),
  ex({ id: "burpees", kind: "reps", target: 8, category: "fullbody", difficulty: "hard", easierId: "drepy", met: 8, secPerRep: 4,
    figure: { a: { torso: 135, tA: 110, sA: -35, uA: 0, fA: 0 }, b: { torso: 180, tA: 0, sA: 3, uA: 155, fA: 165, lift: 6 } } }),
  ex({ id: "beh-na-miste", kind: "time", target: 45, category: "fullbody", difficulty: "easy", met: 7, secPerRep: 1,
    figure: {
      a: { torso: 180, tA: 75, sA: 0, tB: -5, sB: 0, uA: -35, fA: 40, uB: 30, fB: 100 },
      b: { torso: 180, tA: -5, sA: 0, tB: 75, sB: 0, uA: 30, fA: 100, uB: -35, fB: 40 },
    } }),

  // Záda a držení těla
  ex({ id: "bird-dog", kind: "reps", target: 10, category: "back", difficulty: "easy", met: 3, secPerRep: 4,
    figure: { a: ALL_FOURS, b: { ...ALL_FOURS, tA: -95, sA: -95, tB: 0, sB: -90, uB: 100, fB: 100 } } }),
  ex({ id: "superman", kind: "reps", target: 10, category: "back", difficulty: "easy", easierId: "bird-dog", met: 3.5, secPerRep: 3,
    figure: { a: { torso: 90, tA: -90, sA: -90, uA: 92, fA: 92 }, b: { torso: 102, tA: -102, sA: -104, uA: 104, fA: 106 } } }),
  ex({ id: "protazeni-zad", kind: "time", target: 30, category: "back", alsoIn: ["stretch"], difficulty: "easy", met: 2.3, secPerRep: 1,
    figure: { a: { ...ALL_FOURS, arch: 7, tilt: -45 }, b: { ...ALL_FOURS, arch: -5, tilt: 25 } } }),

  // Protažení
  ex({ id: "protazeni-ramen", kind: "time", target: 30, category: "stretch", difficulty: "easy", met: 2.3, secPerRep: 1,
    figure: { a: FRONT_STAND, b: { ...FRONT_STAND, uA: -84, fA: -88, uB: -25, fB: 60 }, front: true } }),
  ex({ id: "protazeni-nohou", kind: "time", target: 30, category: "stretch", difficulty: "easy", met: 2.3, secPerRep: 1,
    figure: { a: { torso: 180, tA: 90, sA: 90, uA: 165, fA: 172 }, b: { torso: 125, tA: 90, sA: 90, uA: 100, fA: 95, arch: 4 } } }),
  ex({ id: "protazeni-krku", kind: "time", target: 30, category: "stretch", difficulty: "easy", met: 2, secPerRep: 1,
    figure: { a: { ...FRONT_STAND, tilt: -24 }, b: { ...FRONT_STAND, tilt: 24 }, front: true } }),
  ex({ id: "protazeni", kind: "time", target: 60, category: "stretch", difficulty: "easy", met: 2.3, secPerRep: 1,
    figure: { a: { torso: 180, tA: 0, sA: 0, uA: 165, fA: 172 }, b: { torso: 40, tA: 0, sA: 0, uA: -70, fA: -30, arch: 4 } } }),
];

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ["chest", "core", "legs", "fullbody", "back", "stretch"];

export function isExerciseId(id: unknown): id is ExerciseId {
  return typeof id === "string" && EXERCISES.some((e) => e.id === id);
}

export function getExercise(id: string | undefined): Exercise {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0]!;
}

export function inCategory(e: Exercise, c: ExerciseCategory): boolean {
  return e.category === c || (e.alsoIn?.includes(c) ?? false);
}

/** Seconds of activity for an amount of reps/seconds. */
export function exerciseSeconds(e: Exercise, amount: number): number {
  return e.kind === "time" ? amount : amount * e.secPerRep;
}

/* ---------- Targets ---------- */

/** Quick choices offered for every exercise. */
export const TARGET_PRESETS = { reps: [5, 10, 15, 20], time: [15, 30, 45, 60] } as const;

/** Allowed range for a custom target: 1–100 repetitions or 5–300 seconds. */
export function targetBounds(e: Exercise): { min: number; max: number; step: number } {
  return e.kind === "time" ? { min: 5, max: 300, step: 5 } : { min: 1, max: 100, step: 1 };
}

/** Whole number inside the bounds; anything unusable falls back to the default target. */
export function clampTarget(e: Exercise, n: number): number {
  if (!Number.isFinite(n)) return e.target;
  const b = targetBounds(e);
  return Math.min(b.max, Math.max(b.min, Math.round(n)));
}

/**
 * Target for a break: a limit's configured target wins (when the break uses that limit's exercise),
 * then the user's saved target for the exercise, then the default.
 */
export function resolveTarget(e: Exercise, opts: { ruleTarget?: number | undefined; saved?: number | undefined }): number {
  if (typeof opts.ruleTarget === "number" && opts.ruleTarget > 0) return clampTarget(e, opts.ruleTarget);
  if (typeof opts.saved === "number" && opts.saved > 0) return clampTarget(e, opts.saved);
  return e.target;
}

/* ---------- Safety ---------- */

/** Only easy and medium exercises may be the required exercise of a limit. */
export function canBeRequired(e: Exercise): boolean {
  return e.difficulty !== "hard";
}

/** For a required break: a hard exercise is swapped for its nearest easier, allowed variant. */
export function breakSafeExerciseId(id: ExerciseId): ExerciseId {
  let e = getExercise(id);
  const seen = new Set<ExerciseId>();
  while (!canBeRequired(e) && e.easierId && !seen.has(e.id)) {
    seen.add(e.id);
    e = getExercise(e.easierId);
  }
  return canBeRequired(e) ? e.id : "drepy";
}

/* ---------- Picking ---------- */

/** Most recently used exercises, newest first, without duplicates. */
export function recentExerciseIds(history: BreakLog[], limit = 6): ExerciseId[] {
  const out: ExerciseId[] = [];
  const sorted = [...history].sort((a, b) => b.at.localeCompare(a.at));
  for (const h of sorted) {
    if (!isExerciseId(h.exerciseId) || out.includes(h.exerciseId)) continue;
    out.push(h.exerciseId);
    if (out.length >= limit) break;
  }
  return out;
}

export function toggleFavorite(list: ExerciseId[], id: ExerciseId): ExerciseId[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Lowercase without diacritics, so "drepy" finds "Dřepy". */
export function normalizeSearch(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export type ExerciseFilter = "all" | "favorites" | ExerciseCategory;

export function filterExercises(
  list: Exercise[],
  opts: { query: string; filter: ExerciseFilter; favorites: ExerciseId[]; nameOf: (e: Exercise) => string },
): Exercise[] {
  const q = normalizeSearch(opts.query);
  return list.filter((e) => {
    if (opts.filter === "favorites" && !opts.favorites.includes(e.id)) return false;
    if (opts.filter !== "all" && opts.filter !== "favorites" && !inCategory(e, opts.filter)) return false;
    return q === "" || normalizeSearch(opts.nameOf(e)).includes(q) || normalizeSearch(e.id).includes(q);
  });
}

/* ---------- Required (limit) breaks ---------- */

/** The only exercises allowed in a required break, with default and maximum targets. */
export const REQUIRED_BREAK_EXERCISES: Readonly<Partial<Record<ExerciseId, { target: number; max: number }>>> = {
  "kliky-o-zed": { target: 12, max: 20 },
  drepy: { target: 15, max: 20 },
  vypony: { target: 20, max: 25 },
  "beh-na-miste": { target: 45, max: 60 },
  "protazeni-zad": { target: 30, max: 45 },
  "protazeni-ramen": { target: 30, max: 60 },
  "protazeni-nohou": { target: 30, max: 45 },
  "protazeni-krku": { target: 30, max: 40 },
  protazeni: { target: 60, max: 90 },
};

export const REQUIRED_EXERCISE_IDS = Object.keys(REQUIRED_BREAK_EXERCISES) as ExerciseId[];
export const REQUIRED_FALLBACK_ID: ExerciseId = "protazeni";
export const NEW_RULE_EXERCISE_ID: ExerciseId = "drepy";

export function isRequiredAllowed(id: unknown): id is ExerciseId {
  return typeof id === "string" && id in REQUIRED_BREAK_EXERCISES;
}

/** Bounds for a required-break target; min 1 rep / 5 s, max from the safe list. */
export function requiredTargetBounds(id: ExerciseId): { min: number; max: number; step: number } {
  const e = getExercise(id);
  const max = REQUIRED_BREAK_EXERCISES[id]?.max ?? targetBounds(e).max;
  return e.kind === "time" ? { min: 5, max, step: 5 } : { min: 1, max, step: 1 };
}

export function requiredDefaultTarget(id: ExerciseId): number {
  return REQUIRED_BREAK_EXERCISES[id]?.target ?? getExercise(id).target;
}

export function clampRequiredTarget(id: ExerciseId, n: number): number {
  if (!Number.isFinite(n) || n <= 0) return requiredDefaultTarget(id);
  const b = requiredTargetBounds(id);
  return Math.min(b.max, Math.max(b.min, Math.round(n)));
}

/**
 * What a required break actually runs. A rule with a no-longer-allowed exercise is NOT
 * rewritten; the break uses the safe fallback and reports `replaced` so the UI can warn.
 */
export function requiredBreakPlan(rule: { exerciseId: string; exerciseTarget: number }): {
  exerciseId: ExerciseId;
  target: number;
  replaced: boolean;
} {
  if (isRequiredAllowed(rule.exerciseId)) {
    return { exerciseId: rule.exerciseId, target: clampRequiredTarget(rule.exerciseId, rule.exerciseTarget), replaced: false };
  }
  return { exerciseId: REQUIRED_FALLBACK_ID, target: requiredDefaultTarget(REQUIRED_FALLBACK_ID), replaced: true };
}

/** Voluntary break target: the user's saved default for that exercise, never a rule's target. */
export function voluntaryTarget(e: Exercise, saved: Partial<Record<ExerciseId, number>>): number {
  return resolveTarget(e, { saved: saved[e.id] });
}
