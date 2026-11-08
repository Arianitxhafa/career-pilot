import type { Status } from "./applications";

// Fictional people and companies — demo data only.

export const DEMO_CV = `Demo Pilot — Junior Full-Stack Developer
Prishtina, Kosovo · demo@careerpilot.example

PROFILE
Final-year Computer Science student who builds full-stack web apps end to end, from the database to the interface.

SKILLS
JavaScript, TypeScript, React, Next.js, Node.js, Express, PostgreSQL, SQL, Supabase, Tailwind CSS, HTML, CSS, Git, GitHub, REST APIs, Vercel, Figma, English (B2), Albanian (native)

PROJECTS
Invoicing SaaS — Next.js, TypeScript, PostgreSQL, Drizzle ORM. Teams with roles, subscription billing, PDF export and end-to-end tests.
Car rental platform — Node.js and PostgreSQL REST API with an admin dashboard, sessions and bookings.
Job tracker — Next.js and Supabase with Row Level Security, drag and drop and a CV matcher.

EDUCATION
BSc Computer Science and Engineering, University of Mitrovica (2024–2027)`;

const FRONTEND_POST = `Junior Frontend Developer — Northwind Labs (Prishtina)

About the role
You'll build product features in our web app together with designers and backend engineers.

Requirements
- Solid JavaScript and TypeScript
- Experience with React and Next.js
- Good HTML and CSS, Tailwind CSS is a plus
- Git and code reviews
- Good English

Nice to have
- Testing with Jest or Playwright
- GraphQL
- Figma`;

const RN_POST = `React Native Developer — Orbitly (Remote)

We're looking for a developer to build our mobile app for iOS and Android.

Requirements
- React Native and Expo
- TypeScript
- REST APIs and state management (Redux or Zustand)
- Git

Nice to have
- Swift or Kotlin
- Firebase
- CI/CD with GitHub Actions`;

const DOTNET_POST = `Junior .NET Developer — Kodra Studio (Prishtina · Hybrid)

About the role
You'll join a small team building booking and payment systems for clients across the region.

Requirements
- C# and .NET
- SQL Server or PostgreSQL
- REST APIs
- Git

Nice to have
- Azure
- Docker
- Angular`;

const FULLSTACK_POST = `Full-Stack Intern — Pixelforge (Prishtina)

About the role
A paid six-month internship: you'll ship features across our web products with a mentor at your side.

Requirements
- JavaScript, Node.js and Express
- React
- PostgreSQL and SQL
- HTML and CSS

Nice to have
- Next.js
- Docker
- AWS`;

const QA_POST = `QA Automation Intern — Tessera (Mitrovica)

About the role
Help us automate the tests behind our logistics platform and catch bugs before our customers do.

Requirements
- JavaScript or TypeScript
- End-to-end testing with Playwright or Cypress
- Unit tests with Jest
- Git

Nice to have
- CI/CD with GitHub Actions
- Docker
- Python`;

const LUMEN_POST = `Frontend Engineer — Lumen Apps (Remote)

About the role
You'll own the web app our customers use every day, from new features to performance and accessibility.

Requirements
- React and TypeScript
- Next.js
- Unit testing with Jest and Testing Library
- REST and GraphQL APIs

Nice to have
- Docker
- CI/CD
- AWS`;

type DemoApp = {
  company: string;
  position: string;
  status: Status;
  location: string;
  salary_range?: string;
  job_url?: string;
  notes?: string;
  job_description?: string;
  daysAgo: number; // when it was saved
  appliedDaysAgo?: number;
};

export const DEMO_APPLICATIONS: DemoApp[] = [
  { company: "Northwind Labs", position: "Junior Frontend Developer", status: "saved", location: "Prishtina", job_description: FRONTEND_POST, daysAgo: 1, notes: "Referral possible through a classmate." },
  { company: "Aurora Health", position: "Web Developer Intern", status: "saved", location: "Remote", daysAgo: 2 },
  { company: "Brightloop", position: "Software Engineering Intern", status: "applied", location: "Prishtina", daysAgo: 12, appliedDaysAgo: 10, notes: "Applied through LinkedIn. Follow up next week." },
  { company: "Kodra Studio", position: "Junior .NET Developer", status: "applied", location: "Prishtina · Hybrid", job_description: DOTNET_POST, daysAgo: 9, appliedDaysAgo: 8 },
  { company: "Tessera", position: "QA Automation Intern", status: "applied", location: "Mitrovica", job_description: QA_POST, daysAgo: 6, appliedDaysAgo: 5 },
  { company: "Lumen Apps", position: "Frontend Engineer", status: "applied", location: "Remote", salary_range: "€900–1,200", job_description: LUMEN_POST, daysAgo: 4, appliedDaysAgo: 3 },
  { company: "Orbitly", position: "React Native Developer", status: "interview", location: "Remote", salary_range: "€1,200–1,600", job_description: RN_POST, daysAgo: 20, appliedDaysAgo: 18, notes: "Technical interview on Thursday — review hooks, Expo Router and Supabase RLS." },
  { company: "Deltaworks", position: "Junior Backend Developer", status: "interview", location: "Prishtina", daysAgo: 25, appliedDaysAgo: 22, notes: "Take-home task submitted. Final round with the CTO." },
  { company: "Pixelforge", position: "Full-Stack Intern", status: "offer", location: "Prishtina", salary_range: "€700 / month", job_description: FULLSTACK_POST, daysAgo: 30, appliedDaysAgo: 28, notes: "Offer received — reply by Friday. 🎉" },
  { company: "Bluepeak Agency", position: "Web Developer", status: "rejected", location: "Mitrovica", daysAgo: 35, appliedDaysAgo: 33, notes: "Asked for more backend experience — building it now." },
  { company: "Sigma Fintech", position: "Graduate Developer", status: "rejected", location: "Tirana", daysAgo: 40, appliedDaysAgo: 38 },
];

// ---- Phase 2: what's on the demo calendar, who the demo pilot talks to ------------------

type DemoEvent = {
  company: string;
  kind: "interview" | "follow_up" | "deadline" | "other";
  title: string;
  inDays: number; // negative = in the past
  hour: number;
  minutes?: number;
  duration?: number;
  location?: string;
  notes?: string;
  done?: boolean;
};

export const DEMO_EVENTS: DemoEvent[] = [
  { company: "Deltaworks", kind: "interview", title: "Final round with the CTO", inDays: 1, hour: 14, duration: 60, location: "Deltaworks HQ, Rr. Garibaldi 4, Prishtina", notes: "Walk through the take-home task. Ask about the team and mentoring." },
  { company: "Orbitly", kind: "interview", title: "Technical interview — React Native", inDays: 3, hour: 10, duration: 45, location: "https://meet.example.com/orbitly-rn", notes: "Review hooks, Expo Router and Supabase RLS." },
  { company: "Brightloop", kind: "follow_up", title: "Follow up with Brightloop", inDays: -2, hour: 9, duration: 15, notes: "No reply in 10 days — send a short, friendly email." },
  { company: "Lumen Apps", kind: "follow_up", title: "Follow up with Lumen Apps", inDays: 4, hour: 9, duration: 15 },
  { company: "Pixelforge", kind: "deadline", title: "Reply to the Pixelforge offer", inDays: 5, hour: 17, duration: 15, notes: "Compare with Orbitly before answering." },
  { company: "Northwind Labs", kind: "deadline", title: "Applications close — Northwind", inDays: 9, hour: 23, duration: 15 },
  { company: "Orbitly", kind: "interview", title: "HR screening call", inDays: -6, hour: 11, duration: 30, location: "Phone", done: true },
  { company: "Deltaworks", kind: "other", title: "Submit the take-home task", inDays: -4, hour: 18, duration: 60, done: true },
];

export const DEMO_CONTACTS = [
  { company: "Orbitly", name: "Lena Gashi", role: "Technical Recruiter", email: "lena@orbitly.example", linkedin: "https://www.linkedin.com/in/example-lena" },
  { company: "Orbitly", name: "Marko Shala", role: "Mobile Lead (interviewer)" },
  { company: "Deltaworks", name: "Arben Kelmendi", role: "CTO", email: "arben@deltaworks.example" },
  { company: "Pixelforge", name: "Drita Berisha", role: "People & Culture", email: "jobs@pixelforge.example", phone: "+383 44 123 456" },
  { company: "Brightloop", name: "Visar Hoxha", role: "Engineering Manager", linkedin: "https://www.linkedin.com/in/example-visar" },
];

/** Stage history for a demo application, ending in its current status. */
export function demoPath(status: Status, daysAgo: number, appliedDaysAgo?: number): { from: Status | null; to: Status; daysAgo: number }[] {
  const path: { from: Status | null; to: Status; daysAgo: number }[] = [{ from: null, to: "saved", daysAgo }];
  if (status === "saved" || appliedDaysAgo === undefined) return path;
  path.push({ from: "saved", to: "applied", daysAgo: appliedDaysAgo });
  if (status === "applied") return path;
  if (status === "rejected") return [...path, { from: "applied", to: "rejected", daysAgo: Math.max(1, appliedDaysAgo - 9) }];
  path.push({ from: "applied", to: "interview", daysAgo: Math.max(1, appliedDaysAgo - 7) });
  if (status === "offer") path.push({ from: "interview", to: "offer", daysAgo: Math.max(0, appliedDaysAgo - 21) });
  return path;
}

/** Albanian versions of the demo's notes, places, event titles and roles (job titles and posts stay as companies publish them). */
export const DEMO_SQ: Record<string, string> = {
  Prishtina: "Prishtinë",
  Remote: "Në distancë",
  "Prishtina · Hybrid": "Prishtinë · Hibride",
  Tirana: "Tiranë",
  "Referral possible through a classmate.": "Mundësi rekomandimi përmes një shoku të klasës.",
  "Applied through LinkedIn. Follow up next week.": "Aplikova përmes LinkedIn. Follow-up javën e ardhshme.",
  "Technical interview on Thursday — review hooks, Expo Router and Supabase RLS.": "Intervistë teknike të enjten — rishiko hooks, Expo Router dhe Supabase RLS.",
  "Take-home task submitted. Final round with the CTO.": "Detyra për shtëpi u dorëzua. Raundi final me CTO-në.",
  "Offer received — reply by Friday. 🎉": "Oferta erdhi — përgjigju deri të premten. 🎉",
  "Asked for more backend experience — building it now.": "Kërkuan më shumë përvojë backend — po e ndërtoj tani.",
  "€700 / month": "€700 / muaj",
  "Final round with the CTO": "Raundi final me CTO-në",
  "Deltaworks HQ, Rr. Garibaldi 4, Prishtina": "Zyrat e Deltaworks, Rr. Garibaldi 4, Prishtinë",
  "Walk through the take-home task. Ask about the team and mentoring.": "Shpjego detyrën për shtëpi. Pyet për ekipin dhe mentorimin.",
  "Technical interview — React Native": "Intervistë teknike — React Native",
  "Review hooks, Expo Router and Supabase RLS.": "Rishiko hooks, Expo Router dhe Supabase RLS.",
  "Follow up with Brightloop": "Follow-up me Brightloop",
  "No reply in 10 days — send a short, friendly email.": "Pa përgjigje prej 10 ditësh — dërgo një email të shkurtër e miqësor.",
  "Follow up with Lumen Apps": "Follow-up me Lumen Apps",
  "Reply to the Pixelforge offer": "Përgjigju ofertës së Pixelforge",
  "Compare with Orbitly before answering.": "Krahasoje me Orbitly para se të përgjigjesh.",
  "Applications close — Northwind": "Mbyllen aplikimet — Northwind",
  "HR screening call": "Telefonatë fillestare me HR",
  Phone: "Telefon",
  "Submit the take-home task": "Dorëzo detyrën për shtëpi",
  "Technical Recruiter": "Rekrutuese teknike",
  "Mobile Lead (interviewer)": "Udhëheqës i ekipit mobile (intervistues)",
  "People & Culture": "Burimet njerëzore",
  "Engineering Manager": "Menaxher i inxhinierisë",
};
