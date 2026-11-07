import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDown, Flame, GraduationCap, Hourglass, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Application, HistoryEntry } from "@/lib/applications";
import { funnel, goalProgress, responseTimes, topMissingSkills, weeklySent } from "@/lib/insights";
import { WeeklyChart } from "@/components/insights/WeeklyChart";
import { GoalForm } from "@/components/insights/GoalForm";
import { CountUp } from "@/components/CountUp";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).insights.title };
}

const card = "rounded-2xl border border-line bg-surface p-5 shadow-card";
const heading = "flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: appRows }, { data: historyRows }, { data: profile }, { data: analysisRows }] = await Promise.all([
    supabase.from("applications").select("id, status, applied_at, created_at"),
    supabase.from("application_history").select("id, application_id, from_status, to_status, created_at").order("created_at").limit(2000),
    supabase.from("profiles").select("weekly_goal").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_analyses").select("application_id, result, created_at").order("created_at", { ascending: false }).limit(300),
  ]);
  const apps = (appRows ?? []) as Pick<Application, "id" | "status" | "applied_at" | "created_at">[];
  const history = (historyRows ?? []) as HistoryEntry[];
  const goal = profile?.weekly_goal ?? 5;
  const dict = await getT();
  const t = dict.insights;

  const steps = funnel(apps, history);
  const weeks = weeklySent(apps, 12);
  const response = responseTimes(apps, history);
  const progress = goalProgress(apps, goal);
  // Skill gaps from the latest co-pilot result of each job you're still pursuing.
  const open = new Set(apps.filter((a) => a.status !== "rejected" && a.status !== "offer").map((a) => a.id));
  const latest = new Map<string, { missing_keywords?: string[] }>();
  for (const r of analysisRows ?? []) if (open.has(r.application_id) && !latest.has(r.application_id)) latest.set(r.application_id, r.result as { missing_keywords?: string[] });
  const skills = topMissingSkills([...latest.values()]);
  const maxSkill = Math.max(1, ...skills.map((s) => s.count));
  const totalSent = weeks.reduce((s, w) => s + w.count, 0);

  const r = 34;
  const circumference = 2 * Math.PI * r;

  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="animate-rise">
        <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">{t.eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
        <p className="mt-2 text-sm text-muted">{t.text}</p>
      </div>

      {apps.length === 0 ? (
        <section className={`${card} grid place-items-center gap-2 py-16 text-center`}>
          <p className="font-display text-2xl font-bold">{t.emptyTitle}</p>
          <p className="max-w-md text-sm text-muted">{t.emptyText}</p>
          <Link href="/dashboard" className="mt-2 text-sm font-semibold text-brand hover:underline">
            {t.toBoard}
          </Link>
        </section>
      ) : (
        <>
          <div className="stagger grid gap-4 md:grid-cols-3">
            {/* Weekly goal */}
            <section className={`${card} flex items-center gap-5`} aria-labelledby="goal-h">
              <div className="relative shrink-0">
                <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden>
                  <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r={r}
                    fill="none"
                    stroke={progress.pct >= 100 ? "#10b981" : "var(--chart)"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress.pct / 100)}
                  />
                </svg>
                <p className="absolute inset-0 grid place-items-center font-display text-2xl font-bold">
                  <span>
                    {progress.thisWeek}
                    <span className="text-sm text-muted">/{goal}</span>
                  </span>
                </p>
              </div>
              <div className="min-w-0">
                <h2 id="goal-h" className={heading}>
                  <Target className="size-4 text-brand" aria-hidden /> {t.goal}
                </h2>
                <p className="mt-1.5 text-sm">
                  {progress.remaining === 0 ? (
                    <b>{t.goalReached}</b>
                  ) : (
                    <>
                      <b>{t.more(progress.remaining)}</b> {t.toHit(goal)}
                    </>
                  )}
                </p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Flame className={`size-3.5 ${progress.streak ? "text-amber" : ""}`} aria-hidden />
                  {progress.streak ? t.streak(progress.streak) : t.startStreak}
                </p>
                <div className="mt-2">
                  <GoalForm goal={goal} />
                </div>
              </div>
            </section>

            {/* Response time */}
            <section className={card} aria-labelledby="resp-h">
              <h2 id="resp-h" className={heading}>
                <Hourglass className="size-4 text-brand" aria-hidden /> {t.hearBack}
              </h2>
              {response.median === null ? (
                <p className="mt-3 text-sm text-muted">{t.noReplies}</p>
              ) : (
                <>
                  <p className="mt-2 font-display text-4xl leading-none font-bold">
                    <CountUp value={response.median} /> <span className="text-lg text-muted">{t.days}</span>
                  </p>
                  <p className="mt-1.5 text-xs text-muted">
                    {t.median(response.replies)} · {t.fastest} {response.fastest} · {t.slowest} {response.slowest}
                  </p>
                  <p className="mt-2 text-xs">
                    {t.followUpA} <b>{t.followUpB(Math.max(7, (response.median ?? 0) + 3))}</b>{t.followUpC}
                  </p>
                </>
              )}
            </section>

            {/* Interview rate */}
            <section className={card} aria-labelledby="rate-h">
              <h2 id="rate-h" className={heading}>
                <span className="size-2 rounded-full bg-amber" aria-hidden /> {t.rate}
              </h2>
              <p className="mt-2 font-display text-4xl leading-none font-bold">
                <CountUp value={steps[2].pctOfPrevious ?? 0} suffix="%" />
              </p>
              <p className="mt-1.5 text-xs text-muted">
                {t.rateText(steps[1].count)}
              </p>
              <p className="mt-2 text-xs">
                {(steps[2].pctOfPrevious ?? 0) >= 25
                  ? t.rateHigh
                  : t.rateLow}
              </p>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            {/* Funnel */}
            <section className={`${card} animate-rise [animation-delay:150ms]`} aria-labelledby="funnel-h">
              <h2 id="funnel-h" className={heading}>
                {t.funnel}
              </h2>
              <ol className="mt-4 grid gap-1">
                {steps.map((s, i) => (
                  <li key={s.status}>
                    {i > 0 && (
                      <p className="flex items-center gap-1.5 py-1 pl-2 font-mono text-[11px] text-muted">
                        <ArrowDown className="size-3" aria-hidden /> {t.madeIt(s.pctOfPrevious ?? 0)}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="w-20 shrink-0 text-sm font-semibold">{dict.status[s.status].label}</span>
                      <div className="h-8 flex-1 overflow-hidden rounded-lg bg-surface-2">
                        <div
                          className="flex h-full origin-left items-center justify-end rounded-lg bg-chart px-2 font-mono text-xs font-bold text-white"
                          style={{ width: `${Math.max(s.pctOfTotal, s.count ? 12 : 0)}%`, opacity: 1 - i * 0.16, animation: `grow-x 0.9s cubic-bezier(0.22,1,0.36,1) ${250 + i * 120}ms both` }}
                        >
                          {s.count > 0 && s.count}
                        </div>
                      </div>
                      <span className="w-10 shrink-0 text-right font-mono text-xs text-muted">{s.pctOfTotal}%</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted">{t.funnelNote}</p>
            </section>

            {/* Weekly activity */}
            <section className={`${card} animate-rise [animation-delay:220ms]`} aria-labelledby="weekly-h">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="weekly-h" className={heading}>
                  {t.perWeek}
                </h2>
                <p className="text-xs text-muted">
                  <b className="text-fg">{totalSent}</b> {t.sentIn}
                </p>
              </div>
              <div className="mt-3">
                <WeeklyChart data={weeks} goal={goal} />
              </div>
            </section>
          </div>

          {/* Skills */}
          <section className={`${card} animate-rise [animation-delay:300ms]`} aria-labelledby="skills-h">
            <h2 id="skills-h" className={heading}>
              <GraduationCap className="size-4 text-brand" aria-hidden /> {t.skills}
            </h2>
            {skills.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                {t.skillsEmpty}
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-muted">{t.skillsText}</p>
                <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {skills.map((s, i) => (
                    <li key={s.label} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm font-semibold" title={s.label}>
                        {s.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full origin-left rounded-full bg-amber"
                          style={{ width: `${(s.count / maxSkill) * 100}%`, animation: `grow-x 0.8s cubic-bezier(0.22,1,0.36,1) ${350 + i * 60}ms both` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right font-mono text-xs text-muted">
                        {t.jobs(s.count)}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </>
      )}
    </main>
  );
}
