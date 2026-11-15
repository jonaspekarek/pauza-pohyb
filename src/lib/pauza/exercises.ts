import {
  Activity,
  Armchair,
  ArrowUpFromLine,
  BicepsFlexed,
  Dumbbell,
  Flame,
  Footprints,
  Hand,
  HeartPulse,
  Mountain,
  MoveVertical,
  PersonStanding,
  RefreshCw,
  Rows3,
  Timer,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ExerciseId } from "./types";

/** On-device pose counters (MediaPipe). Each one tracks a single joint angle. */
export type CounterKind = "squat" | "pushup" | "situp" | "crunch" | "bridge" | "jack" | "lunge";

export type ExerciseCategory = "upper" | "core" | "legs" | "cardio" | "mobility";

export interface Exercise {
  id: ExerciseId;
  /** "reps" = count repetitions, "time" = hold/perform for seconds. */
  kind: "reps" | "time";
  /** Default target (reps or seconds). */
  target: number;
  category: ExerciseCategory;
  icon: LucideIcon;
  /** Metabolic equivalent used for the calorie estimate. */
  met: number;
  /** Average seconds per repetition (reps exercises), for the calorie estimate. */
  secPerRep: number;
  /** Camera can count reps on-device (orientation only). */
  counter?: CounterKind;
}

export const EXERCISES: Exercise[] = [
  { id: "kliky", kind: "reps", target: 10, category: "upper", icon: BicepsFlexed, met: 8, secPerRep: 2.5, counter: "pushup" },
  { id: "kliky-na-kolenou", kind: "reps", target: 10, category: "upper", icon: BicepsFlexed, met: 4, secPerRep: 2.5, counter: "pushup" },
  { id: "kliky-o-zed", kind: "reps", target: 12, category: "upper", icon: Hand, met: 3.5, secPerRep: 2.5, counter: "pushup" },
  { id: "sklapovacky", kind: "reps", target: 15, category: "core", icon: Rows3, met: 3.8, secPerRep: 2.5, counter: "crunch" },
  { id: "sedy-lehy", kind: "reps", target: 12, category: "core", icon: ArrowUpFromLine, met: 4.5, secPerRep: 3, counter: "situp" },
  { id: "plank", kind: "time", target: 30, category: "core", icon: Timer, met: 4, secPerRep: 1 },
  { id: "bocni-plank", kind: "time", target: 20, category: "core", icon: Timer, met: 4, secPerRep: 1 },
  { id: "zvedani-nohou", kind: "reps", target: 10, category: "core", icon: MoveVertical, met: 3.8, secPerRep: 3 },
  { id: "ruske-otacky", kind: "reps", target: 20, category: "core", icon: RefreshCw, met: 4, secPerRep: 1.5 },
  { id: "superman", kind: "reps", target: 10, category: "core", icon: Activity, met: 3.5, secPerRep: 3 },
  { id: "drepy", kind: "reps", target: 15, category: "legs", icon: PersonStanding, met: 5, secPerRep: 3, counter: "squat" },
  { id: "vypady", kind: "reps", target: 10, category: "legs", icon: Footprints, met: 4, secPerRep: 3, counter: "lunge" },
  { id: "drep-s-vyskokem", kind: "reps", target: 10, category: "legs", icon: Zap, met: 8, secPerRep: 2.5, counter: "squat" },
  { id: "most", kind: "reps", target: 12, category: "legs", icon: Dumbbell, met: 3.5, secPerRep: 3, counter: "bridge" },
  { id: "vypony", kind: "reps", target: 20, category: "legs", icon: ArrowUpFromLine, met: 3, secPerRep: 1.5 },
  { id: "sed-u-zdi", kind: "time", target: 30, category: "legs", icon: Armchair, met: 4, secPerRep: 1 },
  { id: "jumping-jacks", kind: "reps", target: 20, category: "cardio", icon: Zap, met: 8, secPerRep: 1.2, counter: "jack" },
  { id: "beh-na-miste", kind: "time", target: 45, category: "cardio", icon: HeartPulse, met: 7, secPerRep: 1 },
  { id: "horolezec", kind: "time", target: 30, category: "cardio", icon: Mountain, met: 8, secPerRep: 1 },
  { id: "burpees", kind: "reps", target: 8, category: "cardio", icon: Flame, met: 8, secPerRep: 4 },
  { id: "protazeni", kind: "time", target: 60, category: "mobility", icon: Wind, met: 2.3, secPerRep: 1 },
];

export const EXERCISE_CATEGORIES: ExerciseCategory[] = ["upper", "core", "legs", "cardio", "mobility"];

export function isExerciseId(id: unknown): id is ExerciseId {
  return typeof id === "string" && EXERCISES.some((e) => e.id === id);
}

export function getExercise(id: string | undefined): Exercise {
  return EXERCISES.find((e) => e.id === id) ?? EXERCISES[0]!;
}

/** Seconds of activity for an amount of reps/seconds. */
export function exerciseSeconds(e: Exercise, amount: number): number {
  return e.kind === "time" ? amount : amount * e.secPerRep;
}

/** Allowed range for a rule's target. */
export function targetBounds(e: Exercise): { min: number; max: number; step: number } {
  return e.kind === "time" ? { min: 10, max: 300, step: 5 } : { min: 1, max: 100, step: 1 };
}
