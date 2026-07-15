import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  compressHTML: true,
  trailingSlash: "always",
  scopedStyleStrategy: "where",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  markdown: {
    syntaxHighlight: false,
  },
  build: {
    inlineStylesheets: "auto",
  },
  image: {
    layout: "constrained",
    responsiveStyles: true,
  },
  security: {
    csp: {
      scriptDirective: {
        resources: ["'self'", "https://challenges.cloudflare.com"],
      },
      styleDirective: {
        resources: ["'self'"],
      },
      directives: [
        "connect-src 'self' https://challenges.cloudflare.com",
        "frame-src https://challenges.cloudflare.com",
      ],
    },
  },
  i18n: {
    locales: ["sl", "en"],
    defaultLocale: "sl",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Space Grotesk",
      cssVariable: "--font-space-grotesk",
      weights: [400, 500, 600, 700],
      styles: ["normal"],
      subsets: ["latin", "latin-ext"],
    },
  ],
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "sl",
        locales: {
          sl: "sl-SI",
          en: "en-US",
        },
      },
      filter: (page) => new URL(page).pathname !== "/contact/",
    }),
  ],
});
