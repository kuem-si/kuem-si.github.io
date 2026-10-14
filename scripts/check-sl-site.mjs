import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import {
  checkPages,
  dist,
  htmlFiles,
  read,
  visibleText,
} from "./site-files.mjs";
import { loadSiteData } from "./site-data.mjs";

const bad = [
  "Obrazec brez nastavljenega produkcijskega priključka podatkov ne pošlje",
  "Končno pravno besedilo mora pred objavo potrditi upravljavec",
  "Preverjena vsebina v pripravi",
  "Primeri izvedb bodo objavljeni po preverjanju dejstev",
  "Ne objavljamo neodobrenih imen",
  "Works with Nexavia",
];
let pages = 0;
for (const file of htmlFiles()) {
  const path = relative(dist, file).replaceAll("\\", "/");
  if (path.startsWith("en/") || path.startsWith("de/")) continue;
  const html = readFileSync(file, "utf8");
  const text = visibleText(html);
  for (const phrase of bad)
    assert(!text.includes(phrase), `${path}: ${phrase}`);
  pages++;
}
const { routePairs, localizedPath } = await loadSiteData("../src/lib/i18n.ts");
const sitemap = read("sitemap-0.xml");
for (const sl of Object.keys(routePairs)) {
  const versions = ["sl", "en", "de"].map((lang) => [
    lang,
    localizedPath(sl, lang),
  ]);
  for (const [lang, path] of versions) {
    const html = read(
      `${path.replace(/^\//, "").replace(/\/$/, "")}${path === "/" ? "" : "/"}index.html`,
    );
    assert.match(html, new RegExp(`<html[^>]*lang="${lang}(?:-[A-Za-z]+)?"`));
    const canonicalPath = path.endsWith("/") ? path : `${path}/`;
    assert(
      sitemap.includes(`<loc>https://www.kuem.si${canonicalPath}</loc>`),
      `${path}: current route missing from sitemap`,
    );
    const switches = [
      ...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>\s*(SL|EN|DE)\s*<\/a>/g),
    ].map(([, href]) => href.replace(/\/$/, "") || "/");
    for (const [other, target] of versions) {
      if (other === lang) continue;
      assert(
        switches.includes(target.replace(/\/$/, "") || "/"),
        `${path}: language switch to ${other}`,
      );
    }
  }
}
for (const path of [
  "zasebnost",
  "reference",
  "en/privacy",
  "en/references",
  "de/datenschutz",
  "de/referenzen",
]) {
  assert(
    !read(`${path}/index.html`).includes('class="data-visual"'),
    `${path}: generic visual`,
  );
}
const { successStories, publishedSuccessStories } = await loadSiteData(
  "../src/data/successStories.ts",
);
assert(publishedSuccessStories.length >= 1, "No published stories");
for (const [path, locale] of [
  ["reference", "sl"],
  ["en/references", "en"],
  ["de/referenzen", "de"],
]) {
  const html = read(`${path}/index.html`);
  assert.equal(
    [...html.matchAll(/data-success-story=/g)].length,
    publishedSuccessStories.length,
  );
  for (const story of successStories) {
    assert.equal(
      html.includes(`data-success-story="${story.slug}"`),
      story.published,
      story.slug,
    );
    if (story.published)
      assert(visibleText(html).includes(story.summary[locale]), story.slug);
  }
}
// Until a completed individual story route exists, these labels must not be links.
for (const file of htmlFiles()) {
  const html = readFileSync(file, "utf8");
  for (const [, href, body] of html.matchAll(
    /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g,
  )) {
    const label = visibleText(body);
    assert(
      !/Preberite zgodbo|Read the story/i.test(label),
      `${file}: unavailable individual story ${href}`,
    );
    if (
      /Poglejte uspešne zgodbe|Oglejte si uspešne zgodbe|View success stories|Erfolgsgeschichten ansehen/i.test(
        label,
      )
    ) {
      assert(
        ["/reference/", "/en/references/", "/de/referenzen/"].includes(href),
        `${file}: overview CTA ${href}`,
      );
    }
    if (/Poglejte primer uporabe|View a use case/i.test(label)) {
      assert(
        /^\/(?:resitve|en\/solutions)\/[^/]+\/?$/.test(href),
        `${file}: use-case CTA ${href}`,
      );
    }
  }
}
const kai = visibleText(read("kai/index.html"));
for (const path of ["resitve", "en/solutions", "de/loesungen"]) {
  const svg = read(`${path}/index.html`).match(
    /<svg\b[^>]*class="wires"[^>]*>/,
  )?.[0];
  assert(
    svg && /data-astro-cid-/.test(svg),
    `${path}: SVG optimizer removed scoped CSS attributes`,
  );
}
assert(kai.includes("Kako KAI deluje") && kai.includes("Deluje z Nexavio"));
assert(!kai.includes("Funkcija je vezana na razpoložljive podatke"));
checkPages();
console.log(
  `SL QA passed: ${pages} pages, ${Object.keys(routePairs).length} language pairs, ${publishedSuccessStories.length} trilingual stories, truthful CTAs, no redirect stubs.`,
);
