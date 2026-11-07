"use client";

import { useActionState, useState, useTransition } from "react";
import { saveCv } from "@/app/dashboard/copilot-actions";
import { useLocale, useT } from "@/i18n/client";
import { formatDate } from "@/lib/events";

const MAX = 20000;
// Thousands separators by hand: Node and the browser ship different ICU data for Albanian, which breaks hydration.
const group = (n: number, intl: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, intl === "sq" ? " " : ",");

export function CvForm({ initialCv, updatedAt }: { initialCv: string; updatedAt: string | null }) {
  const [cv, setCv] = useState(initialCv);
  const [state, action, pending] = useActionState(saveCv, undefined);
  const [, startSave] = useTransition();
  const [submitted, setSubmitted] = useState(initialCv);
  const dirty = cv !== (state?.ok ? submitted : initialCv);
  const t = useT().cv;
  const locale = useLocale();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        setSubmitted(cv);
        startSave(() => action(data));
      }}
      className="mt-6 grid gap-3"
    >
      <textarea
        name="cv_text"
        value={cv}
        onChange={(e) => setCv(e.target.value)}
        maxLength={MAX}
        rows={22}
        placeholder={"Arianit Xhafa — Software Developer\n\nPROJECTS\nRentigo — full-stack car rental platform (Node.js, SQLite)…\n\nSKILLS\nJavaScript, TypeScript, React Native…"}
        aria-label={t.label}
        className="w-full resize-y rounded-2xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-fg outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {group(cv.length, locale)} / {group(MAX, locale)} {t.chars}
          {updatedAt && !dirty && ` · ${t.savedOn} ${formatDate(new Date(updatedAt), locale, { day: true, month: "short", year: true })}`}
        </p>
        <div className="flex items-center gap-3">
          {state?.ok && !dirty && <span className="text-sm text-emerald-600 dark:text-emerald-400">{t.saved}</span>}
          {state?.error && <span className="text-sm text-rose-600 dark:text-rose-400">{state.error}</span>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? t.saving : t.save}
          </button>
        </div>
      </div>
    </form>
  );
}
