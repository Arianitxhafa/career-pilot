"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { STATUSES, STATUS_META, type Application, type Status } from "@/lib/applications";
import { loadSampleData, moveApplication } from "@/app/dashboard/actions";
import { ApplicationDialog } from "./ApplicationDialog";
import { toast } from "./Toaster";
import { primaryButton, secondaryButton } from "./ui";
import { Plus, Search } from "lucide-react";
import type { Analysis } from "@/app/dashboard/copilot-actions";
import type { Contact, HistoryEntry } from "@/lib/applications";
import { formatDate, nextEventByApplication, whenLabel, EVENT_META, type AppEvent } from "@/lib/events";
import type { DialogTab } from "./ApplicationDialog";
import { useLocale, useT } from "@/i18n/client";

type Editing = { app?: Application; status: Status; tab?: DialogTab } | null;

/** A stable "flight number" for a card: company initials + a number from its id. */
function flightCode(app: Application) {
  const letters = app.company.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase() || "CP";
  const n = ([...app.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 900, 7)) + 100;
  return `${letters} ${n}`;
}

type BoardProps = {
  applications: Application[];
  analyses: Record<string, Analysis>;
  hasCv: boolean;
  cv: string;
  name: string | null;
  aiEnabled: boolean;
  events: AppEvent[];
  contacts: Contact[];
  history: HistoryEntry[];
  /** Open this application's dialog on load (e.g. from the calendar). */
  openId?: string;
  openTab?: DialogTab;
};

export function Board({ applications, analyses, hasCv, cv, name, aiEnabled, events, contacts, history, openId, openTab }: BoardProps) {
  const [, startTransition] = useTransition();
  const [apps, moveOptimistic] = useOptimistic(applications, (state, move: { id: string; status: Status }) =>
    state.map((a) => (a.id === move.id ? { ...a, status: move.status } : a))
  );
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const [editing, setEditing] = useState<Editing>(() => {
    const app = openId ? applications.find((a) => a.id === openId) : undefined;
    return app ? { app, status: app.status, tab: openTab } : null;
  });
  const nextEvent = useMemo(() => nextEventByApplication(events), [events]);
  const editingId = editing?.app?.id;
  const [seeding, startSeeding] = useTransition();
  const dict = useT();
  const t = dict.board;
  const locale = useLocale();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => `${a.company} ${a.position} ${a.location ?? ""}`.toLowerCase().includes(q));
  }, [apps, query]);

  function move(id: string, status: Status) {
    const current = apps.find((a) => a.id === id);
    if (!current || current.status === status) return;
    startTransition(async () => {
      moveOptimistic({ id, status });
      await moveApplication(id, status);
      toast(status === "offer" ? t.offerLanded(current.company) : t.moved(current.company, dict.status[status].label));
    });
  }

  // One dialog for both views, so it stays the same element when the first application appears.
  const dialog = (
    <ApplicationDialog
      editing={editing}
      onClose={() => setEditing(null)}
      analysis={editing?.app ? analyses[editing.app.id] : undefined}
      hasCv={hasCv}
      cv={cv}
      name={name}
      aiEnabled={aiEnabled}
      events={editingId ? events.filter((e) => e.application_id === editingId) : []}
      contacts={editingId ? contacts.filter((c) => c.application_id === editingId) : []}
      history={editingId ? history.filter((h) => h.application_id === editingId) : []}
    />
  );

  if (applications.length === 0) {
    return (
      <>
        <section className="animate-rise grid place-items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center shadow-card">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-2xl">🧭</span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{t.emptyTitle}</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            {t.emptyText}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => setEditing({ status: "saved" })} className={primaryButton}>
              <Plus className="size-4" /> {t.addFirst}
            </button>
            <button onClick={() => startSeeding(() => loadSampleData())} disabled={seeding} className={secondaryButton}>
              {seeding ? t.loading : t.sample}
            </button>
          </div>
        </section>
        {dialog}
      </>
    );
  }

  return (
    <>
    <section aria-label={t.label} className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="w-full rounded-xl border border-line bg-surface py-2.5 pr-3 pl-9 text-sm shadow-card outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <button onClick={() => setEditing({ status: "saved" })} className={`${primaryButton} group`}>
          <Plus className="size-4 transition group-hover:rotate-90" /> {t.newApplication}
        </button>
      </div>

      <div className="-mx-4 flex flex-1 snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {STATUSES.map((status) => {
          const items = visible.filter((a) => a.status === status);
          const meta = STATUS_META[status];
          const label = dict.status[status];
          const isOver = overCol === status && dragId !== null;
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(status);
              }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                setOverCol(null);
                setDragId(null);
                if (id) move(id, status);
              }}
              className={`flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-surface-2/70 p-3 backdrop-blur-sm transition lg:w-auto ${
                isOver ? `scale-[1.01] border-brand ring-4 ${meta.ring}` : "border-line"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="font-mono text-xs font-bold tracking-[0.18em] uppercase">{label.label}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 font-mono text-xs font-medium tabular-nums text-muted">{items.length}</span>
                </div>
                <button
                  onClick={() => setEditing({ status })}
                  aria-label={t.addTo(label.label)}
                  className="grid size-7 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-fg"
                >
                  +
                </button>
              </div>

              <ul className="flex min-h-24 flex-1 flex-col gap-2.5">
                {items.map((app) => (
                  <li key={app.id}>
                    <article
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", app.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(app.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverCol(null);
                      }}
                      style={{ "--at": "calc(100% - 46px)" } as React.CSSProperties}
                      className={`pass group relative cursor-grab overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-brand/40 active:cursor-grabbing ${
                        dragId === app.id ? "rotate-2 opacity-40" : ""
                      }`}
                    >
                      <span className={`absolute inset-y-0 left-0 w-1 ${meta.dot}`} aria-hidden />
                      <button onClick={() => setEditing({ app, status: app.status })} aria-label={t.edit(app.position, app.company)} className="block w-full text-left">
                        <div className="px-4 pt-3.5 pb-3">
                          <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-[0.18em] text-muted">
                            <span>{flightCode(app)}</span>
                            {analyses[app.id] && (
                              <span
                                title={t.matchScore}
                                className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums tracking-normal ${
                                  analyses[app.id].score >= 75
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                    : analyses[app.id].score >= 50
                                      ? "bg-brand-soft text-brand"
                                      : "bg-amber-soft text-amber"
                                }`}
                              >
                                ✦ {analyses[app.id].score}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 truncate text-xs font-medium text-muted">{app.company}</p>
                          <h3 className="font-display text-[17px] leading-snug font-bold">{app.position}</h3>
                          {nextEvent[app.id] && (() => {
                            const e = nextEvent[app.id];
                            const w = whenLabel(e, undefined, locale);
                            return (
                              <p
                                className={`mt-2 inline-flex max-w-full items-center gap-1.5 truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                                  w.urgent ? "bg-rose-500/12 text-rose-600 dark:text-rose-300" : EVENT_META[e.kind].chip
                                }`}
                              >
                                <span className={`size-1.5 shrink-0 rounded-full ${w.urgent ? "bg-rose-500" : EVENT_META[e.kind].dot}`} />
                                {dict.eventKind[e.kind]} · {w.text}
                              </p>
                            );
                          })()}
                        </div>
                        <div className="flex h-[46px] items-center gap-3 border-t border-dashed border-line px-4 font-mono text-[10px] text-muted">
                          <span className="min-w-0 truncate">
                            <span className="block tracking-widest">{t.gate}</span>
                            <b className="text-fg">{app.location || "—"}</b>
                          </span>
                          {app.salary_range && (
                            <span className="min-w-0 truncate">
                              <span className="block tracking-widest">{t.pay}</span>
                              <b className="text-fg">{app.salary_range}</b>
                            </span>
                          )}
                          <span className="ml-auto shrink-0 text-right">
                            <span className="block tracking-widest">{app.applied_at ? t.sent : t.saved}</span>
                            <b className="text-fg">{formatDate(new Date(app.applied_at ?? app.created_at), locale).toUpperCase()}</b>
                          </span>
                        </div>
                      </button>
                      <label className="flex items-center gap-2 border-t border-line px-4 py-2 text-xs text-muted lg:hidden">
                        {t.moveTo}
                        <select value={app.status} onChange={(e) => move(app.id, e.target.value as Status)} className="flex-1 rounded-md border border-line bg-surface px-1.5 py-1 text-fg">
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {dict.status[s].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                    {query ? t.noMatches : label.hint}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
    {dialog}
    </>
  );
}
