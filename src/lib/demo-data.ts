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

Requirements
- JavaScript, Node.js and Express
- React
- PostgreSQL and SQL
- HTML and CSS

Nice to have
- Next.js
- Docker
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
  { company: "Tessera", position: "QA Automation Intern", status: "applied", location: "Mitrovica", daysAgo: 6, appliedDaysAgo: 5 },
  { company: "Lumen Apps", position: "Frontend Engineer", status: "applied", location: "Remote", salary_range: "€900–1,200", daysAgo: 4, appliedDaysAgo: 3 },
  { company: "Orbitly", position: "React Native Developer", status: "interview", location: "Remote", salary_range: "€1,200–1,600", job_description: RN_POST, daysAgo: 20, appliedDaysAgo: 18, notes: "Technical interview on Thursday — review hooks, Expo Router and Supabase RLS." },
  { company: "Deltaworks", position: "Junior Backend Developer", status: "interview", location: "Prishtina", daysAgo: 25, appliedDaysAgo: 22, notes: "Take-home task submitted. Final round with the CTO." },
  { company: "Pixelforge", position: "Full-Stack Intern", status: "offer", location: "Prishtina", salary_range: "€700 / month", job_description: FULLSTACK_POST, daysAgo: 30, appliedDaysAgo: 28, notes: "Offer received — reply by Friday. 🎉" },
  { company: "Bluepeak Agency", position: "Web Developer", status: "rejected", location: "Mitrovica", daysAgo: 35, appliedDaysAgo: 33, notes: "Asked for more backend experience — building it now." },
  { company: "Sigma Fintech", position: "Graduate Developer", status: "rejected", location: "Tirana", daysAgo: 40, appliedDaysAgo: 38 },
];
