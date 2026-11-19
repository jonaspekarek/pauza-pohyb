import { LandmarkSmoother, landmarksVisible, meanVisibility } from "./geometry";
import type { CounterCue, CounterPhase, CounterSnapshot, CounterSpec, PoseFrame } from "./types";

/** Hold still this long in the start position before counting begins. */
export const CALIBRATION_MS = 1000;
/** A short dropout (a missed frame, a hand passing by) keeps the current rep. */
export const SHORT_LOSS_MS = 400;
/** After this long out of view, calibrate again. */
export const RECALIBRATE_AFTER_MS = 1500;

export interface RepCounter {
  readonly spec: CounterSpec;
  update(frame: PoseFrame): CounterSnapshot;
  reset(): void;
}

/**
 * Turns pose frames into an approximate rep count: smoothing, a visibility check,
 * a short standing calibration, hysteresis thresholds and a minimum rep duration.
 * Pure and deterministic, so it can be tested with synthetic landmark sequences.
 */
export function createRepCounter(spec: CounterSpec): RepCounter {
  const smoother = new LandmarkSmoother();
  let reps = 0;
  let phase: CounterPhase = "calibrating";
  let base: number | null = null;
  let calib: { t: number; v: number }[] = [];
  let lostSince: number | null = null;
  let repStart = 0;
  let bottomSince: number | null = null;
  let lastRepAt = -Infinity;
  let cue: CounterCue = "noBody";

  function reset() {
    smoother.reset();
    reps = 0;
    phase = "calibrating";
    base = null;
    calib = [];
    lostSince = null;
    repStart = 0;
    bottomSince = null;
    lastRepAt = -Infinity;
    cue = "noBody";
  }

  function snapshot(bodyVisible: boolean, repCounted = false): CounterSnapshot {
    return { reps, phase, bodyVisible, calibrated: base !== null, cue, repCounted };
  }

  function lost(t: number): CounterSnapshot {
    lostSince ??= t;
    const gone = t - lostSince;
    if (gone > RECALIBRATE_AFTER_MS) {
      base = null;
      calib = [];
      phase = "calibrating";
      smoother.reset();
    } else if (gone > SHORT_LOSS_MS && base !== null) {
      // Cancel a half-finished rep; nothing is credited without seeing it.
      phase = "top";
    }
    if (gone > SHORT_LOSS_MS || base === null) cue = "noBody";
    return snapshot(gone <= SHORT_LOSS_MS && base !== null);
  }

  function update({ t, landmarks }: PoseFrame): CounterSnapshot {
    if (!landmarks || landmarks.length === 0) return lost(t);
    const lm = smoother.next(t, landmarks);
    const side = meanVisibility(lm, spec.required.left) >= meanVisibility(lm, spec.required.right) ? "left" : "right";
    if (!landmarksVisible(lm, spec.required[side])) return lost(t);
    lostSince = null;

    const raw = spec.metric(lm, side);
    if (!Number.isFinite(raw)) return lost(t);

    if (base === null) {
      if (!spec.isStart(raw)) {
        calib = [];
        cue = "startPosition";
        return snapshot(true);
      }
      calib.push({ t, v: raw });
      // Keep a sliding window; restart if the user is still moving.
      while (calib.length > 1 && t - calib[0]!.t > CALIBRATION_MS) calib.shift();
      const values = calib.map((c) => c.v);
      const range = Math.max(...values) - Math.min(...values);
      if (range > spec.calibrationRange) {
        calib = [{ t, v: raw }];
      } else if (t - calib[0]!.t >= CALIBRATION_MS * 0.9) {
        base = values.reduce((s, v) => s + v, 0) / values.length;
        calib = [];
        phase = "top";
        cue = "go";
        return snapshot(true);
      }
      cue = "calibrate";
      return snapshot(true);
    }

    let counted = false;
    if (phase === "top" || phase === "calibrating") {
      phase = "top";
      if (spec.leftTop(raw, base)) {
        phase = "moving";
        repStart = t;
        bottomSince = null;
        cue = "further";
      }
    } else if (phase === "moving") {
      if (spec.reachedBottom(raw, base)) {
        bottomSince ??= t;
        if (t - bottomSince >= (spec.bottomHoldMs ?? 0)) {
          phase = "bottom";
          cue = "back";
        }
      } else if (spec.backAtTop(raw, base)) {
        phase = "top";
        cue = "partial";
      } else {
        bottomSince = null;
        if (spec.nearBottom(raw, base)) cue = "further";
      }
    } else if (phase === "bottom") {
      if (spec.backAtTop(raw, base)) {
        phase = "top";
        if (t - repStart >= spec.minRepMs && t - lastRepAt >= spec.minRepMs) {
          reps += 1;
          lastRepAt = t;
          counted = true;
          cue = "counted";
        } else {
          cue = "tooFast";
        }
      } else {
        cue = "back";
      }
    }
    return snapshot(true, counted);
  }

  return { spec, update, reset };
}
