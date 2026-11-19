import { createRepCounter, type RepCounter } from "./engine";
import { COUNTER_SPECS } from "./specs";
import type { CounterKind } from "./types";

export * from "./types";
export { createRepCounter, CALIBRATION_MS, RECALIBRATE_AFTER_MS, SHORT_LOSS_MS, type RepCounter } from "./engine";
export { COUNTER_SPECS } from "./specs";
export { LandmarkSmoother, angleDeg, landmarksVisible, LM } from "./geometry";

export function createCounter(kind: CounterKind): RepCounter {
  return createRepCounter(COUNTER_SPECS[kind]);
}

/** Pose detection runs at most this often, to save battery. */
export const DETECTION_FPS = 15;
