import utilityIcon from "../assets/icons/industries/01-komunala-in-energija.svg";
import infrastructureIcon from "../assets/icons/industries/02-javna-infrastruktura.svg";
import environmentIcon from "../assets/icons/industries/03-okolje.svg";
import industryIcon from "../assets/icons/industries/04-industrija.svg";
import mobilityIcon from "../assets/icons/industries/05-mobilnost.svg";
import tourismIcon from "../assets/icons/industries/06-turizem.svg";

export type Industry = {
  id: string;
  name: string;
  icon: string;
  eyebrow: string;
  description: string;
  watch: string[];
  gain: string[];
  references: string;
  metrics: [string, string, string];
  metricValues: [string, string, string];
  events: string;
  map: string;
};

export const industryExplorer: Industry[] = [
  {
    id: "komunala-in-energija",
    name: "Komunala in energija",
    icon: utilityIcon.src,
    eyebrow: "VODA · PLIN · ELEKTRIKA",
    description:
      "Združimo meritve vode, plina in elektrike ter odgovornim omogočimo enoten pregled porabe, stanja omrežja in pomembnih odstopanj.",
    watch: ["Porabo", "Pretok in tlak", "Kakovost", "Stanje naprav", "Alarme"],
    gain: [
      "Enoten pregled energentov",
      "Pravočasno zaznana odstopanja",
      "Primerjavo lokacij in obdobij",
    ],
    references: "Domplan · Brezovica · Sombor",
    metrics: ["Voda", "Plin", "Elektrika"],
    metricValues: ["12.480", "286", "1.124"],
    events: "Odstopanje porabe",
    map: "Stanje omrežja",
  },
  {
    id: "javna-infrastruktura",
    name: "Javna infrastruktura",
    icon: infrastructureIcon.src,
    eyebrow: "RAZSVETLJAVA · CESTE · MOSTOVI · OBJEKTI",
    description:
      "Na enem mestu spremljamo razpršeno javno infrastrukturo – od javne razsvetljave do cest, mostov, objektov in drugih naprav v prostoru.",
    watch: [
      "Stanje naprav in objektov",
      "Porabo energije",
      "Napake in alarme",
      "Lokacije in dogodke",
      "Vzdrževalne posege",
    ],
    gain: [
      "Pregled infrastrukture na zemljevidu",
      "Hitrejše določanje prioritet",
      "Sledljivo zgodovino dogodkov in posegov",
    ],
    references: "Krk",
    metrics: ["Svetilke", "Objekti", "Dogodki"],
    metricValues: ["1.200", "24", "3"],
    events: "Odprt dogodek",
    map: "Infrastruktura na zemljevidu",
  },
  {
    id: "okolje",
    name: "Okolje",
    icon: environmentIcon.src,
    eyebrow: "ZRAK · HRUP · TEMPERATURA · VODOSTAJ",
    description:
      "Okoljske meritve združimo v pregleden zemljevid in časovne prikaze, ki omogočajo spremljanje stanja ter pravočasno zaznavanje preseženih vrednosti.",
    watch: [
      "Kakovost zraka in onesnaževala",
      "Temperaturo in vlago",
      "Hrup",
      "Vodostaje",
      "Trende po lokacijah",
    ],
    gain: [
      "Pregled meritev po lokacijah",
      "Opozorila ob preseženih pragovih",
      "Primerjavo obdobij in območij",
    ],
    references: "Gradiška",
    metrics: ["Kakovost zraka", "Temperatura", "Hrup"],
    metricValues: ["42 AQI", "22 °C", "51 dB"],
    events: "Presežen prag",
    map: "Okoljska merilna mesta",
  },
  {
    id: "industrija",
    name: "Industrija",
    icon: industryIcon.src,
    eyebrow: "ENERGIJA · PROCESI · POGOJI V PROSTORU",
    description:
      "Energetske in procesne podatke proizvodnega okolja združimo v pregled, ki pomaga zaznati odstopanja ter razumeti porabo po lokacijah, oddelkih ali napravah.",
    watch: [
      "Elektriko, plin in vodo",
      "Moč in konice",
      "Temperaturo in vlago",
      "Stanje naprav",
      "Nenavadna odstopanja",
    ],
    gain: [
      "Pregled porabe po območjih",
      "Pravočasna opozorila",
      "Podatke za načrtovanje izboljšav",
    ],
    references: "Adria Mobil",
    metrics: ["Elektrika", "Plin", "Voda"],
    metricValues: ["1.124", "286", "12.480"],
    events: "Zaznano odstopanje",
    map: "Proizvodna območja",
  },
  {
    id: "mobilnost",
    name: "Mobilnost",
    icon: mobilityIcon.src,
    eyebrow: "KOLESARJI · PEŠCI · PROMETNI TOKOVI",
    description:
      "Podatke števcev, občinskih sistemov in zunanjih virov združimo v prikaz uporabe kolesarskih povezav, pešpoti in drugih prometnih poti.",
    watch: [
      "Število zaznanih prehodov",
      "Intenzivnost uporabe poti",
      "Časovne konice",
      "Najbolj obremenjene odseke",
      "Spremembe med obdobji",
    ],
    gain: [
      "Toplotne karte uporabe",
      "Boljšo podlago za določanje prioritet",
      "Primerjavo stanja pred in po ukrepu",
    ],
    references: "Novo mesto",
    metrics: ["Kolesarji", "Pešci", "Časovne konice"],
    metricValues: ["1.248", "846", "07–09"],
    events: "Sprememba intenzivnosti",
    map: "Uporaba prometnih poti",
  },
  {
    id: "turizem",
    name: "Turizem",
    icon: tourismIcon.src,
    eyebrow: "MARINE · KAMPI",
    description:
      "V marinah in kampih povežemo meritve porabe, stanje priključkov in okoljske podatke ter upravljavcu omogočimo pregled po parcelah, privezih in skupnih objektih.",
    watch: [
      "Porabo vode in elektrike",
      "Stanje priključkov",
      "Alarme in nepravilnosti",
      "Okoljske pogoje",
      "Skupne tehnične objekte",
    ],
    gain: [
      "Pregled porabe po parceli ali privezu",
      "Pravočasno obravnavo nepravilnosti",
      "Manj ročnega preverjanja na terenu",
    ],
    references: "PRIMER UPORABE · MARINE IN KAMPI",
    metrics: ["Voda", "Elektrika", "Priključki"],
    metricValues: ["12.480", "1.124", "36"],
    events: "Tehnično opozorilo",
    map: "Marina in kamp",
  },
];

const englishIndustryCopy: Record<
  string,
  Omit<Industry, "id" | "icon" | "metricValues">
> = {
  "komunala-in-energija": {
    name: "Utilities and energy",
    eyebrow: "WATER · GAS · ELECTRICITY",
    description:
      "We combine water, gas and electricity measurements to provide a unified view of consumption, network status and significant deviations.",
    watch: [
      "Consumption",
      "Flow and pressure",
      "Quality",
      "Device status",
      "Alerts",
    ],
    gain: [
      "Unified overview of utilities",
      "Timely deviation detection",
      "Comparison of locations and periods",
    ],
    references: "Domplan · Brezovica · Sombor",
    metrics: ["Water", "Gas", "Electricity"],
    events: "Consumption deviation",
    map: "Network status",
  },
  "javna-infrastruktura": {
    name: "Public infrastructure",
    eyebrow: "LIGHTING · ROADS · BRIDGES · FACILITIES",
    description:
      "We monitor distributed public infrastructure in one place, from public lighting to roads, bridges, facilities and other field assets.",
    watch: [
      "Device and facility status",
      "Energy consumption",
      "Faults and alerts",
      "Locations and events",
      "Maintenance work",
    ],
    gain: [
      "Map-based infrastructure overview",
      "Faster prioritization",
      "Traceable event and maintenance history",
    ],
    references: "Krk",
    metrics: ["Lights", "Facilities", "Events"],
    events: "Open event",
    map: "Infrastructure map",
  },
  okolje: {
    name: "Environment",
    eyebrow: "AIR · NOISE · TEMPERATURE · WATER LEVEL",
    description:
      "We combine environmental measurements in clear maps and timelines for continuous monitoring and timely threshold detection.",
    watch: [
      "Air quality and pollutants",
      "Temperature and humidity",
      "Noise",
      "Water levels",
      "Location trends",
    ],
    gain: [
      "Measurements by location",
      "Threshold alerts",
      "Comparison of periods and areas",
    ],
    references: "Gradiška",
    metrics: ["Air quality", "Temperature", "Noise"],
    events: "Threshold exceeded",
    map: "Environmental monitoring sites",
  },
  industrija: {
    name: "Industry",
    eyebrow: "ENERGY · PROCESSES · INDOOR CONDITIONS",
    description:
      "We combine energy and process data from production environments to detect deviations and understand consumption by site, department or device.",
    watch: [
      "Electricity, gas and water",
      "Power and peaks",
      "Temperature and humidity",
      "Device status",
      "Unusual deviations",
    ],
    gain: [
      "Consumption by area",
      "Timely alerts",
      "Data for improvement planning",
    ],
    references: "Adria Mobil",
    metrics: ["Electricity", "Gas", "Water"],
    events: "Deviation detected",
    map: "Production areas",
  },
  mobilnost: {
    name: "Mobility",
    eyebrow: "CYCLISTS · PEDESTRIANS · TRAFFIC FLOWS",
    description:
      "We combine counter data, municipal systems and external sources to show the use of cycling routes, footpaths and other transport links.",
    watch: [
      "Detected passages",
      "Route usage intensity",
      "Peak periods",
      "Busiest sections",
      "Changes between periods",
    ],
    gain: [
      "Usage heat maps",
      "Better prioritization",
      "Before-and-after comparison",
    ],
    references: "Novo mesto",
    metrics: ["Cyclists", "Pedestrians", "Peak periods"],
    events: "Intensity change",
    map: "Transport-route usage",
  },
  turizem: {
    name: "Tourism",
    eyebrow: "MARINAS · CAMPSITES",
    description:
      "In marinas and campsites, we connect consumption, utility-point status and environmental data for an overview by pitch, berth and shared facility.",
    watch: [
      "Water and electricity consumption",
      "Utility-point status",
      "Alerts and irregularities",
      "Environmental conditions",
      "Shared technical facilities",
    ],
    gain: [
      "Consumption by pitch or berth",
      "Timely handling of irregularities",
      "Less manual field checking",
    ],
    references: "USE CASE · MARINAS AND CAMPSITES",
    metrics: ["Water", "Electricity", "Connections"],
    events: "Technical alert",
    map: "Marina and campsite",
  },
};

export const industryExplorerEn: Industry[] = industryExplorer.map((item) => ({
  id: item.id,
  icon: item.icon,
  metricValues: item.metricValues.map((value) =>
    /^\d{1,3}(\.\d{3})+$/.test(value) ? value.replaceAll(".", ",") : value,
  ) as Industry["metricValues"],
  ...englishIndustryCopy[item.id],
}));

const germanIndustryCopy: Record<
  string,
  Omit<Industry, "id" | "icon" | "metricValues">
> = {
  "komunala-in-energija": {
    name: "Versorgung und Energie",
    eyebrow: "WASSER · GAS · STROM",
    description:
      "Wir führen Wasser-, Gas- und Strommessungen zusammen und bieten den Verantwortlichen eine einheitliche Übersicht über Verbrauch, Netzzustand und wesentliche Abweichungen.",
    watch: [
      "Verbrauch",
      "Durchfluss und Druck",
      "Qualität",
      "Gerätestatus",
      "Alarme",
    ],
    gain: [
      "Einheitliche Übersicht aller Medien",
      "Rechtzeitig erkannte Abweichungen",
      "Vergleich von Standorten und Zeiträumen",
    ],
    references: "Domplan · Brezovica · Sombor",
    metrics: ["Wasser", "Gas", "Strom"],
    events: "Verbrauchsabweichung",
    map: "Netzzustand",
  },
  "javna-infrastruktura": {
    name: "Öffentliche Infrastruktur",
    eyebrow: "BELEUCHTUNG · STRASSEN · BRÜCKEN · GEBÄUDE",
    description:
      "Wir überwachen verteilte öffentliche Infrastruktur an einem Ort – von der öffentlichen Beleuchtung bis zu Straßen, Brücken, Gebäuden und weiteren Anlagen im Raum.",
    watch: [
      "Zustand von Geräten und Gebäuden",
      "Energieverbrauch",
      "Störungen und Alarme",
      "Standorte und Ereignisse",
      "Wartungseinsätze",
    ],
    gain: [
      "Infrastrukturübersicht auf der Karte",
      "Schnellere Priorisierung",
      "Nachvollziehbare Ereignis- und Wartungshistorie",
    ],
    references: "Krk",
    metrics: ["Leuchten", "Gebäude", "Ereignisse"],
    events: "Offenes Ereignis",
    map: "Infrastruktur auf der Karte",
  },
  okolje: {
    name: "Umwelt",
    eyebrow: "LUFT · LÄRM · TEMPERATUR · WASSERSTAND",
    description:
      "Wir bündeln Umweltmessungen in übersichtlichen Karten und Zeitverläufen, um den Zustand zu überwachen und Grenzwertüberschreitungen rechtzeitig zu erkennen.",
    watch: [
      "Luftqualität und Schadstoffe",
      "Temperatur und Luftfeuchtigkeit",
      "Lärm",
      "Wasserstände",
      "Trends nach Standort",
    ],
    gain: [
      "Messwerte nach Standort",
      "Warnungen bei Grenzwertüberschreitungen",
      "Vergleich von Zeiträumen und Gebieten",
    ],
    references: "Gradiška",
    metrics: ["Luftqualität", "Temperatur", "Lärm"],
    events: "Grenzwert überschritten",
    map: "Umweltmessstellen",
  },
  industrija: {
    name: "Industrie",
    eyebrow: "ENERGIE · PROZESSE · RAUMBEDINGUNGEN",
    description:
      "Wir führen Energie- und Prozessdaten aus der Produktion in einer Übersicht zusammen, die hilft, Abweichungen zu erkennen und den Verbrauch nach Standort, Abteilung oder Gerät zu verstehen.",
    watch: [
      "Strom, Gas und Wasser",
      "Leistung und Lastspitzen",
      "Temperatur und Luftfeuchtigkeit",
      "Gerätestatus",
      "Ungewöhnliche Abweichungen",
    ],
    gain: [
      "Verbrauch nach Bereich",
      "Rechtzeitige Warnungen",
      "Daten für die Planung von Verbesserungen",
    ],
    references: "Adria Mobil",
    metrics: ["Strom", "Gas", "Wasser"],
    events: "Abweichung erkannt",
    map: "Produktionsbereiche",
  },
  mobilnost: {
    name: "Mobilität",
    eyebrow: "RADFAHRENDE · FUSSGÄNGER · VERKEHRSSTRÖME",
    description:
      "Wir verbinden Zählerdaten, kommunale Systeme und externe Quellen zu einer Darstellung der Nutzung von Radwegen, Fußwegen und anderen Verkehrsverbindungen.",
    watch: [
      "Erfasste Durchgänge",
      "Nutzungsintensität der Wege",
      "Spitzenzeiten",
      "Am stärksten belastete Abschnitte",
      "Veränderungen zwischen Zeiträumen",
    ],
    gain: [
      "Heatmaps der Nutzung",
      "Bessere Grundlage für Prioritäten",
      "Vorher-nachher-Vergleich von Maßnahmen",
    ],
    references: "Novo mesto",
    metrics: ["Radfahrende", "Fußgänger", "Spitzenzeiten"],
    events: "Änderung der Intensität",
    map: "Nutzung der Verkehrswege",
  },
  turizem: {
    name: "Tourismus",
    eyebrow: "MARINAS · CAMPINGPLÄTZE",
    description:
      "In Marinas und auf Campingplätzen verbinden wir Verbrauchsmessungen, den Zustand von Anschlüssen und Umweltdaten zu einer Übersicht nach Stellplatz, Liegeplatz und Gemeinschaftseinrichtung.",
    watch: [
      "Wasser- und Stromverbrauch",
      "Zustand der Anschlüsse",
      "Alarme und Unregelmäßigkeiten",
      "Umweltbedingungen",
      "Gemeinsame technische Einrichtungen",
    ],
    gain: [
      "Verbrauch nach Stell- oder Liegeplatz",
      "Rechtzeitige Bearbeitung von Unregelmäßigkeiten",
      "Weniger manuelle Kontrollen vor Ort",
    ],
    references: "ANWENDUNGSFALL · MARINAS UND CAMPINGPLÄTZE",
    metrics: ["Wasser", "Strom", "Anschlüsse"],
    events: "Technische Warnung",
    map: "Marina und Campingplatz",
  },
};

// German shares the Slovenian thousands separator, so values are reused as-is.
export const industryExplorerDe: Industry[] = industryExplorer.map((item) => ({
  id: item.id,
  icon: item.icon,
  metricValues: item.metricValues,
  ...germanIndustryCopy[item.id],
}));
