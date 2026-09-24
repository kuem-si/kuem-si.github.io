import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { alternatePath, getLocaleFromPath } from "./src/lib/i18n";
import { legacyEnglishRedirects } from "./src/data/legacyEnglishRedirects";
import { legacySlovenianRedirects } from "./src/data/legacySlovenianRedirects";

const legacyPaths = new Set([
  ...Object.keys(legacyEnglishRedirects).map((path) => `/en/${path}/`),
  ...Object.keys(legacySlovenianRedirects).map((path) => `/${path}/`),
]);

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  // Freeze the canonical URL shape (directories with trailing slash).
  trailingSlash: "always",
  // GitHub Pages issues native HTTP 301 redirects for these directories.
  build: { format: "directory" },
  // Native i18n declaration: Slovenian is the default locale and lives at the
  // root (no prefix); English lives under /en/. Routing is manual because the
  // site uses custom localized slugs (e.g. /resitve vs /en/solutions), which
  // are handled by src/lib/i18n.ts. This declaration enables the astro:i18n
  // helpers and type-safe locale handling across the project.
  i18n: {
    defaultLocale: "sl",
    locales: ["sl", "en"],
    routing: "manual",
  },
  env: {
    schema: {
      // Public endpoint that receives contact/lead form submissions.
      PUBLIC_CONTACT_ENDPOINT: envField.string({
        context: "client",
        access: "public",
        optional: true,
      }),
    },
  },
  // Astro v7 defaults compressHTML to 'jsx', which strips whitespace between
  // inline elements and can change rendered text. Keep the v5/v6 HTML-aware
  // compression so the rendered output is byte-for-byte unchanged.
  compressHTML: true,
  // Higher AVIF encode effort at build time = smaller files, same visual quality.
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        avif: { effort: 6 },
      },
    },
  },
  // Prefetch same-origin links on hover/focus intent for instant navigations.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  vite: {
    plugins: [
      {
        name: "kuem-dev-trailing-slash",
        // Astro rejects slashless page URLs before application middleware runs.
        // Match the directory redirects provided by the static production host.
        configureServer: {
          order: "post",
          handler(server) {
            // Astro prepends its slash-mismatch 404 in a post hook. Install
            // this redirect after that hook, ahead of the mismatch handler.
            return () =>
              server.middlewares.stack.unshift({
                route: "",
                handle(req, res, next) {
                  const url = new URL(req.url ?? "/", "http://localhost");
                  const { pathname } = url;
                  if (
                    (req.method !== "GET" && req.method !== "HEAD") ||
                    pathname.endsWith("/") ||
                    pathname.startsWith("//") ||
                    /^\/(?:@|_|src\/|node_modules\/)/.test(pathname) ||
                    /\.[^/]+$/.test(pathname)
                  ) {
                    return next();
                  }
                  res.writeHead(301, { Location: `${pathname}/${url.search}` });
                  res.end();
                },
              });
          },
        },
      },
    ],
    build: {
      // Vite 8 default, made explicit: minify CSS with Lightning CSS.
      cssMinify: "lightningcss",
    },
    css: {
      // Modern-only pipeline: transform CSS with Lightning CSS instead of
      // PostCSS. No polyfills or legacy vendor prefixes are emitted for the
      // target browsers below (Chrome/Edge 116+, Firefox 115+, Safari 18+).
      transformer: "lightningcss",
      lightningcss: {
        targets: {
          chrome: 116 << 16,
          edge: 116 << 16,
          firefox: 115 << 16,
          safari: 18 << 16,
          ios_saf: 18 << 16,
        },
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) => !legacyPaths.has(new URL(page).pathname),
      // Every included URL is canonical; emit
      // hreflang alternates for both locales.
      serialize: (item) => {
        const url = new URL(item.url);
        const pathname = url.pathname.replace(/\/$/, "") || "/";
        const locale = getLocaleFromPath(pathname);
        const alternate = alternatePath(pathname);
        const alternateUrl = new URL(alternate, url);
        const links = [
          { lang: locale === "sl" ? "sl-SI" : "en-GB", url: item.url },
        ];
        if (alternateUrl.pathname.replace(/\/$/, "") !== pathname) {
          links.push({
            lang: locale === "sl" ? "en-GB" : "sl-SI",
            url: alternateUrl.href,
          });
        }
        return { ...item, links };
      },
    }),
  ],
});
