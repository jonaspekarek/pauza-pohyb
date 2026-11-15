import { APP_ICONS } from "./app-icons";

export type AppCategory = "social" | "video" | "games" | "music" | "chat" | "browser" | "shopping" | "other";

export interface CatalogApp {
  id: string;
  name: string;
  /** Key into APP_ICONS (real brand logo). */
  icon: string;
  category: AppCategory;
}

const A = (id: string, name: string, category: AppCategory, icon = id): CatalogApp => ({ id, name, icon, category });

export const APP_CATEGORIES: AppCategory[] = ["social", "video", "games", "music", "chat", "browser", "shopping", "other"];

/**
 * Popular apps with real logos. A web app cannot read which apps are installed
 * on the phone, so the user picks from this list or adds a custom name.
 */
export const APP_CATALOG: CatalogApp[] = [
  A("tiktok", "TikTok", "social"),
  A("instagram", "Instagram", "social"),
  A("facebook", "Facebook", "social"),
  A("snapchat", "Snapchat", "social"),
  A("x", "X (Twitter)", "social"),
  A("threads", "Threads", "social"),
  A("reddit", "Reddit", "social"),
  A("pinterest", "Pinterest", "social"),
  A("bereal", "BeReal", "social"),
  A("tumblr", "Tumblr", "social"),
  A("bluesky", "Bluesky", "social"),
  A("mastodon", "Mastodon", "social"),
  A("9gag", "9GAG", "social"),
  A("quora", "Quora", "social"),
  A("vk", "VK", "social"),
  A("youtube", "YouTube", "video"),
  A("youtubeshorts", "YouTube Shorts", "video"),
  A("netflix", "Netflix", "video"),
  A("twitch", "Twitch", "video"),
  A("hbomax", "HBO Max", "video"),
  A("appletv", "Apple TV", "video"),
  A("crunchyroll", "Crunchyroll", "video"),
  A("kick", "Kick", "video"),
  A("vimeo", "Vimeo", "video"),
  A("dailymotion", "Dailymotion", "video"),
  A("roblox", "Roblox", "games"),
  A("fortnite", "Fortnite", "games"),
  A("epicgames", "Epic Games", "games"),
  A("steam", "Steam", "games"),
  A("playstation", "PlayStation", "games"),
  A("leagueoflegends", "League of Legends", "games"),
  A("valorant", "Valorant", "games"),
  A("pubg", "PUBG Mobile", "games"),
  A("supercell", "Clash / Brawl Stars", "games"),
  A("spotify", "Spotify", "music"),
  A("applemusic", "Apple Music", "music"),
  A("youtubemusic", "YouTube Music", "music"),
  A("soundcloud", "SoundCloud", "music"),
  A("deezer", "Deezer", "music"),
  A("tidal", "TIDAL", "music"),
  A("shazam", "Shazam", "music"),
  A("whatsapp", "WhatsApp", "chat"),
  A("messenger", "Messenger", "chat"),
  A("discord", "Discord", "chat"),
  A("telegram", "Telegram", "chat"),
  A("signal", "Signal", "chat"),
  A("viber", "Viber", "chat"),
  A("wechat", "WeChat", "chat"),
  A("line", "LINE", "chat"),
  A("chrome", "Chrome", "browser", "googlechrome"),
  A("firefox", "Firefox", "browser"),
  A("safari", "Safari", "browser"),
  A("opera", "Opera", "browser"),
  A("brave", "Brave", "browser"),
  A("duckduckgo", "DuckDuckGo", "browser"),
  A("aliexpress", "AliExpress", "shopping"),
  A("ebay", "eBay", "shopping"),
  A("vinted", "Vinted", "shopping"),
  A("duolingo", "Duolingo", "other"),
  A("tinder", "Tinder", "other"),
  A("googlenews", "Google News", "other"),
  A("medium", "Medium", "other"),
  A("substack", "Substack", "other"),
  A("wattpad", "Wattpad", "other"),
  A("webtoon", "WEBTOON", "other"),
  A("audible", "Audible", "other"),
  A("googlemaps", "Google Maps", "other"),
  A("gmail", "Gmail", "other"),
  A("notion", "Notion", "other"),
  A("googlegemini", "Gemini", "other"),
  A("claude", "Claude", "other"),
];

const TONES = ["app-1", "app-2", "app-3", "app-4", "app-5", "app-6"] as const;
export type AppTone = (typeof TONES)[number];

export type AppVisual =
  | { type: "logo"; hex: string; path: string; light: boolean }
  | { type: "initials"; initials: string; tone: AppTone };

/** Perceived brightness of a #rrggbb color, 0–1. */
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function appVisual(appId: string, name: string): AppVisual {
  const found = APP_CATALOG.find((a) => a.id === appId);
  const icon = found ? APP_ICONS[found.icon] : undefined;
  if (icon) return { type: "logo", hex: icon.hex, path: icon.path, light: luminance(icon.hex) > 0.62 };
  const clean = name.trim() || "?";
  const initials = ((clean[0] ?? "?").toUpperCase() + (clean[1] ?? "").toLowerCase()).trim();
  let hash = 0;
  for (const ch of clean) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return { type: "initials", initials, tone: TONES[hash % TONES.length] ?? "app-1" };
}
