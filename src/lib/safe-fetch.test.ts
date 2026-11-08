// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { FetchError, isPrivateAddress, parsePublicUrl } from "./safe-fetch.ts";

test("private, loopback, link-local and reserved addresses are blocked", () => {
  for (const ip of [
    "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.10", "169.254.169.254", "100.64.0.1", "0.0.0.0",
    "224.0.0.1", "255.255.255.255", "::1", "::", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.0.0.1", "64:ff9b::a00:1", "not-an-ip",
  ]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
});

test("public addresses are allowed", () => {
  for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "93.184.216.34", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) {
    assert.equal(isPrivateAddress(ip), false, ip);
  }
});

test("parsePublicUrl normalises links and rejects unsafe ones", () => {
  assert.equal(parsePublicUrl("jobs.example.com/frontend").toString(), "https://jobs.example.com/frontend");
  assert.equal(parsePublicUrl("  http://example.com/x?y=1 ").toString(), "http://example.com/x?y=1");
  const code = (input: string) => {
    try {
      parsePublicUrl(input);
      return "ok";
    } catch (e) {
      return e instanceof FetchError ? e.code : "other";
    }
  };
  assert.equal(code("file:///etc/passwd"), "invalid");
  assert.equal(code("javascript:alert(1)"), "invalid");
  assert.equal(code("ftp://example.com"), "invalid");
  assert.equal(code("https://user:pass@example.com"), "invalid");
  assert.equal(code("https://example.com:8080/"), "blocked");
  assert.equal(code("http://localhost/admin"), "blocked");
  assert.equal(code("http://printer.local/"), "blocked");
  assert.equal(code("not a link"), "invalid");
  assert.equal(code("https://example.com:443/ok"), "ok");
});
