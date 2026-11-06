"use client";

import { useActionState, useState, useTransition } from "react";
import { saveCv } from "@/app/dashboard/copilot-actions";

const MAX = 20000;

export function CvForm({ initialCv, updatedAt }: { initialCv: string; updatedAt: string | null }) {
  const [cv, setCv] = useState(initialCv);
  const [state, action, pending] = useActionState(saveCv, undefined);
  const [, startSave] = useTransition();
  const [submitted, setSubmitted] = useState(initialCv);
  const dirty = cv !== (state?.ok ? submitted : initialCv);

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
        aria-label="CV text"
        className="w-full resize-y rounded-2xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-fg outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {cv.length.toLocaleString()} / {MAX.toLocaleString()} characters
          {updatedAt && !dirty && ` · saved ${new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
        </p>
        <div className="flex items-center gap-3">
          {state?.ok && !dirty && <span className="text-sm text-emerald-600 dark:text-emerald-400">✓ Saved</span>}
          {state?.error && <span className="text-sm text-rose-600 dark:text-rose-400">{state.error}</span>}
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save CV"}
          </button>
        </div>
      </div>
    </form>
  );
}
