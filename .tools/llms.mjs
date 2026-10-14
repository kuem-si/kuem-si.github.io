#!/usr/bin/env node
// Post-build pass for language models and other text readers. From every
// indexable page in dist (not noindex) it writes:
//   <page>/index.md   the page's main content as Markdown, with its title,
//                     description, address and language as front matter
//                     (SeoHead links it as rel="alternate" text/markdown)
//   llms-full.txt     every page's Markdown in one file
//   llms.txt          the curated file from src/pages/llms.txt.ts, with a
//                     one-line description added to each listed page and
//                     every indexable page it does not list appended
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { parse } from "node-html-parser";
import TurndownService from "turndown";

const DIST = "dist";
const SITE = "https://www.kuem.si";

if (!existsSync(DIST)) {
  console.log("dist not found, skipping");
  process.exit(0);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});
// Links and images point at the live site; images without alt text are
// decoration.
turndown.addRule("absoluteLinks", {
  filter: (node) => node.nodeName === "A" && node.getAttribute("href"),
  replacement(content, node) {
    const text = content.trim();
    if (!text) return "";
    const href = node.getAttribute("href");
    if (href.startsWith("#")) return text;
    return `[${text}](${new URL(href, SITE).href})`;
  },
});
turndown.addRule("images", {
  filter: "img",
  replacement(_, node) {
    const alt = node.getAttribute("alt")?.trim();
    const src = node.getAttribute("src");
    if (!alt || !src || src.startsWith("data:")) return "";
    return `![${alt}](${new URL(src, SITE).href})`;
  },
});

// The parts of <main> that are text for a reader, not interface.
function mainMarkdown(main) {
  // Step and panel content waits in <template>s; show it as regular content.
  main
    .querySelectorAll("template")
    .forEach((template) =>
      template.replaceWith(`<div>${template.innerHTML}</div>`),
    );
  main
    .querySelectorAll(
      'script, style, noscript, svg, canvas, iframe, form, [aria-hidden="true"], [data-md-skip]',
    )
    .forEach((node) => node.remove());
  // A button's label is text (card titles live in buttons); the button is not.
  main
    .querySelectorAll("button")
    .forEach((button) => button.replaceWith(button.innerHTML));
  return turndown
    .turndown(main.innerHTML)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const meta = (root, name) =>
  root.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? "";
const pages = [];
for (const file of walk(DIST).filter((path) => path.endsWith("index.html"))) {
  const html = readFileSync(file, "utf8");
  const root = parse(html);
  if (/noindex/.test(meta(root, "robots"))) continue;
  const main = root.querySelector("main");
  const canonical = root
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
  if (!main || !canonical) continue;
  // The page's name without the brand: "KUEM | X", "X | KUEM" and
  // "X | KUEM – Y" become "X" and "X – Y".
  const title = root
    .querySelector("title")
    .text.trim()
    .replace(/^KUEM\s*\|\s*/, "")
    .replace(/\s*\|\s*KUEM$/, "")
    .replace(/\s*\|\s*KUEM\s*–\s*/, " – ");
  const description = meta(root, "description");
  const lang = root.querySelector("html").getAttribute("lang") ?? "";
  const body = mainMarkdown(main);
  const front = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `url: ${canonical}`,
    `language: ${lang}`,
    "---",
  ].join("\n");
  const markdown = `${front}\n\n${body}\n`;
  writeFileSync(join(dirname(file), "index.md"), markdown);
  const path =
    `/${relative(DIST, dirname(file)).split(sep).join("/")}/`.replace(
      /^\/\/$/,
      "/",
    );
  pages.push({ path, url: canonical, title, description, lang, markdown });
}
pages.sort((a, b) => a.path.localeCompare(b.path));
const english = (page) => page.path.startsWith("/en/");

// llms-full.txt: every page in full, Slovenian first (the default language).
const full = [
  "# KUEM – full text of www.kuem.si",
  "",
  `> Every page of ${SITE} as Markdown, in Slovenian and English. Each page starts with its title, description, address and language.`,
  "",
  ...[...pages.filter((page) => !english(page)), ...pages.filter(english)].map(
    (page) => page.markdown.trim(),
  ),
].join("\n\n");
writeFileSync(join(DIST, "llms-full.txt"), `${full}\n`);

// llms.txt: describe each listed page and append the ones not yet listed.
const curated = readFileSync(join(DIST, "llms.txt"), "utf8").trimEnd();
const byUrl = new Map(pages.map((page) => [page.url, page]));
const listed = new Set();
const described = curated.replace(
  /^- \[([^\]]+)\]\((https:\/\/www\.kuem\.si[^)]*)\)(:.*)?$/gm,
  (line, name, url, note) => {
    listed.add(url);
    const page = byUrl.get(url);
    return note || !page?.description
      ? line
      : `- [${name}](${url}): ${page.description}`;
  },
);
const missing = pages.filter((page) => !listed.has(page.url));
const section = (heading, list) =>
  list.length
    ? [
        "",
        heading,
        ...list.map(
          (page) =>
            `- [${page.title}](${page.url})${page.description ? `: ${page.description}` : ""}`,
        ),
      ]
    : [];
const llms = [
  described,
  ...section(
    "## Več strani (slovenščina)",
    missing.filter((page) => !english(page)),
  ),
  ...section("## More pages (English)", missing.filter(english)),
  "",
  "## Optional",
  `- [Full text of all pages](${SITE}/llms-full.txt): every page of the site as Markdown, Slovenian and English.`,
  "- Every page is also available as Markdown at its address followed by index.md, e.g. " +
    `${SITE}/en/nexavia/index.md.`,
];
writeFileSync(join(DIST, "llms.txt"), `${llms.join("\n")}\n`);
console.log(
  `LLM text: ${pages.length} pages as Markdown, ${missing.length} appended to llms.txt, llms-full.txt ${(full.length / 1024).toFixed(0)} KB`,
);
