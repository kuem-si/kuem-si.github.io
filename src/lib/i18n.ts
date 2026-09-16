export type Locale = "sl" | "en";
export const DEFAULT_LOCALE: Locale = "sl";
const legacyEnglishRootPaths = new Set([
  "/about",
  "/case-studies",
  "/contact",
  "/industrial-iot",
  "/nexavia-platform",
  "/partner-program",
  "/privacy",
  "/utilities",
]);
export function getLocaleFromPath(pathname: string): Locale {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return clean === "/en" ||
    clean.startsWith("/en/") ||
    legacyEnglishRootPaths.has(clean)
    ? "en"
    : "sl";
}
export const routePairs: Record<string, string> = {
  "/sl": "/en/",
  "/": "/en/",
  "/sl/resitve": "/en/solutions",
  "/resitve": "/en/solutions",
  "/resitve/zajem-podatkov": "/en/solutions/data-acquisition",
  "/resitve/povezljivost": "/en/solutions/connectivity",
  "/resitve/integracije": "/en/solutions/integrations",
  "/resitve/napredna-analitika": "/en/solutions/advanced-analytics",
  "/resitve/upravljane-storitve": "/en/solutions/managed-services",
  "/sl/resitve/daljinsko-odcitavanje-stevcev":
    "/en/solutions/remote-meter-reading",
  "/sl/resitve/data-centri": "/en/solutions/data-centers",
  "/sl/resitve/digitalizacija-obcinske-infrastrukture":
    "/en/solutions/municipal-infrastructure-digitalization",
  "/sl/resitve/haccp-temperaturni-monitoring":
    "/en/solutions/haccp-temperature-monitoring",
  "/sl/resitve/javna-razsvetljava": "/en/solutions/public-lighting",
  "/sl/resitve/odpadki": "/en/solutions/waste",
  "/sl/resitve/okoljski-monitoring": "/en/solutions/environmental-monitoring",
  "/sl/resitve/promet-in-mobilnost": "/en/solutions/traffic-and-mobility",
  "/sl/resitve/sole-in-vrtci": "/en/solutions/schools-and-kindergartens",
  "/sl/resitve/turizem-kampi-marine": "/en/solutions/tourism-camps-marinas",
  "/nexavia": "/en/nexavia",
  "/kai": "/en/kai",
  "/panoge": "/en/industries",
  "/sl/reference": "/en/references",
  "/reference": "/en/references",
  "/vpogledi": "/en/insights",
  "/sl/o-nas": "/en/company",
  "/o-podjetju": "/en/company",
  "/o-nas": "/en/company",
  "/sl/kontakt": "/en/contact",
  "/kontakt": "/en/contact",
  "/sl/privacy": "/en/privacy",
  "/zasebnost": "/en/privacy",
  "/sl/platforma/nexavia": "/en/platform/nexavia",
  "/sl/industrial-iot": "/en/industrial-iot",
  "/sl/partner-program": "/en/partner-program",
  "/sl/utilities": "/en/utilities",
  "/sl/about": "/en/about",
  "/sl/case-studies": "/en/case-studies",
  "/sl/contact": "/contact",
  "/sl/nexavia-platform": "/en/nexavia-platform",
};
const reversePairs = Object.fromEntries(
  Object.entries(routePairs).map(([sl, en]) => [
    en.replace(/\/$/, "") || "/en",
    sl,
  ]),
);
export function alternatePath(pathname: string): string {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (clean.startsWith("/en")) return reversePairs[clean] ?? "/";
  if (legacyEnglishRootPaths.has(clean))
    return reversePairs[clean] ?? `/sl${clean}`;
  return (
    routePairs[clean] ??
    (clean.startsWith("/sl/")
      ? `/en${clean.slice(3)}`
      : `/en${clean === "/" ? "/" : clean}`)
  );
}
export function stripLocalePrefix(pathname: string): string {
  return pathname.replace(/^\/en(?=\/|$)/, "") || "/";
}
export function withLocale(pathname: string, locale: Locale): string {
  const clean = stripLocalePrefix(pathname);
  return locale === "en" ? (clean === "/" ? "/en" : `/en${clean}`) : clean;
}
