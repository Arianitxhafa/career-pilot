import { redirect } from "next/navigation";
import { PlaneTakeoff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/AppSidebar";
import { leaveDemo } from "@/app/demo-actions";
import { getT } from "@/i18n/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase.from("applications").select("status");
  const statuses = (rows ?? []).map((r) => r.status as string);
  const isDemo = Boolean(user.is_anonymous);
  const t = await getT();
  const name = (user.user_metadata?.full_name as string | undefined) || (isDemo ? "Demo Pilot" : user.email?.split("@")[0]) || "Pilot";

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AppSidebar
        name={name}
        email={user.email ?? ""}
        isDemo={isDemo}
        stats={{
          active: statuses.filter((s) => s === "applied" || s === "interview").length,
          interviews: statuses.filter((s) => s === "interview").length,
        }}
      />
      <div className="nav-grid min-w-0 flex-1">
        {isDemo && (
          <div className="mx-auto mt-4 flex max-w-[1400px] animate-rise flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-amber/40 bg-amber-soft px-4 py-3 text-sm sm:mx-6 sm:mt-6">
            <PlaneTakeoff className="size-4 shrink-0 text-amber" aria-hidden />
            <p className="min-w-0 flex-1">
              <span className="font-semibold">{t.demoBanner.title}</span> <span className="text-muted">{t.demoBanner.text}</span>
            </p>
            <form action={leaveDemo} className="max-sm:basis-full max-sm:pl-8">
              <button className="font-semibold text-brand underline-offset-4 hover:underline">{t.demoBanner.cta}</button>
            </form>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
