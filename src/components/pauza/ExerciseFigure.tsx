import { useMemo } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { layoutFigure, VIEW, type FigurePoints, type FigureSpec } from "@/lib/pauza/figure";
import { cn } from "@/lib/utils";

type Seg = [keyof FigurePoints, keyof FigurePoints];
const FAR: Seg[] = [["hip", "kneeB"], ["kneeB", "ankleB"], ["neck", "elbowB"], ["elbowB", "wristB"]];
const NEAR: Seg[] = [["hip", "kneeA"], ["kneeA", "ankleA"], ["neck", "elbowA"], ["elbowA", "wristA"]];

const r = (n: number) => Math.round(n * 10) / 10;
const spine = (p: FigurePoints) => `M${r(p.hip[0])} ${r(p.hip[1])}Q${r(p.spineCtrl[0])} ${r(p.spineCtrl[1])} ${r(p.neck[0])} ${r(p.neck[1])}`;

const DUR = "2.6s";
const SPLINE = { calcMode: "spline", keyTimes: "0;0.5;1", keySplines: "0.45 0 0.55 1;0.45 0 0.55 1", repeatCount: "indefinite", dur: DUR } as const;

function Anim({ attr, a, b }: { attr: string; a: string | number; b: string | number }) {
  if (a === b) return null;
  return <animate attributeName={attr} values={`${a};${b};${a}`} {...SPLINE} />;
}

/**
 * Simple stick-figure illustration of an exercise. Animates between two keyframes
 * when `animate` is set and the user has not asked for reduced motion.
 */
export function ExerciseFigure({
  figure,
  animate = false,
  className,
  title,
}: {
  figure: FigureSpec;
  animate?: boolean;
  className?: string;
  title?: string;
}) {
  const reduced = useReducedMotion();
  const { a, b, wallX, view } = useMemo(() => layoutFigure(figure), [figure]);
  // Keep the line weight visually constant however tightly the figure is framed.
  const k = view.h / 64;
  const moving = animate && !reduced && !!figure.b;
  // Still images show the "working" keyframe.
  const still = figure.b ? b : a;

  const line = (s: Seg, cls: string, w0: number) => {
    const w = r(w0 * k);
    const p = moving ? a : still;
    return (
      <line key={s.join("-")} x1={r(p[s[0]][0])} y1={r(p[s[0]][1])} x2={r(p[s[1]][0])} y2={r(p[s[1]][1])} className={cls} strokeWidth={w}>
        {moving && (
          <>
            <Anim attr="x1" a={r(a[s[0]][0])} b={r(b[s[0]][0])} />
            <Anim attr="y1" a={r(a[s[0]][1])} b={r(b[s[0]][1])} />
            <Anim attr="x2" a={r(a[s[1]][0])} b={r(b[s[1]][0])} />
            <Anim attr="y2" a={r(a[s[1]][1])} b={r(b[s[1]][1])} />
          </>
        )}
      </line>
    );
  };

  const p = moving ? a : still;
  return (
    <svg
      viewBox={`${r(view.x)} ${r(view.y)} ${r(view.w)} ${r(view.h)}`}
      className={cn("block h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1={r(view.x + view.w * 0.06)} y1={VIEW.ground + 0.8 * k} x2={r(view.x + view.w * 0.94)} y2={VIEW.ground + 0.8 * k} className="stroke-info/30" strokeWidth={r(1.2 * k)} />
      {wallX !== null && (
        <line x1={r(wallX)} y1={r(view.y + 3)} x2={r(wallX)} y2={VIEW.ground + 0.8 * k} className="stroke-info/40" strokeWidth={r(2.2 * k)} />
      )}
      {FAR.map((s) => line(s, figure.front ? "stroke-primary" : "stroke-primary/40", 3.4))}
      <path d={spine(p)} className="stroke-primary" strokeWidth={r(3.8 * k)}>
        {moving && <Anim attr="d" a={spine(a)} b={spine(b)} />}
      </path>
      {NEAR.map((s) => line(s, "stroke-primary", 3.4))}
      <circle cx={r(p.head[0])} cy={r(p.head[1])} r={VIEW.headR} className="fill-primary">
        {moving && (
          <>
            <Anim attr="cx" a={r(a.head[0])} b={r(b.head[0])} />
            <Anim attr="cy" a={r(a.head[1])} b={r(b.head[1])} />
          </>
        )}
      </circle>
    </svg>
  );
}
