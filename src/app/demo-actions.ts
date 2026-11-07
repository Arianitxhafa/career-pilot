"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_APPLICATIONS, DEMO_CV } from "@/lib/demo-data";
import { matchCvToJob } from "@/lib/matcher";

export type DemoState = { error?: string } | undefined;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/**
 * One click: an anonymous Supabase session with a realistic board, a CV and co-pilot results.
 * RLS treats it like any signed-in user; demo accounts are deleted after 24 hours.
 */
export async function startDemo(): Promise<DemoState> {
  const supabase = await createClient();
  // Old demo accounts are purged by a database trigger whenever a new anonymous user is created.

  const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { full_name: "Demo Pilot" } } });
  if (error || !data.user) {
    console.error("demo sign-in failed", error?.message);
    return { error: "The demo is unavailable right now — please try again in a minute." };
  }

  const rows = DEMO_APPLICATIONS.map((a) => ({
    company: a.company,
    position: a.position,
    status: a.status,
    location: a.location,
    salary_range: a.salary_range ?? null,
    job_url: a.job_url ?? null,
    notes: a.notes ?? null,
    job_description: a.job_description ?? null,
    applied_at: a.appliedDaysAgo !== undefined ? daysAgo(a.appliedDaysAgo).toISOString().slice(0, 10) : null,
    created_at: daysAgo(a.daysAgo).toISOString(),
  }));

  const [{ data: inserted, error: appsError }] = await Promise.all([
    supabase.from("applications").insert(rows).select("id, job_description"),
    supabase.from("profiles").upsert({ user_id: data.user.id, cv_text: DEMO_CV, updated_at: new Date().toISOString() }),
  ]);
  if (appsError || !inserted) {
    console.error("demo seed failed", appsError?.message);
    return { error: "The demo couldn't be prepared — please try again." };
  }

  // Co-pilot results from the free matcher, so the match scores are there on arrival.
  const analyses = inserted
    .filter((a) => a.job_description)
    .map((a) => {
      const result = { ...matchCvToJob(DEMO_CV, a.job_description!), mode: "basic" as const };
      return { application_id: a.id, score: result.score, result };
    });
  if (analyses.length) await supabase.from("ai_analyses").insert(analyses);

  redirect("/dashboard?demo=1");
}

/** Leave the demo and open sign-up (signed-in visitors are otherwise redirected away from it). */
export async function leaveDemo() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signup");
}
