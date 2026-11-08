"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { CalendarPlus, Check, Download, MapPin, Trash2, Video } from "lucide-react";
import type { Application } from "@/lib/applications";
import { EVENT_KINDS, EVENT_META, whenLabel, type AppEvent, type EventKind } from "@/lib/events";
import { deleteEvent, saveEvent, setEventDone } from "@/app/dashboard/plan-actions";
import { toast } from "@/components/Toaster";
import { inputClass, primaryButton } from "@/components/ui";
import { useLocale, useT } from "@/i18n/client";

const pad = (n: number) => String(n).padStart(2, "0");
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isUrl = (s: string) => /^https?:\/\//i.test(s);
/** A date N days from today, for the date input. */
const inDays = (n: number) => localDate(new Date(Date.now() + n * 86_400_000));

export function PlanPanel({ app, events }: { app: Application; events: AppEvent[] }) {
  const dict = useT();
  const t = dict.plan;
  const locale = useLocale();
  const TITLES: Record<EventKind, (app: Application) => string> = {
    interview: (a) => t.titles.interview(a.company),
    follow_up: (a) => t.titles.follow_up(a.company),
    deadline: (a) => t.titles.deadline(a.company),
    other: (a) => a.company,
  };
  const [state, action, pending] = useActionState(saveEvent, undefined);
  const [, startSave] = useTransition();
  const [busy, startBusy] = useTransition();
  const [kind, setKind] = useState<EventKind>("interview");
  const [title, setTitle] = useState(TITLES.interview(app));
  const [date, setDate] = useState(() => inDays(2));
  const [time, setTime] = useState("10:00");
  const sorted = [...events].sort((a, b) => Number(a.done) - Number(b.done) || a.starts_at.localeCompare(b.starts_at));

  useEffect(() => {
    if (state?.ok) toast(t.added);
  }, [state, t]);

  const pickKind = (k: EventKind) => {
    setKind(k);
    setTitle(TITLES[k](app));
    if (k === "follow_up") {
      setDate(inDays(7));
      setTime("09:00");
    }
  };

  /** One click: a follow-up one week from today. */
  const quickFollowUp = () => {
    const data = new FormData();
    const at = new Date();
    at.setDate(at.getDate() + 7);
    at.setHours(9, 0, 0, 0);
    data.set("application_id", app.id);
    data.set("kind", "follow_up");
    data.set("title", TITLES.follow_up(app));
    data.set("starts_at", at.toISOString());
    data.set("duration_minutes", "15");
    startSave(() => action(data));
  };

  return (
    <div className="grid gap-5">
      {sorted.length > 0 ? (
        <ul className="grid gap-2">
          {sorted.map((e) => {
            const meta = EVENT_META[e.kind];
            const when = whenLabel(e, undefined, locale);
            return (
              <li key={e.id} className={`flex items-start gap-3 rounded-xl border border-line p-3 ${e.done ? "opacity-60" : ""}`}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startBusy(async () => {
                    await setEventDone(e.id, !e.done);
                    toast(e.done ? t.notDone : t.done);
                  })}
                  aria-label={e.done ? t.markNotDone(e.title) : t.markDone(e.title)}
                  aria-pressed={e.done}
                  className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition ${e.done ? "border-brand bg-brand text-brand-ink" : "border-line hover:border-brand"}`}
                >
                  {e.done && <Check className="size-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${e.done ? "line-through" : ""}`}>{e.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className={`rounded-md px-1.5 py-0.5 font-semibold ${meta.chip}`}>{dict.eventKind[e.kind]}</span>
                    <span className={when.urgent && !e.done ? "font-semibold text-rose-600 dark:text-rose-400" : ""}>{when.text}</span>
                    {e.location &&
                      (isUrl(e.location) ? (
                        <a href={e.location} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                          <Video className="size-3.5" /> {t.joinLink}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" /> {e.location}
                        </span>
                      ))}
                  </p>
                  {e.notes && <p className="mt-1 text-xs text-muted">{e.notes}</p>}
                </div>
                <a href={`/dashboard/events/${e.id}/ics`} className="rounded-lg p-1.5 text-muted transition hover:bg-surface-2 hover:text-fg" aria-label={t.addToCalendar(e.title)} title={t.addToCalendarTitle}>
                  <Download className="size-4" />
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => startBusy(async () => {
                    await deleteEvent(e.id);
                    toast(t.removed);
                  })}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-600"
                  aria-label={t.deleteItem(e.title)}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">{t.empty}</p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          // The browser knows the user's time zone: send the exact instant.
          data.set("starts_at", new Date(`${date}T${time || "09:00"}`).toISOString());
          startSave(() => action(data));
        }}
        className="grid gap-3 rounded-2xl border border-line bg-surface-2/50 p-4"
      >
        <input type="hidden" name="application_id" value={app.id} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <CalendarPlus className="size-4 text-brand" /> {t.addHeading}
          </p>
          <button type="button" onClick={quickFollowUp} className="text-xs font-semibold text-brand hover:underline">
            {t.quickFollowUp}
          </button>
        </div>
        <div role="radiogroup" aria-label={t.kind} className="flex flex-wrap gap-1.5">
          {EVENT_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => pickKind(k)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${kind === k ? EVENT_META[k].chip + " ring-1 ring-current" : "bg-surface text-muted hover:text-fg"}`}
            >
              {dict.eventKind[k]}
            </button>
          ))}
          <input type="hidden" name="kind" value={kind} />
        </div>
        <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required aria-label={t.title} className={inputClass} />
        <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-2 sm:grid-cols-[1fr_120px_130px]">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required aria-label={t.date} className={inputClass} />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label={t.time} className={inputClass} />
          <select name="duration_minutes" defaultValue="60" aria-label={t.duration} className={`${inputClass} min-[460px]:col-span-2 sm:col-span-1`}>
            {Object.entries(t.durations).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <input name="location" maxLength={300} placeholder={t.locationPh} aria-label={t.locationLabel} className={inputClass} />
        <textarea name="notes" maxLength={2000} rows={2} placeholder={t.notesPh} aria-label={t.notes} className={`${inputClass} resize-y`} />
        {state?.error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
            {state.error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? t.saving : t.submit}
          </button>
        </div>
      </form>
      <p className="text-xs text-muted">
        {t.tipA} <span className="inline-flex items-center gap-1"><Download className="size-3" /></span> {t.tipB}
      </p>
    </div>
  );
}
