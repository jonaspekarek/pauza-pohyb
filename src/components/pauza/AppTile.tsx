import { appVisual } from "@/lib/pauza/apps";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  "app-1": "bg-app-1",
  "app-2": "bg-app-2",
  "app-3": "bg-app-3",
  "app-4": "bg-app-4",
  "app-5": "bg-app-5",
  "app-6": "bg-app-6",
} as const;

export function AppTile({
  appId,
  name,
  size = "md",
  className,
}: {
  appId: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { initials, tone } = appVisual(appId, name);
  return (
    <div
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center font-display font-bold text-background",
        TONE_CLASS[tone],
        size === "sm" && "h-8 w-8 rounded-lg text-xs",
        size === "md" && "h-11 w-11 rounded-xl text-sm",
        size === "lg" && "h-14 w-14 rounded-2xl text-lg",
        className,
      )}
    >
      {initials}
    </div>
  );
}
