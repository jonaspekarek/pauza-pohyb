import { describe, expect, it } from "vitest";
import { createCounter, LM, type CounterKind, type CounterSnapshot, type Landmark, type PoseFrame } from "./index";
import { calfRaisePose, makeFrames, repProfile, rng, squatPose, wallPushupPose, type SequenceOptions } from "./synthetic";

function run(kind: CounterKind, frames: PoseFrame[]): CounterSnapshot {
  const c = createCounter(kind);
  let last: CounterSnapshot | undefined;
  for (const f of frames) last = c.update(f);
  return last!;
}

const SETUPS: Record<CounterKind, { pose: (v: number) => Landmark[]; top: number; full: [number, number]; half: number; hide: number[] }> = {
  squat: { pose: squatPose, top: 176, full: [92, 110], half: 138, hide: [LM.leftAnkle, LM.rightAnkle, LM.leftKnee, LM.rightKnee] },
  wallPushup: { pose: wallPushupPose, top: 165, full: [90, 108], half: 135, hide: [LM.leftWrist, LM.rightWrist, LM.leftElbow, LM.rightElbow] },
  calfRaise: { pose: calfRaisePose, top: 0, full: [0.026, 0.036], half: 0.008, hide: [LM.leftToe, LM.rightToe, LM.leftAnkle, LM.rightAnkle] },
};

/** Realistic-ish set: varying depth and tempo, jitter and a few dropped frames. */
function variedSequence(kind: CounterKind, n: number, seed: number, opts: SequenceOptions = {}) {
  const s = SETUPS[kind];
  const r = rng(seed * 7 + 3);
  const reps = Array.from({ length: n }, () => ({
    bottom: s.full[0] + (s.full[1] - s.full[0]) * r.next(),
    ms: kind === "calfRaise" ? 1100 + r.next() * 1400 : 1600 + r.next() * 2000,
  }));
  const prof = repProfile({ top: s.top, reps, gapMs: 200 + r.next() * 500 });
  return makeFrames(s.pose, prof.valueAt, prof.total, { seed, noise: 0.004, dropRate: 0.03, ...opts });
}

describe.each(Object.keys(SETUPS) as CounterKind[])("%s counter", (kind) => {
  const s = SETUPS[kind];

  it("counts clean reps", () => {
    const prof = repProfile({ top: s.top, reps: Array.from({ length: 10 }, () => ({ bottom: s.full[0], ms: 2000 })) });
    const last = run(kind, makeFrames(s.pose, prof.valueAt, prof.total, { noise: 0.002 }));
    expect(last.reps).toBe(10);
  });

  it("counts at least 90 % of varied reps and never more than performed", () => {
    let expected = 0;
    let counted = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const n = 8 + (seed % 5);
      expected += n;
      const got = run(kind, variedSequence(kind, n, seed)).reps;
      expect(got).toBeLessThanOrEqual(n);
      counted += got;
    }
    expect(counted / expected).toBeGreaterThanOrEqual(0.9);
  });

  it("counts zero reps while standing still for 30 s", () => {
    for (let seed = 1; seed <= 5; seed++) {
      const frames = makeFrames(s.pose, () => s.top, 30_000, { seed, noise: 0.005, dropRate: 0.03 });
      const last = run(kind, frames);
      expect(last.reps).toBe(0);
      expect(last.calibrated).toBe(true);
    }
  });

  it("does not count half reps", () => {
    const prof = repProfile({ top: s.top, reps: Array.from({ length: 10 }, () => ({ bottom: s.half, ms: 2000 })) });
    const last = run(kind, makeFrames(s.pose, prof.valueAt, prof.total, { seed: 4 }));
    expect(last.reps).toBe(0);
  });

  it("does not count when key landmarks are not visible", () => {
    const prof = repProfile({ top: s.top, reps: Array.from({ length: 10 }, () => ({ bottom: s.full[0], ms: 2000 })) });
    const last = run(kind, makeFrames(s.pose, prof.valueAt, prof.total, { seed: 5, hide: s.hide }));
    expect(last.reps).toBe(0);
    expect(last.bodyVisible).toBe(false);
    expect(last.cue).toBe("noBody");
  });

  it("does not count when nobody is detected", () => {
    const frames: PoseFrame[] = Array.from({ length: 300 }, (_, i) => ({ t: i * 66, landmarks: null }));
    expect(run(kind, frames).reps).toBe(0);
  });

  it("ignores jitter-fast reps under the minimum duration", () => {
    const prof = repProfile({ top: s.top, reps: Array.from({ length: 10 }, () => ({ bottom: s.full[0], ms: 330 })) });
    expect(run(kind, makeFrames(s.pose, prof.valueAt, prof.total, { noise: 0.001 })).reps).toBe(0);
  });

  it("needs a short still calibration before counting", () => {
    // Reps start immediately, without standing still first: the first rep cannot be counted.
    const prof = repProfile({ top: s.top, leadMs: 0, reps: Array.from({ length: 3 }, () => ({ bottom: s.full[0], ms: 2000 })) });
    const frames = makeFrames(s.pose, prof.valueAt, prof.total, { noise: 0.001 });
    const c = createCounter(kind);
    const first = c.update(frames[0]!);
    expect(first.calibrated).toBe(false);
    let last = first;
    for (const f of frames.slice(1)) last = c.update(f);
    expect(last.reps).toBeLessThan(3);
  });
});

describe("squat specifics", () => {
  it("recalibrates after the person leaves the frame for a while", () => {
    const c = createCounter("squat");
    const stand = makeFrames(squatPose, () => 176, 2000, { noise: 0.001 });
    for (const f of stand) c.update(f);
    expect(c.update({ t: 2100, landmarks: squatPose(176) }).calibrated).toBe(true);
    for (let t = 2200; t < 4200; t += 66) c.update({ t, landmarks: null });
    expect(c.update({ t: 4300, landmarks: squatPose(176) }).calibrated).toBe(false);
  });
});
