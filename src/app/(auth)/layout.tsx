import { Logo } from "@/components/Logo";
import { DeparturesBoard } from "@/components/flight/DeparturesBoard";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid flex-1 lg:grid-cols-[1fr_1.1fr]">
      <div className="nav-grid flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 animate-rise">{children}</div>
        <p className="text-xs text-muted">© 2026 CareerPilot · Built for students entering the job market</p>
      </div>
      <aside className="relative hidden overflow-hidden bg-board lg:flex lg:flex-col lg:justify-center lg:px-14" aria-hidden>
        <div className="absolute -top-32 -right-24 size-[28rem] rounded-full bg-[#6c8dff]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-[#ffc85c]/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-xl">
          <p className="mb-8 font-display text-4xl leading-tight font-bold text-[#eef2fb]">
            Every application, tracked from <span className="text-[#6c8dff]">check-in</span> to <span className="text-board-ink">landing.</span>
          </p>
          <DeparturesBoard compact />
        </div>
      </aside>
    </div>
  );
}
