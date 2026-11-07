// Language and theme preferences. Both live in cookies so the server renders the right
// language and colours on the first paint (no flash, no client-side swap).

export const LOCALES = ["en", "sq"] as const;
export type Locale = (typeof LOCALES)[number];
export const isLocale = (v: unknown): v is Locale => v === "en" || v === "sq";

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const isTheme = (v: unknown): v is Theme => v === "system" || v === "light" || v === "dark";

export const LOCALE_COOKIE = "lang";
export const THEME_COOKIE = "theme";

/** BCP 47 tag for Intl date and number formatting. */
export const intlLocale = (locale: Locale) => (locale === "sq" ? "sq-AL" : "en-GB");

/** First supported language in an Accept-Language header, by preference weight. */
export function pickLocale(acceptLanguage: string | null | undefined, fallback: Locale = "en"): Locale {
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(params.find((p) => p.trim().startsWith("q="))?.split("=")[1] ?? 1);
      return { lang: tag.split("-")[0], q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.lang)
    .sort((a, b) => b.q - a.q);
  return ranked.map((x) => x.lang).find(isLocale) ?? fallback;
}
