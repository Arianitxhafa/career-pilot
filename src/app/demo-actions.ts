"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEMO_APPLICATIONS, DEMO_CONTACTS, DEMO_CV, DEMO_EVENTS, DEMO_SQ, demoPath } from "@/lib/demo-data";
import { matchCvToJob } from "@/lib/matcher";
import { getLocale, getT } from "@/i18n/server";

export type DemoState = { error?: string } | undefined;

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/**
 * One click: an anonymous Supabase session with a realistic board, a CV and co-pilot results.
 * RLS treats it like any signed-in user; demo accounts are deleted after 24 hours.
 */
export async function startDemo(): Promise<DemoState> {
  const supabase = await createClient();
  const [t, locale] = [(await getT()).auth.demo, await getLocale()];
  // The demo board speaks the visitor's language.
  const tr = <T extends string | null | undefined>(s: T): T => (locale === "sq" && s ? ((DEMO_SQ[s] ?? s) as T) : s);
  // Old demo accounts are purged by a database trigger whenever a new anonymous user is created.

  const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { full_name: "Demo Pilot" } } });
  if (error || !data.user) {
    console.error("demo sign-in failed", error?.message);
    return { error: t.unavailable };
  }

  const rows = DEMO_APPLICATIONS.map((a) => ({
    company: a.company,
    position: a.position,
    status: a.status,
    location: tr(a.location),
    salary_range: tr(a.salary_range) ?? null,
    job_url: a.job_url ?? null,
    notes: tr(a.notes) ?? null,
    job_description: a.job_description ?? null,
    applied_at: a.appliedDaysAgo !== undefined ? daysAgo(a.appliedDaysAgo).toISOString().slice(0, 10) : null,
    created_at: daysAgo(a.daysAgo).toISOString(),
  }));

  // A freshly issued session is occasionally rejected for a moment (401), so retry the first write a couple of times.
  const insertApps = async () => {
    let result = await supabase.from("applications").insert(rows).select("id, company, job_description");
    for (let attempt = 1; result.error && attempt <= 2; attempt++) {
      console.warn(`demo seed retry ${attempt}:`, result.error.message);
      await new Promise((r) => setTimeout(r, 400 * attempt));
      result = await supabase.from("applications").insert(rows).select("id, company, job_description");
    }
    return result;
  };
  const [{ data: inserted, error: appsError }] = await Promise.all([
    insertApps(),
    supabase.from("profiles").upsert({ user_id: data.user.id, cv_text: DEMO_CV, weekly_goal: 3, updated_at: new Date().toISOString() }),
  ]);
  if (appsError || !inserted) {
    console.error("demo seed failed", appsError?.message);
    await supabase.auth.signOut(); // don't leave the visitor inside an empty demo board
    return { error: t.failed };
  }

  // Co-pilot results from the free matcher, so the match scores are there on arrival.
  const analyses = inserted
    .filter((a) => a.job_description)
    .map((a) => {
      const result = { ...matchCvToJob(DEMO_CV, a.job_description!, locale), mode: "basic" as const };
      return { application_id: a.id, score: result.score, result };
    });
  const idOf = new Map(inserted.map((a) => [a.company as string, a.id as string]));
  const at = (inDays: number, hour: number, minutes = 0) => {
    const d = new Date(Date.now() + inDays * 86_400_000);
    // Demo times are in Kosovo time (UTC+1 in winter, +2 in summer); close enough for sample data.
    d.setUTCHours(hour - 1, minutes, 0, 0);
    return d.toISOString();
  };
  const history = DEMO_APPLICATIONS.flatMap((a) =>
    demoPath(a.status, a.daysAgo, a.appliedDaysAgo).map((h) => ({
      application_id: idOf.get(a.company)!,
      from_status: h.from,
      to_status: h.to,
      created_at: daysAgo(h.daysAgo).toISOString(),
    }))
  );

  await Promise.all([
    analyses.length ? supabase.from("ai_analyses").insert(analyses) : null,
    supabase.from("events").insert(
      DEMO_EVENTS.map((e) => ({
        application_id: idOf.get(e.company)!,
        kind: e.kind,
        title: tr(e.title),
        starts_at: at(e.inDays, e.hour, e.minutes),
        duration_minutes: e.duration ?? 60,
        location: tr(e.location) ?? null,
        notes: tr(e.notes) ?? null,
        done: e.done ?? false,
      }))
    ),
    supabase.from("contacts").insert(DEMO_CONTACTS.map(({ company, role, ...c }) => ({ application_id: idOf.get(company)!, role: tr(role), ...c }))),
    // Replace the single "added" rows the trigger wrote with a realistic journey.
    supabase
      .from("application_history")
      .delete()
      .in("application_id", inserted.map((a) => a.id))
      .then(() => supabase.from("application_history").insert(history)),
  ]);

  redirect("/dashboard?demo=1");
}

/** Leave the demo and open sign-up (signed-in visitors are otherwise redirected away from it). */
export async function leaveDemo() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/signup");
}
