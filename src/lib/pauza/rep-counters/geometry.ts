import type { Landmark } from "./types";

/** MediaPipe Pose landmark indices used by the counters. */
export const LM = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftHeel: 29,
  rightHeel: 30,
  leftToe: 31,
  rightToe: 32,
} as const;

export const POSE_LANDMARK_COUNT = 33;

/** Angle ABC in degrees (0–180). */
export function angleDeg(a: Landmark, b: Landmark, c: Landmark): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (mag === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (abx * cbx + aby * cby) / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export const MIN_VISIBILITY = 0.5;
const EDGE = 0.01;

/** Every index has good visibility and lies inside the camera frame. */
export function landmarksVisible(lm: Landmark[], indices: number[]): boolean {
  return indices.every((i) => {
    const p = lm[i];
    return (
      !!p &&
      (p.visibility ?? 1) >= MIN_VISIBILITY &&
      p.x >= EDGE &&
      p.x <= 1 - EDGE &&
      p.y >= EDGE &&
      p.y <= 1 - EDGE
    );
  });
}

export function meanVisibility(lm: Landmark[], indices: number[]): number {
  if (indices.length === 0) return 0;
  return indices.reduce((s, i) => s + (lm[i]?.visibility ?? 0), 0) / indices.length;
}

/**
 * Exponential moving average per landmark, to calm frame-to-frame jitter.
 * Resets after a gap so a returning person is not blended with an old pose.
 */
export class LandmarkSmoother {
  private prev: Landmark[] | null = null;
  private lastT = -Infinity;

  constructor(
    private readonly alpha = 0.5,
    private readonly resetAfterMs = 500,
  ) {}

  reset() {
    this.prev = null;
    this.lastT = -Infinity;
  }

  next(t: number, lm: Landmark[]): Landmark[] {
    if (!this.prev || t - this.lastT > this.resetAfterMs || this.prev.length !== lm.length) {
      this.prev = lm.map((p) => ({ x: p.x, y: p.y, visibility: p.visibility ?? 1 }));
    } else {
      const a = this.alpha;
      this.prev = lm.map((p, i) => {
        const q = this.prev![i]!;
        return {
          x: q.x + a * (p.x - q.x),
          y: q.y + a * (p.y - q.y),
          visibility: (q.visibility ?? 1) + a * ((p.visibility ?? 1) - (q.visibility ?? 1)),
        };
      });
    }
    this.lastT = t;
    return this.prev;
  }
}
