import { initTraffic } from "./traffic.js";
import {
  LEVELS,
  PANEL_KW,
  RACKS,
  levelPower,
  rackAt,
  rackKey,
  rackNumber,
  warmest,
} from "./datacenter-racks.js";
import geometry from "../../components/nexavia/showcase/datacenter-geometry.json";

// The datacenter twin: a building of three levels shown in a stepped section.
// Its sensors follow the power from the transformer to each rack's PDU and
// the cooling water from the racks to the towers, and watch every level for
// water, smoke and open doors; the lighting runs under one rule. Driven by
// twin.js; the maquette and its geometry come from
// scripts/generate-datacenter-maquette.mjs.

const FLOORS = ["FLOOR_01", "FLOOR_02", "FLOOR_03"];
const LAMPS = ["LAMP_01", "LAMP_02", "LAMP_03"];
const ALL = [...FLOORS, ...LAMPS];
const off = () => Array(ALL.length).fill(0);
// Camera framings on the model (scene pixels).
const VIEW = {
  level1: { x: 600, y: 480, zoom: 1.5, radius: 0.32 },
  level2: { x: 610, y: 310, zoom: 1.5, radius: 0.32 },
  level3: { x: 620, y: 160, zoom: 1.5, radius: 0.32 },
  plant: { x: 1040, y: 440, zoom: 1.5, radius: 0.3 },
  ups: { x: 1010, y: 300, zoom: 1.6, radius: 0.26 },
  yard: { x: 1090, y: 620, zoom: 1.5, radius: 0.3 },
  outdoors: { x: 700, y: 600, zoom: 1.2, radius: 0.45 },
};

// The model has no roads: only the scripted people at work on each level, and
// the scenery in front of them, both generated.
const TRAFFIC = {
  id: "datacenter",
  routes: geometry.traffic.routes,
  occluders: geometry.traffic.occluders,
  actors: geometry.traffic.actors,
  masks: true,
  counts: {},
};

// The thermal map: a wash of colour over each rack, from its inlet air
// reading, behind its own toggle beside the sensors'. Scenarios switch it on
// with the "heatmap" signal.
function initHeatmap(root) {
  const art = root.querySelector("[data-city-art]");
  const tools = art?.querySelector(".city-art-tools");
  if (!art || !tools) return;
  const lang = document.documentElement.lang.slice(0, 2);
  const ns = "http://www.w3.org/2000/svg";
  const svg = (name, attributes, parent) => {
    const element = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes))
      element.setAttribute(key, value);
    return parent.appendChild(element);
  };
  const map = svg(
    "svg",
    {
      class: "city-heatmap",
      viewBox: "0 0 1536 1024",
      preserveAspectRatio: "xMidYMid slice",
      "aria-hidden": "true",
      focusable: "false",
    },
    art,
  );
  art.insertBefore(map, art.querySelector(".city-focus"));
  const blur = svg("filter", { id: "datacenter-heat-blur" }, map);
  svg("feGaussianBlur", { stdDeviation: "5" }, blur);
  const cells = svg("g", { filter: "url(#datacenter-heat-blur)" }, map);
  // Cool blue through yellow to red at the alarm limit.
  const stops = [
    [22, [42, 120, 214]],
    [25.5, [245, 196, 0]],
    [30, [224, 32, 32]],
  ];
  const colour = (temp) => {
    const v = Math.min(30, Math.max(22, temp));
    const i = v < stops[1][0] ? 0 : 1;
    const [a, from] = stops[i];
    const [b, to] = stops[i + 1];
    const k = (v - a) / (b - a);
    return `rgb(${from.map((c, j) => Math.round(c + (to[j] - c) * k)).join(" ")})`;
  };
  for (const level of LEVELS)
    for (let rack = 1; rack <= RACKS; rack++) {
      const key = rackKey(level, rack);
      const [x, y] = geometry.points[key];
      const cell = svg(
        "rect",
        { x: x - 11, y: y - 8, width: 22, height: 46, rx: 6 },
        cells,
      );
      const reading = root.querySelector(
        `.city-sensor-popover [data-reading="${key}"]`,
      );
      const paint = () =>
        cell.setAttribute(
          "fill",
          colour(parseFloat(reading.textContent.replace(",", "."))),
        );
      if (!reading) continue;
      new MutationObserver(paint).observe(reading, {
        childList: true,
        characterData: true,
        subtree: true,
      });
      paint();
    }
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "city-sensors-toggle";
  toggle.append(
    document.createElement("i"),
    { en: "Thermal map", de: "Wärmekarte" }[lang] ?? "Toplotna karta",
  );
  tools.prepend(toggle);
  let chosen = false;
  const show = (on) => {
    art.dataset.heatmap = on ? "on" : "off";
    toggle.setAttribute("aria-pressed", String(on));
  };
  toggle.addEventListener("click", () => {
    chosen = art.dataset.heatmap !== "on";
    show(chosen);
  });
  root.addEventListener("twin:signal", ({ detail }) => {
    if (detail.name === "heatmap") show(detail.value);
    // After a scenario the map goes back to the visitor's choice.
    if (detail.name === "reset") show(chosen);
  });
  show(false);
}

export const datacenter = {
  effects: [(root) => initTraffic(root, TRAFFIC), initHeatmap],
  // The radio gateway on the roof.
  gateway: { id: "GW_04", at: geometry.points.gateway },
  devices: (t) => [
    {
      id: "FLOOR_01",
      name: t("1. nadstropje", "Level 1", "Ebene 1"),
      watts: 900,
    },
    {
      id: "FLOOR_02",
      name: t("2. nadstropje", "Level 2", "Ebene 2"),
      watts: 900,
    },
    {
      id: "FLOOR_03",
      name: t("3. nadstropje", "Level 3", "Ebene 3"),
      watts: 900,
    },
    {
      id: "LAMP_01",
      name: t("Svetilka parkirišča", "Car park lamp", "Parkplatzleuchte"),
      watts: 90,
    },
    {
      id: "LAMP_02",
      name: t("Svetilka vhoda", "Gate lamp", "Torleuchte"),
      watts: 90,
    },
    {
      id: "LAMP_03",
      name: t(
        "Svetilka hladilnega dvorišča",
        "Cooling yard lamp",
        "Leuchte Kühlhof",
      ),
      watts: 90,
    },
  ],
  group: {
    ids: LAMPS,
    subject: "LAMP_01–LAMP_03",
    name: (t) => t("Zunanje svetilke", "Outdoor lamps", "Außenleuchten"),
  },
  counters: [],
  steps: (t) => [
    {
      at: "day",
      text: t(
        "Senzor LIGHT_04: 52 lx · dovolj dnevne svetlobe",
        "Sensor LIGHT_04: 52 lx · enough daylight",
        "Sensor LIGHT_04: 52 lx · genug Tageslicht",
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
            "LIGHT_04 · Svetloba okolice 52 lx",
            "LIGHT_04 · Ambient light 52 lx",
            "LIGHT_04 · Umgebungs\u00adlicht 52 lx",
          ),
        ],
      ],
    },
    {
      at: "dusk",
      text: t(
        "Senzor LIGHT_04: 21 lx · sonce zahaja",
        "Sensor LIGHT_04: 21 lx · the sun is setting",
        "Sensor LIGHT_04: 21 lx · die Sonne geht unter",
      ),
      lux: 21,
      states: off(),
      rule: t(
        "Pogoj izpolnjen · ukaz se pošilja prek GW_04",
        "Condition met · command sent via GW_04",
        "Bedingung erfüllt · Befehl über GW_04 gesendet",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_04 · Svetloba okolice 21 lx · prek prehoda GW_04",
            "LIGHT_04 · Ambient light 21 lx · via gateway GW_04",
            "LIGHT_04 · Umgebungs\u00adlicht 21 lx · über Gateway GW_04",
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
        "Na parkirišču in dvorišču se prižgejo svetilke",
        "The car park and yard lamps switch on",
        "Die Leuchten auf Parkplatz und Hof gehen an",
      ),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1],
      rule: t(
        "Aktivno · najprej varna pot okoli stavbe",
        "Active · safe way around the building first",
        "Aktiv · zuerst ein sicherer Weg um das Gebäude",
      ),
      log: [
        [
          "command",
          t(
            "LAMP_01–LAMP_03 · Zunanje svetilke vklopljene",
            "LAMP_01–LAMP_03 · Outdoor lamps switched on",
            "LAMP_01–LAMP_03 · Außenleuchten eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+20",
      text: t(
        "V 1. nadstropju se prižgejo luči",
        "The level 1 lights switch on",
        "Auf Ebene 1 gehen die Lichter an",
      ),
      lux: 21,
      states: [1, 0, 0, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
        "Aktiv · automatische Lichtsteuerung",
      ),
      log: [
        [
          "command",
          t(
            "FLOOR_01 · Razsvetljava vklopljena",
            "FLOOR_01 · Lighting switched on",
            "FLOOR_01 · Beleuchtung eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+30",
      text: t(
        "Sledita 2. in 3. nadstropje",
        "Levels 2 and 3 follow",
        "Ebenen 2 und 3 folgen",
      ),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1],
      rule: t(
        "Samodejna razsvetljava je aktivna",
        "Automatic lighting active",
        "Automatische Beleuchtung aktiv",
      ),
      log: [
        [
          "command",
          t(
            "FLOOR_02, FLOOR_03 · Razsvetljava vklopljena",
            "FLOOR_02, FLOOR_03 · Lighting switched on",
            "FLOOR_02, FLOOR_03 · Beleuchtung eingeschaltet",
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
            "LIGHT_04 · Svetloba okolice 52 lx",
            "LIGHT_04 · Ambient light 52 lx",
            "LIGHT_04 · Umgebungs\u00adlicht 52 lx",
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
  // The weak gateway signal to the far yard lamp comes and goes.
  alarms: (index) => (index === 3 || index === 4 ? [] : ["LAMP_03"]),
  tick(index, { setReading, t, n }) {
    const step = index + 1;
    for (const level of LEVELS) {
      // A third of the racks report at each step, as their sensors do not
      // send at the same moment.
      for (let rack = 1; rack <= RACKS; rack++) {
        if ((rack + level + index) % 3) continue;
        const { temp, rh, kw, out } = rackAt(level, rack, step);
        const key = rackKey(level, rack);
        setReading(key, `${n(temp, 1)} °C`);
        setReading(`${key}-rh`, t(`${rh} %`, `${rh}%`, `${rh} %`));
        setReading(`${key}-out`, `${n(out, 1)} °C`);
        setReading(`${key}-kw`, `${n(kw, 1)} kW`);
        setReading(`${key}-dt`, `${n(out - temp, 1)} K`);
      }
      // The level's power panel meters what its racks draw.
      const load = levelPower(level, step);
      const share = Math.round((load / PANEL_KW) * 100);
      setReading(
        `rpp-${level}`,
        `${n(load, 1)} kW`,
        t(
          `${share} % od ${PANEL_KW} kW`,
          `${share}% of ${PANEL_KW} kW`,
          `${share} % von ${PANEL_KW} kW`,
        ),
      );
      setReading(
        `rpp-${level}-load`,
        t(`${share} %`, `${share}%`, `${share} %`),
      );
      const { rack, temp } = warmest(level, step);
      const number = rackNumber(level, rack);
      setReading(
        `level-${level}`,
        `${n(temp, 1)} °C`,
        t(`Omara ${number}`, `Rack ${number}`, `Rack ${number}`),
      );
    }
    const i = index % 7;
    const supply = 17.8 + [0, 0.1, 0.3, 0.4, 0.2, 0, -0.1][i];
    const back = `${n(supply + 6.1 + [0, 0.1, 0.2, 0.1, 0, -0.1, 0][i], 1)} °C`;
    setReading(
      "cooling",
      `${n(supply, 1)} °C`,
      t(`Povratek ${back}`, `Return ${back}`, `Rücklauf ${back}`),
    );
    setReading("cooling-return", back);
    setReading(
      "pump",
      `${n(49.3 + [0, 0.2, 0.6, 0.8, 0.3, -0.2, -0.4][i], 1)} m³/h`,
    );
    const fan = 62 + [0, 1, 3, 4, 2, 0, -1][i];
    setReading("tower", t(`${fan} %`, `${fan}%`, `${fan} %`));
    // The facility's load at the main board against the racks' share of it.
    const facility = 412.6 + [0, 2.4, 5.8, 7.1, 3.2, -1.6, -3.4][i];
    const it = LEVELS.reduce((sum, level) => sum + levelPower(level, step), 0);
    setReading("power", `${n(facility, 1)} kW`);
    setReading("pq-a", `${Math.round((facility * 1000) / (3 * 231 * 0.97))} A`);
    setReading("ups-kw", `${n(it, 1)} kW`);
    setReading("kpi-pue", n(facility / it, 2));
    setReading(
      "kpi-it",
      `${n(it, 1)} kW`,
      t(
        `od ${n(facility, 1)} kW objekta`,
        `of ${n(facility, 1)} kW facility`,
        `von ${n(facility, 1)} kW Gebäude`,
      ),
    );
    const used = Math.round((facility / 600) * 100);
    setReading(
      "kpi-pcap",
      t(`${used} %`, `${used}%`, `${used} %`),
      t(
        `${n(facility, 1)} od 600 kW`,
        `${n(facility, 1)} of 600 kW`,
        `${n(facility, 1)} von 600 kW`,
      ),
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
  const depth = (v) => `${Math.round(v)} mm`;
  const dry = t("Suho", "Dry", "Trocken");
  const volts = (v) => `${Math.round(v)} V`;
  const kw = (v) => `${Math.round(v)} kW`;
  const milliohm = (v) => `${n(v, 1)} mΩ`;
  const runtime = (minutes) =>
    t(
      `avtonomija ${minutes} min`,
      `runtime ${minutes} min`,
      `Überbrückung ${minutes} min`,
    );
  const autonomy = (hours) =>
    t(`avtonomija ${hours} h`, `${hours} h autonomy`, `${hours} h Autonomie`);
  const quality = t(
    "THD 3,1 % · cos φ 0,97",
    "THD 3.1% · cos φ 0.97",
    "THD 3,1 % · cos φ 0,97",
  );
  const noIncident = t(
    "odprtih incidentov",
    "open incidents",
    "offene Vorfälle",
  );
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
          focus: { x: 900, y: 110, zoom: 1.6, radius: 0.24 },
          title: t("Senzor meri", "A sensor measures", "Ein Sensor misst"),
          text: t(
            "Senzor svetlobe LIGHT_04 na strehi meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut – enako kot senzorji na omarah.",
            "Light sensor LIGHT_04 on the roof measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes – just like the sensors on the racks.",
            "Der Lichtsensor LIGHT_04 auf dem Dach misst das Tageslicht. In der Dämmerung fällt es unter 25 lx. Der Sensor läuft mit Batterie und meldet alle 5 Minuten – genau wie die Sensoren an den Racks.",
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
            "Meritev po radiu LoRaWAN potuje do prehoda GW_04 na strehi. En prehod pokrije vsa tri nadstropja, zato noben senzor ne potrebuje kabla – ne na omari ne pod dvignjenim podom.",
            "The reading travels by LoRaWAN radio to gateway GW_04 on the roof. One gateway covers all three levels, so no sensor needs a cable – neither on a rack nor under the raised floor.",
            "Der Messwert gelangt per LoRaWAN-Funk zum Gateway GW_04 auf dem Dach. Ein Gateway deckt alle drei Ebenen ab, sodass kein Sensor ein Kabel braucht – weder am Rack noch unter dem Doppelboden.",
          ),
          run(api) {
            api.send("lux");
            api.log(
              t(
                "LIGHT_04 · Svetloba okolice pod 25 lx",
                "LIGHT_04 · Ambient light below 25 lx",
                "LIGHT_04 · Umgebungs\u00adlicht unter 25 lx",
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
                "GW_04 → Nexavia · meritev shranjena",
                "GW_04 → Nexavia · reading stored",
                "GW_04 → Nexavia · Messwert gespeichert",
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
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge zunanje svetilke.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to switch on the outdoor lamps first.",
            "Nexavia prüft jeden neuen Messwert anhand seiner Regeln. Licht unter 25 lx erfüllt die Beleuchtungsregel, also beschließt Nexavia, zuerst die Außenleuchten einzuschalten.",
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
                "LAMP_01–LAMP_03 · Ukaz: vklop",
                "LAMP_01–LAMP_03 · Command: switch on",
                "LAMP_01–LAMP_03 · Befehl: einschalten",
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
            "Časovnica hrani celotno verigo: meritev, odločitev, ukaz. Zdaj poskusite sami – kliknite senzor na kateri koli omari, da pošlje meritev, ali preklopite luč.",
            "The timeline keeps the whole chain: reading, decision, command. Now try it yourself – click the sensor on any rack to send a reading, or switch a light.",
            "Die Zeitachse hält die ganze Kette fest: Messwert, Entscheidung, Befehl. Probieren Sie es jetzt selbst – klicken Sie auf den Sensor eines Racks, um einen Messwert zu senden, oder schalten Sie ein Licht.",
          ),
          run(api) {
            api.spotlight(".twin-event");
          },
        },
      ],
    },
    {
      id: "hot-rack",
      title: t("Omara se pregreva", "A rack overheats", "Ein Rack überhitzt"),
      setup(api) {
        api.setReading("r206", celsius(24.4));
        api.setReading("r206-rh", percent(45));
        api.setLevel("FLOOR_02", 1);
        api.setAlarms([]);
        api.signal("heatmap", true);
        api.pin("r206");
        api.narrate({
          rule: t(
            "Pravilo: vstopni zrak omare > 30 °C",
            "Rule: rack inlet air > 30 °C",
            "Regel: Zuluft am Rack > 30 °C",
          ),
        });
      },
      steps: [
        {
          time: "14:05",
          focus: VIEW.level2,
          title: t(
            "Vsaka omara ima svoj senzor",
            "Every rack has its sensor",
            "Jedes Rack hat seinen Sensor",
          ),
          text: t(
            "Senzor RACK_206 na vratih omare 2.06 meri temperaturo in vlago vstopnega zraka. Ker meri vsaka omara posebej, se vroča točka pokaže tam, kjer nastane – ne šele v povprečju dvorane.",
            "Sensor RACK_206 on the door of rack 2.06 measures the temperature and humidity of the inlet air. With a sensor on every rack, a hot spot shows where it starts – not only in the hall's average.",
            "Der Sensor RACK_206 an der Tür von Rack 2.06 misst Temperatur und Feuchte der Zuluft. Mit einem Sensor an jedem Rack zeigt sich ein Hotspot dort, wo er entsteht – nicht erst im Durchschnitt des Saals.",
          ),
          run(api) {
            api.spotlight(api.$reading("level-2"));
          },
        },
        {
          time: "14:20",
          title: t(
            "Ventil hladilnika se zatakne",
            "A cooler's valve sticks",
            "Das Ventil eines Kühlers klemmt",
          ),
          text: t(
            "Ventil hladilne vode na hladilniku ob omari 2.06 se zatakne v zaprtem položaju. Strežniki delajo naprej, vstopni zrak pa se segreva.",
            "The cooling-water valve of the in-row cooler next to rack 2.06 sticks shut. The servers keep running, but their inlet air warms up.",
            "Das Kühlwasserventil des Inrow-Kühlers neben Rack 2.06 klemmt in geschlossener Stellung. Die Server laufen weiter, aber ihre Zuluft erwärmt sich.",
          ),
          run(api, play) {
            play.count("r206", 24.4, 28.6, celsius);
            api.setReading(
              "kai-thermal",
              t("Omara 2.06", "Rack 2.06", "Rack 2.06"),
              t(
                "narašča, sosede mirujejo",
                "rising, neighbours flat",
                "steigend, Nachbarn konstant",
              ),
            );
            api.log(
              t(
                "RACK_206 · 28,6 °C · narašča",
                "RACK_206 · 28.6 °C · rising",
                "RACK_206 · 28,6 °C · steigend",
              ),
              "14:20",
              "reading",
            );
            api.log(
              t(
                "KAI · Termalna anomalija: omara 2.06 odstopa od sosed",
                "KAI · Thermal anomaly: rack 2.06 departs from its neighbours",
                "KAI · Thermische Anomalie: Rack 2.06 weicht von seinen Nachbarn ab",
              ),
              "14:20",
              "decision",
            );
          },
        },
        {
          time: "14:26",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Vstopni zrak preseže 30 °C. Nexavia odpre alarm, še preden se strežniki začnejo sami zaščitno ustavljati.",
            "The inlet air passes 30 °C. Nexavia opens an alarm before the servers start to throttle and shut down to protect themselves.",
            "Die Zuluft überschreitet 30 °C. Nexavia öffnet einen Alarm, bevor die Server zum Selbstschutz drosseln und abschalten.",
          ),
          run(api, play) {
            play.count("r206", 28.6, 31.4, celsius);
            api.setAlarms([
              [
                "RACK_206",
                t(
                  "31,4 °C · meja 30 °C",
                  "31.4 °C · limit 30 °C",
                  "31,4 °C · Grenze 30 °C",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "RACK_206 · Alarm: vstopni zrak 31,4 °C",
                "RACK_206 · Alarm: inlet air 31.4 °C",
                "RACK_206 · Alarm: Zuluft 31,4 °C",
              ),
              "14:26",
              "alarm",
            );
          },
        },
        {
          time: "14:27",
          title: t(
            "Sosednja hladilnika na polno",
            "The neighbouring coolers to full",
            "Die Nachbarkühler auf volle Leistung",
          ),
          text: t(
            "Nexavia hladilnikoma na obeh straneh pošlje ukaz za največji pretok, dežurni tehnik pa prejme obvestilo z zgodovino meritev omare.",
            "Nexavia commands the coolers on either side to full flow, and the technician on duty gets a notification with the rack's reading history.",
            "Nexavia schaltet die Kühler auf beiden Seiten auf maximalen Durchfluss, und der diensthabende Techniker erhält eine Benachrichtigung mit der Messhistorie des Racks.",
          ),
          run(api, play) {
            play.count("r206", 31.4, 29.2, celsius);
            play.toast(
              t("Alarm: omara 2.06", "Alarm: rack 2.06", "Alarm: Rack 2.06"),
              t(
                "Vstopni zrak 31,4 °C · preverite hladilnik",
                "Inlet air 31.4 °C · check the cooler",
                "Zuluft 31,4 °C · Kühler prüfen",
              ),
              "14:27",
            );
            api.log(
              t(
                "COOLER_206, COOLER_207 · Ukaz: pretok 100 %",
                "COOLER_206, COOLER_207 · Command: flow 100%",
                "COOLER_206, COOLER_207 · Befehl: Durchfluss 100 %",
              ),
              "14:27",
              "command",
            );
          },
        },
        {
          time: "15:10",
          title: t(
            "Ventil zamenjan",
            "The valve is replaced",
            "Das Ventil wird getauscht",
          ),
          text: t(
            "Tehnik zamenja pogon ventila. Temperatura pade pod mejo in alarm se zapre. Noben strežnik se ni ustavil, dogodek pa ostane v evidenci.",
            "The technician replaces the valve actuator. The temperature falls below the limit and the alarm closes. No server stopped, and the event stays on record.",
            "Der Techniker tauscht den Ventilantrieb. Die Temperatur fällt unter den Grenzwert und der Alarm schließt sich. Kein Server ist ausgefallen, und das Ereignis bleibt dokumentiert.",
          ),
          run(api, play) {
            play.count("r206", 29.2, 24.6, celsius);
            api.setReading(
              "kai-thermal",
              t("Brez", "None", "Keine"),
              t("ni vročih točk", "no hot spots", "keine Hotspots"),
            );
            api.setAlarms([]);
            api.spotlight(api.$reading("level-2"));
            api.log(
              t(
                "RACK_206 · 24,6 °C · alarm zaprt",
                "RACK_206 · 24.6 °C · alarm closed",
                "RACK_206 · 24,6 °C · Alarm geschlossen",
              ),
              "15:10",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "leak",
      title: t(
        "Voda pod dvignjenim podom",
        "Water under the raised floor",
        "Wasser unter dem Doppelboden",
      ),
      setup(api) {
        api.setReading("leak-1", depth(0), dry);
        api.setReading("leak-1-at", "–");
        api.setLevel("FLOOR_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("leak-1");
        api.narrate({
          rule: t(
            "Pravilo: voda pod podom → zapora ventila",
            "Rule: water under the floor → valve closed",
            "Regel: Wasser unter dem Boden → Ventil geschlossen",
          ),
        });
      },
      steps: [
        {
          time: "03:12",
          focus: VIEW.level1,
          title: t(
            "Cevi tečejo pod podom",
            "The pipes run under the floor",
            "Die Leitungen verlaufen unter dem Boden",
          ),
          text: t(
            "Strežniki so hlajeni z vodo: dovod in povratek tečeta pod dvignjenim podom vsakega nadstropja. Senzor izliva LEAK_01 s tipalnim kablom nadzira dno praznine po vsej dolžini cevi in pove, kje na kablu je voda. Ponoči v dvorani ni nikogar.",
            "The servers are water-cooled: supply and return run under each level's raised floor. Leak detector LEAK_01 watches the bottom of the void with its sensing cable along the whole pipe run, and tells where on the cable the water is. At night nobody is in the hall.",
            "Die Server sind wassergekühlt: Vor- und Rücklauf verlaufen unter dem Doppelboden jeder Ebene. Der Leckagemelder LEAK_01 überwacht mit seinem Sensorkabel den Boden des Hohlraums entlang der gesamten Leitung und meldet, an welcher Stelle des Kabels Wasser ist. Nachts ist niemand im Saal.",
          ),
          run(api) {
            api.spotlight(api.$reading("leak-1"));
          },
        },
        {
          time: "03:40",
          title: t(
            "Spoj začne puščati",
            "A joint starts to leak",
            "Eine Verbindung beginnt zu lecken",
          ),
          text: t(
            "Tesnilo na spoju dovodne cevi popusti. Voda se nabira pod podom, kjer je nihče ne vidi – senzor jo zazna pri prvem milimetru.",
            "A seal on a supply pipe joint gives way. Water collects under the floor where nobody can see it – the detector senses the first millimetre.",
            "Eine Dichtung an einer Vorlaufverbindung gibt nach. Wasser sammelt sich unter dem Boden, wo es niemand sieht – der Melder erkennt den ersten Millimeter.",
          ),
          run(api, play) {
            play.count(
              "leak-1",
              0,
              2,
              depth,
              t("Voda zaznana", "Water found", "Wasser erkannt"),
            );
            api.setReading(
              "leak-1-at",
              t("14 m · omara 1.07", "14 m · rack 1.07", "14 m · Rack 1.07"),
            );
            api.setAlarms([
              [
                "LEAK_01",
                t(
                  "Voda pod podom · 1. nadstropje",
                  "Water under the floor · level 1",
                  "Wasser unter dem Boden · Ebene 1",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "LEAK_01 · Alarm: voda pod dvignjenim podom",
                "LEAK_01 · Alarm: water under the raised floor",
                "LEAK_01 · Alarm: Wasser unter dem Doppelboden",
              ),
              "03:40",
              "alarm",
            );
          },
        },
        {
          time: "03:40",
          focus: VIEW.plant,
          title: t(
            "Nexavia zapre zanko",
            "Nexavia closes the loop",
            "Nexavia schließt den Kreis",
          ),
          text: t(
            "Pravilo ne čaka na človeka: Nexavia zapre ventil hladilne zanke 1. nadstropja, hlajenje omar pa prevzame rezervna zanka.",
            "The rule does not wait for a person: Nexavia closes the valve of the level 1 cooling loop, and the standby loop takes over the racks' cooling.",
            "Die Regel wartet nicht auf einen Menschen: Nexavia schließt das Ventil des Kühlkreises von Ebene 1, und der Reservekreis übernimmt die Kühlung der Racks.",
          ),
          run(api) {
            api.pin("cooling");
            api.log(
              t(
                "VALVE_01 · Ukaz: zapri zanko 1. nadstropja",
                "VALVE_01 · Command: close the level 1 loop",
                "VALVE_01 · Befehl: Kreis Ebene 1 schließen",
              ),
              "03:40",
              "command",
            );
          },
        },
        {
          time: "03:41",
          focus: VIEW.level1,
          title: t(
            "Dežurni dobi klic",
            "The person on call is alerted",
            "Die Bereitschaft wird alarmiert",
          ),
          text: t(
            "Dežurni prejme SMS in klic z nadstropjem in mestom izliva. Nexavia prižge luči v 1. nadstropju, da lahko takoj dvigne talne plošče.",
            "The person on call gets an SMS and a call naming the level and where the leak is. Nexavia switches on the level 1 lights so the floor tiles can be lifted straight away.",
            "Die Bereitschaft erhält eine SMS und einen Anruf mit Ebene und Ort des Lecks. Nexavia schaltet das Licht auf Ebene 1 ein, damit die Bodenplatten sofort angehoben werden können.",
          ),
          run(api, play) {
            api.pin("leak-1");
            api.setLevel("FLOOR_01", 1);
            api.spotlight(api.$row("FLOOR_01"));
            play.count(
              "leak-1",
              2,
              3,
              depth,
              t("Voda zaznana", "Water found", "Wasser erkannt"),
            );
            play.toast(
              t("Alarm: izliv vode", "Alarm: water leak", "Alarm: Wasserleck"),
              t(
                "1. nadstropje · zanka zaprta",
                "Level 1 · loop closed",
                "Ebene 1 · Kreis geschlossen",
              ),
              "03:41",
            );
            api.log(
              t(
                "FLOOR_01 · Razsvetljava vklopljena za dežurnega",
                "FLOOR_01 · Lights on for the person on call",
                "FLOOR_01 · Licht für die Bereitschaft eingeschaltet",
              ),
              "03:41",
              "command",
            );
          },
        },
        {
          time: "05:20",
          title: t(
            "Spoj zatesnjen, pod suh",
            "Joint sealed, floor dry",
            "Verbindung abgedichtet, Boden trocken",
          ),
          text: t(
            "Dežurni zatesni spoj in posuši praznino. Senzor spet javi suho, alarm se zapre in zanka se odpre. Voda ni dosegla napajalnih kablov.",
            "The person on call seals the joint and dries the void. The detector reports dry again, the alarm closes and the loop reopens. The water never reached the power cables.",
            "Die Bereitschaft dichtet die Verbindung ab und trocknet den Hohlraum. Der Melder meldet wieder trocken, der Alarm schließt sich und der Kreis öffnet wieder. Das Wasser hat die Stromkabel nie erreicht.",
          ),
          run(api, play) {
            play.count("leak-1", 3, 0, depth, dry);
            api.setReading("leak-1-at", "–");
            api.setAlarms([]);
            api.setLevel("FLOOR_01", 0);
            api.spotlight(api.$reading("leak-1"));
            api.log(
              t(
                "LEAK_01 · Suho · alarm zaprt",
                "LEAK_01 · Dry · alarm closed",
                "LEAK_01 · Trocken · Alarm geschlossen",
              ),
              "05:20",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "humidity",
      title: t(
        "Vlaga in kondenz",
        "Humidity and condensation",
        "Feuchte und Kondensat",
      ),
      setup(api) {
        api.setReading("r304", celsius(24.8));
        api.setReading("r304-rh", percent(46));
        api.setLevel("FLOOR_03", 1);
        api.setAlarms([]);
        api.pin("r304");
        api.narrate({
          rule: t(
            "Pravilo: vlaga ob omari > 60 % dlje kot 10 min",
            "Rule: humidity at a rack > 60% for over 10 min",
            "Regel: Feuchte am Rack > 60 % länger als 10 min",
          ),
        });
      },
      steps: [
        {
          time: "16:30",
          focus: VIEW.level3,
          title: t(
            "Suh zrak v dvorani",
            "Dry air in the hall",
            "Trockene Luft im Saal",
          ),
          text: t(
            "Senzorji na omarah poleg temperature merijo tudi vlago. Ob hladnih ceveh vodnega hlajenja je pomembna: prevlažen zrak na njih kondenzira.",
            "Besides temperature, the sensors on the racks measure humidity. Next to cold water-cooling pipes it matters: air that is too humid condenses on them.",
            "Neben der Temperatur messen die Sensoren an den Racks auch die Feuchte. Neben kalten Kühlwasserleitungen ist das wichtig: Zu feuchte Luft kondensiert an ihnen.",
          ),
          run() {},
        },
        {
          time: "17:10",
          title: t(
            "Nevihta in odprta loputa",
            "A storm and an open damper",
            "Ein Gewitter und eine offene Klappe",
          ),
          text: t(
            "Loputa svežega zraka ostane po vzdrževanju odprta, zunaj pa je soparno pred nevihto. Vlaga ob omarah 3. nadstropja narašča.",
            "A fresh-air damper is left open after maintenance, and it is muggy outside before a storm. Humidity at the level 3 racks climbs.",
            "Eine Frischluftklappe bleibt nach der Wartung offen, und draußen ist es vor einem Gewitter schwül. Die Feuchte an den Racks auf Ebene 3 steigt.",
          ),
          run(api, play) {
            play.count("r304-rh", 46, 58, percent);
            api.log(
              t(
                "RACK_304 · Vlaga 58 % · narašča",
                "RACK_304 · Humidity 58% · rising",
                "RACK_304 · Feuchte 58 % · steigend",
              ),
              "17:10",
              "reading",
            );
          },
        },
        {
          time: "17:22",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Vlaga je nad 60 % že 10 minut. Nexavia odpre alarm in zviša temperaturo dovoda hladilne vode nad rosišče, da se na ceveh ne nabira kondenz.",
            "Humidity has been above 60% for 10 minutes. Nexavia opens an alarm and raises the cooling-water supply temperature above the dew point, so nothing condenses on the pipes.",
            "Die Feuchte liegt seit 10 Minuten über 60 %. Nexavia öffnet einen Alarm und hebt die Vorlauftemperatur des Kühlwassers über den Taupunkt, damit an den Leitungen nichts kondensiert.",
          ),
          run(api, play) {
            play.count("r304-rh", 58, 64, percent);
            api.setAlarms([
              [
                "RACK_304",
                t(
                  "Vlaga 64 % · meja 60 %",
                  "Humidity 64% · limit 60%",
                  "Feuchte 64 % · Grenze 60 %",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            play.toast(
              t(
                "Alarm: vlaga v dvorani",
                "Alarm: hall humidity",
                "Alarm: Feuchte im Saal",
              ),
              t(
                "3. nadstropje · 64 % · zaprite loputo",
                "Level 3 · 64% · close the damper",
                "Ebene 3 · 64 % · Klappe schließen",
              ),
              "17:22",
            );
            api.log(
              t(
                "CHW_01 · Ukaz: dovod hladilne vode +2 °C",
                "CHW_01 · Command: cooling-water supply +2 °C",
                "CHW_01 · Befehl: Kühlwasservorlauf +2 °C",
              ),
              "17:22",
              "command",
            );
          },
        },
        {
          time: "18:05",
          title: t(
            "Zrak je spet suh",
            "The air is dry again",
            "Die Luft ist wieder trocken",
          ),
          text: t(
            "Tehnik zapre loputo, razvlaževanje zniža vlago pod mejo in alarm se zapre. Dovod hladilne vode se vrne na običajno temperaturo.",
            "The technician closes the damper, dehumidifying brings humidity below the limit and the alarm closes. The cooling-water supply returns to its usual temperature.",
            "Der Techniker schließt die Klappe, die Entfeuchtung senkt die Feuchte unter den Grenzwert und der Alarm schließt sich. Der Kühlwasservorlauf kehrt zu seiner üblichen Temperatur zurück.",
          ),
          run(api, play) {
            play.count("r304-rh", 64, 47, percent);
            api.setAlarms([]);
            api.log(
              t(
                "RACK_304 · Vlaga 47 % · alarm zaprt",
                "RACK_304 · Humidity 47% · alarm closed",
                "RACK_304 · Feuchte 47 % · Alarm geschlossen",
              ),
              "18:05",
              "alarm",
            );
          },
        },
      ],
    },
    {
      // The power chain under a mains failure: four alarms, one incident.
      id: "mains-failure",
      title: t("Izpad omrežja", "Mains failure", "Netzausfall"),
      setup(api) {
        api.setReading("pq", volts(231), quality);
        api.setReading("pq-events", "0");
        api.setReading("ups-mode", t("Omrežje", "Mains", "Netz"));
        api.setReading("ups-in", volts(231));
        api.setReading("battery", percent(100), runtime(14));
        api.setReading("battery-runtime", "14 min");
        api.setReading(
          "gen",
          kw(0),
          t("pripravljen", "standby", "Bereitschaft"),
        );
        api.setReading("gen-state", t("Pripravljen", "Standby", "Bereit"));
        api.setReading("gen-v", volts(0));
        api.setReading("gen-hz", `${n(0, 1)} Hz`);
        api.setReading("fuel", percent(86), autonomy(41));
        api.setReading("noc-incidents", "0", noIncident);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("pq");
        api.narrate({
          rule: t(
            "Pravilo: izpad omrežja → UPS, agregat in en incident",
            "Rule: mains failure → UPS, generator and one incident",
            "Regel: Netzausfall → USV, Aggregat und ein Vorfall",
          ),
        });
      },
      steps: [
        {
          time: "02:13",
          focus: VIEW.yard,
          title: t(
            "Elektrika je merjena na vsaki stopnji",
            "Power is metered at every stage",
            "Strom wird an jeder Stufe gemessen",
          ),
          text: t(
            "Analizator PQ_01 na transformatorju meri napetost, harmonike in frekvenco dovoda, števec POWER_01 na glavnem razdelilniku pa moč celega objekta. Od tu gre elektrika prek UPS-a do razdelilnika vsake vrste in do PDU-ja vsake omare.",
            "Analyser PQ_01 on the transformer measures the feed's voltage, harmonics and frequency, and meter POWER_01 on the main switchboard the whole site's load. From here the power goes through the UPS to each row's power panel and each rack's PDU.",
            "Der Analysator PQ_01 am Transformator misst Spannung, Oberschwingungen und Frequenz der Einspeisung, der Zähler POWER_01 am Hauptverteiler die Last des gesamten Standorts. Von hier fließt der Strom über die USV zum Verteiler jeder Reihe und zur PDU jedes Racks.",
          ),
          run(api) {
            api.spotlight(api.$reading("pq"));
          },
        },
        {
          time: "02:14",
          title: t(
            "Napetost na dovodu pade",
            "The feed's voltage collapses",
            "Die Spannung der Einspeisung bricht ein",
          ),
          text: t(
            "Okvara v omrežju: napetost dovoda A v nekaj periodah pade s 231 V na nič. Analizator dogodek zabeleži s časovnim žigom na milisekundo.",
            "A fault on the grid: the voltage of feed A falls from 231 V to nothing within a few cycles. The analyser records the event with a timestamp to the millisecond.",
            "Eine Störung im Netz: Die Spannung der Einspeisung A fällt innerhalb weniger Perioden von 231 V auf null. Der Analysator protokolliert das Ereignis mit einem millisekundengenauen Zeitstempel.",
          ),
          run(api, play) {
            play.count(
              "pq",
              231,
              0,
              volts,
              t("izpad dovoda A", "feed A lost", "Einspeisung A ausgefallen"),
            );
            api.setReading("pq-events", "1");
            api.setReading("ups-in", volts(0));
            api.setAlarms([
              [
                "PQ_01",
                t(
                  "Izpad omrežja · dovod A",
                  "Mains failure · feed A",
                  "Netzausfall · Einspeisung A",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "PQ_01 · Alarm: izpad napetosti na dovodu A",
                "PQ_01 · Alarm: voltage lost on feed A",
                "PQ_01 · Alarm: Spannungsausfall an Einspeisung A",
              ),
              "02:14:07",
              "alarm",
            );
          },
        },
        {
          time: "02:14",
          focus: VIEW.ups,
          title: t(
            "UPS prevzame breme",
            "The UPS takes the load",
            "Die USV übernimmt die Last",
          ),
          text: t(
            "UPS brez prekinitve preklopi na baterije. Strežniki ne opazijo ničesar, baterije pa se praznijo: Nexavia iz napolnjenosti in bremena sproti računa, koliko minut je še na voljo.",
            "The UPS switches to its batteries without a break. The servers notice nothing, but the batteries are draining: from their charge and the load Nexavia keeps working out how many minutes are left.",
            "Die USV schaltet unterbrechungsfrei auf ihre Batterien um. Die Server bemerken nichts, aber die Batterien entladen sich: Aus Ladung und Last berechnet Nexavia laufend, wie viele Minuten noch bleiben.",
          ),
          run(api, play) {
            api.pin("ups");
            api.setReading("ups-mode", t("Baterije", "Batteries", "Batterien"));
            play.count("battery", 100, 96, percent, runtime(13));
            api.setReading("battery-runtime", "13 min");
            api.setAlarms([
              [
                "PQ_01",
                t(
                  "Izpad omrežja · dovod A",
                  "Mains failure · feed A",
                  "Netzausfall · Einspeisung A",
                ),
              ],
              [
                "UPS_01",
                t(
                  "Deluje na baterijah",
                  "Running on batteries",
                  "Batteriebetrieb",
                ),
              ],
            ]);
            api.log(
              t(
                "UPS_01 · Alarm: delovanje na baterijah · 13 min",
                "UPS_01 · Alarm: on batteries · 13 min",
                "UPS_01 · Alarm: Batteriebetrieb · 13 min",
              ),
              "02:14:08",
              "alarm",
            );
          },
        },
        {
          time: "02:14",
          focus: VIEW.yard,
          title: t(
            "Agregat se zažene",
            "The generator starts",
            "Das Aggregat startet",
          ),
          text: t(
            "Nexavia agregatu pošlje ukaz za zagon in spremlja, kako prevzame breme: napetost, frekvenco in moč. Nivo goriva pove, koliko ur lahko podatkovni center teče brez omrežja.",
            "Nexavia commands the generator to start and watches it take the load: voltage, frequency and output. The fuel level tells how many hours the datacenter can run without the grid.",
            "Nexavia gibt dem Aggregat den Startbefehl und beobachtet, wie es die Last übernimmt: Spannung, Frequenz und Leistung. Der Kraftstoffstand zeigt, wie viele Stunden das Rechenzentrum ohne Netz laufen kann.",
          ),
          run(api, play) {
            api.pin("gen");
            api.setReading("gen-state", t("Teče", "Running", "Läuft"));
            play.count(
              "gen",
              0,
              413,
              kw,
              t("teče · 50,0 Hz", "running · 50.0 Hz", "läuft · 50,0 Hz"),
            );
            api.setReading("gen-v", volts(231));
            api.setReading("gen-hz", `${n(50, 1)} Hz`);
            api.setReading("ups-mode", t("Agregat", "Generator", "Aggregat"));
            api.setReading("ups-in", volts(231));
            api.setReading("fuel", percent(86), autonomy(41));
            api.log(
              t(
                "GEN_01 · Ukaz: zagon agregata",
                "GEN_01 · Command: start",
                "GEN_01 · Befehl: Start",
              ),
              "02:14:09",
              "command",
            );
            api.log(
              t(
                "GEN_01 · Teče · 413 kW · 50,0 Hz",
                "GEN_01 · Running · 413 kW · 50.0 Hz",
                "GEN_01 · Läuft · 413 kW · 50,0 Hz",
              ),
              "02:14:21",
              "reading",
            );
          },
        },
        {
          time: "02:15",
          title: t(
            "Štirje alarmi, en incident",
            "Four alarms, one incident",
            "Vier Alarme, ein Vorfall",
          ),
          text: t(
            "Izpad dovoda, UPS na baterijah, zagon agregata in ponovni zagon hladilnika so se zgodili v 14 sekundah. KAI jih po času in po napajalni verigi poveže v en incident z enim vzrokom, dežurni pa dobi eno obvestilo in en delovni nalog namesto štirih.",
            "The lost feed, the UPS on batteries, the generator start and a cooler's restart all happened within 14 seconds. KAI ties them together by time and by the power chain into one incident with one cause, and the person on call gets one notification and one ticket instead of four.",
            "Der Ausfall der Einspeisung, die USV im Batteriebetrieb, der Start des Aggregats und der Neustart eines Kühlers geschahen innerhalb von 14 Sekunden. KAI verknüpft sie nach Zeit und Stromkette zu einem Vorfall mit einer Ursache, und die Bereitschaft erhält eine Benachrichtigung und ein Ticket statt vier.",
          ),
          run(api, play) {
            api.setReading(
              "noc-incidents",
              "1",
              t(
                "vzrok: izpad dovoda A",
                "cause: feed A lost",
                "Ursache: Einspeisung A ausgefallen",
              ),
            );
            api.spotlight(api.$reading("noc-incidents"));
            play.toast(
              t(
                "Incident: izpad omrežja",
                "Incident: mains failure",
                "Vorfall: Netzausfall",
              ),
              t(
                "4 alarmi · agregat teče · gorivo za 41 h",
                "4 alarms · generator running · fuel for 41 h",
                "4 Alarme · Aggregat läuft · Kraftstoff für 41 h",
              ),
              "02:15",
            );
            api.log(
              t(
                "KAI · 4 alarmi združeni v incident · vzrok: izpad dovoda A",
                "KAI · 4 alarms merged into one incident · cause: feed A lost",
                "KAI · 4 Alarme zu einem Vorfall zusammengeführt · Ursache: Einspeisung A ausgefallen",
              ),
              "02:15",
              "decision",
            );
            api.log(
              t(
                "Delovni nalog odprt v servisnem sistemu",
                "Ticket opened in the service desk",
                "Ticket im Servicedesk geöffnet",
              ),
              "02:15",
              "notify",
            );
          },
        },
        {
          time: "02:48",
          title: t(
            "Omrežje se vrne",
            "The grid returns",
            "Das Netz kehrt zurück",
          ),
          text: t(
            "Napetost na dovodu je spet stabilna. UPS preklopi nazaj na omrežje, agregat se ohladi in ustavi, baterije se polnijo. Incident se zapre z zapisom celotnega poteka – za poročilo in za SLA.",
            "The feed's voltage is stable again. The UPS switches back to the mains, the generator cools down and stops, and the batteries recharge. The incident closes with a record of the whole sequence – for the report and for the SLA.",
            "Die Spannung der Einspeisung ist wieder stabil. Die USV schaltet zurück auf das Netz, das Aggregat kühlt ab und stoppt, und die Batterien laden sich auf. Der Vorfall wird mit einem Protokoll des gesamten Ablaufs geschlossen – für den Bericht und das SLA.",
          ),
          run(api, play) {
            api.pin("pq");
            play.count("pq", 0, 231, volts, quality);
            api.setReading("ups-mode", t("Omrežje", "Mains", "Netz"));
            play.count(
              "gen",
              413,
              0,
              kw,
              t("ohlajanje", "cooling down", "Abkühlung"),
            );
            api.setReading(
              "gen-state",
              t("Ohlajanje", "Cooling down", "Abkühlung"),
            );
            api.setReading("gen-v", volts(0));
            api.setReading("gen-hz", `${n(0, 1)} Hz`);
            play.count("battery", 96, 100, percent, runtime(14));
            api.setReading("battery-runtime", "14 min");
            api.setReading("fuel", percent(84), autonomy(40));
            api.setReading("noc-incidents", "0", noIncident);
            api.setAlarms([]);
            api.log(
              t(
                "PQ_01 · Dovod A 231 V · incident zaprt",
                "PQ_01 · Feed A 231 V · incident closed",
                "PQ_01 · Einspeisung A 231 V · Vorfall geschlossen",
              ),
              "02:48",
              "alarm",
            );
          },
        },
      ],
    },
    {
      // Predictive maintenance: KAI on the battery monitor's readings.
      id: "battery-forecast",
      title: t(
        "KAI napove okvaro baterije",
        "KAI predicts a battery failure",
        "KAI sagt einen Batterieausfall voraus",
      ),
      setup(api) {
        api.setReading("battery-r", milliohm(3.2));
        api.setReading("battery-soh", percent(94));
        api.setReading("battery-temp", celsius(24.1));
        api.setReading(
          "kai-battery",
          t("SoH 94 %", "SoH 94%", "SoH 94 %"),
          t(
            "zamenjava čez ~26 mes.",
            "replace in ~26 months",
            "Austausch in ~26 Monaten",
          ),
        );
        api.setLevel("FLOOR_02", 1);
        api.setAlarms([]);
        api.pin("battery");
        api.narrate({
          rule: t(
            "KAI: napoved okvare baterije UPS",
            "KAI: UPS battery failure forecast",
            "KAI: Ausfallprognose der USV-Batterie",
          ),
        });
      },
      steps: [
        {
          time: "09:00",
          focus: VIEW.ups,
          title: t(
            "Vsaka celica je merjena",
            "Every cell is measured",
            "Jede Zelle wird gemessen",
          ),
          text: t(
            "Nadzor BATT_01 meri napetost, notranjo upornost in temperaturo vsake celice v baterijskih nizih UPS-a. Baterija, ki odpove, tega ne pokaže prej kot ob izpadu – razen če jo kdo meri.",
            "Monitor BATT_01 measures the voltage, internal resistance and temperature of every cell in the UPS battery strings. A battery about to fail shows nothing until the outage – unless someone measures it.",
            "Die Überwachung BATT_01 misst Spannung, Innenwiderstand und Temperatur jeder Zelle in den Batteriesträngen der USV. Eine Batterie, die ausfallen wird, zeigt das erst beim Netzausfall – es sei denn, jemand misst sie.",
          ),
          run(api) {
            api.spotlight(api.$reading("battery"));
          },
        },
        {
          time: "09:05",
          title: t(
            "Upornost ene celice raste",
            "One cell's resistance climbs",
            "Der Widerstand einer Zelle steigt",
          ),
          text: t(
            "Notranja upornost celice 14 v nizu 2 se je v treh tednih povečala s 3,2 na 4,6 mΩ, celica pa je toplejša od sosed. Nobena meja še ni presežena, zato običajen alarm molči.",
            "The internal resistance of cell 14 in string 2 has risen from 3.2 to 4.6 mΩ in three weeks, and the cell runs warmer than its neighbours. No limit is crossed yet, so an ordinary alarm stays silent.",
            "Der Innenwiderstand von Zelle 14 in Strang 2 ist in drei Wochen von 3,2 auf 4,6 mΩ gestiegen, und die Zelle ist wärmer als ihre Nachbarn. Noch ist kein Grenzwert überschritten, also bleibt ein gewöhnlicher Alarm stumm.",
          ),
          run(api, play) {
            play.count("battery-r", 3.2, 4.6, milliohm);
            play.count("battery-temp", 24.1, 26.8, celsius);
            api.log(
              t(
                "BATT_01 · Celica 2/14 · upornost 4,6 mΩ · narašča",
                "BATT_01 · Cell 2/14 · resistance 4.6 mΩ · rising",
                "BATT_01 · Zelle 2/14 · Widerstand 4,6 mΩ · steigend",
              ),
              "09:05",
              "reading",
            );
          },
        },
        {
          time: "09:05",
          title: t(
            "KAI oceni, koliko časa je še",
            "KAI estimates the time left",
            "KAI schätzt die verbleibende Zeit",
          ),
          text: t(
            "KAI trend primerja z vzorci staranja in oceni stanje niza (SoH) na 81 %. Napove, da bo niz pod mejo zanesljivosti čez približno pet mesecev, in to zapiše kot ugotovitev – ne kot alarm.",
            "KAI compares the trend with ageing patterns and puts the string's state of health (SoH) at 81%. It forecasts that the string will fall below its reliability limit in about five months, and records that as a finding – not as an alarm.",
            "KAI vergleicht den Trend mit Alterungsmustern und schätzt den Gesundheitszustand (SoH) des Strangs auf 81 %. Es prognostiziert, dass der Strang in etwa fünf Monaten unter seine Zuverlässigkeitsgrenze fällt, und erfasst das als Befund – nicht als Alarm.",
          ),
          run(api, play) {
            play.count("battery-soh", 94, 81, percent);
            api.setReading(
              "kai-battery",
              t("SoH 81 %", "SoH 81%", "SoH 81 %"),
              t(
                "zamenjava čez ~5 mes.",
                "replace in ~5 months",
                "Austausch in ~5 Monaten",
              ),
            );
            api.spotlight(api.$reading("kai-battery"));
            api.log(
              t(
                "KAI · Napoved: niz 2 pod mejo čez ~5 mesecev (SoH 81 %)",
                "KAI · Forecast: string 2 below its limit in ~5 months (SoH 81%)",
                "KAI · Prognose: Strang 2 in ~5 Monaten unter der Grenze (SoH 81 %)",
              ),
              "09:05",
              "decision",
            );
          },
        },
        {
          time: "09:06",
          title: t(
            "Zamenjava se načrtuje",
            "The replacement is planned",
            "Der Austausch wird geplant",
          ),
          text: t(
            "Nexavia odpre delovni nalog v servisnem sistemu in zamenjavo uvrsti v naslednje redno vzdrževalno okno. Baterije so zamenjane po načrtu, ne ob izpadu.",
            "Nexavia opens a ticket in the service desk and puts the replacement into the next planned maintenance window. The batteries are replaced on schedule, not during an outage.",
            "Nexavia öffnet ein Ticket im Servicedesk und legt den Austausch in das nächste geplante Wartungsfenster. Die Batterien werden nach Plan getauscht, nicht während eines Ausfalls.",
          ),
          run(api, play) {
            play.toast(
              t("KAI: baterija UPS", "KAI: UPS battery", "KAI: USV-Batterie"),
              t(
                "Niz 2 · zamenjava v 5 mesecih · nalog odprt",
                "String 2 · replace within 5 months · ticket opened",
                "Strang 2 · Austausch innerhalb von 5 Monaten · Ticket geöffnet",
              ),
              "09:06",
            );
            api.log(
              t(
                "Delovni nalog: zamenjava baterijskega niza 2",
                "Ticket: replace battery string 2",
                "Ticket: Batteriestrang 2 tauschen",
              ),
              "09:06",
              "notify",
            );
          },
        },
      ],
    },
  ];
}
