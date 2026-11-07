"use client";

import { createContext, useContext } from "react";
import type { Locale, Theme } from "./config";
import { dictionaries } from "./messages";

const PrefsContext = createContext<{ locale: Locale; theme: Theme }>({ locale: "en", theme: "system" });

/** Provided once in the root layout with the language and theme the server picked. */
export function I18nProvider({ locale, theme, children }: { locale: Locale; theme: Theme; children: React.ReactNode }) {
  return <PrefsContext value={{ locale, theme }}>{children}</PrefsContext>;
}

export const useLocale = () => useContext(PrefsContext).locale;
export const useSavedTheme = () => useContext(PrefsContext).theme;
export const useT = () => dictionaries[useLocale()];
