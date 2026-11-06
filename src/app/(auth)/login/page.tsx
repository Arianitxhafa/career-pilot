import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-1 mb-6 text-sm text-muted">Sign in to see your job search board.</p>
      <AuthForm mode="login" action={signIn} />
    </>
  );
}
