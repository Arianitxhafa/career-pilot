"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

/** Phone menu for the landing header: opens a panel under the (positioned) header with the links passed in. */
export function LandingMenu({
  openLabel,
  closeLabel,
  className = "",
  children,
}: {
  openLabel: string;
  closeLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [open]);

  return (
    <div ref={root} className={className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="landing-menu"
        aria-label={open ? closeLabel : openLabel}
        className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-fg transition hover:border-brand/40"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>
      {open && (
        <div
          id="landing-menu"
          // Following a link (including #section links) closes the menu.
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          className="absolute inset-x-0 top-full border-b border-line bg-bg px-4 pt-2 pb-5 shadow-xl animate-[rise_0.25s_ease_both]"
        >
          {children}
        </div>
      )}
    </div>
  );
}
