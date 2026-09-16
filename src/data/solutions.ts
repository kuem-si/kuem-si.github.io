import type { Locale } from "../lib/i18n";

export type Solution = {
  id: string;
  title: string;
  href?: string;
  description?: string;
  features?: string[];
};

export const positioning: Record<Locale, string> = {
  sl:
    "KUEM razvija in implementira rešitve za digitalizacijo infrastrukture, daljinsko odčitavanje števcev, nadzor naprav, spremljanje okoljskih parametrov, alarmiranje in povezovanje podatkov z obstoječimi poslovnimi sistemi.",
  en:
    "KUEM develops and implements solutions for infrastructure digitalization, remote meter reading, remote monitoring of devices and environmental parameters, alarms, and integration of field data with existing business systems."
};

export const nexaviaPositioning: Record<Locale, string> = {
  sl:
    "Nexavia je modularna platforma za zbiranje, obdelavo, prikaz, alarmiranje in integracijo podatkov iz števcev, senzorjev, naprav in zunanjih sistemov.",
  en:
    "Nexavia is a modular platform for collecting, processing, visualizing, alarming and integrating data from meters, sensors, devices and external systems."
};

const solutionTitles = {
  sl: [
    ["daljinsko-odcitavanje-stevcev", "Daljinsko odčitavanje števcev", "/sl/resitve/daljinsko-odcitavanje-stevcev"],
    ["digitalizacija-obcinske-infrastrukture", "Digitalizacija občinske infrastrukture", "/sl/resitve/digitalizacija-obcinske-infrastrukture"],
    ["javna-razsvetljava", "Javna razsvetljava", "/sl/resitve/javna-razsvetljava"],
    ["okoljski-monitoring", "Okoljski monitoring", "/sl/resitve/okoljski-monitoring"],
    ["sole-in-vrtci", "Šole in vrtci", "/sl/resitve/sole-in-vrtci"],
    ["odpadki", "Odpadki", "/sl/resitve/odpadki"],
    ["promet-in-mobilnost", "Promet in mobilnost", "/sl/resitve/promet-in-mobilnost"],
    ["haccp-temperaturni-monitoring", "HACCP temperaturni monitoring", "/sl/resitve/haccp-temperaturni-monitoring"],
    ["turizem-kampi-marine", "Turizem, kampi in marine", "/sl/resitve/turizem-kampi-marine"],
    ["data-centri", "Podatkovni centri", "/sl/resitve/data-centri"]
  ],
  en: [
    ["remote-meter-reading", "Remote meter reading", "/en/solutions/remote-meter-reading"],
    ["municipal-infrastructure-digitalization", "Municipal infrastructure digitalization", "/en/solutions/municipal-infrastructure-digitalization"],
    ["public-lighting", "Public lighting", "/en/solutions/public-lighting"],
    ["environmental-monitoring", "Environmental monitoring", "/en/solutions/environmental-monitoring"],
    ["schools-and-kindergartens", "Schools and kindergartens", "/en/solutions/schools-and-kindergartens"],
    ["waste", "Waste", "/en/solutions/waste"],
    ["traffic-and-mobility", "Traffic and mobility", "/en/solutions/traffic-and-mobility"],
    ["haccp-temperature-monitoring", "HACCP temperature monitoring", "/en/solutions/haccp-temperature-monitoring"],
    ["tourism-camps-marinas", "Tourism, camps and marinas", "/en/solutions/tourism-camps-marinas"],
    ["data-centers", "Data centers", "/en/solutions/data-centers"]
  ]
} satisfies Record<Locale, string[][]>;

export const homepageSolutions: Record<Locale, Solution[]> = {
  sl: solutionTitles.sl.map(([id, title, href]) => ({ id, title, href })),
  en: solutionTitles.en.map(([id, title, href]) => ({ id, title, href }))
};

export const solutions = homepageSolutions;
