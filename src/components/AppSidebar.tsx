"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, CalendarDays, FileUser, KanbanSquare, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { Logo } from "./Logo";
import { signOut } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string; icon: LucideIcon; ready: boolean; code: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Board", icon: KanbanSquare, ready: true, code: "BRD" },
  { href: "/dashboard/cv", label: "CV & co-pilot", icon: FileUser, ready: true, code: "CVC" },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, ready: true, code: "CAL" },
  { href: "/dashboard/insights", label: "Insights", icon: BarChart3, ready: false, code: "INS" },
];

const isActive = (pathname: string, href: string) => (href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href));

export function AppSidebar({ name, email, isDemo, stats }: { name: string; email: string; isDemo: boolean; stats: { active: number; interviews: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CP";

  const body = (
    // Close the mobile drawer when a link inside it is followed.
    <div className="flex h-full flex-col gap-5 p-4" onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>
      <div className="flex items-center justify-between">
        <Logo href="/dashboard" />
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-muted hover:bg-surface md:hidden" aria-label="Close menu">
          <X className="size-5" />
        </button>
      </div>

      {/* Flight status card */}
      <div className="overflow-hidden rounded-2xl bg-board p-4 text-[#e8ecf6] shadow-card">
        <p className="flex items-center justify-between font-mono text-[10px] tracking-[0.22em] text-white/50">
          <span>FLIGHT STATUS</span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" /> LIVE
          </span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 font-mono">
          <div>
            <p className="text-2xl font-bold tabular-nums">{stats.active}</p>
            <p className="text-[10px] tracking-wider text-white/50">IN THE AIR</p>
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums text-board-ink">{stats.interviews}</p>
            <p className="text-[10px] tracking-wider text-white/50">INTERVIEWS</p>
          </div>
        </div>
      </div>

      <nav aria-label="Main" className="grid gap-0.5">
        {NAV.map(({ href, label, icon: Icon, ready, code }) => {
          const active = isActive(pathname, href);
          return ready ? (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-surface text-fg shadow-card" : "text-muted hover:bg-surface/70 hover:text-fg"
              }`}
            >
              {active && <span className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-brand" aria-hidden />}
              <Icon className={`size-[18px] transition ${active ? "text-brand" : "group-hover:scale-110"}`} aria-hidden />
              {label}
              <span className="ml-auto font-mono text-[10px] tracking-widest text-muted/70">{code}</span>
            </Link>
          ) : (
            <span key={href} className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted/60" title="Coming soon">
              <Icon className="size-[18px]" aria-hidden />
              {label}
              <span className="ml-auto rounded-md border border-line px-1.5 py-px font-mono text-[9px] tracking-wider uppercase">soon</span>
            </span>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-surface p-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">{isDemo ? "Demo session" : email}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-lg p-2 text-muted transition hover:bg-surface-2 hover:text-rose-500" aria-label="Sign out" title="Sign out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:hidden">
        <Logo href="/dashboard" />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-surface" aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 animate-fade bg-black/50" onClick={() => setOpen(false)} aria-label="Close menu" />
          <aside className="absolute inset-y-0 left-0 w-72 animate-[rise_0.3s_ease_both] bg-surface-2 shadow-2xl">{body}</aside>
        </div>
      )}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-surface-2/70 md:block">{body}</aside>
    </>
  );
}
