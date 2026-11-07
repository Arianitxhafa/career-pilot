import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { dayKey, EVENT_META, monthGrid, parseMonth, shiftMonth, timeLabel, TIME_ZONE, whenLabel, type AppEvent } from "@/lib/events";
import { secondaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const current = parseMonth((await searchParams).month, now);
  const weeks = monthGrid(current.year, current.month);
  const from = new Date(`${weeks[0][0]}T00:00:00Z`).getTime() - 86_400_000;
  const to = new Date(`${weeks.at(-1)![6]}T23:59:59Z`).getTime() + 86_400_000;

  const [{ data: eventRows }, { data: apps }] = await Promise.all([
    supabase
      .from("events")
      .select("id, application_id, kind, title, starts_at, duration_minutes, location, notes, done")
      .gte("starts_at", new Date(Math.min(from, now.getTime() - 30 * 86_400_000)).toISOString())
      .lte("starts_at", new Date(Math.max(to, now.getTime() + 60 * 86_400_000)).toISOString())
      .order("starts_at"),
    supabase.from("applications").select("id, company, position"),
  ]);
  const events = (eventRows ?? []) as AppEvent[];
  const company = new Map((apps ?? []).map((a) => [a.id as string, a.company as string]));
  const byDay = new Map<string, AppEvent[]>();
  for (const e of events) {
    const k = dayKey(new Date(e.starts_at));
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const today = dayKey(now);
  const monthPrefix = `${current.year}-${String(current.month).padStart(2, "0")}`;
  const title = new Date(Date.UTC(current.year, current.month - 1, 15)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const upcoming = events.filter((e) => !e.done && new Date(e.starts_at).getTime() >= now.getTime() - 60 * 60_000).slice(0, 8);
  const overdue = events.filter((e) => !e.done && e.kind !== "interview" && new Date(e.starts_at) < now);

  return (
    <main className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 animate-rise">
        <div>
          <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">FLIGHT SCHEDULE</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">Calendar</h1>
          <p className="mt-2 text-sm text-muted">Interviews, follow-ups and deadlines across all your applications.</p>
        </div>
        {upcoming.length > 0 && (
          <a href="/dashboard/events/ics" className={secondaryButton}>
            <Download className="size-4" aria-hidden /> Export upcoming (.ics)
          </a>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="animate-rise overflow-hidden rounded-2xl border border-line bg-surface shadow-card [animation-delay:100ms]" aria-label={`Calendar for ${title}`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            <div className="flex items-center gap-1">
              <Link href={`/dashboard/calendar?month=${shiftMonth(current, -1)}`} className="rounded-lg p-2 transition hover:bg-surface-2" aria-label="Previous month">
                <ChevronLeft className="size-4" />
              </Link>
              <Link href="/dashboard/calendar" className="rounded-lg px-3 py-1.5 text-sm font-semibold transition hover:bg-surface-2">
                Today
              </Link>
              <Link href={`/dashboard/calendar?month=${shiftMonth(current, 1)}`} className="rounded-lg p-2 transition hover:bg-surface-2" aria-label="Next month">
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[44rem]">
              <div className="grid grid-cols-7 border-b border-line font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="px-2 py-2">
                    {d}
                  </div>
                ))}
              </div>
              {weeks.map((week) => (
                <div key={week[0]} className="grid grid-cols-7 border-b border-line last:border-b-0">
                  {week.map((day) => {
                    const inMonth = day.startsWith(monthPrefix);
                    const list = byDay.get(day) ?? [];
                    return (
                      <div key={day} className={`min-h-28 border-r border-line p-1.5 last:border-r-0 ${inMonth ? "" : "bg-surface-2/40"}`}>
                        <p
                          className={`mb-1 grid size-6 place-items-center rounded-full font-mono text-xs ${
                            day === today ? "bg-brand font-bold text-brand-ink" : inMonth ? "text-fg" : "text-muted/60"
                          }`}
                        >
                          {Number(day.slice(8))}
                        </p>
                        <ul className="grid gap-1">
                          {list.map((e) => (
                            <li key={e.id}>
                              <Link
                                href={`/dashboard?open=${e.application_id}&tab=plan`}
                                title={`${e.title} — ${company.get(e.application_id) ?? ""}`}
                                className={`block truncate rounded-md px-1.5 py-1 text-[11px] font-semibold transition hover:brightness-95 ${EVENT_META[e.kind].chip} ${e.done ? "line-through opacity-60" : ""}`}
                              >
                                {e.kind === "interview" || e.kind === "other" ? `${timeLabel(new Date(e.starts_at))} ` : ""}
                                {company.get(e.application_id) ?? e.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          {overdue.length > 0 && (
            <section className="animate-rise rounded-2xl border border-rose-500/30 bg-rose-500/[0.05] p-4 [animation-delay:150ms]" aria-labelledby="overdue">
              <h2 id="overdue" className="font-mono text-xs font-bold tracking-[0.18em] text-rose-600 uppercase dark:text-rose-400">
                Needs attention · {overdue.length}
              </h2>
              <ul className="mt-3 grid gap-2">
                {overdue.map((e) => (
                  <li key={e.id}>
                    <Link href={`/dashboard?open=${e.application_id}&tab=plan`} className="block text-sm hover:underline">
                      <span className="font-semibold">{e.title}</span>
                      <span className="block text-xs text-rose-600 dark:text-rose-400">{whenLabel(e, now).text}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="animate-rise rounded-2xl border border-line bg-surface p-4 shadow-card [animation-delay:200ms]" aria-labelledby="upcoming">
            <h2 id="upcoming" className="font-mono text-xs font-bold tracking-[0.18em] uppercase">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-muted">Nothing scheduled. Open an application → Plan to add an interview or a follow-up.</p>
            ) : (
              <ol className="mt-3 grid gap-3">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${EVENT_META[e.kind].dot}`} aria-hidden />
                    <Link href={`/dashboard?open=${e.application_id}&tab=plan`} className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold hover:underline">{e.title}</span>
                      <span className="block text-xs text-muted">
                        {new Date(e.starts_at).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TIME_ZONE })}
                        {e.kind === "interview" || e.kind === "other" ? ` · ${timeLabel(new Date(e.starts_at))}` : ""}
                        {company.get(e.application_id) ? ` · ${company.get(e.application_id)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
          <div className="flex flex-wrap gap-2 px-1 text-xs text-muted">
            {(["interview", "follow_up", "deadline"] as const).map((k) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${EVENT_META[k].dot}`} /> {EVENT_META[k].label}
              </span>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
