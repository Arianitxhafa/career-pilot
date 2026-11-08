import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, GraduationCap, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/applications";
import { bestNextSkills, MIN_JOB_POST, rankJobs } from "@/lib/cvtools";
import { CountUp } from "@/components/CountUp";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).match.title };
}

type Job = Pick<Application, "id" | "company" | "position" | "status" | "job_description">;

const card = "rounded-2xl border border-line bg-surface p-5 shadow-card";
const heading = "flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase";
const tone = (score: number) => (score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#f43f5e");

export default async function MatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase.from("applications").select("id, company, position, status, job_description").order("updated_at", { ascending: false }),
    supabase.from("profiles").select("cv_text").eq("user_id", user.id).maybeSingle(),
  ]);
  const dict = await getT();
  const t = dict.match;
  const locale = await getLocale();
  const cv = profile?.cv_text?.trim() ?? "";

  const all = (rows ?? []) as Job[];
  const open = all.filter((a) => a.status !== "rejected" && a.status !== "offer");
  const ranked = cv.length >= 300 ? rankJobs(cv, open, locale) : [];
  const withoutPost = open.filter((a) => (a.job_description?.trim().length ?? 0) < MIN_JOB_POST);
  const next = bestNextSkills(cv, ranked);
  const average = ranked.length ? Math.round(ranked.reduce((s, r) => s + r.match.score, 0) / ranked.length) : 0;
  const strong = ranked.filter((r) => r.match.score >= 75).length;
  const maxGain = Math.max(1, ...next.map((n) => n.jobs * n.gain));

  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="animate-rise">
        <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">{t.eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted">{t.text}</p>
      </div>

      {cv.length < 300 ? (
        <section className={`${card} grid place-items-center gap-2 py-16 text-center`}>
          <FileText className="size-8 text-brand" aria-hidden />
          <p className="font-display text-2xl font-bold">{t.noCvTitle}</p>
          <p className="max-w-md text-sm text-muted">{t.noCvText}</p>
          <Link href="/dashboard/cv" className="mt-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 hover:brightness-110">
            {t.addCv}
          </Link>
        </section>
      ) : ranked.length === 0 ? (
        <section className={`${card} grid place-items-center gap-2 py-16 text-center`}>
          <p className="font-display text-2xl font-bold">{t.emptyTitle}</p>
          <p className="max-w-md text-sm text-muted">{t.emptyText}</p>
          <Link href="/dashboard" className="mt-2 text-sm font-semibold text-brand hover:underline">
            {t.toBoard}
          </Link>
        </section>
      ) : (
        <>
          <div className="stagger grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
            {[
              { label: t.average, value: average, hint: null as string | null },
              { label: t.scored, value: ranked.length, hint: null },
              { label: t.strong, value: strong, hint: t.strongHint },
            ].map((s) => (
              <section key={s.label} className={card}>
                <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-muted uppercase">{s.label}</p>
                <p className="mt-1 font-display text-4xl font-bold tabular-nums">
                  <CountUp value={s.value} />
                </p>
                {s.hint && <p className="text-xs text-muted">{s.hint}</p>}
              </section>
            ))}
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            {/* Ranked jobs */}
            <section aria-labelledby="rank-h" className="grid gap-3">
              <h2 id="rank-h" className={`${heading} text-muted`}>
                <Sparkles className="size-4 text-brand" aria-hidden /> {t.ranking}
              </h2>
              <ol className="stagger grid gap-3">
                {ranked.map(({ job, match }) => {
                  const color = tone(match.score);
                  const matched = match.detected - match.missing_keywords.length;
                  return (
                    <li key={job.id} className={`${card} flex min-w-0 flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div
                          className="grid size-14 shrink-0 place-items-center rounded-full"
                          style={{ background: `conic-gradient(${color} ${match.score * 3.6}deg, var(--line) 0deg)` }}
                          role="img"
                          aria-label={dict.copilot.scoreLabel(match.score)}
                        >
                          <span className="grid size-11 place-items-center rounded-full bg-surface text-base font-bold tabular-nums">{match.score}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{job.position}</p>
                          <p className="truncate text-sm text-muted">
                            {job.company} · {dict.status[job.status].label}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {t.covers(matched, match.detected)}
                            {match.detected < 3 && ` · ${t.rough}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex min-w-0 flex-col gap-3 sm:w-64 sm:shrink-0">
                        <div className="flex flex-wrap gap-1.5" aria-label={t.missing}>
                          {match.missing_keywords.length ? (
                            <>
                              <span className="sr-only">{t.missing}:</span>
                              {match.missing_keywords.slice(0, 4).map((k) => (
                                <span key={k} className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                  {k}
                                </span>
                              ))}
                              {match.missing_keywords.length > 4 && (
                                <span className="px-1 py-0.5 text-xs text-muted">+{match.missing_keywords.length - 4}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ {t.noneMissing}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard?open=${job.id}&tab=copilot`}
                            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border border-line px-3 text-xs font-semibold transition hover:border-brand/40 hover:bg-surface-2"
                          >
                            ✨ {t.copilot}
                          </Link>
                          <Link
                            href={`/dashboard?open=${job.id}&tab=copilot#letter`}
                            className="inline-flex min-h-9 flex-1 items-center justify-center rounded-lg bg-brand-soft px-3 text-xs font-semibold text-brand transition hover:brightness-95"
                          >
                            {t.letter}
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
              {/* Skills that would add the most points */}
              <section aria-labelledby="learn-h" className={card}>
                <h2 id="learn-h" className={heading}>
                  <GraduationCap className="size-4 text-brand" aria-hidden /> {t.learnTitle}
                </h2>
                <p className="mt-1 text-xs text-muted">{t.learnText}</p>
                {next.length ? (
                  <ol className="mt-4 grid gap-3">
                    {next.map((n) => (
                      <li key={n.skill}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-semibold">{n.skill}</span>
                          <span className="shrink-0 text-xs text-muted tabular-nums">{t.learnItem(n.jobs, n.gain)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(6, ((n.jobs * n.gain) / maxGain) * 100)}%` }} />
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-muted">{t.learnNone}</p>
                )}
              </section>

              {withoutPost.length > 0 && (
                <section aria-labelledby="nopost-h" className={card}>
                  <h2 id="nopost-h" className="text-sm font-semibold">
                    {t.withoutPost(withoutPost.length)}
                  </h2>
                  <p className="mt-1 text-xs text-muted">{t.withoutPostText}</p>
                  <ul className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-1">
                    {withoutPost.slice(0, 8).map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/dashboard?open=${a.id}&tab=copilot`}
                          className="-mx-2 flex min-h-9 items-center justify-between gap-3 rounded-lg px-2 text-sm hover:bg-surface-2"
                        >
                          <span className="min-w-0 truncate">
                            {a.position} <span className="text-muted">· {a.company}</span>
                          </span>
                          <span aria-hidden className="text-brand">→</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {all.length > open.length && <p className="px-1 text-xs text-muted">{t.hidden(all.length - open.length)}</p>}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
