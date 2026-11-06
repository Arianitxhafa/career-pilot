"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// `email` and `fullName` are echoed back so the form keeps them after React resets it.
export type AuthState = { error?: string; message?: string; email?: string; fullName?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." } as const;
  if (password.length < 8) return { error: "Password must be at least 8 characters." } as const;
  return { email, password } as const;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const creds = readCredentials(formData);
  const email = String(formData.get("email") ?? "");
  if ("error" in creds) return { error: creds.error, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(creds);
  if (error) {
    return {
      email,
      error:
        error.code === "email_not_confirmed"
          ? "Confirm your email first — check your inbox for the link."
          : "Wrong email or password.",
    };
  }
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const creds = readCredentials(formData);
  const fullName = String(formData.get("full_name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "");
  if ("error" in creds) return { error: creds.error, email, fullName };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...creds,
    options: { emailRedirectTo: `${origin}/auth/confirm`, data: { full_name: fullName } },
  });
  if (error) {
    const friendly =
      error.code === "user_already_exists"
        ? "An account with this email already exists — try signing in."
        : error.code === "over_email_send_rate_limit"
          ? "Too many sign-ups right now — please try again in a few minutes."
          : error.message;
    return { error: friendly, email, fullName };
  }

  // With email confirmation off, Supabase signs the user in straight away.
  if (data.session) redirect("/dashboard");
  return { message: "Almost there — check your inbox and confirm your email to sign in." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
