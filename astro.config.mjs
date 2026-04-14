import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.kuem.si',
  output: 'static',
  compressHTML: true,
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport'
  },
  i18n: {
    locales: ['sl', 'en'],
    defaultLocale: 'sl',
    routing: {
      prefixDefaultLocale: false
    }
  },
  integrations: [sitemap()]
});
