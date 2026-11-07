import { test } from "node:test";
import assert from "node:assert/strict";
import { funnel, goalProgress, responseTimes, topMissingSkills, weekStart, weeklySent } from "./insights.ts";

const now = new Date("2026-11-07T10:00:00Z"); // Saturday; week starts Mon 2 Nov
const app = (id: string, status: string, applied_at: string | null, created_at = "2026-10-01T09:00:00Z") => ({ id, status: status as never, applied_at, created_at });

test("weeks start on Monday", () => {
  assert.equal(weekStart("2026-11-07"), "2026-11-02");
  assert.equal(weekStart("2026-11-02"), "2026-11-02");
  assert.equal(weekStart("2026-11-01"), "2026-10-26"); // Sunday belongs to the week before
});

test("funnel counts stages ever reached, not just current ones", () => {
  const apps = [
    app("a", "saved", null),
    app("b", "applied", "2026-10-10"),
    app("c", "rejected", "2026-10-05"), // rejected after an interview
    app("d", "offer", "2026-10-01"),
  ];
  const history = [{ application_id: "c", to_status: "interview" as const, created_at: "2026-10-12T09:00:00Z" }];
  const f = funnel(apps, history);
  assert.deepEqual(
    f.map((s) => [s.status, s.count]),
    [["saved", 4], ["applied", 3], ["interview", 2], ["offer", 1]]
  );
  assert.equal(f[1].pctOfPrevious, 75);
  assert.equal(f[2].pctOfPrevious, 67);
  assert.equal(f[3].pctOfTotal, 25);
  assert.equal(funnel([], [])[1].pctOfPrevious, 0);
});

test("weekly sent counts by Monday-start week", () => {
  const apps = [app("a", "applied", "2026-11-02"), app("b", "applied", "2026-11-07"), app("c", "applied", "2026-10-30"), app("d", "saved", null)];
  const w = weeklySent(apps, 3, now);
  assert.deepEqual(w, [
    { week: "2026-10-19", count: 0 },
    { week: "2026-10-26", count: 1 },
    { week: "2026-11-02", count: 2 },
  ]);
});

test("response time: first reply after sending", () => {
  const apps = [app("a", "interview", "2026-10-01"), app("b", "rejected", "2026-10-10"), app("c", "applied", "2026-10-20")];
  const history = [
    { application_id: "a", to_status: "interview" as const, created_at: "2026-10-05T09:00:00Z" },
    { application_id: "a", to_status: "offer" as const, created_at: "2026-10-20T09:00:00Z" },
    { application_id: "b", to_status: "rejected" as const, created_at: "2026-10-20T09:00:00Z" },
  ];
  assert.deepEqual(responseTimes(apps, history), { replies: 2, median: 7, average: 7, fastest: 4, slowest: 10 });
  assert.equal(responseTimes([], []).median, null);
});

test("weekly goal and streak", () => {
  const apps = [
    // two weeks ago: 2, last week: 2, this week: 1
    app("a", "applied", "2026-10-20"), app("b", "applied", "2026-10-22"),
    app("c", "applied", "2026-10-27"), app("d", "applied", "2026-10-29"),
    app("e", "applied", "2026-11-03"),
  ];
  assert.deepEqual(goalProgress(apps, 2, now), { goal: 2, thisWeek: 1, remaining: 1, pct: 50, streak: 2 });
  assert.equal(goalProgress(apps, 1, now).streak, 3); // this week counts once the goal is met
  assert.equal(goalProgress(apps, 3, now).streak, 0);
});

test("top missing skills: counted once per job, case-insensitive", () => {
  const top = topMissingSkills([
    { missing_keywords: ["Docker", "Kotlin", "docker"] },
    { missing_keywords: ["docker", "GraphQL"] },
    { missing_keywords: ["Kotlin"] },
    {},
  ]);
  assert.deepEqual(top, [
    { label: "Docker", count: 2 },
    { label: "Kotlin", count: 2 },
    { label: "GraphQL", count: 1 },
  ]);
});
