"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, PlaneTakeoff } from "lucide-react";
import { startDemo } from "@/app/demo-actions";
import { useT } from "@/i18n/client";

function Submit({ className, label }: { className: string; label: string }) {
  const { pending } = useFormStatus();
  const t = useT().auth.demo;
  return (
    <button type="submit" disabled={pending} className={`${className} group disabled:cursor-wait disabled:opacity-80`}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <PlaneTakeoff className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />}
      {pending ? t.preparing : label}
    </button>
  );
}

/** Signs the visitor into a fresh demo board (anonymous session) with realistic sample data. */
export function DemoButton({ className, label }: { className: string; label?: string }) {
  const [state, action] = useActionState(startDemo, undefined);
  const t = useT().auth.demo;
  return (
    <form action={action} className="contents">
      <Submit className={className} label={label ?? t.button} />
      {state?.error && (
        <p role="alert" className="basis-full text-sm text-rose-500">
          {state.error}
        </p>
      )}
    </form>
  );
}
