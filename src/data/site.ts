import type { Locale } from "../lib/i18n";
export const solutions = {
  sl: [
    {
      slug: "zajem-podatkov",
      title: "Zajem podatkov",
      summary:
        "Zanesljiv zajem podatkov iz merilnikov, senzorjev, strojev in obstoječih krmilnih sistemov.",
      tech: ["wM-Bus", "LoRaWAN", "NB-IoT", "Modbus TCP"],
    },
    {
      slug: "povezljivost",
      title: "Povezljivost",
      summary:
        "Komunikacijska pot, izbrana glede na okolje, doseg, porabo energije in razpoložljivost.",
      tech: ["LoRaWAN", "NB-IoT", "MQTT", "IP omrežja"],
    },
    {
      slug: "integracije",
      title: "Integracije in avtomatizacija",
      summary:
        "Podatke povežemo z obstoječimi poslovnimi in operativnimi sistemi brez zamenjave uporabnih naložb.",
      tech: ["REST API", "MQTT", "SCADA", "ERP"],
    },
    {
      slug: "napredna-analitika",
      title: "Napredna analitika",
      summary:
        "Iz operativnih podatkov oblikujemo razložljive kazalnike, dogodke in podlago za ukrepanje.",
      tech: ["KPI", "alarmi", "poročila", "skoraj realni čas"],
    },
    {
      slug: "upravljane-storitve",
      title: "Upravljane storitve",
      summary:
        "Spremljanje podatkovne poti, podpora uporabnikom in postopno izboljševanje operativnega okolja.",
      tech: ["NOC", "podpora", "nadzor", "izboljšave"],
    },
  ],
  en: [
    {
      slug: "data-acquisition",
      title: "Data acquisition",
      summary:
        "Reliable acquisition from meters, sensors, machines and existing control systems.",
      tech: ["wM-Bus", "LoRaWAN", "NB-IoT", "Modbus TCP"],
    },
    {
      slug: "connectivity",
      title: "Connectivity",
      summary:
        "A communications path selected for the environment, range, power use and availability.",
      tech: ["LoRaWAN", "NB-IoT", "MQTT", "IP networks"],
    },
    {
      slug: "integrations",
      title: "Integrations and automation",
      summary:
        "We connect data to existing business and operational systems without replacing sound investments.",
      tech: ["REST API", "MQTT", "SCADA", "ERP"],
    },
    {
      slug: "advanced-analytics",
      title: "Advanced analytics",
      summary:
        "We turn operational data into explainable indicators, events and support for action.",
      tech: ["KPIs", "alarms", "reports", "near-real-time"],
    },
    {
      slug: "managed-services",
      title: "Managed services",
      summary:
        "Data-path monitoring, user support and continuous improvement of the operational environment.",
      tech: ["NOC", "support", "monitoring", "improvement"],
    },
  ],
} satisfies Record<
  Locale,
  { slug: string; title: string; summary: string; tech: string[] }[]
>;

export type SolutionsHeroModule = {
  title: string;
  description: string;
  href: string;
};

export type SolutionsHeroLayer = {
  label: string;
  modules: [SolutionsHeroModule, SolutionsHeroModule];
};

export type SolutionsHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  proofLabel: string;
  proof: [string, string, string];
  architectureLabel: string;
  layers: [SolutionsHeroLayer, SolutionsHeroLayer, SolutionsHeroLayer];
};

export const solutionsHero = {
  sl: {
    eyebrow: "KUEM REŠITVE",
    title: "Rešitve za celotno podatkovno pot.",
    description:
      "Od zajema podatkov in zanesljive povezljivosti do platforme, integracij, napredne analitike ter dolgoročnega upravljanja. Posamezne zmogljivosti uvedemo samostojno ali jih povežemo v enotno operativno celoto.",
    primaryLabel: "Raziščite rešitve",
    primaryHref: "#solutions-overview",
    secondaryLabel: "Pogovorimo se o vašem okolju",
    secondaryHref: "/kontakt",
    proofLabel: "Ključne lastnosti rešitev",
    proof: [
      "Neodvisno od proizvajalca",
      "On-premise ali cloud",
      "Povezava z obstoječimi sistemi",
    ],
    architectureLabel: "Modularna arhitektura KUEM rešitev",
    layers: [
      {
        label: "TEREN",
        modules: [
          {
            title: "Zajem podatkov",
            description: "Naprave in obstoječi sistemi",
            href: "/resitve/zajem-podatkov",
          },
          {
            title: "Povezljivost",
            description: "Zanesljiv prenos podatkov",
            href: "/resitve/povezljivost",
          },
        ],
      },
      {
        label: "PLATFORMA",
        modules: [
          {
            title: "Nexavia",
            description: "Enoten operativni pregled",
            href: "/nexavia",
          },
          {
            title: "Integracije",
            description: "Povezava s poslovnimi sistemi",
            href: "/resitve/integracije",
          },
        ],
      },
      {
        label: "OPERATIVA",
        modules: [
          {
            title: "Napredna analitika",
            description: "Odstopanja in kontekst",
            href: "/resitve/napredna-analitika",
          },
          {
            title: "Upravljane storitve",
            description: "Spremljanje in izboljšave",
            href: "/resitve/upravljane-storitve",
          },
        ],
      },
    ],
  },
  en: {
    eyebrow: "KUEM SOLUTIONS",
    title: "Solutions for the complete data path.",
    description:
      "From data acquisition and reliable connectivity to the operational platform, integrations, advanced analytics and long-term management. Each capability can be introduced independently or connected into one operational system.",
    primaryLabel: "Explore our solutions",
    primaryHref: "#solutions-overview",
    secondaryLabel: "Discuss your environment",
    secondaryHref: "/en/contact",
    proofLabel: "Key solution characteristics",
    proof: [
      "Vendor-independent",
      "On-premise or cloud",
      "Connected to existing systems",
    ],
    architectureLabel: "Modular KUEM solutions architecture",
    layers: [
      {
        label: "FIELD",
        modules: [
          {
            title: "Data acquisition",
            description: "Devices and existing systems",
            href: "/en/solutions/data-acquisition",
          },
          {
            title: "Connectivity",
            description: "Reliable data transfer",
            href: "/en/solutions/connectivity",
          },
        ],
      },
      {
        label: "PLATFORM",
        modules: [
          {
            title: "Nexavia",
            description: "Unified operational overview",
            href: "/en/nexavia",
          },
          {
            title: "Integrations",
            description: "Connected business systems",
            href: "/en/solutions/integrations",
          },
        ],
      },
      {
        label: "OPERATIONS",
        modules: [
          {
            title: "Advanced analytics",
            description: "Deviations and context",
            href: "/en/solutions/advanced-analytics",
          },
          {
            title: "Managed services",
            description: "Monitoring and improvement",
            href: "/en/solutions/managed-services",
          },
        ],
      },
    ],
  },
} satisfies Record<Locale, SolutionsHeroContent>;

export const industries = {
  sl: [
    "Energetika in komunala",
    "Industrija in proizvodnja",
    "Stavbe, trgovina in logistika",
    "Mesta in okolje",
    "Turizem, kampi in marine",
    "Razpršena in oddaljena infrastruktura",
  ],
  en: [
    "Utilities and energy",
    "Industry and manufacturing",
    "Buildings, retail and logistics",
    "Cities and environment",
    "Tourism, camps and marinas",
    "Distributed and remote infrastructure",
  ],
} satisfies Record<Locale, string[]>;

export type HomeIndustry = {
  title: string;
  summary: string;
  terms: [string, string, string];
};

export const homeIndustries = {
  sl: [
    {
      title: "Energetika in komunala",
      summary:
        "Združujemo meritve porabe, stanje omrežja, alarme in dogodke v enoten operativni pregled.",
      terms: ["Meritve", "omrežje", "odstopanja"],
    },
    {
      title: "Industrija in proizvodnja",
      summary:
        "Povezujemo stroje, procesne signale in porabo energije za zanesljivejše upravljanje proizvodnje.",
      terms: ["Procesi", "energija", "vzdrževanje"],
    },
    {
      title: "Stavbe, trgovina in logistika",
      summary:
        "Spremljamo energijo, pogoje prostora in delovanje opreme na eni ali več lokacijah.",
      terms: ["Energija", "pogoji", "oprema"],
    },
    {
      title: "Mesta in okolje",
      summary:
        "Povezujemo podatke o okolju, prometu in javni infrastrukturi za hitrejše operativno ukrepanje.",
      terms: ["Okolje", "promet", "infrastruktura"],
    },
    {
      title: "Turizem, kampi in marine",
      summary:
        "Združujemo porabo, dostope, opremo in storitve za učinkovitejše upravljanje lokacije.",
      terms: ["Poraba", "dostopi", "storitve"],
    },
    {
      title: "Razpršena in oddaljena infrastruktura",
      summary:
        "Omogočamo nadzor oddaljenih naprav in lokacij brez stalne fizične prisotnosti.",
      terms: ["Oddaljeni nadzor", "alarmi", "povezljivost"],
    },
  ],
  en: [
    {
      title: "Utilities and energy",
      summary:
        "We bring together consumption measurements, network status, alarms and events in a unified operational overview.",
      terms: ["Measurements", "network", "anomalies"],
    },
    {
      title: "Industry and manufacturing",
      summary:
        "We connect machines, process signals and energy consumption to support more reliable production management.",
      terms: ["Processes", "energy", "maintenance"],
    },
    {
      title: "Buildings, retail and logistics",
      summary:
        "We monitor energy use, environmental conditions and equipment performance across one or multiple locations.",
      terms: ["Energy", "conditions", "equipment"],
    },
    {
      title: "Cities and environment",
      summary:
        "We connect environmental, transport and public infrastructure data to enable faster operational response.",
      terms: ["Environment", "transport", "infrastructure"],
    },
    {
      title: "Tourism, camps and marinas",
      summary:
        "We bring together consumption, access, equipment and services for more efficient site management.",
      terms: ["Consumption", "access", "services"],
    },
    {
      title: "Distributed and remote infrastructure",
      summary:
        "We enable remote monitoring of devices and locations without a continuous on-site presence.",
      terms: ["Remote monitoring", "alarms", "connectivity"],
    },
  ],
} satisfies Record<Locale, HomeIndustry[]>;

export type HomeDataPathStep = {
  title: string;
  summary: string;
  href: string;
  label?: string;
};

export const homeDataPath = {
  sl: [
    {
      title: "Zajem",
      summary:
        "Podatke zajamemo iz naprav, senzorjev, merilnikov in obstoječih sistemov na terenu.",
      href: "/resitve/zajem-podatkov",
      label: "Vhodni podatki",
    },
    {
      title: "Povezljivost",
      summary:
        "Za vsako okolje izberemo zanesljivo komunikacijsko pot, neodvisno od posamezne tehnologije ali proizvajalca.",
      href: "/resitve/povezljivost",
    },
    {
      title: "Prenos in obdelava",
      summary:
        "Podatke sprejmemo, preverimo, normaliziramo in pripravimo za nadaljnjo uporabo z majhnim časovnim zamikom.",
      href: "/nexavia",
    },
    {
      title: "Integracije",
      summary:
        "Podatkovno pot povežemo z obstoječimi poslovnimi, obračunskimi, nadzornimi in drugimi sistemi.",
      href: "/resitve/integracije",
    },
    {
      title: "Napredna analitika",
      summary:
        "Prepoznamo odstopanja, primerjamo vedenje in podatkom dodamo kontekst za lažje razumevanje dogodkov.",
      href: "/resitve/napredna-analitika",
    },
    {
      title: "Odločitev in ukrep",
      summary:
        "Informacije pretvorimo v jasen naslednji korak, opozorilo, potrjeno dejanje ali avtomatiziran proces.",
      href: "/kai",
      label: "Operativni rezultat",
    },
  ],
  en: [
    {
      title: "Acquisition",
      summary:
        "We acquire data from devices, sensors, meters and existing field systems.",
      href: "/en/solutions/data-acquisition",
      label: "Data input",
    },
    {
      title: "Connectivity",
      summary:
        "For each environment, we select a reliable communication path without dependence on a single technology or vendor.",
      href: "/en/solutions/connectivity",
    },
    {
      title: "Transfer and processing",
      summary:
        "We receive, validate and normalize data, preparing it for further use with minimal latency.",
      href: "/en/nexavia",
    },
    {
      title: "Integrations",
      summary:
        "We connect the data path to existing business, billing, supervisory and other systems.",
      href: "/en/solutions/integrations",
    },
    {
      title: "Advanced analytics",
      summary:
        "We identify anomalies, compare behavior and add context to data so events are easier to understand.",
      href: "/en/solutions/advanced-analytics",
    },
    {
      title: "Decision and action",
      summary:
        "We turn information into a clear next step, alert, approved action or automated process.",
      href: "/en/kai",
      label: "Operational outcome",
    },
  ],
} satisfies Record<Locale, HomeDataPathStep[]>;

export type HomeCapability = {
  title: string;
  summary: string;
  linkLabel: string;
  href: string;
};

export type HomeCapabilityLayer = {
  label: string;
  title: string;
  capabilities: [HomeCapability, HomeCapability];
};

export const homeCapabilityLayers = {
  sl: [
    {
      label: "Teren",
      title: "Teren in naprave",
      capabilities: [
        {
          title: "Zajem podatkov",
          summary:
            "Merilnike, senzorje, stroje in obstoječe krmilne sisteme povežemo v zanesljiv vir operativnih podatkov.",
          linkLabel: "Poglej zajem podatkov",
          href: "/resitve/zajem-podatkov",
        },
        {
          title: "Povezljivost",
          summary:
            "Komunikacijsko pot izberemo glede na okolje, doseg, porabo energije in zahtevano razpoložljivost.",
          linkLabel: "Poglej povezljivost",
          href: "/resitve/povezljivost",
        },
      ],
    },
    {
      label: "Platforma",
      title: "Platforma in integracije",
      capabilities: [
        {
          title: "Nexavia operativna platforma",
          summary:
            "Nexavia združi pregled, dogodke, alarme, poročanje in terensko delo v enotnem operativnem okolju.",
          linkLabel: "Spoznajte Nexavio",
          href: "/nexavia",
        },
        {
          title: "Integracije in avtomatizacija",
          summary:
            "Podatke povežemo s poslovnimi, obračunskimi in nadzornimi sistemi ter avtomatiziramo dogovorjene procese.",
          linkLabel: "Poglej integracije",
          href: "/resitve/integracije",
        },
      ],
    },
    {
      label: "Operativa",
      title: "Analitika in upravljanje",
      capabilities: [
        {
          title: "Napredna analitika",
          summary:
            "Iz podatkov oblikujemo razložljive kazalnike, zaznamo odstopanja in pripravimo podlago za pravočasen ukrep.",
          linkLabel: "Poglej analitiko",
          href: "/resitve/napredna-analitika",
        },
        {
          title: "NOC in upravljane storitve",
          summary:
            "Spremljamo delovanje naprav, omrežij in celotne podatkovne poti ter zagotavljamo podporo in operativno upravljanje.",
          linkLabel: "Poglej upravljane storitve",
          href: "/resitve/upravljane-storitve",
        },
      ],
    },
  ],
  en: [
    {
      label: "Field",
      title: "Field and devices",
      capabilities: [
        {
          title: "Data acquisition",
          summary:
            "We connect meters, sensors, machines and existing control systems into a reliable source of operational data.",
          linkLabel: "Explore data acquisition",
          href: "/en/solutions/data-acquisition",
        },
        {
          title: "Connectivity",
          summary:
            "We select the communication path according to the environment, range, energy use and required availability.",
          linkLabel: "Explore connectivity",
          href: "/en/solutions/connectivity",
        },
      ],
    },
    {
      label: "Platform",
      title: "Platform and integrations",
      capabilities: [
        {
          title: "Nexavia operational platform",
          summary:
            "Nexavia brings dashboards, events, alarms, reporting and field work together in one operational environment.",
          linkLabel: "Explore Nexavia",
          href: "/en/nexavia",
        },
        {
          title: "Integrations and automation",
          summary:
            "We connect data to business, billing and supervisory systems and automate agreed processes.",
          linkLabel: "Explore integrations",
          href: "/en/solutions/integrations",
        },
      ],
    },
    {
      label: "Operations",
      title: "Analytics and management",
      capabilities: [
        {
          title: "Advanced analytics",
          summary:
            "We turn data into explainable indicators, detect anomalies and prepare the basis for timely action.",
          linkLabel: "Explore analytics",
          href: "/en/solutions/advanced-analytics",
        },
        {
          title: "NOC and managed services",
          summary:
            "We monitor devices, networks and the complete data path while providing support and operational management.",
          linkLabel: "Explore managed services",
          href: "/en/solutions/managed-services",
        },
      ],
    },
  ],
} satisfies Record<Locale, HomeCapabilityLayer[]>;

export type HomeNexaviaContent = {
  title: string;
  description: string;
  emphasis: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  capabilities: string[];
  previewAlt: string;
  previewOpenLabel: string;
  previewCloseLabel: string;
};

export const homeNexavia = {
  sl: {
    title: "Vsi podatki. Enoten operativni pregled.",
    description:
      "Nexavia poveže podatke s terena, komunikacijska omrežja, zunanje sisteme in uporabnike v eno okolje za spremljanje, analitiko in operativno delo.",
    emphasis: "NEXAVIA · OPERATIVNA PLATFORMA",
    primaryLabel: "Spoznajte Nexavio",
    primaryHref: "/nexavia",
    secondaryLabel: "Dogovorite se za predstavitev",
    secondaryHref: "/kontakt",
    capabilities: [
      "Pregled in KPI",
      "Alarmi in dogodki",
      "Zemljevidi naprav",
      "Poročila in integracije",
    ],
    previewAlt:
      "Nexavia Network Operations Center z zemljevidom naprav, stanjem prehodov, alarmi in kakovostjo podatkov",
    previewOpenLabel: "Odprite povečani predogled",
    previewCloseLabel: "Zaprite povečani predogled",
  },
  en: {
    title: "All data. One operational view.",
    description:
      "Nexavia connects field data, communication networks, external systems and users in one environment for monitoring, analytics and operational work.",
    emphasis: "NEXAVIA · OPERATIONAL PLATFORM",
    primaryLabel: "Explore Nexavia",
    primaryHref: "/en/nexavia",
    secondaryLabel: "Book a presentation",
    secondaryHref: "/en/contact",
    capabilities: [
      "Overview and KPIs",
      "Alarms and events",
      "Device maps",
      "Reports and integrations",
    ],
    previewAlt:
      "Nexavia Network Operations Center with a device map, gateway status, alarms and data quality",
    previewOpenLabel: "Open enlarged preview",
    previewCloseLabel: "Close enlarged preview",
  },
} satisfies Record<Locale, HomeNexaviaContent>;

export type HomeKaiContent = {
  slogan: string;
  title: string;
  description: string;
  confirmation: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  panelLabel: string;
  integrationLabel: string;
  questionLabel: string;
  question: string;
  observationLabel: string;
  observationMeta: string;
  observation: string;
  inferenceLabel: string;
  inferenceMeta: string;
  inference: string;
  supportLabel: string;
  supportSources: string[];
  recommendationLabel: string;
  recommendation: string;
  approvalStatus: string;
  reviewLabel: string;
};

export const homeKai = {
  sl: {
    slogan: "ASK. UNDERSTAND. ACT.",
    title: "Analizira. Pojasni. Priporoči.",
    description:
      "KAI poveže vprašanje z razpoložljivimi podatki, dokumentacijo in operativnim kontekstom. Loči opažanja od možnih sklepov, pokaže podporne informacije in predlaga naslednji korak.",
    confirmation:
      "Pred izvedbo pomembnega ukrepa KAI vedno zahteva potrditev uporabnika.",
    primaryLabel: "Spoznajte KAI",
    primaryHref: "/kai",
    secondaryLabel: "Dogovorite se za predstavitev",
    secondaryHref: "/kontakt",
    panelLabel: "PRIMER OPERATIVNEGA ODGOVORA",
    integrationLabel: "Works with Nexavia",
    questionLabel: "VPRAŠANJE",
    question: "Zakaj podatki iz izbranega območja niso popolni?",
    observationLabel: "OPAŽANJE",
    observationMeta: "Na podlagi razpoložljivih podatkov",
    observation:
      "Del virov v izbranem obdobju ni poslal pričakovanih podatkov.",
    inferenceLabel: "MOŽEN VZROK",
    inferenceMeta: "Možen sklep, ne potrjeno dejstvo",
    inference: "Vzorec kaže na možno težavo v skupni komunikacijski poti.",
    supportLabel: "PODPORNE INFORMACIJE",
    supportSources: [
      "čas zadnjega sprejema",
      "stanje komunikacijskega prehoda",
      "zgodovina povezanih dogodkov",
    ],
    recommendationLabel: "PREDLAGANI KORAK",
    recommendation:
      "Preverite stanje prehoda in zadnje omrežne dogodke za izbrano območje.",
    approvalStatus: "Pred izvedbo je potrebna potrditev uporabnika.",
    reviewLabel: "Preglej predlog",
  },
  en: {
    slogan: "ASK. UNDERSTAND. ACT.",
    title: "Analyze. Explain. Recommend.",
    description:
      "KAI connects a question with available data, documentation and operational context. It distinguishes observations from possible inferences, shows supporting information and recommends the next step.",
    confirmation:
      "Before an important action is carried out, KAI always requires user confirmation.",
    primaryLabel: "Explore KAI",
    primaryHref: "/en/kai",
    secondaryLabel: "Book a presentation",
    secondaryHref: "/en/contact",
    panelLabel: "OPERATIONAL RESPONSE EXAMPLE",
    integrationLabel: "Works with Nexavia",
    questionLabel: "QUESTION",
    question: "Why is data from the selected area incomplete?",
    observationLabel: "OBSERVATION",
    observationMeta: "Based on available data",
    observation:
      "Some sources did not send the expected data during the selected period.",
    inferenceLabel: "POSSIBLE CAUSE",
    inferenceMeta: "Possible inference, not a confirmed fact",
    inference:
      "The pattern suggests a possible issue in the shared communication path.",
    supportLabel: "SUPPORTING INFORMATION",
    supportSources: [
      "time of last receipt",
      "communication gateway status",
      "history of related events",
    ],
    recommendationLabel: "SUGGESTED STEP",
    recommendation:
      "Check the gateway status and latest network events for the selected area.",
    approvalStatus: "User confirmation is required before execution.",
    reviewLabel: "Review suggestion",
  },
} satisfies Record<Locale, HomeKaiContent>;

export type HomeDeliveryPhase = {
  label: string;
  title: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
};

export type HomeDeliveryContent = {
  eyebrow: string;
  title: string;
  introduction: string;
  phases: HomeDeliveryPhase[];
};

export const homeDelivery = {
  sl: {
    eyebrow: "IZVEDBENI MODEL",
    title: "Od operativnega izziva do stalnega izboljševanja.",
    introduction:
      "Vsak projekt vodimo od razumevanja okolja in izbire arhitekture do uvedbe, preverjanja ter dolgoročnega upravljanja.",
    phases: [
      {
        label: "RAZUMEMO",
        title: "Cilj in arhitektura",
        steps: [
          {
            title: "Operativni izziv",
            description:
              "Skupaj opredelimo cilj, uporabnike, omejitve in pričakovani operativni rezultat.",
          },
          {
            title: "Arhitektura in izvedbeni model",
            description:
              "Določimo podatkovne vire, komunikacijsko pot, integracije, varnost ter najprimernejši način uvedbe.",
          },
        ],
      },
      {
        label: "IZVEDEMO",
        title: "Povezava in uvedba",
        steps: [
          {
            title: "Zajem in povezljivost",
            description:
              "Vzpostavimo naprave, komunikacijsko omrežje in zanesljiv prenos podatkov od terena do platforme.",
          },
          {
            title: "Integracije in avtomatizacija",
            description:
              "Platformo povežemo z obstoječimi sistemi in uvedemo dogovorjene operativne procese.",
          },
        ],
      },
      {
        label: "UPRAVLJAMO",
        title: "Preverjanje in izboljšave",
        steps: [
          {
            title: "Uvedba in preverjanje",
            description:
              "Sistem namestimo, preizkusimo, dokumentiramo ter uporabnike pripravimo na operativno delo.",
          },
          {
            title: "Upravljanje in izboljšave",
            description:
              "Spremljamo delovanje, odpravljamo odstopanja in rešitev prilagajamo novim potrebam.",
          },
        ],
      },
    ],
  },
  en: {
    eyebrow: "DELIVERY MODEL",
    title: "From operational challenge to continuous improvement.",
    introduction:
      "We guide every project from understanding the environment and defining the architecture to implementation, verification and long-term operation.",
    phases: [
      {
        label: "UNDERSTAND",
        title: "Objective and architecture",
        steps: [
          {
            title: "Operational challenge",
            description:
              "Together, we define the objective, users, constraints and expected operational outcome.",
          },
          {
            title: "Architecture and delivery model",
            description:
              "We define the data sources, communication path, integrations, security and most appropriate deployment approach.",
          },
        ],
      },
      {
        label: "DELIVER",
        title: "Connection and deployment",
        steps: [
          {
            title: "Data acquisition and connectivity",
            description:
              "We establish devices, the communication network and reliable data transfer from the field to the platform.",
          },
          {
            title: "Integrations and automation",
            description:
              "We connect the platform to existing systems and introduce the agreed operational processes.",
          },
        ],
      },
      {
        label: "OPERATE",
        title: "Verification and improvement",
        steps: [
          {
            title: "Deployment and verification",
            description:
              "We install, test and document the system and prepare users for operational work.",
          },
          {
            title: "Operation and improvement",
            description:
              "We monitor performance, resolve deviations and adapt the solution to new requirements.",
          },
        ],
      },
    ],
  },
} satisfies Record<Locale, HomeDeliveryContent>;

export type HomeClosingCtaContent = {
  title: string;
  description: string;
  label: string;
  href: string;
};

export const homeClosingCta = {
  sl: {
    title: "Povežimo podatke z odločitvami.",
    description:
      "Povejte nam, kaj želite spremljati, povezati ali izboljšati. Skupaj bomo določili smiselno podatkovno pot in izvedbeni model.",
    label: "Začnimo pogovor",
    href: "/kontakt",
  },
  en: {
    title: "Let’s connect data with decisions.",
    description:
      "Tell us what you want to monitor, connect or improve. Together, we will define a meaningful data path and delivery model.",
    label: "Start a conversation",
    href: "/en/contact",
  },
} satisfies Record<Locale, HomeClosingCtaContent>;

export type FooterLink = {
  label: string;
  href: string;
};

export type FooterProductLink = FooterLink & {
  description: string;
};

export type FooterContent = {
  slogan: string;
  description: string;
  solutionsTitle: string;
  solutions: FooterLink[];
  productsTitle: string;
  products: FooterProductLink[];
  companyTitle: string;
  company: FooterLink[];
  contactTitle: string;
  email: string;
  contactLabel: string;
  contactHref: string;
  privacyLabel: string;
  privacyHref: string;
  copyright: string;
  navigationLabel: string;
  languageLabel: string;
  homeLabel: string;
};

export const footerContent = {
  sl: {
    slogan: "Od naprave do odločitve.",
    description:
      "Digitalizacija in upravljanje infrastrukture od zajema podatkov do napredne analitike.",
    solutionsTitle: "REŠITVE",
    solutions: [
      { label: "Zajem podatkov", href: "/resitve/zajem-podatkov" },
      { label: "Povezljivost", href: "/resitve/povezljivost" },
      { label: "Integracije", href: "/resitve/integracije" },
      { label: "Napredna analitika", href: "/resitve/napredna-analitika" },
      {
        label: "Upravljane storitve",
        href: "/resitve/upravljane-storitve",
      },
      { label: "Vse rešitve", href: "/resitve" },
    ],
    productsTitle: "PRODUKTI",
    products: [
      {
        label: "Nexavia",
        description: "Operativna podatkovna platforma",
        href: "/nexavia",
      },
      {
        label: "KAI",
        description: "Operativni pomočnik",
        href: "/kai",
      },
    ],
    companyTitle: "PODJETJE",
    company: [
      { label: "Panoge", href: "/panoge" },
      { label: "O nas", href: "/o-nas" },
      { label: "Zasebnost", href: "/zasebnost" },
    ],
    contactTitle: "KONTAKT",
    email: "info@kuem.si",
    contactLabel: "Kontaktirajte nas",
    contactHref: "/kontakt",
    privacyLabel: "Zasebnost",
    privacyHref: "/zasebnost",
    copyright: "Vse pravice pridržane.",
    navigationLabel: "Navigacija v nogi strani",
    languageLabel: "Izbira jezika",
    homeLabel: "KUEM – domača stran",
  },
  en: {
    slogan: "From device to decision.",
    description:
      "Digitalization and infrastructure management from data acquisition to advanced analytics.",
    solutionsTitle: "SOLUTIONS",
    solutions: [
      { label: "Data acquisition", href: "/en/solutions/data-acquisition" },
      { label: "Connectivity", href: "/en/solutions/connectivity" },
      { label: "Integrations", href: "/en/solutions/integrations" },
      {
        label: "Advanced analytics",
        href: "/en/solutions/advanced-analytics",
      },
      { label: "Managed services", href: "/en/solutions/managed-services" },
      { label: "All solutions", href: "/en/solutions" },
    ],
    productsTitle: "PRODUCTS",
    products: [
      {
        label: "Nexavia",
        description: "Operational data platform",
        href: "/en/nexavia",
      },
      {
        label: "KAI",
        description: "Operational assistant",
        href: "/en/kai",
      },
    ],
    companyTitle: "COMPANY",
    company: [
      { label: "Industries", href: "/en/industries" },
      { label: "About", href: "/en/company" },
      { label: "Privacy", href: "/en/privacy" },
    ],
    contactTitle: "CONTACT",
    email: "info@kuem.si",
    contactLabel: "Contact us",
    contactHref: "/en/contact",
    privacyLabel: "Privacy",
    privacyHref: "/en/privacy",
    copyright: "All rights reserved.",
    navigationLabel: "Footer navigation",
    languageLabel: "Language selection",
    homeLabel: "KUEM – home page",
  },
} satisfies Record<Locale, FooterContent>;
