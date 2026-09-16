import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { alternatePath, getLocaleFromPath } from "./src/lib/i18n";

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  // Freeze the canonical URL shape (directories with trailing slash).
  trailingSlash: "always",
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
      // Odoo CRM credentials; only read by the dev-only POST API route.
      ODOO_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      ODOO_DB: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      ODOO_USERNAME: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      ODOO_API_KEY: envField.string({
        context: "server",
        access: "secret",
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
      // Every URL is canonical (legacy duplicates were removed); emit
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
