"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "./actions";
import { PasswordInput } from "@/components/PasswordInput";
import { useT } from "@/i18n/client";

type Props = {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15";

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isSignup = mode === "signup";
  const t = useT().auth;

  return (
    <form action={formAction} className="grid gap-4">
      {isSignup && (
        <label className="grid gap-1.5 text-sm font-medium">
          {t.fullName}
          <input name="full_name" autoComplete="name" placeholder="Arianit Xhafa" defaultValue={state?.fullName} className={inputClass} />
        </label>
      )}
      <label className="grid gap-1.5 text-sm font-medium">
        {t.email}
        <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" defaultValue={state?.email} className={inputClass} />
      </label>
      <PasswordInput
        label={t.password}
        autoComplete={isSignup ? "new-password" : "current-password"}
        minLength={8}
        placeholder={isSignup ? t.passwordHint : "••••••••"}
      />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 dark:text-rose-400">
          {state.error}
        </p>
      )}
      {state?.message && (
        <p role="status" className="rounded-xl bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink shadow-[0_10px_24px_-12px_var(--brand)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {pending ? t.wait : isSignup ? t.createAccount : t.signIn}
      </button>

      <p className="text-center text-sm text-muted">
        {isSignup ? t.haveAccount : t.newHere}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-brand hover:underline">
          {isSignup ? t.signIn : t.createAnAccount}
        </Link>
      </p>
    </form>
  );
}
