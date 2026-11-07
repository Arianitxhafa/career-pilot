"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLocale, isTheme, LOCALE_COOKIE, THEME_COOKIE } from "./config";

const YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { maxAge: YEAR, path: "/", sameSite: "lax" });
  revalidatePath("/", "layout");
}

export async function setTheme(theme: string) {
  if (!isTheme(theme)) return;
  (await cookies()).set(THEME_COOKIE, theme, { maxAge: YEAR, path: "/", sameSite: "lax" });
}
