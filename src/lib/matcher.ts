// Free, deterministic CV ↔ job-post matcher. No network calls, no API costs.
// Finds known skills in the job post, checks which ones the CV mentions and
// weighs "nice to have" skills at half the weight of required ones.

export type Skill = { name: string; aliases: string[] };

export const SKILLS: Skill[] = [
  // Languages
  { name: "JavaScript", aliases: ["javascript", "js", "es6", "ecmascript"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "Python", aliases: ["python"] },
  { name: "Java", aliases: ["java"] },
  { name: "Kotlin", aliases: ["kotlin"] },
  { name: "Swift", aliases: ["swift"] },
  { name: "C#", aliases: ["c#", "csharp"] },
  { name: "C++", aliases: ["c++", "cpp"] },
  { name: "Go", aliases: ["golang", "go lang"] },
  { name: "Rust", aliases: ["rust"] },
  { name: "PHP", aliases: ["php"] },
  { name: "Ruby", aliases: ["ruby"] },
  { name: "Dart", aliases: ["dart"] },
  { name: "SQL", aliases: ["sql"] },
  { name: "HTML", aliases: ["html", "html5"] },
  { name: "CSS", aliases: ["css", "css3"] },
  { name: "Sass", aliases: ["sass", "scss"] },
  { name: "Bash", aliases: ["bash", "shell scripting"] },
  // Frontend & mobile
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "React Native", aliases: ["react native", "react-native"] },
  { name: "Next.js", aliases: ["next.js", "nextjs", "next js"] },
  { name: "Vue", aliases: ["vue", "vue.js", "vuejs", "nuxt"] },
  { name: "Angular", aliases: ["angular"] },
  { name: "Svelte", aliases: ["svelte", "sveltekit"] },
  { name: "Redux", aliases: ["redux", "zustand"] },
  { name: "Tailwind CSS", aliases: ["tailwind", "tailwindcss", "tailwind css"] },
  { name: "Expo", aliases: ["expo"] },
  { name: "Flutter", aliases: ["flutter"] },
  { name: "Android", aliases: ["android"] },
  { name: "iOS", aliases: ["ios"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "Accessibility", aliases: ["accessibility", "a11y", "wcag"] },
  // Backend
  { name: "Node.js", aliases: ["node.js", "nodejs", "node js", "node"] },
  { name: "Express", aliases: ["express.js", "expressjs", "express js", "node/express", "node.js/express"] },
  { name: "NestJS", aliases: ["nestjs", "nest.js"] },
  { name: "Spring Boot", aliases: ["spring boot", "spring framework"] },
  { name: ".NET", aliases: [".net", "dotnet", "asp.net", ".net core"] },
  { name: "Django", aliases: ["django"] },
  { name: "Flask", aliases: ["flask", "fastapi"] },
  { name: "Laravel", aliases: ["laravel"] },
  { name: "REST APIs", aliases: ["restful", "rest api", "rest apis", "rest-api", "api design"] },
  { name: "GraphQL", aliases: ["graphql"] },
  { name: "WebSockets", aliases: ["websocket", "websockets", "socket.io"] },
  { name: "Microservices", aliases: ["microservices", "microservice"] },
  // Data
  { name: "PostgreSQL", aliases: ["postgresql", "postgres"] },
  { name: "MySQL", aliases: ["mysql", "mariadb"] },
  { name: "SQLite", aliases: ["sqlite"] },
  { name: "MongoDB", aliases: ["mongodb", "mongo"] },
  { name: "Redis", aliases: ["redis"] },
  { name: "Supabase", aliases: ["supabase"] },
  { name: "Firebase", aliases: ["firebase", "firestore"] },
  { name: "Prisma", aliases: ["prisma", "orm"] },
  // Cloud & DevOps
  { name: "Git", aliases: ["git", "github", "gitlab", "bitbucket"] },
  { name: "Docker", aliases: ["docker", "containers", "containerization"] },
  { name: "Kubernetes", aliases: ["kubernetes", "k8s"] },
  { name: "CI/CD", aliases: ["ci/cd", "ci cd", "continuous integration", "github actions", "gitlab ci", "jenkins"] },
  { name: "AWS", aliases: ["aws", "amazon web services"] },
  { name: "Azure", aliases: ["azure"] },
  { name: "Google Cloud", aliases: ["gcp", "google cloud"] },
  { name: "Vercel", aliases: ["vercel", "netlify"] },
  { name: "Linux", aliases: ["linux", "unix"] },
  // Testing & practices
  { name: "Unit testing", aliases: ["unit testing", "unit tests", "jest", "vitest", "junit", "pytest", "testing library"] },
  { name: "End-to-end testing", aliases: ["e2e", "end-to-end", "cypress", "playwright", "selenium"] },
  { name: "TDD", aliases: ["tdd", "test-driven"] },
  { name: "OOP", aliases: ["oop", "object-oriented", "object oriented"] },
  { name: "Data structures & algorithms", aliases: ["data structures", "algorithms"] },
  { name: "Agile / Scrum", aliases: ["agile", "scrum", "kanban", "jira"] },
  { name: "Code review", aliases: ["code review", "code reviews", "pull requests"] },
  { name: "AI / LLMs", aliases: ["llm", "llms", "openai", "claude", "generative ai", "machine learning", "ai"] },
  { name: "English", aliases: ["english"] },
];

const NICE_TO_HAVE = /(nice[\s-]to[\s-]have|bonus|preferred|a plus|is a plus|would be great|optional|good to have)/i;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-ish boundaries that also work for terms like "c#", ".net" and "node.js".
function aliasPattern(alias: string) {
  return new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(alias)}(?=$|[^a-z0-9+#])`, "i");
}

const PATTERNS = SKILLS.map((s) => ({ skill: s, patterns: s.aliases.map(aliasPattern) }));

export function findSkills(text: string): Set<string> {
  const found = new Set<string>();
  for (const { skill, patterns } of PATTERNS) {
    if (patterns.some((p) => p.test(text))) found.add(skill.name);
  }
  return found;
}

/** Splits a job post into required and nice-to-have text using common section headings. */
export function splitJobPost(jobPost: string) {
  const required: string[] = [];
  const optional: string[] = [];
  let inOptional = false;
  for (const line of jobPost.split(/\r?\n/)) {
    const trimmed = line.trim();
    const isHeading = trimmed.length > 0 && trimmed.length < 60 && !/[.]$/.test(trimmed);
    if (NICE_TO_HAVE.test(trimmed) && (isHeading || /^nice|^bonus|^preferred/i.test(trimmed))) {
      inOptional = true;
      // A heading like "Nice to have: Expo, Supabase" carries skills on the same line.
      optional.push(trimmed);
      continue;
    }
    if (isHeading && /(requirement|must have|qualification|you have|we expect|skills|responsibilit|what you)/i.test(trimmed)) {
      inOptional = false;
    }
    (inOptional ? optional : required).push(line);
  }
  // Inline "Nice to have: X, Y" inside a paragraph.
  const requiredText = required.join("\n").replace(/(nice[\s-]to[\s-]have|bonus|a plus)[^.\n]*/gi, (m) => {
    optional.push(m);
    return "";
  });
  return { requiredText, optionalText: optional.join("\n") };
}

export type BasicMatch = {
  score: number;
  verdict: string;
  strengths: string[];
  missing_keywords: string[];
  suggestions: string[];
  cover_letter: string;
  mode: "basic";
  detected: number;
};

// Result text in both languages. Kept in this module so it stays dependency-free for the unit tests.
const TEXT = {
  en: {
    rough: "The job post names only a few specific technologies, so this score is a rough guide — read the requirements yourself too.",
    strong: (m: number, n: number) => `Your CV covers ${m} of the ${n} skills this job asks for — apply with confidence.`,
    close: (m: number, n: number) => `You match ${m} of the ${n} skills this job asks for. Close the gaps below to stand out.`,
    weak: (m: number, n: number) => `Your CV shows ${m} of the ${n} skills this job asks for — focus on the requirements below.`,
    required: (s: string) => `“${s}” is listed as a requirement — if you have that experience, mention it in a project bullet.`,
    niceToHave: (list: string) => `Nice-to-haves you could add if you know them: ${list}.`,
    years: (y: string) => `The post asks for about ${y}+ year(s) of experience — highlight shipped projects and their impact to make up for it.`,
    wording: "Use the job post's exact wording for skills you have, so applicant tracking systems pick them up.",
    inCv: (s: string, nice: boolean) => `${s} — in your CV${nice ? " (nice to have)" : ""}`,
  },
  sq: {
    rough: "Shpallja përmend vetëm pak teknologji specifike, ndaj këto pikë janë orientuese — lexoji vetë kërkesat gjithashtu.",
    strong: (m: number, n: number) => `CV-ja jote mbulon ${m} nga ${n} aftësitë që kërkon kjo punë — apliko me besim.`,
    close: (m: number, n: number) => `Përputhesh në ${m} nga ${n} aftësitë që kërkon kjo punë. Plotëso mungesat më poshtë për t'u dalluar.`,
    weak: (m: number, n: number) => `CV-ja jote tregon ${m} nga ${n} aftësitë që kërkon kjo punë — përqendrohu te kërkesat më poshtë.`,
    required: (s: string) => `“${s}” është kërkesë — nëse ke përvojë me të, përmende te një projekt.`,
    niceToHave: (list: string) => `Aftësi të dëshirueshme që mund t'i shtosh nëse i di: ${list}.`,
    years: (y: string) => `Shpallja kërkon rreth ${y}+ vit përvojë — thekso projektet e përfunduara dhe ndikimin e tyre për ta kompensuar.`,
    wording: "Përdor të njëjtat fjalë si shpallja për aftësitë që i ke, që sistemet e përzgjedhjes (ATS) t'i dallojnë.",
    inCv: (s: string, nice: boolean) => `${s} — në CV-në tënde${nice ? " (e dëshirueshme)" : ""}`,
  },
};

export function matchCvToJob(cv: string, jobPost: string, locale: "en" | "sq" = "en"): BasicMatch {
  const t = TEXT[locale];
  const { requiredText, optionalText } = splitJobPost(jobPost);
  const requiredSkills = findSkills(requiredText);
  const optionalSkills = [...findSkills(optionalText)].filter((s) => !requiredSkills.has(s));
  const cvSkills = findSkills(cv);

  // In a job post, "React Native" also matches "React". Count plain React only if it is named on its own.
  if (requiredSkills.has("React Native") && !/(^|[^a-z])react(?![\s-]native)/i.test(requiredText)) requiredSkills.delete("React");

  const required = [...requiredSkills];
  const weights = [...required.map((s) => ({ s, w: 1 })), ...optionalSkills.map((s) => ({ s, w: 0.5 }))];
  const total = weights.reduce((sum, x) => sum + x.w, 0);
  const matched = weights.filter((x) => cvSkills.has(x.s));
  const score = total === 0 ? 0 : Math.round((matched.reduce((sum, x) => sum + x.w, 0) / total) * 100);

  const missingRequired = required.filter((s) => !cvSkills.has(s));
  const missingOptional = optionalSkills.filter((s) => !cvSkills.has(s));
  const years = jobPost.match(/(\d+)\s*\+?\s*(?:years?|yrs?)/i)?.[1];

  const verdict =
    weights.length < 3
      ? t.rough
      : score >= 75
        ? t.strong(matched.length, weights.length)
        : score >= 50
          ? t.close(matched.length, weights.length)
          : t.weak(matched.length, weights.length);

  const suggestions: string[] = [];
  for (const s of missingRequired.slice(0, 4)) {
    suggestions.push(t.required(s));
  }
  if (missingOptional.length) {
    suggestions.push(t.niceToHave(missingOptional.slice(0, 4).join(", ")));
  }
  if (years) {
    suggestions.push(t.years(years));
  }
  suggestions.push(t.wording);

  return {
    score,
    verdict,
    strengths: matched.map((x) => t.inCv(x.s, x.w < 1)),
    missing_keywords: [...missingRequired, ...missingOptional],
    suggestions,
    cover_letter: "",
    mode: "basic",
    detected: weights.length,
  };
}
