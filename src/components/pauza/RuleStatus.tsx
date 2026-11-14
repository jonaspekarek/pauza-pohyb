import { Badge } from "@/components/ui/badge";
import type { RuleStatus } from "@/lib/pauza/logic";
import { cn } from "@/lib/utils";

const LABEL: Record<RuleStatus, string> = {
  ok: "V pohodě",
  warning: "Blíží se limit",
  expired: "Limit vyčerpán",
  paused: "Vypnuto",
};

export function RuleStatusBadge({ status }: { status: RuleStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border-transparent px-2 py-0.5 text-[11px] font-semibold",
        status === "ok" && "bg-primary/15 text-primary",
        status === "warning" && "bg-warning/15 text-warning",
        status === "expired" && "bg-destructive/15 text-destructive",
        status === "paused" && "bg-muted text-muted-foreground",
      )}
    >
      {LABEL[status]}
    </Badge>
  );
}

export function statusIndicatorClass(status: RuleStatus) {
  return cn(
    status === "ok" && "bg-primary",
    status === "warning" && "bg-warning",
    status === "expired" && "bg-destructive",
    status === "paused" && "bg-muted-foreground/40",
  );
}

export const ACTION_LABEL = {
  exercise: "Pohybová pauza",
  reminder: "Jen připomínka",
  lock: "Konec na dnešek",
} as const;

export const ACTION_DESCRIPTION = {
  exercise: "Zobrazí cvik. Po dokončení získáte bonusové minuty.",
  reminder: "Jemné upozornění, nic se neblokuje.",
  lock: "Simulace zámku do půlnoci, s nabídkou pohybu.",
} as const;
