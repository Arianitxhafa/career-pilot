"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isEventKind } from "@/lib/events";
import { getT } from "@/i18n/server";

export type PlanState = { ok?: boolean; error?: string } | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function client() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return supabase;
}

function text(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

const refresh = () => revalidatePath("/dashboard", "layout");

/** Create or update an interview / follow-up / deadline. RLS guarantees it belongs to one of your applications. */
export async function saveEvent(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const supabase = await client();
  const id = text(formData, "id", 64);
  const applicationId = text(formData, "application_id", 64);
  const kind = formData.get("kind");
  const title = text(formData, "title", 120);
  const startsAt = String(formData.get("starts_at") ?? "");
  const duration = Number(formData.get("duration_minutes") ?? 60);
  const t = (await getT()).forms;

  if (!applicationId || !UUID.test(applicationId) || (id && !UUID.test(id))) return { error: t.reopen };
  if (!isEventKind(kind)) return { error: t.kind };
  if (!title) return { error: t.title };
  const when = new Date(startsAt);
  if (!startsAt || Number.isNaN(when.getTime())) return { error: t.date };
  if (!Number.isInteger(duration) || duration < 5 || duration > 600) return { error: t.duration };

  const row = {
    application_id: applicationId,
    kind,
    title,
    starts_at: when.toISOString(),
    duration_minutes: duration,
    location: text(formData, "location", 300),
    notes: text(formData, "notes", 2000),
  };
  const { error } = id ? await supabase.from("events").update(row).eq("id", id) : await supabase.from("events").insert(row);
  if (error) return { error: t.save };
  refresh();
  return { ok: true };
}

export async function setEventDone(id: string, done: boolean) {
  if (!UUID.test(id)) return;
  const supabase = await client();
  await supabase.from("events").update({ done }).eq("id", id);
  refresh();
}

export async function deleteEvent(id: string) {
  if (!UUID.test(id)) return;
  const supabase = await client();
  await supabase.from("events").delete().eq("id", id);
  refresh();
}

export async function saveContact(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const supabase = await client();
  const id = text(formData, "id", 64);
  const applicationId = text(formData, "application_id", 64);
  const name = text(formData, "name", 120);
  const email = text(formData, "email", 200);
  let linkedin = text(formData, "linkedin", 300);
  const t = (await getT()).forms;

  if (!applicationId || !UUID.test(applicationId) || (id && !UUID.test(id))) return { error: t.reopen };
  if (!name) return { error: t.name };
  if (email && !EMAIL.test(email)) return { error: t.email };
  if (linkedin) {
    if (!/^https?:\/\//i.test(linkedin)) linkedin = `https://${linkedin}`;
    try {
      new URL(linkedin);
    } catch {
      return { error: t.linkedin };
    }
  }

  const row = { application_id: applicationId, name, role: text(formData, "role", 120), email, phone: text(formData, "phone", 40), linkedin, notes: text(formData, "notes", 1000) };
  const { error } = id ? await supabase.from("contacts").update(row).eq("id", id) : await supabase.from("contacts").insert(row);
  if (error) return { error: t.save };
  refresh();
  return { ok: true };
}

export async function deleteContact(id: string) {
  if (!UUID.test(id)) return;
  const supabase = await client();
  await supabase.from("contacts").delete().eq("id", id);
  refresh();
}

/** Weekly goal for the Insights page (1–50 applications a week). */
export async function setWeeklyGoal(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = (await getT()).forms;
  if (!user) return { error: t.signIn };
  const goal = Number(formData.get("weekly_goal"));
  if (!Number.isInteger(goal) || goal < 1 || goal > 50) return { error: t.goal };
  const { error } = await supabase.from("profiles").upsert({ user_id: user.id, weekly_goal: goal });
  if (error) return { error: t.goalSave };
  refresh();
  return { ok: true };
}
