// Run with: npm test  (Node's built-in test runner; Node strips the types)
import { test } from "node:test";
import assert from "node:assert/strict";
import { findSkills, matchCvToJob, splitJobPost } from "./matcher.ts";

const CV = `Arianit Xhafa — Software Developer
Projects: Rentigo (Node.js, SQLite, JavaScript, REST API), TrimTime (React Native, Expo, TypeScript, Supabase, PostgreSQL).
Skills: Git, Java, C#, HTML, CSS. Languages: English (B2).`;

const JOB = `Junior React Native Developer

Requirements:
- 1+ years with React Native and TypeScript
- Experience consuming REST APIs
- Git and unit testing with Jest

Nice to have:
- Expo
- Firebase
- CI/CD with GitHub Actions`;

test("finds skills by alias, case-insensitively", () => {
  const found = findSkills("We use NodeJS, Postgres and C# with .NET; testing with Jest.");
  for (const s of ["Node.js", "PostgreSQL", "C#", ".NET", "Unit testing"]) assert.ok(found.has(s), s);
});

test("does not match skills inside other words or common phrases", () => {
  const found = findSkills("Please express interest. The rest of the team is great. Javascripting is not a word.");
  assert.ok(!found.has("Express"));
  assert.ok(!found.has("REST APIs"));
  assert.ok(!found.has("JavaScript"));
  assert.ok(!found.has("Java"));
});

test("separates nice-to-have section from requirements", () => {
  const { requiredText, optionalText } = splitJobPost(JOB);
  assert.ok(requiredText.includes("React Native"));
  assert.ok(!requiredText.includes("Firebase"));
  assert.ok(optionalText.includes("Firebase"));
});

test("scores required skills at full weight and nice-to-haves at half", () => {
  const result = matchCvToJob(CV, JOB);
  // Required: React Native, TypeScript, REST APIs, Git, Unit testing (4 of 5 in CV).
  // Nice to have: Expo (in CV), Firebase, CI/CD, plus "Git" already counted as required.
  assert.equal(result.mode, "basic");
  assert.ok(result.missing_keywords.includes("Unit testing"));
  assert.ok(result.missing_keywords.includes("Firebase"));
  assert.ok(!result.missing_keywords.includes("React Native"));
  assert.equal(result.missing_keywords[0], "Unit testing", "missing requirements come first");
  assert.ok(result.score >= 60 && result.score <= 80, `score ${result.score}`);
  assert.ok(result.suggestions.some((s) => s.includes("1+ year")));
});

test("does not credit plain React when the job only asks for React Native", () => {
  const result = matchCvToJob("Vue developer", "Requirements: React Native, TypeScript, Redux, Jest");
  assert.ok(!result.missing_keywords.includes("React"));
  assert.ok(result.missing_keywords.includes("React Native"));
});

test("handles a job post with no recognisable skills", () => {
  const result = matchCvToJob(CV, "We are a friendly team looking for a motivated person to join us.");
  assert.equal(result.score, 0);
  assert.equal(result.detected, 0);
  assert.match(result.verdict, /rough guide/);
});
