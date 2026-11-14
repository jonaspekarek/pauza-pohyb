import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { toast } from "sonner";
import { pauzaActions } from "@/lib/pauza/store";

/** Adds simulated usage and reacts when a limit expires (break screen or gentle reminder). */
export function useAddUsage() {
  const navigate = useNavigate();
  return useCallback(
    (ruleId: string, minutes: number) => {
      const { crossed, rule } = pauzaActions.addUsage(ruleId, minutes);
      if (!crossed || !rule) return;
      if (rule.action === "reminder") {
        toast(`Limit pro ${rule.name} vypršel`, {
          description: "Jen připomínka – co třeba krátká pauza a protažení?",
        });
        return;
      }
      pauzaActions.setSimulating(null);
      navigate({ to: "/pauza", search: { pravidlo: rule.id } });
    },
    [navigate],
  );
}
