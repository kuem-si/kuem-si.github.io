import type { Twin } from "./types";
import geometry from "./industry-geometry.json";

// The industry maquette, rendered by scripts/generate-industry-maquette.mjs:
// a manufacturing plant and a supermarket, both shown in section. Hotspots,
// unlit patches and sensor pins come from the generated geometry.
export function industryTwin(en: boolean): Twin {
  const t = (sl: string, english: string) => (en ? english : sl);
  const d = (value: string) => (en ? value : value.replace(".", ","));
  const pct = (value: number) => t(`${value} %`, `${value}%`);
  const at = (key: keyof typeof geometry.points) =>
    geometry.points[key] as [number, number];
  const device = (
    id: keyof typeof geometry.devices,
    label: string,
    hit = false,
  ) => {
    const { off, shape, anchor } = geometry.devices[id];
    // Lamp heads are a few pixels wide; give them a larger click target.
    const target = hit
      ? { hit: `M${anchor[0] - 16} ${anchor[1] - 12}h32v46h-32z` }
      : {};
    return { id, label, off, shape, anchor, ...target };
  };
  const every5 = t("vsakih 5 min", "every 5 min");
  const every15 = t("vsakih 15 min", "every 15 min");
  return {
    id: "industry",
    tab: {
      title: t("Industrija", "Industry"),
      meta: t("Maketa 60 × 60 cm · 7 naprav", "60 × 60 cm model · 7 devices"),
    },
    intro: {
      title: t(
        "Proizvodnja in trgovina, ki vesta, kaj se dogaja pod streho.",
        "A plant and a store that know what is happening under their roofs.",
      ),
      lead: t(
        "Stavbi sta prikazani v prerezu. V proizvodnem podjetju senzorji merijo temperaturo in vlago v hali in skladišču, v supermarketu pa temperaturo hladilnih vitrin, zamrzovalnikov in hladilnice. Nexavia ob odstopanju sproži alarm, obvesti odgovorne in hrani zapis meritev.",
        "Both buildings are shown in section. In the manufacturing plant, sensors measure temperature and humidity in the hall and the warehouse; in the supermarket they watch the temperature of the chillers, freezers and cold room. When a reading drifts, Nexavia raises an alarm, notifies the people responsible and keeps the record.",
      ),
    },
    panel: {
      view: t(
        "Pogled v prerezu · povlecite za raziskovanje",
        "Section view · drag to explore",
      ),
      hint: t(
        "Kliknite senzor, da pošlje meritev, ali halo, trgovino, napis oz. svetilko na dvorišču za vklop in izklop",
        "Click a sensor to send a reading, or the hall, the store, the sign or a yard lamp to switch it on or off",
      ),
      hintPanel: t(
        "Tudi deli nadzorne plošče Nexavia so interaktivni – preklopite posamezno napravo ali vse zunanje svetilke hkrati.",
        "Parts of the Nexavia dashboard are interactive too – switch a single device or all outdoor lamps at once.",
      ),
      step: t(
        "Senzor bere svetlobo okolice",
        "Sensor is reading ambient light",
      ),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/industry/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa industrijske cone velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: levo proizvodno podjetje v prerezu s stroji, montažno linijo, skladiščem in pisarno, desno supermarket v prerezu s policami, hladilnimi vitrinami, zamrzovalniki in blagajnami, spredaj dvorišče s tovornjakom, parkirišče in cesta",
        "60 by 60 centimetre industry maquette of four 30 by 30 centimetre modules: on the left a manufacturing plant in section with machines, an assembly line, a warehouse and an office, on the right a supermarket in section with shelves, chillers, freezers and checkouts, and in front a yard with a lorry, a car park and a road",
      ),
      lightsDir: "/images/nexavia/showcase-room/industry/lights",
      modules: [
        {
          letter: "A",
          name: t("Proizvodnja", "Manufacturing"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t("Supermarket", "Supermarket"),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t("Dvorišče · logistika", "Yard · logistics"),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Parkirišče", "Car park"),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      lighting: [
        device(
          "FACTORY_01",
          t("Razsvetljava proizvodne hale", "Production hall lighting"),
        ),
        device(
          "MARKET_01",
          t("Razsvetljava prodajnega prostora", "Sales floor lighting"),
        ),
        device("SIGN_01", t("Svetlobni napis", "Illuminated sign")),
        device("LAMP_01", t("Svetilka dvorišča 1", "Yard lamp 1"), true),
        device("LAMP_02", t("Svetilka dvorišča 2", "Yard lamp 2"), true),
        device("LAMP_03", t("Svetilka parkirišča 1", "Car park lamp 1"), true),
        device("LAMP_04", t("Svetilka parkirišča 2", "Car park lamp 2"), true),
      ],
      sensors: [
        {
          key: "lux",
          id: "LIGHT_03",
          tone: "light",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor"),
          event: t("Svetloba okolice", "Ambient light"),
          at: at("lux"),
          side: "below",
          every: every5,
          uses: t(
            "Pravilo: svetloba < 25 lx → vklop razsvetljave",
            "Rule: light < 25 lx → lighting on",
          ),
          card: {
            kind: "sensor",
            title: t("Svetloba okolice", "Ambient light"),
            value: "52 lx",
            note: t("Zid proizvodne hale", "Production hall wall"),
          },
        },
        {
          key: "hall-temp",
          id: "HALL_TH_01",
          tone: "air",
          tag: "°C",
          label: t(
            "Senzor temperature in vlage v hali",
            "Hall temperature and humidity sensor",
          ),
          event: t("Proizvodna hala", "Production hall"),
          eventNote: true,
          at: at("hall-temp"),
          side: "below",
          align: "start",
          alert: 30,
          every: every5,
          uses: t(
            "Pravilo: temperatura > 30 °C → prezračevanje in obvestilo",
            "Rule: temperature > 30 °C → ventilation and a notification",
          ),
          card: {
            kind: "sensor",
            title: t("Klima v proizvodni hali", "Production hall climate"),
            value: d("22.4 °C"),
            grid: [
              {
                label: t("Temperatura", "Temperature"),
                key: "hall-temp",
                value: d("22.4 °C"),
              },
              { label: t("Vlaga", "Humidity"), key: "hall-rh", value: pct(46) },
            ],
          },
        },
        {
          key: "wh-rh",
          id: "WH_TH_01",
          tone: "air",
          tag: "% RH",
          label: t(
            "Senzor vlage in temperature v skladišču",
            "Warehouse humidity and temperature sensor",
          ),
          event: t("Skladišče", "Warehouse"),
          eventNote: true,
          at: at("wh-rh"),
          side: "below",
          alert: 60,
          every: every5,
          uses: t(
            "Pravilo: vlaga > 60 % dlje kot 15 min → razvlaževanje",
            "Rule: humidity > 60% for over 15 min → dehumidifying",
          ),
          card: {
            kind: "sensor",
            title: t("Klima v skladišču", "Warehouse climate"),
            value: pct(48),
            grid: [
              { label: t("Vlaga", "Humidity"), key: "wh-rh", value: pct(48) },
              {
                label: t("Temperatura", "Temperature"),
                key: "wh-temp",
                value: d("18.6 °C"),
              },
            ],
          },
        },
        {
          key: "factory-power",
          id: "FACTORY_POWER_01",
          tone: "power",
          tag: "kW",
          label: t("Električni števec proizvodnje", "Plant electricity meter"),
          event: t("Električni števec proizvodnje", "Plant electricity meter"),
          at: at("factory-power"),
          side: "below",
          align: "start",
          every: every15,
          card: {
            kind: "meter",
            title: t(
              "Poraba elektrike · proizvodnja",
              "Electricity use · plant",
            ),
            value: d("186.4 kW"),
            note: t("Trenutna moč", "Current load"),
          },
        },
        {
          key: "fridge-dairy",
          id: "FRIDGE_01",
          tone: "water",
          tag: "°C",
          label: t(
            "Senzor hladilne vitrine · mlečni izdelki",
            "Chiller sensor · dairy",
          ),
          event: t("Hladilna vitrina · mlečni izdelki", "Dairy chiller"),
          at: at("fridge-dairy"),
          side: "below",
          alert: 8,
          every: every5,
          uses: t(
            "Pravilo: temperatura > 8 °C dlje kot 10 min → alarm",
            "Rule: temperature > 8 °C for over 10 min → alarm",
          ),
          card: {
            kind: "sensor",
            title: t("Hladilna vitrina · mlečni izdelki", "Dairy chiller"),
            value: d("3.8 °C"),
            note: t("Meja 8 °C", "Limit 8 °C"),
          },
        },
        {
          key: "fridge-meat",
          id: "FRIDGE_02",
          tone: "water",
          tag: "°C",
          label: t(
            "Senzor hladilne vitrine · meso in delikatesa",
            "Chiller sensor · meat and deli",
          ),
          event: t("Hladilna vitrina · meso", "Meat chiller"),
          at: at("fridge-meat"),
          side: "below",
          alert: 4,
          every: every5,
          uses: t(
            "Pravilo: temperatura > 4 °C dlje kot 10 min → alarm",
            "Rule: temperature > 4 °C for over 10 min → alarm",
          ),
          card: {
            kind: "sensor",
            title: t("Hladilna vitrina · meso", "Meat chiller"),
            value: d("1.6 °C"),
            note: t("Meja 4 °C", "Limit 4 °C"),
          },
        },
        {
          key: "coldroom",
          id: "COLDROOM_01",
          tone: "water",
          tag: "°C",
          label: t("Senzor hladilnice", "Cold room sensor"),
          event: t("Hladilnica", "Cold room"),
          at: at("coldroom"),
          side: "below",
          align: "end",
          alert: 5,
          every: every5,
          card: {
            kind: "sensor",
            title: t("Hladilnica", "Cold room"),
            value: d("2.1 °C"),
            note: t("Vrata zaprta", "Door closed"),
          },
        },
        {
          key: "freezer",
          id: "FREEZER_01",
          tone: "water",
          tag: "°C",
          label: t("Senzor zamrzovalnih skrinj", "Chest freezer sensor"),
          event: t("Zamrzovalne skrinje", "Chest freezers"),
          at: at("freezer"),
          side: "below",
          align: "end",
          alert: -15,
          every: every5,
          uses: t(
            "Pravilo: temperatura > −15 °C dlje kot 10 min → alarm",
            "Rule: temperature > −15 °C for over 10 min → alarm",
          ),
          card: {
            kind: "sensor",
            title: t("Zamrzovalne skrinje", "Chest freezers"),
            value: d("-21.4 °C"),
            note: t("Meja −15 °C", "Limit −15 °C"),
          },
        },
        {
          key: "freezer-wall",
          id: "FREEZER_02",
          tone: "water",
          tag: "°C",
          label: t("Senzor zamrzovalnih omar", "Upright freezer sensor"),
          event: t("Zamrzovalne omare", "Upright freezers"),
          at: at("freezer-wall"),
          side: "below",
          align: "end",
          alert: -15,
          every: every5,
          card: {
            kind: "sensor",
            title: t("Zamrzovalne omare", "Upright freezers"),
            value: d("-19.8 °C"),
            note: t("Meja −15 °C", "Limit −15 °C"),
          },
        },
        {
          key: "market-power",
          id: "MARKET_POWER_01",
          tone: "power",
          tag: "kW",
          label: t(
            "Električni števec supermarketa",
            "Supermarket electricity meter",
          ),
          event: t(
            "Električni števec supermarketa",
            "Supermarket electricity meter",
          ),
          at: at("market-power"),
          side: "above",
          align: "end",
          every: every15,
          card: {
            kind: "meter",
            title: t(
              "Poraba elektrike · supermarket",
              "Electricity use · supermarket",
            ),
            value: d("64.2 kW"),
            note: t("Od tega hlajenje 41 %", "Refrigeration 41% of it"),
          },
        },
      ],
      loader: {
        subject: t(
          "Maketa 60 × 60 cm · 4 moduli",
          "Model 60 × 60 cm · 4 modules",
        ),
        stage: t("Nalaganje modela industrije", "Loading the industry model"),
      },
    },
    dashboard: {
      title: t("Pregled industrije", "Industry overview"),
      subtitle: t(
        "2 objekta · 4 zunanje svetilke · demonstracijski podatki",
        "2 buildings · 4 outdoor lamps · simulated data",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices"),
          value: "0 / 7",
          note: t("V obeh objektih", "Across both buildings"),
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
          value: "52 lx",
          note: t("Senzor LIGHT_03", "Sensor LIGHT_03"),
        },
      ],
      rule: t("Pravilo: svetloba < 25 lx", "Rule: light < 25 lx"),
      ruleStatus: t("Čaka na naslednjo meritev", "Waiting for next reading"),
      devices: [
        { id: "FACTORY_01", name: t("Proizvodna hala", "Production hall") },
        { id: "MARKET_01", name: t("Prodajni prostor", "Sales floor") },
        { id: "SIGN_01", name: t("Svetlobni napis", "Illuminated sign") },
        { id: "LAMP_01", name: t("Svetilka dvorišča 1", "Yard lamp 1") },
        { id: "LAMP_02", name: t("Svetilka dvorišča 2", "Yard lamp 2") },
        { id: "LAMP_03", name: t("Svetilka parkirišča 1", "Car park lamp 1") },
        { id: "LAMP_04", name: t("Svetilka parkirišča 2", "Car park lamp 2") },
      ],
      group: t("Zunanja razsvetljava", "Outdoor lighting"),
      alarms: [
        {
          id: "FREEZER_02",
          text: t(
            "Vrata zamrzovalne omare odprta · 4 min",
            "Freezer door open · 4 min",
          ),
        },
        {
          id: "LAMP_04",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
          ),
        },
      ],
      meters: {
        title: t("Proizvodno podjetje", "Manufacturing plant"),
        rows: [
          {
            label: t("Temperatura v hali", "Hall temperature"),
            id: "HALL_TH_01",
            key: "hall-temp",
            value: d("22.4 °C"),
            note: t("Vlaga 46 %", "Humidity 46%"),
          },
          {
            label: t("Vlaga v skladišču", "Warehouse humidity"),
            id: "WH_TH_01",
            key: "wh-rh",
            value: pct(48),
            note: d("18.6 °C"),
          },
          {
            label: t("Elektrika proizvodnje", "Plant electricity"),
            id: "FACTORY_POWER_01",
            key: "factory-power",
            value: d("186.4 kW"),
          },
        ],
      },
      sensors: {
        title: t("Supermarket", "Supermarket"),
        rows: [
          {
            label: t("Vitrina · mlečni izdelki", "Dairy chiller"),
            id: "FRIDGE_01",
            key: "fridge-dairy",
            value: d("3.8 °C"),
            note: t("Normalno", "Normal"),
          },
          {
            label: t("Vitrina · meso", "Meat chiller"),
            id: "FRIDGE_02",
            key: "fridge-meat",
            value: d("1.6 °C"),
          },
          {
            label: t("Hladilnica", "Cold room"),
            id: "COLDROOM_01",
            key: "coldroom",
            value: d("2.1 °C"),
          },
          {
            label: t("Zamrzovalne skrinje", "Chest freezers"),
            id: "FREEZER_01",
            key: "freezer",
            value: d("-21.4 °C"),
            note: t("Normalno", "Normal"),
          },
          {
            label: t("Zamrzovalne omare", "Upright freezers"),
            id: "FREEZER_02",
            key: "freezer-wall",
            value: d("-19.8 °C"),
          },
          {
            label: t("Elektrika supermarketa", "Supermarket electricity"),
            id: "MARKET_POWER_01",
            key: "market-power",
            value: d("64.2 kW"),
          },
        ],
      },
    },
  };
}
