// Events (interviews, follow-ups, deadlines): pure helpers for labels, the calendar grid and .ics files.

export const EVENT_KINDS = ["interview", "follow_up", "deadline", "other"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export type AppEvent = {
  id: string;
  application_id: string;
  kind: EventKind;
  title: string;
  starts_at: string; // ISO
  duration_minutes: number;
  location: string | null;
  notes: string | null;
  done: boolean;
};

export const EVENT_META: Record<EventKind, { label: string; chip: string; dot: string }> = {
  interview: { label: "Interview", chip: "bg-amber-soft text-amber", dot: "bg-amber" },
  follow_up: { label: "Follow-up", chip: "bg-brand-soft text-brand", dot: "bg-brand" },
  deadline: { label: "Deadline", chip: "bg-rose-500/12 text-rose-600 dark:text-rose-300", dot: "bg-rose-500" },
  other: { label: "Event", chip: "bg-surface-2 text-muted", dot: "bg-slate-400" },
};

export function isEventKind(v: unknown): v is EventKind {
  return typeof v === "string" && (EVENT_KINDS as readonly string[]).includes(v);
}

export const TIME_ZONE = "Europe/Belgrade"; // CareerPilot is built for students in Kosovo

/** YYYY-MM-DD of an instant in the app's time zone. */
export function dayKey(date: Date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function timeLabel(date: Date, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(date);
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000);

/** "Today 14:00", "Tomorrow 10:00", "Fri 12 Nov", "2 days overdue". */
export function whenLabel(event: Pick<AppEvent, "starts_at" | "done" | "kind">, now = new Date(), timeZone = TIME_ZONE) {
  const at = new Date(event.starts_at);
  const diff = dayDiff(dayKey(at, timeZone), dayKey(now, timeZone));
  const time = event.kind === "follow_up" || event.kind === "deadline" ? "" : ` ${timeLabel(at, timeZone)}`;
  if (!event.done && at < now && diff < 0) return { text: `${-diff} day${diff === -1 ? "" : "s"} overdue`, urgent: true };
  if (diff === 0) return { text: `Today${time}`, urgent: !event.done };
  if (diff === 1) return { text: `Tomorrow${time}`, urgent: false };
  if (diff > 1 && diff < 7)
    return { text: `${new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "short" }).format(at)}${time}`, urgent: false };
  return { text: `${new Intl.DateTimeFormat("en-GB", { timeZone, day: "numeric", month: "short" }).format(at)}${time}`, urgent: false };
}

/** The next open event for each application, and whether a follow-up/deadline is overdue. */
export function nextEventByApplication(events: AppEvent[], now = new Date()) {
  const map: Record<string, AppEvent> = {};
  for (const e of [...events].filter((e) => !e.done).sort((a, b) => a.starts_at.localeCompare(b.starts_at))) {
    const overdue = new Date(e.starts_at) < now && e.kind !== "interview";
    const current = map[e.application_id];
    // Overdue follow-ups win (they need action now); otherwise the soonest upcoming event.
    if (!current || (overdue && new Date(current.starts_at) >= now)) {
      if (overdue || new Date(e.starts_at) >= now || !current) map[e.application_id] = e;
    }
  }
  return map;
}

/** Weeks (Monday first) covering a month, as YYYY-MM-DD strings; days outside the month are included. */
export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // Monday = 0
  const start = new Date(first.getTime() - offset * 86_400_000);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start.getTime() + (w * 7 + d) * 86_400_000).toISOString().slice(0, 10))
  );
}

export function parseMonth(value: string | undefined, now = new Date()) {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (m && Number(m[2]) >= 1 && Number(m[2]) <= 12) return { year: Number(m[1]), month: Number(m[2]) };
  const [y, mo] = dayKey(now).split("-").map(Number);
  return { year: y, month: mo };
}

export function shiftMonth({ year, month }: { year: number; month: number }, by: number) {
  const d = new Date(Date.UTC(year, month - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// ---- iCalendar (.ics) --------------------------------------------------------------------

/** Escape text per RFC 5545 (backslash, semicolon, comma, newlines). */
export function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Fold lines longer than 75 octets (continuation lines start with a space). */
export function icsFold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export function buildIcs(events: { id: string; title: string; starts_at: string; duration_minutes: number; location?: string | null; description?: string | null; url?: string | null }[], now = new Date()) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//CareerPilot//Job search//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const e of events) {
    const start = new Date(e.starts_at);
    const end = new Date(start.getTime() + e.duration_minutes * 60_000);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@careerpilot`,
      `DTSTAMP:${icsDate(now)}`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(e.title)}`
    );
    if (e.location) lines.push(`LOCATION:${icsEscape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${icsEscape(e.description)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "TRIGGER:-PT1H", "END:VALARM", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}
