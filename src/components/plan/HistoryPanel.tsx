import { STATUS_META, type Application, type HistoryEntry } from "@/lib/applications";
import { EVENT_META, TIME_ZONE, type AppEvent } from "@/lib/events";

const when = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TIME_ZONE });

/** The flight log: every stage change plus completed events, oldest first. */
export function HistoryPanel({ app, history, events }: { app: Application; history: HistoryEntry[]; events: AppEvent[] }) {
  const items = [
    ...history.map((h) => ({
      at: h.created_at,
      key: h.id,
      dot: STATUS_META[h.to_status].dot,
      text: h.from_status ? `Moved from ${STATUS_META[h.from_status].label} to ${STATUS_META[h.to_status].label}` : `Added to the board as ${STATUS_META[h.to_status].label}`,
    })),
    ...events
      .filter((e) => e.done)
      .map((e) => ({ at: e.starts_at, key: e.id, dot: EVENT_META[e.kind].dot, text: `${EVENT_META[e.kind].label} done — ${e.title}` })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  if (items.length === 0) return <p className="text-sm text-muted">No history yet for {app.company}.</p>;

  return (
    <ol className="relative grid gap-4 before:absolute before:top-2 before:bottom-2 before:left-[5px] before:w-px before:bg-line">
      {items.map((i) => (
        <li key={i.key} className="relative flex gap-3 pl-0">
          <span className={`relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-surface ${i.dot}`} aria-hidden />
          <div className="text-sm">
            <p className="font-medium">{i.text}</p>
            <p className="font-mono text-xs text-muted">{when(i.at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
