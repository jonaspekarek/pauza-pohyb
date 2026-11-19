import type { AppRule, BreakLog } from "./types";

/** Reps counted by the camera and reps added by hand, kept apart so history stays honest. */
export interface RepTally {
  camera: number;
  manual: number;
}

export const EMPTY_TALLY: RepTally = { camera: 0, manual: 0 };

export function tallyTotal(t: RepTally): number {
  return t.camera + t.manual;
}

/** A camera rep only counts while the target is not reached yet. */
export function addCameraRep(t: RepTally, target: number): RepTally {
  return tallyTotal(t) >= target ? t : { ...t, camera: t.camera + 1 };
}

export function addManualRep(t: RepTally): RepTally {
  return { ...t, manual: t.manual + 1 };
}

/** "−" removes a hand-added rep first, then a camera rep (to correct a wrong camera count). */
export function removeRep(t: RepTally): RepTally {
  if (t.manual > 0) return { ...t, manual: t.manual - 1 };
  if (t.camera > 0) return { ...t, camera: t.camera - 1 };
  return t;
}

/** What goes into history: "camera" only if the camera actually counted something. */
export function repLogFields(t: RepTally): Pick<BreakLog, "mode" | "amount" | "cameraReps" | "manualReps"> {
  return { mode: t.camera > 0 ? "camera" : "manual", amount: tallyTotal(t), cameraReps: t.camera, manualReps: t.manual };
}

/**
 * Which tab a break opens on. A rule with "Zapnout kameru při pauze" preselects the camera tab;
 * the camera itself still only starts after the user taps its button.
 */
export function initialBreakMode(rule: Pick<AppRule, "autoCamera" | "action"> | undefined): "manual" | "camera" {
  return rule?.autoCamera && rule.action === "exercise" ? "camera" : "manual";
}
