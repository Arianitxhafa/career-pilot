"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import type { Application } from "@/lib/applications";
import { analyzeApplication, type Analysis } from "@/app/dashboard/copilot-actions";

type Props = { app: Application; initial?: Analysis; hasCv: boolean };

function scoreTone(score: number) {
  if (score >= 75) return { color: "#10b981", label: "Strong match" };
  if (score >= 50) return { color: "#f59e0b", label: "Worth applying" };
  return { color: "#f43f5e", label: "Big gaps" };
}

export function CopilotPanel({ app, initial, hasCv }: Props) {
  const [state, action, pending] = useActionState(analyzeApplication, undefined);
  const [, startAnalyze] = useTransition();
  const [copied, setCopied] = useState(false);
  const analysis = state?.analysis ?? initial;

  if (!hasCv) {
    return (
      <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="text-3xl">📄</span>
        <p className="font-semibold">Add your CV to unlock the co-pilot</p>
        <p className="max-w-sm text-sm text-muted">The co-pilot compares your CV with this job post, scores the match and writes a tailored cover letter.</p>
        <Link href="/dashboard/cv" className="mt-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 hover:brightness-110">
          Add my CV
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
          Job post
          <textarea
            name="job_description"
            defaultValue={app.job_description ?? ""}
            rows={6}
            maxLength={20000}
            placeholder="Paste the full job description here — responsibilities, requirements, nice-to-haves…"
            className="w-full resize-y rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {typeof state?.remaining === "number" ? `${state.remaining} analyses left today` : "Powered by Claude · a few analyses per day"}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-70"
          >
            {pending ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Analysing… (~20s)
              </>
            ) : analysis ? (
              "✨ Analyse again"
            ) : (
              "✨ Analyse my match"
            )}
          </button>
        </div>
        {state?.error && (
          <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
            {state.error}
          </p>
        )}
      </form>

      {analysis && <AnalysisView analysis={analysis} copied={copied} onCopy={() => {
        navigator.clipboard?.writeText(analysis.result.cover_letter).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }} />}
    </div>
  );
}

function AnalysisView({ analysis, copied, onCopy }: { analysis: Analysis; copied: boolean; onCopy: () => void }) {
  const { result } = analysis;
  const tone = scoreTone(analysis.score);

  return (
    <section aria-label="Co-pilot analysis" className="grid gap-4 animate-rise">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface-2/60 p-4">
        <div
          className="grid size-20 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(${tone.color} ${analysis.score * 3.6}deg, var(--line) 0deg)` }}
          role="img"
          aria-label={`Match score ${analysis.score} out of 100`}
        >
          <div className="grid size-16 place-items-center rounded-full bg-surface">
            <span className="text-2xl font-bold tabular-nums">{analysis.score}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: tone.color }}>
            {tone.label}
          </p>
          <p className="mt-0.5 text-sm">{result.verdict}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">You already show</h3>
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
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Missing keywords</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {result.missing_keywords.length ? (
              result.missing_keywords.map((k) => (
                <span key={k} className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {k}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">None — nice!</span>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Tailor your CV</h3>
        <ol className="mt-2 grid list-decimal gap-1.5 pl-5 text-sm">
          {result.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">Cover letter draft</h3>
          <button type="button" onClick={onCopy} className="rounded-lg px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-soft">
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface-2/50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {result.cover_letter}
        </p>
      </div>

      <p className="text-xs text-muted">
        Generated {new Date(analysis.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} by Claude. Always review before sending.
      </p>
    </section>
  );
}
