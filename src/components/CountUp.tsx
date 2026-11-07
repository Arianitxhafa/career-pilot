"use client";

import { useEffect, useRef } from "react";

/**
 * Renders the final number on the server, then counts up to it once in the browser.
 * Writes to the DOM directly so the animation doesn't re-render React every frame.
 */
export function CountUp({ value, suffix = "", duration = 1000 }: { value: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      el.textContent = `${Math.round(value * (1 - Math.pow(1 - p, 3)))}${suffix}`;
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.textContent = `${value}${suffix}`;
    };
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  );
}
