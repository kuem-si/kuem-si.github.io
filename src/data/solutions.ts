import type { Locale } from "../lib/i18n";
import { solutionDetailSlugs } from "./solutionDetails";

export type Solution = {
  id: string;
  title: string;
  href?: string;
  description?: string;
  features?: string[];
};

export const positioning: Record<Locale, string> = {
  sl: "KUEM razvija in implementira rešitve za digitalizacijo infrastrukture, daljinsko odčitavanje števcev, nadzor naprav, spremljanje okoljskih parametrov, alarmiranje in povezovanje podatkov z obstoječimi poslovnimi sistemi.",
  en: "KUEM develops and implements solutions for infrastructure digitalization, remote meter reading, remote monitoring of devices and environmental parameters, alarms, and integration of field data with existing business systems.",
};

export const nexaviaPositioning: Record<Locale, string> = {
  sl: "Nexavia je modularna platforma za zbiranje, obdelavo, prikaz, alarmiranje in integracijo podatkov iz števcev, senzorjev, naprav in zunanjih sistemov.",
  en: "Nexavia is a modular platform for collecting, processing, visualizing, alarming and integrating data from meters, sensors, devices and external systems.",
};

const solutionTitles = {
  sl: [
    ["daljinsko-odcitavanje-stevcev", "Daljinsko odčitavanje števcev"],
    [
      "digitalizacija-obcinske-infrastrukture",
      "Digitalizacija občinske infrastrukture",
    ],
    ["javna-razsvetljava", "Javna razsvetljava"],
    ["okoljski-monitoring", "Okoljski monitoring"],
    ["sole-in-vrtci", "Šole in vrtci"],
    ["odpadki", "Odpadki"],
    ["promet-in-mobilnost", "Promet in mobilnost"],
    ["haccp-temperaturni-monitoring", "HACCP temperaturni monitoring"],
    ["turizem-kampi-marine", "Turizem, kampi in marine"],
    ["data-centri", "Podatkovni centri"],
  ],
  en: [
    ["remote-meter-reading", "Remote meter reading"],
    [
      "municipal-infrastructure-digitalization",
      "Municipal infrastructure digitalization",
    ],
    ["public-lighting", "Public lighting"],
    ["environmental-monitoring", "Environmental monitoring"],
    ["schools-and-kindergartens", "Schools and kindergartens"],
    ["waste", "Waste"],
    ["traffic-and-mobility", "Traffic and mobility"],
    ["haccp-temperature-monitoring", "HACCP temperature monitoring"],
    ["tourism-camps-marinas", "Tourism, camps and marinas"],
    ["data-centers", "Data centers"],
  ],
} satisfies Record<Locale, string[][]>;

// URL slugs are single-sourced in solutionDetails.ts; titles are mapped per
// locale here. The lookup fails the build if a slug loses its title.
const titleBySlug = (locale: Locale): Record<string, string> =>
  Object.fromEntries(
    solutionTitles[locale].map(([slug, title]) => [slug, title]),
  );

const requireTitle = (titles: Record<string, string>, slug: string): string => {
  const title = titles[slug];
  if (!title) throw new Error(`Missing ${slug} in solutionTitles`);
  return title;
};

export const homepageSolutions: Record<Locale, Solution[]> = {
  sl: solutionDetailSlugs.map(({ sl }) => ({
    id: sl,
    title: requireTitle(titleBySlug("sl"), sl),
    href: `/resitve/${sl}`,
  })),
  en: solutionDetailSlugs.map(({ en }) => ({
    id: en,
    title: requireTitle(titleBySlug("en"), en),
    href: `/en/solutions/${en}`,
  })),
};

export const solutions = homepageSolutions;
