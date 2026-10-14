import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// The built site (dist) as the QA scripts read it.
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

// Every built page is a real page: no redirect stubs, no stray routes, and
// the custom 404 is kept out of the index. Returns the number of pages.
export function checkPages() {
  const files = htmlFiles();
  for (const file of files)
    assert(
      !/http-equiv="refresh"/.test(readFileSync(file, "utf8")),
      `${file}: redirect page`,
    );
  assert(
    !existsSync(join(dist, "this-page-does-not-exist-12345")),
    "A route emitted an unknown page",
  );
  const notFound = read("404.html");
  assert(
    notFound.includes('content="noindex') &&
      notFound.includes("The path ends here."),
    "Custom 404 is preserved",
  );
  return files.length;
}

// Unknown addresses on a running server answer with the custom 404.
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
      html.includes("The path ends here."),
      `${path}: custom 404 expected`,
    );
  }
  console.log(
    "HTTP 404 QA passed: unknown root, English and solution-detail URLs retain the custom 404.",
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  console.log(
    `Page QA passed: ${checkPages()} pages, no redirect stubs, custom 404.`,
  );
  if (process.argv[2]) await checkUnknownRoute(process.argv[2]);
}
