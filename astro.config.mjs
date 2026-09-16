import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { alternatePath, getLocaleFromPath } from "./src/lib/i18n";
import { redirectFromPaths } from "./src/lib/redirects";

const isRedirectUrl = (url) => {
  const pathname = new URL(url).pathname;
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return redirectFromPaths.has(clean);
};

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  // Freeze the canonical URL shape (directories with trailing slash).
  trailingSlash: "always",
  // Astro v7 defaults compressHTML to 'jsx', which strips whitespace between
  // inline elements and can change rendered text. Keep the v5/v6 HTML-aware
  // compression so the rendered output is byte-for-byte unchanged.
  compressHTML: true,
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
      // Only canonical URLs are submitted; legacy duplicate paths are
      // emitted as redirect pages and excluded here.
      filter: (url) => !isRedirectUrl(url),
      serialize: (item) => {
        const url = new URL(item.url);
        const pathname = url.pathname.replace(/\/$/, "") || "/";
        const locale = getLocaleFromPath(pathname);
        const alternate = alternatePath(pathname);
        const alternateUrl = new URL(alternate, url);
        const links = [
          { lang: locale === "sl" ? "sl-SI" : "en-GB", url: item.url },
        ];
        if (
          alternateUrl.pathname.replace(/\/$/, "") !== pathname
        ) {
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
