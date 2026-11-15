import { usePauzaState } from "@/lib/pauza/store";
import type { Lang } from "@/lib/pauza/types";
import { cs, type Dict } from "./cs";
import { en } from "./en";
import { es } from "./es";

export type { Dict };

export const DICTS: Record<Lang, Dict> = { cs, en, es };

export const LANGUAGES: { id: Lang; label: string; flag: string }[] = [
  { id: "cs", label: "Čeština", flag: "🇨🇿" },
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];

/** Current language, its dictionary and Intl locale. */
export function useI18n() {
  const lang = usePauzaState().settings.language;
  const t = DICTS[lang] ?? cs;
  return { lang, t, locale: t.locale };
}
