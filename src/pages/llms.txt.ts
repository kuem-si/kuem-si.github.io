import type { APIRoute } from "astro";
import {
  ROUTES,
  MAIN_NAV,
  buildLocalizedPath,
  type RouteId,
} from "../config/routes";
import { SITE } from "../config/site";

function getChildRoutes(parentId: RouteId): RouteId[] {
  const children: Record<string, RouteId[]> = {
    services: ["service-development", "service-architecture", "service-devops"],
    solutions: [
      "solution-nexavia",
      "solution-nexavia-enterprise",
      "solution-thynkr",
    ],
  };
  return children[parentId] ?? [];
}

function generateLlmsTxt(): string {
  const locale = "en";
  const lines: string[] = [];

  // Header
  lines.push(`# ${SITE.legalName} (${SITE.name})`);
  lines.push(
    `> Software Solutions and Engineering — Digital product engineering, software architecture, and DevOps platforms.`,
  );
  lines.push("");

  // About
  const about = ROUTES.find((r) => r.id === "about")!;
  lines.push(`## ${about.labels[locale]}`);
  lines.push(
    `- [${about.labels[locale]}](${SITE.url}${buildLocalizedPath(locale, "about")}): ${about.description[locale]}`,
  );
  lines.push("");

  // Services section
  lines.push("## Services");
  const servicesChildren = getChildRoutes("services");
  for (const childId of servicesChildren) {
    const route = ROUTES.find((r) => r.id === childId)!;
    lines.push(
      `- [${route.labels[locale]}](${SITE.url}${buildLocalizedPath(locale, childId)}): ${route.description[locale]}`,
    );
  }
  lines.push("");

  // Solutions section
  lines.push("## Solutions");
  const solutionsChildren = getChildRoutes("solutions");
  for (const childId of solutionsChildren) {
    const route = ROUTES.find((r) => r.id === childId)!;
    lines.push(
      `- [${route.labels[locale]}](${SITE.url}${buildLocalizedPath(locale, childId)}): ${route.description[locale]}`,
    );
  }
  lines.push("");

  // All pages
  lines.push("## All Pages");
  for (const routeId of MAIN_NAV) {
    const route = ROUTES.find((r) => r.id === routeId)!;
    lines.push(
      `- [${route.labels[locale]}](${SITE.url}${buildLocalizedPath(locale, routeId)}): ${route.description[locale]}`,
    );
  }
  lines.push("");

  // Contact
  lines.push("## Contact");
  lines.push(`- Email: ${SITE.email}`);
  lines.push(`- LinkedIn: ${SITE.social.linkedin}`);
  lines.push(`- GitHub: ${SITE.social.github}`);
  lines.push("");

  // Optional section for extended content
  lines.push("## Optional");
  lines.push(
    `- [Full content (Markdown)](${SITE.url}/llms-full.txt): Complete site content in markdown format for AI consumption.`,
  );
  lines.push(
    `- [Sitemap](${SITE.url}/sitemap-index.xml): XML sitemap for crawlers.`,
  );
  lines.push("");

  return lines.join("\n");
}

export const GET: APIRoute = () => {
  const body = generateLlmsTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
