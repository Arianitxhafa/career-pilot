"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeMatch, CopilotError, type MatchResult } from "@/lib/copilot";
import { matchCvToJob } from "@/lib/matcher";
import { getLocale, getT } from "@/i18n/server";

// "ai" = Claude analysis with a cover letter; "basic" = free keyword match. Older rows have no mode (they were AI).
export type AnalysisResult = MatchResult & { mode?: "ai" | "basic" };
export type Analysis = { score: number; result: AnalysisResult; created_at: string };
export type AnalyzeState = { analysis?: Analysis; remaining?: number; error?: string } | undefined;
export type CvState = { ok?: boolean; error?: string } | undefined;

const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 5);
const MIN_JOB_POST = 200;
const MIN_CV = 300;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function saveCv(_prev: CvState, formData: FormData): Promise<CvState> {
  const { supabase, user } = await requireUser();
  const cv = String(formData.get("cv_text") ?? "").trim();
  const t = (await getT()).copilot.errors;
  if (cv.length > 20000) return { error: t.cvTooLong };

  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, cv_text: cv, updated_at: new Date().toISOString() });
  if (error) return { error: t.cvSave };

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cv");
  return { ok: true };
}

export async function analyzeApplication(_prev: AnalyzeState, formData: FormData): Promise<AnalyzeState> {
  const { supabase, user } = await requireUser();
  const applicationId = String(formData.get("application_id") ?? "");
  const jobPost = String(formData.get("job_description") ?? "").trim().slice(0, 20000);
  const locale = await getLocale();
  const t = (await getT()).copilot.errors;

  // Save the job post first so it's kept even if the analysis fails.
  const { data: app, error: appError } = await supabase
    .from("applications")
    .update({ job_description: jobPost || null })
    .eq("id", applicationId)
    .select("company, position")
    .single();
  if (appError || !app) return { error: t.notFound };

  if (jobPost.length < MIN_JOB_POST) return { error: t.shortPost };

  const { data: profile } = await supabase.from("profiles").select("cv_text").eq("user_id", user.id).maybeSingle();
  const cv = profile?.cv_text?.trim() ?? "";
  if (cv.length < MIN_CV) return { error: t.noCv };

  // Without an API key, fall back to the free keyword matcher.
  if (!process.env.ANTHROPIC_API_KEY) {
    return saveAnalysis(supabase, applicationId, matchCvToJob(cv, jobPost, locale), t.notSaved);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("ai_analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", since)
    .eq("result->>mode", "ai");
  const used = count ?? 0;
  if (used >= DAILY_LIMIT) return { error: t.limit(DAILY_LIMIT), remaining: 0 };

  let result: MatchResult;
  try {
    result = await analyzeMatch({ cv, jobPost, company: app.company, position: app.position, locale });
  } catch (error) {
    if (error instanceof CopilotError) return { error: error.message };
    if (error instanceof Anthropic.RateLimitError) return { error: t.busy };
    if (error instanceof Anthropic.AuthenticationError) return { error: t.config };
    if (error instanceof Anthropic.APIError) {
      console.error("Claude API error", error.status, error.message);
      return { error: t.unavailable };
    }
    throw error;
  }

  const saved = await saveAnalysis(supabase, applicationId, { ...result, mode: "ai" }, t.notSaved);
  return saved?.analysis ? { ...saved, remaining: DAILY_LIMIT - used - 1 } : saved;
}

async function saveAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  applicationId: string,
  result: AnalysisResult,
  notSaved: string
): Promise<AnalyzeState> {
  const { data: saved, error } = await supabase
    .from("ai_analyses")
    .insert({ application_id: applicationId, score: result.score, result })
    .select("score, result, created_at")
    .single();
  if (error || !saved) return { error: notSaved };

  revalidatePath("/dashboard");
  return { analysis: saved as Analysis };
}
