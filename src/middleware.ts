import { defineMiddleware, sequence } from "astro:middleware";
import { middleware } from "astro:i18n";
import { normalizePageUrls } from "./lib/page-urls";

// The site manages locale routing manually (custom localized slugs are handled
// by src/lib/i18n.ts), but still declares its i18n scheme in astro.config.
// With `routing: "manual"`, Astro requires an explicit middleware file; the
// built-in i18n middleware is wired here with prefixing/redirects disabled so
// all routing behavior stays in the project's own helpers.
const i18n = middleware({
  prefixDefaultLocale: false,
  redirectToDefaultLocale: false,
  fallbackType: "redirect",
});

export const onRequest = defineMiddleware(
  sequence(i18n, async (_context, next) => {
    const response = await next();
    if (!response.headers.get("content-type")?.includes("text/html"))
      return response;
    // Runs at prerender time too: navigation, canonical/hreflang and JSON-LD
    // have the same canonical URL shape in dev and in the static artifact.
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(normalizePageUrls(await response.text()), {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }),
);
