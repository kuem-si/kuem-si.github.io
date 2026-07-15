import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL("sitemap-index.xml", site).toString();
  const llmsTxtUrl = new URL("llms.txt", site).toString();
  const llmsFullUrl = new URL("llms-full.txt", site).toString();
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
    "# LLMs / AI crawlers: use llms.txt for structured content",
    `# LLMs guide: ${llmsTxtUrl}`,
    `# LLMs full: ${llmsFullUrl}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
