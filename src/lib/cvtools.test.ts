// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { bestNextSkills, cleanPdfText, coverLetter, findProject, LETTER_TEMPLATES, nameFromCv, rankJobs } from "./cvtools.ts";
import { DEMO_CV } from "./demo-data.ts";

const POST = (skills: string, extra = "") =>
  `About the role\nYou will build product features with our team, ship code every week and work closely with designers and other engineers on a modern stack.\n\nRequirements\n${skills}\n${extra}`;

const jobs = [
  { id: "a", company: "Northwind", position: "Frontend Developer", status: "saved", job_description: POST("- React, TypeScript and Next.js\n- Tailwind CSS", "Nice to have\n- GraphQL") },
  { id: "b", company: "Kodra", position: ".NET Developer", status: "applied", job_description: POST("- C# and .NET\n- SQL Server, Docker\n- Azure") },
  { id: "c", company: "Short", position: "Anything", status: "saved", job_description: "React developer wanted." },
  { id: "d", company: "Empty", position: "Anything", status: "saved", job_description: null },
];

test("cleanPdfText tidies spacing, hyphenation and junk characters", () => {
  const { text, truncated } = cleanPdfText("Arianit   Xhafa \r\n\r\n\r\n\r\nFull-stack develop-\nment­ with React\u0007\n");
  assert.equal(text, "Arianit Xhafa\n\nFull-stack development with React");
  assert.equal(truncated, false);
  assert.equal(
    cleanPdfText("SKILLS\nReact, SQL,\nDocker\nRentigo — REST API, admin dashboard and\nbookings.\nEDUCATION\nBSc").text,
    "SKILLS\nReact, SQL, Docker\nRentigo — REST API, admin dashboard and bookings.\nEDUCATION\nBSc",
  );
  assert.equal(cleanPdfText("x".repeat(25000)).truncated, true);
  assert.equal(cleanPdfText("x".repeat(25000)).text.length, 20000);
});

test("rankJobs scores only jobs with a real post, best match first", () => {
  const ranked = rankJobs(DEMO_CV, jobs);
  assert.deepEqual(ranked.map((r) => r.job.id), ["a", "b"]);
  assert.ok(ranked[0].match.score > ranked[1].match.score);
});

test("bestNextSkills ranks the skills that add the most points", () => {
  const ranked = rankJobs(DEMO_CV, jobs);
  const next = bestNextSkills(DEMO_CV, ranked);
  assert.ok(next.length > 0);
  for (const n of next) assert.ok(n.gain > 0 && n.jobs >= 1);
  // .NET-only skills are missing from the demo CV, so they must show up.
  assert.ok(next.some((n) => n.skill === "C#" || n.skill === ".NET"));
  assert.ok(!next.some((n) => n.skill === "React"));
});

test("nameFromCv reads the name from the first line only when it looks like one", () => {
  assert.equal(nameFromCv("Arianit Xhafa — Software Developer\nSkills"), "Arianit Xhafa");
  assert.equal(nameFromCv("\n  Demo Pilot | Developer"), "Demo Pilot");
  assert.equal(nameFromCv("CURRICULUM VITAE 2026"), null);
  assert.equal(nameFromCv("developer with five years of experience"), null);
});

test("findProject picks the project line that uses most of the job's skills", () => {
  assert.deepEqual(findProject(DEMO_CV, ["Next.js", "TypeScript", "PostgreSQL"]), {
    title: "Invoicing SaaS",
    skills: ["TypeScript", "Next.js", "PostgreSQL"],
  });
  const inline = "Me\nProjects: Rentigo (Node.js, SQLite, REST API), TrimTime (React Native, Expo, Supabase).";
  assert.equal(findProject(inline, ["Expo", "Supabase"])?.title, "TrimTime");
  assert.equal(findProject(inline, ["Rust"]), null);
});

test("coverLetter fills every template in both languages", () => {
  const input = { company: "Northwind", position: "Frontend Developer", cv: DEMO_CV, jobPost: jobs[0].job_description! };
  for (const lang of ["en", "sq"] as const) {
    for (const template of LETTER_TEMPLATES) {
      const letter = coverLetter(template, input, lang);
      assert.match(letter, /Frontend Developer/);
      assert.match(letter, /Demo Pilot$/);
      assert.match(letter, /TypeScript|React|Next\.js/);
      assert.doesNotMatch(letter, /undefined|null|\$\{/);
    }
  }
  assert.match(coverLetter("formal", input, "en"), /“Invoicing SaaS”/);
  assert.match(coverLetter("formal", input, "sq"), /„Invoicing SaaS“/);
  assert.match(coverLetter("formal", input, "en"), /^Dear Northwind Hiring Team,/);
});

test("coverLetter falls back to placeholders when the CV says little", () => {
  const letter = coverLetter("formal", { company: "Acme", position: "Intern", cv: "cv text without skills", jobPost: jobs[1].job_description! }, "en");
  assert.match(letter, /\[Describe one project/);
  assert.match(letter, /\[Your name\]$/);
  assert.match(letter, /I am also learning/);
});
