// Shared class strings, so controls look and move the same everywhere.
const base =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60";

export const primaryButton = `${base} bg-brand text-brand-ink shadow-[0_10px_24px_-12px_var(--brand)] hover:brightness-110 hover:shadow-[0_14px_28px_-12px_var(--brand)]`;
export const secondaryButton = `${base} border border-line bg-surface text-fg hover:border-brand/40 hover:bg-surface-2`;
export const ghostButton = `${base} text-muted hover:bg-surface-2 hover:text-fg`;
export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/70 hover:border-muted/40 focus:border-brand focus:ring-4 focus:ring-brand/15";
export const card = "rounded-2xl border border-line bg-surface shadow-card";
export const eyebrow = "font-mono text-xs font-bold tracking-[0.22em] text-brand uppercase";
