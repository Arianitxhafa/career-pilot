// CSV export (pure, unit-tested). RFC 4180 quoting, a UTF-8 BOM so Excel shows ë/ç correctly, and protection
// against formula injection: a cell that starts with = + - @ or a control character is prefixed with ' so a
// spreadsheet treats it as text instead of running it.

export type Cell = string | number | null | undefined;

export function csvCell(value: Cell): string {
  if (value == null) return "";
  let s = String(value);
  if (/^[=+\-@\t\r\n]/.test(s) && !(typeof value === "number")) s = `'${s}`;
  return /[",\r\n]|^\s|\s$/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: Cell[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

/** YYYY-MM-DD in Kosovo time: sortable, and every spreadsheet reads it as a date. */
export const isoDay = (v: string | null | undefined) =>
  v ? new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(v)) : null;

type App = {
  id: string;
  company: string;
  position: string;
  status: string;
  location: string | null;
  salary_range: string | null;
  job_url: string | null;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export function applicationsCsv(apps: App[], scores: Record<string, number>, labels: { headers: string[]; status: Record<string, string> }) {
  return toCsv([
    labels.headers,
    ...apps.map((a) => [
      a.company,
      a.position,
      labels.status[a.status] ?? a.status,
      a.location,
      a.salary_range,
      a.job_url,
      a.applied_at ? a.applied_at.slice(0, 10) : null,
      isoDay(a.created_at),
      isoDay(a.updated_at),
      scores[a.id] ?? null,
      a.notes,
    ]),
  ]);
}
