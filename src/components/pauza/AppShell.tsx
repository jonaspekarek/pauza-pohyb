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
          <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-lg">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-lime text-primary-foreground shadow-glow">
              <Activity className="h-5 w-5" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Pauza &amp; Pohyb</span>
            <DemoBadge className="ml-auto" label="Prototyp" />
          </header>
        )}

        <main className={cn("flex-1", fullscreen ? "" : "px-4 pt-4 pb-28")}>
          <Outlet />
        </main>

        {!fullscreen && (
          <nav
            aria-label="Hlavní navigace"
            className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border/60 bg-background/90 px-2 pt-1.5 backdrop-blur-lg"
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
                        "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition-colors",
                        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-8 w-14 place-items-center rounded-full transition-all",
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
