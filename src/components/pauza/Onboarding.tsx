import { Camera, FlaskConical, HeartHandshake, Timer } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { pauzaActions } from "@/lib/pauza/store";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Timer,
    title: "Méně scrollování, víc pohybu",
    text: "Nastavte si denní limity pro rušivé aplikace. Když vyprší, přijde krátká pohybová pauza místo výčitek.",
  },
  {
    icon: FlaskConical,
    title: "Tohle je prototyp",
    text: "Webová aplikace nevidí ani neblokuje jiné aplikace v telefonu. Čas v aplikacích tu jen simulujeme, abyste si mohli vše vyzkoušet. Skutečné sledování by vyžadovalo nativní aplikaci a vaše výslovné povolení.",
  },
  {
    icon: Camera,
    title: "Soukromí na prvním místě",
    text: "Data zůstávají jen v tomto zařízení. Kamera je volitelná, zapíná se jen na váš pokyn a nic nenahrává ani neodesílá.",
  },
  {
    icon: HeartHandshake,
    title: "Bez tlaku a bez trestů",
    text: "Cviky jsou pro začátečníky. Pauzu můžete kdykoli pozastavit nebo přeskočit – hlavně když se cítíte dobře.",
  },
];

export function Onboarding({ open }: { open: boolean }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step] ?? STEPS[0]!;
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  function finish() {
    pauzaActions.updateSettings({ onboarded: true });
    setStep(0);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-border bg-card p-6 sm:max-w-sm">
        <div key={step} className="animate-rise">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-8 w-8" aria-hidden />
          </div>
          <DialogTitle className="font-display text-2xl leading-tight">{s.title}</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.text}</DialogDescription>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Krok ${step + 1} z ${STEPS.length}`}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")}
              />
            ))}
          </div>
          <div className="flex gap-2">
            {!last && (
              <Button variant="ghost" onClick={finish}>
                Přeskočit
              </Button>
            )}
            <Button variant="hero" onClick={() => (last ? finish() : setStep(step + 1))}>
              {last ? "Začít" : "Další"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
