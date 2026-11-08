"use client";

import { useState, useTransition } from "react";
import { Link2 } from "lucide-react";
import { importJobFromLink } from "@/app/dashboard/import-actions";
import { useLocale, useT } from "@/i18n/client";
import { inputClass, secondaryButton } from "./ui";

type Notice = { tone: "ok" | "warn" | "error"; text: string } | null;
const group = (n: number, locale: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, locale === "sq" ? " " : ",");

/** "Import from a job link" for the new-application form: fills the form's fields by name. */
export function ImportFromLink({ form }: { form: React.RefObject<HTMLFormElement | null> }) {
  const t = useT().importJob;
  const locale = useLocale();
  const [link, setLink] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [postChars, setPostChars] = useState(0);
  const [pending, start] = useTransition();

  const set = (name: string, value: string | null | undefined) => {
    const el = form.current?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
    if (el && value) el.value = value;
  };

  const run = () => {
    if (!link.trim() || pending) return;
    start(async () => {
      const res = await importJobFromLink(link);
      if (res.url) set("job_url", res.url);
      if (!res.job) {
        setPostChars(0);
        return setNotice({ tone: "error", text: res.error ?? t.errors.nothing });
      }
      const j = res.job;
      set("company", j.company);
      set("position", j.position);
      set("location", j.location);
      set("salary_range", j.salary_range);
      set("job_description", j.job_description);
      setPostChars(j.source === "jsonld" ? (j.job_description?.length ?? 0) : 0);
      setNotice(j.source === "jsonld" ? { tone: "ok", text: t.done } : { tone: "warn", text: t.partial });
    });
  };

  return (
    <div className="grid gap-2 rounded-2xl border border-dashed border-brand/40 bg-brand-soft/40 p-3.5">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="size-4 text-brand" aria-hidden /> {t.title}
        </p>
        <p className="mt-0.5 text-xs text-muted">{t.hint}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          inputMode="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          // Enter imports instead of submitting the application form.
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run();
            }
          }}
          placeholder={t.placeholder}
          aria-label={t.label}
          className={`${inputClass} min-w-0 flex-1`}
        />
        <button type="button" onClick={run} disabled={pending || !link.trim()} className={`${secondaryButton} shrink-0`}>
          {pending && <span className="size-3.5 animate-spin rounded-full border-2 border-brand/30 border-t-brand" aria-hidden />}
          {pending ? t.importing : t.button}
        </button>
      </div>
      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`text-xs ${
            notice.tone === "ok"
              ? "text-emerald-700 dark:text-emerald-300"
              : notice.tone === "warn"
                ? "text-amber-700 dark:text-amber-300"
                : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {notice.text}
        </p>
      )}
      {postChars > 0 && <p className="text-xs text-muted">{t.post(group(postChars, locale))}</p>}
    </div>
  );
}
