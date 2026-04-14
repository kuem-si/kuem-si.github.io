import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body = `User-agent: *\nAllow: /\n\nSitemap: https://www.kuem.si/sitemap-index.xml\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
};
