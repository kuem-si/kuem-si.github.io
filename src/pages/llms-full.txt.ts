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

function generateLlmsFullTxt(): string {
  const locale = "en";
  const lines: string[] = [];

  lines.push(`# ${SITE.legalName} — Complete Site Content`);
  lines.push("");
  lines.push(
    `**URL:** ${SITE.url} | **Email:** ${SITE.email} | **LinkedIn:** ${SITE.social.linkedin}`,
  );
  lines.push("");

  // Company overview
  const home = ROUTES.find((r) => r.id === "home")!;
  lines.push("## Company Overview");
  lines.push("");
  lines.push(home.intro[locale]);
  lines.push("");
  lines.push(home.description[locale]);
  lines.push("");

  // About
  lines.push("## About KUEM");
  lines.push("");
  const about = ROUTES.find((r) => r.id === "about")!;
  lines.push(about.intro[locale]);
  lines.push("");
  lines.push(about.description[locale]);
  lines.push("");
  lines.push("**Core principles:**");
  for (const h of about.highlights[locale]) {
    lines.push(`- ${h}`);
  }
  lines.push("");

  // Services
  lines.push("## Services");
  lines.push("");
  const services = ROUTES.find((r) => r.id === "services")!;
  lines.push(services.intro[locale]);
  lines.push("");
  lines.push(services.description[locale]);
  lines.push("");

  for (const childId of getChildRoutes("services")) {
    const route = ROUTES.find((r) => r.id === childId)!;
    lines.push(`### ${route.labels[locale]}`);
    lines.push("");
    lines.push(`**URL:** ${SITE.url}${buildLocalizedPath(locale, childId)}`);
    lines.push("");
    lines.push(route.intro[locale]);
    lines.push("");
    lines.push(route.description[locale]);
    lines.push("");
    lines.push("**Key capabilities:**");
    for (const h of route.highlights[locale]) {
      lines.push(`- ${h}`);
    }
    lines.push("");
  }

  // Solutions
  lines.push("## Solutions");
  lines.push("");
  const solutions = ROUTES.find((r) => r.id === "solutions")!;
  lines.push(solutions.intro[locale]);
  lines.push("");
  lines.push(solutions.description[locale]);
  lines.push("");

  for (const childId of getChildRoutes("solutions")) {
    const route = ROUTES.find((r) => r.id === childId)!;
    lines.push(`### ${route.labels[locale]}`);
    lines.push("");
    lines.push(`**URL:** ${SITE.url}${buildLocalizedPath(locale, childId)}`);
    lines.push("");
    lines.push(route.intro[locale]);
    lines.push("");
    lines.push(route.description[locale]);
    lines.push("");
    lines.push("**Key features:**");
    for (const h of route.highlights[locale]) {
      lines.push(`- ${h}`);
    }
    lines.push("");
  }

  // Contact
  lines.push("## Contact");
  lines.push("");
  const contact = ROUTES.find((r) => r.id === "contact")!;
  lines.push(contact.intro[locale]);
  lines.push("");
  lines.push(`- **Email:** ${SITE.email}`);
  lines.push(`- **LinkedIn:** ${SITE.social.linkedin}`);
  lines.push(`- **GitHub:** ${SITE.social.github}`);
  lines.push("");

  return lines.join("\n");
}

export const GET: APIRoute = () => {
  const body = generateLlmsFullTxt();
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
