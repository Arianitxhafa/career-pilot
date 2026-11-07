import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">CHECK-IN</p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold tracking-tight">Start your search</h1>
      <p className="mt-3 mb-8 text-muted">Free forever. Your data stays private to you.</p>
      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
