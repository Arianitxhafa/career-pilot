"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { Application } from "@/lib/applications";
import {
  analyzeApplication,
  type Analysis,
} from "@/app/dashboard/copilot-actions";
import { useLocale, useT } from "@/i18n/client";
import { formatDate } from "@/lib/events";
import type { Dict } from "@/i18n/messages";
import { coverLetter, LETTER_TEMPLATES, MIN_JOB_POST, type LetterLang, type LetterTemplate } from "@/lib/cvtools";

type Props = {
  app: Application;
  initial?: Analysis;
  hasCv: boolean;
  cv: string;
  name: string | null;
  aiEnabled: boolean;
};

function scoreTone(score: number, t: Dict["copilot"]) {
  if (score >= 75) return { color: "#10b981", label: t.strong };
  if (score >= 50) return { color: "#f59e0b", label: t.worth };
  return { color: "#f43f5e", label: t.gaps };
}

export function CopilotPanel({ app, initial, hasCv, cv, name, aiEnabled }: Props) {
  const [state, action, pending] = useActionState(
    analyzeApplication,
    undefined,
  );
  const [, startAnalyze] = useTransition();
  const [copied, setCopied] = useState(false);
  const [jobPost, setJobPost] = useState(app.job_description ?? "");
  const analysis = state?.analysis ?? initial;
  const t = useT().copilot;

  if (!hasCv) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="text-3xl">📄</span>
        <p className="font-semibold">{t.noCvTitle}</p>
        <p className="max-w-sm text-sm text-muted">
          {t.noCvText}
        </p>
        <Link
          href="/dashboard/cv"
          className="mt-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 hover:brightness-110"
        >
          {t.addCv}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startAnalyze(() => action(data));
        }}
        className="grid gap-2"
      >
        <input type="hidden" name="application_id" value={app.id} />
        <label className="grid gap-1.5 text-sm font-medium">
          {t.jobPost}
          <textarea
            name="job_description"
            value={jobPost}
            onChange={(e) => setJobPost(e.target.value)}
            rows={6}
            maxLength={20000}
            placeholder={t.jobPostPh}
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {!aiEnabled ? t.free : typeof state?.remaining === "number" ? t.left(state.remaining) : t.powered}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-70"
          >
            {pending ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />{" "}
                {t.analysing}{aiEnabled ? " (~20s)" : ""}
              </>
            ) : analysis ? (
              t.again
            ) : (
              t.analyse
            )}
          </button>
        </div>
        {state?.error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400"
          >
            {state.error}
          </p>
        )}
      </form>

      {analysis && (
        <AnalysisView
          analysis={analysis}
          copied={copied}
          onCopy={() => {
            navigator.clipboard
              ?.writeText(analysis.result.cover_letter)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
          }}
        />
      )}

      <LetterBuilder app={app} cv={cv} name={name} jobPost={jobPost} />
    </div>
  );
}

/** Free cover-letter templates, filled from the CV and the job post as they are typed. */
function LetterBuilder({ app, cv, name, jobPost }: { app: Application; cv: string; name: string | null; jobPost: string }) {
  const dict = useT();
  const t = dict.letters;
  const locale = useLocale();
  const [template, setTemplate] = useState<LetterTemplate>("formal");
  const [lang, setLang] = useState<LetterLang>(locale);
  const [edited, setEdited] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ready = jobPost.trim().length >= MIN_JOB_POST;
  const generated = useMemo(
    () => (ready ? coverLetter(template, { company: app.company, position: app.position, name, cv, jobPost }, lang) : ""),
    [ready, template, app.company, app.position, name, cv, jobPost, lang],
  );
  const text = edited ?? generated;
  const section = useRef<HTMLElement>(null);
  // "Cover letter" links from the Job match page end in #letter: bring the builder into view once the dialog is open.
  useEffect(() => {
    if (window.location.hash === "#letter") section.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);
  const chip = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${active ? "bg-brand text-brand-ink shadow-sm" : "bg-surface-2 text-muted hover:text-fg"}`;

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${lang === "sq" ? "Leter motivuese" : "Cover letter"} - ${app.company.replace(/[\/:*?"<>|]+/g, " ").trim()}.txt`,
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section ref={section} id="letter" aria-labelledby={`letter-${app.id}`} className="grid gap-3 rounded-2xl border border-line bg-surface-2/40 p-4">
      <div>
        <h3 id={`letter-${app.id}`} className="text-xs font-semibold tracking-wider text-muted uppercase">
          {t.title}
        </h3>
        <p className="mt-1 text-xs text-muted">{ready ? t.text : t.needPost}</p>
      </div>
      {ready && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div role="radiogroup" aria-label={t.style} className="flex flex-wrap gap-1.5">
              {LETTER_TEMPLATES.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={template === id}
                  onClick={() => {
                    setTemplate(id);
                    setEdited(null);
                  }}
                  className={chip(template === id)}
                >
                  {t.templates[id]}
                </button>
              ))}
            </div>
            <div role="radiogroup" aria-label={t.language} className="flex gap-1">
              {(["en", "sq"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  onClick={() => {
                    setLang(l);
                    setEdited(null);
                  }}
                  className={`${chip(lang === l)} font-mono uppercase`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setEdited(e.target.value)}
            rows={14}
            aria-label={t.label}
            lang={lang}
            className="w-full resize-y rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed text-fg outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            {edited !== null && (
              <p className="mr-auto text-xs text-muted">
                {t.edited} ·{" "}
                <button type="button" onClick={() => setEdited(null)} className="font-semibold text-brand hover:underline">
                  {t.reset}
                </button>
              </p>
            )}
            <button type="button" onClick={download} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-fg">
              {t.download}
            </button>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard?.writeText(text).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                })
              }
              className="rounded-lg bg-brand-soft px-2.5 py-1.5 text-xs font-semibold text-brand hover:brightness-95"
            >
              {copied ? dict.copilot.copied : dict.copilot.copy}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function AnalysisView({
  analysis,
  copied,
  onCopy,
}: {
  analysis: Analysis;
  copied: boolean;
  onCopy: () => void;
}) {
  const { result } = analysis;
  const t = useT().copilot;
  const locale = useLocale();
  const tone = scoreTone(analysis.score, t);
  const isAi = result.mode !== "basic";

  return (
    <section aria-label={t.section} className="grid gap-4 animate-rise">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface-2/60 p-4">
        <div
          className="grid size-20 shrink-0 place-items-center rounded-full"
          style={{
            background: `conic-gradient(${tone.color} ${analysis.score * 3.6}deg, var(--line) 0deg)`,
          }}
          role="img"
          aria-label={t.scoreLabel(analysis.score)}
        >
          <div className="grid size-16 place-items-center rounded-full bg-surface">
            <span className="text-2xl font-bold tabular-nums">
              {analysis.score}
            </span>
          </div>
        </div>
        <div>
          <p
            className="flex flex-wrap items-center gap-2 text-sm font-semibold"
            style={{ color: tone.color }}
          >
            {tone.label}
            <span className="rounded-md bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted">
              {isAi ? t.ai : t.keyword}
            </span>
          </p>
          <p className="mt-0.5 text-sm">{result.verdict}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t.youShow}
          </h3>
          <ul className="mt-2 grid gap-1.5 text-sm">
            {result.strengths.map((s) => (
              <li key={s} className="flex gap-2">
                <span className="text-emerald-500">✓</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
            {t.missing}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.missing_keywords.length ? (
              result.missing_keywords.map((k) => (
                <span
                  key={k}
                  className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400"
                >
                  {k}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">{t.none}</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
          {t.tailor}
        </h3>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm">
          {result.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      {result.cover_letter && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">
              {t.letter}
            </h3>
            <button
              type="button"
              onClick={onCopy}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft"
            >
              {copied ? t.copied : t.copy}
            </button>
          </div>
          <p className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface-2/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {result.cover_letter}
          </p>
        </div>
      )}

      <p className="text-xs text-muted">
        {t.generated}{" "}
        {formatDate(new Date(analysis.created_at), locale, { day: true, month: "short", time: true })}
        {isAi ? t.byClaude : t.byKeywords}
      </p>
    </section>
  );
}
