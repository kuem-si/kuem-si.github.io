import { primaryNavigation } from "./navigation";

export const homeNavigation = primaryNavigation.sl.map(
  ({ label, href }) => [label, href] as const,
);
export const benefits = [
  {
    icon: "eye",
    title: "Enoten pregled",
    text: "Vsi pomembni podatki, sistemi in lokacije na enem mestu.",
  },
  {
    icon: "bell",
    title: "Skoraj sprotna opozorila",
    text: "Odstopanja in dogodki so pravočasno prikazani odgovorni osebi.",
  },
  {
    icon: "chart",
    title: "Podatki za boljše odločitve",
    text: "Analitika pomaga pri upravljanju infrastrukture in načrtovanju ukrepov.",
  },
];
export const steps = [
  {
    icon: "device",
    title: "Zajem",
    text: "Senzorji, števci, naprave in terenska oprema.",
  },
  {
    icon: "network",
    title: "Prenos",
    text: "Povezljivost, prilagojena lokaciji in namenu uporabe.",
  },
  {
    icon: "screen",
    title: "Nexavia",
    text: "Enotna platforma za sprejem, obdelavo, prikaz in upravljanje podatkov.",
  },
  {
    icon: "chart",
    title: "Odločitev",
    text: "KAI, opozorila, priporočila in podpora konkretnim ukrepom.",
  },
];
export const industries = [
  {
    icon: "water",
    title: "Voda in komunala",
    text: "Nadzor omrežij, porabe, izgub, tlakov in kakovosti.",
    reference: "Brezovica",
  },
  {
    icon: "energy",
    title: "Energija",
    text: "Spremljanje energetske učinkovitosti in nenavadnih odstopanj.",
    reference: "Adria Mobil",
  },
  {
    icon: "leaf",
    title: "Okolje",
    text: "Merjenje emisij, kakovosti zraka, okoljskih kazalnikov in hrupa.",
    reference: "Gradiška",
  },
  {
    icon: "bike",
    title: "Mobilnost",
    text: "Spremljanje prometnih tokov in podpora načrtovanju trajnostne mobilnosti.",
    reference: "Novo mesto",
  },
  {
    icon: "building",
    title: "Javna infrastruktura",
    text: "Pregled nad razpršenimi objekti, napravami in vzdrževanjem.",
    reference: "Krk",
  },
];
export const useCases = [
  {
    icon: "water",
    title: "Nepričakovana poraba vode",
    text: "Nexavia zazna odstopanje in o njem obvesti odgovorno osebo.",
    href: "/sl/resitve/daljinsko-odcitavanje-stevcev",
  },
  {
    icon: "energy",
    title: "Energetska odstopanja",
    text: "Sistem primerja porabo skozi čas in izpostavi nenavadne spremembe.",
    href: "/resitve/napredna-analitika",
  },
  {
    icon: "bike",
    title: "Načrtovanje kolesarskih povezav",
    text: "Podatki iz različnih virov se prikažejo na zemljevidu obremenjenosti in pomagajo pri načrtovanju infrastrukture.",
    href: "/sl/resitve/promet-in-mobilnost",
  },
];
export const partnership = [
  {
    icon: "device",
    title: "Različne naprave",
    text: "Senzorji, števci in terenska oprema.",
  },
  {
    icon: "network",
    title: "Različne povezave",
    text: "LoRaWAN, NB-IoT, mobilna in lokalna omrežja.",
  },
  {
    icon: "database",
    title: "Integracije z obstoječimi sistemi",
    text: "ERP, SCADA, GIS in standardni vmesniki.",
  },
  {
    icon: "chart",
    title: "Nexavia in KAI",
    text: "Podatki, analitika, opozorila in priporočila.",
  },
  {
    icon: "people",
    title: "NOC in upravljane storitve",
    text: "Stalni nadzor, odzivanje, vzdrževanje in strokovna podpora.",
  },
];

export const homeNavigationEn = primaryNavigation.en.map(
  ({ label, href }) => [label, href] as const,
);
export const benefitsEn = [
  { icon: "eye", title: "Unified overview", text: "All important data, systems and locations in one place." },
  { icon: "bell", title: "Timely alerts", text: "Deviations and events reach the responsible person in time." },
  { icon: "chart", title: "Data for better decisions", text: "Analytics supports infrastructure management and action planning." },
];
export const stepsEn = [
  { icon: "device", title: "Acquisition", text: "Sensors, meters, devices and field equipment." },
  { icon: "network", title: "Transfer", text: "Connectivity adapted to the location and use case." },
  { icon: "screen", title: "Nexavia", text: "One platform for receiving, processing, presenting and managing data." },
  { icon: "chart", title: "Decision", text: "KAI, alerts, recommendations and support for concrete action." },
];
export const industriesEn = [
  { icon: "water", title: "Water and utilities", text: "Monitoring networks, consumption, losses, pressure and quality.", reference: "Brezovica" },
  { icon: "energy", title: "Energy", text: "Monitoring energy efficiency and unusual deviations.", reference: "Adria Mobil" },
  { icon: "leaf", title: "Environment", text: "Measuring emissions, air quality, environmental indicators and noise.", reference: "Gradiška" },
  { icon: "bike", title: "Mobility", text: "Monitoring traffic flows and supporting sustainable mobility planning.", reference: "Novo mesto" },
  { icon: "building", title: "Public infrastructure", text: "Overview of distributed facilities, devices and maintenance.", reference: "Krk" },
];
export const useCasesEn = [
  { icon: "water", title: "Unexpected water consumption", text: "Nexavia detects the deviation and alerts the responsible person.", href: "/en/solutions/remote-meter-reading" },
  { icon: "energy", title: "Energy deviations", text: "The system compares consumption over time and highlights unusual changes.", href: "/en/solutions/advanced-analytics" },
  { icon: "bike", title: "Planning cycling connections", text: "Data from several sources is displayed on a usage map and supports infrastructure planning.", href: "/en/solutions/traffic-and-mobility" },
];
export const partnershipEn = [
  { icon: "device", title: "Different devices", text: "Sensors, meters and field equipment." },
  { icon: "network", title: "Different connections", text: "LoRaWAN, NB-IoT, mobile and local networks." },
  { icon: "database", title: "Existing-system integrations", text: "ERP, SCADA, GIS and standard interfaces." },
  { icon: "chart", title: "Nexavia and KAI", text: "Data, analytics, alerts and recommendations." },
  { icon: "people", title: "NOC and managed services", text: "Continuous monitoring, response, maintenance and expert support." },
];
