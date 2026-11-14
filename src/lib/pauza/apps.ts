export interface CatalogApp {
  id: string;
  name: string;
  initials: string;
  /** Design-token color class for the app tile. */
  tone: "app-1" | "app-2" | "app-3" | "app-4" | "app-5" | "app-6";
  category: string;
}

export const APP_CATALOG: CatalogApp[] = [
  { id: "tiktok", name: "TikTok", initials: "Tt", tone: "app-1", category: "Sociální sítě" },
  { id: "instagram", name: "Instagram", initials: "Ig", tone: "app-2", category: "Sociální sítě" },
  { id: "youtube", name: "YouTube", initials: "Yt", tone: "app-3", category: "Video" },
  { id: "roblox", name: "Roblox", initials: "Rb", tone: "app-4", category: "Hry" },
  { id: "chrome", name: "Chrome", initials: "Ch", tone: "app-5", category: "Prohlížeč" },
  { id: "hry", name: "Hry", initials: "Hr", tone: "app-6", category: "Hry" },
  { id: "snapchat", name: "Snapchat", initials: "Sc", tone: "app-6", category: "Sociální sítě" },
  { id: "netflix", name: "Netflix", initials: "Nf", tone: "app-3", category: "Video" },
  { id: "discord", name: "Discord", initials: "Dc", tone: "app-4", category: "Komunikace" },
];

const TONES: CatalogApp["tone"][] = ["app-1", "app-2", "app-3", "app-4", "app-5", "app-6"];

export function appVisual(appId: string, name: string): Pick<CatalogApp, "initials" | "tone"> {
  const found = APP_CATALOG.find((a) => a.id === appId);
  if (found) return { initials: found.initials, tone: found.tone };
  const clean = name.trim() || "?";
  const initials = ((clean[0] ?? "?").toUpperCase() + (clean[1] ?? "").toLowerCase()).trim();
  let hash = 0;
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { initials, tone: TONES[hash % TONES.length] ?? "app-1" };
}
