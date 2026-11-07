"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * A split-flap display, like an airport departures board: when `text` changes,
 * each character flips through a few random letters before settling, left to right.
 */
export function SplitFlap({ text, length, className = "" }: { text: string; length?: number; className?: string }) {
  const target = (length ? text.padEnd(length).slice(0, length) : text).toUpperCase();
  const [shown, setShown] = useState(target);
  const [flipping, setFlipping] = useState<boolean[]>(() => [...target].map(() => false));
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Later letters flip a little longer; with reduced motion everything settles on the first tick.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const settleAt = [...target].map((_, i) => (reduced ? 0 : 4 + i * 2));
    const id = setInterval(() => {
      frame++;
      setShown(() => [...target].map((c, i) => (frame >= settleAt[i] || c === " " ? c : CHARS[Math.floor(Math.random() * CHARS.length)])).join(""));
      setFlipping([...target].map((c, i) => c !== " " && frame < settleAt[i]));
      if (frame >= Math.max(...settleAt)) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [target]);

  return (
    <span className={`inline-flex gap-[2px] font-mono ${className}`} aria-label={text}>
      {[...shown].map((c, i) => (
        <span
          key={i}
          aria-hidden
          className={`relative inline-grid w-[1.05em] place-items-center rounded-[3px] bg-white/[0.06] leading-[1.5] ${flipping[i] ? "animate-flap" : ""}`}
        >
          {c === " " ? " " : c}
          <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/50" />
        </span>
      ))}
    </span>
  );
}
