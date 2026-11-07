import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signUp } from "../actions";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.signup.title };
}

export default async function SignupPage() {
  const t = (await getT()).auth.signup;
  return (
    <>
      <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold tracking-tight">{t.heading}</h1>
      <p className="mt-3 mb-8 text-muted">{t.text}</p>
      <AuthForm mode="signup" action={signUp} />
    </>
  );
}
