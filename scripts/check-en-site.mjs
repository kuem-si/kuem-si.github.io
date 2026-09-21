import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../dist/", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const visibleText = (html) =>
  html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const pages = [];
function walk(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) walk(path);
    else if (item.name.endsWith(".html")) pages.push(path);
  }
}
walk(fileURLToPath(root));
const bad = [
  "Somobor",
  "How it works zaznava",
  "Analyses available context",
  "Problem Path Outcome",
  "Verified content in preparation",
  "Without a configured production endpoint",
  "The controller must approve",
  "Overview vodomerov",
  "Mobilnost",
  "Different expertise. One team.",
  "A project does not travel between disconnected contractors.",
  "Read the story",
  "View a use case",
];
const redesigned = [
  "",
  "solutions",
  "nexavia",
  "industries",
  "company",
  "contact",
  "kai",
  "references",
  "privacy",
];
for (const page of redesigned) {
  const html = read(`en/${page ? page + "/" : ""}index.html`);
  const text = visibleText(html);
  for (const phrase of bad)
    assert(!text.includes(phrase), `${page}: ${phrase}`);
  assert.match(html, /<html[^>]*lang="en"/);
  assert.match(text, /SL \| EN/);
}
for (const slug of ["remote-meter-reading", "traffic-and-mobility"]) {
  const text = visibleText(read(`en/solutions/${slug}/index.html`));
  assert.equal(text.split("What the solution covers").length - 1, 1, slug);
}
assert.match(
  visibleText(read("en/index.html")),
  /Approximately 1,000 gas meters/,
);
assert.match(visibleText(read("en/index.html")), /4,000 LoRaWAN adapters/);
assert.match(visibleText(read("en/industries/index.html")), /12,480/);
assert.match(visibleText(read("en/industries/index.html")), /1,124/);
assert.match(visibleText(read("en/nexavia/index.html")), /1,248/);
const redirects = {
  about: "company",
  services: "solutions",
  "services/software-development": "solutions",
  "services/software-architecture-and-consulting": "solutions",
  "services/devops-and-platform-engineering": "solutions",
  "solutions/nexavia": "nexavia",
  "solutions/nexavia/nexavia-enterprise": "nexavia",
  "nexavia-platform": "nexavia",
  "platform/nexavia": "nexavia",
  "case-studies": "references",
};
const sitemap = read("sitemap-0.xml");
for (const [source, target] of Object.entries(redirects)) {
  const html = read(`en/${source}/index.html`);
  assert(html.includes(`content="0;url=/en/${target}/"`), source);
  assert(html.includes(`href="https://www.kuem.si/en/${target}/"`), source);
  assert(html.includes('content="noindex,follow"'), source);
  assert(
    !sitemap.includes(`<loc>https://www.kuem.si/en/${source}/</loc>`),
    source,
  );
}
let links = 0;
for (const page of pages) {
  const html = readFileSync(page, "utf8");
  for (const match of html.matchAll(/<a\b[^>]*\bhref="(\/[^"]*)"/g)) {
    const url = new URL(match[1], "https://www.kuem.si");
    if (url.hostname !== "www.kuem.si") continue;
    const path = new URL("." + decodeURIComponent(url.pathname), root);
    assert(
      existsSync(path) ||
        existsSync(new URL(path.href.replace(/\/?$/, "/") + "index.html")),
      `${page}: ${match[1]}`,
    );
    links++;
  }
}
console.log(
  `EN QA passed: ${redesigned.length} core pages, 2 coverage sections, ${Object.keys(redirects).length} redirects, ${links} internal links.`,
);
