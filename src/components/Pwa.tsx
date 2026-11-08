"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share, X } from "lucide-react";
import { useT } from "@/i18n/client";

/** Registers the service worker in production (dev keeps a plain network so changes always show). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const noop = () => () => {};
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
// iPhone/iPad Safari has no install prompt, only Share → Add to Home Screen (iPadOS reports itself as a Mac with touch).
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** "Install app": the browser's own prompt where there is one (Chrome, Edge, Android), instructions on iPhone/iPad. */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const t = useT().install;
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);
  const standalone = useSyncExternalStore(noop, isStandalone, () => true);
  const ios = useSyncExternalStore(noop, isIos, () => false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || installed || (!prompt && !ios)) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={async () => {
          if (!prompt) return setHelp((h) => !h);
          await prompt.prompt();
          const { outcome } = await prompt.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setPrompt(null);
        }}
        aria-expanded={prompt ? undefined : help}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-brand/40 px-3 py-2.5 text-sm font-medium text-brand transition hover:bg-brand-soft"
      >
        <Download className="size-[18px]" aria-hidden />
        {t.button}
      </button>
      {help && (
        <div role="dialog" aria-label={t.title} className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-2xl border border-line bg-surface p-3.5 text-sm shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{t.title}</p>
            <button type="button" onClick={() => setHelp(false)} aria-label={t.close} className="-m-1 rounded-md p-1 text-muted hover:text-fg">
              <X className="size-4" />
            </button>
          </div>
          <p className="mt-1.5 flex gap-2 text-muted">
            <Share className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
            {ios ? t.ios : t.other}
          </p>
        </div>
      )}
    </div>
  );
}
