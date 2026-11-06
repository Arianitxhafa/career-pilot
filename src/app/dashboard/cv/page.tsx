import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/DashboardHeader";
import { CvForm } from "@/components/CvForm";

export const metadata: Metadata = { title: "My CV" };

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("cv_text, updated_at").eq("user_id", user.id).maybeSingle();

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader email={user.email} active="cv" />
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_280px]">
        <section className="animate-rise">
          <p className="text-sm font-medium text-brand">Co-pilot setup</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your CV</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Paste the text of your CV once. The AI co-pilot compares it with each job post you save and tells you how well you match, what&apos;s missing and how to tailor your application.
          </p>
          <CvForm initialCv={profile?.cv_text ?? ""} updatedAt={profile?.updated_at ?? null} />
        </section>
        <aside className="animate-rise space-y-3 [animation-delay:120ms] lg:pt-16">
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm">
            <p className="font-semibold">Tips</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-muted">
              <li>Open your CV PDF, select all (Ctrl+A), copy and paste it here.</li>
              <li>Keep projects, skills, education and languages — that&apos;s what gets matched.</li>
              <li>Update it whenever you ship something new.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
            🔒 Your CV is private: Row Level Security makes sure only you can read it. It&apos;s sent to Claude only when you ask for an analysis.
          </div>
        </aside>
      </main>
    </div>
  );
}
