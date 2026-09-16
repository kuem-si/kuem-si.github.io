export type Locale = "sl" | "en";
export function getLocaleFromPath(pathname: string): Locale {
  const clean = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return clean === "/en" || clean.startsWith("/en/") ? "en" : "sl";
}
export const routePairs: Record<string, string> = {
  "/": "/en/",
  "/resitve": "/en/solutions",
  "/resitve/zajem-podatkov": "/en/solutions/data-acquisition",
  "/resitve/povezljivost": "/en/solutions/connectivity",
  "/resitve/integracije": "/en/solutions/integrations",
  "/resitve/napredna-analitika": "/en/solutions/advanced-analytics",
  "/resitve/upravljane-storitve": "/en/solutions/managed-services",
  "/resitve/daljinsko-odcitavanje-stevcev":
    "/en/solutions/remote-meter-reading",
  "/resitve/data-centri": "/en/solutions/data-centers",
  "/resitve/digitalizacija-obcinske-infrastrukture":
    "/en/solutions/municipal-infrastructure-digitalization",
  "/resitve/haccp-temperaturni-monitoring":
    "/en/solutions/haccp-temperature-monitoring",
  "/resitve/javna-razsvetljava": "/en/solutions/public-lighting",
  "/resitve/odpadki": "/en/solutions/waste",
  "/resitve/okoljski-monitoring": "/en/solutions/environmental-monitoring",
  "/resitve/promet-in-mobilnost": "/en/solutions/traffic-and-mobility",
  "/resitve/sole-in-vrtci": "/en/solutions/schools-and-kindergartens",
  "/resitve/turizem-kampi-marine": "/en/solutions/tourism-camps-marinas",
  "/nexavia": "/en/nexavia",
  "/kai": "/en/kai",
  "/panoge": "/en/industries",
  "/reference": "/en/references",
  "/vpogledi": "/en/insights",
  "/o-nas": "/en/company",
  "/kontakt": "/en/contact",
  "/zasebnost": "/en/privacy",
  "/industrial-iot": "/en/industrial-iot",
  "/partner-program": "/en/partner-program",
  "/utilities": "/en/utilities",
  "/nexavia-platform": "/en/nexavia-platform",
  "/platforma/nexavia": "/en/platform/nexavia",
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
  return routePairs[clean] ?? "/en/";
}
