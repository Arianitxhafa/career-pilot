import { Gauge, PlaneLanding, PlaneTakeoff, Send, Trophy, type LucideIcon } from "lucide-react";
import type { computeStats } from "@/lib/applications";
import { CountUp } from "./CountUp";

type Stats = ReturnType<typeof computeStats>;

/** The instrument panel: five readouts, the response rate as a dial. */
export function StatsBar({ stats }: { stats: Stats }) {
  const tiles: { label: string; value: number; hint: string; icon: LucideIcon; tone?: "brand" }[] = [
    { label: "Tracked", value: stats.total, hint: "jobs on your board", icon: PlaneTakeoff },
    { label: "Sent", value: stats.sent, hint: "applications submitted", icon: Send },
    { label: "Interviews", value: stats.interviews, hint: "reached interview stage", icon: PlaneLanding },
    { label: "Offers", value: stats.offers, hint: "offers received", icon: Trophy, tone: "brand" },
  ];
  const r = 26;
  const circumference = 2 * Math.PI * r;

  return (
    <section aria-label="Your stats" className="stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
            <Gauge className="size-3.5" aria-hidden /> Response
          </p>
          <p className="mt-1 font-display text-3xl leading-none font-bold">
            <CountUp value={stats.responseRate} suffix="%" />
          </p>
          <p className="mt-1 text-xs text-muted">of sent answered</p>
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
