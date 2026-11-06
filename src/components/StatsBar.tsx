import type { computeStats } from "@/lib/applications";

type Stats = ReturnType<typeof computeStats>;

export function StatsBar({ stats }: { stats: Stats }) {
  const tiles = [
    { label: "Tracked", value: stats.total, hint: "jobs on your board" },
    { label: "Sent", value: stats.sent, hint: "applications submitted" },
    { label: "Response rate", value: `${stats.responseRate}%`, hint: "of sent applications answered" },
    { label: "Interviews", value: stats.interviews, hint: "reached interview stage" },
    { label: "Offers", value: stats.offers, hint: "offers received", accent: true },
  ];

  return (
    <section aria-label="Your stats" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          style={{ animationDelay: `${60 * i}ms` }}
          className={`animate-rise rounded-2xl border p-4 ${
            t.accent ? "border-transparent bg-brand text-brand-ink shadow-lg shadow-brand/25" : "border-line bg-surface"
          }`}
        >
          <p className={`text-xs font-medium uppercase tracking-wider ${t.accent ? "text-brand-ink/80" : "text-muted"}`}>{t.label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{t.value}</p>
          <p className={`mt-1 text-xs ${t.accent ? "text-brand-ink/75" : "text-muted"}`}>{t.hint}</p>
        </div>
      ))}
    </section>
  );
}
