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
      en: "Approximately 1000 gas meters connected via NB-IoT.",
      sl: "Približno 1000 plinomerov, povezanih prek NB-IoT."
    }
  },
  {
    name: "Sombor-gas d.o.o.",
    detail: {
      en: "Ongoing deployment of 4000 LoRaWAN adapters for remote gas meter reading.",
      sl: "Uvajanje 4000 LoRaWAN adapterjev za daljinsko odčitavanje plinomerov je v teku."
    }
  },
  { name: "KOLEKTOR SISTEH d.o.o." },
  {
    name: "Mestna občina Novo mesto",
    detail: {
      en: "Traffic counting, especially cyclist counting.",
      sl: "Štetje prometa, posebej štetje kolesarjev."
    }
  },
  { name: "JP VOKA SNAGA d.o.o." },
  {
    name: "JKP Brezovica d.o.o.",
    detail: {
      en:
        "LoRaWAN network for 2800 water meters, approximately 300 currently connected; Flovac vacuum shaft monitoring; pilot of 14 LoRaWAN public-lighting units.",
      sl:
        "LoRaWAN omrežje za 2800 vodomerov, trenutno približno 300 povezanih; nadzor Flovac vakuumskih jaškov; pilot 14 LoRaWAN enot javne razsvetljave."
    }
  },
  {
    name: "Callidus Grupa d.o.o.",
    detail: {
      en: "Krk public lighting implementation with approximately 1200 luminaires.",
      sl: "Implementacija javne razsvetljave na Krku s približno 1200 svetilkami."
    }
  },
  {
    name: "Marina Cloud d.o.o.",
    detail: {
      en: "Joint solution for remote monitoring of water consumption in mobile homes.",
      sl: "Skupna rešitev za daljinski nadzor porabe vode v mobilnih hišicah."
    }
  },
  {
    name: "Tropic Maloprodaja d.o.o.",
    detail: {
      en: "Temperature monitoring in refrigerators, freezers, salad bars and heated food areas.",
      sl: "Spremljanje temperature v hladilnikih, zamrzovalnikih, solatnih barih in ogrevanih območjih s hrano."
    }
  },
  {
    name: "Grad Gradiška",
    detail: {
      en: "Outdoor AQI monitoring, noise-level monitoring, traffic analysis and river-level monitoring.",
      sl: "Zunanji nadzor AQI, spremljanje ravni hrupa, analiza prometa in spremljanje vodostaja reke."
    }
  },
  { name: "MEA TRADE d.o.o." },
  { name: "NABLA-PLUS d.o.o." },
  { name: "T-2 d.o.o." },
  { name: "Senzemo" }
];

export function getDetailedReferences() {
  return references.filter((reference) => reference.detail);
}

export function getNameOnlyReferences() {
  return references.filter((reference) => !reference.detail);
}
