import Link from "next/link";
import { ArrowRight, BarChart3, Check, GripVertical, Lock, Radar, Search, Smartphone, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { DemoButton } from "@/components/DemoButton";
import { DeparturesBoard } from "@/components/flight/DeparturesBoard";
import { FlightRoute } from "@/components/flight/FlightRoute";
import { CountUp } from "@/components/CountUp";
import { eyebrow, primaryButton, secondaryButton } from "@/components/ui";
import { Preferences } from "@/components/Preferences";
import { getT } from "@/i18n/server";

const FEATURE_ICONS = [GripVertical, BarChart3, Sparkles, Lock, Search, Smartphone];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = (await getT()).landing;

  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label={t.nav.sections}>
            <a href="#how" className="transition hover:text-fg">{t.nav.how}</a>
            <a href="#features" className="transition hover:text-fg">{t.nav.features}</a>
            <a href="#copilot" className="transition hover:text-fg">{t.nav.copilot}</a>
            <a href="#faq" className="transition hover:text-fg">{t.nav.faq}</a>
          </nav>
          <div className="flex items-center gap-2">
            <Preferences className="max-sm:hidden" />
            {user ? (
              <Link href="/dashboard" className={primaryButton}>
                {t.openDashboard}
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-surface-2 sm:inline-flex">
                  {t.signIn}
                </Link>
                <Link href="/signup" className={primaryButton}>
                  {t.getStarted}
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
                <span className="size-1.5 rounded-full bg-emerald-500" /> {t.badge}
              </p>
              <h1 className="mt-6 font-display text-5xl leading-[0.98] font-bold tracking-tight text-balance sm:text-7xl">
                {t.heroA} <span className="relative whitespace-nowrap text-brand">{t.heroB}</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted text-balance">
                {t.heroText}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={user ? "/dashboard" : "/signup"} className={`${primaryButton} group px-6 py-3 text-base`}>
                  {user ? t.goToBoard : t.startFree} <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </Link>
                {!user && <DemoButton className={`${secondaryButton} px-6 py-3 text-base`} />}
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-center gap-1.5">
                    <Check className="size-4 text-brand" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative animate-rise [animation-delay:150ms]">
              <DeparturesBoard />
              {/* Floating boarding pass */}
              <div className="pass absolute top-[calc(100%+0.75rem)] left-10 hidden w-64 rotate-[-4deg] animate-float rounded-2xl border border-line bg-surface p-4 shadow-card sm:block lg:-left-10">
                <div className="flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-muted">
                  <span>{t.pass.title}</span>
                  <span className="text-brand">OR 302</span>
                </div>
                <p className="mt-2 font-display text-lg leading-tight font-bold">React Native Developer</p>
                <p className="text-xs text-muted">Orbitly · Remote</p>
                <div className="my-3 border-t border-dashed border-line" />
                <div className="flex justify-between font-mono text-[11px]">
                  <span>
                    <span className="block text-muted">{t.pass.status}</span>
                    <b className="text-amber">{t.pass.interview}</b>
                  </span>
                  <span className="text-right">
                    <span className="block text-muted">{t.pass.match}</span>
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
            {[...t.marquee, ...t.marquee].map((m, i) => (
              <span key={i} className="flex items-center gap-10">
                {m} <span className="text-brand">✈</span>
              </span>
            ))}
          </div>
        </div>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className={eyebrow}>{t.howEyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{t.howTitle}</h2>
            <p className="mt-3 text-muted">{t.howText}</p>
          </div>
          <div className="reveal mt-12 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-8">
            <FlightRoute stops={t.route} />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <div className="reveal max-w-2xl">
            <p className={eyebrow}>{t.featuresEyebrow}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{t.featuresTitle}</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
              <div key={f.title} className={`reveal group rounded-3xl border border-line bg-surface p-6 shadow-card transition hover:-translate-y-1 hover:border-brand/40 ${i === 0 ? "lg:col-span-2" : ""}`}>
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-xl font-bold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.text}</p>
              </div>
              );
            })}
          </div>
        </section>

        {/* Co-pilot */}
        <section id="copilot" className="scroll-mt-20 px-4 pb-24 sm:px-6">
          <div className="reveal relative mx-auto grid max-w-6xl items-center gap-10 overflow-hidden rounded-[2rem] border border-white/10 bg-board bg-[linear-gradient(135deg,rgb(108_141_255/0.10),transparent_55%)] p-8 text-[#e8ecf6] shadow-card sm:p-12 lg:grid-cols-2">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-[#6c8dff]/25 blur-3xl" />
            <div className="relative">
              <p className="font-mono text-xs font-bold tracking-[0.22em] text-board-ink uppercase">{t.copilotEyebrow}</p>
              <h2 className="mt-3 font-display text-4xl leading-tight font-bold tracking-tight sm:text-5xl">{t.copilotTitle}</h2>
              <p className="mt-4 text-white/70">
                {t.copilotText}
              </p>
              <ul className="mt-6 grid gap-2 text-sm text-white/80">
                {t.copilotPoints.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check className="size-4 text-[#6c8dff]" /> {p}
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
                  <p className="mt-1 font-mono text-xs tracking-[0.2em] text-white/60">{t.matchScore}</p>
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
          <h2 className="reveal font-display text-4xl font-bold tracking-tight">{t.faqTitle}</h2>
          <div className="mt-6 divide-y divide-line border-y border-line">
            {t.faq.map((f) => (
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
            <h2 className="max-w-2xl font-display text-4xl leading-tight font-bold tracking-tight text-balance sm:text-5xl">{t.ctaTitle}</h2>
            <p className="max-w-md text-muted">{t.ctaText}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={user ? "/dashboard" : "/signup"} className={`${primaryButton} px-6 py-3 text-base`}>
                {user ? t.openBoard : t.createAccount}
              </Link>
              {!user && <DemoButton className={`${secondaryButton} px-6 py-3 text-base`} label={t.exploreDemoFirst} />}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:px-6">
          <Logo />
          <Preferences className="sm:hidden" />
          <span>
            © 2026 · {t.builtBy}{" "}
            <a href="https://arianitxhafa.github.io" className="font-semibold text-fg hover:text-brand">
              Arianit Xhafa
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
