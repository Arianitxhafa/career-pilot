"use client";

import { useState, useTransition } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { setLocale, setTheme } from "@/i18n/actions";
import { useLocale, useSavedTheme, useT } from "@/i18n/client";
import { LOCALES, type Theme } from "@/i18n/config";

const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const ICON = { system: Monitor, light: Sun, dark: Moon };

/** Theme (system → light → dark) and language (SQ / EN) switches. */
export function Preferences({ className = "" }: { className?: string }) {
  const t = useT().prefs;
  const locale = useLocale();
  const [theme, setLocalTheme] = useState(useSavedTheme());
  const [pending, start] = useTransition();
  const Icon = ICON[theme];

  const cycleTheme = () => {
    const next = NEXT[theme];
    setLocalTheme(next);
    // Apply at once; the cookie makes the server render the same theme next time.
    if (next === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
    void setTheme(next);
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={cycleTheme}
        className="grid size-9 place-items-center rounded-xl border border-line bg-surface text-muted transition hover:border-brand/40 hover:text-fg"
        aria-label={`${t.theme}: ${t.themes[theme]}. ${t.switchTo} ${t.themes[NEXT[theme]]}`}
        title={`${t.theme}: ${t.themes[theme]}`}
      >
        <Icon className="size-4" />
      </button>
      <div role="group" aria-label={t.language} className={`flex rounded-xl border border-line bg-surface p-0.5 font-mono text-[11px] font-bold transition ${pending ? "opacity-60" : ""}`}>
        {LOCALES.map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={locale === l}
            disabled={pending}
            onClick={() => locale !== l && start(() => setLocale(l))}
            className={`rounded-lg px-2 py-1.5 tracking-wider uppercase transition ${locale === l ? "bg-brand text-brand-ink" : "text-muted hover:text-fg"}`}
            title={l === "sq" ? "Shqip" : "English"}
          >
            {l === "sq" ? "SQ" : "EN"}
          </button>
        ))}
      </div>
    </div>
  );
}
