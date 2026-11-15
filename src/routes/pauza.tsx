import { cs } from "@/lib/i18n/cs";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Camera, Check, HandHeart, Hand, Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppTile } from "@/components/pauza/AppTile";
import { CameraCoach } from "@/components/pauza/CameraCoach";
import { DemoBadge } from "@/components/pauza/DemoBadge";
import { ProgressRing } from "@/components/pauza/ProgressRing";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EXERCISES, getExercise } from "@/lib/pauza/exercises";
import { formatClock } from "@/lib/pauza/logic";
import { pauzaActions, usePauzaState } from "@/lib/pauza/store";
import type { ExerciseId } from "@/lib/pauza/types";
import { cn } from "@/lib/utils";

type PauzaSearch = { pravidlo?: string | undefined; cvik?: string | undefined };

export const Route = createFileRoute("/pauza")({
  validateSearch: (search: Record<string, unknown>): PauzaSearch => ({
    pravidlo: typeof search["pravidlo"] === "string" ? search["pravidlo"] : undefined,
    cvik: typeof search["cvik"] === "string" ? search["cvik"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pohybová pauza – Pauza & Pohyb" },
      { name: "description", content: "Krátká pohybová pauza s časovačem, počítadlem opakování a volitelnou kamerou." },
      { property: "og:title", content: "Pohybová pauza – Pauza & Pohyb" },
      { property: "og:description", content: "Minuta pohybu místo dalšího scrollování." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BreakPage,
});

type Phase = "active" | "done" | "skipped";

function BreakPage() {
  const { pravidlo, cvik } = Route.useSearch();
  const navigate = useNavigate();
  const { rules, settings } = usePauzaState();
  const rule = rules.find((r) => r.id === pravidlo);

  const [exerciseId, setExerciseId] = useState<ExerciseId>(getExercise(cvik ?? rule?.exerciseId).id);
  const exercise = getExercise(exerciseId);
  const target = rule && rule.exerciseId === exercise.id ? rule.exerciseTarget : exercise.target;
  const [mode, setMode] = useState<"manual" | "camera">("manual");
  const [phase, setPhase] = useState<Phase>("active");
  const [count, setCount] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(target);
  const [running, setRunning] = useState(false);
  const [bonus, setBonus] = useState(0);
  const endRef = useRef<number | null>(null);

  // Reset progress when the exercise changes.
  useEffect(() => {
    setCount(0);
    setSecondsLeft(target);
    setRunning(false);
    endRef.current = null;
  }, [exercise.id, target]);

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + secondsLeft * 1000;
    const t = window.setInterval(() => {
      const left = Math.max(0, ((endRef.current ?? 0) - Date.now()) / 1000);
      setSecondsLeft(left);
      if (left <= 0) {
        setRunning(false);
        navigator.vibrate?.(200);
      }
    }, 200);
    return () => window.clearInterval(t);
    // secondsLeft intentionally read only when (re)starting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const reached = exercise.kind === "reps" ? count >= target : secondsLeft <= 0;
  const progress = exercise.kind === "reps" ? count / target : 1 - secondsLeft / target;

  function complete() {
    setRunning(false);
    const { bonus: granted } = pauzaActions.logBreak({
      exerciseId: exercise.id,
      ruleId: rule?.id,
      mode,
      completed: true,
      amount: exercise.kind === "reps" ? count : Math.round(target - secondsLeft),
    });
    setBonus(granted);
    setPhase("done");
  }

  function skip() {
    setRunning(false);
    pauzaActions.logBreak({ exerciseId: exercise.id, ruleId: rule?.id, mode, completed: false });
    setPhase("skipped");
  }

  if (phase === "done") {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-primary/25 blur-2xl animate-breathe" aria-hidden />
            <span className="relative grid h-28 w-28 place-items-center rounded-full bg-gradient-lime text-primary-foreground shadow-glow animate-pop">
              <Check className="h-14 w-14" strokeWidth={3} aria-hidden />
            </span>
          </div>
          <h1 className="mt-8 text-4xl font-extrabold">Skvělá práce!</h1>
          <p className="mt-2 max-w-xs text-muted-foreground">
            {cs.ex[exercise.id].name} hotovo. Tělo i hlava si zaslouží tyhle malé pauzy.
          </p>
          {bonus > 0 && rule && (
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
              <AppTile appId={rule.appId} name={rule.name} size="sm" />
              <p className="text-left text-sm">
                <span className="font-display text-lg font-bold text-primary">+{bonus} min</span>
                <span className="block text-muted-foreground">navíc pro {rule.name} (simulace)</span>
              </p>
            </div>
          )}
          {rule?.action === "lock" && (
            <p className="mt-6 max-w-xs text-sm text-muted-foreground">
              {rule.name} má pro dnešek pauzu. Zítra začínáte s čistým štítem.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Button variant="hero" size="xl" className="w-full" onClick={() => navigate({ to: "/" })}>
            Zpět na přehled
          </Button>
          <Button variant="calm" size="xl" className="w-full" onClick={() => {
              setCount(0);
              setSecondsLeft(target);
              setPhase("active");
            }}
          >
            Ještě jeden cvik
          </Button>
        </div>
      </Screen>
    );
  }

  if (phase === "skipped") {
    return (
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-info/15 text-info animate-pop">
            <HandHeart className="h-12 w-12" aria-hidden />
          </span>
          <h1 className="mt-8 text-3xl font-extrabold">To je úplně v pořádku</h1>
          <p className="mt-2 max-w-xs text-muted-foreground">
            Poslouchat své tělo je důležitější než jakýkoli cvik. Pokud bolest nebo nevolnost přetrvává, poraďte se s lékařem.
          </p>
          <div className="mt-6 max-w-xs rounded-2xl bg-secondary p-4 text-left text-sm">
            <p className="font-semibold">Zkuste třeba jen:</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• pár hlubokých nádechů u okna,</li>
              <li>• sklenici vody,</li>
              <li>• minutu procházky po bytě.</li>
            </ul>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            variant="soft"
            size="xl"
            className="w-full"
            onClick={() => {
              setExerciseId("protazeni");
              setPhase("active");
            }}
          >
            Zkusit jemné protažení
          </Button>
          <Button variant="hero" size="xl" className="w-full" onClick={() => navigate({ to: "/" })}>
            Zpět na přehled
          </Button>
        </div>
      </Screen>
    );
  }

  const Icon = exercise.icon;

  return (
    <Screen>
      <header className="flex items-center gap-3">
        <Button asChild variant="soft" size="iconLg" aria-label="Zavřít pauzu">
          <Link to="/">
            <X />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Pohybová pauza</p>
          <p className="truncate text-sm text-muted-foreground">{rule ? `Limit: ${rule.name}` : "Kdykoli se vám chce"}</p>
        </div>
        {rule && <DemoBadge />}
      </header>

      {rule && (
        <div className="surface flex items-center gap-3 p-3.5 animate-rise">
          <AppTile appId={rule.appId} name={rule.name} />
          <p className="text-sm">
            {rule.action === "lock" ? (
              <>
                Čas v <strong>{rule.name}</strong> je pro dnešek vyčerpaný (simulace zámku). Co takhle dát tělu chvilku pohybu?
              </>
            ) : (
              <>
                Limit pro <strong>{rule.name}</strong> vypršel. Krátký pohyb a máte{" "}
                <strong className="text-primary">+{settings.rewardMinutes} min</strong> navíc.
              </>
            )}
          </p>
        </div>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Vyberte cvik">
        {EXERCISES.map((e) => (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={e.id === exerciseId}
            onClick={() => setExerciseId(e.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              e.id === exerciseId ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {cs.ex[e.id].name}
          </button>
        ))}
      </div>

      <section className="surface p-4 animate-rise" key={exercise.id}>
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">{cs.ex[exercise.id].name}</h1>
            <p className="text-sm text-muted-foreground">Cíl: {cs.common.target(exercise.kind, target)}</p>
          </div>
        </div>
        <ol className="mt-3 list-decimal space-y-0.5 pl-5 text-sm text-muted-foreground">
          {cs.ex[exercise.id].steps.map((s: string) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="mt-3 rounded-xl bg-secondary p-2.5 text-xs">
          <span className="font-semibold text-primary">Lehčí varianta: </span>
          {cs.ex[exercise.id].easier}
        </p>
      </section>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "camera")}>
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-2xl bg-card p-1">
          <TabsTrigger value="manual" className="gap-1.5 rounded-xl data-[state=active]:bg-card-elevated data-[state=active]:text-foreground">
            <Hand className="h-4 w-4" aria-hidden /> Bez kamery
          </TabsTrigger>
          <TabsTrigger value="camera" className="gap-1.5 rounded-xl data-[state=active]:bg-card-elevated data-[state=active]:text-foreground">
            <Camera className="h-4 w-4" aria-hidden /> S kamerou
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "camera" && (
        <CameraCoach
          exercise={exercise}
          feedbackEnabled={settings.cameraFeedback}
          onRep={() => setCount((c) => c + 1)}
        />
      )}

      <section className="flex flex-col items-center py-2">
        <ProgressRing value={progress} size={mode === "camera" ? 170 : 230} stroke={14} tone={reached ? "primary" : "info"}>
          {exercise.kind === "time" ? (
            <div>
              <p
                className={cn(
                  "font-display font-extrabold tabular leading-none",
                  mode === "camera" ? "text-5xl" : "text-6xl",
                )}
                aria-live="off"
              >
                {formatClock(secondsLeft)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{reached ? "hotovo!" : running ? "jedeme" : "připraveno"}</p>
            </div>
          ) : (
            <div>
              <p className={cn("font-display font-extrabold tabular leading-none", mode === "camera" ? "text-5xl" : "text-6xl")}>
                {count}
                <span className="text-2xl text-muted-foreground">/{target}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{reached ? "hotovo!" : "opakování"}</p>
            </div>
          )}
        </ProgressRing>

        <div className="mt-5 flex w-full items-center justify-center gap-3">
          {exercise.kind === "time" ? (
            <>
              <Button
                variant="soft"
                size="iconLg"
                onClick={() => {
                  setRunning(false);
                  setSecondsLeft(target);
                }}
                aria-label="Začít znovu"
              >
                <RotateCcw />
              </Button>
              <Button
                variant={running ? "soft" : "hero"}
                size="xl"
                className="min-w-44"
                onClick={() => setRunning((r) => !r)}
                disabled={reached}
              >
                {running ? (
                  <>
                    <Pause /> Pozastavit
                  </>
                ) : (
                  <>
                    <Play /> {secondsLeft < target ? "Pokračovat" : "Spustit"}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="soft"
                size="iconLg"
                onClick={() => setCount((c) => Math.max(0, c - 1))}
                disabled={count === 0}
                aria-label="Odebrat opakování"
              >
                <Minus />
              </Button>
              <Button variant={reached ? "soft" : "hero"} size="xl" className="min-w-44" onClick={() => setCount((c) => c + 1)}>
                <Plus /> Opakování
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="space-y-2 pt-1">
        <Button variant={reached ? "hero" : "soft"} size="xl" className="w-full" onClick={complete}>
          <Check /> {reached ? "Hotovo!" : "Mám hotovo"}
        </Button>
        <Button variant="calm" size="xl" className="w-full" onClick={skip}>
          Necítím se dobře – přeskočit
        </Button>
        <p className="px-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          {cs.ex[exercise.id].safety} Při bolesti, závrati nebo dušnosti přestaňte.
        </p>
      </div>
    </Screen>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return <div className="safe-bottom flex min-h-dvh flex-col gap-4 px-4 pt-4">{children}</div>;
}
