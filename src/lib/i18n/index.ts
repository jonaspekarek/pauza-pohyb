import { usePauzaState } from "@/lib/pauza/store";
import type { Lang } from "@/lib/pauza/types";
import { cs, type Dict } from "./cs";

export type { Dict };

// English and Spanish dictionaries are not written yet; every language falls back to Czech.
export const DICTS: Record<Lang, Dict> = { cs, en: cs, es: cs };

/** Current language, its dictionary and Intl locale. */
export function useI18n() {
  const lang = usePauzaState().settings.language;
  const t = DICTS[lang] ?? cs;
  return { lang, t, locale: t.locale };
}
