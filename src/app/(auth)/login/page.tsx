import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { signIn } from "../actions";
import { DemoButton } from "@/components/DemoButton";
import { secondaryButton } from "@/components/ui";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT()).auth.login.title };
}

export default async function LoginPage() {
  const t = (await getT()).auth.login;
  return (
    <>
      <p className="font-mono text-xs font-bold tracking-[0.22em] text-brand">{t.eyebrow}</p>
      <h1 className="mt-2 font-display text-5xl leading-none font-bold tracking-tight">{t.heading}</h1>
      <p className="mt-3 mb-8 text-muted">{t.text}</p>
      <AuthForm mode="login" action={signIn} />
      <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] text-muted">
        <span className="h-px flex-1 bg-line" /> {t.or} <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-wrap">
        <DemoButton className={`${secondaryButton} w-full`} label={t.demo} />
      </div>
    </>
  );
}
