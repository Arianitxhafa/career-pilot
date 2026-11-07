import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, type Application } from "@/lib/applications";
import { Board } from "@/components/Board";
import { StatsBar } from "@/components/StatsBar";
import type { Analysis } from "./copilot-actions";
import type { Contact, HistoryEntry } from "@/lib/applications";
import type { AppEvent } from "@/lib/events";
import type { DialogTab } from "@/components/ApplicationDialog";
import { ThisWeek } from "@/components/plan/ThisWeek";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ open?: string; tab?: string }> }) {
  const { open, tab } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { data: profile }, { data: analysisRows }, { data: eventRows }, { data: contactRows }, { data: historyRows }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, position, status, location, salary_range, job_url, notes, job_description, applied_at, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("cv_text").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_analyses").select("application_id, score, result, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("events").select("id, application_id, kind, title, starts_at, duration_minutes, location, notes, done").order("starts_at").limit(500),
    supabase.from("contacts").select("id, application_id, name, role, email, phone, linkedin, notes").order("created_at").limit(500),
    supabase.from("application_history").select("id, application_id, from_status, to_status, created_at").order("created_at").limit(1000),
  ]);
  const events = (eventRows ?? []) as AppEvent[];

  const applications = (data ?? []) as Application[];
  const hasCv = (profile?.cv_text?.trim().length ?? 0) >= 300;
  // Rows are newest first, so the first one seen per application is its latest analysis.
  const analyses: Record<string, Analysis> = {};
  for (const row of analysisRows ?? []) {
    if (!analyses[row.application_id]) analyses[row.application_id] = row as Analysis;
  }
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
  const name = user.is_anonymous ? "Pilot" : (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Europe/Belgrade" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Belgrade" }).toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-rise">
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">MISSION CONTROL · {today}</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              {greeting}
              {name ? <span className="text-brand">, {name}.</span> : "."}
            </h1>
          </div>
          {!hasCv && (
            <Link href="/dashboard/cv" className="rounded-xl border border-amber/40 bg-amber-soft px-3.5 py-2 text-sm font-medium transition hover:border-amber">
              ✨ Add your CV to unlock the co-pilot →
            </Link>
          )}
        </div>
        <StatsBar stats={computeStats(applications)} />
        <ThisWeek events={events} applications={applications} />
        <Board
          applications={applications}
          analyses={analyses}
          hasCv={hasCv}
          aiEnabled={aiEnabled}
          events={events}
          contacts={(contactRows ?? []) as Contact[]}
          history={(historyRows ?? []) as HistoryEntry[]}
          openId={open}
          openTab={["details", "plan", "people", "history", "copilot"].includes(tab ?? "") ? (tab as DialogTab) : undefined}
        />
      </main>
    </div>
  );
}
