// Reads a job posting out of a job page's HTML (pure, unit-tested). Most job boards and applicant tracking systems
// publish schema.org JobPosting data as JSON-LD for search engines; when a page has none, Open Graph tags give a
// partial result.

export type ImportedJob = {
  position: string | null;
  company: string | null;
  location: string | null;
  salary_range: string | null;
  job_description: string | null;
  job_url: string;
  /** "jsonld" = full JobPosting data; "meta" = only page title/description, so the user should check the fields. */
  source: "jsonld" | "meta";
};

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", euro: "€", pound: "£", ndash: "–", mdash: "—",
  hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", bull: "•", middot: "·", euml: "ë", Euml: "Ë",
  ccedil: "ç", Ccedil: "Ç", eacute: "é", uuml: "ü", ouml: "ö", auml: "ä", szlig: "ß", copy: "©", reg: "®", trade: "™",
};

export function decodeEntities(s: string) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    return NAMED[code] ?? m;
  });
}

/** Job descriptions come as HTML: keep paragraphs, line breaks and bullets, drop everything else. */
export function htmlToText(html: string) {
  const text = decodeEntities(
    // Some sites double-encode the HTML inside JSON-LD (&lt;p&gt;…).
    /&lt;\/?[a-z]/i.test(html) && !/<\/?[a-z]/i.test(html) ? decodeEntities(html) : html,
  )
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h[1-6]|ul|ol|section|tr)>/gi, "\n")
    .replace(/<(p|div|h[1-6]|ul|ol|section|tr)[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(text)
    .replace(/[   ]/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const clean = (v: unknown, max: number) => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = decodeEntities(String(v)).replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
};

type Json = Record<string, unknown>;
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
const isJobPosting = (v: unknown): v is Json =>
  !!v && typeof v === "object" && asArray((v as Json)["@type"]).some((t) => typeof t === "string" && /JobPosting$/i.test(t));

/** Every JobPosting object in the page's JSON-LD blocks (including inside @graph and arrays). */
function findJobPostings(html: string): Json[] {
  const found: Json[] = [];
  const walk = (v: unknown, depth = 0) => {
    if (depth > 6 || !v || typeof v !== "object") return;
    if (isJobPosting(v)) found.push(v);
    for (const child of Array.isArray(v) ? v : Object.values(v)) if (child && typeof child === "object") walk(child, depth + 1);
  };
  for (const m of html.matchAll(/<script[^>]+type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    const raw = m[1].trim().replace(/^<!--|-->$/g, "");
    try {
      walk(JSON.parse(raw));
    } catch {
      // Some pages put raw line breaks inside JSON strings; try once more with them escaped.
      try {
        walk(JSON.parse(raw.replace(/[\r\n\t]+/g, " ")));
      } catch {
        /* not valid JSON — skip this block */
      }
    }
  }
  return found;
}

const nameOf = (v: unknown) => (typeof v === "string" ? v : v && typeof v === "object" ? (v as Json).name : null);

function location(job: Json) {
  const places = asArray(job.jobLocation)
    .map((loc) => {
      const address = (loc as Json | null)?.address;
      if (typeof address === "string") return clean(address, 80);
      const a = (address ?? {}) as Json;
      const parts = [a.addressLocality, a.addressRegion, nameOf(a.addressCountry)].map((p) => clean(p, 60)).filter(Boolean) as string[];
      // "Prishtina, Prishtina, XK" → "Prishtina, XK"
      return [...new Set(parts)].join(", ") || null;
    })
    .filter(Boolean) as string[];
  const remote = asArray(job.jobLocationType).some((t) => /TELECOMMUTE/i.test(String(t)));
  const list = [...new Set(places)].slice(0, 2).join(" · ");
  return clean(remote ? (list ? `${list} · Remote` : "Remote") : list, 120);
}

const CURRENCY: Record<string, string> = { EUR: "€", USD: "$", GBP: "£" };
const UNIT: Record<string, string> = { HOUR: "hour", DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" };
const money = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function salary(job: Json) {
  const base = job.baseSalary ?? job.estimatedSalary;
  const b = (Array.isArray(base) ? base[0] : base) as Json | undefined;
  if (!b || typeof b !== "object") return clean(base, 60);
  const value = (b.value && typeof b.value === "object" ? b.value : b) as Json;
  const num = (v: unknown) => (v === "" || v == null ? NaN : Number(v));
  const min = num(value.minValue), max = num(value.maxValue), single = num(typeof b.value === "object" ? value.value : b.value);
  const code = String(b.currency ?? value.currency ?? "").toUpperCase();
  const symbol = CURRENCY[code] ?? (code ? `${code} ` : "");
  const unit = UNIT[String(value.unitText ?? b.unitText ?? "").toUpperCase()];
  let amount: string | null = null;
  if (Number.isFinite(min) && Number.isFinite(max) && min !== max) amount = `${symbol}${money(min)}–${money(max)}`;
  else if (Number.isFinite(min) || Number.isFinite(max) || Number.isFinite(single)) {
    const n = [single, min, max].find(Number.isFinite)!;
    if (n > 0) amount = `${symbol}${money(n)}`;
  }
  return amount ? clean(unit ? `${amount} / ${unit}` : amount, 60) : null;
}

function meta(html: string, key: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
    if (content) return decodeEntities(content).trim();
  }
  return null;
}

/** "Frontend Developer at Northwind Labs | Jobs" → { position, company } (best effort). */
export function splitTitle(title: string, siteName: string | null) {
  let t = title.replace(/\s+/g, " ").trim();
  if (siteName) t = t.replace(new RegExp(`\\s*[|·–—-]\\s*${siteName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "");
  t = t.replace(/\s*[|·]\s*[^|·]*(jobs?|careers?|punë|karriera|linkedin)[^|·]*$/i, "").trim();
  // LinkedIn: "Northwind Labs hiring Frontend Developer in Prishtina"
  const hiring = t.match(/^(.+?)\s+(?:is\s+)?hiring\s+(?:a\s+|an\s+)?(.+?)(?:\s+in\s+(.+))?$/i);
  if (hiring) return { position: hiring[2].trim(), company: hiring[1].trim(), location: hiring[3]?.trim() ?? null };
  // Not "në"/"tek": they are everyday words in Albanian job titles ("Punëtor në Lokal").
  const at = t.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i) ?? t.match(/^(.+?)\s+[–—|-]\s+(.+)$/);
  return at ? { position: at[1].trim(), company: at[2].trim(), location: null } : { position: t || null, company: null, location: null };
}

// ─── Site adapters ─────────────────────────────────────────────────────────

/** Greenhouse job boards render in the browser; their public Job Board API has the full posting. */
export function greenhouseApiUrl(url: string) {
  const m = url.match(/^https:\/\/(?:job-boards|boards)(?:\.eu)?\.greenhouse\.io\/([\w-]+)\/jobs\/(\d+)/i);
  return m ? `https://boards-api.greenhouse.io/v1/boards/${m[1]}/jobs/${m[2]}?pay_transparency=true` : null;
}

export function parseGreenhouseJob(data: unknown, url: string): ImportedJob | null {
  const j = (data ?? {}) as Json;
  if (typeof j.title !== "string") return null;
  const pay = asArray(j.pay_input_ranges)[0] as Json | undefined;
  const cents = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) / 100 : NaN);
  const salary_range = pay
    ? (() => {
        const code = String(pay.currency_type ?? "").toUpperCase();
        const sym = CURRENCY[code] ?? (code ? `${code} ` : "");
        const [min, max] = [cents(pay.min_cents), cents(pay.max_cents)];
        if (!Number.isFinite(min) || !Number.isFinite(max) || max <= 0) return null;
        return clean(min === max ? `${sym}${money(min)}` : `${sym}${money(min)}–${money(max)}`, 60);
      })()
    : null;
  const description = typeof j.content === "string" ? htmlToText(j.content).slice(0, 20000) : null;
  return {
    position: clean(j.title, 120),
    company: clean(j.company_name, 120),
    location: clean((j.location as Json | undefined)?.name, 120),
    salary_range,
    job_description: description || null,
    job_url: url,
    source: "jsonld",
  };
}

const textOf = (html: string, re: RegExp) => {
  const m = html.match(re)?.[1];
  return m ? clean(m.replace(/<[^>]+>/g, " "), 120) : null;
};

/** KosovaJob (kosovajob.com): no JSON-LD, but the company and city sit in fixed elements. */
function kosovaJob(html: string, url: string): ImportedJob | null {
  const position = clean(meta(html, "og:title") ?? textOf(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), 120);
  if (!position) return null;
  const description = meta(html, "og:description") ?? meta(html, "description");
  return {
    position,
    company: textOf(html, /class="[^"]*kj-jobhead__comp[^"]*"[^>]*>([\s\S]*?)<\/span>/i),
    location: textOf(html, /class="[^"]*inbJobCityName[^"]*"[^>]*>([\s\S]*?)<\/a>/i),
    salary_range: null,
    job_description: description ? htmlToText(description).slice(0, 20000) : null,
    job_url: url,
    source: "jsonld",
  };
}

export function parseJobPage(html: string, url: string): ImportedJob | null {
  const job = findJobPostings(html)[0];
  if (!job && /^https?:\/\/([\w-]+\.)*kosovajob\.com\//i.test(url)) {
    const kj = kosovaJob(html, url);
    if (kj) return kj;
  }
  if (job) {
    const description = typeof job.description === "string" ? htmlToText(job.description).slice(0, 20000) : null;
    return {
      position: clean(job.title ?? job.name, 120),
      company: clean(nameOf(job.hiringOrganization), 120),
      location: location(job),
      salary_range: salary(job),
      job_description: description || null,
      job_url: url,
      source: "jsonld",
    };
  }
  const title = meta(html, "og:title") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const site = meta(html, "og:site_name");
  if (!title) return null;
  const { position, company, location: place } = splitTitle(decodeEntities(title), site);
  const description = meta(html, "og:description") ?? meta(html, "description");
  return {
    position: clean(position, 120),
    company: clean(company, 120),
    location: clean(place, 120),
    salary_range: null,
    job_description: description ? htmlToText(description).slice(0, 20000) : null,
    job_url: url,
    source: "meta",
  };
}
