import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSiteData } from "./site-data.mjs";

const { legacyEnglishRedirects } = await loadSiteData(
  "../src/data/legacyEnglishRedirects.ts",
);
const { legacySlovenianRedirects } = await loadSiteData(
  "../src/data/legacySlovenianRedirects.ts",
);
export const redirects = Object.fromEntries([
  ...Object.entries(legacyEnglishRedirects).map(([path, target]) => [
    `/en/${path}/`,
    target,
  ]),
  ...Object.entries(legacySlovenianRedirects).map(([path, target]) => [
    `/${path}/`,
    target,
  ]),
]);
export const dist = fileURLToPath(new URL("../dist/", import.meta.url));
export const read = (path) => readFileSync(join(dist, path), "utf8");
export function htmlFiles(directory = dist) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? htmlFiles(file)
      : file.endsWith(".html")
        ? [file]
        : [];
  });
}
export const visibleText = (html) =>
  html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function checkRedirects() {
  const sitemap = readdirSync(dist)
    .filter((file) => /^sitemap.*\.xml$/.test(file))
    .map(read)
    .join("");
  for (const [source, target] of Object.entries(redirects)) {
    assert(!redirects[target], `${source}: redirect chain to ${target}`);
    const html = read(`${source.slice(1)}index.html`);
    assert(html.includes(`content="0;url=${target}"`), `${source}: refresh`);
    assert(
      html.includes(`rel="canonical" href="https://www.kuem.si${target}"`),
      `${source}: canonical`,
    );
    assert(html.includes('content="noindex,follow"'), `${source}: robots`);
    assert(html.includes(`<a href="${target}"`), `${source}: fallback`);
    assert(
      !/<(?:header|main|nav|style)\b/.test(html) &&
        visibleText(html).length < 150,
      `${source}: non-minimal redirect`,
    );
    assert.match(html, /<!doctype html>/i, `${source}: complete document`);
    assert(
      !sitemap.includes(`https://www.kuem.si${source}"`) &&
        !sitemap.includes(`https://www.kuem.si${source}<`),
      `${source}: sitemap`,
    );
    const destination = read(`${target.slice(1)}index.html`);
    assert(
      destination.includes(
        `rel="canonical" href="https://www.kuem.si${target}"`,
      ),
      `${source}: target canonical`,
    );
    assert(
      !destination.includes('content="noindex'),
      `${source}: target indexability`,
    );
    assert(
      sitemap.includes(`<loc>https://www.kuem.si${target}</loc>`),
      `${source}: target missing from sitemap`,
    );
  }
  const unknown = "this-page-does-not-exist-12345";
  assert(
    !redirects[`/${unknown}/`] && !existsSync(join(dist, unknown)),
    "Catch-all emitted an unknown route",
  );
  const notFound = read("404.html");
  assert(
    notFound.includes('content="noindex') &&
      notFound.includes("The path ends here."),
    "Custom 404 is preserved",
  );
  assert(!/http-equiv="refresh"/.test(notFound), "404 must not redirect");
  for (const file of htmlFiles()) {
    const html = readFileSync(file, "utf8");
    for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const url = new URL(href, "https://www.kuem.si");
      if (url.origin !== "https://www.kuem.si") continue;
      const path = url.pathname.replace(/\/?$/, "/");
      assert(!redirects[path], `${file}: internal link to legacy ${href}`);
    }
  }
  return Object.keys(redirects).length;
}

export async function checkUnknownRoute(base) {
  for (const path of [
    "/this-page-does-not-exist-12345/",
    "/en/this-page-does-not-exist-12345/",
    "/resitve/this-page-does-not-exist-12345/",
  ]) {
    const response = await fetch(new URL(path, base), { redirect: "manual" });
    assert.equal(response.status, 404, `${path}: expected actual HTTP 404`);
    const html = await response.text();
    assert(
      html.includes("The path ends here.") &&
        !/http-equiv="refresh"/.test(html),
      `${path}: custom 404, not a redirect`,
    );
  }
  console.log(
    "HTTP 404 QA passed: unknown root, English and solution-detail URLs retain the custom 404.",
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(
    `Redirect QA passed: ${checkRedirects()} static redirects, canonical targets, sitemap and internal navigation.`,
  );
  if (process.argv[2]) await checkUnknownRoute(process.argv[2]);
}
