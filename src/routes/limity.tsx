import { createFileRoute } from "@tanstack/react-router";
import { Info, Plus } from "lucide-react";
import { useState } from "react";
import { RuleCard } from "@/components/pauza/RuleCard";
import { RuleSheet } from "@/components/pauza/RuleSheet";
import { Button } from "@/components/ui/button";
import { usePauzaState } from "@/lib/pauza/store";
import type { AppRule } from "@/lib/pauza/types";

export const Route = createFileRoute("/limity")({
  head: () => ({
    meta: [
      { title: "Limity – Pauza & Pohyb" },
      { name: "description", content: "Nastavte denní limity pro TikTok, Instagram, YouTube a další aplikace a vyberte, co se stane po vypršení." },
      { property: "og:title", content: "Limity – Pauza & Pohyb" },
      { property: "og:description", content: "Denní limity pro rušivé aplikace s pohybovou pauzou po vypršení." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LimitsPage,
});

function LimitsPage() {
  const { rules, simulatingRuleId } = usePauzaState();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppRule | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between animate-rise">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Limity</h1>
          <p className="text-sm text-muted-foreground">
            {rules.length} {rules.length === 1 ? "aplikace" : rules.length >= 2 && rules.length <= 4 ? "aplikace" : "aplikací"} pod dohledem
          </p>
        </div>
        <Button
          variant="hero"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus /> Přidat
        </Button>
      </div>

      <div className="flex gap-3 rounded-2xl border border-info/25 bg-info/10 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
        <p className="text-foreground/90">
          <strong className="text-info">Simulace:</strong> čas přidávejte tlačítkem „+5 min“ nebo spusťte ▶ simulaci.
          Webový prototyp nevidí ani neblokuje skutečné aplikace.
        </p>
      </div>

      {rules.length === 0 ? (
        <div className="surface p-8 text-center">
          <p className="font-semibold">Žádné limity</p>
          <p className="mt-1 text-sm text-muted-foreground">Přidejte aplikaci, ve které chcete trávit méně času.</p>
        </div>
      ) : (
        rules.map((r) => (
          <RuleCard
            key={r.id}
            rule={r}
            variant="full"
            simulating={simulatingRuleId === r.id}
            onEdit={(rule) => {
              setEditing(rule);
              setOpen(true);
            }}
          />
        ))
      )}

      <RuleSheet open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}
