import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { STATUS_META, type Status } from "@/lib/applications";

const preview: { status: Status; cards: { company: string; role: string; tag: string }[] }[] = [
  { status: "saved", cards: [{ company: "Northwind Labs", role: "Frontend Developer", tag: "Prishtina" }] },
  { status: "applied", cards: [{ company: "Brightloop", role: "Engineering Intern", tag: "Hybrid" }, { company: "Kodra Studio", role: "Junior .NET Dev", tag: "On-site" }] },
  { status: "interview", cards: [{ company: "Orbitly", role: "React Native Dev", tag: "Remote" }] },
  { status: "offer", cards: [{ company: "Pixelforge", role: "Full-Stack Intern", tag: "🎉 Offer" }] },
];

const features = [
  { icon: "🗂️", title: "One board for every application", text: "Drag jobs from Saved to Applied, Interview and Offer. No more lost spreadsheets or forgotten follow-ups." },
  { icon: "📈", title: "Know your numbers", text: "See how many applications you sent, your response rate and how many turned into interviews and offers." },
  { icon: "🔒", title: "Private by design", text: "Every row is protected by Postgres Row Level Security — only you can ever read your applications." },
  { icon: "🤖", title: "AI co-pilot — coming soon", text: "Paste a job post and get a match score against your CV, missing keywords and a tailored cover letter." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -top-48 right-[-10%] size-[42rem] rounded-full bg-brand/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[30rem] left-[-15%] size-[30rem] rounded-full bg-amber/20 blur-3xl" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 hover:brightness-110">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-semibold hover:bg-surface-2">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 hover:brightness-110">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="animate-rise pt-12 pb-16 text-center sm:pt-20">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Built for students entering the job market
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Your job search, <span className="text-brand">finally under control.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted text-balance sm:text-lg">
            CareerPilot keeps every application on one board — from the first save to the offer — so you always know where you stand and what to do next.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={user ? "/dashboard" : "/signup"} className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/30 hover:brightness-110">
              {user ? "Go to your board →" : "Start tracking — it's free →"}
            </Link>
            <a href="#features" className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-semibold hover:bg-surface-2">
              See how it works
            </a>
          </div>
        </section>

        <section aria-label="Board preview" className="animate-rise rounded-3xl border border-line bg-surface/80 p-3 shadow-2xl shadow-brand/10 backdrop-blur [animation-delay:150ms] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {preview.map((col) => (
              <div key={col.status} className="rounded-2xl bg-surface-2/70 p-3">
                <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold">
                  <span className={`size-2.5 rounded-full ${STATUS_META[col.status].dot}`} />
                  {STATUS_META[col.status].label}
                  <span className="text-xs font-medium text-muted">{col.cards.length}</span>
                </div>
                <div className="grid gap-2.5">
                  {col.cards.map((c) => (
                    <div key={c.company} className="rounded-xl border border-line bg-surface p-3 shadow-sm">
                      <p className="text-xs font-medium text-muted">{c.company}</p>
                      <p className="mt-0.5 font-semibold">{c.role}</p>
                      <span className="mt-2 inline-block rounded-md bg-surface-2 px-1.5 py-0.5 text-xs text-muted">{c.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="grid gap-4 py-20 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-3xl border border-line bg-surface p-6">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-xl">{f.icon}</span>
              <h2 className="mt-4 text-lg font-bold tracking-tight">{f.title}</h2>
              <p className="mt-1.5 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="relative mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <span>© 2026 CareerPilot</span>
          <span>
            Built by{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
