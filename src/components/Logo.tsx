import Link from "next/link";

export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-[10px] bg-brand text-brand-ink shadow-[0_6px_16px_-6px_var(--brand)] ${className}`}>
      <svg viewBox="0 0 24 24" className="size-[55%]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 text-fg">
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">
        Career<span className="text-brand">Pilot</span>
      </span>
    </Link>
  );
}
