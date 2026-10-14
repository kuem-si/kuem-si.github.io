import type { Locale } from "../lib/i18n";

export type Reference = {
  name: string;
  detail?: Record<Locale, string>;
};

export const references: Reference[] = [
  { name: "CMC GROUP d.o.o." },
  {
    name: "DOMPLAN, d.d.",
    detail: {
      en: "Approximately 1,000 gas meters connected via NB-IoT.",
      sl: "Približno 1000 plinomerov, povezanih prek NB-IoT.",
      de: "Rund 1.000 Gaszähler, angebunden über NB-IoT.",
    },
  },
  {
    name: "Sombor-gas d.o.o.",
    detail: {
      en: "Ongoing deployment of 4,000 LoRaWAN adapters for remote gas meter reading.",
      sl: "Uvajanje 4000 LoRaWAN adapterjev za daljinsko odčitavanje plinomerov je v teku.",
      de: "Laufende Einführung von 4.000 LoRaWAN-Adaptern für die Fernauslesung von Gaszählern.",
    },
  },
  { name: "KOLEKTOR SISTEH d.o.o." },
  {
    name: "Mestna občina Novo mesto",
    detail: {
      en: "Traffic counting, especially cyclist counting.",
      sl: "Štetje prometa, posebej štetje kolesarjev.",
      de: "Verkehrszählung, insbesondere Radverkehrszählung.",
    },
  },
  { name: "JP VOKA SNAGA d.o.o." },
  {
    name: "JKP Brezovica d.o.o.",
    detail: {
      en: "LoRaWAN network for 2,800 water meters, approximately 300 currently connected; Flovac vacuum shaft monitoring; pilot of 14 LoRaWAN public-lighting units.",
      sl: "LoRaWAN omrežje za 2800 vodomerov, trenutno približno 300 povezanih; nadzor Flovac vakuumskih jaškov; pilot 14 LoRaWAN enot javne razsvetljave.",
      de: "LoRaWAN-Netz für 2.800 Wasserzähler, derzeit rund 300 angebunden; Überwachung von Flovac-Vakuumschächten; Pilotprojekt mit 14 LoRaWAN-Einheiten für die öffentliche Beleuchtung.",
    },
  },
  {
    name: "Callidus Grupa d.o.o.",
    detail: {
      en: "Krk public lighting implementation with approximately 1,200 luminaires.",
      sl: "Implementacija javne razsvetljave na Krku s približno 1200 svetilkami.",
      de: "Umsetzung der öffentlichen Beleuchtung auf Krk mit rund 1.200 Leuchten.",
    },
  },
  {
    name: "Marina Cloud d.o.o.",
    detail: {
      en: "Joint solution for remote monitoring of water consumption in mobile homes.",
      sl: "Skupna rešitev za daljinski nadzor porabe vode v mobilnih hišicah.",
      de: "Gemeinsame Lösung zur Fernüberwachung des Wasserverbrauchs in Mobilheimen.",
    },
  },
  {
    name: "Tropic Maloprodaja d.o.o.",
    detail: {
      en: "Temperature monitoring in refrigerators, freezers, salad bars and heated food areas.",
      sl: "Spremljanje temperature v hladilnikih, zamrzovalnikih, solatnih barih in ogrevanih območjih s hrano.",
      de: "Temperaturüberwachung in Kühlschränken, Tiefkühlgeräten, Salatbars und beheizten Speisebereichen.",
    },
  },
  {
    name: "Grad Gradiška",
    detail: {
      en: "Outdoor AQI monitoring, noise-level monitoring, traffic analysis and river-level monitoring.",
      sl: "Zunanji nadzor AQI, spremljanje ravni hrupa, analiza prometa in spremljanje vodostaja reke.",
      de: "Überwachung der Außenluftqualität (AQI), Lärmpegelmessung, Verkehrsanalyse und Überwachung des Flusspegels.",
    },
  },
  { name: "MEA TRADE d.o.o." },
  { name: "NABLA-PLUS d.o.o." },
  { name: "T-2 d.o.o." },
  { name: "Senzemo" },
];

export function getDetailedReferences() {
  return references.filter((reference) => reference.detail);
}

export function getNameOnlyReferences() {
  return references.filter((reference) => !reference.detail);
}
