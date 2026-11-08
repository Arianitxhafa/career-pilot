// Run with: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeEntities, greenhouseApiUrl, htmlToText, parseGreenhouseJob, parseJobPage, splitTitle } from "./jobimport.ts";

const ld = (obj: unknown, attrs = 'type="application/ld+json"') => `<script ${attrs}>${JSON.stringify(obj)}</script>`;
const page = (head: string, body = "<p>page</p>") => `<!doctype html><html><head><title>Ignored title</title>${head}</head><body>${body}</body></html>`;

test("reads a full schema.org JobPosting", () => {
  const html = page(
    ld({
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: "Junior Frontend Developer",
      hiringOrganization: { "@type": "Organization", name: "Northwind Labs" },
      jobLocation: { "@type": "Place", address: { addressLocality: "Prishtina", addressRegion: "Prishtina", addressCountry: "XK" } },
      baseSalary: { "@type": "MonetaryAmount", currency: "EUR", value: { "@type": "QuantitativeValue", minValue: 900, maxValue: 1200, unitText: "MONTH" } },
      description: "<p>You&#39;ll build features.</p><h3>Requirements</h3><ul><li>React &amp; TypeScript</li><li>Git</li></ul>",
    }),
  );
  assert.deepEqual(parseJobPage(html, "https://jobs.example.com/1"), {
    position: "Junior Frontend Developer",
    company: "Northwind Labs",
    location: "Prishtina, XK",
    salary_range: "€900–1,200 / month",
    job_description: "You'll build features.\n\nRequirements\n\n- React & TypeScript\n- Git",
    job_url: "https://jobs.example.com/1",
    source: "jsonld",
  });
});

test("finds JobPosting inside @graph and arrays, with remote work and double-encoded HTML", () => {
  const html = page(
    ld({ "@context": "https://schema.org", "@graph": [{ "@type": "WebPage", name: "x" }, { "@type": ["JobPosting"], title: "QA &amp; Automation Intern", hiringOrganization: "Tessera", jobLocationType: "TELECOMMUTE", description: "&lt;p&gt;Write tests&lt;/p&gt;&lt;p&gt;Ship&amp;nbsp;fast&lt;/p&gt;" }] }),
  );
  const job = parseJobPage(html, "https://x.test/j")!;
  assert.equal(job.position, "QA & Automation Intern");
  assert.equal(job.company, "Tessera");
  assert.equal(job.location, "Remote");
  assert.equal(job.job_description, "Write tests\n\nShip fast");
});

test("salary variants", () => {
  const sal = (baseSalary: unknown) => parseJobPage(page(ld({ "@type": "JobPosting", title: "Dev", baseSalary })), "https://x.test")!.salary_range;
  assert.equal(sal({ currency: "USD", value: { value: 55000, unitText: "YEAR" } }), "$55,000 / year");
  assert.equal(sal({ currency: "ALL", value: { minValue: "80000", maxValue: "120000", unitText: "MONTH" } }), "ALL 80,000–120,000 / month");
  assert.equal(sal({ currency: "EUR", value: { minValue: 0, maxValue: 0 } }), null);
  assert.equal(sal("€1,000 neto"), "€1,000 neto");
  assert.equal(sal(undefined), null);
});

test("skips broken JSON-LD and falls back to Open Graph tags", () => {
  const html = page(
    `<script type="application/ld+json">{ not json</script>
     <meta property="og:title" content="Frontend Developer at Lumen Apps | Lumen Careers">
     <meta property="og:site_name" content="Lumen Careers">
     <meta content="Build the web app our customers use every day &amp; more." property="og:description">`,
  );
  assert.deepEqual(parseJobPage(html, "https://lumen.test/jobs/7"), {
    position: "Frontend Developer",
    company: "Lumen Apps",
    location: null,
    salary_range: null,
    job_description: "Build the web app our customers use every day & more.",
    job_url: "https://lumen.test/jobs/7",
    source: "meta",
  });
});

test("splitTitle understands common title shapes", () => {
  assert.deepEqual(splitTitle("Northwind Labs hiring Frontend Developer in Prishtina, Kosovo | LinkedIn", null), {
    position: "Frontend Developer",
    company: "Northwind Labs",
    location: "Prishtina, Kosovo",
  });
  assert.deepEqual(splitTitle("Zhvillues Web - Kodra Studio | KosovaJob", null), { position: "Zhvillues Web", company: "Kodra Studio", location: null });
  assert.deepEqual(splitTitle("Backend Engineer", null), { position: "Backend Engineer", company: null, location: null });
});

test("returns null for pages with no job data at all", () => {
  assert.equal(parseJobPage("<html><body>hello</body></html>", "https://x.test"), null);
});

test("entities and HTML to text", () => {
  assert.equal(decodeEntities("Ç&#235;sht&euml; &#x20AC;5 &amp; &bogus;"), "Çështë €5 & &bogus;");
  assert.equal(htmlToText("<div>A<br>B</div><script>alert(1)</script><p>C D</p>"), "A\nB\n\nC D");
});

test("Greenhouse links map to the public Job Board API and parse its JSON", () => {
  assert.equal(
    greenhouseApiUrl("https://job-boards.greenhouse.io/vercel/jobs/6231864004?gh_src=x"),
    "https://boards-api.greenhouse.io/v1/boards/vercel/jobs/6231864004?pay_transparency=true",
  );
  assert.equal(greenhouseApiUrl("https://example.com/vercel/jobs/1"), null);
  const job = parseGreenhouseJob(
    {
      title: "Frontend Engineer",
      company_name: "Vercel",
      location: { name: "Remote - Germany" },
      content: "&lt;p&gt;Build the &lt;b&gt;dashboard&lt;/b&gt;.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;React&lt;/li&gt;&lt;/ul&gt;",
      pay_input_ranges: [{ min_cents: 9000000, max_cents: 12000000, currency_type: "EUR" }],
    },
    "https://job-boards.greenhouse.io/vercel/jobs/1",
  );
  assert.deepEqual(job, {
    position: "Frontend Engineer",
    company: "Vercel",
    location: "Remote - Germany",
    salary_range: "€90,000–120,000",
    job_description: "Build the dashboard.\n\n- React",
    job_url: "https://job-boards.greenhouse.io/vercel/jobs/1",
    source: "jsonld",
  });
  assert.equal(parseGreenhouseJob({ error: "not found" }, "https://x.test"), null);
});

test("KosovaJob pages give company and city from their markup, and Albanian titles stay whole", () => {
  const html = page(
    `<meta property="og:title" content="Shitëse, Punëtor në Lokal"/><meta property="og:description" content="Fatlumi 91 shpallë konkurs për: Shitëse (2)"/>`,
    `<h1>Shitëse, Punëtor në Lokal</h1><span class="kj-jobhead__comp"><b class="x">Fatlumi 91</b></span><a class="inbJobCityName" href="/?cityID=18">Fushë Kosovë</a>`,
  );
  const job = parseJobPage(html, "https://kosovajob.com/fatlumi-91/shitese-punetor-ne-lokal")!;
  assert.equal(job.position, "Shitëse, Punëtor në Lokal");
  assert.equal(job.company, "Fatlumi 91");
  assert.equal(job.location, "Fushë Kosovë");
  assert.equal(job.job_description, "Fatlumi 91 shpallë konkurs për: Shitëse (2)");
  assert.deepEqual(splitTitle("Punëtor në Lokal", null), { position: "Punëtor në Lokal", company: null, location: null });
});
