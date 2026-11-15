import { cs } from "@/lib/i18n/cs";
import { Link } from "@tanstack/react-router";
import { Pause, Pencil, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useAddUsage } from "@/hooks/use-usage-actions";
import { getExercise } from "@/lib/pauza/exercises";
import { effectiveLimit, formatMinutes, remainingMinutes, ruleStatus, usageRatio } from "@/lib/pauza/logic";
import { pauzaActions } from "@/lib/pauza/store";
import type { AppRule } from "@/lib/pauza/types";
import { cn } from "@/lib/utils";
import { AppTile } from "./AppTile";
import { ACTION_LABEL, RuleStatusBadge, statusIndicatorClass } from "./RuleStatus";

export function RuleCard({
  rule,
  variant = "compact",
  simulating = false,
  onEdit,
}: {
  rule: AppRule;
  variant?: "compact" | "full";
  simulating?: boolean;
  onEdit?: (rule: AppRule) => void;
}) {
  const addUsage = useAddUsage();
  const status = ruleStatus(rule);
  const remaining = remainingMinutes(rule);
  const exercise = getExercise(rule.exerciseId);

  return (
    <article className={cn("surface p-4 animate-rise", !rule.enabled && "opacity-70")}>
      <div className="flex items-center gap-3">
        <AppTile appId={rule.appId} name={rule.name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{rule.name}</h3>
            {simulating && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-info">
                <span className="h-1.5 w-1.5 rounded-full bg-info animate-pulse-rec" />
                běží
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {ACTION_LABEL[rule.action]} · {cs.common.task(exercise.kind, rule.exerciseTarget, cs.ex[exercise.id].name)}
          </p>
        </div>
        {variant === "full" ? (
          <Switch
            checked={rule.enabled}
            onCheckedChange={(v) => pauzaActions.updateRule(rule.id, { enabled: v })}
            aria-label={`Limit pro ${rule.name} ${rule.enabled ? "zapnut" : "vypnut"}`}
          />
        ) : (
          <RuleStatusBadge status={status} />
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-bold tabular leading-none">
            {formatMinutes(rule.usedMinutes)}
            <span className="ml-1 text-sm font-medium text-muted-foreground">/ {formatMinutes(effectiveLimit(rule))}</span>
          </p>
          {rule.bonusMinutes > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-primary">vč. +{rule.bonusMinutes} min za pohyb</p>
          )}
        </div>
        <p className={cn("text-sm font-semibold", remaining === 0 ? "text-destructive" : "text-foreground")}>
          {remaining === 0 ? "Hotovo na dnes" : `zbývá ${formatMinutes(remaining)}`}
        </p>
      </div>
      <Progress
        value={usageRatio(rule) * 100}
        className="mt-2 h-2.5"
        indicatorClassName={statusIndicatorClass(status)}
        aria-label={`Využito ${Math.round(usageRatio(rule) * 100)} % limitu`}
      />

      {variant === "full" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <RuleStatusBadge status={status} />
          <div className="ml-auto flex gap-1.5">
            <Button
              size="sm"
              variant="soft"
              onClick={() => addUsage(rule.id, 5)}
              disabled={!rule.enabled}
              aria-label={`Simulovat 5 minut v aplikaci ${rule.name}`}
            >
              <Plus /> 5 min
            </Button>
            <Button
              size="icon"
              variant="soft"
              onClick={() => pauzaActions.setSimulating(simulating ? null : rule.id)}
              disabled={!rule.enabled || (status === "expired" && rule.action !== "reminder")}
              aria-label={simulating ? "Zastavit simulaci" : "Spustit simulaci"}
            >
              {simulating ? <Pause /> : <Play />}
            </Button>
            <Button size="icon" variant="soft" onClick={() => pauzaActions.resetUsage(rule.id)} aria-label="Vynulovat dnešní využití">
              <RotateCcw />
            </Button>
            <Button size="icon" variant="soft" onClick={() => onEdit?.(rule)} aria-label={`Upravit limit ${rule.name}`}>
              <Pencil />
            </Button>
            <Button
              size="icon"
              variant="soft"
              className="hover:text-destructive"
              onClick={() => pauzaActions.deleteRule(rule.id)}
              aria-label={`Smazat limit ${rule.name}`}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      )}

      {status === "expired" && rule.action === "exercise" && (
        <Button asChild variant="hero" className="mt-4 w-full">
          <Link to="/pauza" search={{ pravidlo: rule.id }}>
            Pohnout se a získat bonusové minuty
          </Link>
        </Button>
      )}
    </article>
  );
}
