import { cs } from "@/lib/i18n/cs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { APP_CATALOG } from "@/lib/pauza/apps";
import {
  clampRequiredTarget,
  getExercise,
  isRequiredAllowed,
  NEW_RULE_EXERCISE_ID,
  REQUIRED_EXERCISE_IDS,
  requiredDefaultTarget,
  requiredTargetBounds,
} from "@/lib/pauza/exercises";
import { formatMinutes } from "@/lib/pauza/logic";
import { pauzaActions, type RuleInput } from "@/lib/pauza/store";
import type { AppRule, ExerciseId, LimitAction } from "@/lib/pauza/types";
import { cn } from "@/lib/utils";
import { AppTile } from "./AppTile";
import { ExerciseFigure } from "./ExerciseFigure";
import { ACTION_DESCRIPTION, ACTION_LABEL } from "./RuleStatus";
import { DemoBadge } from "./DemoBadge";

const EMPTY: RuleInput = { appId: "tiktok", name: "TikTok", limitMinutes: 30, action: "exercise", exerciseId: NEW_RULE_EXERCISE_ID, exerciseTarget: requiredDefaultTarget(NEW_RULE_EXERCISE_ID), autoCamera: true };

export function RuleSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: AppRule | null;
}) {
  const [form, setForm] = useState<RuleInput>(EMPTY);
  const [customName, setCustomName] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        appId: editing.appId,
        name: editing.name,
        limitMinutes: editing.limitMinutes,
        action: editing.action,
        exerciseId: editing.exerciseId,
        exerciseTarget: isRequiredAllowed(editing.exerciseId)
          ? clampRequiredTarget(editing.exerciseId, editing.exerciseTarget)
          : editing.exerciseTarget,
        autoCamera: editing.autoCamera,
      });
      setCustomName(editing.appId === "custom" ? editing.name : "");
    } else {
      setForm(EMPTY);
      setCustomName("");
    }
  }, [open, editing]);

  const isCustom = form.appId === "custom";
  const name = isCustom ? customName.trim() : form.name;
  const exerciseOk = isRequiredAllowed(form.exerciseId);
  const canSave = name.length > 0 && form.limitMinutes >= 5 && exerciseOk;
  const reqName = (id: ExerciseId) => (id === "beh-na-miste" ? cs.requiredBreak.walkName : cs.ex[id].name);

  function save() {
    if (!canSave) return;
    const input = { ...form, name, exerciseTarget: clampRequiredTarget(form.exerciseId, form.exerciseTarget) };
    if (editing) {
      pauzaActions.updateRule(editing.id, { ...input, breakTriggered: false });
      toast.success(`Limit pro ${name} upraven`);
    } else {
      pauzaActions.addRule(input);
      toast.success(`Limit pro ${name} přidán`, { description: `${formatMinutes(input.limitMinutes)} denně` });
    }
    onOpenChange(false);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="mx-auto max-h-[92dvh] max-w-md rounded-t-3xl border-border bg-card">
        <DrawerHeader className="text-left">
          <div className="flex items-center gap-2">
            <DrawerTitle className="font-display text-xl">{editing ? "Upravit limit" : "Nový limit"}</DrawerTitle>
            <DemoBadge />
          </div>
          <DrawerDescription>
            Ve webovém prototypu se využití jen simuluje – skutečné aplikace v telefonu se nesledují.
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6 overflow-y-auto px-4 pb-2">
          <section>
            <Label className="mb-2 block text-sm font-semibold">Aplikace</Label>
            <div className="grid grid-cols-5 gap-2">
              {APP_CATALOG.map((app) => {
                const active = form.appId === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm((f) => ({ ...f, appId: app.id, name: app.name }))}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] transition-colors",
                      active ? "border-primary bg-primary/10 text-foreground" : "border-transparent text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <AppTile appId={app.id} name={app.name} size="sm" />
                    <span className="w-full truncate text-center">{app.name}</span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={isCustom}
                onClick={() => setForm((f) => ({ ...f, appId: "custom", name: customName }))}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] transition-colors",
                  isCustom ? "border-primary bg-primary/10 text-foreground" : "border-dashed border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-base font-bold">+</span>
                <span>Vlastní</span>
              </button>
            </div>
            {isCustom && (
              <div className="mt-3">
                <Label htmlFor="custom-app" className="sr-only">
                  Název aplikace
                </Label>
                <Input
                  id="custom-app"
                  autoFocus
                  placeholder="Název aplikace, např. Reddit"
                  value={customName}
                  maxLength={30}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="h-11 rounded-xl bg-background"
                />
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <Label className="text-sm font-semibold">Denní limit</Label>
              <span className="font-display text-2xl font-bold tabular text-primary">{formatMinutes(form.limitMinutes)}</span>
            </div>
            <Slider
              min={5}
              max={240}
              step={5}
              value={[form.limitMinutes]}
              onValueChange={([v]) => setForm((f) => ({ ...f, limitMinutes: v ?? f.limitMinutes }))}
              aria-label="Denní limit v minutách"
            />
            <div className="mt-3 flex gap-2">
              {[15, 30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, limitMinutes: m }))}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-colors",
                    form.limitMinutes === m ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </section>

          <section>
            <Label className="mb-2 block text-sm font-semibold">Co se stane po vypršení</Label>
            <RadioGroup
              value={form.action}
              onValueChange={(v) => setForm((f) => ({ ...f, action: v as LimitAction }))}
              className="gap-2"
            >
              {(Object.keys(ACTION_LABEL) as LimitAction[]).map((a) => (
                <Label
                  key={a}
                  htmlFor={`action-${a}`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                    form.action === a ? "border-primary bg-primary/5" : "border-border hover:bg-secondary",
                  )}
                >
                  <RadioGroupItem id={`action-${a}`} value={a} className="mt-0.5" />
                  <span>
                    <span className="block text-sm font-semibold">{ACTION_LABEL[a]}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{ACTION_DESCRIPTION[a]}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </section>

          <section>
            <Label className="mb-1 block text-sm font-semibold">Cvik pro pauzu</Label>
            <p className="mb-2 text-xs text-muted-foreground">{cs.requiredBreak.onlySafe}</p>
            {!exerciseOk && (
              <p role="alert" className="mb-2 rounded-xl border border-info/40 bg-info/10 p-2.5 text-xs">
                {cs.requiredBreak.legacyEditWarning(cs.ex[form.exerciseId]?.name ?? form.exerciseId)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {REQUIRED_EXERCISE_IDS.map((id) => {
                const e = getExercise(id);
                const active = form.exerciseId === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setForm((f) => ({ ...f, exerciseId: e.id, exerciseTarget: requiredDefaultTarget(e.id) }))}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors",
                      active ? "border-primary bg-primary/10" : "border-border hover:bg-secondary",
                    )}
                  >
                    <span className="w-10 shrink-0"><ExerciseFigure figure={e.figure} /></span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">{reqName(e.id)}</span>
                      <span className="block text-[11px] text-muted-foreground">{cs.common.target(e.kind, requiredDefaultTarget(e.id))}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {exerciseOk && <section>
            <div className="mb-2 flex items-baseline justify-between">
              <Label className="text-sm font-semibold">Kolik toho musíte udělat</Label>
              <span className="font-display text-2xl font-bold tabular text-primary">
                {cs.common.target(getExercise(form.exerciseId).kind, form.exerciseTarget)}
              </span>
            </div>
            {(() => {
              const b = requiredTargetBounds(form.exerciseId);
              const change = (d: number) =>
                setForm((f) => ({ ...f, exerciseTarget: Math.min(b.max, Math.max(b.min, f.exerciseTarget + d)) }));
              return (
                <div className="flex items-center gap-3">
                  <Button type="button" variant="soft" size="iconLg" aria-label="Méně" onClick={() => change(-b.step)}>−</Button>
                  <Slider
                    min={b.min}
                    max={b.max}
                    step={b.step}
                    value={[form.exerciseTarget]}
                    onValueChange={([v]) => setForm((f) => ({ ...f, exerciseTarget: v ?? f.exerciseTarget }))}
                    aria-label="Počet opakování nebo sekund"
                  />
                  <Button type="button" variant="soft" size="iconLg" aria-label="Více" onClick={() => change(b.step)}>+</Button>
                </div>
              );
            })()}
            {form.action === "exercise" && (
              <label className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-border p-3">
                <span>
                  <span className="block text-sm font-semibold">Zapnout kameru při pauze</span>
                  <span className="block text-xs text-muted-foreground">
                    Po stisknutí „Začít“ se rovnou zapne kamera. Nic se nenahrává.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-primary"
                  checked={form.autoCamera}
                  onChange={(e) => setForm((f) => ({ ...f, autoCamera: e.target.checked }))}
                />
              </label>
            )}
          </section>}
        </div>

        <DrawerFooter className="safe-bottom flex-row gap-2">
          <Button variant="calm" size="xl" className="flex-1" onClick={() => onOpenChange(false)}>
            Zrušit
          </Button>
          <Button variant="hero" size="xl" className="flex-[2]" onClick={save} disabled={!canSave}>
            {editing ? "Uložit změny" : "Přidat limit"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
