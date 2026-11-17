/**
 * Stick-figure illustrations for exercises, computed from joint angles.
 * Angles are absolute degrees: 0 = down, 90 = forward (right), 180 = up, -90 = back (left).
 * The figure faces right. "A"/"B" limbs: A is the near side, B the far side (drawn fainter).
 */
export interface Pose {
  /** Hip to neck. */
  torso: number;
  /** Thigh and shin of the near (A) and far (B) leg. */
  tA: number;
  sA: number;
  tB?: number;
  sB?: number;
  /** Upper arm and forearm of the near (A) and far (B) arm. */
  uA: number;
  fA: number;
  uB?: number;
  fB?: number;
  /** Head tilt relative to the torso. */
  tilt?: number;
  /** Spine curve in px: positive bows the back up/back, negative the other way. */
  arch?: number;
  /** Horizontal shift of the hip. */
  dx?: number;
  /** Lift off the ground in px (jumps, calf raises). */
  lift?: number;
}

export interface FigureSpec {
  a: Pose;
  /** Second keyframe; the figure animates A ⇄ B. Omit for a still pose. */
  b?: Pose;
  /** Front view: both sides drawn at full strength. */
  front?: boolean;
  /** A wall in front of the figure (wall push-ups) or behind it (wall sit). */
  wall?: "front" | "back";
}

type P = [number, number];

export interface FigurePoints {
  head: P;
  neck: P;
  hip: P;
  spineCtrl: P;
  kneeA: P;
  ankleA: P;
  kneeB: P;
  ankleB: P;
  elbowA: P;
  wristA: P;
  elbowB: P;
  wristB: P;
}

export const VIEW = { w: 120, h: 80, ground: 72, headR: 4.4 } as const;
const L = { torso: 22, neck: 7, thigh: 15, shin: 15, upper: 12, fore: 11 };

function dir(deg: number, len: number): P {
  const r = (deg * Math.PI) / 180;
  return [Math.sin(r) * len, Math.cos(r) * len];
}
function add(p: P, q: P): P {
  return [p[0] + q[0], p[1] + q[1]];
}

function rawPoints(pose: Pose): FigurePoints {
  const hip: P = [pose.dx ?? 0, 0];
  const neck = add(hip, dir(pose.torso, L.torso));
  const head = add(neck, dir(pose.torso + (pose.tilt ?? 0), L.neck));
  const mid: P = [(hip[0] + neck[0]) / 2, (hip[1] + neck[1]) / 2];
  // Perpendicular to the spine, towards the back of the body.
  const spineCtrl = add(mid, dir(pose.torso + 90, pose.arch ?? 0));
  const kneeA = add(hip, dir(pose.tA, L.thigh));
  const ankleA = add(kneeA, dir(pose.sA, L.shin));
  const kneeB = add(hip, dir(pose.tB ?? pose.tA, L.thigh));
  const ankleB = add(kneeB, dir(pose.sB ?? pose.sA, L.shin));
  const elbowA = add(neck, dir(pose.uA, L.upper));
  const wristA = add(elbowA, dir(pose.fA, L.fore));
  const elbowB = add(neck, dir(pose.uB ?? pose.uA, L.upper));
  const wristB = add(elbowB, dir(pose.fB ?? pose.fA, L.fore));
  return { head, neck, hip, spineCtrl, kneeA, ankleA, kneeB, ankleB, elbowA, wristA, elbowB, wristB };
}

function shift(p: FigurePoints, x: number, y: number): FigurePoints {
  const out = {} as FigurePoints;
  for (const k of Object.keys(p) as (keyof FigurePoints)[]) out[k] = [p[k][0] + x, p[k][1] + y];
  return out;
}

function lowest(p: FigurePoints): number {
  const ys = (Object.keys(p) as (keyof FigurePoints)[]).filter((k) => k !== "spineCtrl" && k !== "head").map((k) => p[k][1]);
  return Math.max(...ys, p.head[1] + VIEW.headR);
}

function xRange(p: FigurePoints): [number, number] {
  const xs = (Object.keys(p) as (keyof FigurePoints)[]).filter((k) => k !== "spineCtrl").map((k) => p[k][0]);
  xs.push(p.head[0] - VIEW.headR, p.head[0] + VIEW.headR);
  return [Math.min(...xs), Math.max(...xs)];
}

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Aspect ratio (width / height) of every illustration. */
export const FIGURE_ASPECT = 1.5;

function yRange(p: FigurePoints): [number, number] {
  const ys = (Object.keys(p) as (keyof FigurePoints)[]).filter((k) => k !== "spineCtrl").map((k) => p[k][1]);
  ys.push(p.head[1] - VIEW.headR);
  return [Math.min(...ys), Math.max(...ys)];
}

/**
 * Both keyframes placed on the ground line, plus a view box that frames the figure
 * tightly (fixed aspect ratio, ground near the bottom edge).
 */
export function layoutFigure(spec: FigureSpec): { a: FigurePoints; b: FigurePoints; wallX: number | null; view: ViewBox } {
  const pb = spec.b ?? spec.a;
  const ra = rawPoints(spec.a);
  const rb = rawPoints(pb);
  const a = shift(ra, 0, VIEW.ground - lowest(ra) - (spec.a.lift ?? 0));
  const b = shift(rb, 0, VIEW.ground - lowest(rb) - (pb.lift ?? 0));
  const [minA, maxA] = xRange(a);
  const [minB, maxB] = xRange(b);
  let minX = Math.min(minA, minB);
  let maxX = Math.max(maxA, maxB);
  let minY = Math.min(yRange(a)[0], yRange(b)[0]);
  let wallX: number | null = null;
  if (spec.wall === "front") {
    wallX = Math.max(a.wristA[0], b.wristA[0], a.wristB[0], b.wristB[0]) + 1.5;
    maxX = Math.max(maxX, wallX + 1);
  } else if (spec.wall === "back") {
    wallX = Math.min(a.hip[0], b.hip[0], a.neck[0], b.neck[0]) - 2.5;
    minX = Math.min(minX, wallX - 1);
  }
  if (wallX !== null) minY = Math.min(minY, VIEW.ground - 50);
  const pad = 6;
  const bottom = VIEW.ground + 4;
  const h = Math.max(44, bottom - (minY - pad), (maxX - minX + pad * 2) / FIGURE_ASPECT);
  const w = h * FIGURE_ASPECT;
  const cx = (minX + maxX) / 2;
  return { a, b, wallX, view: { x: cx - w / 2, y: bottom - h, w, h } };
}
