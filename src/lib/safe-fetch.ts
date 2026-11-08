// Fetches a public web page for "Import from link". The URL comes from the user, so this guards against
// server-side request forgery: http(s) on standard ports only, no credentials in the URL, every host (and every
// redirect) must resolve to public addresses only, plus a time limit and a size cap.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type FetchErrorCode = "invalid" | "blocked" | "failed" | "not_html" | "too_large";
export class FetchError extends Error {
  code: FetchErrorCode;
  constructor(code: FetchErrorCode) {
    super(code);
    this.code = code;
  }
}

const v4ToInt = (ip: string) => ip.split(".").reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
const inV4 = (ip: string, base: string, bits: number) => {
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (v4ToInt(ip) & mask) === (v4ToInt(base) & mask);
};
const PRIVATE_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

/** True for loopback, private, link-local, CGNAT, documentation, multicast and reserved addresses (v4 and v6). */
export function isPrivateAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return PRIVATE_V4.some(([base, bits]) => inV4(ip, base, bits));
  if (kind !== 6) return true;
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^(?:0*:)*:?ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1] ?? lower.match(/^::(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mapped) return isPrivateAddress(mapped);
  if (lower === "::" || lower === "::1") return true;
  const first = parseInt(lower.split(":")[0] || "0", 16);
  return (
    (first & 0xfe00) === 0xfc00 || // fc00::/7 unique local
    (first & 0xffc0) === 0xfe80 || // fe80::/10 link-local
    (first & 0xff00) === 0xff00 || // ff00::/8 multicast
    lower.startsWith("64:ff9b:") || // NAT64
    lower.startsWith("2001:db8:") // documentation
  );
}

/** Normalises user input into an http(s) URL, or throws FetchError("invalid"). */
export function parsePublicUrl(input: string): URL {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new FetchError("invalid");
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password) throw new FetchError("invalid");
  if (url.port && url.port !== "80" && url.port !== "443") throw new FetchError("blocked");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (/^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host)) throw new FetchError("blocked");
  if (!host.includes(".") && !isIP(host)) throw new FetchError("invalid");
  return url;
}

async function assertPublicHost(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true }).catch(() => [])).map((a) => a.address);
  if (!addresses.length) throw new FetchError("failed");
  if (addresses.some(isPrivateAddress)) throw new FetchError("blocked");
}

export async function fetchPublicHtml(
  input: string,
  { timeoutMs = 9000, maxBytes = 3_000_000, maxRedirects = 4, json = false }: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number; json?: boolean } = {},
) {
  let url = parsePublicUrl(input);
  const signal = AbortSignal.timeout(timeoutMs);
  for (let hop = 0; ; hop++) {
    await assertPublicHost(url);
    let res: Response;
    try {
      res = await fetch(url, {
        redirect: "manual",
        signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CareerPilot/1.0; job import)",
          Accept: json ? "application/json" : "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "en,sq;q=0.8",
        },
      });
    } catch {
      throw new FetchError("failed");
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      if (hop >= maxRedirects) throw new FetchError("failed");
      await res.body?.cancel();
      try {
        url = parsePublicUrl(new URL(res.headers.get("location")!, url).toString());
      } catch {
        throw new FetchError("blocked");
      }
      continue;
    }
    if (!res.ok) {
      await res.body?.cancel();
      throw new FetchError("failed");
    }
    const type = res.headers.get("content-type") ?? "";
    if (type && !(json ? /json/i : /html|xml/i).test(type)) {
      await res.body?.cancel();
      throw new FetchError("not_html");
    }
    // Read at most maxBytes; job pages are well under that.
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new FetchError("too_large");
      }
      chunks.push(value);
    }
    const charset = type.match(/charset=([\w-]+)/i)?.[1] ?? "utf-8";
    let decoder: TextDecoder;
    try {
      decoder = new TextDecoder(charset);
    } catch {
      decoder = new TextDecoder("utf-8");
    }
    return { html: decoder.decode(Buffer.concat(chunks)), url: url.toString() };
  }
}
