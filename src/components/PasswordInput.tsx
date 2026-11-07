"use client";

import { useEffect, useId, useRef, useState } from "react";

type Props = {
  label: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
  minLength?: number;
  hint?: string;
};

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15";

const Eye = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.97 0 8.8 3.4 9.94 6.65a1 1 0 0 1 0 .7 10.8 10.8 0 0 1-1.94 3.19" />
    <path d="M14.08 14.16a3 3 0 0 1-4.24-4.24" />
    <path d="M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.8 10.8 0 0 1 4.45-5.14" />
    <path d="m2 2 20 20" />
  </svg>
);

/** Password field with a show/hide toggle and a Caps Lock warning. */
export function PasswordInput({ label, name = "password", autoComplete, placeholder, minLength, hint }: Props) {
  const id = useId();
  const ref = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Hide the password again when the form is submitted, so password managers see a normal password field.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const hide = () => setVisible(false);
    form.addEventListener("submit", hide);
    return () => form.removeEventListener("submit", hide);
  }, []);

  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div className="grid gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={placeholder}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCapsLock(false)}
          aria-describedby={hint || capsLock ? `${id}-hint` : undefined}
          className={`${inputClass} pr-11`}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v);
            ref.current?.focus();
          }}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          title={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-muted transition hover:text-fg focus-visible:text-brand focus-visible:outline-none"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      </div>
      {(hint || capsLock) && (
        <p id={`${id}-hint`} className={`text-xs font-normal ${capsLock ? "text-amber-700 dark:text-amber-400" : "text-muted"}`}>
          {capsLock ? "Caps Lock is on." : hint}
        </p>
      )}
    </div>
  );
}
