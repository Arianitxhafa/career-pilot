"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { FileUp } from "lucide-react";
import { saveCv } from "@/app/dashboard/copilot-actions";
import { useLocale, useT } from "@/i18n/client";
import { formatDate } from "@/lib/events";
import { findSkills, SKILLS } from "@/lib/matcher";
import { cleanPdfText, MAX_CV } from "@/lib/cvtools";
import { secondaryButton } from "./ui";

const MAX_PDF_BYTES = 5 * 1024 * 1024;
// Thousands separators by hand: Node and the browser ship different ICU data for Albanian, which breaks hydration.
const group = (n: number, intl: string) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, intl === "sq" ? " " : ",");
const SKILL_ORDER = new Map(SKILLS.map((s, i) => [s.name, i]));

type Notice = { tone: "ok" | "error"; text: string } | null;

/** Pulls the text out of a PDF in the browser (PDF.js via unpdf, loaded only when needed). */
async function readPdf(file: File) {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { ...cleanPdfText(text), pages: totalPages };
}

export function CvForm({ initialCv, updatedAt }: { initialCv: string; updatedAt: string | null }) {
  const [cv, setCv] = useState(initialCv);
  const [state, action, pending] = useActionState(saveCv, undefined);
  const [, startSave] = useTransition();
  const [submitted, setSubmitted] = useState(initialCv);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = cv !== (state?.ok ? submitted : initialCv);
  const dict = useT();
  const t = dict.cv;
  const u = dict.cvUpload;
  const locale = useLocale();
  const skills = useMemo(() => [...findSkills(cv)].sort((a, b) => SKILL_ORDER.get(a)! - SKILL_ORDER.get(b)!), [cv]);

  async function importPdf(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) return setNotice({ tone: "error", text: u.notPdf });
    if (file.size > MAX_PDF_BYTES) return setNotice({ tone: "error", text: u.tooBig });
    setReading(true);
    setNotice(null);
    try {
      const { text, truncated, pages } = await readPdf(file);
      if (text.replace(/\s/g, "").length < 40) return setNotice({ tone: "error", text: u.empty });
      if (cv.trim() && cv.trim() !== text && !window.confirm(u.replace)) return;
      setCv(text);
      setNotice({ tone: "ok", text: u.done(file.name, pages) + (truncated ? u.truncated : "") });
    } catch (error) {
      console.error("PDF import failed", error);
      setNotice({ tone: "error", text: u.failed });
    } finally {
      setReading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

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
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => fileInput.current?.click()} disabled={reading} className={secondaryButton}>
          {reading ? (
            <span className="size-4 animate-spin rounded-full border-2 border-brand/30 border-t-brand" aria-hidden />
          ) : (
            <FileUp className="size-4 text-brand" aria-hidden />
          )}
          {reading ? u.reading : u.button}
        </button>
        <p className="min-w-0 flex-1 basis-56 text-xs text-muted">{u.hint}</p>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => importPdf(e.target.files?.[0])}
        />
      </div>

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={`rounded-xl px-3.5 py-2.5 text-sm ${
            notice.tone === "error" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div
        className="relative"
        onDragOver={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDragging(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragging(false);
          importPdf(e.dataTransfer.files[0]);
        }}
      >
        <textarea
          name="cv_text"
          value={cv}
          onChange={(e) => setCv(e.target.value)}
          maxLength={MAX_CV}
          rows={22}
          placeholder={"Arianit Xhafa — Software Developer\n\nPROJECTS\nRentigo — full-stack car rental platform (Node.js, SQLite)…\n\nSKILLS\nJavaScript, TypeScript, React Native…"}
          aria-label={t.label}
          className="block w-full resize-y rounded-2xl border border-line bg-surface p-4 font-mono text-sm leading-relaxed text-fg outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15"
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl border-2 border-dashed border-brand bg-brand-soft/90 text-sm font-semibold text-brand">
            <span className="flex items-center gap-2">
              <FileUp className="size-5" aria-hidden /> {u.drop}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {group(cv.length, locale)} / {group(MAX_CV, locale)} {t.chars}
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

      {cv.trim() && (
        <section aria-label={u.skills(skills.length)} className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase">{u.skills(skills.length)}</h2>
          {skills.length ? (
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <li key={s} className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{u.noSkills}</p>
          )}
        </section>
      )}
    </form>
  );
}
