import Link from "next/link";
import { CalendarDays, CloudSun } from "lucide-react";
import type { Application } from "@/lib/applications";
import { EVENT_META, whenLabel, type AppEvent } from "@/lib/events";

/** Overdue follow-ups and everything in the next 7 days — what needs your attention now. */
export function ThisWeek({ events, applications }: { events: AppEvent[]; applications: Application[] }) {
  const now = new Date();
  const week = now.getTime() + 7 * 86_400_000;
  const company = new Map(applications.map((a) => [a.id, a.company]));
  const items = events
    .filter((e) => !e.done && company.has(e.application_id))
    .filter((e) => {
      const t = new Date(e.starts_at).getTime();
      return t <= week && (t >= now.getTime() - 60 * 60_000 || e.kind !== "interview");
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 6);

  return (
    <section aria-labelledby="this-week" className="animate-rise rounded-2xl border border-line bg-surface p-4 shadow-card [animation-delay:120ms]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="this-week" className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.18em] uppercase">
          <CalendarDays className="size-4 text-brand" aria-hidden /> This week
        </h2>
        <Link href="/dashboard/calendar" className="text-xs font-semibold text-brand hover:underline">
          Open calendar →
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <CloudSun className="size-4 text-amber" aria-hidden /> Clear skies — nothing scheduled this week. Open any card → <b className="font-semibold">Plan</b> to add an interview or a follow-up.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => {
            const w = whenLabel(e, now);
            return (
              <li key={e.id}>
                <Link
                  href={`/dashboard?open=${e.application_id}&tab=plan`}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition hover:-translate-y-0.5 hover:border-brand/40 ${w.urgent ? "border-rose-500/30 bg-rose-500/[0.05]" : "border-line"}`}
                >
                  <span className={`size-2.5 shrink-0 rounded-full ${w.urgent ? "bg-rose-500" : EVENT_META[e.kind].dot}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{e.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {EVENT_META[e.kind].label} · {company.get(e.application_id)}
                    </span>
                  </span>
                  <span className={`shrink-0 font-mono text-[11px] font-bold ${w.urgent ? "text-rose-600 dark:text-rose-400" : "text-muted"}`}>{w.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
