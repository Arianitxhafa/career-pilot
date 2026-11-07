import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/events";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One event as an .ics file (RLS: you can only download your own). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  const { data: e } = await supabase
    .from("events")
    .select("id, title, starts_at, duration_minutes, location, notes, applications(company, position, job_url)")
    .eq("id", id)
    .maybeSingle();
  if (!e) return new Response("Not found", { status: 404 });

  const app = e.applications as unknown as { company: string; position: string; job_url: string | null } | null;
  const ics = buildIcs([
    {
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      duration_minutes: e.duration_minutes,
      location: e.location,
      description: [app ? `${app.position} at ${app.company}` : null, e.notes, "Added from CareerPilot"].filter(Boolean).join("\n"),
      url: app?.job_url ?? null,
    },
  ]);
  const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "event";
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "private, no-store",
    },
  });
}
