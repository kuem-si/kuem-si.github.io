import { ensureTrailingSlash } from "./paths";

export const locales = ["sl", "en", "de"] as const;
export type Locale = (typeof locales)[number];

/** BCP 47 tags (hreflang, html lang, JSON-LD inLanguage). */
export const localeTags: Record<Locale, string> = {
  sl: "sl-SI",
  en: "en-GB",
  de: "de-DE",
};

/** Open Graph locale codes. */
export const ogLocales: Record<Locale, string> = {
  sl: "sl_SI",
  en: "en_GB",
  de: "de_DE",
};

/** Home page of each locale. Slovenian is the default and has no prefix. */
export const localeHome: Record<Locale, string> = {
  sl: "/",
  en: "/en/",
  de: "/de/",
};

export function getLocaleFromPath(pathname: string): Locale {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  for (const locale of ["en", "de"] as const) {
    if (clean === `/${locale}` || clean.startsWith(`/${locale}/`))
      return locale;
  }
  return "sl";
}

/**
 * Every page in all three languages: [sl, en, de]. Each locale uses its own
 * localized slugs, so the language switcher and hreflang alternates are
 * resolved through this table.
 */
const routes: [sl: string, en: string, de: string][] = [
  ["/", "/en/", "/de/"],
  ["/resitve", "/en/solutions", "/de/loesungen"],
  [
    "/resitve/zajem-podatkov",
    "/en/solutions/data-acquisition",
    "/de/loesungen/datenerfassung",
  ],
  [
    "/resitve/povezljivost",
    "/en/solutions/connectivity",
    "/de/loesungen/konnektivitaet",
  ],
  [
    "/resitve/integracije",
    "/en/solutions/integrations",
    "/de/loesungen/integrationen",
  ],
  [
    "/resitve/napredna-analitika",
    "/en/solutions/advanced-analytics",
    "/de/loesungen/erweiterte-analytik",
  ],
  [
    "/resitve/upravljane-storitve",
    "/en/solutions/managed-services",
    "/de/loesungen/managed-services",
  ],
  [
    "/resitve/daljinsko-odcitavanje-stevcev",
    "/en/solutions/remote-meter-reading",
    "/de/loesungen/zaehlerfernauslesung",
  ],
  [
    "/resitve/data-centri",
    "/en/solutions/data-centers",
    "/de/loesungen/rechenzentren",
  ],
  [
    "/resitve/digitalizacija-obcinske-infrastrukture",
    "/en/solutions/municipal-infrastructure-digitalization",
    "/de/loesungen/digitalisierung-kommunaler-infrastruktur",
  ],
  [
    "/resitve/haccp-temperaturni-monitoring",
    "/en/solutions/haccp-temperature-monitoring",
    "/de/loesungen/haccp-temperaturueberwachung",
  ],
  [
    "/resitve/javna-razsvetljava",
    "/en/solutions/public-lighting",
    "/de/loesungen/oeffentliche-beleuchtung",
  ],
  ["/resitve/odpadki", "/en/solutions/waste", "/de/loesungen/abfall"],
  [
    "/resitve/okoljski-monitoring",
    "/en/solutions/environmental-monitoring",
    "/de/loesungen/umweltmonitoring",
  ],
  [
    "/resitve/promet-in-mobilnost",
    "/en/solutions/traffic-and-mobility",
    "/de/loesungen/verkehr-und-mobilitaet",
  ],
  [
    "/resitve/sole-in-vrtci",
    "/en/solutions/schools-and-kindergartens",
    "/de/loesungen/schulen-und-kindergaerten",
  ],
  [
    "/resitve/turizem-kampi-marine",
    "/en/solutions/tourism-camps-marinas",
    "/de/loesungen/tourismus-campingplaetze-marinas",
  ],
  ["/nexavia", "/en/nexavia", "/de/nexavia"],
  ["/kai", "/en/kai", "/de/kai"],
  ["/panoge", "/en/industries", "/de/branchen"],
  ["/reference", "/en/references", "/de/referenzen"],
  // ["/vpogledi", "/en/insights", "/de/einblicke"] returns with those pages
  // (restore src/pages/vpogledi.astro and src/pages/en/insights.astro from
  // git history).
  ["/o-nas", "/en/company", "/de/unternehmen"],
  ["/kontakt", "/en/contact", "/de/kontakt"],
  ["/zasebnost", "/en/privacy", "/de/datenschutz"],
  [
    "/nexavia/razstavni-prostor",
    "/en/nexavia/showcase-room",
    "/de/nexavia/showroom",
  ],
];

const strip = (path: string) => path.replace(/\/$/, "") || "/";

/** Slovenian → English page pairs (kept for the SL/EN QA scripts). */
export const routePairs: Record<string, string> = Object.fromEntries(
  routes.map(([sl, en]) => [sl, en]),
);

const routeByPath = new Map<string, Record<Locale, string>>();
for (const [sl, en, de] of routes) {
  const entry = { sl, en, de };
  for (const path of [sl, en, de]) routeByPath.set(strip(path), entry);
}

/** The same page in the target locale (that locale's home if untranslated). */
export function localizedPath(pathname: string, target: Locale): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (clean === "/404" || clean === "/404.html") return localeHome[target];
  return ensureTrailingSlash(
    routeByPath.get(clean)?.[target] ?? localeHome[target],
  );
}

/** All language versions of a page, keyed by locale. */
export function localeAlternates(pathname: string): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, localizedPath(pathname, locale)]),
  ) as Record<Locale, string>;
}

/** SL ↔ EN counterpart; German pages map to their Slovenian original. */
export function alternatePath(pathname: string): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (clean === "/404" || clean === "/404.html") return "/en/";
  return localizedPath(
    pathname,
    getLocaleFromPath(clean) === "en" ? "sl" : "en",
  );
}
