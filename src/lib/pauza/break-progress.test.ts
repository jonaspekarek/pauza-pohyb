import { describe, expect, it } from "vitest";
import { addCameraRep, addManualRep, EMPTY_TALLY, initialBreakMode, removeRep, repLogFields, tallyTotal } from "./break-progress";

describe("break rep tally", () => {
  it("stops camera counting once the target is reached", () => {
    let t = EMPTY_TALLY;
    for (let i = 0; i < 20; i++) t = addCameraRep(t, 15);
    expect(t.camera).toBe(15);
    expect(tallyTotal(t)).toBe(15);
  });

  it("counts manual reps toward the target, so the camera stops earlier", () => {
    let t = addManualRep(addManualRep(EMPTY_TALLY));
    for (let i = 0; i < 20; i++) t = addCameraRep(t, 12);
    expect(t).toEqual({ camera: 10, manual: 2 });
  });

  it("removes manual reps before camera reps", () => {
    const t = { camera: 3, manual: 1 };
    expect(removeRep(t)).toEqual({ camera: 3, manual: 0 });
    expect(removeRep({ camera: 3, manual: 0 })).toEqual({ camera: 2, manual: 0 });
    expect(removeRep(EMPTY_TALLY)).toEqual(EMPTY_TALLY);
  });

  it("marks history as camera only when the camera counted reps", () => {
    expect(repLogFields({ camera: 0, manual: 10 })).toEqual({ mode: "manual", amount: 10, cameraReps: 0, manualReps: 10 });
    expect(repLogFields({ camera: 8, manual: 2 })).toEqual({ mode: "camera", amount: 10, cameraReps: 8, manualReps: 2 });
  });
});

describe("initial break mode", () => {
  it("preselects the camera tab only for exercise rules with the camera option on", () => {
    expect(initialBreakMode({ autoCamera: true, action: "exercise" })).toBe("camera");
    expect(initialBreakMode({ autoCamera: false, action: "exercise" })).toBe("manual");
    expect(initialBreakMode({ autoCamera: true, action: "lock" })).toBe("manual");
    expect(initialBreakMode(undefined)).toBe("manual");
  });
});
