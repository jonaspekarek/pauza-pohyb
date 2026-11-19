/** A pose landmark in normalized image coordinates (0–1), as MediaPipe returns it. */
export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/** Exercises the camera really counts. Everything else is mirror-only. */
export type CounterKind = "squat" | "wallPushup" | "calfRaise";

/** How the phone should see the user. */
export type CameraView = "side" | "front";

export type CounterPhase = "calibrating" | "top" | "moving" | "bottom";

/** Short coaching hint the UI turns into translated text. */
export type CounterCue =
  | "noBody" // nobody / required body parts not visible
  | "calibrate" // hold still in the start position
  | "startPosition" // visible, but not in the start position yet
  | "go" // calibrated, start the movement
  | "further" // moving, not deep/high enough yet
  | "back" // bottom reached, return to start
  | "partial" // came back without reaching the bottom: not counted
  | "tooFast" // rep shorter than the minimum duration: not counted
  | "counted";

export interface CounterSnapshot {
  reps: number;
  phase: CounterPhase;
  /** All landmarks this exercise needs are visible and inside the frame. */
  bodyVisible: boolean;
  calibrated: boolean;
  cue: CounterCue;
  /** True only on the frame where a rep was counted. */
  repCounted: boolean;
}

export interface PoseFrame {
  /** Milliseconds (monotonic). */
  t: number;
  /** Landmarks of one person, or null when no person was detected. */
  landmarks: Landmark[] | null;
}

/** Per-exercise rules. Raw metric units are exercise-specific (degrees or body-relative ratio). */
export interface CounterSpec {
  kind: CounterKind;
  view: CameraView;
  /** Landmark indices that must be visible; left and right variants, the better side is used. */
  required: { left: number[]; right: number[] };
  metric(lm: Landmark[], side: "left" | "right"): number;
  /** The user is in the start position (standing tall / arms straight / heels down). */
  isStart(raw: number): boolean;
  /** Max spread of the raw metric while holding still for calibration. */
  calibrationRange: number;
  leftTop(raw: number, base: number): boolean;
  nearBottom(raw: number, base: number): boolean;
  reachedBottom(raw: number, base: number): boolean;
  backAtTop(raw: number, base: number): boolean;
  /** A rep faster than this is treated as jitter. */
  minRepMs: number;
  /** The bottom (or top of a raise) must hold this long; filters single-frame spikes. */
  bottomHoldMs?: number;
}
