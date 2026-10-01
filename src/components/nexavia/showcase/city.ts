import type { Twin } from "./types";

// The smart-city maquette: a photograph of the 60 × 60 cm model. Lighting
// patches come from scripts/generate-showcase-room-lighting.mjs.
export function cityTwin(en: boolean): Twin {
  const t = (sl: string, english: string) => (en ? english : sl);
  const d = (value: string) => (en ? value : value.replace(".", ","));
  const lamp = (x: number, top: number, bottom: number) => ({
    shape: `M${x - 6} ${top}h12v${bottom - top}h-12z`,
    hit: `M${x - 22} ${top - 8}h44v${bottom - top + 16}h-44z`,
    anchor: [x, top + 7],
  });
  return {
    id: "city",
    tab: {
      title: t("Pametno mesto", "Smart city"),
      meta: t("Maketa 60 × 60 cm · 7 naprav", "60 × 60 cm model · 7 devices"),
    },
    intro: {
      title: t(
        "Mesto, ki pokaže, kaj se dogaja s podatki.",
        "A city that shows what is happening in its data.",
      ),
      lead: t(
        "Mesto povezuje upravljanje razsvetljave, števce porabe ter senzorje tresljajev mostu, gladine reke, kakovosti zraka in kolesarskega prometa. Meritve in dogodki se prikazujejo v Nexavii.",
        "The demonstration city combines controllable lighting, utility meters, and bridge, river, air-quality and cyclist sensors. Live readings and lighting events appear in Nexavia.",
      ),
    },
    panel: {
      view: t(
        "Pogled mesta · povlecite za raziskovanje",
        "City view · drag to explore",
      ),
      hint: t(
        "Kliknite senzor, da pošlje meritev, ali svetilko oz. stavbo za vklop in izklop",
        "Click a sensor to send a reading, or a street light or building to switch it on or off",
      ),
      hintPanel: t(
        "Tudi deli nadzorne plošče Nexavia so interaktivni – preklopite posamezno napravo ali vse ulične svetilke hkrati.",
        "Parts of the Nexavia dashboard are interactive too – switch a single device or all street lights at once.",
      ),
      step: t(
        "Senzor bere svetlobo okolice",
        "Sensor is reading ambient light",
      ),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/maquette.png",
      width: 1536,
      height: 1024,
      alt: t(
        "Fotorealistična maketa mesta velikosti 60 × 60 cm, sestavljena iz štirih modulov velikosti 30 × 30 cm: hiše, javni trg, tovarna, reka in most",
        "Photorealistic 60 by 60 centimetre miniature city maquette assembled from four 30 by 30 centimetre modules: homes, civic square, factory, river and bridge",
      ),
      lightsDir: "/images/nexavia/showcase-room/lights",
      modules: [
        {
          letter: "A",
          name: t("Stanovanjski", "Residential"),
          plan: [520, 236],
          label: [21, 27],
        },
        {
          letter: "B",
          name: t("Javni prostor", "Public space"),
          plan: [1010, 236],
          label: [57, 28],
        },
        {
          letter: "C",
          name: t("Industrija", "Industry"),
          plan: [480, 566],
          label: [25, 56],
        },
        {
          letter: "D",
          name: t("Voda in infrastruktura", "Water & infrastructure"),
          plan: [1080, 566],
          label: [64, 56],
        },
      ],
      lighting: [
        {
          id: "HOUSE_01",
          label: t("Razsvetljava hiše z vrtom", "Garden house lighting"),
          off: [404, 104, 158, 124],
          shape:
            "M406 144 442 124 507 100 545 141 540 150 557 168 553 195 540 207 480 221 415 213 410 160Z",
          anchor: [476, 120],
        },
        {
          id: "OFFICE_01",
          label: t("Razsvetljava poslovne stavbe", "Office building lighting"),
          off: [972, 144, 190, 90],
          shape: "M984 95 1162 101 1173 142 1171 233 972 230 973 150Z",
          anchor: [1074, 122],
        },
        {
          id: "FACTORY_01",
          label: t("Razsvetljava tovarne", "Factory lighting"),
          off: [340, 424, 290, 124],
          shape: "M335 436 412 358 623 386 622 540 560 540 430 528 335 512Z",
          anchor: [604, 468],
        },
        {
          id: "LAMP_01",
          label: t("Ulična svetilka 1", "Street light 1"),
          off: [612, 280, 72, 116],
          ...lamp(646.5, 294, 380),
        },
        {
          id: "LAMP_02",
          label: t("Ulična svetilka 2", "Street light 2"),
          off: [986, 304, 70, 76],
          ...lamp(1018.5, 316, 364),
        },
        {
          id: "LAMP_03",
          label: t("Ulična svetilka 3", "Street light 3"),
          off: [668, 392, 84, 98],
          ...lamp(703, 401, 465),
        },
        {
          id: "LAMP_04",
          label: t("Ulična svetilka 4", "Street light 4"),
          off: [1172, 504, 74, 100],
          ...lamp(1207.5, 518, 585),
        },
      ],
      sensors: [
        {
          key: "lux",
          id: "LIGHT_01",
          tone: "light",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor"),
          event: t("Svetloba okolice", "Ambient light"),
          at: [1150, 108],
          side: "below",
          align: "end",
          every: t("vsakih 5 min", "every 5 min"),
          uses: t(
            "Pravilo: svetloba < 25 lx → vklop razsvetljave",
            "Rule: light < 25 lx → lighting on",
          ),
          card: {
            kind: "sensor",
            title: t("Svetloba okolice", "Ambient light"),
            value: "46 lx",
            note: t("Streha poslovne stavbe", "Office building roof"),
          },
        },
        {
          key: "house-water",
          id: "HOUSE_WATER_01",
          tone: "water",
          tag: "H₂O",
          label: t("Vodomer hiše", "House water meter"),
          event: t("Vodomer hiše", "House water meter"),
          at: [452, 214],
          side: "below",
          every: t("vsakih 15 min", "every 15 min"),
          uses: t(
            "Pravilo: nočni pretok > 0,1 m³/h 30 min → alarm puščanja",
            "Rule: night flow > 0.1 m³/h for 30 min → leak alarm",
          ),
          card: {
            kind: "meter",
            title: t("Poraba vode · hiša", "Garden house water"),
            value: d("0.84 m³/d"),
            note: t("Dnevni pretok", "Daily flow"),
          },
        },
        {
          key: "office-water",
          id: "OFFICE_WATER_01",
          tone: "water",
          tag: "H₂O",
          label: t("Vodomer pisarne", "Office water meter"),
          event: t("Vodomer pisarne", "Office water meter"),
          at: [1128, 220],
          side: "below",
          every: t("vsakih 15 min", "every 15 min"),
          card: {
            kind: "meter",
            title: t("Poraba vode · pisarna", "Office water"),
            value: d("12.6 m³/d"),
            note: t("Dnevni pretok", "Daily flow"),
          },
        },
        {
          key: "air",
          id: "AIR_QUALITY_01",
          tone: "air",
          tag: "PM10",
          label: t("Senzor kakovosti zraka", "Air quality sensor"),
          event: t("Kakovost zraka", "Air quality"),
          eventNote: true,
          at: [1181, 228],
          side: "below",
          align: "end",
          alert: 50,
          every: t("vsakih 10 min", "every 10 min"),
          uses: t("Alarm: PM10 ≥ 50 µg/m³", "Alarm: PM10 ≥ 50 µg/m³"),
          card: {
            kind: "sensor",
            title: t("Kakovost zraka", "Air quality"),
            value: "18 µg/m³",
            grid: [
              { label: "PM10", key: "air", value: "18 µg/m³" },
              {
                label: t("Temperatura", "Temperature"),
                key: "air-temp",
                value: d("18.7 °C"),
              },
              {
                label: t("Vlaga", "Humidity"),
                key: "air-humidity",
                value: t("56 %", "56%"),
              },
            ],
          },
        },
        {
          key: "cyclists",
          id: "CYCLE_COUNT_01",
          tone: "mobility",
          tag: t("Kolesa", "Bikes"),
          label: t("Števec kolesarjev", "Cyclist counter"),
          event: t("Števec kolesarjev", "Cyclist counter"),
          at: [764, 300],
          side: "below",
          card: {
            kind: "sensor",
            title: t("Števec kolesarjev", "Cyclist counter"),
            value: "124",
            note: t("Prehodov danes", "Passages today"),
          },
        },
        {
          key: "factory-gas",
          id: "FACTORY_GAS_01",
          tone: "gas",
          tag: t("Plin", "Gas"),
          label: t("Plinomer tovarne", "Factory gas meter"),
          event: t("Plinomer tovarne", "Factory gas meter"),
          at: [332, 489],
          side: "above",
          align: "start",
          every: t("vsakih 15 min", "every 15 min"),
          card: {
            kind: "meter",
            title: t("Poraba plina · tovarna", "Factory gas"),
            value: d("34.2 m³/h"),
            note: t("Trenutni pretok", "Current flow"),
          },
        },
        {
          key: "electricity",
          id: "FACTORY_POWER_01",
          tone: "power",
          tag: "kWh",
          label: t("Električni števec tovarne", "Factory electricity meter"),
          event: t("Električni števec tovarne", "Factory electricity meter"),
          at: [590, 520],
          side: "above",
          every: t("vsakih 15 min", "every 15 min"),
          card: {
            kind: "meter",
            title: t("Poraba elektrike · tovarna", "Electricity use · factory"),
            value: d("18.6 kWh"),
            note: t("Danes", "Current day"),
          },
        },
        {
          key: "vibration",
          id: "BRIDGE_VIB_01",
          tone: "structure",
          tag: "mm/s",
          label: t("Senzor tresljajev mostu", "Bridge vibration sensor"),
          event: t("Tresljaji mostu", "Bridge vibration"),
          at: [940, 543],
          side: "above",
          alert: 0.8,
          every: t("vsakih 5 min", "every 5 min"),
          uses: t("Alarm: tresljaji ≥ 0,8 mm/s", "Alarm: vibration ≥ 0.8 mm/s"),
          card: {
            kind: "sensor",
            title: t("Tresljaji mostu", "Bridge vibration"),
            value: d("0.42 mm/s"),
            note: t("Običajno območje", "Normal range"),
          },
        },
        {
          key: "water",
          id: "RIVER_LEVEL_01",
          tone: "water",
          tag: t("Gladina", "Level"),
          label: t("Senzor gladine reke", "River level sensor"),
          event: t("Gladina reke", "River level"),
          at: [1012, 610],
          side: "below",
          alert: 1.8,
          every: t("vsakih 5 min", "every 5 min"),
          uses: t(
            "Pravilo: gladina reke > 1,80 m → alarm",
            "Rule: river level > 1.80 m → alarm",
          ),
          card: {
            kind: "sensor",
            title: t("Gladina reke", "River level"),
            value: d("1.36 m"),
            note: t("Trenutna gladina", "Current level"),
          },
        },
      ],
      // Asphalt copied from further down the lane, covering the figure baked
      // into the southbound lane so animated traffic never drives through it.
      lanePatch: {
        href: "data:image/webp;base64,UklGRs4BAABXRUJQVlA4WAoAAAAQAAAAFAAAHwAAQUxQSN4AAAABCijWti1TxnF3SySqu2+AFZBJU3GJLMG1T8Ml0WYHSHN3d/jsZQevRAQDt40UefGYep9Ao/jiEoXQVZKKK+qRkhwyajq6hru4JsMqpaVrfn0L57s4xSJQ2be0d3V/hUt9FDAVdS6cfH4TIS9IkTm2Te2TXljQGHLC0Q+DRDFHVzp68W2WCynVl9s3Py2QRVtMCW9/28o2piiFIxdWFyxKydSLlUyxUhH5tMJIhdKw/G0vy6K0bjhsCBBwAbgL8ETAlwZ8vcAPAftkwI8LjAEsMMBowUIIi+u/gg37BRBWUDggygAAABAFAJ0BKhUAIAA+MRaJQ6IhIRQEACADBLOuwChSkLYwxiJJOUHzhX7rJdYzCGP+sEAA/vI73jh46BfY6TCzxYZ1A9F4rcGvkY4BzBq6O/kXxqp1YixVz4OBpoKLsuGI6Vx60DQnompT5EK8RWtJewHk+6twnvWq11DKA0FYx/PPo6BG6cDNV7DVUGgd0osVqSMWNr6wqfxCoSvm7cEIr3ee8f+HykBZ+eDd+zErffhhluZY5EeSB1RClH774Br/fMNEqKQXnAujAAA=",
        x: 703,
        y: 498,
        width: 21,
        height: 32,
      },
      loader: {
        subject: t(
          "Maketa 60 × 60 cm · 4 moduli",
          "Model 60 × 60 cm · 4 modules",
        ),
        stage: t("Nalaganje modela mesta", "Loading the city model"),
      },
    },
    dashboard: {
      title: t("Pregled naprav", "Device overview"),
      subtitle: t(
        "3 stavbe · 4 ulične svetilke · demonstracijski podatki",
        "3 buildings · 4 street lights · simulated data",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices"),
          value: "0 / 7",
          note: t("Po mestu", "Across the city"),
        },
        {
          key: "power",
          label: t("Skupna moč", "Total power"),
          value: "0 W",
          note: t("Trenutna simulacija", "Current simulation"),
        },
        {
          key: "lux",
          label: t("Svetloba okolice", "Ambient light"),
          value: "46 lx",
          note: t("Senzor LIGHT_01", "Sensor LIGHT_01"),
        },
      ],
      rule: t("Pravilo: svetloba < 25 lx", "Rule: light < 25 lx"),
      ruleStatus: t("Čaka na naslednjo meritev", "Waiting for next reading"),
      devices: [
        { id: "HOUSE_01", name: t("Hiša z vrtom", "Garden house") },
        { id: "OFFICE_01", name: t("Poslovna stavba", "Office building") },
        { id: "FACTORY_01", name: t("Tovarna", "Factory") },
        { id: "LAMP_01", name: t("Ulična svetilka 1", "Street light 1") },
        { id: "LAMP_02", name: t("Ulična svetilka 2", "Street light 2") },
        { id: "LAMP_03", name: t("Ulična svetilka 3", "Street light 3") },
        { id: "LAMP_04", name: t("Ulična svetilka 4", "Street light 4") },
      ],
      group: t("Ulična razsvetljava", "Street lighting"),
      alarms: [
        {
          id: "OFFICE_01",
          text: t(
            "Senzor se ne odziva · 12 min",
            "Sensor not responding · 12 min",
          ),
        },
        {
          id: "FACTORY_01",
          text: t(
            "Šibek signal prehoda · 4 min",
            "Gateway signal weak · 4 min",
          ),
        },
      ],
      meters: {
        title: t("Meritve števcev", "Meter readings"),
        rows: [
          {
            label: t("Vodomer hiše z vrtom", "House water meter"),
            id: "HOUSE_WATER_01",
            key: "house-water",
            value: d("0.84 m³/d"),
          },
          {
            label: t("Vodomer poslovne stavbe", "Office water meter"),
            id: "OFFICE_WATER_01",
            key: "office-water",
            value: d("12.6 m³/d"),
          },
          {
            label: t("Plinomer tovarne", "Factory gas meter"),
            id: "FACTORY_GAS_01",
            key: "factory-gas",
            value: d("34.2 m³/h"),
          },
          {
            label: t("Elektrika tovarne", "Factory electricity"),
            id: "FACTORY_POWER_01",
            key: "electricity",
            value: d("18.6 kWh"),
          },
        ],
      },
      sensors: {
        title: t("Senzorji infrastrukture", "Infrastructure sensors"),
        rows: [
          {
            label: t("Tresljaji mostu", "Bridge vibration"),
            id: "BRIDGE_VIB_01",
            key: "vibration",
            value: d("0.42 mm/s"),
            note: t("Običajno", "Normal"),
          },
          {
            label: t("Gladina reke", "River level"),
            id: "RIVER_LEVEL_01",
            key: "water",
            value: d("1.36 m"),
            note: t("Normalno območje", "Normal range"),
          },
          {
            label: t("Kakovost zraka", "Air quality"),
            id: "AIR_QUALITY_01 · PM10",
            key: "air",
            value: "18 µg/m³",
            note: t("18,7 °C · 56 % RH", "18.7 °C · 56% RH"),
          },
          {
            label: t("Števec kolesarjev", "Cyclist counter"),
            id: "CYCLE_COUNT_01",
            key: "cyclists",
            value: t("124 danes", "124 today"),
          },
        ],
      },
    },
  };
}
