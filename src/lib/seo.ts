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
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: SITE.url,
    inLanguage: locale,
    publisher: {
      "@id": `${SITE.url}/#organization`,
    },
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

export function generateOrganizationLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE.url,
    logo: toAbsoluteUrl("/favicon.svg"),
    email: SITE.email,
    sameAs: [SITE.social.linkedin, SITE.social.github].filter(Boolean),
    description:
      "Digital product engineering, software architecture, and DevOps platforms. Building reliable software from concept to production.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: SITE.email,
        availableLanguage: ["sl", "en"],
      },
    ],
  };
}

export function generateWebPageLd(
  routeId: RouteId,
  locale: Locale,
  title: string,
  description: string,
  canonicalUrl: string,
): object {
  const route = ROUTES.find((r) => r.id === routeId)!;
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: title,
    description: description,
    inLanguage: locale,
    isPartOf: {
      "@id": `${SITE.url}/#website`,
    },
    about: {
      "@id": `${SITE.url}/#organization`,
    },
    breadcrumb: {
      "@id": `${canonicalUrl}#breadcrumb`,
    },
  };
}

export function generateServiceLd(
  routeId: RouteId,
  locale: Locale,
  canonicalUrl: string,
): object | null {
  const route = ROUTES.find((r) => r.id === routeId)!;

  if (
    routeId === "service-development" ||
    routeId === "service-architecture" ||
    routeId === "service-devops"
  ) {
    return {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${canonicalUrl}#service`,
      name: route.labels[locale],
      description: route.description[locale],
      provider: {
        "@id": `${SITE.url}/#organization`,
      },
      areaServed: "Worldwide",
      category: "Software Engineering",
      serviceType: route.labels[locale],
      termsOfService: canonicalUrl,
    };
  }

  if (
    routeId === "solution-nexavia" ||
    routeId === "solution-nexavia-enterprise"
  ) {
    return {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${canonicalUrl}#application`,
      name: route.labels[locale],
      description: route.description[locale],
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
      },
      provider: {
        "@id": `${SITE.url}/#organization`,
      },
    };
  }

  return null;
}
