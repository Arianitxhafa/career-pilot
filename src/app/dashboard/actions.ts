"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isStatus, type Status } from "@/lib/applications";
import { getT } from "@/i18n/server";

export type SaveState = { ok?: boolean; error?: string } | undefined;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

function text(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

export async function saveApplication(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase } = await requireUser();

  const id = text(formData, "id", 64);
  const company = text(formData, "company", 120);
  const position = text(formData, "position", 120);
  const status = formData.get("status");
  let jobUrl = text(formData, "job_url", 500);
  const t = (await getT()).forms;

  if (!company || !position) return { error: t.required };
  if (!isStatus(status)) return { error: t.stage };
  if (jobUrl) {
    if (!/^https?:\/\//i.test(jobUrl)) jobUrl = `https://${jobUrl}`;
    try {
      new URL(jobUrl);
    } catch {
      return { error: t.url };
    }
  }

  const row = {
    company,
    position,
    status,
    location: text(formData, "location", 120),
    salary_range: text(formData, "salary_range", 60),
    job_url: jobUrl,
    notes: text(formData, "notes", 4000),
  };

  const { error } = id
    ? await supabase.from("applications").update(row).eq("id", id)
    : await supabase.from("applications").insert(row);
  if (error) return { error: t.save };

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moveApplication(id: string, status: Status) {
  if (!isStatus(status)) return;
  const { supabase } = await requireUser();
  await supabase.from("applications").update({ status }).eq("id", id);
  revalidatePath("/dashboard");
}

export async function deleteApplication(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function loadSampleData() {
  const { supabase } = await requireUser();
  const samples: { company: string; position: string; status: Status; location: string; salary_range?: string; notes?: string }[] = [
    // Fictional companies — demo data only.
    { company: "Northwind Labs", position: "Junior Frontend Developer", status: "saved", location: "Prishtina" },
    { company: "Brightloop", position: "Software Engineering Intern", status: "applied", location: "Prishtina", notes: "Applied through LinkedIn." },
    { company: "Kodra Studio", position: "Junior .NET Developer", status: "applied", location: "Prishtina · Hybrid" },
    { company: "Orbitly", position: "React Native Developer", status: "interview", location: "Remote", salary_range: "€1,200–1,600", notes: "Technical interview on Thursday — review hooks and Supabase RLS." },
    { company: "Pixelforge", position: "Full-Stack Intern", status: "offer", location: "Prishtina", notes: "Offer received — reply by Friday." },
    { company: "Bluepeak Agency", position: "Web Developer", status: "rejected", location: "Mitrovica", notes: "Asked for more backend experience." },
  ];
  await supabase.from("applications").insert(samples);
  revalidatePath("/dashboard");
}
