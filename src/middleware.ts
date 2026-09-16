import { defineMiddleware, sequence } from "astro:middleware";
import { middleware } from "astro:i18n";

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
  sequence(i18n, (_context, next) => next()),
);
