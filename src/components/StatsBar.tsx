import { Gauge, PlaneLanding, PlaneTakeoff, Send, Trophy, type LucideIcon } from "lucide-react";
import type { computeStats } from "@/lib/applications";
import { CountUp } from "./CountUp";
import type { Dict } from "@/i18n/messages";

type Stats = ReturnType<typeof computeStats>;

/** The instrument panel: five readouts, the response rate as a dial. */
export function StatsBar({ stats, t }: { stats: Stats; t: Dict["stats"] }) {
  const tiles: { label: string; value: number; hint: string; icon: LucideIcon; tone?: "brand" }[] = [
    { label: t.tracked, value: stats.total, hint: t.trackedHint, icon: PlaneTakeoff },
    { label: t.sent, value: stats.sent, hint: t.sentHint, icon: Send },
    { label: t.interviews, value: stats.interviews, hint: t.interviewsHint, icon: PlaneLanding },
    { label: t.offers, value: stats.offers, hint: t.offersHint, icon: Trophy, tone: "brand" },
  ];
  const r = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <section aria-label={t.label} className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.slice(0, 2).map((t) => (
        <Tile key={t.label} {...t} />
      ))}
      <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card sm:col-span-1">
        <svg viewBox="0 0 64 64" className="size-14 shrink-0 -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - stats.responseRate / 100)}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div>
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.18em] text-muted uppercase">
            <Gauge className="size-3.5" aria-hidden /> {t.response}
          </p>
          <p className="mt-1 font-display text-3xl leading-none font-bold">
            <CountUp value={stats.responseRate} suffix="%" />
          </p>
          <p className="mt-1 text-xs text-muted">{t.responseHint}</p>
        </div>
      </div>
      {tiles.slice(2).map((t) => (
        <Tile key={t.label} {...t} />
      ))}
    </section>
  );
}

function Tile({ label, value, hint, icon: Icon, tone }: { label: string; value: number; hint: string; icon: LucideIcon; tone?: "brand" }) {
  const brand = tone === "brand";
  return (
    <div className={`rounded-2xl border p-4 shadow-card transition hover:-translate-y-0.5 ${brand ? "border-transparent bg-brand text-brand-ink" : "border-line bg-surface"}`}>
      <p className={`flex items-center justify-between font-mono text-[10px] font-bold tracking-[0.18em] uppercase ${brand ? "text-brand-ink/80" : "text-muted"}`}>
        {label} <Icon className="size-4" aria-hidden />
      </p>
      <p className="mt-2 font-display text-4xl leading-none font-bold">
        <CountUp value={value} />
      </p>
      <p className={`mt-1.5 text-xs ${brand ? "text-brand-ink/75" : "text-muted"}`}>{hint}</p>
    </div>
  );
}
