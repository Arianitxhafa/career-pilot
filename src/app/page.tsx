import Link from "next/link";
import { ArrowRight, BarChart3, Check, GripVertical, Lock, Radar, Search, Smartphone, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { DemoButton } from "@/components/DemoButton";
import { DeparturesBoard } from "@/components/flight/DeparturesBoard";
import { FlightRoute } from "@/components/flight/FlightRoute";
import { CountUp } from "@/components/CountUp";
import { eyebrow, primaryButton, secondaryButton } from "@/components/ui";

const MARQUEE = ["Kanban board", "Response rate", "Match score", "Row Level Security", "Drag & drop", "Missing keywords", "Free forever", "Dark mode"];

const FEATURES = [
  { icon: GripVertical, title: "One board, every application", text: "Drag jobs from Saved to Applied, Interview and Offer. No more lost spreadsheets.", wide: true },
  { icon: BarChart3, title: "Know your numbers", text: "Applications sent, response rate, interviews and offers — at a glance." },
  { icon: Sparkles, title: "Co-pilot match score", text: "Paste a job post and see how your CV matches — free, instant, no AI bill." },
  { icon: Lock, title: "Private by design", text: "Postgres Row Level Security: only you can ever read your applications." },
  { icon: Search, title: "Find anything", text: "Instant search across companies, roles and cities." },
  { icon: Smartphone, title: "Works on your phone", text: "A “Move to” menu replaces drag and drop on small screens." },
];

const FAQ = [
  { q: "Is CareerPilot free?", a: "Yes. The board, stats and the keyword co-pilot are free. An optional AI mode switches on only if the server has an API key." },
  { q: "Can I try it without signing up?", a: "Yes — “Try the live demo” opens a private board full of sample applications. It's deleted after 24 hours." },
  { q: "Who can see my applications?", a: "Only you. Every row is protected by Postgres Row Level Security, so even a bug in the app can't show your data to someone else." },
  { q: "How does the match score work?", a: "The co-pilot detects 70+ technologies in a job post, checks which ones your CV mentions and weighs nice-to-haves at half. It runs instantly in your account." },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Sections">
            <a href="#how" className="transition hover:text-fg">How it works</a>
            <a href="#features" className="transition hover:text-fg">Features</a>
            <a href="#copilot" className="transition hover:text-fg">Co-pilot</a>
            <a href="#faq" className="transition hover:text-fg">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/dashboard" className={primaryButton}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-surface-2 sm:inline-flex">
                  Sign in
                </Link>
                <Link href="/signup" className={primaryButton}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="nav-grid relative">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] size-[40rem] rounded-full bg-brand/15 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute bottom-0 left-[-12%] size-[28rem] rounded-full bg-amber/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 sm:pb-44 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Built for students entering the job market
              </p>
              <h1 className="mt-6 font-display text-5xl leading-[0.98] font-bold tracking-tight text-balance sm:text-7xl">
                Your job search, <span className="relative whitespace-nowrap text-brand">cleared for takeoff.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted text-balance">
                CareerPilot tracks every application from check-in to landing — and tells you which jobs match your CV best.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={user ? "/dashboard" : "/signup"} className={`${primaryButton} group px-6 py-3 text-base`}>
                  {user ? "Go to your board" : "Start free"} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                {!user && <DemoButton className={`${secondaryButton} px-6 py-3 text-base`} />}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {["No card needed", "Private by default", "Works on mobile"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="size-4 text-brand" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-rise [animation-delay:150ms]">
              <DeparturesBoard />
              {/* Floating boarding pass */}
              <div className="pass absolute top-[calc(100%+0.75rem)] left-10 hidden w-64 rotate-[-4deg] animate-float rounded-2xl border border-line bg-surface p-4 shadow-card sm:block lg:-left-10">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted">
                  <span>BOARDING PASS</span>
                  <span className="text-brand">OR 302</span>
                </div>
                <p className="mt-2 font-display text-lg leading-tight font-bold">React Native Developer</p>
                <p className="text-xs text-muted">Orbitly · Remote</p>
                <div className="my-3 border-t border-dashed border-line" />
                <div className="flex justify-between font-mono text-[11px]">
                  <span>
                    <span className="block text-muted">STATUS</span>
                    <b className="text-amber">INTERVIEW</b>
                  </span>
                  <span className="text-right">
                    <span className="block text-muted">MATCH</span>
                    <b className="text-brand">86</b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-y border-line bg-surface/60 py-4" aria-hidden>
          <div className="flex w-max animate-marquee gap-10 font-mono text-sm tracking-[0.15em] text-muted uppercase">
            {[...MARQUEE, ...MARQUEE].map((m, i) => (
              <span key={i} className="flex items-center gap-10">
                {m} <span className="text-brand">✈</span>
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className={eyebrow}>How it works</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">From check-in to landing.</h2>
            <p className="mt-3 text-muted">Every job you find gets a boarding pass. Move it along the route as you apply, interview and land the offer.</p>
          </div>
          <div className="reveal mt-12 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-8">
            <FlightRoute />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className={eyebrow}>Features</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Everything a job search needs. Nothing it doesn&apos;t.</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className={`reveal group rounded-3xl border border-line bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:border-brand/40 ${f.wide ? "lg:col-span-2" : ""}`}>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:scale-110">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Co-pilot */}
        <section id="copilot" className="scroll-mt-20 px-4 pb-24 sm:px-6">
          <div className="reveal relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-white/10 bg-board bg-[linear-gradient(135deg,rgb(108_141_255/0.10),transparent_55%)] p-8 text-[#e8ecf6] shadow-card sm:p-12 lg:grid-cols-2">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#6c8dff]/25 blur-3xl" />
            <div className="relative">
              <p className="font-mono text-xs font-bold tracking-[0.22em] text-board-ink uppercase">Co-pilot</p>
              <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Know which jobs fit before you apply.</h2>
              <p className="mt-4 text-white/70">
                Paste a job post. CareerPilot finds the technologies it asks for, checks your CV and gives you a match score with the exact keywords you&apos;re missing.
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-white/80">
                {["70+ technologies, matched by alias", "Required skills count double", "Concrete suggestions for your CV"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="size-4 text-[#6c8dff]" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative grid place-items-center">
              <div className="relative grid size-64 place-items-center rounded-full border border-white/10 bg-[radial-gradient(circle,rgb(108_141_255/0.12),transparent_70%)]">
                {/* Radar sweep */}
                <div className="absolute inset-0 animate-sweep rounded-full bg-[conic-gradient(from_0deg,rgb(108_141_255/0.35),transparent_25%)]" aria-hidden />
                <div className="absolute inset-8 rounded-full border border-white/10" aria-hidden />
                <div className="absolute inset-16 rounded-full border border-white/10" aria-hidden />
                <span className="absolute top-10 right-14 size-2 animate-blip rounded-full bg-emerald-400" aria-hidden />
                <span className="absolute bottom-14 left-12 size-2 animate-blip rounded-full bg-board-ink [animation-delay:1.3s]" aria-hidden />
                <div className="relative text-center">
                  <p className="font-display text-7xl leading-none font-bold">
                    <CountUp value={86} />
                  </p>
                  <p className="mt-1 font-mono text-xs tracking-[0.2em] text-white/60">MATCH SCORE</p>
                </div>
              </div>
              <div className="mt-6 flex max-w-sm flex-wrap justify-center gap-2 font-mono text-xs">
                {["React Native", "TypeScript", "Expo", "REST"].map((s) => (
                  <span key={s} className="rounded-md bg-emerald-400/15 px-2 py-1 text-emerald-300">✓ {s}</span>
                ))}
                {["Kotlin", "Firebase"].map((s) => (
                  <span key={s} className="rounded-md bg-[#ffc85c]/15 px-2 py-1 text-board-ink">+ {s}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="reveal font-display text-4xl font-bold tracking-tight">Questions</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="reveal group py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border border-line text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="reveal nav-grid relative mx-auto flex max-w-6xl flex-col items-center gap-6 overflow-hidden rounded-[2rem] border border-line bg-surface px-6 py-16 text-center shadow-card">
            <Radar className="size-9 text-brand" />
            <h2 className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">Ready for departure?</h2>
            <p className="max-w-md text-muted">Put your next ten applications on the board and see where they land.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className={`${primaryButton} px-6 py-3 text-base`}>
                {user ? "Open your board" : "Create a free account"}
              </Link>
              {!user && <DemoButton className={`${secondaryButton} px-6 py-3 text-base`} label="Explore the demo first" />}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <span>
            © 2026 · Built by{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
