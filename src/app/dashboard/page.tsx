import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, type Application } from "@/lib/applications";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Board } from "@/components/Board";
import { StatsBar } from "@/components/StatsBar";
import type { Analysis } from "./copilot-actions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { data: profile }, { data: analysisRows }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, position, status, location, salary_range, job_url, notes, job_description, applied_at, created_at, updated_at")
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("cv_text").eq("user_id", user.id).maybeSingle(),
    supabase.from("ai_analyses").select("application_id, score, result, created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  const applications = (data ?? []) as Application[];
  const hasCv = (profile?.cv_text?.trim().length ?? 0) >= 300;
  // Rows are newest first, so the first one seen per application is its latest analysis.
  const analyses: Record<string, Analysis> = {};
  for (const row of analysisRows ?? []) {
    if (!analyses[row.application_id]) analyses[row.application_id] = row as Analysis;
  }
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader email={user.email} active="board" />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-rise">
          <div>
            <p className="text-sm font-medium text-brand">Mission control</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name ? `Good to see you, ${name}.` : "Your job search"}</h1>
          </div>
          {!hasCv && (
            <Link href="/dashboard/cv" className="rounded-xl border border-amber/40 bg-amber/10 px-3.5 py-2 text-sm font-medium transition hover:bg-amber/20">
              ✨ Add your CV to unlock the AI co-pilot →
            </Link>
          )}
        </div>
        <StatsBar stats={computeStats(applications)} />
        <Board applications={applications} analyses={analyses} hasCv={hasCv} />
      </main>
    </div>
  );
}
