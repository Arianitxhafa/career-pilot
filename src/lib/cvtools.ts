// CV tools (pure, unit-tested, free): PDF text clean-up, match scores across every saved job,
// the skills that would raise those scores most, and cover-letter templates in English and Albanian.
import { findSkills, matchCvToJob, SKILLS, splitJobPost, type BasicMatch } from "./matcher.ts";

export const MAX_CV = 20000;
export const MIN_JOB_POST = 200;

/** Tidies text pulled out of a PDF: control characters, icon-font glyphs, broken hyphenation, extra blank lines. */
export function cleanPdfText(raw: string) {
  const text = raw
    .replace(/\r\n?/g, "\n")
    // Control characters, soft hyphens, replacement characters and private-use glyphs (icon fonts).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F­�-]/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    // "develop-\nment" → "development" (only when the next line starts in lower case).
    .replace(/([A-Za-zÀ-ž])-\n(?=[a-zà-ž])/g, "$1")
    // Lines wrapped by the PDF layout: join when the sentence clearly continues (comma, or a lower-case start).
    .replace(/,\n(?=\S)/g, ", ")
    .replace(/([^\n:.!?•])\n(?=[a-zà-ž(])/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { text: text.slice(0, MAX_CV), truncated: text.length > MAX_CV };
}

export type MatchJob = { id: string; company: string; position: string; status: string; job_description: string | null };
export type RankedJob<J extends MatchJob = MatchJob> = { job: J; match: BasicMatch };

/** Scores the CV against every job that has a job post, best match first. */
export function rankJobs<J extends MatchJob>(cv: string, jobs: J[], locale: "en" | "sq" = "en"): RankedJob<J>[] {
  return jobs
    .filter((j) => (j.job_description?.trim().length ?? 0) >= MIN_JOB_POST)
    .map((job) => ({ job, match: matchCvToJob(cv, job.job_description!, locale) }))
    .sort((a, b) => b.match.score - a.match.score || b.match.detected - a.match.detected || a.job.company.localeCompare(b.job.company));
}

export type NextSkill = { skill: string; jobs: number; gain: number };

/** Missing skills ranked by how many points they would add across the ranked jobs if the CV showed them. */
export function bestNextSkills(cv: string, ranked: RankedJob[], limit = 5): NextSkill[] {
  const totals = new Map<string, { jobs: number; gain: number }>();
  for (const { job, match } of ranked) {
    for (const skill of new Set(match.missing_keywords)) {
      const alias = SKILLS.find((s) => s.name === skill)?.aliases[0];
      if (!alias) continue;
      const gain = matchCvToJob(`${cv}\n${alias}`, job.job_description!).score - match.score;
      if (gain <= 0) continue;
      const entry = totals.get(skill) ?? { jobs: 0, gain: 0 };
      entry.jobs++;
      entry.gain += gain;
      totals.set(skill, entry);
    }
  }
  return [...totals.entries()]
    .map(([skill, t]) => ({ skill, jobs: t.jobs, gain: Math.round(t.gain / t.jobs) }))
    .sort((a, b) => b.jobs * b.gain - a.jobs * a.gain || a.skill.localeCompare(b.skill))
    .slice(0, limit);
}

// ─── Cover letters ─────────────────────────────────────────────────────────

export const LETTER_TEMPLATES = ["formal", "friendly", "email", "student"] as const;
export type LetterTemplate = (typeof LETTER_TEMPLATES)[number];
export type LetterLang = "en" | "sq";

const HEADINGS = /^(projects?|projektet?|experience|work experience|përvoja|skills|aftësitë|education|arsimimi|profile|profili|summary|languages|gjuhët)\b\s*:?\s*/i;

/** The name on the first line of a CV, e.g. "Arianit Xhafa — Software Developer" → "Arianit Xhafa". */
export function nameFromCv(cv: string) {
  const first = cv.split("\n").find((l) => l.trim())?.trim() ?? "";
  const candidate = first.split(/\s+[—–|-]\s+|,|\|/)[0].trim();
  const words = candidate.split(/\s+/);
  if (words.length < 2 || words.length > 4 || /[\d@]/.test(candidate)) return null;
  return words.every((w) => /^\p{Lu}/u.test(w)) ? candidate : null;
}

/** The CV project that uses the most of the given skills, e.g. { title: "Invoicing SaaS", skills: ["Next.js", "TypeScript"] }. */
export function findProject(cv: string, skills: string[]) {
  const wanted = new Set(skills);
  let best: { title: string; skills: string[] } | null = null;
  const lines = cv.split("\n").slice(1); // the first line is the name
  for (const line of lines.flatMap((l) => l.split(/•|;|\),\s*/))) {
    const clean = line.replace(/^\s*[-*•·▪◦]\s*/, "").replace(HEADINGS, "").trim();
    const title = clean.split(/\s+[—–-]\s+|:|\(/)[0].trim();
    if (title === clean || title.length < 3 || title.length > 40 || HEADINGS.test(title) || /,/.test(title)) continue;
    const used = [...findSkills(clean)].filter((s) => wanted.has(s));
    if (used.length && (!best || used.length > best.skills.length)) best = { title, skills: used };
  }
  return best;
}

const join = (items: string[], lang: LetterLang) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} ${lang === "sq" ? "dhe" : "and"} ${items[items.length - 1]}`;
const quote = (s: string, lang: LetterLang) => (lang === "sq" ? `„${s}“` : `“${s}”`);

export type LetterInput = { company: string; position: string; name?: string | null; cv: string; jobPost: string };

/** Fills a cover-letter template from the CV and the job post. Square brackets mark what the user should edit. */
export function coverLetter(template: LetterTemplate, input: LetterInput, lang: LetterLang): string {
  const match = matchCvToJob(input.cv, input.jobPost, lang);
  const cvSkills = findSkills(input.cv);
  // Skills the job asks for that the CV shows, required ones first (missing_keywords lists only gaps).
  const { requiredText } = splitJobPost(input.jobPost);
  const jobSkills = new Set([...findSkills(requiredText), ...findSkills(input.jobPost)]);
  // "React Native" also matches "React"; keep plain React only if the post names it on its own (as the matcher does).
  if (jobSkills.has("React Native") && !/(^|[^a-z])react(?![\s-]native)/i.test(input.jobPost)) jobSkills.delete("React");
  const shown = [...jobSkills].filter((s) => cvSkills.has(s) && s !== "English");
  const skills = shown.slice(0, 3);
  const learning = match.missing_keywords.find((s) => s !== "English");
  const project = findProject(input.cv, shown);
  const name = input.name?.trim() || nameFromCv(input.cv) || (lang === "sq" ? "[Emri yt]" : "[Your name]");
  const { company, position } = input;
  const s = join(skills, lang);
  const ps = project ? join(project.skills.slice(0, 3), lang) : "";
  const pq = project ? quote(project.title, lang) : "";

  if (lang === "sq") {
    const projectLine = project
      ? `Së fundmi kam ndërtuar ${pq}, ku kam përdorur ${ps}. [Shto një rezultat, p.sh. sa përdorues pati ose çfarë përmirësoi.]`
      : "[Përshkruaj një projekt që të përfaqëson më së miri dhe rezultatin që arriti.]";
    const learnLine = learning ? `Gjithashtu po mësoj ${learning}, që e pashë se është e rëndësishme për këtë rol. ` : "";
    switch (template) {
      case "formal":
        return `Të nderuar ekipi i ${company},

Po ju shkruaj për të aplikuar për pozitën ${position} në ${company}. ${skills.length ? `Përvoja ime me ${s} përputhet me atë që kërkoni dhe dëshiroj ta vë në praktikë në një ekip profesional.` : "Dëshiroj t'i vë aftësitë dhe motivimin tim në shërbim të një ekipi profesional."}

${projectLine}

${learnLine}Do të më gëzonte mundësia të diskutojmë se si mund të kontribuoj në ekipin tuaj. Ju falënderoj për kohën dhe vëmendjen.

Me respekt,
${name}`;
      case "friendly":
        return `Përshëndetje ekipi i ${company},

Jam ${name} dhe do të doja shumë t'ju bashkohesha si ${position}. ${skills.length ? `Me ${s} punoj çdo ditë, ndaj ky rol m'u duk i përshtatshëm që në leximin e parë.` : "Ky rol m'u duk i përshtatshëm që në leximin e parë."}

${projectLine}

Çfarë sjell unë: kuriozitet, mësim të shpejtë dhe kujdes për detajet. [Shto një fjali pse pikërisht ${company}.]

Faleminderit që e lexuat — jam në dispozicion për një bisedë kur t'ju përshtatet.

Me të mira,
${name}`;
      case "email":
        return `Tema: Aplikim — ${position}

Përshëndetje,

Dëshiroj të aplikoj për pozitën ${position} në ${company}. ${skills.length ? `Punoj me ${s}` : "Kam përvojë me projekte praktike"}${project ? ` dhe së fundmi kam ndërtuar ${pq}` : ""}. CV-ja ime është bashkëngjitur.

Jam në dispozicion për një telefonatë kur t'ju përshtatet.

Me respekt,
${name}`;
      case "student":
        return `Të nderuar ekipi i ${company},

Jam student/e i/e vitit [viti] në [programi i studimit], [universiteti], dhe po aplikoj për pozitën ${position}. ${skills.length ? `Gjatë studimeve dhe projekteve personale kam punuar me ${s}.` : "Gjatë studimeve dhe projekteve personale kam ndërtuar aplikacione nga fillimi deri në fund."}

${projectLine}

${learnLine}Kërkoj një vend ku mund të mësoj nga inxhinierë me përvojë dhe të kontribuoj që nga dita e parë. Do të më gëzonte mundësia për një intervistë.

Me respekt,
${name}`;
    }
  }

  const projectLine = project
    ? `Most recently, I built ${pq}, where I used ${ps}. [Add one result, e.g. how many people used it or what it improved.]`
    : "[Describe one project you're proud of and the result it achieved.]";
  const learnLine = learning ? `I am also learning ${learning}, which I noticed is important for this role. ` : "";
  switch (template) {
    case "formal":
      return `Dear ${company} Hiring Team,

I am writing to apply for the ${position} position at ${company}. ${skills.length ? `My experience with ${s} matches what you are looking for, and I am eager to apply it in a professional team.` : "I am eager to bring my skills and motivation to a professional team."}

${projectLine}

${learnLine}I would welcome the opportunity to discuss how I can contribute to your team. Thank you for your time and consideration.

Kind regards,
${name}`;
    case "friendly":
      return `Hi ${company} team,

I'm ${name}, and I'd love to join you as a ${position}. ${skills.length ? `I work with ${s} every day, so this role felt like a great fit the moment I read it.` : "This role felt like a great fit the moment I read it."}

${projectLine}

What I'd bring: curiosity, quick learning and care for the details. [Add one sentence on why ${company} in particular.]

Thanks for reading — I'd be happy to chat whenever suits you.

Best,
${name}`;
    case "email":
      return `Subject: Application — ${position}

Hello,

I'd like to apply for the ${position} role at ${company}. ${skills.length ? `I work with ${s}` : "I have hands-on project experience"}${project ? ` and recently built ${pq}` : ""}. My CV is attached.

I'm available for a call at your convenience.

Best regards,
${name}`;
    case "student":
      return `Dear ${company} team,

I am a [year] student of [study programme] at [university], and I am applying for the ${position} position. ${skills.length ? `Through my studies and personal projects I have worked with ${s}.` : "Through my studies and personal projects I have built applications end to end."}

${projectLine}

${learnLine}I am looking for a place where I can learn from experienced engineers and contribute from day one. I would welcome the chance to interview.

Kind regards,
${name}`;
  }
}
