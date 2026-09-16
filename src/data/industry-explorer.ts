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

const englishIndustryCopy: Record<string, Omit<Industry, "id" | "icon" | "metricValues">> = {
  "komunala-in-energija": {
    name: "Utilities and energy", eyebrow: "WATER · GAS · ELECTRICITY",
    description: "We combine water, gas and electricity measurements to provide a unified view of consumption, network status and significant deviations.",
    watch: ["Consumption", "Flow and pressure", "Quality", "Device status", "Alerts"],
    gain: ["Unified overview of utilities", "Timely deviation detection", "Comparison of locations and periods"],
    references: "Domplan · Brezovica · Sombor", metrics: ["Water", "Gas", "Electricity"], events: "Consumption deviation", map: "Network status",
  },
  "javna-infrastruktura": {
    name: "Public infrastructure", eyebrow: "LIGHTING · ROADS · BRIDGES · FACILITIES",
    description: "We monitor distributed public infrastructure in one place, from public lighting to roads, bridges, facilities and other field assets.",
    watch: ["Device and facility status", "Energy consumption", "Faults and alerts", "Locations and events", "Maintenance work"],
    gain: ["Map-based infrastructure overview", "Faster prioritization", "Traceable event and maintenance history"],
    references: "Krk", metrics: ["Lights", "Facilities", "Events"], events: "Open event", map: "Infrastructure map",
  },
  okolje: {
    name: "Environment", eyebrow: "AIR · NOISE · TEMPERATURE · WATER LEVEL",
    description: "We combine environmental measurements in clear maps and timelines for continuous monitoring and timely threshold detection.",
    watch: ["Air quality and pollutants", "Temperature and humidity", "Noise", "Water levels", "Location trends"],
    gain: ["Measurements by location", "Threshold alerts", "Comparison of periods and areas"],
    references: "Gradiška", metrics: ["Air quality", "Temperature", "Noise"], events: "Threshold exceeded", map: "Environmental monitoring sites",
  },
  industrija: {
    name: "Industry", eyebrow: "ENERGY · PROCESSES · INDOOR CONDITIONS",
    description: "We combine energy and process data from production environments to detect deviations and understand consumption by site, department or device.",
    watch: ["Electricity, gas and water", "Power and peaks", "Temperature and humidity", "Device status", "Unusual deviations"],
    gain: ["Consumption by area", "Timely alerts", "Data for improvement planning"],
    references: "Adria Mobil", metrics: ["Electricity", "Gas", "Water"], events: "Deviation detected", map: "Production areas",
  },
  mobilnost: {
    name: "Mobility", eyebrow: "CYCLISTS · PEDESTRIANS · TRAFFIC FLOWS",
    description: "We combine counter data, municipal systems and external sources to show the use of cycling routes, footpaths and other transport links.",
    watch: ["Detected passages", "Route usage intensity", "Peak periods", "Busiest sections", "Changes between periods"],
    gain: ["Usage heat maps", "Better prioritization", "Before-and-after comparison"],
    references: "Novo mesto", metrics: ["Cyclists", "Pedestrians", "Peak periods"], events: "Intensity change", map: "Transport-route usage",
  },
  turizem: {
    name: "Tourism", eyebrow: "MARINAS · CAMPSITES",
    description: "In marinas and campsites, we connect consumption, utility-point status and environmental data for an overview by pitch, berth and shared facility.",
    watch: ["Water and electricity consumption", "Utility-point status", "Alerts and irregularities", "Environmental conditions", "Shared technical facilities"],
    gain: ["Consumption by pitch or berth", "Timely handling of irregularities", "Less manual field checking"],
    references: "USE CASE · MARINAS AND CAMPSITES", metrics: ["Water", "Electricity", "Connections"], events: "Technical alert", map: "Marina and campsite",
  },
};

export const industryExplorerEn: Industry[] = industryExplorer.map((item) => ({
  id: item.id,
  icon: item.icon,
  metricValues: item.metricValues,
  ...englishIndustryCopy[item.id],
}));
