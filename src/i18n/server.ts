import { cookies, headers } from "next/headers";
import { isLocale, isTheme, LOCALE_COOKIE, pickLocale, THEME_COOKIE, type Locale, type Theme } from "./config";
import { dictionaries } from "./messages";

/** The visitor's language: their saved choice, otherwise their browser's preference. */
export async function getLocale(): Promise<Locale> {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return pickLocale((await headers()).get("accept-language"));
}

export async function getTheme(): Promise<Theme> {
  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  return isTheme(saved) ? saved : "system";
}

/** Dictionary for Server Components and Server Actions. */
export async function getT() {
  return dictionaries[await getLocale()];
}
