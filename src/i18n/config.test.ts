import { test } from "node:test";
import assert from "node:assert/strict";
import { pickLocale } from "./config.ts";

test("picks the visitor's language from Accept-Language", () => {
  assert.equal(pickLocale("sq-AL,sq;q=0.9,en;q=0.8"), "sq");
  assert.equal(pickLocale("en-US,en;q=0.9,sq;q=0.8"), "en");
  assert.equal(pickLocale("de-DE,sq;q=0.7,en;q=0.5"), "sq"); // first supported by weight
  assert.equal(pickLocale("de-DE,fr;q=0.8"), "en"); // fallback
  assert.equal(pickLocale(null), "en");
  assert.equal(pickLocale("en;q=0.2,sq;q=0.9"), "sq");
});
