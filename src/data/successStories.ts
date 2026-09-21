import type { Locale } from "../lib/i18n";
import { references } from "./references";

type LocalizedText = Record<Locale, string>;
export type SuccessStory = {
  slug: string;
  customer: string;
  industry: LocalizedText;
  summary: LocalizedText;
  published: boolean;
  // Provenance is editorial metadata, not customer-facing copy.
  source: { file: string; entry: string; publicRoutes: string[] };
};

// Only these three reference details are already displayed on both homepages.
// Do not publish other reference details merely because they exist in that file.
function homepageDetail(name: string): LocalizedText {
  const detail = references.find((reference) => reference.name === name)?.detail;
  if (!detail) throw new Error(`Missing published reference: ${name}`);
  return detail;
}

export const successStories: SuccessStory[] = [
  {
    slug: "domplan",
    customer: "Domplan",
    industry: { sl: "Merjenje plina", en: "Gas metering" },
    summary: homepageDetail("DOMPLAN, d.d."),
    published: true,
    source: { file: "src/data/references.ts", entry: "DOMPLAN, d.d.", publicRoutes: ["/", "/en/"] },
  },
  {
    slug: "jkp-brezovica",
    customer: "JKP Brezovica",
    industry: { sl: "Komunalna infrastruktura", en: "Utility infrastructure" },
    summary: {
      sl: "Pregled vodomerov in komunalne infrastrukture.",
      en: "Overview of water meters and utility infrastructure.",
    },
    published: true,
    source: { file: "src/components/pages/NexaviaPage.astro", entry: "Brezovica (name: src/data/references.ts, JKP Brezovica d.o.o.)", publicRoutes: ["/nexavia/", "/en/nexavia/"] },
  },
  {
    slug: "sombor-gas",
    customer: "Sombor Gas",
    industry: { sl: "Merjenje plina", en: "Gas metering" },
    summary: homepageDetail("Sombor-gas d.o.o."),
    published: true,
    source: { file: "src/data/references.ts", entry: "Sombor-gas d.o.o.", publicRoutes: ["/", "/en/"] },
  },
  {
    slug: "adria-mobil",
    customer: "Adria Mobil",
    industry: { sl: "Industrija", en: "Industry" },
    summary: {
      sl: "Energetski podatki proizvodnega okolja.",
      en: "Energy data from the production environment.",
    },
    published: true,
    source: { file: "src/components/pages/NexaviaPage.astro", entry: "Adria Mobil", publicRoutes: ["/nexavia/", "/en/nexavia/"] },
  },
  {
    slug: "gradiska",
    customer: "Gradiška",
    industry: { sl: "Okolje", en: "Environment" },
    summary: {
      sl: "Kakovost zraka, hrup, promet in stanje okolja.",
      en: "Air quality, noise, traffic and environmental conditions.",
    },
    published: true,
    source: { file: "src/components/pages/IndustriesPage.astro", entry: "Gradiška", publicRoutes: ["/panoge/", "/en/industries/"] },
  },
  {
    slug: "tropic",
    customer: "Tropic",
    industry: { sl: "Spremljanje temperature", en: "Temperature monitoring" },
    summary: homepageDetail("Tropic Maloprodaja d.o.o."),
    published: true,
    source: { file: "src/data/references.ts", entry: "Tropic Maloprodaja d.o.o.", publicRoutes: ["/", "/en/"] },
  },
];

export const publishedSuccessStories = successStories.filter((story) => story.published === true);
