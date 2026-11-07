import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs, dayKey, formatDate, icsEscape, icsFold, monthGrid, nextEventByApplication, parseMonth, shiftMonth, whenLabel, type AppEvent } from "./events.ts";

const now = new Date("2026-11-07T10:00:00Z"); // 11:00 in Kosovo, Saturday

test("dayKey uses Kosovo time", () => {
  assert.equal(dayKey(new Date("2026-11-07T23:30:00Z")), "2026-11-08"); // 00:30 next day in Prishtina
});

test("when labels", () => {
  const e = (iso: string, kind: AppEvent["kind"] = "interview", done = false) => ({ starts_at: iso, kind, done });
  assert.deepEqual(whenLabel(e("2026-11-07T13:00:00Z"), now), { text: "Today 14:00", urgent: true });
  assert.deepEqual(whenLabel(e("2026-11-08T09:00:00Z"), now), { text: "Tomorrow 10:00", urgent: false });
  assert.equal(whenLabel(e("2026-11-10T09:00:00Z"), now).text, "Tue 10:00");
  assert.equal(whenLabel(e("2026-11-20T09:00:00Z"), now).text, "20 Nov 10:00");
  assert.deepEqual(whenLabel(e("2026-11-05T09:00:00Z", "follow_up"), now), { text: "2 days overdue", urgent: true });
  assert.equal(whenLabel(e("2026-11-05T09:00:00Z", "follow_up", true), now).urgent, false);
  assert.equal(whenLabel(e("2026-11-08T09:00:00Z", "follow_up"), now).text, "Tomorrow"); // follow-ups have no time
});

test("next event per application: overdue follow-ups first, else soonest", () => {
  const base = { duration_minutes: 60, location: null, notes: null, title: "x" };
  const events: AppEvent[] = [
    { ...base, id: "1", application_id: "a", kind: "interview", starts_at: "2026-11-12T09:00:00Z", done: false },
    { ...base, id: "2", application_id: "a", kind: "follow_up", starts_at: "2026-11-05T09:00:00Z", done: false },
    { ...base, id: "3", application_id: "b", kind: "interview", starts_at: "2026-11-20T09:00:00Z", done: false },
    { ...base, id: "4", application_id: "b", kind: "interview", starts_at: "2026-11-09T09:00:00Z", done: false },
    { ...base, id: "5", application_id: "c", kind: "interview", starts_at: "2026-11-08T09:00:00Z", done: true },
  ];
  const next = nextEventByApplication(events, now);
  assert.equal(next.a.id, "2");
  assert.equal(next.b.id, "4");
  assert.equal(next.c, undefined);
});

test("month grid starts on Monday and covers the month", () => {
  const weeks = monthGrid(2026, 11); // November 2026 starts on a Sunday
  assert.equal(weeks[0][0], "2026-10-26");
  assert.equal(weeks[0][6], "2026-11-01");
  assert.equal(weeks.at(-1)!.includes("2026-11-30"), true);
  assert.ok(weeks.every((w) => w.length === 7));
  assert.deepEqual(parseMonth("2026-02"), { year: 2026, month: 2 });
  assert.deepEqual(parseMonth("2026-13", now), { year: 2026, month: 11 });
  assert.equal(shiftMonth({ year: 2026, month: 12 }, 1), "2027-01");
  assert.equal(shiftMonth({ year: 2026, month: 1 }, -1), "2025-12");
});

test("ics escaping and folding", () => {
  assert.equal(icsEscape("Call; bring CV, notes\nline 2"), "Call\\; bring CV\\, notes\\nline 2");
  const long = "DESCRIPTION:" + "ë".repeat(60);
  const folded = icsFold(long);
  assert.ok(folded.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
  assert.equal(folded.replace(/\r\n /g, ""), long);
});

test("ics file", () => {
  const ics = buildIcs(
    [{ id: "e1", title: "Interview — Orbitly, React Native", starts_at: "2026-11-09T09:00:00Z", duration_minutes: 45, location: "https://meet.example/abc", description: "Bring portfolio" }],
    now
  );
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20261109T090000Z\r\n/);
  assert.match(ics, /DTEND:20261109T094500Z\r\n/);
  assert.match(ics, /SUMMARY:Interview — Orbitly\\, React Native/);
  assert.match(ics, /TRIGGER:-PT1H/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test("dates and when labels in Albanian, built without locale data", () => {
  const d = new Date("2026-11-07T13:30:00Z"); // Saturday 14:30 in Prishtina
  assert.equal(formatDate(d, "en", { weekday: true, day: true, month: "short" }), "Sat 7 Nov");
  assert.equal(formatDate(d, "sq", { weekday: true, day: true, month: "short" }), "Sht 7 nën");
  assert.equal(formatDate(d, "sq", { month: "long", year: true }), "nëntor 2026");
  assert.equal(formatDate(d, "sq", { day: true, month: "short", time: true }), "7 nën, 14:30");
  const e = (iso: string, kind: AppEvent["kind"] = "interview") => ({ starts_at: iso, kind, done: false });
  assert.equal(whenLabel(e("2026-11-08T09:00:00Z"), now, "sq").text, "Nesër 10:00");
  assert.equal(whenLabel(e("2026-11-10T09:00:00Z"), now, "sq").text, "Mar 10:00");
  assert.equal(whenLabel(e("2026-11-05T09:00:00Z", "follow_up"), now, "sq").text, "2 ditë vonesë");
});
