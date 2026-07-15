import { defineConfig, fontProviders, svgoOptimizer } from "astro/config";
import sitemap from "@astrojs/sitemap";
import partytown from "@astrojs/partytown";

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
    inlineStylesheets: "always",
    assets: "_",
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        webp: { effort: 6, alphaQuality: 80 },
        avif: { effort: 6 },
        jpeg: { mozjpeg: true, progressive: true },
        png: { compressionLevel: 9, effort: 10 },
      },
    },
    layout: "constrained",
    responsiveStyles: true,
  },
  experimental: {
    svgOptimizer: svgoOptimizer({
      multipass: true,
      floatPrecision: 2,
      plugins: [
        "preset-default",
        "removeXMLNS",
        {
          name: "removeXlink",
          params: { includeLegacy: true },
        },
      ],
    }),
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
  vite: {
    build: {
      target: "esnext",
      minify: "terser",
      cssMinify: "lightningcss",
      assetsInlineLimit: 4096,
      modulePreload: {
        polyfill: false,
      },
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          hoistTransitiveImports: false,
        },
      },
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
      display: "swap",
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
    partytown({
      config: {
        forward: [],
      },
    }),
  ],
});
