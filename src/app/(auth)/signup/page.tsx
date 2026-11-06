import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Start your search</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Free forever. Your data stays private to you.</p>
      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
