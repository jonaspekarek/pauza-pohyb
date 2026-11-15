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

const SIZE = {
  sm: "h-8 w-8 rounded-lg text-xs",
  md: "h-11 w-11 rounded-xl text-sm",
  lg: "h-14 w-14 rounded-2xl text-lg",
  xl: "h-24 w-24 rounded-3xl text-3xl",
} as const;

export function AppTile({
  appId,
  name,
  size = "md",
  className,
}: {
  appId: string;
  name: string;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const v = appVisual(appId, name);
  if (v.type === "logo") {
    return (
      <div
        aria-hidden
        // Brand colors come from the logo data itself, not from the app theme.
        style={{ backgroundColor: v.hex, color: v.light ? "#111111" : "#ffffff" }}
        className={cn("grid shrink-0 place-items-center ring-1 ring-foreground/10", SIZE[size], className)}
      >
        <svg viewBox="0 0 24 24" className="h-[58%] w-[58%]" fill="currentColor" role="img" aria-hidden>
          <path d={v.path} />
        </svg>
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={cn("grid shrink-0 place-items-center font-display font-bold text-background", TONE_CLASS[v.tone], SIZE[size], className)}
    >
      {v.initials}
    </div>
  );
}
