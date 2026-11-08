import { createClient } from "@/lib/supabase/server";
import { applicationsCsv, isoDay } from "@/lib/csv";
import { getT } from "@/i18n/server";

/** Every application as a CSV file (opens in Excel, Google Sheets or Numbers), with the latest co-pilot score. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  const [{ data: apps }, { data: analyses }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, company, position, status, location, salary_range, job_url, notes, applied_at, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("ai_analyses").select("application_id, score").order("created_at", { ascending: false }).limit(1000),
  ]);
  // Rows are newest first, so the first score seen per application is its latest.
  const scores: Record<string, number> = {};
  for (const a of analyses ?? []) if (!(a.application_id in scores)) scores[a.application_id] = a.score;

  const dict = await getT();
  const status = Object.fromEntries(Object.entries(dict.status).map(([k, v]) => [k, v.label]));
  const csv = applicationsCsv(apps ?? [], scores, { headers: dict.export.headers, status });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="careerpilot-applications-${isoDay(new Date().toISOString())}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
