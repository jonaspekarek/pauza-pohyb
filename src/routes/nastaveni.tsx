import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Database, RotateCcw, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { HelpAccordion } from "@/components/pauza/HelpAccordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { pauzaActions, usePauzaState } from "@/lib/pauza/store";
import { getUsageProvider } from "@/lib/pauza/usage-provider";

export const Route = createFileRoute("/nastaveni")({
  head: () => ({
    meta: [
      { title: "Nastavení – Pauza & Pohyb" },
      { name: "description", content: "Nastavení odměn a kamery, nápověda, omezení prototypu a informace o soukromí." },
      { property: "og:title", content: "Nastavení – Pauza & Pohyb" },
      { property: "og:description", content: "Nastavení, nápověda a informace o soukromí prototypu Pauza & Pohyb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = usePauzaState();
  const provider = getUsageProvider();

  return (
    <div className="space-y-5">
      <div className="animate-rise">
        <h1 className="text-[28px] font-bold leading-tight">Nastavení</h1>
        <p className="text-sm text-muted-foreground">Vše se ukládá jen v tomto zařízení.</p>
      </div>

      <section className="surface space-y-5 p-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-semibold">
            Jak vám máme říkat?
          </Label>
          <Input
            id="name"
            placeholder="Vaše jméno (nepovinné)"
            value={settings.userName}
            maxLength={24}
            onChange={(e) => pauzaActions.updateSettings({ userName: e.target.value })}
            className="h-11 rounded-xl bg-background"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <Label className="text-sm font-semibold">Odměna za pohybovou pauzu</Label>
            <span className="font-display text-xl font-bold tabular text-primary">+{settings.rewardMinutes} min</span>
          </div>
          <Slider
            min={0}
            max={30}
            step={5}
            value={[settings.rewardMinutes]}
            onValueChange={([v]) => v !== undefined && pauzaActions.updateSettings({ rewardMinutes: v })}
            aria-label="Bonusové minuty za dokončenou pauzu"
          />
          <p className="text-xs text-muted-foreground">Přidá se k limitu aplikace s akcí „Pohybová pauza“.</p>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Label htmlFor="cam" className="text-sm font-semibold">
              Zpětná vazba z kamery
            </Label>
            <p className="text-xs text-muted-foreground">
              Orientační rozpoznání dřepů přímo v zařízení. Kamera se i tak zapíná jen na váš pokyn.
            </p>
          </div>
          <Switch
            id="cam"
            checked={settings.cameraFeedback}
            onCheckedChange={(v) => pauzaActions.updateSettings({ cameraFeedback: v })}
          />
        </div>
      </section>

      <section className="surface p-4">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-info" aria-hidden />
          <h2 className="text-sm font-semibold">Zdroj dat o využití</h2>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Zdroj" value={provider.label} />
          <Row label="Čte skutečný čas v aplikacích" value={provider.readsRealUsage ? "Ano" : "Ne"} />
          <Row label="Umí blokovat jiné aplikace" value={provider.canBlockApps ? "Ano" : "Ne"} />
        </dl>
        <p className="mt-3 flex gap-2 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
          <Smartphone className="h-4 w-4 shrink-0 text-foreground" aria-hidden />
          Skutečné měření by umožnila až nativní aplikace pro Android (UsageStats) nebo iOS (Čas u obrazovky), vždy s vaším
          výslovným povolením.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Nápověda a soukromí</h2>
        <HelpAccordion defaultOpen="omezeni" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Button variant="soft" size="xl" onClick={() => pauzaActions.updateSettings({ onboarded: false })}>
          <BookOpen /> Úvod znovu
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="soft" size="xl">
              <RotateCcw /> Ukázková data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-border bg-card sm:max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Obnovit ukázková data?</AlertDialogTitle>
              <AlertDialogDescription>
                Vaše limity, historie a nastavení v tomto zařízení se nahradí ukázkovými daty.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Zrušit</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  pauzaActions.resetDemo();
                  toast.success("Ukázková data obnovena");
                }}
              >
                Obnovit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <p className="pb-2 text-center text-[11px] text-muted-foreground">Pauza &amp; Pohyb · webový prototyp · verze 0.1</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );
}
