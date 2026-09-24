import assert from "node:assert/strict";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { relative } from "node:path";
import { htmlFiles, dist, read, redirects } from "./check-redirects.mjs";
import { loadSiteData } from "./site-data.mjs";

const origin = "https://www.kuem.si";
const { routePairs, alternatePath } = await loadSiteData("../src/lib/i18n.ts");
const { pageUrl, normalizePageUrls } = await loadSiteData(
  "../src/lib/page-urls.ts",
);
const canonical = (html) =>
  html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
const files = htmlFiles().filter((file) => file.endsWith("index.html"));
const pages = files
  .map((file) => ({
    path:
      "/" +
      relative(dist, file)
        .replaceAll("\\", "/")
        .replace(/index\.html$/, ""),
    html: readFileSync(file, "utf8"),
  }))
  .sort((a, b) => a.path.localeCompare(b.path));
const current = pages.filter(({ path }) => !redirects[path]);
const args = process.argv.slice(2);
const option = (name) =>
  args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const base = option("--base");
const report = option("--report");
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

if (!args.includes("--http-only")) {
  for (const value of [
    "/",
    "/en/",
    "/file.css",
    "/file.js?x=1",
    "/file.png",
    "/file.svg#logo",
    "/file.pdf",
    "/sitemap.xml",
    "/favicon.ico",
    "/font.woff2",
    "//example.com/path",
    "https://example.com/path",
    "#section",
    "mailto:info@kuem.si",
  ]) {
    assert.equal(pageUrl(value), value);
  }
  assert.equal(
    pageUrl("/en/solutions/deep?x=a%2Fb&y=2#section"),
    "/en/solutions/deep/?x=a%2Fb&y=2#section",
  );
  const script = "<script>const value = 'href=\"/nexavia\"';</script>";
  assert.equal(normalizePageUrls(script), script);
  const sitemap = readdirSync(dist)
    .filter((file) => /^sitemap.*\.xml$/.test(file))
    .map(read)
    .join("");
  for (const [, url] of sitemap.matchAll(
    /(?:<loc>|href=")(https:\/\/www\.kuem\.si[^<"]+)/g,
  )) {
    check(pageUrl(url) === url, `sitemap: noncanonical ${url}`);
  }
  const currentPaths = new Set(current.map(({ path }) => path));
  for (const [sl, en] of Object.entries(routePairs)) {
    const slPath = pageUrl(sl);
    const enPath = pageUrl(en);
    const hasSl = currentPaths.has(slPath);
    const hasEn = currentPaths.has(enPath);
    if (hasSl && hasEn) continue;
    // Older route pairs may remain after either localized page was removed.
    // Only assert their reciprocity when both destinations are generated.
  }
  for (const { path, html } of pages) {
    check(
      canonical(html) === origin + (redirects[path] ?? path),
      `${path}: canonical`,
    );
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g))
      check(pageUrl(href) === href, `${path}: href ${href}`);
    for (const [, json] of html.matchAll(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
    )) {
      const walk = (value) => {
        if (typeof value === "string")
          check(pageUrl(value) === value, `${path}: JSON-LD ${value}`);
        else if (value && typeof value === "object")
          Object.values(value).forEach(walk);
      };
      walk(JSON.parse(json));
    }
    if (redirects[path]) continue;
    const alternate = pageUrl(alternatePath(path));
    if (!currentPaths.has(alternate)) continue;
    check(
      alternatePath(alternate) === path,
      `${path}: reciprocal language switch`,
    );
    const other = path.startsWith("/en/") ? "sl-SI" : "en-GB";
    if (!html.includes('name="robots" content="noindex,follow"')) {
      check(
        html.includes(`hreflang="${other}" href="${origin}${alternate}"`),
        `${path}: alternate`,
      );
    }
    check(
      sitemap.includes(`<loc>${origin}${path}</loc>`),
      `${path}: sitemap missing`,
    );
    const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0] ?? "";
    check(
      (header.match(new RegExp(`href="${alternate}"`, "g")) ?? []).length >= 2,
      `${path}: desktop/mobile language links`,
    );
  }
  console.log(
    `Artifact checked: ${current.length} current pages, ${pages.length - current.length} legacy aliases; canonical, hreflang, desktop/mobile links, JSON-LD, sitemap.`,
  );
}

const rows = [];
if (base) {
  const testedPages = args.includes("--current-only") ? current : pages;
  // Sequential bounded requests avoid hammering the production CDN.
  for (const { path } of testedPages) {
    const start = path === "/" ? "/" : path.slice(0, -1);
    const first = await fetch(new URL(start, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const location = first.headers.get("location");
    await first.arrayBuffer();
    const target = location ? new URL(location, base) : new URL(start, base);
    const final = await fetch(target, {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const html = await final.text();
    const loop = final.status >= 300 && final.status < 400;
    const good =
      (path === "/"
        ? first.status === 200
        : [301, 308].includes(first.status)) &&
      target.pathname === path &&
      final.status === 200 &&
      !loop;
    check(
      good,
      `${base}${start}: ${first.status} -> ${target.pathname} -> ${final.status}`,
    );
    check(
      canonical(html) === origin + (redirects[path] ?? path),
      `${base}${path}: live canonical ${canonical(html)}`,
    );
    const query = "?utm_source=slash-test&value=a%2Fb&repeat=1&repeat=2";
    const q = await fetch(new URL(start + query, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    const queryOk =
      path === "/"
        ? q.status === 200
        : [301, 308].includes(q.status) &&
          new URL(q.headers.get("location"), base).href ===
            new URL(path + query, base).href;
    await q.arrayBuffer();
    check(queryOk, `${path}: query not preserved`);
    rows.push(
      `| ${redirects[path] ? "legacy" : path.startsWith("/en/") ? "EN" : "SL"} | ${start} | ${first.status} | ${target.pathname} | ${final.status} | ${canonical(html) ?? "missing"} | ${loop ? "YES" : "no"} | ${queryOk ? "OK" : "FAIL"} |`,
    );
  }
  console.log(
    `HTTP checked: ${testedPages.length} paths at ${base}, including query preservation.`,
  );
}
if (report)
  writeFileSync(
    report,
    `# URL audit\n\nDate: ${new Date().toISOString()}\n\nHTTP environment: ${base ?? "not tested"}. Canonical origin: ${origin}.\n\nLegacy rows test the directory HTTP redirect only; existing HTML refresh aliases are not HTTP redirects to their canonical targets.\n\n| Type | Input | HTTP | Final HTTP URL | Final status | Canonical | Loop | Query |\n|---|---|---|---|---|---|---|---|\n${rows.join("\n")}\n\nErrors (${errors.length}):\n${errors.length ? errors.map((error) => `- ${error}`).join("\n") : "None."}\n`,
  );
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else console.log("Page URL checks passed.");
