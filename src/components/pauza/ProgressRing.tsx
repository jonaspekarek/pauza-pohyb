import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 160,
  stroke = 12,
  tone = "primary",
  children,
  className,
}: {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  tone?: "primary" | "warning" | "destructive" | "info";
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cn(
            "transition-[stroke-dashoffset,opacity] duration-700 ease-out",
            v === 0 && "opacity-0",
            tone === "primary" && "stroke-primary",
            tone === "warning" && "stroke-warning",
            tone === "destructive" && "stroke-destructive",
            tone === "info" && "stroke-info",
          )}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
