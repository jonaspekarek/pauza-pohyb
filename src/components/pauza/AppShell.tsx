import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Activity, Dumbbell, LayoutGrid, Settings2, Timer } from "lucide-react";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useAddUsage } from "@/hooks/use-usage-actions";
import { hydrateStore, usePauzaState } from "@/lib/pauza/store";
import { cn } from "@/lib/utils";
import { DemoBadge } from "./DemoBadge";
import { Onboarding } from "./Onboarding";

const TABS = [
  { to: "/", label: "Přehled", icon: LayoutGrid },
  { to: "/limity", label: "Limity", icon: Timer },
  { to: "/cviceni", label: "Cvičení", icon: Dumbbell },
  { to: "/nastaveni", label: "Nastavení", icon: Settings2 },
] as const;

export function AppShell() {
  const state = usePauzaState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const addUsage = useAddUsage();
  const fullscreen = pathname.startsWith("/pauza");

  useEffect(() => {
    hydrateStore();
  }, []);

  // Demo ticker: 1 second of real time = 1 simulated minute in the chosen app.
  const simId = state.simulatingRuleId;
  useEffect(() => {
    if (!simId) return;
    const t = window.setInterval(() => addUsage(simId, 1), 1000);
    return () => window.clearInterval(t);
  }, [simId, addUsage]);

  return (
    <div className="min-h-dvh bg-gradient-page">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col">
        {!fullscreen && (
          <header className="sticky top-0 z-30 flex items-center gap-2.5 bg-background/75 px-5 py-3.5 backdrop-blur-xl">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" aria-hidden />
            </span>
            <span className="truncate font-display text-base font-semibold tracking-tight">Pauza &amp; Pohyb</span>
            <DemoBadge className="ml-auto" label="Prototyp" />
          </header>
        )}

        <main className={cn("flex-1", fullscreen ? "" : "px-4 pt-2 pb-32")}>
          <Outlet />
        </main>

        {!fullscreen && (
          <nav
            aria-label="Hlavní navigace"
            className="safe-bottom fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[26rem] rounded-2xl border border-border bg-card/90 px-1.5 pt-1.5 shadow-card backdrop-blur-xl"
          >
            <ul className="grid grid-cols-4">
              {TABS.map(({ to, label, icon: Icon }) => {
                const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center gap-0.5 rounded-xl py-1 text-[11px] font-semibold transition-colors",
                        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-7 w-12 place-items-center rounded-full transition-colors",
                          active && "bg-primary/15",
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
      <Onboarding open={state.hydrated && !state.settings.onboarded} />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
