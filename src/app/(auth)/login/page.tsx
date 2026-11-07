import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signIn } from "../actions";
import { DemoButton } from "@/components/DemoButton";
import { secondaryButton } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">WELCOME ABOARD</p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold tracking-tight">Welcome back</h1>
      <p className="mt-3 mb-8 text-muted">Sign in to see your job search board.</p>
      <AuthForm mode="login" action={signIn} />
      <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-line" /> OR <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap">
        <DemoButton className={`${secondaryButton} w-full`} label="Explore a demo board" />
      </div>
    </>
  );
}
