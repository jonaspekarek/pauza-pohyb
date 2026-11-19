import { angleDeg, dist, LM } from "./geometry";
import type { CounterKind, CounterSpec, Landmark } from "./types";

const side = (s: "left" | "right") =>
  s === "left"
    ? { shoulder: LM.leftShoulder, elbow: LM.leftElbow, wrist: LM.leftWrist, hip: LM.leftHip, knee: LM.leftKnee, ankle: LM.leftAnkle, toe: LM.leftToe }
    : { shoulder: LM.rightShoulder, elbow: LM.rightElbow, wrist: LM.rightWrist, hip: LM.rightHip, knee: LM.rightKnee, ankle: LM.rightAnkle, toe: LM.rightToe };

const p = (lm: Landmark[], i: number): Landmark => lm[i] ?? { x: 0, y: 0, visibility: 0 };

/** Squat, seen from the side: knee angle (hip–knee–ankle) in degrees, ~175 standing. */
export const SQUAT: CounterSpec = {
  kind: "squat",
  view: "side",
  required: {
    left: [LM.leftShoulder, LM.leftHip, LM.leftKnee, LM.leftAnkle],
    right: [LM.rightShoulder, LM.rightHip, LM.rightKnee, LM.rightAnkle],
  },
  metric(lm, s) {
    const j = side(s);
    return angleDeg(p(lm, j.hip), p(lm, j.knee), p(lm, j.ankle));
  },
  isStart: (raw) => raw >= 155,
  calibrationRange: 8,
  leftTop: (raw, base) => raw < base - 12,
  nearBottom: (raw) => raw < 145,
  // A comfortable beginner squat bends the knee to ~90–110°; a half squat (~140°) does not count.
  reachedBottom: (raw) => raw <= 115,
  backAtTop: (raw, base) => raw >= Math.max(150, base - 15),
  minRepMs: 800,
};

/** Wall push-up, seen from the side: elbow angle (shoulder–elbow–wrist), ~165 with straight arms. */
export const WALL_PUSHUP: CounterSpec = {
  kind: "wallPushup",
  view: "side",
  required: {
    left: [LM.leftShoulder, LM.leftElbow, LM.leftWrist, LM.leftHip],
    right: [LM.rightShoulder, LM.rightElbow, LM.rightWrist, LM.rightHip],
  },
  metric(lm, s) {
    const j = side(s);
    return angleDeg(p(lm, j.shoulder), p(lm, j.elbow), p(lm, j.wrist));
  },
  isStart: (raw) => raw >= 145,
  calibrationRange: 10,
  leftTop: (raw, base) => raw < base - 12,
  nearBottom: (raw) => raw < 140,
  reachedBottom: (raw) => raw <= 115,
  backAtTop: (raw, base) => raw >= Math.max(140, base - 15),
  minRepMs: 700,
};

/**
 * Calf raise, seen from the side: how far the hip is above the toes, relative to leg length.
 * Rising onto the toes lifts the hip by roughly 6–9 % of leg length while the toes stay put.
 */
export const CALF_RAISE: CounterSpec = {
  kind: "calfRaise",
  view: "side",
  required: {
    left: [LM.leftShoulder, LM.leftHip, LM.leftKnee, LM.leftAnkle, LM.leftToe],
    right: [LM.rightShoulder, LM.rightHip, LM.rightKnee, LM.rightAnkle, LM.rightToe],
  },
  metric(lm, s) {
    const j = side(s);
    const hip = p(lm, j.hip);
    const knee = p(lm, j.knee);
    const ankle = p(lm, j.ankle);
    const legLen = dist(hip, knee) + dist(knee, ankle);
    if (legLen < 0.05) return Number.NaN;
    // Knees must stay fairly straight, so bouncing in a squat is not read as a raise.
    if (angleDeg(hip, knee, ankle) < 150) return 0;
    // Hip, knee and shoulder all rise together; averaging them calms landmark jitter.
    const bodyY = (hip.y + knee.y + p(lm, j.shoulder).y) / 3;
    return (p(lm, j.toe).y - bodyY) / legLen;
  },
  isStart: (raw) => raw > 0.5,
  calibrationRange: 0.04,
  leftTop: (raw, base) => raw > base + 0.015,
  nearBottom: (raw, base) => raw > base + 0.025,
  reachedBottom: (raw, base) => raw >= base + 0.04,
  backAtTop: (raw, base) => raw <= base + 0.015,
  minRepMs: 500,
  bottomHoldMs: 120,
};

export const COUNTER_SPECS: Record<CounterKind, CounterSpec> = {
  squat: SQUAT,
  wallPushup: WALL_PUSHUP,
  calfRaise: CALF_RAISE,
};
