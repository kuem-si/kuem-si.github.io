import type { Locale } from "../lib/i18n";
import { COMPANY_EMAIL } from "./company";
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
      tech: ["KPIs", "alarms", "reports", "Near-real-time monitoring"],
    },
    {
      slug: "managed-services",
      title: "Managed services",
      summary:
        "Data-path monitoring, user support and continuous improvement of the operational environment.",
      tech: ["NOC", "support", "monitoring", "improvement"],
    },
  ],
  de: [
    {
      slug: "datenerfassung",
      title: "Datenerfassung",
      summary:
        "Zuverlässige Erfassung aus Zählern, Sensoren, Maschinen und bestehenden Steuerungssystemen.",
      tech: ["wM-Bus", "LoRaWAN", "NB-IoT", "Modbus TCP"],
    },
    {
      slug: "konnektivitaet",
      title: "Konnektivität",
      summary:
        "Ein Kommunikationsweg, ausgewählt nach Umgebung, Reichweite, Energieverbrauch und Verfügbarkeit.",
      tech: ["LoRaWAN", "NB-IoT", "MQTT", "IP-Netze"],
    },
    {
      slug: "integrationen",
      title: "Integrationen und Automatisierung",
      summary:
        "Wir verbinden Daten mit bestehenden Geschäfts- und Betriebssystemen, ohne bewährte Investitionen zu ersetzen.",
      tech: ["REST API", "MQTT", "SCADA", "ERP"],
    },
    {
      slug: "erweiterte-analytik",
      title: "Erweiterte Analytik",
      summary:
        "Aus Betriebsdaten machen wir nachvollziehbare Kennzahlen, Ereignisse und eine Grundlage zum Handeln.",
      tech: ["KPIs", "Alarme", "Berichte", "Überwachung nahezu in Echtzeit"],
    },
    {
      slug: "managed-services",
      title: "Managed Services",
      summary:
        "Überwachung des Datenpfads, Anwenderunterstützung und kontinuierliche Verbesserung der Betriebsumgebung.",
      tech: ["NOC", "Support", "Überwachung", "Verbesserung"],
    },
  ],
} satisfies Record<
  Locale,
  { slug: string; title: string; summary: string; tech: string[] }[]
>;

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
  de: [
    "Energie und Versorgung",
    "Industrie und Fertigung",
    "Gebäude, Handel und Logistik",
    "Städte und Umwelt",
    "Tourismus, Campingplätze und Marinas",
    "Verteilte und abgelegene Infrastruktur",
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
  de: [
    {
      title: "Energie und Versorgung",
      summary:
        "Wir führen Verbrauchsmessungen, Netzzustand, Alarme und Ereignisse in einer einheitlichen Betriebsübersicht zusammen.",
      terms: ["Messungen", "Netz", "Abweichungen"],
    },
    {
      title: "Industrie und Fertigung",
      summary:
        "Wir verbinden Maschinen, Prozesssignale und Energieverbrauch für eine zuverlässigere Produktionssteuerung.",
      terms: ["Prozesse", "Energie", "Instandhaltung"],
    },
    {
      title: "Gebäude, Handel und Logistik",
      summary:
        "Wir überwachen Energieverbrauch, Raumbedingungen und den Betrieb der Ausstattung an einem oder mehreren Standorten.",
      terms: ["Energie", "Bedingungen", "Ausstattung"],
    },
    {
      title: "Städte und Umwelt",
      summary:
        "Wir verbinden Umwelt-, Verkehrs- und Infrastrukturdaten für schnellere operative Reaktionen.",
      terms: ["Umwelt", "Verkehr", "Infrastruktur"],
    },
    {
      title: "Tourismus, Campingplätze und Marinas",
      summary:
        "Wir führen Verbrauch, Zugänge, Ausstattung und Services für ein effizienteres Standortmanagement zusammen.",
      terms: ["Verbrauch", "Zugänge", "Services"],
    },
    {
      title: "Verteilte und abgelegene Infrastruktur",
      summary:
        "Wir ermöglichen die Fernüberwachung von Geräten und Standorten ohne ständige Präsenz vor Ort.",
      terms: ["Fernüberwachung", "Alarme", "Konnektivität"],
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
  de: [
    {
      title: "Erfassung",
      summary:
        "Wir erfassen Daten aus Geräten, Sensoren, Zählern und bestehenden Systemen im Feld.",
      href: "/de/loesungen/datenerfassung",
      label: "Dateneingang",
    },
    {
      title: "Konnektivität",
      summary:
        "Für jede Umgebung wählen wir einen zuverlässigen Kommunikationsweg – unabhängig von einer einzelnen Technologie oder einem Hersteller.",
      href: "/de/loesungen/konnektivitaet",
    },
    {
      title: "Übertragung und Verarbeitung",
      summary:
        "Wir empfangen, prüfen und normalisieren Daten und bereiten sie mit geringer Verzögerung für die weitere Nutzung auf.",
      href: "/de/nexavia",
    },
    {
      title: "Integrationen",
      summary:
        "Wir verbinden den Datenpfad mit bestehenden Geschäfts-, Abrechnungs-, Leit- und weiteren Systemen.",
      href: "/de/loesungen/integrationen",
    },
    {
      title: "Erweiterte Analytik",
      summary:
        "Wir erkennen Abweichungen, vergleichen Verhalten und ergänzen Daten um Kontext, damit Ereignisse leichter verständlich sind.",
      href: "/de/loesungen/erweiterte-analytik",
    },
    {
      title: "Entscheidung und Maßnahme",
      summary:
        "Wir machen aus Informationen einen klaren nächsten Schritt, eine Warnung, eine bestätigte Aktion oder einen automatisierten Prozess.",
      href: "/de/kai",
      label: "Operatives Ergebnis",
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
  de: [
    {
      label: "Feld",
      title: "Feld und Geräte",
      capabilities: [
        {
          title: "Datenerfassung",
          summary:
            "Wir verbinden Zähler, Sensoren, Maschinen und bestehende Steuerungssysteme zu einer zuverlässigen Quelle für Betriebsdaten.",
          linkLabel: "Datenerfassung ansehen",
          href: "/de/loesungen/datenerfassung",
        },
        {
          title: "Konnektivität",
          summary:
            "Wir wählen den Kommunikationsweg nach Umgebung, Reichweite, Energieverbrauch und geforderter Verfügbarkeit.",
          linkLabel: "Konnektivität ansehen",
          href: "/de/loesungen/konnektivitaet",
        },
      ],
    },
    {
      label: "Plattform",
      title: "Plattform und Integrationen",
      capabilities: [
        {
          title: "Nexavia Betriebsplattform",
          summary:
            "Nexavia vereint Übersicht, Ereignisse, Alarme, Berichtswesen und Feldarbeit in einer gemeinsamen Betriebsumgebung.",
          linkLabel: "Nexavia entdecken",
          href: "/de/nexavia",
        },
        {
          title: "Integrationen und Automatisierung",
          summary:
            "Wir verbinden Daten mit Geschäfts-, Abrechnungs- und Leitsystemen und automatisieren vereinbarte Prozesse.",
          linkLabel: "Integrationen ansehen",
          href: "/de/loesungen/integrationen",
        },
      ],
    },
    {
      label: "Betrieb",
      title: "Analytik und Management",
      capabilities: [
        {
          title: "Erweiterte Analytik",
          summary:
            "Wir machen aus Daten nachvollziehbare Kennzahlen, erkennen Abweichungen und schaffen die Grundlage für rechtzeitiges Handeln.",
          linkLabel: "Analytik ansehen",
          href: "/de/loesungen/erweiterte-analytik",
        },
        {
          title: "NOC und Managed Services",
          summary:
            "Wir überwachen Geräte, Netze und den gesamten Datenpfad und bieten Support sowie operatives Management.",
          linkLabel: "Managed Services ansehen",
          href: "/de/loesungen/managed-services",
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
  de: {
    title: "Alle Daten. Eine operative Übersicht.",
    description:
      "Nexavia verbindet Felddaten, Kommunikationsnetze, externe Systeme und Anwender in einer Umgebung für Überwachung, Analytik und operative Arbeit.",
    emphasis: "NEXAVIA · BETRIEBSPLATTFORM",
    primaryLabel: "Nexavia entdecken",
    primaryHref: "/de/nexavia",
    secondaryLabel: "Präsentation vereinbaren",
    secondaryHref: "/de/kontakt",
    capabilities: [
      "Übersicht und KPIs",
      "Alarme und Ereignisse",
      "Gerätekarten",
      "Berichte und Integrationen",
    ],
    previewAlt:
      "Nexavia Network Operations Center mit Gerätekarte, Gateway-Status, Alarmen und Datenqualität",
    previewOpenLabel: "Vergrößerte Vorschau öffnen",
    previewCloseLabel: "Vergrößerte Vorschau schließen",
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
    integrationLabel: "Deluje z Nexavio",
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
  de: {
    slogan: "ASK. UNDERSTAND. ACT.",
    title: "Analysiert. Erklärt. Empfiehlt.",
    description:
      "KAI verbindet eine Frage mit verfügbaren Daten, Dokumentation und betrieblichem Kontext. Er unterscheidet Beobachtungen von möglichen Schlussfolgerungen, zeigt unterstützende Informationen und schlägt den nächsten Schritt vor.",
    confirmation:
      "Bevor eine wichtige Maßnahme ausgeführt wird, verlangt KAI immer eine Bestätigung durch den Anwender.",
    primaryLabel: "KAI entdecken",
    primaryHref: "/de/kai",
    secondaryLabel: "Präsentation vereinbaren",
    secondaryHref: "/de/kontakt",
    panelLabel: "BEISPIEL EINER OPERATIVEN ANTWORT",
    integrationLabel: "Arbeitet mit Nexavia",
    questionLabel: "FRAGE",
    question: "Warum sind die Daten aus dem ausgewählten Gebiet unvollständig?",
    observationLabel: "BEOBACHTUNG",
    observationMeta: "Auf Basis der verfügbaren Daten",
    observation:
      "Ein Teil der Quellen hat im ausgewählten Zeitraum nicht die erwarteten Daten gesendet.",
    inferenceLabel: "MÖGLICHE URSACHE",
    inferenceMeta: "Mögliche Schlussfolgerung, keine bestätigte Tatsache",
    inference:
      "Das Muster deutet auf ein mögliches Problem im gemeinsamen Kommunikationsweg hin.",
    supportLabel: "UNTERSTÜTZENDE INFORMATIONEN",
    supportSources: [
      "Zeitpunkt des letzten Empfangs",
      "Status des Kommunikations-Gateways",
      "Verlauf zugehöriger Ereignisse",
    ],
    recommendationLabel: "VORGESCHLAGENER SCHRITT",
    recommendation:
      "Prüfen Sie den Gateway-Status und die letzten Netzereignisse für das ausgewählte Gebiet.",
    approvalStatus:
      "Vor der Ausführung ist eine Bestätigung des Anwenders erforderlich.",
    reviewLabel: "Vorschlag prüfen",
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
  de: {
    eyebrow: "UMSETZUNGSMODELL",
    title:
      "Von der operativen Herausforderung zur kontinuierlichen Verbesserung.",
    introduction:
      "Wir begleiten jedes Projekt vom Verständnis der Umgebung und der Wahl der Architektur über die Einführung und Prüfung bis zum langfristigen Betrieb.",
    phases: [
      {
        label: "VERSTEHEN",
        title: "Ziel und Architektur",
        steps: [
          {
            title: "Operative Herausforderung",
            description:
              "Gemeinsam definieren wir Ziel, Anwender, Rahmenbedingungen und das erwartete operative Ergebnis.",
          },
          {
            title: "Architektur und Umsetzungsmodell",
            description:
              "Wir legen Datenquellen, Kommunikationsweg, Integrationen, Sicherheit und den passendsten Einführungsweg fest.",
          },
        ],
      },
      {
        label: "UMSETZEN",
        title: "Anbindung und Einführung",
        steps: [
          {
            title: "Erfassung und Konnektivität",
            description:
              "Wir richten Geräte, das Kommunikationsnetz und eine zuverlässige Datenübertragung vom Feld zur Plattform ein.",
          },
          {
            title: "Integrationen und Automatisierung",
            description:
              "Wir verbinden die Plattform mit bestehenden Systemen und führen die vereinbarten Betriebsprozesse ein.",
          },
        ],
      },
      {
        label: "BETREIBEN",
        title: "Prüfung und Verbesserung",
        steps: [
          {
            title: "Einführung und Prüfung",
            description:
              "Wir installieren, testen und dokumentieren das System und bereiten die Anwender auf den operativen Einsatz vor.",
          },
          {
            title: "Betrieb und Verbesserung",
            description:
              "Wir überwachen den Betrieb, beheben Abweichungen und passen die Lösung an neue Anforderungen an.",
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
  de: {
    title: "Verbinden wir Daten mit Entscheidungen.",
    description:
      "Sagen Sie uns, was Sie überwachen, verbinden oder verbessern möchten. Gemeinsam legen wir einen sinnvollen Datenpfad und ein passendes Umsetzungsmodell fest.",
    label: "Gespräch beginnen",
    href: "/de/kontakt",
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
  languageLabel: string;
  socialLabel: string;
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
    email: COMPANY_EMAIL,
    contactLabel: "Kontaktirajte nas",
    contactHref: "/kontakt",
    privacyLabel: "Zasebnost",
    privacyHref: "/zasebnost",
    copyright: "Vse pravice pridržane.",
    languageLabel: "Izbira jezika",
    socialLabel: "KUEM na družbenih omrežjih",
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
    email: COMPANY_EMAIL,
    contactLabel: "Contact us",
    contactHref: "/en/contact",
    privacyLabel: "Privacy",
    privacyHref: "/en/privacy",
    copyright: "All rights reserved.",
    languageLabel: "Language selection",
    socialLabel: "KUEM on social media",
    homeLabel: "KUEM – home page",
  },
  de: {
    slogan: "Vom Gerät zur Entscheidung.",
    description:
      "Digitalisierung und Management von Infrastruktur – von der Datenerfassung bis zur erweiterten Analytik.",
    solutionsTitle: "LÖSUNGEN",
    solutions: [
      { label: "Datenerfassung", href: "/de/loesungen/datenerfassung" },
      { label: "Konnektivität", href: "/de/loesungen/konnektivitaet" },
      { label: "Integrationen", href: "/de/loesungen/integrationen" },
      {
        label: "Erweiterte Analytik",
        href: "/de/loesungen/erweiterte-analytik",
      },
      { label: "Managed Services", href: "/de/loesungen/managed-services" },
      { label: "Alle Lösungen", href: "/de/loesungen" },
    ],
    productsTitle: "PRODUKTE",
    products: [
      {
        label: "Nexavia",
        description: "Operative Datenplattform",
        href: "/de/nexavia",
      },
      {
        label: "KAI",
        description: "Operativer Assistent",
        href: "/de/kai",
      },
    ],
    companyTitle: "UNTERNEHMEN",
    company: [
      { label: "Branchen", href: "/de/branchen" },
      { label: "Über uns", href: "/de/unternehmen" },
      { label: "Datenschutz", href: "/de/datenschutz" },
    ],
    contactTitle: "KONTAKT",
    email: COMPANY_EMAIL,
    contactLabel: "Kontaktieren Sie uns",
    contactHref: "/de/kontakt",
    privacyLabel: "Datenschutz",
    privacyHref: "/de/datenschutz",
    copyright: "Alle Rechte vorbehalten.",
    languageLabel: "Sprachauswahl",
    socialLabel: "KUEM in sozialen Netzwerken",
    homeLabel: "KUEM – Startseite",
  },
} satisfies Record<Locale, FooterContent>;
