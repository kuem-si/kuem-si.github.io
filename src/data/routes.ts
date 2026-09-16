import type { Locale } from "../lib/i18n";
import { stripLocalePrefix, withLocale } from "../lib/i18n";

export type RouteKey =
  | "home"
  | "solutions"
  | "utilities"
  | "industrial"
  | "nexavia"
  | "kai"
  | "industries"
  | "company"
  | "caseStudies"
  | "partnerProgram"
  | "about"
  | "contact"
  | "privacy";

export const routePaths: Record<RouteKey, string> = {
  home: "/",
  solutions: "/solutions",
  utilities: "/utilities",
  industrial: "/industrial-iot",
  nexavia: "/nexavia-platform",
  kai: "/kai",
  industries: "/industries",
  company: "/company",
  caseStudies: "/case-studies",
  partnerProgram: "/partner-program",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy",
};

export const localizedRoutes: Record<Locale, Record<RouteKey, string>> = {
  en: {
    home: "/en",
    solutions: "/en/solutions",
    utilities: "/en/solutions",
    industrial: "/en/industrial-iot",
    nexavia: "/en/nexavia",
    kai: "/en/kai",
    industries: "/en/industries",
    company: "/en/company",
    caseStudies: "/en/references",
    partnerProgram: "/en/partner-program",
    about: "/en/about",
    contact: "/en/contact",
    privacy: "/en/privacy",
  },
  sl: {
    home: "/sl",
    solutions: "/sl/resitve",
    utilities: "/sl/resitve",
    industrial: "/sl/industrial-iot",
    nexavia: "/nexavia",
    kai: "/kai",
    industries: "/panoge",
    company: "/o-podjetju",
    caseStudies: "/sl/reference",
    partnerProgram: "/sl/partner-program",
    about: "/sl/o-nas",
    contact: "/kontakt",
    privacy: "/sl/privacy",
  },
};

const equivalentPairs: Record<string, Record<Locale, string>> = {
  "/": { en: "/en", sl: "/sl" },
  "/solutions": { en: "/en/solutions", sl: "/sl/resitve" },
  "/resitve": { en: "/en/solutions", sl: "/sl/resitve" },
  "/utilities": { en: "/en/solutions", sl: "/sl/resitve" },
  "/platform/nexavia": {
    en: "/en/platform/nexavia",
    sl: "/sl/platforma/nexavia",
  },
  "/platforma/nexavia": {
    en: "/en/platform/nexavia",
    sl: "/sl/platforma/nexavia",
  },
  "/nexavia-platform": {
    en: "/en/platform/nexavia",
    sl: "/sl/platforma/nexavia",
  },
  "/contact": { en: "/en/contact", sl: "/sl/kontakt" },
  "/kontakt": { en: "/en/contact", sl: "/sl/kontakt" },
  "/about": { en: "/en/about", sl: "/sl/o-nas" },
  "/o-nas": { en: "/en/about", sl: "/sl/o-nas" },
  "/references": { en: "/en/references", sl: "/sl/reference" },
  "/reference": { en: "/en/references", sl: "/sl/reference" },
  "/case-studies": { en: "/en/references", sl: "/sl/reference" },
  "/solutions/remote-meter-reading": {
    en: "/en/solutions/remote-meter-reading",
    sl: "/sl/resitve/daljinsko-odcitavanje-stevcev",
  },
  "/resitve/daljinsko-odcitavanje-stevcev": {
    en: "/en/solutions/remote-meter-reading",
    sl: "/sl/resitve/daljinsko-odcitavanje-stevcev",
  },
  "/solutions/municipal-infrastructure-digitalization": {
    en: "/en/solutions/municipal-infrastructure-digitalization",
    sl: "/sl/resitve/digitalizacija-obcinske-infrastrukture",
  },
  "/resitve/digitalizacija-obcinske-infrastrukture": {
    en: "/en/solutions/municipal-infrastructure-digitalization",
    sl: "/sl/resitve/digitalizacija-obcinske-infrastrukture",
  },
  "/solutions/public-lighting": {
    en: "/en/solutions/public-lighting",
    sl: "/sl/resitve/javna-razsvetljava",
  },
  "/resitve/javna-razsvetljava": {
    en: "/en/solutions/public-lighting",
    sl: "/sl/resitve/javna-razsvetljava",
  },
  "/solutions/environmental-monitoring": {
    en: "/en/solutions/environmental-monitoring",
    sl: "/sl/resitve/okoljski-monitoring",
  },
  "/resitve/okoljski-monitoring": {
    en: "/en/solutions/environmental-monitoring",
    sl: "/sl/resitve/okoljski-monitoring",
  },
  "/solutions/schools-and-kindergartens": {
    en: "/en/solutions/schools-and-kindergartens",
    sl: "/sl/resitve/sole-in-vrtci",
  },
  "/resitve/sole-in-vrtci": {
    en: "/en/solutions/schools-and-kindergartens",
    sl: "/sl/resitve/sole-in-vrtci",
  },
  "/solutions/waste": { en: "/en/solutions/waste", sl: "/sl/resitve/odpadki" },
  "/resitve/odpadki": { en: "/en/solutions/waste", sl: "/sl/resitve/odpadki" },
  "/solutions/traffic-and-mobility": {
    en: "/en/solutions/traffic-and-mobility",
    sl: "/sl/resitve/promet-in-mobilnost",
  },
  "/resitve/promet-in-mobilnost": {
    en: "/en/solutions/traffic-and-mobility",
    sl: "/sl/resitve/promet-in-mobilnost",
  },
  "/solutions/haccp-temperature-monitoring": {
    en: "/en/solutions/haccp-temperature-monitoring",
    sl: "/sl/resitve/haccp-temperaturni-monitoring",
  },
  "/resitve/haccp-temperaturni-monitoring": {
    en: "/en/solutions/haccp-temperature-monitoring",
    sl: "/sl/resitve/haccp-temperaturni-monitoring",
  },
  "/solutions/tourism-camps-marinas": {
    en: "/en/solutions/tourism-camps-marinas",
    sl: "/sl/resitve/turizem-kampi-marine",
  },
  "/resitve/turizem-kampi-marine": {
    en: "/en/solutions/tourism-camps-marinas",
    sl: "/sl/resitve/turizem-kampi-marine",
  },
  "/solutions/data-centers": {
    en: "/en/solutions/data-centers",
    sl: "/sl/resitve/data-centri",
  },
  "/resitve/data-centri": {
    en: "/en/solutions/data-centers",
    sl: "/sl/resitve/data-centri",
  },
};

export function getLocalizedPath(route: RouteKey, locale: Locale): string {
  return localizedRoutes[locale][route];
}

export function getEquivalentLocalePath(
  pathname: string,
  locale: Locale,
): string {
  const cleanPath = stripLocalePrefix(pathname);
  return equivalentPairs[cleanPath]?.[locale] ?? withLocale(cleanPath, locale);
}
