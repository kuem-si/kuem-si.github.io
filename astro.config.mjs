import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  // Astro v7 defaults compressHTML to 'jsx', which strips whitespace between
  // inline elements and can change rendered text. Keep the v5/v6 HTML-aware
  // compression so the rendered output is byte-for-byte unchanged.
  compressHTML: true,
  // Prefetch same-origin links on hover/focus intent for instant navigations.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover",
  },
  integrations: [sitemap()],
});
