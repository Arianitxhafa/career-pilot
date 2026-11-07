// Insights maths (pure, unit-tested): funnel, weekly activity, response time, weekly goal, skill gaps.
import type { Status } from "./applications";

/** YYYY-MM-DD in Kosovo time (kept local so this module has no runtime imports). */
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Belgrade", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

type App = { id: string; status: Status; applied_at: string | null; created_at: string };
type Hist = { application_id: string; to_status: Status; created_at: string };

const ORDER: Status[] = ["saved", "applied", "interview", "offer"];

/** Monday (YYYY-MM-DD) of the week a day belongs to. */
export function weekStart(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - back * 86_400_000).toISOString().slice(0, 10);
}

const addDays = (day: string, n: number) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Which stages each application has ever reached (history + current status). A rejection implies it was sent. */
function reached(apps: App[], history: Hist[]) {
  const map = new Map<string, Set<Status>>();
  for (const a of apps) map.set(a.id, new Set<Status>(["saved", a.status]));
  for (const h of history) map.get(h.application_id)?.add(h.to_status);
  for (const [id, set] of map) {
    const app = apps.find((a) => a.id === id)!;
    if (app.applied_at || set.has("rejected")) set.add("applied");
    if (set.has("offer")) set.add("interview");
    if (set.has("interview")) set.add("applied");
  }
  return map;
}

export type FunnelStep = { status: Status; count: number; pctOfPrevious: number | null; pctOfTotal: number };

/** How many applications reached each stage, and the conversion from the stage before. */
export function funnel(apps: App[], history: Hist[]): FunnelStep[] {
  const r = reached(apps, history);
  const counts = ORDER.map((s) => [...r.values()].filter((set) => set.has(s)).length);
  return ORDER.map((status, i) => ({
    status,
    count: counts[i],
    pctOfPrevious: i === 0 ? null : counts[i - 1] ? Math.round((counts[i] / counts[i - 1]) * 100) : 0,
    pctOfTotal: counts[0] ? Math.round((counts[i] / counts[0]) * 100) : 0,
  }));
}

/** Applications sent per week (Monday-start, Kosovo time) for the last `weeks` weeks, oldest first. */
export function weeklySent(apps: App[], weeks = 12, now = new Date()) {
  const thisWeek = weekStart(dayKey(now));
  const keys = Array.from({ length: weeks }, (_, i) => addDays(thisWeek, -7 * (weeks - 1 - i)));
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const a of apps) {
    if (!a.applied_at) continue;
    const k = weekStart(a.applied_at.slice(0, 10));
    if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
  }
  return keys.map((week) => ({ week, count: counts.get(week)! }));
}

/** Days from sending an application to the first reply (interview, offer or rejection). */
export function responseTimes(apps: App[], history: Hist[]) {
  const days: number[] = [];
  for (const a of apps) {
    if (!a.applied_at) continue;
    const sent = a.applied_at.slice(0, 10);
    const reply = history
      .filter((h) => h.application_id === a.id && (h.to_status === "interview" || h.to_status === "offer" || h.to_status === "rejected"))
      .map((h) => dayKey(new Date(h.created_at)))
      .filter((d) => d >= sent)
      .sort()[0];
    if (reply) days.push(daysBetween(sent, reply));
  }
  days.sort((x, y) => x - y);
  const median = days.length ? (days.length % 2 ? days[(days.length - 1) / 2] : Math.round((days[days.length / 2 - 1] + days[days.length / 2]) / 2)) : null;
  const average = days.length ? Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10 : null;
  return { replies: days.length, median, average, fastest: days[0] ?? null, slowest: days.at(-1) ?? null };
}

/** This week's progress towards the weekly goal, and how many weeks in a row it was met. */
export function goalProgress(apps: App[], goal: number, now = new Date()) {
  const weeks = weeklySent(apps, 52, now);
  const thisWeek = weeks.at(-1)!.count;
  let streak = 0;
  for (let i = weeks.length - 2; i >= 0 && weeks[i].count >= goal; i--) streak++;
  if (thisWeek >= goal) streak++;
  return { goal, thisWeek, remaining: Math.max(0, goal - thisWeek), pct: Math.min(100, Math.round((thisWeek / goal) * 100)), streak };
}

/** The skills job posts ask for that your CV misses most often (from co-pilot results on open applications). */
export function topMissingSkills(analyses: { missing_keywords?: string[] }[], limit = 8) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const a of analyses) {
    const seen = new Set<string>();
    for (const raw of a.missing_keywords ?? []) {
      const label = raw.trim();
      const key = label.toLowerCase();
      if (!label || seen.has(key)) continue;
      seen.add(key);
      const entry = counts.get(key) ?? { label, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, limit);
}
