"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Link2, Mail, Phone, Trash2, UserPlus } from "lucide-react";
import type { Application, Contact } from "@/lib/applications";
import { deleteContact, saveContact } from "@/app/dashboard/plan-actions";
import { toast } from "@/components/Toaster";
import { inputClass, primaryButton } from "@/components/ui";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** Recruiters, interviewers and referrals for one application. */
export function PeoplePanel({ app, contacts }: { app: Application; contacts: Contact[] }) {
  const [state, action, pending] = useActionState(saveContact, undefined);
  const [, startSave] = useTransition();
  const [busy, startBusy] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state?.ok) return;
    toast("Contact saved");
    formRef.current?.reset();
  }, [state]);

  return (
    <div className="grid gap-5">
      {contacts.length > 0 ? (
        <ul className="grid gap-2">
          {contacts.map((c) => (
            <li key={c.id} className="flex items-start gap-3 rounded-xl border border-line p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand" aria-hidden>
                {initials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{c.name}</p>
                {c.role && <p className="text-xs text-muted">{c.role}</p>}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                      <Mail className="size-3.5" /> {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone.replace(/\s+/g, "")}`} className="inline-flex items-center gap-1 text-brand hover:underline">
                      <Phone className="size-3.5" /> {c.phone}
                    </a>
                  )}
                  {c.linkedin && (
                    <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand hover:underline">
                      <Link2 className="size-3.5" /> LinkedIn
                    </a>
                  )}
                </div>
                {c.notes && <p className="mt-1 text-xs text-muted">{c.notes}</p>}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => startBusy(async () => {
                  await deleteContact(c.id);
                  toast(`${c.name} removed`);
                })}
                className="rounded-lg p-1.5 text-muted transition hover:bg-rose-500/10 hover:text-rose-600"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-muted">Keep the recruiter, your interviewers and any referral here, so a follow-up is one click away.</p>
      )}

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startSave(() => action(data));
        }}
        className="grid gap-3 rounded-2xl border border-line bg-surface-2/50 p-4"
      >
        <input type="hidden" name="application_id" value={app.id} />
        <p className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="size-4 text-brand" /> Add a person
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="name" required maxLength={120} placeholder="Name *" aria-label="Name" className={inputClass} />
          <input name="role" maxLength={120} placeholder="Role, e.g. Recruiter" aria-label="Role" className={inputClass} />
          <input name="email" type="email" maxLength={200} placeholder="Email" aria-label="Email" className={inputClass} />
          <input name="phone" maxLength={40} placeholder="Phone" aria-label="Phone" className={inputClass} />
        </div>
        <input name="linkedin" maxLength={300} placeholder="LinkedIn profile link" aria-label="LinkedIn" className={inputClass} />
        {state?.error && (
          <p role="alert" className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
            {state.error}
          </p>
        )}
        <div className="flex justify-end">
          <button type="submit" disabled={pending} className={primaryButton}>
            {pending ? "Saving…" : "Save contact"}
          </button>
        </div>
      </form>
    </div>
  );
}
