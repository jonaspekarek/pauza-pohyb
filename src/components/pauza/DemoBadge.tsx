import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export function DemoBadge({ className, label = "Simulace" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
