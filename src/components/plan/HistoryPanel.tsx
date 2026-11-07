import { STATUS_META, type Application, type HistoryEntry } from "@/lib/applications";
import { EVENT_META, formatDate, TIME_ZONE, type AppEvent } from "@/lib/events";
import { useLocale, useT } from "@/i18n/client";

/** The flight log: every stage change plus completed events, oldest first. */
export function HistoryPanel({ app, history, events }: { app: Application; history: HistoryEntry[]; events: AppEvent[] }) {
  const dict = useT();
  const t = dict.history;
  const locale = useLocale();
  const when = (iso: string) => formatDate(new Date(iso), locale, { day: true, month: "short", year: true }, TIME_ZONE);
  const stage = (s: HistoryEntry["to_status"]) => dict.status[s].label;
  const items = [
    ...history.map((h) => ({
      at: h.created_at,
      key: h.id,
      dot: STATUS_META[h.to_status].dot,
      text: h.from_status ? t.moved(stage(h.from_status), stage(h.to_status)) : t.added(stage(h.to_status)),
    })),
    ...events
      .filter((e) => e.done)
      .map((e) => ({ at: e.starts_at, key: e.id, dot: EVENT_META[e.kind].dot, text: t.done(dict.eventKind[e.kind], e.title) })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  if (items.length === 0) return <p className="text-sm text-muted">{t.empty(app.company)}</p>;

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
