import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeStats, type Application } from "@/lib/applications";
import { Logo } from "@/components/Logo";
import { Board } from "@/components/Board";
import { StatsBar } from "@/components/StatsBar";
import { signOut } from "../(auth)/actions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("applications")
    .select("id, company, position, status, location, salary_range, job_url, notes, applied_at, created_at, updated_at")
    .order("updated_at", { ascending: false });
  const applications = (data ?? []) as Application[];
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Logo href="/dashboard" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-rise">
          <p className="text-sm font-medium text-brand">Mission control</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{name ? `Good to see you, ${name}.` : "Your job search"}</h1>
        </div>
        <StatsBar stats={computeStats(applications)} />
        <Board applications={applications} />
      </main>
    </div>
  );
}
