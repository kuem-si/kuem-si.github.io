import type { Locale } from "../lib/i18n";

export type CustomerStory = {
  label: string;
  client: string;
  title: string;
  summary: string;
  visual: "utility" | "industry" | "environment";
};

export const customerStories = {
  sl: [
    {
      label: "KOMUNALNA INFRASTRUKTURA",
      client: "JKP Brezovica",
      title: "Povezana infrastruktura za daljinsko merjenje in nadzor.",
      summary:
        "Za JKP Brezovica smo vzpostavili podatkovno okolje, ki povezuje vodomere in dodatne infrastrukturne točke. Meritve, stanje naprav in dogodki so združeni v enoten operativni pregled za učinkovitejše delo na terenu in v nadzornem okolju.",
      visual: "utility",
    },
    {
      label: "INDUSTRIJA IN PROIZVODNJA",
      client: "Adria Mobil",
      title: "Energetski podatki proizvodnje na enem mestu.",
      summary:
        "V proizvodnem okolju Adrie Mobil smo merilne točke povezali z lokalnim komunikacijskim in podatkovnim sistemom. Nexavia omogoča pregled porabe po področjih ter povezavo operativnih podatkov z obstoječimi sistemi podjetja.",
      visual: "industry",
    },
    {
      label: "MESTO IN OKOLJE",
      client: "Gradiška",
      title: "Skupen pregled okoljskih in mestnih podatkov.",
      summary:
        "V Gradiški smo povezali podatke o kakovosti zraka, hrupu, prometu in vodostaju. Različni podatkovni viri so združeni v enoten pregled za lažje spremljanje razmer in hitrejše prepoznavanje odstopanj.",
      visual: "environment",
    },
  ],
  en: [
    {
      label: "UTILITY INFRASTRUCTURE",
      client: "JKP Brezovica",
      title: "Connected infrastructure for remote metering and monitoring.",
      summary:
        "For JKP Brezovica, we established a data environment connecting water meters and additional infrastructure points. Measurements, device status and events are combined into a unified operational view for more efficient field and control-room work.",
      visual: "utility",
    },
    {
      label: "INDUSTRY AND MANUFACTURING",
      client: "Adria Mobil",
      title: "Production energy data in one place.",
      summary:
        "In Adria Mobil’s production environment, measurement points were connected to a local communication and data system. Nexavia provides visibility into consumption by area and connects operational data with the company’s existing systems.",
      visual: "industry",
    },
    {
      label: "CITY AND ENVIRONMENT",
      client: "Gradiška",
      title: "A unified view of environmental and urban data.",
      summary:
        "In Gradiška, we connected air quality, noise, traffic and water-level data. Multiple data sources are combined into a common view for easier monitoring and faster identification of deviations.",
      visual: "environment",
    },
  ],
} satisfies Record<Locale, CustomerStory[]>;
