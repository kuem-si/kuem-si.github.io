// Normalize generated page references, not requests. GitHub Pages handles the
// actual HTTP directory redirect. Keep query/fragment bytes and assets intact.
export function pageUrl(value: string): string {
  const match = value.match(/^(https:\/\/www\.kuem\.si)?(\/[^?#]*)([?#].*)?$/);
  if (!match || match[2].startsWith("//")) return value;
  const [, origin = "", path, suffix = ""] = match;
  if (path.endsWith("/") || /\.[^/]+$/.test(path)) return value;
  return `${origin}${path}/${suffix}`;
}

function normalizeData(value: unknown): unknown {
  if (typeof value === "string") return pageUrl(value);
  if (Array.isArray(value)) return value.map(normalizeData);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, normalizeData(item)]),
    );
  }
  return value;
}

export function normalizePageUrls(html: string): string {
  // Work only on tags and JSON-LD, never on visible copy or executable scripts.
  return html.replace(
    /<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>|<[^>]+>/gi,
    (tag) => {
      if (/^<script\b/i.test(tag)) {
        if (!/\btype="application\/ld\+json"/i.test(tag)) return tag;
        return tag.replace(
          /(>)([\s\S]*)(<\/script>)$/i,
          (_, start, json, end) =>
            start +
            JSON.stringify(normalizeData(JSON.parse(json))).replace(
              /</g,
              "\\u003c",
            ) +
            end,
        );
      }
      if (/^<style\b/i.test(tag)) return tag;
      return tag.replace(
        /\b(href|content)="([^"]*)"/g,
        (_, name, value) => `${name}="${pageUrl(value)}"`,
      );
    },
  );
}
