import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/events";

/** Every upcoming, not-done event in one .ics file — import it once into any calendar app. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  const { data } = await supabase
    .from("events")
    .select("id, title, starts_at, duration_minutes, location, notes, applications(company, position, job_url)")
    .eq("done", false)
    .gte("starts_at", new Date(Date.now() - 60 * 60_000).toISOString())
    .order("starts_at")
    .limit(200);

  const ics = buildIcs(
    (data ?? []).map((e) => {
      const app = e.applications as unknown as { company: string; position: string; job_url: string | null } | null;
      return {
        id: e.id,
        title: e.title,
        starts_at: e.starts_at,
        duration_minutes: e.duration_minutes,
        location: e.location,
        description: [app ? `${app.position} at ${app.company}` : null, e.notes].filter(Boolean).join("\n"),
        url: app?.job_url ?? null,
      };
    })
  );
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="careerpilot-upcoming.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
