import { SITE } from "../config/site";
import type { Locale } from "../config/site";
import {
  ROUTES,
  buildLocalizedPath,
  type RouteEntry,
  type RouteId,
} from "../config/routes";

export function toAbsoluteUrl(pathname: string): string {
  return new URL(pathname, SITE.url).toString();
}

const PARENT_MAP: Partial<Record<RouteId, RouteId>> = {
  "service-development": "services",
  "service-architecture": "services",
  "service-devops": "services",
  "solution-nexavia": "solutions",
  "solution-nexavia-enterprise": "solutions",
  "solution-thynkr": "solutions",
};

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function getBreadcrumbs(
  routeId: RouteId,
  locale: Locale,
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [];

  const home = ROUTES.find((r) => r.id === "home")!;
  crumbs.push({
    name: home.labels[locale],
    url: buildLocalizedPath(locale, "home"),
  });

  if (routeId === "home") return crumbs;

  const parentId = PARENT_MAP[routeId];
  if (parentId) {
    const parent = ROUTES.find((r) => r.id === parentId)!;
    crumbs.push({
      name: parent.labels[locale],
      url: buildLocalizedPath(locale, parentId),
    });
  }

  const route = ROUTES.find((r) => r.id === routeId)!;
  crumbs.push({
    name: route.labels[locale],
    url: buildLocalizedPath(locale, routeId),
  });

  return crumbs;
}

export function generateBreadcrumbLd(routeId: RouteId, locale: Locale): object {
  const crumbs = getBreadcrumbs(routeId, locale);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

export function generateWebsiteLd(locale: Locale): object {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
