import type { Locale } from "./i18n";
import { getNavigation } from "../data/navigation";

export type CaseStudy = {
  title: string;
  vertical: string;
  challenge: string;
  solution: string;
  deployment: string;
  results: string[];
};

const metricsEn = [
  { value: "Read", label: "Remote meter reading" },
  { value: "Watch", label: "Remote device and environmental-parameter monitoring" },
  { value: "Alert", label: "Alarm rules and event notifications" },
  { value: "Link", label: "Reports, APIs and business-system integrations" }
];

const metricsSl = [
  { value: "Odčitaj", label: "Daljinsko odčitavanje števcev" },
  { value: "Nadziraj", label: "Daljinski nadzor naprav in okoljskih parametrov" },
  { value: "Alarmiraj", label: "Alarmna pravila in obvestila o dogodkih" },
  { value: "Poveži", label: "Poročila, API-ji in integracije s poslovnimi sistemi" }
];

const caseStudiesEn: CaseStudy[] = [
  {
    title: "DOMPLAN, d.d.",
    vertical: "Remote gas meter reading",
    challenge: "The utility needed reliable remote gas meter readings for operational and billing processes.",
    solution: "KUEM connected gas meters through NB-IoT and prepared the data for supervision and integration workflows.",
    deployment: "Approximately 1000 gas meters via NB-IoT.",
    results: ["Remote reading", "Meter-data supervision", "Integration-ready field data"]
  },
  {
    title: "JKP Brezovica d.o.o.",
    vertical: "Water metering and infrastructure monitoring",
    challenge: "The operator needed a LoRaWAN foundation for water metering and additional infrastructure monitoring use cases.",
    solution: "KUEM implemented a LoRaWAN network for water meters, Flovac vacuum shaft monitoring and a public-lighting pilot.",
    deployment:
      "LoRaWAN network for 2800 water meters, approximately 300 currently connected; Flovac vacuum shaft monitoring; pilot of 14 LoRaWAN public-lighting units.",
    results: ["Remote water-meter reading", "Infrastructure supervision", "Public-lighting monitoring pilot"]
  },
  {
    title: "Tropic Maloprodaja d.o.o.",
    vertical: "Temperature monitoring",
    challenge: "Retail food areas needed temperature visibility across cold and heated zones.",
    solution: "KUEM prepared monitoring for refrigerators, freezers, salad bars and heated food areas.",
    deployment: "Temperature monitoring in refrigerators, freezers, salad bars and heated food areas.",
    results: ["Temperature supervision", "Alarm-ready data", "Operational reporting"]
  }
];

const caseStudiesSl: CaseStudy[] = [
  {
    title: "DOMPLAN, d.d.",
    vertical: "Daljinsko odčitavanje plinomerov",
    challenge: "Komunalni operater je potreboval zanesljivo daljinsko odčitavanje plinomerov za operativne in obračunske procese.",
    solution: "KUEM je plinomere povezal prek NB-IoT in pripravil podatke za nadzor ter integracijske procese.",
    deployment: "Približno 1000 plinomerov prek NB-IoT.",
    results: ["Daljinsko odčitavanje", "Nadzor merilnih podatkov", "Terenski podatki, pripravljeni za integracije"]
  },
  {
    title: "JKP Brezovica d.o.o.",
    vertical: "Merjenje vode in nadzor infrastrukture",
    challenge: "Operater je potreboval LoRaWAN osnovo za merjenje vode in dodatne primere nadzora infrastrukture.",
    solution: "KUEM je implementiral LoRaWAN omrežje za vodomere, nadzor Flovac vakuumskih jaškov in pilot javne razsvetljave.",
    deployment:
      "LoRaWAN omrežje za 2800 vodomerov, trenutno približno 300 povezanih; nadzor Flovac vakuumskih jaškov; pilot 14 LoRaWAN enot javne razsvetljave.",
    results: ["Daljinsko odčitavanje vode", "Nadzor infrastrukture", "Pilot nadzora javne razsvetljave"]
  },
  {
    title: "Tropic Maloprodaja d.o.o.",
    vertical: "Spremljanje temperature",
    challenge: "Maloprodajna območja s hrano so potrebovala pregled nad temperaturami v hladnih in ogrevanih conah.",
    solution: "KUEM je pripravil spremljanje temperature v hladilnikih, zamrzovalnikih, solatnih barih in ogrevanih območjih s hrano.",
    deployment: "Spremljanje temperature v hladilnikih, zamrzovalnikih, solatnih barih in ogrevanih območjih s hrano.",
    results: ["Nadzor temperature", "Podatki za alarmiranje", "Operativno poročanje"]
  }
];

const utilityUseCasesEn = [
  "Remote meter reads with high data availability",
  "Leak, tamper, and pressure anomaly detection",
  "District metered area visibility for NRW reduction",
  "Consumption analytics for demand forecasting",
  "SCADA and billing integration through open APIs"
];

const utilityUseCasesSl = [
  "Daljinsko odčitavanje z visoko razpoložljivostjo podatkov",
  "Zaznavanje puščanj, manipulacij in odstopanj tlaka",
  "Vidljivost DMA območij za zmanjševanje izgub vode",
  "Analitika porabe za napovedovanje potreb",
  "Integracija s SCADA in obračunom prek odprtih API-jev"
];

const industrialUseCasesEn = [
  "Temperature monitoring for cold chain and facilities",
  "Energy monitoring for production and utilities",
  "Environmental sensing for compliance and safety",
  "Asset tracking for mobile equipment and tools",
  "Custom IoT projects for specialized operational needs"
];

const industrialUseCasesSl = [
  "Nadzor temperature v hladni verigi in objektih",
  "Energetski nadzor proizvodnje in podpornih sistemov",
  "Okoljski senzorji za skladnost in varnost",
  "Sledenje mobilni opremi in orodjem",
  "Prilagojeni IoT projekti za posebne operativne potrebe"
];

export const navItems = getNavigation("en");
export const metrics = metricsEn;
export const caseStudies = caseStudiesEn;
export const utilityUseCases = utilityUseCasesEn;
export const industrialUseCases = industrialUseCasesEn;

export function getNavItems(locale: Locale) {
  return getNavigation(locale);
}

export function getMetrics(locale: Locale) {
  return locale === "sl" ? metricsSl : metricsEn;
}

export function getCaseStudies(locale: Locale) {
  return locale === "sl" ? caseStudiesSl : caseStudiesEn;
}

export function getUtilityUseCases(locale: Locale) {
  return locale === "sl" ? utilityUseCasesSl : utilityUseCasesEn;
}

export function getIndustrialUseCases(locale: Locale) {
  return locale === "sl" ? industrialUseCasesSl : industrialUseCasesEn;
}
