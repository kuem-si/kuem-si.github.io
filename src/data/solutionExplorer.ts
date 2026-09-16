export type SolutionStep = {
  id: string;
  name: string;
  next?: string;
  title: string;
  description: string;
  heading: string;
  items: { icon: string; title: string; text: string }[];
  tags?: string[];
  tagLabel?: string;
  note?: string;
  visual?: "dashboard" | "action" | "noc";
};
export const solutionSteps: SolutionStep[] = [
  {
    id: "naprave",
    name: "Naprave in senzorji",
    next: "Povezljivost",
    title: "Podatek se začne na terenu.",
    description:
      "Povežemo senzorje, števce in obstoječo terensko opremo ter poskrbimo za zanesljiv zajem podatkov.",
    heading: "Kaj zagotavljamo",
    items: [
      {
        icon: "device",
        title: "Izbira ustreznih naprav",
        text: "Svetujemo in izberemo naprave, ki ustrezajo vašim potrebam in okolju.",
      },
      {
        icon: "settings",
        title: "Vključitev obstoječe opreme",
        text: "Povežemo in integriramo obstoječe števce, senzorje in terensko opremo.",
      },
      {
        icon: "chart",
        title: "Konfiguracija in preverjanje meritev",
        text: "Nastavimo naprave, preverimo delovanje in zagotovimo zanesljivost podatkov.",
      },
    ],
    tagLabel: "Primerno za",
    tags: ["Voda in plin", "Energija", "Okolje", "Infrastruktura"],
  },
  {
    id: "povezljivost",
    name: "Povezljivost",
    next: "Integracije",
    title: "Za vsako lokacijo izberemo ustrezno podatkovno pot.",
    description:
      "Ne zagovarjamo ene tehnologije za vse primere. Izberemo povezavo glede na lokacijo, doseg, porabo energije in količino podatkov.",
    heading: "Kaj zagotavljamo",
    items: [
      {
        icon: "location",
        title: "Načrtovanje pokritosti",
        text: "Preverimo lokacijo, okolje in zahteve uporabe.",
      },
      {
        icon: "wrench",
        title: "Namestitev in konfiguracija",
        text: "Poskrbimo za pravilno uvedbo komunikacijske infrastrukture.",
      },
      {
        icon: "chart",
        title: "Spremljanje kakovosti povezave",
        text: "Delovanje spremljamo in odstopanja zaznamo pravočasno.",
      },
    ],
    tagLabel: "Podprte poti",
    tags: ["LoRaWAN", "NB-IoT", "wM-Bus", "LAN"],
  },
  {
    id: "integracije",
    name: "Integracije",
    next: "Nexavia",
    title: "Obstoječi sistemi ostanejo. Podatke povežemo.",
    description:
      "Nexavia se prek standardnih vmesnikov poveže z rešitvami, ki jih že uporabljate. Podatkov ne podvajamo po nepotrebnem in ne zahtevamo zamenjave delujoče infrastrukture.",
    heading: "Kaj lahko povežemo",
    items: [
      {
        icon: "database",
        title: "Poslovni sistemi",
        text: "ERP, obračunske in druge namenske rešitve.",
      },
      {
        icon: "settings",
        title: "Operativni sistemi",
        text: "SCADA, nadzorni sistemi in podatki naprav.",
      },
      {
        icon: "location",
        title: "Prostorski in zunanji viri",
        text: "GIS, odprti podatki, vreme in druge platforme.",
      },
    ],
    tagLabel: "Podprte poti",
    tags: ["API", "ERP", "SCADA", "GIS"],
  },
  {
    id: "nexavia",
    name: "Nexavia + KAI",
    next: "Odločitev",
    title: "Iz podatkov naredimo uporaben pregled.",
    description:
      "Nexavia združi različne vire na enem mestu. KAI podatke analizira, opozori na odstopanja in odgovorni osebi pomaga razumeti, kje je potreben ukrep.",
    heading: "Kaj uporabnik dobi",
    visual: "dashboard",
    items: [
      {
        icon: "screen",
        title: "Enoten pregled",
        text: "Ključni podatki na enem mestu.",
      },
      {
        icon: "bell",
        title: "Pravočasna opozorila",
        text: "Odstopanja opazite, preden postanejo večji problem.",
      },
      {
        icon: "chart",
        title: "Podpora odločitvam",
        text: "KAI izpostavi, kaj zahteva pozornost.",
      },
    ],
    note: "KAI je analitični pomočnik znotraj Nexavie.",
  },
  {
    id: "odlocitev",
    name: "Odločitev in ukrep",
    next: "NOC",
    title: "Pravi podatek pride do prave osebe.",
    description:
      "Odgovorni dobijo jasno opozorilo, kontekst in predlog naslednjega koraka. Ukrep lahko potrdi človek ali ga pri dogovorjenih pravilih izvede avtomatizacija.",
    heading: "Primeri ukrepov",
    visual: "action",
    items: [
      {
        icon: "wrench",
        title: "Delovni nalog",
        text: "Napaka se posreduje vzdrževalcu.",
      },
      {
        icon: "settings",
        title: "Prilagoditev delovanja",
        text: "Nastavitev se spremeni po potrditvi.",
      },
      {
        icon: "chart",
        title: "Poročilo za vodstvo",
        text: "Odločitev temelji na sledljivih podatkih.",
      },
    ],
    note: "Človek ohrani nadzor nad odločitvijo.",
  },
  {
    id: "noc",
    name: "NOC in upravljane storitve",
    title: "Rešitve spremljamo tudi po uvedbi.",
    description:
      "Stalni nadzor, odzivanje, vzdrževanje in strokovna podpora zagotavljajo, da celotna rešitev dolgoročno deluje zanesljivo.",
    heading: "Kaj spremljamo",
    visual: "noc",
    items: [
      {
        icon: "device",
        title: "Naprave",
        text: "Dosegljivost in pravilnost meritev.",
      },
      {
        icon: "network",
        title: "Povezljivost",
        text: "Kakovost komunikacijske poti.",
      },
      {
        icon: "bell",
        title: "Alarmi",
        text: "Obravnava odstopanj in obveščanje.",
      },
      {
        icon: "wrench",
        title: "Podpora",
        text: "Vzdrževanje in pomoč uporabnikom.",
      },
    ],
    note: "En partner za delovanje celotne rešitve.",
  },
];
export const explorerBenefits = [
  {
    icon: "eye",
    title: "Enoten pregled",
    text: "Vsi pomembni podatki na enem mestu.",
    step: 3,
  },
  {
    icon: "bell",
    title: "Pravočasna opozorila",
    text: "Pomembne spremembe opazite pravočasno.",
    step: 4,
  },
  {
    icon: "chart",
    title: "Podlaga za boljše odločitve",
    text: "Zanesljivi podatki za učinkovitejše ukrepanje.",
    step: 3,
  },
];
export const explorerExamples = [
  {
    icon: "water",
    title: "Nepričakovana poraba vode",
    text: "Odstopanje se pokaže odgovorni osebi, preden preraste v večji problem.",
    step: 4,
  },
  {
    icon: "energy",
    title: "Energetsko odstopanje",
    text: "Primerjava porabe skozi čas izpostavi nenavadno spremembo.",
    step: 3,
  },
  {
    icon: "bike",
    title: "Načrtovanje mobilnosti",
    text: "Podatki iz različnih virov pomagajo določiti dejansko obremenjene povezave.",
    step: 2,
  },
];

export const explorerBenefitsEn = [
  { icon: "eye", title: "Unified overview", text: "All important data in one place.", step: 3 },
  { icon: "bell", title: "Timely alerts", text: "See important changes in time.", step: 4 },
  { icon: "chart", title: "A basis for better decisions", text: "Reliable data for more effective action.", step: 3 },
];
export const explorerExamplesEn = [
  { icon: "water", title: "Unexpected water consumption", text: "The responsible person sees the deviation before it becomes a larger problem.", step: 4 },
  { icon: "energy", title: "Energy deviation", text: "Consumption comparison over time highlights an unusual change.", step: 3 },
  { icon: "bike", title: "Mobility planning", text: "Data from several sources identifies the routes that are actually under load.", step: 2 },
];

const englishSteps = [
  { name:"Devices and sensors", next:"Connectivity", title:"Data begins in the field.", description:"We connect sensors, meters and existing field equipment and ensure reliable data acquisition.", heading:"What we provide", items:[["Selecting suitable devices","We advise on and select devices suited to your needs and environment."],["Including existing equipment","We connect and integrate existing meters, sensors and field equipment."],["Configuration and measurement validation","We configure devices, verify operation and ensure reliable data."]], tagLabel:"Suitable for", tags:["Water and gas","Energy","Environment","Infrastructure"] },
  { name:"Connectivity", next:"Integrations", title:"We choose the right data path for every location.", description:"We do not advocate one technology for every case. We choose connectivity based on location, range, energy use and data volume.", heading:"What we provide", items:[["Coverage planning","We assess the location, environment and use requirements."],["Installation and configuration","We ensure the communication infrastructure is implemented correctly."],["Connection-quality monitoring","We monitor performance and detect deviations in time."]], tagLabel:"Supported paths", tags:["LoRaWAN","NB-IoT","wM-Bus","LAN"] },
  { name:"Integrations", next:"Nexavia", title:"Existing systems remain. We connect the data.", description:"Nexavia connects to solutions you already use through standard interfaces. We avoid unnecessary data duplication and do not require replacement of working infrastructure.", heading:"What we can connect", items:[["Business systems","ERP, billing and other dedicated solutions."],["Operational systems","SCADA, monitoring systems and device data."],["Spatial and external sources","GIS, open data, weather and other platforms."]], tagLabel:"Supported paths", tags:["API","ERP","SCADA","GIS"] },
  { name:"Nexavia + KAI", next:"Decision", title:"We turn data into a useful overview.", description:"Nexavia combines different sources in one place. KAI analyzes the data, flags deviations and helps the responsible person understand where action is needed.", heading:"What the user gets", items:[["Unified overview","Key data in one place."],["Timely alerts","See deviations before they become a larger problem."],["Decision support","KAI highlights what requires attention."]], note:"KAI is the analytics assistant within Nexavia." },
  { name:"Decision and action", next:"NOC", title:"The right information reaches the right person.", description:"Responsible users receive a clear alert, context and a proposed next step. A person can confirm the action, or automation can carry it out under agreed rules.", heading:"Examples of actions", items:[["Work order","The fault is sent to maintenance."],["Operating adjustment","A setting changes after confirmation."],["Management report","The decision is based on traceable data."]], note:"People remain in control of decisions." },
  { name:"NOC and managed services", title:"We continue monitoring solutions after implementation.", description:"Continuous monitoring, response, maintenance and expert support keep the entire solution reliable over the long term.", heading:"What we monitor", items:[["Devices","Availability and measurement validity."],["Connectivity","Communication-path quality."],["Alerts","Deviation handling and notifications."],["Support","Maintenance and user assistance."]], note:"One partner for the operation of the entire solution." },
] as const;

export const solutionStepsEn: SolutionStep[] = solutionSteps.map((step,index) => {
  const copy=englishSteps[index];
  return {
    ...step,
    ...copy,
    items: step.items.map((item,itemIndex) => ({ ...item, title: copy.items[itemIndex][0], text: copy.items[itemIndex][1] })),
    tags: "tags" in copy ? [...copy.tags] : step.tags,
  };
});
