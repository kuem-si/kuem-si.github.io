import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.kuem.si",
  output: "static",
  integrations: [sitemap()],
});
