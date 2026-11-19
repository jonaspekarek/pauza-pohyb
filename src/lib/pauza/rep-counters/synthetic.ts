/**
 * Test-only generator of synthetic MediaPipe-like pose sequences (side view, normalized coords).
 * Deterministic: a seeded random generator adds landmark jitter and dropped frames.
 */
import { LM, POSE_LANDMARK_COUNT } from "./geometry";
import type { Landmark, PoseFrame } from "./types";

export const FPS = 15;
const DT = 1000 / FPS;

export function rng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => {
    const u = Math.max(1e-9, next());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
  };
  return { next, gauss };
}

type P = { x: number; y: number };
const rad = (d: number) => (d * Math.PI) / 180;

const THIGH = 0.2;
const SHIN = 0.2;
const TORSO = 0.27;
const UPPER = 0.14;
const FORE = 0.13;

/** Full skeleton from a few key points; both body sides share the pose (far side slightly offset). */
function skeleton(k: { shoulder: P; elbow: P; wrist: P; hip: P; knee: P; ankle: P; heel: P; toe: P }, farVisibility = 0.75): Landmark[] {
  const lm: Landmark[] = Array.from({ length: POSE_LANDMARK_COUNT }, () => ({ x: 0.5, y: 0.2, visibility: 0.9 }));
  const near = 0.95;
  const put = (l: number, r: number, p: P) => {
    lm[l] = { x: p.x, y: p.y, visibility: near };
    lm[r] = { x: p.x + 0.01, y: p.y - 0.004, visibility: farVisibility };
  };
  put(LM.leftShoulder, LM.rightShoulder, k.shoulder);
  put(LM.leftElbow, LM.rightElbow, k.elbow);
  put(LM.leftWrist, LM.rightWrist, k.wrist);
  put(LM.leftHip, LM.rightHip, k.hip);
  put(LM.leftKnee, LM.rightKnee, k.knee);
  put(LM.leftAnkle, LM.rightAnkle, k.ankle);
  put(LM.leftHeel, LM.rightHeel, k.heel);
  put(LM.leftToe, LM.rightToe, k.toe);
  lm[0] = { x: k.shoulder.x + 0.02, y: k.shoulder.y - 0.08, visibility: 0.95 };
  return lm;
}

/** Side-view squat pose for a given knee angle (180 = standing tall). */
export function squatPose(kneeDeg: number): Landmark[] {
  const a = rad((180 - kneeDeg) / 2);
  const ankle = { x: 0.5, y: 0.86 };
  const knee = { x: ankle.x + SHIN * Math.sin(a), y: ankle.y - SHIN * Math.cos(a) };
  const hip = { x: knee.x - THIGH * Math.sin(a), y: knee.y - THIGH * Math.cos(a) };
  const lean = a * 0.7;
  const shoulder = { x: hip.x + TORSO * Math.sin(lean), y: hip.y - TORSO * Math.cos(lean) };
  const elbow = { x: shoulder.x + UPPER * Math.sin(a * 1.6), y: shoulder.y + UPPER * Math.cos(a * 1.6) };
  const wrist = { x: elbow.x + FORE * Math.sin(a * 2), y: elbow.y + FORE * Math.cos(a * 2) };
  return skeleton({ shoulder, elbow, wrist, hip, knee, ankle, heel: { x: ankle.x - 0.02, y: ankle.y + 0.025 }, toe: { x: ankle.x + 0.06, y: ankle.y + 0.03 } });
}

/** Side-view wall push-up for a given elbow angle; the body leans as a straight line towards a wall. */
export function wallPushupPose(elbowDeg: number): Landmark[] {
  const wallX = 0.8;
  const ankle = { x: 0.3, y: 0.86 };
  const e = rad(elbowDeg);
  const d = Math.sqrt(UPPER * UPPER + FORE * FORE - 2 * UPPER * FORE * Math.cos(e));
  const L = THIGH + SHIN + TORSO;
  const phi = Math.asin(Math.min(0.99, (wallX - d - ankle.x) / L));
  const at = (len: number) => ({ x: ankle.x + len * Math.sin(phi), y: ankle.y - len * Math.cos(phi) });
  const knee = at(SHIN);
  const hip = at(SHIN + THIGH);
  const shoulder = at(L);
  const wrist = { x: wallX, y: shoulder.y };
  // Elbow: intersection of circles around shoulder (UPPER) and wrist (FORE), bent downward.
  const a = (UPPER * UPPER - FORE * FORE + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, UPPER * UPPER - a * a));
  const elbow = { x: shoulder.x + a, y: shoulder.y + h };
  return skeleton({ shoulder, elbow, wrist, hip, knee, ankle, heel: { x: ankle.x - 0.02, y: ankle.y + 0.025 }, toe: { x: ankle.x + 0.06, y: ankle.y + 0.03 } });
}

/** Side-view calf raise: `lift` is how far the heel rises, in normalized image units. */
export function calfRaisePose(lift: number): Landmark[] {
  const toe = { x: 0.56, y: 0.89 };
  const ankle = { x: 0.5, y: 0.86 - lift };
  const knee = { x: ankle.x + 0.005, y: ankle.y - SHIN };
  const hip = { x: knee.x - 0.005, y: knee.y - THIGH };
  const shoulder = { x: hip.x + 0.01, y: hip.y - TORSO };
  const elbow = { x: shoulder.x, y: shoulder.y + UPPER };
  const wrist = { x: shoulder.x + 0.01, y: elbow.y + FORE };
  return skeleton({ shoulder, elbow, wrist, hip, knee, ankle, heel: { x: ankle.x - 0.02, y: ankle.y + 0.025 }, toe });
}

export interface SequenceOptions {
  seed?: number;
  /** Landmark jitter (std dev, normalized units). */
  noise?: number;
  /** Share of frames where detection returns nothing. */
  dropRate?: number;
  /** Override visibility of these landmark indices (e.g. occluded ankles). */
  hide?: number[];
}

/** Value over time: standing, then reps as smooth top→bottom→top cycles, then standing. */
export function repProfile(opts: { top: number; reps: { bottom: number; ms: number }[]; leadMs?: number; tailMs?: number; gapMs?: number }) {
  const lead = opts.leadMs ?? 1800;
  const tail = opts.tailMs ?? 1000;
  const gap = opts.gapMs ?? 300;
  const segments: { start: number; end: number; bottom: number }[] = [];
  let t = lead;
  for (const r of opts.reps) {
    segments.push({ start: t, end: t + r.ms, bottom: r.bottom });
    t += r.ms + gap;
  }
  const total = t + tail;
  const valueAt = (ms: number) => {
    const s = segments.find((g) => ms >= g.start && ms < g.end);
    if (!s) return opts.top;
    const k = (ms - s.start) / (s.end - s.start);
    return opts.top + (s.bottom - opts.top) * (1 - Math.cos(2 * Math.PI * k)) / 2;
  };
  return { total, valueAt };
}

export function makeFrames(pose: (v: number) => Landmark[], valueAt: (ms: number) => number, totalMs: number, opts: SequenceOptions = {}): PoseFrame[] {
  const r = rng(opts.seed ?? 1);
  const noise = opts.noise ?? 0.004;
  const frames: PoseFrame[] = [];
  for (let t = 0; t <= totalMs; t += DT) {
    if (opts.dropRate && r.next() < opts.dropRate) {
      frames.push({ t, landmarks: null });
      continue;
    }
    const lm = pose(valueAt(t)).map((p, i) => ({
      x: p.x + r.gauss() * noise,
      y: p.y + r.gauss() * noise,
      visibility: opts.hide?.includes(i) ? 0.1 + r.next() * 0.2 : Math.min(1, (p.visibility ?? 1) - r.next() * 0.05),
    }));
    frames.push({ t, landmarks: lm });
  }
  return frames;
}
