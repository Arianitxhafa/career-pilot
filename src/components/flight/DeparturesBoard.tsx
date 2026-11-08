"use client";

import { useEffect, useState } from "react";
import { SplitFlap } from "./SplitFlap";
import { useT } from "@/i18n/client";

type Row = { time: string; flight: string; company: string; role: string; gate: string; status: number };
const STAGES = 4;
const TONE = ["text-slate-300", "text-sky-300", "text-board-ink", "text-emerald-300"];

const START: Row[] = [
  { time: "09:40", flight: "NW 214", company: "NORTHWIND", role: "FRONTEND DEV", gate: "PRN", status: 0 },
  { time: "10:15", flight: "BL 808", company: "BRIGHTLOOP", role: "SWE INTERN", gate: "PRN", status: 1 },
  { time: "11:05", flight: "OR 302", company: "ORBITLY", role: "RN DEVELOPER", gate: "RMT", status: 2 },
  { time: "12:30", flight: "PF 117", company: "PIXELFORGE", role: "FULL-STACK", gate: "PRN", status: 3 },
  { time: "13:50", flight: "KD 451", company: "KODRA", role: ".NET JUNIOR", gate: "HYB", status: 1 },
];

/** A live departures board where applications move from Saved to Offer, one flap at a time. */
export function DeparturesBoard({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState(START);
  const t = useT().landing.board;
  const width = Math.max(...t.route.map((s) => s.length));

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0;
    const id = setInterval(() => {
      const row = i++ % START.length;
      setRows((rs) => rs.map((r, k) => (k === row ? { ...r, status: (r.status + 1) % STAGES } : r)));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-board text-[#e8ecf6] shadow-[0_40px_90px_-40px_rgb(0_0_0/0.9)]" role="img" aria-label={t.label}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="flex items-center gap-2 font-mono text-xs font-bold tracking-[0.25em] text-board-ink">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-board-ink/60" />
            <span className="relative inline-flex size-2 rounded-full bg-board-ink" />
          </span>
          {t.departures}
        </p>
        <p className="font-mono text-[10px] tracking-widest text-white/40">CAREERPILOT · PRN</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-[11px] sm:min-w-[30rem] sm:text-xs lg:min-w-[26rem] xl:min-w-[30rem]">
          <thead className="text-left text-[10px] tracking-[0.2em] text-white/40">
            <tr>
              <th className="px-2.5 py-2 font-medium sm:px-4">{t.time}</th>
              {!compact && <th className="hidden px-2 py-2 font-medium sm:table-cell lg:hidden xl:table-cell">{t.flight}</th>}
              <th className="px-2 py-2 font-medium">{t.company}</th>
              <th className="hidden px-2 py-2 font-medium sm:table-cell">{t.role}</th>
              <th className="px-2.5 py-2 font-medium sm:px-4">{t.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.flight} className="border-t border-white/[0.06]">
                <td className="px-2.5 py-2.5 text-white/70 sm:px-4">{r.time}</td>
                {!compact && <td className="hidden px-2 py-2.5 text-white/50 sm:table-cell lg:hidden xl:table-cell">{r.flight}</td>}
                <td className="px-2 py-2.5 font-semibold">{r.company}</td>
                <td className="hidden px-2 py-2.5 text-white/70 sm:table-cell">{r.role}</td>
                <td className={`py-2.5 pr-2 pl-2.5 font-bold sm:px-4 ${TONE[r.status]}`}>
                  <SplitFlap text={t.route[r.status]} length={width} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
