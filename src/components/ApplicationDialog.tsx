"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { STATUSES, STATUS_META, type Application, type Status } from "@/lib/applications";
import { deleteApplication, saveApplication } from "@/app/dashboard/actions";
import { toast } from "./Toaster";
import type { Analysis } from "@/app/dashboard/copilot-actions";
import { CopilotPanel } from "./CopilotPanel";

type Props = {
  editing: { app?: Application; status: Status } | null;
  onClose: () => void;
  analysis?: Analysis;
  hasCv: boolean;
  aiEnabled: boolean;
};

const field =
  "w-full rounded-xl border border-line bg-surface px-3 py-2 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15";

export function ApplicationDialog({ editing, onClose, analysis, hasCv, aiEnabled }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (editing && !dialog.open) dialog.showModal();
    if (!editing && dialog.open) dialog.close();
  }, [editing]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-3xl border border-line bg-surface p-0 text-fg shadow-2xl"
    >
      {/* Remount the form for each open so it starts from fresh values. */}
      {editing && (
        <DialogBody
          key={editing.app?.id ?? `new-${editing.status}`}
          editing={editing}
          analysis={analysis}
          hasCv={hasCv}
          aiEnabled={aiEnabled}
          close={() => ref.current?.close()}
        />
      )}
    </dialog>
  );
}

type BodyProps = { editing: NonNullable<Props["editing"]>; analysis?: Analysis; hasCv: boolean; aiEnabled: boolean; close: () => void };

function DialogBody({ editing, analysis, hasCv, aiEnabled, close }: BodyProps) {
  const app = editing.app;
  const [tab, setTab] = useState<"details" | "copilot">("details");
  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg"}`;

  return (
    <div className="grid gap-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{app ? "Edit application" : "New application"}</h2>
          <p className="text-sm text-muted">{app ? `${app.company} · ${app.position}` : "Track a job you want or already applied to."}</p>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2">
          ✕
        </button>
      </div>

      {app && (
        <div role="tablist" className="flex gap-1 rounded-xl bg-surface-2 p-1">
          <button type="button" role="tab" aria-selected={tab === "details"} onClick={() => setTab("details")} className={tabClass(tab === "details")}>
            Details
          </button>
          <button type="button" role="tab" aria-selected={tab === "copilot"} onClick={() => setTab("copilot")} className={tabClass(tab === "copilot")}>
            ✨ Co-pilot{analysis ? ` · ${analysis.score}` : ""}
          </button>
        </div>
      )}

      {app && tab === "copilot" ? <CopilotPanel app={app} initial={analysis} hasCv={hasCv} aiEnabled={aiEnabled} /> : <DialogForm editing={editing} close={close} />}
    </div>
  );
}

function DialogForm({ editing, close }: { editing: NonNullable<Props["editing"]>; close: () => void }) {
  const app = editing.app;
  const [state, action, pending] = useActionState(saveApplication, undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [, startSave] = useTransition();

  useEffect(() => {
    if (!state?.ok) return;
    toast(app ? "Boarding pass updated" : "New application on the board ✈");
    close();
  }, [state, close, app]);

  return (
    <form
      // Submit manually so React doesn't reset the fields when validation fails.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startSave(() => action(data));
      }}
      className="grid gap-4"
    >

      {app && <input type="hidden" name="id" value={app.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Company *
          <input name="company" required maxLength={120} defaultValue={app?.company} placeholder="e.g. Northwind Labs" className={field} autoFocus />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Position *
          <input name="position" required maxLength={120} defaultValue={app?.position} placeholder="e.g. Junior Developer" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Stage
          <select name="status" defaultValue={editing.status} className={field}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Location
          <input name="location" maxLength={120} defaultValue={app?.location ?? ""} placeholder="Prishtina, Remote…" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Salary range
          <input name="salary_range" maxLength={60} defaultValue={app?.salary_range ?? ""} placeholder="€900–1,200" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Job link
          <input name="job_url" maxLength={500} defaultValue={app?.job_url ?? ""} placeholder="linkedin.com/jobs/…" className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Notes
        <textarea name="notes" rows={4} maxLength={4000} defaultValue={app?.notes ?? ""} placeholder="Contacts, interview prep, follow-up dates…" className={`${field} resize-y`} />
      </label>

      {app?.job_url && (
        <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:underline">
          Open job posting ↗
        </a>
      )}

      {state?.error && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {app ? (
          <button
            type="button"
            disabled={deleting}
            onClick={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              startDelete(async () => {
                await deleteApplication(app.id);
                toast(`${app.company} removed from your board`);
                close();
              });
            }}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
              confirmDelete ? "bg-rose-600 text-white" : "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
            }`}
          >
            {deleting ? "Deleting…" : confirmDelete ? "Click again to delete" : "Delete"}
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button type="button" onClick={close} className="rounded-xl border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-ink shadow-lg shadow-brand/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Saving…" : app ? "Save changes" : "Add to board"}
          </button>
        </div>
      </div>
    </form>
  );
}
