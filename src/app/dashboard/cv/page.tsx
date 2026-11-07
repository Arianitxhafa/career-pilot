import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CvForm } from "@/components/CvForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).cv.title };
}

export default async function CvPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("cv_text, updated_at").eq("user_id", user.id).maybeSingle();
  const t = (await getT()).cv;

  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:grid-cols-[1fr_280px]">
        <section className="animate-rise">
          <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">{t.eyebrow}</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t.heading}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t.text}
          </p>
          <CvForm initialCv={profile?.cv_text ?? ""} updatedAt={profile?.updated_at ?? null} />
        </section>
        <aside className="animate-rise space-y-3 [animation-delay:120ms] lg:pt-16">
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm shadow-card">
            <p className="font-semibold">{t.tips}</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-muted">
              {t.tipList.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted shadow-card">
            {t.privacy}
          </div>
        </aside>
      </main>
    </div>
  );
}
