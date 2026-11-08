"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useT } from "@/i18n/client";
import { formatDate } from "@/lib/events";

type Point = { week: string; count: number };

const H = 220;
const PAD = { top: 14, right: 8, bottom: 28, left: 30 };
const GAP = 2; // surface gap between adjacent bars


/** Applications sent per week: thin bars with rounded tops, hover tooltip and a table for screen readers. */
export function WeeklyChart({ data, goal }: { data: Point[]; goal: number }) {
  const [active, setActive] = useState<number | null>(null);
  const t = useT().insights.chart;
  const locale = useLocale();
  const label = (week: string) => formatDate(new Date(`${week}T12:00:00Z`), locale, { day: true, month: "short" }, "UTC");
  // Draw at the real width so text stays 11px on phones instead of shrinking with the SVG.
  const ref = useRef<HTMLElement>(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const every = W < 480 ? 3 : 2; // label every 2nd or 3rd week, always including this week
  const max = Math.max(goal, ...data.map((d) => d.count), 1);
  const top = Math.ceil(max / 2) * 2; // even number so the midline is a whole number
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(28, slot - GAP * 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const point = active !== null ? data[active] : null;
  const empty = data.every((d) => d.count === 0);

  return (
    <figure ref={ref} className="relative m-0">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t.label(data.length)} onMouseLeave={() => setActive(null)}>
        {[0, top / 2, top].map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" className="font-mono">
              {t}
            </text>
          </g>
        ))}
        {/* Weekly goal as a dashed reference line */}
        <line x1={PAD.left} x2={W - PAD.right} y1={y(goal)} y2={y(goal)} stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x={W - PAD.right} y={y(goal) - 5} textAnchor="end" fontSize="11" fill="var(--amber)" className="font-mono font-bold">
          {t.goal} {goal}
        </text>
        {data.map((d, i) => {
          const x = PAD.left + i * slot + (slot - barW) / 2;
          const h = Math.max(0, y(0) - y(d.count));
          const r = Math.min(4, barW / 2, h);
          const isLast = i === data.length - 1;
          return (
            <g key={d.week}>
              {/* Hit target bigger than the bar */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={plotH} fill="transparent" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} tabIndex={0} aria-label={t.bar(label(d.week), d.count)} />
              {h > 0 && (
                <path
                  d={`M${x},${y(0)} V${y(d.count) + r} Q${x},${y(d.count)} ${x + r},${y(d.count)} H${x + barW - r} Q${x + barW},${y(d.count)} ${x + barW},${y(d.count) + r} V${y(0)} Z`}
                  fill="var(--chart)"
                  opacity={active === null || active === i ? 1 : 0.45}
                  pointerEvents="none"
                  style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `grow-y 0.7s cubic-bezier(0.22,1,0.36,1) ${150 + i * 40}ms both`, transition: "opacity 0.2s" }}
                />
              )}
              {(data.length - 1 - i) % every === 0 && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={isLast ? "var(--fg)" : "var(--muted)"} fontWeight={isLast ? 700 : 400}>
                  {isLast ? t.thisWeek : label(d.week)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {point && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-card"
          style={{ left: `${((PAD.left + (active! + 0.5) * slot) / W) * 100}%`, top: `${(y(point.count) / H) * 100}%` }}
        >
          <p className="font-semibold">{t.weekOf(label(point.week))}</p>
          <p className="text-muted">
            {t.sent(point.count)}
          </p>
        </div>
      )}
      {empty && <p className="absolute inset-0 grid place-items-center text-sm text-muted">{t.empty(data.length)}</p>}
      {/* Tables won't shrink to sr-only's 1px, so the wrapper is the hidden box (else it widens the page on small phones). */}
      <div className="sr-only">
        <table>
          <caption>{t.caption}</caption>
          <thead>
            <tr>
              <th>{t.weekCol}</th>
              <th>{t.appsCol}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.week}>
                <td>{label(d.week)}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
