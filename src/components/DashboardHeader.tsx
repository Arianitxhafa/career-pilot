import Link from "next/link";
import { Logo } from "@/components/Logo";
import { signOut } from "@/app/(auth)/actions";

export function DashboardHeader({ email, active }: { email?: string; active: "board" | "cv" }) {
  const tab = (isActive: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"}`;
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Logo href="/dashboard" />
          <nav className="flex gap-1">
            <Link href="/dashboard" className={tab(active === "board")}>
              Board
            </Link>
            <Link href="/dashboard/cv" className={tab(active === "cv")}>
              My CV
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted md:inline">{email}</span>
          <form action={signOut}>
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
