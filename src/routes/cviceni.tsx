import { cs } from "@/lib/i18n/cs";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CheckCircle2, ChevronRight, CircleSlash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EXERCISES, getExercise } from "@/lib/pauza/exercises";
import { usePauzaState } from "@/lib/pauza/store";

export const Route = createFileRoute("/cviceni")({
  head: () => ({
    meta: [
      { title: "Cvičení – Pauza & Pohyb" },
      { name: "description", content: "Krátké cviky pro začátečníky: dřepy, jumping jacks, plank, kliky o zeď a protažení. S lehčími variantami." },
      { property: "og:title", content: "Cvičení – Pauza & Pohyb" },
      { property: "og:description", content: "Krátké cviky pro začátečníky s lehčími variantami a volitelnou kamerou." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExercisesPage,
});

function ExercisesPage() {
  const { history, rules, hydrated } = usePauzaState();
  const recent = history.slice(0, 8);
  const fmt = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="animate-rise">
        <h1 className="text-[28px] font-bold leading-tight">Cvičení</h1>
        <p className="text-sm text-muted-foreground">Krátké cviky pro začátečníky. Vždy se můžete zastavit.</p>
      </div>

      <div className="space-y-3">
        {EXERCISES.map((e) => {
          const Icon = e.icon;
          return (
            <Collapsible key={e.id} className="surface overflow-hidden animate-rise">
              <div className="flex items-center gap-3 p-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">{cs.ex[e.id].name}</h2>
                    {e.counter && (
                      <Badge variant="outline" className="gap-1 rounded-full border-info/30 bg-info/10 px-1.5 text-[10px] text-info">
                        <Camera className="h-3 w-3" aria-hidden /> zpětná vazba
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{cs.common.target(e.kind, e.target)}</p>
                </div>
                <Button asChild size="sm" variant="hero">
                  <Link to="/pauza" search={{ cvik: e.id }}>
                    Začít
                  </Link>
                </Button>
              </div>
              <CollapsibleTrigger className="group flex w-full items-center gap-1 border-t border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                Jak na to
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 px-4 pb-4 text-sm">
                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                  {cs.ex[e.id].steps.map((s: string) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
                <p className="rounded-xl bg-secondary p-3">
                  <span className="font-semibold text-primary">Lehčí varianta: </span>
                  {cs.ex[e.id].easier}
                </p>
                <p className="text-xs text-warning">{cs.ex[e.id].safety}</p>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Historie pauz</h2>
        <div className="surface divide-y divide-border">
          {!hydrated ? (
            <p className="p-4 text-sm text-muted-foreground">Načítám…</p>
          ) : recent.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Zatím žádné pauzy.</p>
          ) : (
            recent.map((h) => {
              const ex = getExercise(h.exerciseId);
              const rule = rules.find((r) => r.id === h.ruleId);
              return (
                <div key={h.id} className="flex items-center gap-3 p-3.5">
                  {h.completed ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-label="Dokončeno" />
                  ) : (
                    <CircleSlash className="h-5 w-5 shrink-0 text-muted-foreground" aria-label="Přeskočeno" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {cs.ex[ex.id].name}
                      {h.mode === "camera" && <Camera className="ml-1.5 inline h-3.5 w-3.5 text-info" aria-label="s kamerou" />}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fmt.format(new Date(h.at))}
                      {rule ? ` · ${rule.name}` : ""}
                      {!h.completed ? " · přeskočeno, v pořádku" : ""}
                    </p>
                  </div>
                  {h.bonusGranted > 0 && <span className="text-xs font-bold text-primary">+{h.bonusGranted} min</span>}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
