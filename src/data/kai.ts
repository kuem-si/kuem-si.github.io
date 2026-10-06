import type { Locale } from "../lib/i18n";

type KaiContent = {
  title: string;
  description: string;
  processingTitle: string;
  localProcessing: string;
  externalProcessing: string;
  configurationTitle: string;
  configurationPerformance: string;
  configurationRollout: string;
  configurationSummary: string;
};

export const kaiContent: Record<Locale, KaiContent> = {
  sl: {
    title: "KAI: najprej lokalna obdelava.",
    description:
      "KAI pomaga analizirati podatke infrastrukture, pojasniti dogodke in pripraviti naslednji korak. Zasnovan je tako, da daje prednost obdelavi na vaših strežnikih.",
    processingTitle: "Kako KAI deluje na vaših strežnikih.",
    localProcessing:
      "Z dovolj procesorske moči in pomnilnika lahko strežniki v vaših prostorih izvajajo tudi zahtevne analize in velike jezikovne modele. Združljivi strojni pospeševalniki, na primer grafični procesorji (GPU), lahko obdelavo podprtih nalog občutno pospešijo. KAI je zasnovan tako, da najprej uporabi te lokalne zmogljivosti. Obseg lokalne obdelave je odvisen od strojne opreme, modela in naloge.",
    externalProcessing:
      "Le za najzahtevnejše naloge, ki presegajo zmogljivosti lokalne postavitve, lahko po potrebi pridejo v poštev zunanje storitve, kot sta OpenAI ali Anthropic. V takem primeru se izbere čim zmogljivejši jezikovni model, primeren za konkretno nalogo.",
    configurationTitle: "Nastavitve vplivajo na hitrost in kakovost odgovorov.",
    configurationPerformance:
      "Nastavitve v KAI vplivajo na hitrost odziva in kakovost odgovorov. Na oboje vplivajo tudi strojna oprema, modeli in razpoložljivi podatki.",
    configurationRollout:
      "Najzahtevnejše delo z nastavitvami je ob začetni uvedbi KAI v organizacijo, ko ga prilagodimo njenim potrebam in njegove odgovore preverimo v praksi. Po vzpostavitvi so praviloma potrebni manjši popravki glede na vsakodnevno uporabo.",
    configurationSummary:
      "Hitrost in kakovost odgovorov sta odvisni tudi od nastavitev v KAI. Največ dela z nastavitvami je ob začetni uvedbi; pozneje so prilagoditve praviloma manjše.",
  },
  en: {
    title: "KAI: local processing first.",
    description:
      "KAI helps analyze infrastructure data, explain events and prepare the next step. It is designed to prioritize processing on your own servers.",
    processingTitle: "How KAI works on your own servers.",
    localProcessing:
      "With enough processing power and memory, servers at your premises can handle demanding analysis and run large language models. Compatible hardware accelerators, such as graphics processing units (GPUs), can substantially speed up supported workloads. KAI is designed to use this local capacity first. What it can process locally depends on the hardware, model and task.",
    externalProcessing:
      "Only the most demanding tasks that exceed the local setup may need external services, such as OpenAI or Anthropic. In those cases, the aim is to select the most capable language model suited to the specific task.",
    configurationTitle: "Configuration shapes response speed and quality.",
    configurationPerformance:
      "KAI's internal settings affect response speed and answer quality. Both also depend on the hardware, models and available data.",
    configurationRollout:
      "The most demanding configuration work happens during the initial rollout, when KAI is adapted to the organization's needs and its responses are checked in practice. Once KAI is established, ongoing adjustments usually involve smaller corrections based on daily use.",
    configurationSummary:
      "Response speed and quality also depend on KAI's configuration. Most setup work happens during the initial rollout; later adjustments are usually smaller.",
  },
};
