// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { applicationsCsv, csvCell, toCsv } from "./csv.ts";

test("csvCell quotes, escapes and neutralises formulas", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(83), "83");
  assert.equal(csvCell(-5), "-5");
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("line1\nline2"), '"line1\nline2"');
  assert.equal(csvCell("=HYPERLINK(\"http://evil\")"), '"\'=HYPERLINK(""http://evil"")"');
  assert.equal(csvCell("+381 44"), "'+381 44");
  assert.equal(csvCell("@SUM(A1)"), "'@SUM(A1)");
  assert.equal(csvCell("-2+3"), "'-2+3");
  assert.equal(csvCell(" padded"), '" padded"');
});

test("toCsv adds a BOM and CRLF line endings", () => {
  assert.equal(toCsv([["a", "b"], [1, null]]), "﻿a,b\r\n1,\r\n");
});

test("applicationsCsv writes one row per application with labels, dates and scores", () => {
  const csv = applicationsCsv(
    [
      {
        id: "1", company: "Orbitly", position: "React Native Developer", status: "interview", location: "Remote",
        salary_range: "€1,200–1,600", job_url: "https://orbitly.test/jobs/1", notes: "Review hooks, then =SUM",
        applied_at: "2026-10-20", created_at: "2026-10-18T22:30:00Z", updated_at: "2026-11-07T10:00:00Z",
      },
      {
        id: "2", company: "Kodra", position: "Dev", status: "saved", location: null, salary_range: null, job_url: null, notes: null,
        applied_at: null, created_at: "2026-11-01T09:00:00Z", updated_at: "2026-11-01T09:00:00Z",
      },
    ],
    { "1": 83 },
    { headers: ["Kompania", "Pozita", "Faza", "Vendndodhja", "Paga", "Linku", "Aplikuar", "Shtuar", "Përditësuar", "Pikët", "Shënime"], status: { interview: "Intervistë", saved: "Ruajtur" } },
  );
  const lines = csv.slice(1).trim().split("\r\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[0], "Kompania,Pozita,Faza,Vendndodhja,Paga,Linku,Aplikuar,Shtuar,Përditësuar,Pikët,Shënime");
  // 22:30 UTC on 18 Oct is already 19 Oct in Kosovo.
  assert.equal(lines[1], 'Orbitly,React Native Developer,Intervistë,Remote,"€1,200–1,600",https://orbitly.test/jobs/1,2026-10-20,2026-10-19,2026-11-07,83,"Review hooks, then =SUM"');
  assert.equal(lines[2], "Kodra,Dev,Ruajtur,,,,,2026-11-01,2026-11-01,,");
});
