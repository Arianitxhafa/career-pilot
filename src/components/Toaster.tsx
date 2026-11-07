"use client";

import { useEffect, useState } from "react";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useT } from "@/i18n/client";

type Toast = { id: number; message: string; kind: "success" | "error" };
const EVENT = "careerpilot:toast";
let nextId = 1;

/** Show a toast from any client component. */
export function toast(message: string, kind: Toast["kind"] = "success") {
  window.dispatchEvent(new CustomEvent<Toast>(EVENT, { detail: { id: nextId++, message, kind } }));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useT().board.dismiss;

  useEffect(() => {
    const onToast = (e: Event) => {
      const t = (e as CustomEvent<Toast>).detail;
      setToasts((ts) => [...ts.slice(-2), t]);
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 3800);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-2">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="pointer-events-auto flex animate-toast items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 pr-2 text-sm shadow-card">
          {t.kind === "success" ? (
            <CircleCheck className="mt-px size-5 shrink-0 text-brand" aria-hidden />
          ) : (
            <CircleAlert className="mt-px size-5 shrink-0 text-rose-500" aria-hidden />
          )}
          <p className="flex-1 font-medium">{t.message}</p>
          <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))} aria-label={dismiss} className="rounded-lg p-1 text-muted hover:bg-surface-2 hover:text-fg">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
