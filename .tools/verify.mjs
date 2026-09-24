#!/usr/bin/env node
// Cross-platform output verification (replaces verify.ps1).
// Usage: node .tools/verify.mjs
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { checkRedirects } from "../scripts/check-redirects.mjs";

let ok = true;
const check = (label, cond) => {
  ok = ok && cond;
  console.log(`${cond ? "PASS" : "FAIL"} ${label}`);
};

const read = (p) => (existsSync(p) ? readFileSync(p, "utf8") : "");

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const dist = "dist";

// 1. llms.txt
check("llms.txt exists", existsSync(join(dist, "llms.txt")));
const llms = read(join(dist, "llms.txt"));
check("llms.txt has KUEM header", llms.includes("# KUEM"));
check("llms.txt lists EN solutions", llms.includes("Remote meter reading"));
check("llms.txt lists SL solutions", llms.includes("Daljinsko odčitavanje"));

// 2. sitemap
const sitemap = walk(dist).filter(
  (p) => p.endsWith(".xml") && p.includes("sitemap"),
);
const sm = sitemap.map(read).join("");
check(
  "sitemap has hreflang alternates",
  sm.includes('xhtml:link rel="alternate"'),
);
check(
  "sitemap keeps /en/company",
  sm.includes("https://www.kuem.si/en/company/"),
);
check("sitemap keeps /o-nas", sm.includes("https://www.kuem.si/o-nas/"));

// 3. no import.meta leftovers in dist
const htmlFiles = walk(dist).filter((p) => p.endsWith(".html"));
check(
  "no import.meta literals in dist",
  !htmlFiles.some((p) => read(p).includes("import.meta")),
);

// 4. Legacy URLs contain only static redirects to canonical pages.
check("legacy redirects, canonical targets and sitemap", checkRedirects() > 0);

// 5. homepage head
const head =
  read(join(dist, "index.html")).match(/<head>[\s\S]*?<\/head>/)?.[0] ?? "";
check(
  "viewport has initial-scale",
  head.includes("width=device-width, initial-scale=1"),
);
check(
  "theme-color present",
  head.includes('name="theme-color" content="#161a1d"'),
);
check(
  "og:site_name present",
  head.includes('property="og:site_name" content="KUEM"'),
);
check(
  "og:image:width present",
  head.includes('property="og:image:width" content="1200"'),
);
check("twitter:image present", head.includes('name="twitter:image"'));
check(
  "font preloads present",
  (head.match(/rel="preload"/g) ?? []).length >= 2,
);
check("Organization JSON-LD present", head.includes('"@type":"Organization"'));
check("WebSite JSON-LD present", head.includes('"@type":"WebSite"'));
check(
  "SoftwareApplication JSON-LD present",
  head.includes('"@type":"SoftwareApplication"'),
);

// 6. solution page JSON-LD
const solution = read(
  join(dist, "en/solutions/remote-meter-reading/index.html"),
);
check(
  "Service JSON-LD on solution page",
  solution.includes('"@type":"Service"'),
);
check(
  "BreadcrumbList on solution page",
  solution.includes('"@type":"BreadcrumbList"'),
);

// 7. avif output
const avifs = walk(join(dist, "_astro")).filter((p) => p.endsWith(".avif"));
check("avif images generated", avifs.length >= 2);

// 8. dist smaller than baseline (if a baseline exists)
const totalSize = (dir) =>
  walk(dir).reduce((sum, p) => sum + statSync(p).size, 0);
const distSize = totalSize(dist);
if (existsSync("dist-baseline")) {
  const baselineSize = totalSize("dist-baseline");
  check(
    `dist smaller than baseline (${(distSize / 1e6).toFixed(2)} MB vs ${(baselineSize / 1e6).toFixed(2)} MB)`,
    distSize < baselineSize,
  );
} else {
  check("dist-baseline absent, size check skipped", true);
}

// 9. no stale references to removed paths in kept pages
check(
  "no internal links to removed URLs",
  !htmlFiles.some((p) =>
    /href="\/sl\/|href="\/o-podjetju|href="\/about"|href="\/case-studies/.test(
      read(p),
    ),
  ),
);

// 10. every internal link and fragment resolves in dist
const decode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
const resolveFile = (urlPath) => {
  const decoded = decode(urlPath.replace(/[?#].*$/, ""));
  const clean = decoded.startsWith("/") ? decoded.slice(1) : decoded;
  const target = join(dist, clean === "" ? "index.html" : clean);
  if (existsSync(target) && statSync(target).isFile()) return target;
  if (existsSync(join(target, "index.html"))) return join(target, "index.html");
  return null;
};
const srcsetFiles = (value) =>
  value.split(/,\s*/).map((entry) => entry.trim().split(/\s+/)[0]);

const broken = [];
for (const file of htmlFiles) {
  const html = read(file);
  const filePath = file.replaceAll("\\", "/").replace(/^dist\//, "/");
  const fileDir = filePath.slice(0, filePath.lastIndexOf("/"));
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];
    if (
      !raw ||
      raw.startsWith("#") ||
      /^(?:https?:|mailto:|tel:|data:|javascript:)/.test(raw)
    )
      continue;
    const [rawPath, hash] = raw.split("#");
    if (rawPath === "") continue; // same-page anchor
    const absolute = rawPath.startsWith("/")
      ? rawPath
      : decode(join(fileDir, rawPath)).replaceAll("\\", "/");
    const target = resolveFile(absolute);
    if (!target) {
      broken.push(`${file} -> ${raw}`);
      continue;
    }
    if (hash) {
      const targetHtml = read(target);
      const escaped = hash.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`(?:id|name)="${escaped}"`).test(targetHtml))
        broken.push(`${file} -> ${raw} (missing #${hash})`);
    }
  }
  for (const match of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    for (const candidate of srcsetFiles(match[1])) {
      const absolute = candidate.startsWith("/")
        ? candidate
        : decode(join(fileDir, candidate)).replaceAll("\\", "/");
      if (!resolveFile(absolute)) broken.push(`${file} -> srcset ${candidate}`);
    }
  }
}
check(
  "all internal links and fragments resolve",
  broken.length === 0 ||
    (console.log(`  ${broken.slice(0, 10).join("\n  ")}`), false),
);

console.log("");
if (ok) {
  console.log("ALL CHECKS PASSED");
} else {
  console.log("SOME CHECKS FAILED");
  process.exitCode = 1;
}
