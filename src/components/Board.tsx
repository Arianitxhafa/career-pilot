"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import { STATUSES, STATUS_META, type Application, type Status } from "@/lib/applications";
import { loadSampleData, moveApplication } from "@/app/dashboard/actions";
import { ApplicationDialog } from "./ApplicationDialog";
import type { Analysis } from "@/app/dashboard/copilot-actions";

type Editing = { app?: Application; status: Status } | null;

type BoardProps = { applications: Application[]; analyses: Record<string, Analysis>; hasCv: boolean; aiEnabled: boolean };

export function Board({ applications, analyses, hasCv, aiEnabled }: BoardProps) {
  const [, startTransition] = useTransition();
  const [apps, moveOptimistic] = useOptimistic(applications, (state, move: { id: string; status: Status }) =>
    state.map((a) => (a.id === move.id ? { ...a, status: move.status } : a))
  );
  const [query, setQuery] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<Status | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [seeding, startSeeding] = useTransition();

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
    });
  }

  // One dialog for both views, so it stays the same element when the first application appears.
  const dialog = (
    <ApplicationDialog
      editing={editing}
      onClose={() => setEditing(null)}
      analysis={editing?.app ? analyses[editing.app.id] : undefined}
      hasCv={hasCv}
      aiEnabled={aiEnabled}
    />
  );

  if (applications.length === 0) {
    return (
      <>
        <section className="animate-rise grid place-items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-2xl">🧭</span>
          <h2 className="mt-4 text-xl font-bold tracking-tight">Your board is ready for take-off</h2>
          <p className="mt-2 max-w-md text-sm text-muted">
            Add every job you&apos;re interested in, then drag it across the board as you apply, interview and get offers.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setEditing({ status: "saved" })}
              className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition hover:brightness-110"
            >
              + Add your first application
            </button>
            <button
              onClick={() => startSeeding(() => loadSampleData())}
              disabled={seeding}
              className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition hover:bg-surface-2 disabled:opacity-60"
            >
              {seeding ? "Loading…" : "Try with sample data"}
            </button>
          </div>
        </section>
        {dialog}
      </>
    );
  }

  return (
    <>
    <section aria-label="Application board" className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company, role or city"
            aria-label="Search applications"
            className="w-full rounded-xl border border-line bg-surface py-2 pr-3 pl-9 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15"
          />
        </div>
        <button
          onClick={() => setEditing({ status: "saved" })}
          className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition hover:brightness-110"
        >
          + New application
        </button>
      </div>

      <div className="-mx-4 flex flex-1 snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:grid lg:grid-cols-5 lg:overflow-visible">
        {STATUSES.map((status) => {
          const items = visible.filter((a) => a.status === status);
          const meta = STATUS_META[status];
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
              className={`flex w-72 shrink-0 snap-start flex-col rounded-2xl border bg-surface-2/60 p-3 transition lg:w-auto ${
                isOver ? `border-brand ring-4 ${meta.ring}` : "border-line"
              }`}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="text-sm font-semibold">{meta.label}</h2>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium tabular-nums text-muted">{items.length}</span>
                </div>
                <button
                  onClick={() => setEditing({ status })}
                  aria-label={`Add to ${meta.label}`}
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
                      className={`group cursor-grab rounded-xl border border-line bg-surface p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md active:cursor-grabbing ${
                        dragId === app.id ? "opacity-40" : ""
                      }`}
                    >
                      <button
                        onClick={() => setEditing({ app, status: app.status })}
                        aria-label={`Edit ${app.position} at ${app.company}`}
                        className="block w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium text-muted">{app.company}</p>
                          {analyses[app.id] && (
                            <span
                              title="Co-pilot match score"
                              className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-brand"
                            >
                              ✨ {analyses[app.id].score}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-0.5 font-semibold leading-snug">{app.position}</h3>
                        <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs text-muted">
                          {app.location && <span className="rounded-md bg-surface-2 px-1.5 py-0.5">📍 {app.location}</span>}
                          {app.salary_range && <span className="rounded-md bg-surface-2 px-1.5 py-0.5">💶 {app.salary_range}</span>}
                          {app.applied_at && (
                            <span className="rounded-md bg-surface-2 px-1.5 py-0.5">
                              🗓 {new Date(app.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </button>
                      <label className="mt-3 flex items-center gap-2 border-t border-line pt-2.5 text-xs text-muted lg:hidden">
                        Move to
                        <select
                          value={app.status}
                          onChange={(e) => move(app.id, e.target.value as Status)}
                          className="flex-1 rounded-md border border-line bg-surface px-1.5 py-1 text-fg"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="grid flex-1 place-items-center rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
                    {query ? "No matches" : meta.hint}
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
