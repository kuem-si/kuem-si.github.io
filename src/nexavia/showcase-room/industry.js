import { initTraffic } from "./traffic.js";
import geometry from "../../components/nexavia/showcase/industry-geometry.json";

// The industry twin: a manufacturing plant and a supermarket, both shown in
// section, with their lighting under one rule. In the plant the meters follow
// electricity, compressed air, gas and water to every line and the machines
// report for OEE; in the store the sensors watch the cold chain, the shoppers
// and the car park. Driven by twin.js; the maquette and its geometry come from
// scripts/generate-industry-maquette.mjs.

const LAMPS = ["LAMP_01", "LAMP_02", "LAMP_03", "LAMP_04"];
const ALL = ["FACTORY_01", "MARKET_01", "SIGN_01", ...LAMPS];
const off = () => Array(ALL.length).fill(0);
// Camera framings on the model (scene pixels).
const VIEW = {
  plant: { x: 480, y: 250, zoom: 1.5, radius: 0.34 },
  hall: { x: 440, y: 210, zoom: 1.5, radius: 0.3 },
  line: { x: 540, y: 170, zoom: 1.7, radius: 0.24 },
  warehouse: { x: 680, y: 210, zoom: 1.5, radius: 0.28 },
  yard: { x: 650, y: 480, zoom: 1.6, radius: 0.3 },
  store: { x: 1060, y: 240, zoom: 1.5, radius: 0.34 },
  chillers: { x: 940, y: 160, zoom: 1.5, radius: 0.28 },
  freezers: { x: 1170, y: 220, zoom: 1.5, radius: 0.28 },
  coldroom: { x: 1180, y: 190, zoom: 1.7, radius: 0.24 },
  outdoors: { x: 768, y: 500, zoom: 1.2, radius: 0.45 },
};

// Traffic: cars on the road and through the car park, shoppers on their
// rounds of the store, staff in the plant. Routes, scripted people and the
// scenery in front of them are generated.
const TRAFFIC = {
  id: "industry",
  routes: geometry.traffic.routes,
  occluders: geometry.traffic.occluders,
  actors: geometry.traffic.actors,
  masks: true,
  counts: { car: 5, cyclist: 1, pedestrian: 10 },
};

export const industry = {
  effects: [(root) => initTraffic(root, TRAFFIC)],
  // The radio gateway on the plant's back wall.
  gateway: { id: "GW_03", at: geometry.points.gateway },
  devices: (t) => [
    {
      id: "FACTORY_01",
      name: t("Proizvodna hala", "Production hall", "Produktionshalle"),
      watts: 2400,
    },
    {
      id: "MARKET_01",
      name: t("Prodajni prostor", "Sales floor", "Verkaufsfläche"),
      watts: 1800,
    },
    {
      id: "SIGN_01",
      name: t("Svetlobni napis", "Illuminated sign", "Leuchtschild"),
      watts: 120,
    },
    {
      id: "LAMP_01",
      name: t("Svetilka dvorišča 1", "Yard lamp 1", "Hofleuchte 1"),
      watts: 90,
    },
    {
      id: "LAMP_02",
      name: t("Svetilka dvorišča 2", "Yard lamp 2", "Hofleuchte 2"),
      watts: 90,
    },
    {
      id: "LAMP_03",
      name: t("Svetilka parkirišča 1", "Car park lamp 1", "Parkplatzleuchte 1"),
      watts: 90,
    },
    {
      id: "LAMP_04",
      name: t("Svetilka parkirišča 2", "Car park lamp 2", "Parkplatzleuchte 2"),
      watts: 90,
    },
  ],
  group: {
    ids: LAMPS,
    subject: "LAMP_01–LAMP_04",
    name: (t) => t("Zunanje svetilke", "Outdoor lamps", "Außenleuchten"),
  },
  // Pieces, visitors and minutes of downtime only ever count up.
  counters: ["line-robot", "line-mould", "people", "terminal"],
  steps: (t) => [
    {
      at: "day",
      text: t(
        "Senzor LIGHT_03: 52 lx · dovolj dnevne svetlobe",
        "Sensor LIGHT_03: 52 lx · enough daylight",
        "Sensor LIGHT_03: 52 lx · genug Tageslicht",
      ),
      lux: 52,
      states: off(),
      rule: t(
        "Pogoj ni izpolnjen · razsvetljava izklopljena",
        "Condition not met · lighting is off",
        "Bedingung nicht erfüllt · Beleuchtung aus",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_03 · Svetloba okolice 52 lx",
            "LIGHT_03 · Ambient light 52 lx",
            "LIGHT_03 · Umgebungs\u00adlicht 52 lx",
          ),
        ],
      ],
    },
    {
      at: "dusk",
      text: t(
        "Senzor LIGHT_03: 21 lx · sonce zahaja",
        "Sensor LIGHT_03: 21 lx · the sun is setting",
        "Sensor LIGHT_03: 21 lx · die Sonne geht unter",
      ),
      lux: 21,
      states: off(),
      rule: t(
        "Pogoj izpolnjen · ukaz se pošilja prek GW_03",
        "Condition met · command sent via GW_03",
        "Bedingung erfüllt · Befehl über GW_03 gesendet",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_03 · Svetloba okolice 21 lx · prek prehoda GW_03",
            "LIGHT_03 · Ambient light 21 lx · via gateway GW_03",
            "LIGHT_03 · Umgebungs\u00adlicht 21 lx · über Gateway GW_03",
          ),
        ],
        [
          "decision",
          t(
            "Pravilo svetloba < 25 lx izpolnjeno (21 lx) → vklop razsvetljave, najprej zunanje svetilke",
            "Rule light < 25 lx met (21 lx) → lighting on, outdoor lamps first",
            "Regel Licht < 25 lx erfüllt (21 lx) → Beleuchtung ein, zuerst die Außenleuchten",
          ),
        ],
      ],
    },
    {
      at: "dusk+10",
      text: t(
        "Na dvorišču in parkirišču se prižgejo svetilke",
        "The yard and car park lamps switch on",
        "Die Leuchten auf Hof und Parkplatz gehen an",
      ),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1, 1],
      rule: t(
        "Aktivno · najprej varna pot do vozil",
        "Active · safe way to the vehicles first",
        "Aktiv · zuerst ein sicherer Weg zu den Fahrzeugen",
      ),
      log: [
        [
          "command",
          t(
            "LAMP_01–LAMP_04 · Zunanje svetilke vklopljene",
            "LAMP_01–LAMP_04 · Outdoor lamps switched on",
            "LAMP_01–LAMP_04 · Außenleuchten eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+20",
      text: t(
        "Zasveti napis supermarketa",
        "The supermarket sign lights up",
        "Das Schild des Supermarkts leuchtet auf",
      ),
      lux: 21,
      states: [0, 0, 1, 1, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
        "Aktiv · automatische Lichtsteuerung",
      ),
      log: [
        [
          "command",
          t(
            "SIGN_01 · Svetlobni napis vklopljen",
            "SIGN_01 · Illuminated sign switched on",
            "SIGN_01 · Leuchtschild eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+30",
      text: t(
        "V prodajnem prostoru se prižgejo luči",
        "The sales floor lights switch on",
        "Auf der Verkaufsfläche gehen die Lichter an",
      ),
      lux: 21,
      states: [0, 1, 1, 1, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
        "Aktiv · automatische Lichtsteuerung",
      ),
      log: [
        [
          "command",
          t(
            "MARKET_01 · Razsvetljava vklopljena",
            "MARKET_01 · Lighting switched on",
            "MARKET_01 · Beleuchtung eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+40",
      text: t(
        "Popoldanska izmena dobi polno svetlobo",
        "The late shift gets full light",
        "Die Spätschicht bekommt volles Licht",
      ),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1, 1],
      rule: t(
        "Samodejna razsvetljava je aktivna",
        "Automatic lighting active",
        "Automatische Beleuchtung aktiv",
      ),
      log: [
        [
          "command",
          t(
            "FACTORY_01 · Razsvetljava hale vklopljena",
            "FACTORY_01 · Hall lighting switched on",
            "FACTORY_01 · Hallenbeleuchtung eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dawn",
      text: t(
        "Svetloba se vrne · sistem ugasne luči",
        "Daylight returns · system switches lights off",
        "Das Tageslicht kehrt zurück · das System schaltet die Lichter aus",
      ),
      lux: 52,
      states: off(),
      rule: t(
        "Pogoj ni več izpolnjen · luči izklopljene",
        "Condition no longer met · lights switched off",
        "Bedingung nicht mehr erfüllt · Lichter ausgeschaltet",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_03 · Svetloba okolice 52 lx",
            "LIGHT_03 · Ambient light 52 lx",
            "LIGHT_03 · Umgebungs\u00adlicht 52 lx",
          ),
        ],
        [
          "decision",
          t(
            "Pravilo svetloba < 25 lx ni več izpolnjeno → izklop razsvetljave",
            "Rule light < 25 lx no longer met → lighting off",
            "Regel Licht < 25 lx nicht mehr erfüllt → Beleuchtung aus",
          ),
        ],
        [
          "command",
          t(
            "Vse luči izklopljene",
            "All lights switched off",
            "Alle Lichter ausgeschaltet",
          ),
        ],
      ],
    },
  ],
  // The freezer door is shut after a while; the weak gateway signal to the
  // far car park lamp stays.
  alarms: (index) =>
    index === 3 || index === 4 ? ["LAMP_04"] : ["FREEZER_02", "LAMP_04"],
  tick(index, { setReading, t, n }) {
    const i = index % 7;
    const hallRh = 46 + [0, 1, 1, 2, 1, 0, -1][i];
    setReading(
      "hall-temp",
      `${n(22.4 + [0, 0.2, 0.5, 0.7, 0.4, 0.1, -0.2][i], 1)} °C`,
      t(`Vlaga ${hallRh} %`, `Humidity ${hallRh}%`, `Feuchte ${hallRh} %`),
    );
    setReading("hall-rh", t(`${hallRh} %`, `${hallRh}%`, `${hallRh} %`));
    const whTemp = `${n(18.6 + [0, 0.1, 0.2, 0.2, 0.1, 0, -0.1][i], 1)} °C`;
    const whRh = 48 + [0, 1, 2, 1, 0, -1, 0][i];
    setReading("wh-rh", t(`${whRh} %`, `${whRh}%`, `${whRh} %`), whTemp);
    setReading("wh-temp", whTemp);
    setReading(
      "factory-power",
      `${n(186.4 + [0, 3.2, 6.8, 4.1, -2.6, -8.4, -3.1][i], 1)} kW`,
    );
    setReading(
      "fridge-dairy",
      `${n(3.8 + [0, 0.2, 0.4, 0.1, -0.2, -0.1, 0.3][i], 1)} °C`,
    );
    setReading(
      "fridge-meat",
      `${n(1.6 + [0, 0.1, 0.3, 0.2, 0, -0.1, 0.1][i], 1)} °C`,
    );
    setReading(
      "coldroom",
      `${n(2.1 + [0, 0.1, 0.2, 0.4, 0.2, 0, -0.1][i], 1)} °C`,
    );
    setReading(
      "freezer",
      `${n(-21.4 + [0, 0.3, 0.6, 0.2, -0.2, -0.4, 0.1][i], 1)} °C`,
    );
    setReading(
      "freezer-wall",
      `${n(-19.8 + [0, 0.4, 1.1, 0.6, 0.1, -0.2, 0.2][i], 1)} °C`,
    );
    setReading(
      "market-power",
      `${n(64.2 + [0, 0.8, 1.9, 2.4, 1.1, -0.6, -1.2][i], 1)} kW`,
    );

    // The plant's supply: the main board carries the hall, the compressors
    // and the rest of the site; the peak KPI follows it.
    const main = 371.2 + [0, 4.2, 9.6, 6.1, -3.8, -10.4, -4.6][i];
    setReading("main-power", `${n(main, 1)} kW`);
    const share = Math.round((main / 400) * 100);
    setReading(
      "kpi-peak",
      t(`${share} %`, `${share}%`, `${share} %`),
      t(
        `${Math.round(main)} od 400 kW`,
        `${Math.round(main)} of 400 kW`,
        `${Math.round(main)} von 400 kW`,
      ),
    );
    const air = 540 + [0, 12, 26, 18, -8, -22, -10][i];
    setReading("air", `${air} Nm³/h`);
    setReading(
      "air-bar",
      `${n(7.1 - [0, 0.05, 0.1, 0.05, 0, -0.05, 0][i], 1)} bar`,
    );
    setReading("air-kw", `${n(air * 0.097, 1)} kW`);
    setReading(
      "gas",
      `${n(14.2 + [0, 0.4, 0.9, 0.6, -0.3, -0.8, -0.2][i], 1)} m³/h`,
    );
    setReading(
      "water",
      `${n(1.8 + [0, 0.1, 0.3, 0.2, -0.1, -0.2, 0][i], 1)} m³/h`,
    );
    // The lines: pieces count up, the robot's vibration drifts on its slow
    // rise.
    const step = index + 1;
    setReading("line-robot", String(1284 + step * 3));
    setReading(
      "line-robot-cycle",
      `${n(22.4 + [0, 0.1, -0.1, 0.2, 0, -0.1, 0.1][i], 1)} s`,
    );
    setReading("line-mould", String(2316 + step * 6));
    setReading("line-cnc-pcs", String(412 + step));
    setReading(
      "robot-vib",
      `${n(3.4 + [0, 0.05, 0.1, 0.05, 0, 0.1, 0.05][i], 1)} mm/s`,
    );
    // The store: chillers and shoppers.
    setReading(
      "refrig",
      `${n(26.3 + [0, 0.6, 1.4, 1.1, 0.3, -0.5, -0.8][i], 1)} kW`,
    );
    setReading(
      "deli",
      `${n(71.2 + [0, -0.4, -0.9, -0.3, 0.4, 0.8, 0.2][i], 1)} °C`,
    );
    setReading("people", String(1412 + step * 4));
    const waiting = [5, 6, 4, 7, 5, 3, 4][i];
    setReading("queue", String(waiting));
    setReading(
      "weather",
      `${n(24.8 + [0, 0.2, 0.4, 0.3, 0.1, -0.2, -0.3][i], 1)} °C`,
    );
  },
  scenarios,
};

// Guided scenarios. `t(sl, en, de)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
  const celsius = (v) => `${n(v, 1)} °C`;
  const percent = (v) =>
    t(`${Math.round(v)} %`, `${Math.round(v)}%`, `${Math.round(v)} %`);
  const kw = (v) => `${Math.round(v)} kW`;
  const mms = (v) => `${n(v, 1)} mm/s`;
  return [
    {
      // One reading followed from the sensor to the command it leads to.
      id: "how-it-works",
      intro: true,
      title: t(
        "Kako deluje: od senzorja do odločitve",
        "How it works: sensor to decision",
        "So funktioniert es: vom Sensor zur Entscheidung",
      ),
      setup(api) {
        api.showFlow(true);
        ALL.forEach((id) => api.setLevel(id, 0));
        api.setAlarms([]);
        api.pin("lux");
        api.narrate({
          rule: t(
            "Čaka na naslednjo meritev",
            "Waiting for next reading",
            "Wartet auf nächsten Messwert",
          ),
        });
      },
      steps: [
        {
          time: "19:52",
          focus: { x: 560, y: 130, zoom: 1.6, radius: 0.24 },
          title: t("Senzor meri", "A sensor measures", "Ein Sensor misst"),
          text: t(
            "Senzor svetlobe LIGHT_03 na zidu proizvodne hale meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut.",
            "Light sensor LIGHT_03 on the production hall wall measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes.",
            "Der Lichtsensor LIGHT_03 an der Wand der Produktionshalle misst das Tageslicht. In der Dämmerung fällt es unter 25 lx. Der Sensor läuft mit Batterie und meldet alle 5 Minuten.",
          ),
          run() {},
        },
        {
          time: "19:52",
          title: t(
            "Radio jo ponese do prehoda",
            "Radio carries it to the gateway",
            "Funk bringt den Wert zum Gateway",
          ),
          text: t(
            "Meritev po radiu LoRaWAN potuje do prehoda GW_03. En prehod pokrije oba objekta, zato noben senzor ne potrebuje kabla – niti tisti v hladilnici.",
            "The reading travels by LoRaWAN radio to gateway GW_03. One gateway covers both buildings, so no sensor needs a cable – not even the one in the cold room.",
            "Der Messwert gelangt per LoRaWAN-Funk zum Gateway GW_03. Ein Gateway deckt beide Gebäude ab, sodass kein Sensor ein Kabel braucht – nicht einmal der im Kühlraum.",
          ),
          run(api) {
            api.send("lux");
            api.log(
              t(
                "LIGHT_03 · Svetloba okolice pod 25 lx",
                "LIGHT_03 · Ambient light below 25 lx",
                "LIGHT_03 · Umgebungs\u00adlicht unter 25 lx",
              ),
              "19:52",
              "reading",
            );
          },
        },
        {
          time: "19:52",
          title: t(
            "Nexavia jo prejme",
            "Nexavia receives it",
            "Nexavia empfängt ihn",
          ),
          text: t(
            "Prehod meritev prek interneta posreduje Nexavii, ki jo shrani skupaj s časom. Ploščica svetlobe okolice na nadzorni plošči se posodobi.",
            "The gateway forwards the reading over the internet to Nexavia, which stores it with its time. The ambient light tile on the dashboard updates.",
            "Das Gateway leitet den Messwert über das Internet an Nexavia weiter, das ihn mit Zeitstempel speichert. Die Kachel für das Umgebungslicht im Dashboard wird aktualisiert.",
          ),
          run(api) {
            api.spotlight(api.$ui("lux")?.parentElement);
            api.log(
              t(
                "GW_03 → Nexavia · meritev shranjena",
                "GW_03 → Nexavia · reading stored",
                "GW_03 → Nexavia · Messwert gespeichert",
              ),
              "19:52",
              "system",
            );
          },
        },
        {
          time: "19:53",
          title: t(
            "Pravilo odloči",
            "A rule decides",
            "Eine Regel entscheidet",
          ),
          text: t(
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge svetilke na dvorišču in parkirišču.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to light the yard and the car park first.",
            "Nexavia prüft jeden neuen Messwert anhand seiner Regeln. Licht unter 25 lx erfüllt die Beleuchtungsregel, also beschließt Nexavia, zuerst Hof und Parkplatz zu beleuchten.",
          ),
          run(api) {
            api.spotlight(".twin-rule");
            api.narrate({
              rule: t(
                "Pogoj izpolnjen · svetloba < 25 lx",
                "Condition met · light < 25 lx",
                "Bedingung erfüllt · Licht < 25 lx",
              ),
            });
            api.log(
              t(
                "Pravilo svetloba < 25 lx izpolnjeno → vklop zunanjih svetilk",
                "Rule light < 25 lx met → outdoor lamps on",
                "Regel Licht < 25 lx erfüllt → Außenleuchten ein",
              ),
              "19:53",
              "decision",
            );
          },
        },
        {
          time: "19:53",
          focus: VIEW.outdoors,
          title: t(
            "Ukaz gre nazaj",
            "A command goes back",
            "Ein Befehl geht zurück",
          ),
          text: t(
            "Nexavia prek prehoda pošlje ukaz vsaki zunanji svetilki – rumeni paketi. Svetilke potrdijo in nadzorna plošča jih prikaže kot vklopljene.",
            "Nexavia sends a command back through the gateway to each outdoor lamp – the yellow packets. The lamps confirm, and the dashboard shows them on.",
            "Nexavia schickt über das Gateway einen Befehl an jede Außenleuchte – die gelben Pakete. Die Leuchten bestätigen, und das Dashboard zeigt sie als eingeschaltet.",
          ),
          run(api) {
            LAMPS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(api.$row("LAMP_01"));
            api.log(
              t(
                "LAMP_01–LAMP_04 · Ukaz: vklop",
                "LAMP_01–LAMP_04 · Command: switch on",
                "LAMP_01–LAMP_04 · Befehl: einschalten",
              ),
              "19:53",
              "command",
            );
          },
        },
        {
          time: "19:54",
          title: t(
            "Vse je zabeleženo",
            "Everything is on record",
            "Alles wird protokolliert",
          ),
          text: t(
            "Časovnica hrani celotno verigo: meritev, odločitev, ukaz. Zdaj poskusite sami – kliknite kateri koli senzor, da pošlje meritev, ali preklopite luč.",
            "The timeline keeps the whole chain: reading, decision, command. Now try it yourself – click any sensor to send a reading, or switch a light.",
            "Die Zeitachse hält die ganze Kette fest: Messwert, Entscheidung, Befehl. Probieren Sie es jetzt selbst – klicken Sie auf einen Sensor, um einen Messwert zu senden, oder schalten Sie ein Licht.",
          ),
          run(api) {
            api.spotlight(".twin-event");
          },
        },
      ],
    },
    {
      id: "chiller",
      title: t(
        "Okvara hladilne vitrine",
        "A chiller fails",
        "Ein Kühlregal fällt aus",
      ),
      setup(api) {
        api.setReading(
          "fridge-dairy",
          celsius(3.8),
          t("Normalno", "Normal", "Normal"),
        );
        api.setReading("coldroom", celsius(2.1));
        api.setLevel("MARKET_01", 1);
        api.setAlarms([]);
        api.pin("fridge-dairy");
        api.narrate({
          rule: t(
            "Pravilo: vitrina > 8 °C dlje kot 10 min",
            "Rule: chiller > 8 °C for over 10 min",
            "Regel: Kühlregal > 8 °C länger als 10 min",
          ),
        });
      },
      steps: [
        {
          time: "10:20",
          focus: VIEW.chillers,
          title: t(
            "Običajno dopoldne",
            "An ordinary morning",
            "Ein gewöhnlicher Vormittag",
          ),
          text: t(
            "Senzor FRIDGE_01 v vitrini z mlečnimi izdelki meri temperaturo vsakih 5 minut. Zapis meritev je obenem evidenca HACCP – brez ročnega vpisovanja.",
            "Sensor FRIDGE_01 in the dairy chiller measures the temperature every 5 minutes. The record doubles as the HACCP log – nothing to write down by hand.",
            "Der Sensor FRIDGE_01 im Molkereikühlregal misst die Temperatur alle 5 Minuten. Die Aufzeichnung dient zugleich als HACCP-Protokoll – nichts muss von Hand notiert werden.",
          ),
          run(api) {
            api.spotlight(api.$reading("fridge-dairy"));
          },
        },
        {
          time: "10:45",
          title: t(
            "Kompresor odpove",
            "The compressor fails",
            "Der Kompressor fällt aus",
          ),
          text: t(
            "Kompresor vitrine se ustavi. Kupci tega ne opazijo, temperatura pa začne naraščati.",
            "The chiller's compressor stops. Shoppers notice nothing, but the temperature starts to climb.",
            "Der Kompressor des Kühlregals bleibt stehen. Die Kunden merken nichts, aber die Temperatur beginnt zu steigen.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              3.8,
              7.2,
              celsius,
              t("Narašča", "Rising", "Steigend"),
            );
            api.log(
              t(
                "FRIDGE_01 · 7,2 °C · narašča",
                "FRIDGE_01 · 7.2 °C · rising",
                "FRIDGE_01 · 7,2 °C · steigend",
              ),
              "10:45",
              "reading",
            );
          },
        },
        {
          time: "10:57",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Temperatura je nad 8 °C že več kot 10 minut. Nexavia odpre alarm, še preden je blago ogroženo.",
            "The temperature has been above 8 °C for more than 10 minutes. Nexavia opens an alarm before the goods are at risk.",
            "Die Temperatur liegt seit mehr als 10 Minuten über 8 °C. Nexavia öffnet einen Alarm, bevor die Ware gefährdet ist.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              7.2,
              9.4,
              celsius,
              t("Nad mejo", "Over the limit", "Über dem Grenzwert"),
            );
            api.setAlarms([
              [
                "FRIDGE_01",
                t(
                  "9,4 °C · meja 8 °C · 10 min",
                  "9.4 °C · limit 8 °C · 10 min",
                  "9,4 °C · Grenze 8 °C · 10 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "FRIDGE_01 · Alarm: previsoka temperatura",
                "FRIDGE_01 · Alarm: temperature too high",
                "FRIDGE_01 · Alarm: Temperatur zu hoch",
              ),
              "10:57",
              "alarm",
            );
          },
        },
        {
          time: "10:58",
          title: t(
            "Poslovodja in servis obveščena",
            "Manager and service alerted",
            "Marktleitung und Service alarmiert",
          ),
          text: t(
            "Poslovodja prejme obvestilo na telefon, servis hladilne tehnike pa nalog z zgodovino meritev. Osebje blago preloži v hladilnico.",
            "The store manager gets a notification on the phone, and the refrigeration service a work order with the reading history. Staff move the goods to the cold room.",
            "Die Marktleitung erhält eine Benachrichtigung aufs Telefon und der Kältedienst einen Arbeitsauftrag mit der Messhistorie. Das Personal bringt die Ware in den Kühlraum.",
          ),
          run(api, play) {
            api.pin("coldroom");
            api.spotlight(api.$reading("coldroom"));
            play.toast(
              t(
                "Alarm: hladilna vitrina",
                "Alarm: chiller",
                "Alarm: Kühlregal",
              ),
              t(
                "Mlečni izdelki · 9,4 °C · preložite blago",
                "Dairy · 9.4 °C · move the goods",
                "Molkereiprodukte · 9,4 °C · Ware umlagern",
              ),
              "10:58",
            );
            api.log(
              t(
                "FRIDGE_01 · Obveščena poslovodja in servis",
                "FRIDGE_01 · Manager and service notified",
                "FRIDGE_01 · Marktleitung und Service benachrichtigt",
              ),
              "10:58",
              "notify",
            );
          },
        },
        {
          time: "12:30",
          focus: VIEW.chillers,
          title: t(
            "Vitrina spet hladi",
            "The chiller cools again",
            "Das Kühlregal kühlt wieder",
          ),
          text: t(
            "Serviser zamenja rele kompresorja. Temperatura pade pod mejo in alarm se zapre. Blago ni bilo zavrženo, dogodek pa ostane v evidenci.",
            "The technician replaces the compressor relay. The temperature falls below the limit and the alarm closes. No goods were thrown away, and the event stays on record.",
            "Der Techniker tauscht das Kompressorrelais. Die Temperatur fällt unter den Grenzwert und der Alarm schließt sich. Es musste keine Ware entsorgt werden, und das Ereignis bleibt dokumentiert.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              9.4,
              3.9,
              celsius,
              t("Normalno", "Normal", "Normal"),
            );
            api.setAlarms([]);
            api.pin("fridge-dairy");
            api.spotlight(api.$reading("fridge-dairy"));
            api.log(
              t(
                "FRIDGE_01 · 3,9 °C · alarm zaprt",
                "FRIDGE_01 · 3.9 °C · alarm closed",
                "FRIDGE_01 · 3,9 °C · Alarm geschlossen",
              ),
              "12:30",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "freezer",
      title: t(
        "Zamrzovalnik ponoči",
        "A freezer at night",
        "Ein Tiefkühler in der Nacht",
      ),
      setup(api) {
        api.setReading(
          "freezer",
          celsius(-21.4),
          t("Normalno", "Normal", "Normal"),
        );
        api.setLevel("MARKET_01", 0);
        api.setLevel("SIGN_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("freezer");
        api.narrate({
          rule: t(
            "Pravilo: zamrzovalnik > −15 °C dlje kot 10 min",
            "Rule: freezer > −15 °C for over 10 min",
            "Regel: Tiefkühler > −15 °C länger als 10 min",
          ),
        });
      },
      steps: [
        {
          time: "02:10",
          focus: VIEW.freezers,
          title: t(
            "Trgovina je zaprta",
            "The store is closed",
            "Der Markt ist geschlossen",
          ),
          text: t(
            "Ponoči v trgovini ni nikogar. Senzor FREEZER_01 v zamrzovalnih skrinjah meri naprej.",
            "At night nobody is in the store. Sensor FREEZER_01 in the chest freezers keeps measuring.",
            "Nachts ist niemand im Markt. Der Sensor FREEZER_01 in den Tiefkühltruhen misst weiter.",
          ),
          run(api) {
            api.spotlight(api.$reading("freezer"));
          },
        },
        {
          time: "02:40",
          title: t(
            "Izpad varovalke",
            "A breaker trips",
            "Eine Sicherung löst aus",
          ),
          text: t(
            "Varovalka tokokroga zamrzovalnih skrinj izpade. Temperatura se počasi dviga.",
            "The breaker on the chest freezers' circuit trips. The temperature rises slowly.",
            "Die Sicherung im Stromkreis der Tiefkühltruhen löst aus. Die Temperatur steigt langsam.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -21.4,
              -16.8,
              celsius,
              t("Narašča", "Rising", "Steigend"),
            );
            api.log(
              t(
                "FREEZER_01 · −16,8 °C · narašča",
                "FREEZER_01 · −16.8 °C · rising",
                "FREEZER_01 · −16,8 °C · steigend",
              ),
              "02:40",
              "reading",
            );
          },
        },
        {
          time: "03:05",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Temperatura preseže −15 °C in tam ostane. Brez nadzora bi napako opazili šele zjutraj – z odtajanim blagom.",
            "The temperature passes −15 °C and stays there. Without monitoring, the fault would be found in the morning – with the stock thawed.",
            "Die Temperatur überschreitet −15 °C und bleibt dort. Ohne Überwachung würde der Fehler erst am Morgen entdeckt – mit aufgetauter Ware.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -16.8,
              -13.9,
              celsius,
              t("Nad mejo", "Over the limit", "Über dem Grenzwert"),
            );
            api.setAlarms([
              [
                "FREEZER_01",
                t(
                  "−13,9 °C · meja −15 °C · 10 min",
                  "−13.9 °C · limit −15 °C · 10 min",
                  "−13,9 °C · Grenze −15 °C · 10 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "FREEZER_01 · Alarm: zamrzovalnik se segreva",
                "FREEZER_01 · Alarm: freezer warming up",
                "FREEZER_01 · Alarm: Tiefkühler erwärmt sich",
              ),
              "03:05",
              "alarm",
            );
          },
        },
        {
          time: "03:06",
          focus: VIEW.store,
          title: t(
            "Dežurni dobi klic",
            "The person on call is alerted",
            "Die Bereitschaft wird alarmiert",
          ),
          text: t(
            "Dežurni prejme SMS in klic. Nexavia prižge luči v prodajnem prostoru, da lahko takoj pregleda zamrzovalnike.",
            "The person on call gets an SMS and a call. Nexavia switches on the sales floor lights so the freezers can be checked straight away.",
            "Die Bereitschaft erhält eine SMS und einen Anruf. Nexavia schaltet das Licht auf der Verkaufsfläche ein, damit die Tiefkühler sofort geprüft werden können.",
          ),
          run(api, play) {
            api.setLevel("MARKET_01", 1);
            api.spotlight(api.$row("MARKET_01"));
            play.toast(
              t("Alarm: zamrzovalnik", "Alarm: freezer", "Alarm: Tiefkühler"),
              t(
                "Zamrzovalne skrinje · −13,9 °C",
                "Chest freezers · −13.9 °C",
                "Tiefkühltruhen · −13,9 °C",
              ),
              "03:06",
            );
            api.log(
              t(
                "MARKET_01 · Razsvetljava vklopljena za dežurnega",
                "MARKET_01 · Lights on for the person on call",
                "MARKET_01 · Licht für die Bereitschaft eingeschaltet",
              ),
              "03:06",
              "command",
            );
          },
        },
        {
          time: "03:40",
          focus: VIEW.freezers,
          title: t(
            "Blago rešeno",
            "The stock is saved",
            "Die Ware ist gerettet",
          ),
          text: t(
            "Dežurni vklopi varovalko. Skrinje se ohladijo, alarm se zapre in luči ugasnejo. Zamrznjeno blago je ostalo ves čas pod −12 °C.",
            "The person on call resets the breaker. The freezers cool down, the alarm closes and the lights go out. The frozen stock stayed below −12 °C throughout.",
            "Die Bereitschaft schaltet die Sicherung wieder ein. Die Truhen kühlen ab, der Alarm schließt sich und das Licht geht aus. Die Tiefkühlware blieb die ganze Zeit unter −12 °C.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -13.9,
              -20.6,
              celsius,
              t("Normalno", "Normal", "Normal"),
            );
            api.setAlarms([]);
            api.setLevel("MARKET_01", 0);
            api.spotlight(api.$reading("freezer"));
            api.log(
              t(
                "FREEZER_01 · −20,6 °C · alarm zaprt",
                "FREEZER_01 · −20.6 °C · alarm closed",
                "FREEZER_01 · −20,6 °C · Alarm geschlossen",
              ),
              "03:40",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "humidity",
      title: t(
        "Vlaga v skladišču",
        "Humidity in the warehouse",
        "Feuchte im Lager",
      ),
      setup(api) {
        api.setReading("wh-rh", percent(48), celsius(18.6));
        api.setReading("wh-temp", celsius(18.6));
        api.setLevel("FACTORY_01", 1);
        api.setAlarms([]);
        api.pin("wh-rh");
        api.narrate({
          rule: t(
            "Pravilo: vlaga v skladišču > 60 % dlje kot 15 min",
            "Rule: warehouse humidity > 60% for over 15 min",
            "Regel: Feuchte im Lager > 60 % länger als 15 min",
          ),
        });
      },
      steps: [
        {
          time: "13:10",
          focus: VIEW.warehouse,
          title: t("Suho skladišče", "A dry warehouse", "Ein trockenes Lager"),
          text: t(
            "Senzor WH_TH_01 med regali meri vlago in temperaturo. Kartonska embalaža in kovinski deli potrebujejo suh zrak.",
            "Sensor WH_TH_01 among the racks measures humidity and temperature. Cardboard packaging and metal parts need dry air.",
            "Der Sensor WH_TH_01 zwischen den Regalen misst Feuchte und Temperatur. Kartonverpackungen und Metallteile brauchen trockene Luft.",
          ),
          run(api) {
            api.spotlight(api.$reading("wh-rh"));
          },
        },
        {
          time: "13:50",
          title: t(
            "Nevihta in odprta rampa",
            "A storm and an open dock",
            "Ein Gewitter und eine offene Rampe",
          ),
          text: t(
            "Med razkladanjem tovornjaka so vrata nakladalne rampe odprta, zunaj pa lije. Vlaga v skladišču hitro narašča.",
            "The dock door is open while a lorry is unloaded, and it is pouring outside. Humidity in the warehouse rises fast.",
            "Das Rampentor ist offen, während ein Lkw entladen wird, und draußen schüttet es. Die Feuchte im Lager steigt schnell.",
          ),
          run(api, play) {
            play.count("wh-rh", 48, 63, percent, celsius(19.1));
            api.setReading("wh-temp", celsius(19.1));
            api.log(
              t(
                "WH_TH_01 · Vlaga 63 % · narašča",
                "WH_TH_01 · Humidity 63% · rising",
                "WH_TH_01 · Feuchte 63 % · steigend",
              ),
              "13:50",
              "reading",
            );
          },
        },
        {
          time: "14:05",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Vlaga je nad 60 % že 15 minut. Nexavia odpre alarm in obvesti vodjo izmene.",
            "Humidity has been above 60% for 15 minutes. Nexavia opens an alarm and notifies the shift lead.",
            "Die Feuchte liegt seit 15 Minuten über 60 %. Nexavia öffnet einen Alarm und benachrichtigt den Schichtleiter.",
          ),
          run(api, play) {
            play.count("wh-rh", 63, 67, percent, celsius(19.3));
            api.setAlarms([
              [
                "WH_TH_01",
                t(
                  "Vlaga 67 % · meja 60 %",
                  "Humidity 67% · limit 60%",
                  "Feuchte 67 % · Grenze 60 %",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            play.toast(
              t(
                "Alarm: vlaga v skladišču",
                "Alarm: warehouse humidity",
                "Alarm: Feuchte im Lager",
              ),
              t(
                "67 % · zaprite vrata rampe",
                "67% · close the dock door",
                "67 % · Rampentor schließen",
              ),
              "14:05",
            );
            api.log(
              t(
                "WH_TH_01 · Alarm: previsoka vlaga",
                "WH_TH_01 · Alarm: humidity too high",
                "WH_TH_01 · Alarm: Feuchte zu hoch",
              ),
              "14:05",
              "alarm",
            );
          },
        },
        {
          time: "14:06",
          title: t(
            "Razvlaževanje se vklopi",
            "Dehumidifying starts",
            "Die Entfeuchtung startet",
          ),
          text: t(
            "Nexavia klimatski napravi pošlje ukaz za razvlaževanje. Vodja izmene da zapreti vrata rampe.",
            "Nexavia commands the air handling unit to dehumidify. The shift lead has the dock door closed.",
            "Nexavia gibt der Lüftungsanlage den Befehl zu entfeuchten. Der Schichtleiter lässt das Rampentor schließen.",
          ),
          run(api) {
            api.log(
              t(
                "AHU_01 · Ukaz: razvlaževanje vklopljeno",
                "AHU_01 · Command: dehumidifying on",
                "AHU_01 · Befehl: Entfeuchtung ein",
              ),
              "14:06",
              "command",
            );
          },
        },
        {
          time: "15:20",
          title: t(
            "Zrak je spet suh",
            "The air is dry again",
            "Die Luft ist wieder trocken",
          ),
          text: t(
            "Vlaga pade pod mejo, alarm se zapre in razvlaževanje se izklopi. Blago v regalih je ostalo nepoškodovano.",
            "Humidity falls below the limit, the alarm closes and dehumidifying stops. The goods on the racks are unharmed.",
            "Die Feuchte fällt unter den Grenzwert, der Alarm schließt sich und die Entfeuchtung stoppt. Die Ware in den Regalen bleibt unbeschädigt.",
          ),
          run(api, play) {
            play.count("wh-rh", 67, 51, percent, celsius(18.8));
            api.setReading("wh-temp", celsius(18.8));
            api.setAlarms([]);
            api.spotlight(api.$reading("wh-rh"));
            api.log(
              t(
                "WH_TH_01 · Vlaga 51 % · alarm zaprt",
                "WH_TH_01 · Humidity 51% · alarm closed",
                "WH_TH_01 · Feuchte 51 % · Alarm geschlossen",
              ),
              "15:20",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "heat",
      title: t(
        "Vročina v proizvodni hali",
        "Heat in the production hall",
        "Hitze in der Produktionshalle",
      ),
      setup(api) {
        api.setReading(
          "hall-temp",
          celsius(24.6),
          t("Vlaga 44 %", "Humidity 44%", "Feuchte 44 %"),
        );
        api.setReading("hall-rh", percent(44));
        api.setLevel("FACTORY_01", 1);
        api.setAlarms([]);
        api.pin("hall-temp");
        api.narrate({
          rule: t(
            "Pravilo: temperatura v hali > 30 °C",
            "Rule: hall temperature > 30 °C",
            "Regel: Hallentemperatur > 30 °C",
          ),
        });
      },
      steps: [
        {
          time: "11:00",
          focus: VIEW.hall,
          title: t(
            "Poletno dopoldne",
            "A summer morning",
            "Ein Sommervormittag",
          ),
          text: t(
            "Senzor HALL_TH_01 pod stropom hale meri temperaturo in vlago. Stroji za brizganje plastike halo dodatno segrevajo.",
            "Sensor HALL_TH_01 under the hall ceiling measures temperature and humidity. The injection moulding machines add their own heat.",
            "Der Sensor HALL_TH_01 unter der Hallendecke misst Temperatur und Feuchte. Die Spritzgießmaschinen geben zusätzlich Wärme ab.",
          ),
          run(api) {
            api.spotlight(api.$reading("hall-temp"));
          },
        },
        {
          time: "13:30",
          title: t(
            "Hala se segreva",
            "The hall heats up",
            "Die Halle heizt sich auf",
          ),
          text: t(
            "Zunaj je 34 °C. Temperatura v hali v dveh urah naraste nad 30 °C.",
            "It is 34 °C outside. In two hours the hall temperature climbs past 30 °C.",
            "Draußen hat es 34 °C. In zwei Stunden steigt die Hallentemperatur über 30 °C.",
          ),
          run(api, play) {
            play.count(
              "hall-temp",
              24.6,
              30.8,
              celsius,
              t("Vlaga 41 %", "Humidity 41%", "Feuchte 41 %"),
            );
            api.setReading("hall-rh", percent(41));
            api.setAlarms([
              [
                "HALL_TH_01",
                t(
                  "30,8 °C · meja 30 °C",
                  "30.8 °C · limit 30 °C",
                  "30,8 °C · Grenze 30 °C",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "HALL_TH_01 · Alarm: 30,8 °C v hali",
                "HALL_TH_01 · Alarm: 30.8 °C in the hall",
                "HALL_TH_01 · Alarm: 30,8 °C in der Halle",
              ),
              "13:30",
              "alarm",
            );
          },
        },
        {
          time: "13:31",
          focus: VIEW.plant,
          title: t(
            "Prezračevanje na polno",
            "Ventilation to full",
            "Lüftung auf volle Leistung",
          ),
          text: t(
            "Nexavia klimatski napravi pošlje ukaz za največji pretok zraka, vodja proizvodnje pa prejme obvestilo za dodaten odmor.",
            "Nexavia commands the air handling unit to full airflow, and the production manager is notified to schedule an extra break.",
            "Nexavia schaltet die Lüftungsanlage auf maximalen Luftstrom, und die Produktionsleitung wird benachrichtigt, eine zusätzliche Pause einzuplanen.",
          ),
          run(api, play) {
            play.toast(
              t("Vročina v hali", "Heat in the hall", "Hitze in der Halle"),
              t(
                "30,8 °C · prezračevanje 100 %",
                "30.8 °C · ventilation 100%",
                "30,8 °C · Lüftung 100 %",
              ),
              "13:31",
            );
            api.log(
              t(
                "AHU_01 · Ukaz: prezračevanje 100 %",
                "AHU_01 · Command: ventilation 100%",
                "AHU_01 · Befehl: Lüftung 100 %",
              ),
              "13:31",
              "command",
            );
          },
        },
        {
          time: "15:10",
          focus: VIEW.hall,
          title: t(
            "Temperatura pade",
            "The temperature falls",
            "Die Temperatur sinkt",
          ),
          text: t(
            "Temperatura pade pod mejo in alarm se zapre. Trend meritev pokaže, kdaj se hala pregreva – podatek za načrtovanje izmen in senčenja.",
            "The temperature falls below the limit and the alarm closes. The trend shows when the hall overheats – useful for planning shifts and shading.",
            "Die Temperatur fällt unter den Grenzwert und der Alarm schließt sich. Der Trend zeigt, wann sich die Halle überhitzt – nützlich für die Planung von Schichten und Beschattung.",
          ),
          run(api, play) {
            play.count(
              "hall-temp",
              30.8,
              27.2,
              celsius,
              t("Vlaga 43 %", "Humidity 43%", "Feuchte 43 %"),
            );
            api.setReading("hall-rh", percent(43));
            api.setAlarms([]);
            api.spotlight(api.$reading("hall-temp"));
            api.log(
              t(
                "HALL_TH_01 · 27,2 °C · alarm zaprt",
                "HALL_TH_01 · 27.2 °C · alarm closed",
                "HALL_TH_01 · 27,2 °C · Alarm geschlossen",
              ),
              "15:10",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "peak",
      title: t("Konica moči", "Peak demand", "Lastspitze"),
      setup(api) {
        api.setReading("main-power", kw(352));
        api.setReading(
          "kpi-peak",
          percent(88),
          t("352 od 400 kW", "352 of 400 kW", "352 von 400 kW"),
        );
        api.setReading(
          "kai-peak",
          "425 kW",
          t("ob 18:00", "at 18:00", "um 18:00"),
        );
        api.setReading("air", "540 Nm³/h");
        api.setReading(
          "ev",
          kw(11),
          t(
            "danes 96 kWh · 7 sej",
            "today 96 kWh · 7 sessions",
            "heute 96 kWh · 7 Ladevorgänge",
          ),
        );
        api.setAlarms([]);
        api.pin("main-power");
        api.narrate({
          rule: t(
            "Pravilo: napoved konice > 400 kW",
            "Rule: peak forecast > 400 kW",
            "Regel: Spitzenprognose > 400 kW",
          ),
        });
      },
      steps: [
        {
          time: "16:30",
          focus: VIEW.yard,
          title: t(
            "Pogodbena moč 400 kW",
            "400 kW contracted",
            "400 kW Vertragsleistung",
          ),
          text: t(
            "Števec MAIN_LV_01 na glavnem razdelilniku meri moč celotne proizvodnje vsako minuto. Vsak kilovat nad pogodbeno močjo 400 kW se pozna na računu za ves mesec.",
            "Meter MAIN_LV_01 on the main switchboard measures the whole plant's load every minute. Every kilowatt over the contracted 400 kW shows on the bill for the whole month.",
            "Der Zähler MAIN_LV_01 am Hauptverteiler misst die Last des gesamten Werks jede Minute. Jedes Kilowatt über der Vertragsleistung von 400 kW schlägt sich für den ganzen Monat auf der Rechnung nieder.",
          ),
          run(api) {
            api.spotlight(api.$reading("main-power"));
          },
        },
        {
          time: "16:45",
          title: t(
            "KAI napove konico",
            "KAI forecasts a peak",
            "KAI sagt eine Spitze voraus",
          ),
          text: t(
            "KAI iz poteka dneva, plana izmene in vremena napove, da bo ob 18:00, ko se zažene druga izmena in se polnita obe polnilnici, moč dosegla 425 kW.",
            "From the day so far, the shift plan and the weather, KAI forecasts that at 18:00 – when the second shift starts and both chargers are busy – the load will reach 425 kW.",
            "Aus dem bisherigen Tagesverlauf, dem Schichtplan und dem Wetter prognostiziert KAI, dass die Last um 18:00 – wenn die zweite Schicht beginnt und beide Ladestationen belegt sind – 425 kW erreicht.",
          ),
          run(api, play) {
            play.count("main-power", 352, 374, kw);
            api.setReading(
              "kpi-peak",
              percent(94),
              t("374 od 400 kW", "374 of 400 kW", "374 von 400 kW"),
            );
            api.spotlight(api.$reading("kai-peak"));
            api.log(
              t(
                "KAI · Napoved konice 425 kW ob 18:00",
                "KAI · Peak forecast 425 kW at 18:00",
                "KAI · Spitzenprognose 425 kW um 18:00",
              ),
              "16:45",
              "decision",
            );
          },
        },
        {
          time: "16:46",
          title: t(
            "Pravilo zamakne porabnike",
            "The rule shifts the loads",
            "Die Regel verschiebt Verbraucher",
          ),
          text: t(
            "Nexavia drugemu kompresorju zamakne zagon za 30 minut – rezervoar zraka zdrži – in polnilnici EV omeji na 7 kW. Proizvodnja tega ne opazi.",
            "Nexavia delays compressor 2 by 30 minutes – the air receiver bridges the gap – and limits the EV chargers to 7 kW. Production notices nothing.",
            "Nexavia verzögert den Start von Kompressor 2 um 30 Minuten – der Druckluftbehälter überbrückt die Zeit – und begrenzt die E-Ladestationen auf 7 kW. Die Produktion merkt nichts.",
          ),
          run(api) {
            api.setReading(
              "ev",
              kw(7),
              t(
                "omejeno ob konici",
                "limited at the peak",
                "zur Spitze begrenzt",
              ),
            );
            api.spotlight(api.$reading("ev"));
            api.log(
              t(
                "COMP_01 · Kompresor 2 zamaknjen za 30 min · EV_01–02 omejeni na 7 kW",
                "COMP_01 · Compressor 2 delayed 30 min · EV_01–02 limited to 7 kW",
                "COMP_01 · Kompressor 2 um 30 min verzögert · EV_01–02 auf 7 kW begrenzt",
              ),
              "16:46",
              "command",
            );
          },
        },
        {
          time: "18:00",
          title: t(
            "Konica ostane pod mejo",
            "The peak stays under the limit",
            "Die Spitze bleibt unter der Grenze",
          ),
          text: t(
            "Druga izmena se zažene, moč doseže 392 kW in ostane pod pogodbeno mejo. Prihranek se pokaže na mesečnem računu, dogodek pa v poročilu o konicah.",
            "The second shift starts, the load reaches 392 kW and stays under the contracted limit. The saving shows on the monthly bill, the event in the peak report.",
            "Die zweite Schicht beginnt, die Last erreicht 392 kW und bleibt unter der Vertragsleistung. Die Einsparung zeigt sich auf der Monatsrechnung, das Ereignis im Spitzenlastbericht.",
          ),
          run(api, play) {
            play.count("main-power", 374, 392, kw);
            api.setReading(
              "kpi-peak",
              percent(98),
              t("392 od 400 kW", "392 of 400 kW", "392 von 400 kW"),
            );
            api.spotlight(api.$reading("kpi-peak"));
            api.log(
              t(
                "MAIN_LV_01 · Konica 392 kW · pod pogodbeno močjo",
                "MAIN_LV_01 · Peak 392 kW · under the contracted power",
                "MAIN_LV_01 · Spitze 392 kW · unter der Vertragsleistung",
              ),
              "18:00",
              "reading",
            );
          },
        },
        {
          time: "18:30",
          title: t(
            "Vse spet teče normalno",
            "Back to normal",
            "Zurück zum Normalbetrieb",
          ),
          text: t(
            "Po konici se kompresor 2 zažene, polnilnici dobita polno moč. Brez napovedi bi isti dan prinesel 25 kW preseženja in višjo omrežnino za ves mesec.",
            "After the peak, compressor 2 starts and the chargers get full power again. Without the forecast, the same day would have cost 25 kW over the limit and a higher network fee for the whole month.",
            "Nach der Spitze startet Kompressor 2, und die Ladestationen erhalten wieder volle Leistung. Ohne Prognose hätte derselbe Tag 25 kW über der Grenze und ein höheres Netzentgelt für den ganzen Monat gekostet.",
          ),
          run(api, play) {
            play.count("main-power", 392, 378, kw);
            api.setReading(
              "ev",
              kw(11),
              t("polna moč", "full power", "volle Leistung"),
            );
            api.log(
              t(
                "COMP_01 · Kompresor 2 zagnan · EV_01–02 polna moč",
                "COMP_01 · Compressor 2 started · EV_01–02 full power",
                "COMP_01 · Kompressor 2 gestartet · EV_01–02 volle Leistung",
              ),
              "18:30",
              "command",
            );
          },
        },
      ],
    },
    {
      id: "air-leak",
      title: t(
        "Puščanje zraka ob vikendu",
        "Air leaks over the weekend",
        "Druckluftleckagen am Wochenende",
      ),
      setup(api) {
        api.setReading(
          "line-cnc",
          "0 / 4",
          t("vikend", "weekend", "Wochenende"),
        );
        api.setReading("air", "540 Nm³/h");
        api.setReading("air-kw", kw(52));
        api.setReading("air-leak", percent(18));
        api.setReading(
          "kpi-leak",
          percent(18),
          t("≈ 6.900 € na leto", "≈ €6,900 a year", "≈ 6.900 € pro Jahr"),
        );
        api.setLevel("FACTORY_01", 0);
        api.setAlarms([]);
        api.pin("air");
        api.narrate({
          rule: t(
            "KAI: pretok zraka brez proizvodnje",
            "KAI: air flow with no production",
            "KAI: Luftstrom ohne Produktion",
          ),
        });
      },
      steps: [
        {
          time: "02:00",
          focus: VIEW.yard,
          title: t(
            "Nedelja, hala miruje",
            "Sunday, the hall is still",
            "Sonntag, die Halle steht still",
          ),
          text: t(
            "Vsi stroji stojijo, a kompresorska postaja vzdržuje tlak v omrežju. Merilnik COMP_01 meri pretok vsako minuto – tudi ko nihče ne dela.",
            "Every machine is off, but the compressor station keeps the network under pressure. Meter COMP_01 measures the flow every minute – even when nobody is working.",
            "Alle Maschinen sind aus, aber die Kompressorstation hält das Netz unter Druck. Der Zähler COMP_01 misst den Durchfluss jede Minute – auch wenn niemand arbeitet.",
          ),
          run(api, play) {
            play.count("air", 540, 96, (v) => `${Math.round(v)} Nm³/h`);
            api.setReading("air-kw", kw(10));
            api.spotlight(api.$reading("line-cnc"));
          },
        },
        {
          time: "02:00",
          title: t(
            "Pretok bi moral biti nič",
            "The flow should be zero",
            "Der Durchfluss sollte null sein",
          ),
          text: t(
            "Brez porabnikov kompresorja še vedno dovajata 96 Nm³/h. Ves ta zrak uhaja skozi netesne spojke, ventile in cevi.",
            "With nothing using it, the compressors still deliver 96 Nm³/h. All of that air escapes through leaking couplings, valves and hoses.",
            "Ohne Verbraucher liefern die Kompressoren immer noch 96 Nm³/h. All diese Luft entweicht durch undichte Kupplungen, Ventile und Schläuche.",
          ),
          run(api) {
            api.spotlight(api.$reading("air"));
            api.log(
              t(
                "COMP_01 · 96 Nm³/h ob mirujočih strojih",
                "COMP_01 · 96 Nm³/h with the machines off",
                "COMP_01 · 96 Nm³/h bei stehenden Maschinen",
              ),
              "02:00",
              "reading",
            );
          },
        },
        {
          time: "06:00",
          title: t(
            "KAI izračuna izgubo",
            "KAI works out the loss",
            "KAI berechnet den Verlust",
          ),
          text: t(
            "KAI primerja vikend z delovnim tednom: 18 % vsega zraka je puščanje. Pri 0,10 kWh na Nm³ to stane okoli 6.900 € na leto. Vzdrževanje dobi delovni nalog.",
            "KAI compares the weekend with the working week: 18% of all the air is leaks. At 0.10 kWh per Nm³ that costs about €6,900 a year. Maintenance gets a work order.",
            "KAI vergleicht das Wochenende mit der Arbeitswoche: 18 % der gesamten Luft sind Leckagen. Bei 0,10 kWh pro Nm³ kostet das etwa 6.900 € pro Jahr. Die Instandhaltung erhält einen Arbeitsauftrag.",
          ),
          run(api, play) {
            api.spotlight(api.$reading("kpi-leak"));
            play.toast(
              t(
                "KAI: puščanje zraka",
                "KAI: air leaks",
                "KAI: Druckluftleckagen",
              ),
              t(
                "18 % · ≈ 6.900 € na leto",
                "18% · ≈ €6,900 a year",
                "18 % · ≈ 6.900 € pro Jahr",
              ),
              "06:00",
            );
            api.log(
              t(
                "KAI · Puščanje komprimiranega zraka 18 % → delovni nalog",
                "KAI · Compressed-air leaks 18% → work order",
                "KAI · Druckluftleckagen 18 % → Arbeitsauftrag",
              ),
              "06:00",
              "notify",
            );
          },
        },
        {
          time: "08:00",
          title: t(
            "Vzdrževanje poišče netesnosti",
            "Maintenance finds the leaks",
            "Die Instandhaltung findet die Leckagen",
          ),
          text: t(
            "Z ultrazvočnim detektorjem najdejo 14 netesnih mest in jih zatesnijo. Naslednji vikend merilnik pokaže, ali je bilo delo opravljeno dobro.",
            "With an ultrasonic detector they find 14 leaks and seal them. The next weekend the meter shows whether the job was done well.",
            "Mit einem Ultraschalldetektor finden sie 14 Leckagen und dichten sie ab. Am nächsten Wochenende zeigt der Zähler, ob die Arbeit gut gemacht wurde.",
          ),
          run(api) {
            api.log(
              t(
                "COMP_01 · 14 netesnih mest zatesnjenih",
                "COMP_01 · 14 leaks sealed",
                "COMP_01 · 14 Leckagen abgedichtet",
              ),
              "08:00",
              "command",
            );
          },
        },
        {
          time: "02:00",
          title: t("Teden pozneje", "A week later", "Eine Woche später"),
          text: t(
            "Nočni pretok ob vikendu pade na 22 Nm³/h, puščanje na 4 %. Prihranek je vsak teden viden na števcu – in na računu za elektriko.",
            "Weekend night flow falls to 22 Nm³/h and leaks to 4%. The saving shows on the meter every week – and on the electricity bill.",
            "Der Nachtdurchfluss am Wochenende sinkt auf 22 Nm³/h, die Leckagen auf 4 %. Die Einsparung ist jede Woche am Zähler sichtbar – und auf der Stromrechnung.",
          ),
          run(api, play) {
            play.count("air", 96, 22, (v) => `${Math.round(v)} Nm³/h`);
            api.setReading("air-kw", kw(3));
            api.setReading("air-leak", percent(4));
            api.setReading(
              "kpi-leak",
              percent(4),
              t("≈ 1.500 € na leto", "≈ €1,500 a year", "≈ 1.500 € pro Jahr"),
            );
            api.spotlight(api.$reading("kpi-leak"));
            api.log(
              t(
                "COMP_01 · Puščanje 4 %",
                "COMP_01 · Leaks 4%",
                "COMP_01 · Leckagen 4 %",
              ),
              "02:00",
              "reading",
            );
          },
        },
      ],
    },
    {
      id: "robot",
      title: t(
        "KAI napove okvaro robota",
        "KAI predicts a robot failure",
        "KAI sagt einen Roboterausfall voraus",
      ),
      setup(api) {
        api.setReading("robot-vib", mms(2.5));
        api.setReading(
          "kai-robot",
          t("V redu", "Healthy", "In Ordnung"),
          t(
            "v mejah vzorca",
            "within the learned pattern",
            "im gelernten Muster",
          ),
        );
        api.setLevel("FACTORY_01", 1);
        api.setAlarms([]);
        api.pin("robot-vib");
        api.narrate({
          rule: t(
            "KAI: trend vibracij in temperature ležaja",
            "KAI: vibration and bearing temperature trend",
            "KAI: Trend von Schwingung und Lagertemperatur",
          ),
        });
      },
      steps: [
        {
          time: "09:00",
          focus: VIEW.line,
          title: t(
            "Robot dela kot vedno",
            "The robot works as always",
            "Der Roboter arbeitet wie immer",
          ),
          text: t(
            "Senzor na podnožju robota 2 vsako minuto meri vibracije, temperaturo ležaja in tok motorja. Vrednosti so daleč pod mejo 4,5 mm/s.",
            "The sensor on robot 2's base measures vibration, bearing temperature and motor current every minute. The values are far below the 4.5 mm/s limit.",
            "Der Sensor am Sockel von Roboter 2 misst jede Minute Schwingung, Lagertemperatur und Motorstrom. Die Werte liegen weit unter der Grenze von 4,5 mm/s.",
          ),
          run(api) {
            api.spotlight(api.$reading("robot-vib"));
          },
        },
        {
          time: "09:00",
          title: t("Devet dni pozneje", "Nine days later", "Neun Tage später"),
          text: t(
            "Vibracije počasi naraščajo – za 34 % v devetih dneh – ležaj je toplejši za 6 °C. Klasičen alarm se še ne bi sprožil, ker je vrednost še pod mejo.",
            "The vibration creeps up – 34% in nine days – and the bearing runs 6 °C warmer. A classic alarm would not fire yet: the value is still under the limit.",
            "Die Schwingung steigt langsam – um 34 % in neun Tagen – und das Lager ist 6 °C wärmer. Ein klassischer Alarm würde noch nicht auslösen: Der Wert liegt noch unter der Grenze.",
          ),
          run(api, play) {
            play.count("robot-vib", 2.5, 3.4, mms);
            api.log(
              t(
                "ROBOT_02 · Vibracije 3,4 mm/s · ležaj 47 °C",
                "ROBOT_02 · Vibration 3.4 mm/s · bearing 47 °C",
                "ROBOT_02 · Schwingung 3,4 mm/s · Lager 47 °C",
              ),
              "09:00",
              "reading",
            );
          },
        },
        {
          time: "09:05",
          title: t(
            "KAI prepozna obrabo",
            "KAI recognises wear",
            "KAI erkennt Verschleiß",
          ),
          text: t(
            "KAI pozna normalni vzorec robota in prepozna obrabo ležaja. Napove, da bo vibracija mejo dosegla čez približno 12 dni.",
            "KAI knows the robot's normal pattern and recognises bearing wear. It forecasts that the vibration will reach the limit in about 12 days.",
            "KAI kennt das normale Muster des Roboters und erkennt Lagerverschleiß. Es prognostiziert, dass die Schwingung in etwa 12 Tagen die Grenze erreicht.",
          ),
          run(api, play) {
            api.setReading(
              "kai-robot",
              t("Obraba", "Wear", "Verschleiß"),
              t(
                "servis čez ~12 dni",
                "service in ~12 days",
                "Wartung in ~12 Tagen",
              ),
            );
            api.spotlight(api.$reading("kai-robot"));
            play.toast(
              t("KAI: robot 2", "KAI: robot 2", "KAI: Roboter 2"),
              t(
                "Obraba ležaja · servis čez ~12 dni",
                "Bearing wear · service in ~12 days",
                "Lagerverschleiß · Wartung in ~12 Tagen",
              ),
              "09:05",
            );
            api.log(
              t(
                "KAI · ROBOT_02 obraba ležaja → nalog za servis",
                "KAI · ROBOT_02 bearing wear → service order",
                "KAI · ROBOT_02 Lagerverschleiß → Wartungsauftrag",
              ),
              "09:05",
              "decision",
            );
          },
        },
        {
          time: "06:00",
          title: t(
            "Servis v načrtovanem terminu",
            "Service when it suits",
            "Wartung zum passenden Zeitpunkt",
          ),
          text: t(
            "Vzdrževanje naroči ležaj in ga zamenja v soboto, ko linija ne dela. Brez napovedi bi se robot ustavil sredi izmene – z linijo vred.",
            "Maintenance orders the bearing and fits it on Saturday, when the line is idle. Without the forecast the robot would have stopped mid-shift – and the line with it.",
            "Die Instandhaltung bestellt das Lager und baut es am Samstag ein, wenn die Linie stillsteht. Ohne Prognose wäre der Roboter mitten in der Schicht stehen geblieben – und mit ihm die Linie.",
          ),
          run(api, play) {
            play.count("robot-vib", 3.4, 1.9, mms);
            api.setReading(
              "kai-robot",
              t("V redu", "Healthy", "In Ordnung"),
              t("ležaj zamenjan", "bearing replaced", "Lager getauscht"),
            );
            api.spotlight(api.$reading("robot-vib"));
            api.log(
              t(
                "ROBOT_02 · Ležaj zamenjan · 1,9 mm/s",
                "ROBOT_02 · Bearing replaced · 1.9 mm/s",
                "ROBOT_02 · Lager getauscht · 1,9 mm/s",
              ),
              "06:00",
              "command",
            );
          },
        },
      ],
    },
    {
      id: "coldroom-door",
      title: t(
        "Odprta vrata hladilnice",
        "The cold room door left open",
        "Die Kühlraumtür bleibt offen",
      ),
      setup(api) {
        api.setReading("coldroom", celsius(2.1));
        api.setReading("coldroom-door", t("Zaprta", "Closed", "Geschlossen"));
        api.setLevel("MARKET_01", 1);
        api.setAlarms([]);
        api.pin("coldroom");
        api.narrate({
          rule: t(
            "Pravilo: vrata hladilnice odprta > 5 min",
            "Rule: cold room door open > 5 min",
            "Regel: Kühlraumtür > 5 min offen",
          ),
        });
      },
      steps: [
        {
          time: "07:10",
          focus: VIEW.coldroom,
          title: t(
            "Jutranja dostava",
            "The morning delivery",
            "Die Morgenlieferung",
          ),
          text: t(
            "Osebje zlaga dostavo v hladilnico. Kontakt na vratih in senzor temperature COLDROOM_01 poročata vsako spremembo.",
            "Staff stack the delivery into the cold room. The door contact and temperature sensor COLDROOM_01 report every change.",
            "Das Personal räumt die Lieferung in den Kühlraum. Der Türkontakt und der Temperatursensor COLDROOM_01 melden jede Änderung.",
          ),
          run(api) {
            api.setReading("coldroom-door", t("Odprta", "Open", "Offen"));
            api.spotlight(api.$reading("coldroom"));
            api.log(
              t(
                "COLDROOM_01 · Vrata odprta",
                "COLDROOM_01 · Door open",
                "COLDROOM_01 · Tür offen",
              ),
              "07:10",
              "reading",
            );
          },
        },
        {
          time: "07:16",
          title: t(
            "Vrata ostanejo odprta",
            "The door stays open",
            "Die Tür bleibt offen",
          ),
          text: t(
            "Paleta je zagozdila vrata. Topel zrak vdira v hladilnico, temperatura naraste nad 5 °C.",
            "A pallet has wedged the door. Warm air pours in and the temperature climbs past 5 °C.",
            "Eine Palette hat die Tür verkeilt. Warme Luft strömt herein und die Temperatur steigt über 5 °C.",
          ),
          run(api, play) {
            play.count("coldroom", 2.1, 5.6, celsius);
            api.setAlarms([
              [
                "COLDROOM_01",
                t(
                  "Vrata odprta 6 min · 5,6 °C",
                  "Door open 6 min · 5.6 °C",
                  "Tür 6 min offen · 5,6 °C",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "COLDROOM_01 · Alarm: vrata odprta 6 min",
                "COLDROOM_01 · Alarm: door open 6 min",
                "COLDROOM_01 · Alarm: Tür 6 min offen",
              ),
              "07:16",
              "alarm",
            );
          },
        },
        {
          time: "07:17",
          title: t(
            "Vodja izmene je obveščen",
            "The shift lead is alerted",
            "Der Schichtleiter wird alarmiert",
          ),
          text: t(
            "Vodja izmene dobi obvestilo na telefon in vrata zapre. Nexavia zabeleži, koliko časa so bila odprta in koliko energije je odteklo.",
            "The shift lead gets a phone notification and closes the door. Nexavia records how long it was open and how much energy was lost.",
            "Der Schichtleiter erhält eine Benachrichtigung aufs Telefon und schließt die Tür. Nexavia protokolliert, wie lange sie offen war und wie viel Energie verloren ging.",
          ),
          run(api, play) {
            play.toast(
              t("Alarm: hladilnica", "Alarm: cold room", "Alarm: Kühlraum"),
              t(
                "Vrata odprta · 5,6 °C",
                "Door open · 5.6 °C",
                "Tür offen · 5,6 °C",
              ),
              "07:17",
            );
            api.setReading(
              "coldroom-door",
              t("Zaprta", "Closed", "Geschlossen"),
            );
            api.log(
              t(
                "COLDROOM_01 · Vrata zaprta · 7 min · ≈ 3 kWh",
                "COLDROOM_01 · Door closed · 7 min · ≈ 3 kWh",
                "COLDROOM_01 · Tür geschlossen · 7 min · ≈ 3 kWh",
              ),
              "07:17",
              "notify",
            );
          },
        },
        {
          time: "07:40",
          title: t(
            "Zapis za HACCP",
            "On the HACCP record",
            "Im HACCP-Nachweis",
          ),
          text: t(
            "Temperatura se vrne na 2,3 °C in alarm se zapre. Odstopanje s časom, trajanjem in ukrepom je samodejno v evidenci HACCP – brez ročnega vpisa.",
            "The temperature returns to 2.3 °C and the alarm closes. The excursion, with its time, duration and action, is on the HACCP record automatically – nothing written by hand.",
            "Die Temperatur kehrt auf 2,3 °C zurück und der Alarm schließt sich. Die Abweichung mit Zeit, Dauer und Maßnahme steht automatisch im HACCP-Nachweis – nichts wird von Hand notiert.",
          ),
          run(api, play) {
            play.count("coldroom", 5.6, 2.3, celsius);
            api.setAlarms([]);
            api.spotlight(api.$reading("kpi-haccp"));
            api.log(
              t(
                "COLDROOM_01 · 2,3 °C · alarm zaprt · zapis HACCP",
                "COLDROOM_01 · 2.3 °C · alarm closed · HACCP record",
                "COLDROOM_01 · 2,3 °C · Alarm geschlossen · HACCP-Nachweis",
              ),
              "07:40",
              "alarm",
            );
          },
        },
      ],
    },
  ];
}
