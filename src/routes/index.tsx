import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Flame, TimerReset, Footprints, Gift, Pause, Play, Sparkles } from "lucide-react";
import { AppTile } from "@/components/pauza/AppTile";
import { DemoBadge } from "@/components/pauza/DemoBadge";
import { ProgressRing } from "@/components/pauza/ProgressRing";
import { RuleCard } from "@/components/pauza/RuleCard";
import { Button } from "@/components/ui/button";
import { computeStreak, formatMinutes, plural, remainingMinutes, ruleStatus, todayKey } from "@/lib/pauza/logic";
import { pauzaActions, usePauzaState } from "@/lib/pauza/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Přehled – Pauza & Pohyb" },
      { name: "description", content: "Dnešní čas v hlídaných aplikacích, zbývající limity a pohybové pauzy na jednom místě." },
      { property: "og:title", content: "Přehled – Pauza & Pohyb" },
      { property: "og:description", content: "Dnešní čas v aplikacích, limity a pohybové pauzy na jednom místě." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const state = usePauzaState();
  const { rules, history, settings, simulatingRuleId, hydrated } = state;
  const active = rules.filter((r) => r.enabled);
  const used = active.reduce((s, r) => s + r.usedMinutes, 0);
  const limit = active.reduce((s, r) => s + r.limitMinutes + r.bonusMinutes, 0);
  const ratio = limit > 0 ? used / limit : 0;
  const expiredCount = active.filter((r) => ruleStatus(r) === "expired").length;

  const today = hydrated ? todayKey() : null;
  const todays = today ? history.filter((h) => h.completed && todayKey(new Date(h.at)) === today) : [];
  const streak = today ? computeStreak(history, today) : 0;
  const bonusToday = todays.reduce((s, h) => s + h.bonusGranted, 0);
  const simRule = rules.find((r) => r.id === simulatingRuleId);
  const rawDate = hydrated
    ? new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
    : "\u00a0";
  const dateLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <div className="space-y-5">
      <section className="animate-rise">
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
        <h1 className="text-[28px] font-bold leading-tight">Ahoj{settings.userName ? `, ${settings.userName}` : ""}!</h1>
      </section>

      <section className="surface bg-gradient-hero relative overflow-hidden p-5 animate-rise">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Dnes v hlídaných aplikacích</h2>
          <DemoBadge />
        </div>
        <div className="mt-4 flex items-center gap-5">
          <ProgressRing value={ratio} size={132} stroke={12} tone={ratio >= 1 ? "destructive" : ratio >= 0.8 ? "warning" : "primary"}>
            <div>
              <p className="font-display text-[28px] font-bold leading-tight tabular leading-none">{Math.round(ratio * 100)}%</p>
              <p className="mt-1 text-[11px] text-muted-foreground">limitu</p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-display text-2xl font-bold tabular">{formatMinutes(used)}</p>
              <p className="text-xs text-muted-foreground">z {formatMinutes(limit)} celkem</p>
            </div>
            <p className={cn("text-sm font-medium", expiredCount > 0 ? "text-warning" : "text-primary")}>
              {expiredCount > 0
                ? `${expiredCount} ${plural(expiredCount, "limit vyčerpán", "limity vyčerpány", "limitů vyčerpáno")} – čas se hýbat!`
                : "Všechny limity v pohodě."}
            </p>
          </div>
        </div>
      </section>

      <NextStep
        expiredName={active.find((r) => ruleStatus(r) === "expired" && !r.ignoredToday)?.name}
        warningRule={active.find((r) => ruleStatus(r) === "warning")}
        hasRules={rules.length > 0}
        breaksToday={todays.length}
      />

      <section className="grid grid-cols-3 gap-3">
        <Stat icon={Footprints} value={hydrated ? String(todays.length) : "–"} label={plural(todays.length, "pauza dnes", "pauzy dnes", "pauz dnes")} />
        <Stat icon={Flame} value={hydrated ? String(streak) : "–"} label={`${plural(streak, "den", "dny", "dní")} v řadě`} />
        <Stat icon={Gift} value={hydrated ? `+${bonusToday}` : "–"} label="min za pohyb" />
      </section>

      <section className="surface p-4 animate-rise">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Simulace používání</h2>
            <p className="text-xs text-muted-foreground">1 sekunda = 1 minuta v aplikaci</p>
          </div>
          <DemoBadge />
        </div>
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {active.map((r) => {
            const selected = simulatingRuleId === r.id;
            const blocked = ruleStatus(r) === "expired" && r.action !== "reminder";
            return (
              <button
                key={r.id}
                type="button"
                disabled={blocked}
                onClick={() => pauzaActions.setSimulating(selected ? null : r.id)}
                aria-pressed={selected}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-semibold transition-colors disabled:opacity-40",
                  selected ? "border-primary bg-primary/10" : "border-border hover:bg-secondary",
                )}
              >
                <AppTile appId={r.appId} name={r.name} size="sm" className="h-7 w-7 rounded-full text-[10px]" />
                {r.name}
                {selected ? <Pause className="h-3.5 w-3.5 text-primary" /> : <Play className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
        {simRule ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-info/10 p-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-info animate-pulse-rec" />
            <p className="flex-1 text-sm">
              Simulujeme <strong>{simRule.name}</strong> – zbývá{" "}
              <span className="font-bold tabular">{formatMinutes(remainingMinutes(simRule))}</span>
            </p>
            <Button size="sm" variant="soft" onClick={() => pauzaActions.setSimulating(null)}>
              Zastavit
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Vyberte aplikaci a sledujte, co se stane po vypršení limitu. Skutečné aplikace v telefonu se nesledují.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Vaše limity</h2>
          <Link to="/limity" className="flex items-center gap-1 text-sm font-semibold text-primary">
            Spravovat <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {rules.length === 0 ? (
          <div className="surface p-6 text-center">
            <p className="text-sm text-muted-foreground">Zatím nemáte žádný limit.</p>
            <Button asChild variant="hero" className="mt-3">
              <Link to="/limity">Přidat první limit</Link>
            </Button>
          </div>
        ) : (
          rules.map((r) => <RuleCard key={r.id} rule={r} simulating={simulatingRuleId === r.id} />)
        )}
      </section>

      <Link
        to="/pauza"
        className="surface group flex items-center gap-4 p-4 transition-colors hover:bg-card-elevated"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-lime text-primary-foreground shadow-glow">
          <Sparkles className="h-6 w-6" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Pauza hned teď</span>
          <span className="block text-xs text-muted-foreground">Minuta pohybu, kdykoli se vám chce</span>
        </span>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon: typeof Flame; value: string; label: string }) {
  return (
    <div className="surface p-3 animate-rise">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 font-display text-2xl font-bold tabular leading-none">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function NextStep({
  expiredName,
  warningRule,
  hasRules,
  breaksToday,
}: {
  expiredName: string | undefined;
  warningRule: { name: string; usedMinutes: number; limitMinutes: number; bonusMinutes: number } | undefined;
  hasRules: boolean;
  breaksToday: number;
}) {
  let title: string;
  let text: string;
  let to: "/pauza" | "/limity" = "/pauza";
  let cta = "Začít pauzu";
  let Icon = Dumbbell;
  if (!hasRules) {
    title = "Nastavte první limit";
    text = "Vyberte aplikaci a denní čas, který jí chcete dát.";
    to = "/limity";
    cta = "Přidat limit";
    Icon = TimerReset;
  } else if (expiredName) {
    title = `Limit pro ${expiredName} vypršel`;
    text = "Krátká pohybová pauza vám přidá bonusové minuty.";
  } else if (warningRule) {
    const left = Math.max(0, warningRule.limitMinutes + warningRule.bonusMinutes - warningRule.usedMinutes);
    title = `${warningRule.name}: zbývá ${formatMinutes(left)}`;
    text = "Protáhněte se ještě předtím, než čas doběhne.";
  } else if (breaksToday === 0) {
    title = "Dnes ještě žádná pauza";
    text = "Minuta pohybu stačí – kdykoli se vám to hodí.";
  } else {
    title = "Jde vám to skvěle";
    text = `Dnes máte za sebou ${breaksToday} ${plural(breaksToday, "pauzu", "pauzy", "pauz")}. Další je dobrovolná.`;
  }
  return (
    <section aria-labelledby="next-step" className="surface flex items-center gap-4 p-4 animate-rise">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Další krok</p>
        <h2 id="next-step" className="text-base font-semibold leading-snug">{title}</h2>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
      <Button asChild size="sm" variant="hero" className="shrink-0">
        <Link to={to}>{cta}</Link>
      </Button>
    </section>
  );
}
