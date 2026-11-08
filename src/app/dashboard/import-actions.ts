"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchPublicHtml, FetchError, parsePublicUrl } from "@/lib/safe-fetch";
import { greenhouseApiUrl, parseGreenhouseJob, parseJobPage, type ImportedJob } from "@/lib/jobimport";
import { getT } from "@/i18n/server";

export type ImportResult = { job?: ImportedJob; url?: string; error?: string };

// A light per-user limit (per server instance) so the importer can't be used to fetch pages in bulk.
const WINDOW_MS = 10 * 60_000;
const MAX_IMPORTS = 20;
const recent = new Map<string, number[]>();

export async function importJobFromLink(input: string): Promise<ImportResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const dict = await getT();
  const t = dict.importJob.errors;
  if (!user) return { error: dict.forms.signIn };

  let url: string;
  try {
    url = parsePublicUrl(String(input).slice(0, 2000)).toString();
  } catch (e) {
    return { error: e instanceof FetchError ? t[e.code] : t.invalid };
  }

  const now = Date.now();
  const mine = (recent.get(user.id) ?? []).filter((at) => now - at < WINDOW_MS);
  if (mine.length >= MAX_IMPORTS) return { url, error: t.failed };
  recent.set(user.id, [...mine, now]);

  // Greenhouse boards render in the browser, so read their public Job Board API instead (falls back to the page).
  const api = greenhouseApiUrl(url);
  if (api) {
    try {
      const res = await fetchPublicHtml(api, { json: true });
      const job = parseGreenhouseJob(JSON.parse(res.html), url);
      if (job) return { job, url };
    } catch {
      /* fall through to the page itself */
    }
  }

  try {
    const page = await fetchPublicHtml(url);
    // Keep the link the user pasted (redirects often add tracking parameters).
    const job = parseJobPage(page.html, url);
    if (!job || (!job.position && !job.company)) return { url, error: t.nothing };
    return { job, url };
  } catch (e) {
    if (e instanceof FetchError) return { url, error: t[e.code] };
    console.error("job import failed", e);
    return { url, error: t.failed };
  }
}
