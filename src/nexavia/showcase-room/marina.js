import { initWater, sample } from "./water.js";
import { initBeacons } from "./beacons.js";
import { initTraffic } from "./traffic.js";
import { initTide } from "./tide.js";
import geometry from "../../components/nexavia/showcase/marina-geometry.json";

// The smart marina and camp twin: hotel, restaurant, both sanitary blocks,
// four pier lights and the camp's two mobile homes, with meters and sensors
// on every pier, in the camp and on the shared services. The pier and
// building lights follow one lighting rule; the mobile homes follow their
// bookings. Driven by twin.js; the maquette and its geometry come from
// scripts/generate-marina-maquette.mjs.

const PIERS = ["PIER_01", "PIER_02", "PIER_03", "PIER_04"];
const HOMES = ["MOBILE_HOME_01", "MOBILE_HOME_02"];
const ALL = [
  "HOTEL_01",
  "RESTAURANT_01",
  "SANITARY_01",
  ...PIERS,
  ...HOMES,
  "CAMP_SANITARY_01",
];
const off = () => Array(ALL.length).fill(0);
// Camera framings on the model (scene pixels).
const VIEW = {
  basin: { x: 760, y: 470, zoom: 1.15, radius: 0.5 },
  piers: { x: 768, y: 440, zoom: 1.35, radius: 0.32 },
  wind: { x: 400, y: 520, zoom: 1.4, radius: 0.3 },
  sea: { x: 773, y: 320, zoom: 1.4, radius: 0.3 },
  shore: { x: 900, y: 440, zoom: 1.45, radius: 0.28 },
  sanitary: { x: 1170, y: 420, zoom: 1.5, radius: 0.26 },
  parking: { x: 360, y: 440, zoom: 1.45, radius: 0.3 },
  cabinet: { x: 880, y: 360, zoom: 1.7, radius: 0.24 },
  berthB: { x: 950, y: 510, zoom: 1.7, radius: 0.24 },
  camp: { x: 760, y: 175, zoom: 1.7, radius: 0.34 },
  reception: { x: 820, y: 180, zoom: 2.1, radius: 0.22 },
  home: { x: 600, y: 180, zoom: 2.2, radius: 0.2 },
  pitch: { x: 1000, y: 180, zoom: 2.1, radius: 0.2 },
  pool: { x: 360, y: 350, zoom: 1.9, radius: 0.22 },
  quays: { x: 1000, y: 430, zoom: 1.3, radius: 0.4 },
};
// The socket cells on the pedestal cards (see marina.ts).
const socket = (t, n, kw) =>
  t(`VKLOP · ${n(kw, 1)} kW`, `ON · ${n(kw, 1)} kW`, `EIN · ${n(kw, 1)} kW`);
const socketOff = (t) => t("IZKLOP", "OFF", "AUS");

const { berths, parking } = geometry;
// Berths and parking spaces as the model shows them.
const occupied = (extra = 0) => [
  `${berths.occupied + extra} / ${berths.total}`,
  undefined,
  String(berths.occupied + extra),
];
const freeSpaces = (change = 0) => {
  const free = parking.total - parking.parked + change;
  return [`${free} / ${parking.total}`, undefined, String(free)];
};

// The whole water surface moves: the water rendered alone is redrawn in
// wavering strips (its alpha keeps boats, piers and quays still). Waves are
// larger and longer nearer the viewer. Same motion as the city's river: a
// sideways sway plus a slow vertical swell that stretches the reflections.
const WATER = { x: 88, y: 284, width: 1364, height: 492 };
const waves = (source) => [
  {
    source,
    area: WATER,
    row(rowY, t, area) {
      const depth = 0.55 + (0.5 * (rowY - area.y)) / area.height;
      const shift =
        depth *
        (3 * Math.sin(rowY * (0.2 / depth) - t * 1.3) +
          1.5 * Math.sin(rowY * (0.07 / depth) + t * 0.8));
      sample.x = area.x - shift;
      sample.y = rowY + depth * 1.7 * Math.sin(rowY * (0.13 / depth) - t * 1.6);
      sample.width = area.width;
    },
  },
];

// The red and green lights at the harbour entrance flash out of step.
const BEACONS = [
  {
    lamp: [673, 620],
    reflection: [676, 721],
    color: "#ff3a2a",
    glint: "#ffb3a6",
    dark: "#200605",
    period: 4,
    phase: 0,
    on: 1.1,
  },
  {
    lamp: [863, 620],
    reflection: [859, 721],
    color: "#22ff78",
    glint: "#b8ffd4",
    dark: "#03170b",
    period: 4,
    phase: 2,
    on: 1.1,
  },
];

// Traffic: cars on the coast road and through the car parks, people on the
// promenade and piers, boats along the coast, round the marina and to the
// fuel dock. Routes and the scenery in front of them are generated.
const TRAFFIC = {
  id: "marina",
  routes: geometry.traffic.routes,
  occluders: geometry.traffic.occluders,
  masks: true,
  counts: { car: 5, cyclist: 2, pedestrian: 7, boat: 4 },
};

// High water: about 6 px up the quay walls at the warning level. The six
// lowest pedestals sit along the seaward pier on the east side (pier B).
const TIDE = {
  base: 0.45,
  perMetre: 18,
  max: 8,
  pedestals: [865, 893, 921, 949, 977, 1005].map((x) => [x, 531]),
};

function water(root) {
  const surface = waves(
    root.querySelector("[data-city-art]")?.dataset.waterSrc,
  );
  const redraw = initWater(root, surface);
  const lang = document.documentElement.lang.slice(0, 2);
  initTide(root, {
    water: redraw,
    patch: surface[0],
    ...TIDE,
    label:
      { en: "6 pedestals switched off", de: "6 Säulen abgeschaltet" }[lang] ??
      "6 priključkov izklopljenih",
  });
}

export const marina = {
  effects: [
    water,
    (root) => initBeacons(root, BEACONS),
    (root) => initTraffic(root, TRAFFIC),
  ],
  // The radio gateway on the hotel roof.
  gateway: { id: "GW_02", at: [424, 214] },
  devices: (t) => [
    { id: "HOTEL_01", name: t("Hotel", "Hotel", "Hotel"), watts: 180 },
    {
      id: "RESTAURANT_01",
      name: t(
        "Restavracija s teraso",
        "Restaurant and terrace",
        "Restaurant und Terrasse",
      ),
      watts: 140,
    },
    {
      id: "SANITARY_01",
      name: t("Sanitarni blok", "Sanitary block", "Sanitärblock"),
      watts: 45,
    },
    {
      id: "PIER_01",
      name: t("Luč pomola A1", "Pier light A1", "Stegleuchte A1"),
      watts: 40,
    },
    {
      id: "PIER_02",
      name: t("Luč pomola A2", "Pier light A2", "Stegleuchte A2"),
      watts: 40,
    },
    {
      id: "PIER_03",
      name: t("Luč pomola B1", "Pier light B1", "Stegleuchte B1"),
      watts: 40,
    },
    {
      id: "PIER_04",
      name: t("Luč pomola B2", "Pier light B2", "Stegleuchte B2"),
      watts: 40,
    },
    {
      id: "MOBILE_HOME_01",
      name: t("Mobilna hišica MH-01", "Mobile home MH-01", "Mobilheim MH-01"),
      watts: 60,
    },
    {
      id: "MOBILE_HOME_02",
      name: t("Mobilna hišica MH-02", "Mobile home MH-02", "Mobilheim MH-02"),
      watts: 60,
    },
    {
      id: "CAMP_SANITARY_01",
      name: t(
        "Sanitarije v kampu",
        "Camp sanitary block",
        "Sanitärblock Campingplatz",
      ),
      watts: 35,
    },
  ],
  group: {
    ids: PIERS,
    subject: "PIER_01–PIER_04",
    name: (t) => t("Luči na pomolih", "Pier lights", "Stegleuchten"),
  },
  counters: [],
  steps: (t) => [
    {
      at: "day",
      text: t(
        "Senzor LIGHT_02: 52 lx · dovolj dnevne svetlobe",
        "Sensor LIGHT_02: 52 lx · enough daylight",
        "Sensor LIGHT_02: 52 lx · genug Tageslicht",
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
            "LIGHT_02 · Svetloba okolice 52 lx",
            "LIGHT_02 · Ambient light 52 lx",
            "LIGHT_02 · Umgebungs\u00adlicht 52 lx",
          ),
        ],
      ],
    },
    {
      at: "dusk",
      text: t(
        "Senzor LIGHT_02: 21 lx · sonce zahaja",
        "Sensor LIGHT_02: 21 lx · the sun is setting",
        "Sensor LIGHT_02: 21 lx · die Sonne geht unter",
      ),
      lux: 21,
      states: off(),
      rule: t(
        "Pogoj izpolnjen · ukaz se pošilja prek GW_02",
        "Condition met · command sent via GW_02",
        "Bedingung erfüllt · Befehl über GW_02 gesendet",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_02 · Svetloba okolice 21 lx · prek prehoda GW_02",
            "LIGHT_02 · Ambient light 21 lx · via gateway GW_02",
            "LIGHT_02 · Umgebungs\u00adlicht 21 lx · über Gateway GW_02",
          ),
        ],
        [
          "decision",
          t(
            "Pravilo svetloba < 25 lx izpolnjeno (21 lx) → vklop razsvetljave, najprej pomoli",
            "Rule light < 25 lx met (21 lx) → lighting on, piers first",
            "Regel Licht < 25 lx erfüllt (21 lx) → Beleuchtung ein, zuerst die Stege",
          ),
        ],
      ],
    },
    {
      at: "dusk+10",
      text: t(
        "Na pomolih se prižgejo luči",
        "The pier lights switch on",
        "Die Stegleuchten gehen an",
      ),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      rule: t(
        "Aktivno · najprej varna pot do plovil",
        "Active · safe access to the boats first",
        "Aktiv · zuerst ein sicherer Zugang zu den Booten",
      ),
      log: [
        [
          "command",
          t(
            "PIER_01–PIER_04 · Luči na pomolih vklopljene",
            "PIER_01–PIER_04 · Pier lights switched on",
            "PIER_01–PIER_04 · Stegleuchten eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+20",
      text: t(
        "Restavracija prižge luči na terasi",
        "The restaurant lights up its terrace",
        "Das Restaurant beleuchtet seine Terrasse",
      ),
      lux: 21,
      states: [0, 1, 0, 1, 1, 1, 1, 0, 0, 0],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
        "Aktiv · automatische Lichtsteuerung",
      ),
      log: [
        [
          "command",
          t(
            "RESTAURANT_01 · Razsvetljava terase vklopljena",
            "RESTAURANT_01 · Terrace lighting switched on",
            "RESTAURANT_01 · Terrassenbeleuchtung eingeschaltet",
          ),
        ],
      ],
    },
    {
      at: "dusk+30",
      text: t(
        "V hotelu in zasedenih mobilnih hišicah se prižgejo luči",
        "The hotel and the booked mobile homes light up",
        "Im Hotel und in den gebuchten Mobilheimen gehen die Lichter an",
      ),
      lux: 21,
      states: [1, 1, 0, 1, 1, 1, 1, 1, 1, 0],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
        "Aktiv · automatische Lichtsteuerung",
      ),
      log: [
        [
          "command",
          t(
            "HOTEL_01 · Razsvetljava vklopljena",
            "HOTEL_01 · Lighting switched on",
            "HOTEL_01 · Beleuchtung eingeschaltet",
          ),
        ],
        [
          "command",
          t(
            "MOBILE_HOME_01–02 · Zasedeni po PMS · razsvetljava vklopljena",
            "MOBILE_HOME_01–02 · Booked in the PMS · lighting on",
            "MOBILE_HOME_01–02 · laut PMS gebucht · Beleuchtung ein",
          ),
        ],
      ],
    },
    {
      at: "dusk+40",
      text: t(
        "Sanitarije v marini in kampu vklopijo razsvetljavo",
        "Both sanitary blocks light up",
        "Beide Sanitärblöcke schalten das Licht ein",
      ),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      rule: t(
        "Samodejna razsvetljava je aktivna",
        "Automatic lighting active",
        "Automatische Beleuchtung aktiv",
      ),
      log: [
        [
          "command",
          t(
            "SANITARY_01 · Razsvetljava vklopljena",
            "SANITARY_01 · Lighting switched on",
            "SANITARY_01 · Beleuchtung eingeschaltet",
          ),
        ],
        [
          "command",
          t(
            "CAMP_SANITARY_01 · Razsvetljava vklopljena",
            "CAMP_SANITARY_01 · Lighting switched on",
            "CAMP_SANITARY_01 · Beleuchtung eingeschaltet",
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
            "LIGHT_02 · Svetloba okolice 52 lx",
            "LIGHT_02 · Ambient light 52 lx",
            "LIGHT_02 · Umgebungs\u00adlicht 52 lx",
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
            "Vse luči v marini in kampu izklopljene",
            "All marina and camp lights switched off",
            "Alle Lichter in Marina und Campingplatz ausgeschaltet",
          ),
        ],
      ],
    },
  ],
  // The tripped pedestal stays open; the weak gateway signal to the far pier
  // light clears for a while.
  alarms: (index) =>
    index === 3 || index === 4 ? ["PEDESTAL_B07"] : ["PEDESTAL_B07", "PIER_04"],
  tick(index, { setReading, t, n }) {
    const i = index % 7;
    setReading(
      "hotel-power",
      `${n(38.5 + [0, 0.4, 1.1, 1.8, 2.6, 3.1, 0.9][i], 1)} kW`,
    );
    setReading("shore-power", `${n(46.8 + i * 0.2, 1)} kWh`);
    setReading(
      "sanitary-water",
      `${n(0.84 + [0, 0.06, -0.04, 0.1, 0.02, -0.08, 0.03][i], 2)} m³/h`,
    );
    const fuel = [72, 72, 71, 71, 71, 70, 70][i];
    setReading("fuel", t(`${fuel} %`, `${fuel}%`, `${fuel} %`));
    setReading(
      "sea-level",
      `+${n(0.42 + [0, 0.02, 0.03, 0.05, 0.04, 0.02, 0.01][i], 2)} m`,
    );
    const wind = 9 + [0, 1, -1, 2, 1, 0, -1][i];
    setReading(
      "wind",
      `${wind} kn`,
      t(
        `Sunki ${wind + 4} kn · SV`,
        `Gusts ${wind + 4} kn · NE`,
        `Böen ${wind + 4} kn · NO`,
      ),
    );
    setReading("wind-gust", `${wind + 4} kn`);
    setReading("wind-temp", `${n(17.9 - i * 0.2, 1)} °C`);
    setReading("parking", ...freeSpaces([0, 0, -1, -1, -2, -1, 0][i]));
    // Pedestals and the camp: the stays add up; sockets keep the state a
    // visitor or a rule left them in.
    setReading("pedestal-a-kwh", `${n(31.7 + i * 0.3, 1)} kWh`);
    setReading("pedestal-b-kwh", `${n(18.2 + i * 0.2, 1)} kWh`);
    setReading(
      "shore-kw",
      `${n(18.4 + [0, 0.6, 1.4, 2.1, 1.2, 0.4, -0.3][i], 1)} kW`,
    );
    const camp = 68 + [0, 2, 5, 7, 4, 1, -2][i];
    setReading("camp-feeder", `${camp} kW`);
    // Of the 250 kW the site has contracted.
    const share = Math.round(camp / 2.5);
    setReading("camp-feeder-share", t(`${share} %`, `${share}%`, `${share} %`));
    setReading("camp-pedestal-kwh", `${n(6.2 + i * 0.15, 1)} kWh`);
    setReading(
      "mobile-home",
      `${n(24.1 + [0, 0.1, -0.1, 0.2, 0, -0.2, 0.1][i], 1)} °C`,
    );
    setReading("mh-co2", `${610 + [0, 20, 35, 10, -15, -5, 25][i]} ppm`);
    setReading(
      "camp-sanitary",
      `${n(0.42 + [0, 0.05, -0.03, 0.08, 0.02, -0.06, 0.01][i], 2)} m³/h`,
    );
    setReading("camp-visits", String(168 + i * 3));
    setReading("sanitary-visits", String(214 + i * 4));
    // Shared services and the sea.
    setReading("pool", `${n(26.4 + [0, 0.1, 0.1, 0, -0.1, 0, 0.1][i], 1)} °C`);
    setReading(
      "pool-cl",
      `${n(0.6 - [0, 0.02, 0.03, 0.01, 0.04, 0.02, 0][i], 2)} mg/l`,
    );
    setReading(
      "haccp",
      `${n(3.6 + [0, 0.2, -0.1, 0.3, 0.1, -0.2, 0][i], 1)} °C`,
    );
    setReading("ev", `${n([11, 11, 7.4, 11, 3.7, 11, 7.4][i], 1)} kW`);
    setReading("buoy", `${n(19.4 + [0, 0.1, 0.1, 0, -0.1, -0.1, 0][i], 1)} °C`);
    setReading(
      "buoy-o2",
      `${n(7.6 + [0, 0.1, -0.1, 0.2, 0, -0.1, 0.1][i], 1)} mg/l`,
    );
    setReading("wind-hpa", `${1016 - [0, 0, 1, 1, 1, 2, 2][i]} hPa`);
    const peak = 196 + [0, 3, 8, 12, 6, 2, -4][i];
    setReading("kpi-peak", `${peak} kW`);
  },
  scenarios,
};

// Guided scenarios. `t(sl, en, de)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
  const kn = (v) => `${Math.round(v)} kn`;
  const sea = (v) => `+${n(v, 2)} m`;
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
          focus: { x: 380, y: 215, zoom: 1.7, radius: 0.22 },
          title: t("Senzor meri", "A sensor measures", "Ein Sensor misst"),
          text: t(
            "Senzor svetlobe LIGHT_02 na strehi hotela meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut.",
            "Light sensor LIGHT_02 on the hotel roof measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes.",
            "Der Lichtsensor LIGHT_02 auf dem Dach des Hotels misst das Tageslicht. In der Dämmerung fällt es unter 25 lx. Der Sensor läuft mit Batterie und meldet alle 5 Minuten.",
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
            "Meritev po radiu LoRaWAN potuje do prehoda GW_02. En prehod pokrije celo marino, zato noben senzor ne potrebuje kabla.",
            "The reading travels by LoRaWAN radio to gateway GW_02. One gateway covers the whole marina, so no sensor needs a cable.",
            "Der Messwert gelangt per LoRaWAN-Funk zum Gateway GW_02. Ein Gateway deckt die ganze Marina ab, sodass kein Sensor ein Kabel braucht.",
          ),
          run(api) {
            api.send("lux");
            api.log(
              t(
                "LIGHT_02 · Svetloba okolice pod 25 lx",
                "LIGHT_02 · Ambient light below 25 lx",
                "LIGHT_02 · Umgebungs\u00adlicht unter 25 lx",
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
                "GW_02 → Nexavia · meritev shranjena",
                "GW_02 → Nexavia · reading stored",
                "GW_02 → Nexavia · Messwert gespeichert",
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
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge luči na pomolih.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to light the piers first.",
            "Nexavia prüft jeden neuen Messwert anhand seiner Regeln. Licht unter 25 lx erfüllt die Beleuchtungsregel, also beschließt Nexavia, zuerst die Stege zu beleuchten.",
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
                "Pravilo svetloba < 25 lx izpolnjeno → vklop luči na pomolih",
                "Rule light < 25 lx met → pier lights on",
                "Regel Licht < 25 lx erfüllt → Stegleuchten ein",
              ),
              "19:53",
              "decision",
            );
          },
        },
        {
          time: "19:53",
          focus: VIEW.piers,
          title: t(
            "Ukaz gre nazaj",
            "A command goes back",
            "Ein Befehl geht zurück",
          ),
          text: t(
            "Nexavia prek prehoda pošlje ukaz vsaki luči na pomolih – rumeni paketi. Luči potrdijo in nadzorna plošča jih prikaže kot vklopljene.",
            "Nexavia sends a command back through the gateway to each pier light – the yellow packets. The lights confirm, and the dashboard shows them on.",
            "Nexavia schickt über das Gateway einen Befehl an jede Stegleuchte – die gelben Pakete. Die Leuchten bestätigen, und das Dashboard zeigt sie als eingeschaltet.",
          ),
          run(api) {
            PIERS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(api.$row("PIER_01"));
            api.log(
              t(
                "PIER_01–PIER_04 · Ukaz: vklop",
                "PIER_01–PIER_04 · Command: switch on",
                "PIER_01–PIER_04 · Befehl: einschalten",
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
      id: "bora",
      title: t("Burja v marini", "Bora in the marina", "Bora in der Marina"),
      setup(api) {
        api.setReading(
          "wind",
          "9 kn",
          t("Sunki 13 kn · SV", "Gusts 13 kn · NE", "Böen 13 kn · NO"),
        );
        api.setReading("wind-gust", "13 kn");
        api.setReading("wind-hpa", "1016 hPa");
        api.setReading("sea-waves", `${n(0.3, 1)} m`);
        PIERS.forEach((id) => api.setLevel(id, 0));
        api.setAlarms([]);
        api.pin("wind");
        api.narrate({
          rule: t(
            "Pravilo: sunki vetra > 30 kn",
            "Rule: wind gusts > 30 kn",
            "Regel: Windböen > 30 kn",
          ),
        });
      },
      steps: [
        {
          time: "18:40",
          focus: VIEW.wind,
          title: t("Miren večer", "A calm evening", "Ein ruhiger Abend"),
          text: t(
            "Vremenska postaja WIND_01 ob kapitaniji meri veter in sunke vsakih deset sekund.",
            "Weather station WIND_01 by the harbour office measures wind and gusts every ten seconds.",
            "Die Wetterstation WIND_01 am Hafenbüro misst Wind und Böen alle zehn Sekunden.",
          ),
          run(api) {
            api.spotlight(api.$reading("wind"));
          },
        },
        {
          time: "18:50",
          title: t("Tlak pada", "The pressure falls", "Der Luftdruck fällt"),
          text: t(
            "Zračni tlak v šestih urah pade za 8 hPa. KAI v tem vzorcu prepozna bližajočo se burjo in mornarje opozori, preden zapiha.",
            "Air pressure falls 8 hPa in six hours. KAI recognises the pattern of an approaching bora and warns the crew before it blows.",
            "Der Luftdruck fällt in sechs Stunden um 8 hPa. KAI erkennt das Muster einer aufziehenden Bora und warnt die Crew, bevor sie bläst.",
          ),
          run(api, play) {
            play.count("wind-hpa", 1016, 1008, (v) => `${Math.round(v)} hPa`);
            api.spotlight(api.$reading("kai-bora"));
            api.log(
              t(
                "WIND_01 · Tlak −8 hPa v 6 h → KAI: burja čez ~15 min",
                "WIND_01 · Pressure −8 hPa in 6 h → KAI: bora in ~15 min",
                "WIND_01 · Luftdruck −8 hPa in 6 h → KAI: Bora in ~15 min",
              ),
              "18:50",
              "decision",
            );
          },
        },
        {
          time: "19:05",
          title: t(
            "Burja se okrepi",
            "The bora picks up",
            "Die Bora frischt auf",
          ),
          text: t(
            "Veter s severovzhoda v pol ure naraste s 9 na 27 vozlov, valovi na vhodu v marino zrastejo na skoraj meter.",
            "The north-easterly wind rises from 9 to 27 knots in half an hour, and the waves at the harbour entrance grow to almost a metre.",
            "Der Nordostwind steigt in einer halben Stunde von 9 auf 27 Knoten, und die Wellen an der Hafeneinfahrt wachsen auf fast einen Meter.",
          ),
          run(api, play) {
            play.count(
              "wind",
              9,
              27,
              kn,
              t("Sunki 34 kn · SV", "Gusts 34 kn · NE", "Böen 34 kn · NO"),
            );
            api.setReading("wind-gust", "34 kn");
            api.setReading("sea-waves", `${n(0.9, 1)} m`);
            api.log(
              t(
                "WIND_01 · Veter 27 kn · sunki 34 kn",
                "WIND_01 · Wind 27 kn · gusts 34 kn",
                "WIND_01 · Wind 27 kn · Böen 34 kn",
              ),
              "19:05",
              "reading",
            );
          },
        },
        {
          time: "19:06",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Sunki presežejo 30 vozlov. Nexavia odpre alarm za celotno marino.",
            "Gusts pass 30 knots. Nexavia opens an alarm for the whole marina.",
            "Die Böen überschreiten 30 Knoten. Nexavia öffnet einen Alarm für die gesamte Marina.",
          ),
          run(api) {
            api.setReading(
              "wind",
              "27 kn",
              t("Sunki 41 kn · SV", "Gusts 41 kn · NE", "Böen 41 kn · NO"),
            );
            api.setReading("wind-gust", "41 kn");
            api.setAlarms([
              [
                "WIND_01",
                t(
                  "Sunki 41 kn · meja 30 kn",
                  "Gusts 41 kn · limit 30 kn",
                  "Böen 41 kn · Grenze 30 kn",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "WIND_01 · Alarm: močni sunki burje",
                "WIND_01 · Alarm: strong bora gusts",
                "WIND_01 · Alarm: starke Bora-Böen",
              ),
              "19:06",
              "alarm",
            );
          },
        },
        {
          time: "19:07",
          focus: VIEW.piers,
          title: t(
            "Opozorilo lastnikom plovil",
            "Boat owners are warned",
            "Die Bootseigner werden gewarnt",
          ),
          text: t(
            `Lastniki ${berths.occupied} privezanih plovil prejmejo SMS, naj preverijo privezne vrvi. Luči na pomolih se prižgejo za varen dostop.`,
            `The owners of the ${berths.occupied} moored boats get an SMS to check their mooring lines. The pier lights switch on for safe access.`,
            `Die Eigner der ${berths.occupied} festgemachten Boote erhalten eine SMS, ihre Festmacherleinen zu prüfen. Die Stegleuchten schalten sich für einen sicheren Zugang ein.`,
          ),
          run(api, play) {
            PIERS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(".twin-lamp-group");
            play.toast(
              t("Opozorilo: burja", "Warning: bora", "Warnung: Bora"),
              t(
                "Sunki 41 kn · preverite privezne vrvi",
                "Gusts 41 kn · check your mooring lines",
                "Böen 41 kn · Festmacherleinen prüfen",
              ),
              "19:07",
            );
            api.log(
              t(
                `PIER_01–PIER_04 · Varnostna razsvetljava · ${berths.occupied} SMS poslanih`,
                `PIER_01–PIER_04 · Safety lighting · ${berths.occupied} SMS sent`,
                `PIER_01–PIER_04 · Sicherheitsbeleuchtung · ${berths.occupied} SMS gesendet`,
              ),
              "19:07",
              "notify",
            );
          },
        },
        {
          time: "23:30",
          focus: VIEW.basin,
          title: t("Burja pojenja", "The bora eases", "Die Bora lässt nach"),
          text: t(
            "Veter pade pod mejo in alarm se samodejno zapre. Nobeno plovilo se ni odtrgalo s priveza.",
            "The wind drops below the limit and the alarm closes by itself. No boat broke loose from its berth.",
            "Der Wind fällt unter den Grenzwert und der Alarm schließt sich von selbst. Kein Boot hat sich von seinem Liegeplatz losgerissen.",
          ),
          run(api, play) {
            play.count(
              "wind",
              27,
              11,
              kn,
              t("Sunki 16 kn · SV", "Gusts 16 kn · NE", "Böen 16 kn · NO"),
            );
            api.setReading("wind-gust", "16 kn");
            api.setReading("sea-waves", `${n(0.4, 1)} m`);
            api.setAlarms([]);
            api.spotlight(api.$reading("wind"));
            api.log(
              t(
                "WIND_01 · Veter 11 kn · alarm zaprt",
                "WIND_01 · Wind 11 kn · alarm closed",
                "WIND_01 · Wind 11 kn · Alarm geschlossen",
              ),
              "23:30",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "high-tide",
      title: t("Visoka plima", "High tide", "Hochwasser"),
      setup(api) {
        api.setReading(
          "sea-level",
          sea(0.42),
          t("Normalno", "Normal", "Normal"),
        );
        api.setReading("shore-power", `${n(46.8, 1)} kWh`);
        api.setReading("cabinet-flood", t("Suho", "Dry", "Trocken"));
        api.setReading(
          "cabinet",
          t("Zaprta", "Closed", "Geschlossen"),
          t(
            "31 °C · suho · nagib 0°",
            "31 °C · dry · tilt 0°",
            "31 °C · trocken · Neigung 0°",
          ),
        );
        api.setAlarms([]);
        api.signal("pedestals", false);
        api.pin("sea-level");
        api.narrate({
          rule: t(
            "Pravilo: gladina morja > +0,70 m",
            "Rule: sea level > +0.70 m",
            "Regel: Meeresspiegel > +0,70 m",
          ),
        });
      },
      steps: [
        {
          time: "07:00",
          focus: VIEW.sea,
          title: t(
            "Običajna plima",
            "An ordinary tide",
            "Eine gewöhnliche Flut",
          ),
          text: t(
            "Senzor SEA_LEVEL_01 na obali meri gladino morja glede na srednjo vrednost.",
            "Sensor SEA_LEVEL_01 on the quay measures the sea level against its mean.",
            "Der Sensor SEA_LEVEL_01 an der Kaimauer misst den Meeresspiegel gegenüber dem Mittelwert.",
          ),
          run(api) {
            api.spotlight(api.$reading("sea-level"));
          },
        },
        {
          time: "09:20",
          title: t(
            "Jugo dviguje morje",
            "The sirocco raises the sea",
            "Der Scirocco hebt das Meer",
          ),
          text: t(
            "Z jugom in plimo se gladina dviga hitreje kot običajno.",
            "With the sirocco and the tide together, the level climbs faster than usual.",
            "Mit Scirocco und Flut zusammen steigt der Pegel schneller als üblich.",
          ),
          run(api, play) {
            play.count(
              "sea-level",
              0.42,
              0.63,
              sea,
              t("Narašča", "Rising", "Steigend"),
            );
            api.log(
              t(
                "SEA_LEVEL_01 · +0,63 m · narašča",
                "SEA_LEVEL_01 · +0.63 m · rising",
                "SEA_LEVEL_01 · +0,63 m · steigend",
              ),
              "09:20",
              "reading",
            );
          },
        },
        {
          time: "10:05",
          title: t(
            "Opozorilna gladina",
            "Warning level reached",
            "Warnpegel erreicht",
          ),
          text: t(
            "Gladina preseže +0,70 m. Morje se bliža robu obale in najnižjim priključkom.",
            "The level passes +0.70 m. The sea is nearing the quay edge and the lowest pedestals.",
            "Der Pegel überschreitet +0,70 m. Das Meer nähert sich der Kaikante und den niedrigsten Versorgungssäulen.",
          ),
          run(api, play) {
            play.count(
              "sea-level",
              0.63,
              0.78,
              sea,
              t("Opozorilna gladina", "Warning level", "Warnpegel"),
            );
            api.setAlarms([
              [
                "SEA_LEVEL_01",
                t(
                  "+0,78 m · nevarnost poplavljanja obale",
                  "+0.78 m · risk of quay flooding",
                  "+0,78 m · Gefahr der Kaiüberflutung",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "SEA_LEVEL_01 · Alarm: opozorilna gladina",
                "SEA_LEVEL_01 · Alarm: warning level",
                "SEA_LEVEL_01 · Alarm: Warnpegel",
              ),
              "10:05",
              "alarm",
            );
          },
        },
        {
          time: "10:06",
          focus: VIEW.shore,
          title: t(
            "Samodejni varnostni odklop",
            "Automatic safety cut-off",
            "Automatische Sicherheitsabschaltung",
          ),
          text: t(
            "Nexavia izklopi elektriko na šestih najnižjih priključkih pomola B, preden jih doseže morje. Mornarji prejmejo obvestilo.",
            "Nexavia switches off power at the six lowest pedestals on pier B before the sea reaches them. The marina crew is notified.",
            "Nexavia schaltet den Strom an den sechs niedrigsten Säulen von Steg B ab, bevor das Meer sie erreicht. Die Marina-Crew wird benachrichtigt.",
          ),
          run(api, play) {
            api.setAlarms([
              [
                "SEA_LEVEL_01",
                t(
                  "+0,78 m · nevarnost poplavljanja obale",
                  "+0.78 m · risk of quay flooding",
                  "+0,78 m · Gefahr der Kaiüberflutung",
                ),
              ],
              [
                "SHORE_POWER_B",
                t(
                  "Varnostni odklop · 6 priključkov",
                  "Safety cut-off · 6 pedestals",
                  "Sicherheitsabschaltung · 6 Säulen",
                ),
              ],
            ]);
            api.pin("shore-power");
            api.signal("pedestals", true);
            api.spotlight(api.$reading("shore-power"));
            play.toast(
              t("Visoka plima", "High tide", "Hochwasser"),
              t(
                "+0,78 m · izklopljenih 6 priključkov",
                "+0.78 m · 6 pedestals switched off",
                "+0,78 m · 6 Säulen abgeschaltet",
              ),
              "10:06",
            );
            api.log(
              t(
                "SHORE_POWER_B · Varnostni odklop 6 priključkov",
                "SHORE_POWER_B · 6 pedestals cut off",
                "SHORE_POWER_B · 6 Säulen abgeschaltet",
              ),
              "10:06",
              "command",
            );
          },
        },
        {
          time: "10:40",
          focus: VIEW.cabinet,
          title: t(
            "Voda v omarici",
            "Water in a cabinet",
            "Wasser in einem Schrank",
          ),
          text: t(
            "Val pljuskne čez pomol B1. Senzor v razdelilni omarici zazna vodo na dnu – omarica se javi sama in ostane izklopljena, dokler je električar ne pregleda.",
            "A wave washes over pier B1. The sensor in its cabinet detects water at the bottom – the cabinet reports itself and stays off until an electrician has checked it.",
            "Eine Welle schwappt über Steg B1. Der Sensor in seinem Schrank erkennt Wasser am Boden – der Schrank meldet sich selbst und bleibt aus, bis ein Elektriker ihn geprüft hat.",
          ),
          run(api, play) {
            api.setReading(
              "cabinet-flood",
              t("Voda 4 cm", "Water 4 cm", "Wasser 4 cm"),
            );
            api.setReading(
              "cabinet",
              t("Zaprta", "Closed", "Geschlossen"),
              t(
                "voda 4 cm · izklopljena",
                "water 4 cm · switched off",
                "Wasser 4 cm · abgeschaltet",
              ),
            );
            api.setAlarms([
              [
                "SEA_LEVEL_01",
                t(
                  "+0,78 m · nevarnost poplavljanja obale",
                  "+0.78 m · risk of quay flooding",
                  "+0,78 m · Gefahr der Kaiüberflutung",
                ),
              ],
              [
                "CABINET_B1",
                t(
                  "Voda v omarici · izklopljena",
                  "Water in the cabinet · switched off",
                  "Wasser im Schrank · abgeschaltet",
                ),
              ],
            ]);
            api.pin("cabinet");
            api.spotlight(api.$reading("cabinet"));
            play.toast(
              t(
                "Voda v omarici B1",
                "Water in cabinet B1",
                "Wasser im Schrank B1",
              ),
              t(
                "Omarica izklopljena · pregled električarja",
                "Cabinet switched off · electrician to check",
                "Schrank abgeschaltet · Prüfung durch Elektriker",
              ),
              "10:40",
            );
            api.log(
              t(
                "CABINET_B1 · Voda 4 cm → omarica izklopljena",
                "CABINET_B1 · Water 4 cm → cabinet switched off",
                "CABINET_B1 · Wasser 4 cm → Schrank abgeschaltet",
              ),
              "10:40",
              "alarm",
            );
          },
        },
        {
          time: "13:30",
          focus: VIEW.sea,
          title: t("Morje upada", "The sea recedes", "Das Meer geht zurück"),
          text: t(
            "Gladina pade pod mejo, priključki se ponovno vklopijo in alarmi se zaprejo. Omarica B1 je osušena in pregledana. Dogodek ostane v zgodovini.",
            "The level falls below the limit, the pedestals switch back on and the alarms close. Cabinet B1 has been dried and checked. The event stays in the history.",
            "Der Pegel fällt unter den Grenzwert, die Säulen schalten sich wieder ein und die Alarme schließen sich. Schrank B1 wurde getrocknet und geprüft. Das Ereignis bleibt in der Historie.",
          ),
          run(api, play) {
            play.count(
              "sea-level",
              0.78,
              0.51,
              sea,
              t("Upada", "Falling", "Fallend"),
            );
            api.setReading("cabinet-flood", t("Suho", "Dry", "Trocken"));
            api.setReading(
              "cabinet",
              t("Zaprta", "Closed", "Geschlossen"),
              t(
                "31 °C · suho · nagib 0°",
                "31 °C · dry · tilt 0°",
                "31 °C · trocken · Neigung 0°",
              ),
            );
            api.setAlarms([]);
            api.signal("pedestals", false);
            api.pin("sea-level");
            api.spotlight(api.$reading("sea-level"));
            api.log(
              t(
                "SEA_LEVEL_01 · +0,51 m · priključki ponovno vklopljeni",
                "SEA_LEVEL_01 · +0.51 m · pedestals back on",
                "SEA_LEVEL_01 · +0,51 m · Säulen wieder eingeschaltet",
              ),
              "13:30",
              "command",
            );
          },
        },
      ],
    },
    {
      id: "leak",
      title: t(
        "Puščanje v sanitarijah",
        "Leak in the sanitary block",
        "Leck im Sanitärblock",
      ),
      setup(api) {
        api.setLevel("SANITARY_01", 0);
        PIERS.forEach((id) => api.setLevel(id, 1));
        api.setReading("sanitary-water", `${n(0, 2)} m³/h`);
        api.setAlarms([]);
        api.pin("sanitary-water");
        api.narrate({
          rule: t(
            "Pravilo: nočni pretok > 0,2 m³/h dlje kot 20 min",
            "Rule: night flow > 0.2 m³/h for over 20 min",
            "Regel: Nachtdurchfluss > 0,2 m³/h länger als 20 min",
          ),
        });
      },
      steps: [
        {
          time: "01:30",
          focus: VIEW.sanitary,
          title: t(
            "Noč v marini",
            "Night in the marina",
            "Nacht in der Marina",
          ),
          text: t(
            "Sanitarni blok je zaklenjen, luči so ugasnjene. Ponoči je pretok vode nič.",
            "The sanitary block is locked and dark. At night, water flow is zero.",
            "Der Sanitärblock ist abgeschlossen und dunkel. Nachts ist der Wasserdurchfluss null.",
          ),
          run(api) {
            api.spotlight(api.$reading("sanitary-water"));
          },
        },
        {
          time: "01:42",
          title: t(
            "Voda začne teči",
            "Water starts flowing",
            "Wasser beginnt zu fließen",
          ),
          text: t(
            "Vodomer SANITARY_WATER_01 zazna stalen pretok, čeprav v sanitarijah ni nikogar.",
            "Meter SANITARY_WATER_01 detects a steady flow although nobody is inside.",
            "Der Zähler SANITARY_WATER_01 erkennt einen stetigen Durchfluss, obwohl niemand drinnen ist.",
          ),
          run(api, play) {
            play.count("sanitary-water", 0, 0.46, (v) => `${n(v, 2)} m³/h`);
            api.log(
              t(
                "SANITARY_WATER_01 · Nočni pretok 0,46 m³/h",
                "SANITARY_WATER_01 · Night flow 0.46 m³/h",
                "SANITARY_WATER_01 · Nachtdurchfluss 0,46 m³/h",
              ),
              "01:42",
              "reading",
            );
          },
        },
        {
          time: "02:02",
          title: t(
            "Pravilo sproži alarm",
            "The rule raises an alarm",
            "Die Regel löst einen Alarm aus",
          ),
          text: t(
            "Po 20 minutah neprekinjenega pretoka Nexavia prepozna sum puščanja.",
            "After 20 minutes of uninterrupted flow, Nexavia recognises a suspected leak.",
            "Nach 20 Minuten ununterbrochenem Durchfluss erkennt Nexavia einen Leckageverdacht.",
          ),
          run(api) {
            api.setReading("sanitary-water", `${n(0.46, 2)} m³/h`);
            api.setAlarms([
              [
                "SANITARY_WATER_01",
                t(
                  "Sum puščanja · 20 min",
                  "Suspected leak · 20 min",
                  "Leckageverdacht · 20 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "SANITARY_WATER_01 · Alarm: sum puščanja",
                "SANITARY_WATER_01 · Alarm: suspected leak",
                "SANITARY_WATER_01 · Alarm: Leckageverdacht",
              ),
              "02:02",
              "alarm",
            );
          },
        },
        {
          time: "02:03",
          title: t(
            "Nočni čuvaj obveščen",
            "The night guard is alerted",
            "Der Nachtwächter wird alarmiert",
          ),
          text: t(
            "Čuvaj prejme obvestilo, razsvetljava sanitarij se prižge, da lahko hitro preveri stanje.",
            "The night guard gets a notification and the sanitary block lights come on so the fault can be checked quickly.",
            "Der Nachtwächter erhält eine Benachrichtigung, und das Licht im Sanitärblock geht an, damit der Fehler schnell geprüft werden kann.",
          ),
          run(api, play) {
            api.setLevel("SANITARY_01", 1);
            api.spotlight(api.$row("SANITARY_01"));
            play.toast(
              t(
                "Sum puščanja vode",
                "Suspected water leak",
                "Verdacht auf Wasserleck",
              ),
              t(
                "Sanitarije · 0,46 m³/h že 20 min",
                "Sanitary block · 0.46 m³/h for 20 min",
                "Sanitärblock · 0,46 m³/h seit 20 min",
              ),
              "02:03",
            );
            api.log(
              t(
                "SANITARY_01 · Razsvetljava vklopljena za čuvaja",
                "SANITARY_01 · Lights on for the night guard",
                "SANITARY_01 · Licht für den Nachtwächter eingeschaltet",
              ),
              "02:03",
              "command",
            );
          },
        },
        {
          time: "02:15",
          title: t("Puščanje ustavljeno", "Leak stopped", "Leck gestoppt"),
          text: t(
            "Pokvarjen kotliček je zaprt, pretok pade na nič in alarm se zapre. Do jutra bi odteklo 3 m³ vode.",
            "The faulty cistern is shut off, flow drops to zero and the alarm closes. By morning 3 m³ of water would have run away.",
            "Der defekte Spülkasten wird abgesperrt, der Durchfluss sinkt auf null und der Alarm schließt sich. Bis zum Morgen wären 3 m³ Wasser verloren gegangen.",
          ),
          run(api, play) {
            play.count("sanitary-water", 0.46, 0, (v) => `${n(v, 2)} m³/h`);
            api.setAlarms([]);
            api.setLevel("SANITARY_01", 0);
            api.spotlight(api.$reading("sanitary-water"));
            api.log(
              t(
                "SANITARY_WATER_01 · Pretok ustavljen · alarm zaprt",
                "SANITARY_WATER_01 · Flow stopped · alarm closed",
                "SANITARY_WATER_01 · Durchfluss gestoppt · Alarm geschlossen",
              ),
              "02:15",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "arrival",
      title: t("Prihod plovila", "A boat arrives", "Ein Boot kommt an"),
      setup(api) {
        api.setReading("berths", ...occupied(-1));
        api.setReading("parking", ...freeSpaces());
        api.setReading("pedestal-b", socketOff(t));
        api.setReading("pedestal-b-kwh", `${n(0, 1)} kWh`);
        api.setReading(
          "pedestal-b-guest",
          t(
            "Rezervirano · K. Horvat",
            "Booked · K. Horvat",
            "Gebucht · K. Horvat",
          ),
        );
        api.setAlarms([]);
        api.pin("berths");
        api.narrate({
          rule: t(
            "Pravilo: kartica gosta → vklop le njegove vtičnice",
            "Rule: guest's card → only their socket switches on",
            "Regel: Karte des Gastes → nur seine Steckdose schaltet ein",
          ),
        });
      },
      steps: [
        {
          time: "16:10",
          focus: VIEW.piers,
          title: t("Rezervacija priveza", "Berth booked", "Liegeplatz gebucht"),
          text: t(
            "Gost prek aplikacije rezervira privez za dve noči. Nexavia mu dodeli prost privez B-06, vtičnica pa ostane izklopljena, dokler ne pride.",
            "A guest books a berth for two nights in the app. Nexavia assigns free berth B-06, and its socket stays off until they arrive.",
            "Ein Gast bucht in der App einen Liegeplatz für zwei Nächte. Nexavia weist ihm den freien Liegeplatz B-06 zu, und dessen Steckdose bleibt aus, bis er ankommt.",
          ),
          run(api) {
            api.spotlight(api.$reading("pms-marina"));
            api.log(
              t(
                "PMS_MARINA · B-06 rezerviran · 2 noči",
                "PMS_MARINA · B-06 booked · 2 nights",
                "PMS_MARINA · B-06 gebucht · 2 Nächte",
              ),
              "16:10",
              "system",
            );
          },
        },
        {
          time: "16:48",
          focus: VIEW.parking,
          title: t("Posadka parkira", "The crew parks", "Die Crew parkt"),
          text: t(
            "Del posadke pripelje z avtom. Senzor na parkirišču zazna zasedeno mesto.",
            "Part of the crew arrives by car. The car park sensor detects the occupied space.",
            "Ein Teil der Crew kommt mit dem Auto. Der Parkplatzsensor erkennt den belegten Platz.",
          ),
          run(api) {
            api.setReading("parking", ...freeSpaces(-1));
            api.pin("parking");
            api.spotlight(api.$reading("parking"));
            api.log(
              t(
                `PARKING_01 · Prostih mest: ${freeSpaces(-1)[2]}`,
                `PARKING_01 · Free spaces: ${freeSpaces(-1)[2]}`,
                `PARKING_01 · Freie Plätze: ${freeSpaces(-1)[2]}`,
              ),
              "16:48",
              "reading",
            );
          },
        },
        {
          time: "17:05",
          focus: VIEW.berthB,
          title: t(
            "Plovilo na privezu",
            "Boat on its berth",
            "Boot am Liegeplatz",
          ),
          text: t(
            "Senzor zasedenosti na privezu B-06 zazna plovilo Galeb. Zasedenost marine se osveži v realnem času.",
            "The occupancy sensor on berth B-06 detects the boat Galeb. Marina occupancy updates in real time.",
            "Der Belegungssensor am Liegeplatz B-06 erkennt das Boot Galeb. Die Belegung der Marina wird in Echtzeit aktualisiert.",
          ),
          run(api) {
            api.setReading("berths", ...occupied());
            api.pin("berths");
            api.spotlight(api.$reading("berths"));
            api.log(
              t(
                "BERTH_OCC_A · B-06 zaseden",
                "BERTH_OCC_A · B-06 occupied",
                "BERTH_OCC_A · B-06 belegt",
              ),
              "17:05",
              "reading",
            );
          },
        },
        {
          time: "17:12",
          title: t(
            "Kartica NFC na omarici",
            "NFC card at the pedestal",
            "NFC-Karte an der Säule",
          ),
          text: t(
            "Skiper prisloni kartico na omarico B-06. Nexavia preveri rezervacijo in vklopi le njegovo vtičnico – elektrika in voda se od zdaj štejeta na njegov privez.",
            "The skipper taps their card on pedestal B-06. Nexavia checks the booking and switches on only their socket – power and water now count to their berth.",
            "Der Skipper hält seine Karte an die Säule B-06. Nexavia prüft die Buchung und schaltet nur seine Steckdose ein – Strom und Wasser werden ab jetzt auf seinen Liegeplatz gezählt.",
          ),
          run(api, play) {
            api.setReading("pedestal-b-guest", "K. Horvat ✓");
            api.setReading("pedestal-b", socket(t, n, 1.6));
            play.count("pedestal-b-kwh", 0, 0.4, (v) => `${n(v, 1)} kWh`);
            api.pin("pedestal-b");
            api.spotlight(api.$reading("pedestal-b"));
            api.log(
              t(
                "PEDESTAL_B06 · Kartica K. Horvat ✓ → vtičnica vklopljena",
                "PEDESTAL_B06 · K. Horvat's card ✓ → socket switched on",
                "PEDESTAL_B06 · Karte K. Horvat ✓ → Steckdose eingeschaltet",
              ),
              "17:12",
              "command",
            );
          },
        },
        {
          time: "09:30",
          focus: VIEW.basin,
          title: t(
            "Odhod in račun",
            "Departure and invoice",
            "Abreise und Rechnung",
          ),
          text: t(
            "Po dveh nočeh plovilo odpluje. Vtičnica se izklopi, gost pa prejme en račun za privez, elektriko in vodo – brez ročnega odčitavanja.",
            "After two nights the boat leaves. The socket switches off, and the guest gets one invoice for the berth, power and water – no manual readings.",
            "Nach zwei Nächten legt das Boot ab. Die Steckdose schaltet sich aus, und der Gast erhält eine Rechnung für Liegeplatz, Strom und Wasser – ohne manuelle Ablesung.",
          ),
          run(api, play) {
            api.setReading("pedestal-b", socketOff(t));
            api.setReading("pedestal-b-kwh", `${n(12.8, 1)} kWh`);
            api.setReading("berths", ...occupied(-1));
            api.setReading("parking", ...freeSpaces());
            api.pin("pedestal-b");
            play.toast(
              t(
                "Račun za privez B-06",
                "Invoice for berth B-06",
                "Rechnung für Liegeplatz B-06",
              ),
              t(
                "2 noči · 12,8 kWh · 0,6 m³ vode",
                "2 nights · 12.8 kWh · 0.6 m³ water",
                "2 Nächte · 12,8 kWh · 0,6 m³ Wasser",
              ),
              "09:30",
            );
            api.log(
              t(
                "PEDESTAL_B06 · Vtičnica izklopljena · račun poslan v PMS",
                "PEDESTAL_B06 · Socket off · invoice sent to the PMS",
                "PEDESTAL_B06 · Steckdose aus · Rechnung an das PMS gesendet",
              ),
              "09:30",
              "notify",
            );
          },
        },
      ],
    },
    {
      // The reception's booking system switches a mobile home on.
      id: "check-in",
      title: t(
        "Družina se prijavi v kamp",
        "A family checks in at the camp",
        "Eine Familie checkt auf dem Campingplatz ein",
      ),
      setup(api) {
        api.setLevel("MOBILE_HOME_01", 0);
        api.setReading("mobile-home", `${n(29.8, 1)} °C`);
        api.setReading("mh-ac", `${n(0, 1)} kW`);
        api.setReading("mh-window", t("Zaprto", "Closed", "Geschlossen"));
        api.setReading("pms-camp", "20 / 24");
        api.setReading("kpi-camp", "20 / 24");
        api.setReading("pms-camp-in", "4");
        api.setAlarms([]);
        api.pin("pms-camp");
        api.narrate({
          rule: t(
            "Pravilo: prijava v PMS → vklop enote · okno odprto → klima stoji",
            "Rule: check-in in the PMS → unit on · window open → AC stops",
            "Regel: Check-in im PMS → Einheit ein · Fenster offen → Klima stoppt",
          ),
        });
      },
      steps: [
        {
          time: "13:50",
          focus: VIEW.reception,
          title: t(
            "Rezervacija za danes",
            "A booking for today",
            "Eine Buchung für heute",
          ),
          text: t(
            "Družina Rossi ima za danes rezervirano mobilno hišico MH-01. Hišica je prazna in izklopljena, v njej je 29,8 °C.",
            "The Rossi family has mobile home MH-01 booked for today. It is empty and switched off, and 29.8 °C inside.",
            "Familie Rossi hat für heute das Mobilheim MH-01 gebucht. Es ist leer und ausgeschaltet, drinnen hat es 29,8 °C.",
          ),
          run(api) {
            api.spotlight(api.$reading("pms-camp"));
            api.log(
              t(
                "PMS_CAMP · MH-01 · prihod Rossi ob 15:00",
                "PMS_CAMP · MH-01 · Rossi arriving at 15:00",
                "PMS_CAMP · MH-01 · Ankunft Rossi um 15:00",
              ),
              "13:50",
              "system",
            );
          },
        },
        {
          time: "14:00",
          focus: VIEW.home,
          title: t("Predhlajenje", "Pre-cooling", "Vorkühlung"),
          text: t(
            "Uro pred prihodom Nexavia vklopi klimo v hišici. Ko gostje vstopijo, je notri prijetnih 24 °C – in klima ni tekla cel dan.",
            "An hour before arrival, Nexavia switches on the AC. When the guests walk in it is a pleasant 24 °C inside – and the AC has not run all day.",
            "Eine Stunde vor der Ankunft schaltet Nexavia die Klimaanlage ein. Als die Gäste eintreten, sind es angenehme 24 °C – und die Klimaanlage lief nicht den ganzen Tag.",
          ),
          run(api, play) {
            api.setReading("mh-ac", `${n(1.2, 1)} kW`);
            play.count("mobile-home", 29.8, 24.4, (v) => `${n(v, 1)} °C`);
            api.pin("mobile-home");
            api.log(
              t(
                "MH_01 · Ukaz: klima vklopljena · cilj 24 °C",
                "MH_01 · Command: AC on · target 24 °C",
                "MH_01 · Befehl: Klima ein · Ziel 24 °C",
              ),
              "14:00",
              "command",
            );
          },
        },
        {
          time: "15:02",
          focus: VIEW.reception,
          title: t(
            "Prijava na recepciji",
            "Check-in at the reception",
            "Check-in an der Rezeption",
          ),
          text: t(
            "Družina se prijavi, zapornica jih spusti noter. Recepcija potrdi prijavo v PMS, ki o tem obvesti Nexavio.",
            "The family checks in and the barrier lets them in. The reception confirms the check-in in the PMS, which tells Nexavia.",
            "Die Familie checkt ein und die Schranke lässt sie hinein. Die Rezeption bestätigt den Check-in im PMS, das Nexavia darüber informiert.",
          ),
          run(api, play) {
            api.setReading("pms-camp", "21 / 24");
            api.setReading("kpi-camp", "21 / 24");
            api.setReading("pms-camp-in", "5");
            api.pin("pms-camp");
            api.spotlight(api.$ui("kpi-camp")?.parentElement);
            play.toast(
              t("Prijava · MH-01", "Check-in · MH-01", "Check-in · MH-01"),
              t(
                "Družina Rossi · 5 noči",
                "Rossi family · 5 nights",
                "Familie Rossi · 5 Nächte",
              ),
              "15:02",
            );
            api.log(
              t(
                "PMS_CAMP · Prijava MH-01 · družina Rossi",
                "PMS_CAMP · Check-in MH-01 · Rossi family",
                "PMS_CAMP · Check-in MH-01 · Familie Rossi",
              ),
              "15:02",
              "system",
            );
          },
        },
        {
          time: "15:03",
          focus: VIEW.home,
          title: t(
            "Hišica se vklopi",
            "The mobile home switches on",
            "Das Mobilheim schaltet sich ein",
          ),
          text: t(
            "Nexavia prek prehoda pošlje ukaz hišici MH-01: elektrika, topla voda in razsvetljava se vklopijo. Poraba se od zdaj šteje na rezervacijo.",
            "Nexavia sends a command through the gateway to MH-01: power, hot water and lights come on. From now on the use counts to the booking.",
            "Nexavia schickt über das Gateway einen Befehl an MH-01: Strom, Warmwasser und Licht gehen an. Ab jetzt wird der Verbrauch auf die Buchung gezählt.",
          ),
          run(api) {
            api.setLevel("MOBILE_HOME_01", 1);
            api.spotlight(api.$row("MOBILE_HOME_01"));
            api.log(
              t(
                "MOBILE_HOME_01 · Ukaz: vklop po prijavi",
                "MOBILE_HOME_01 · Command: on after check-in",
                "MOBILE_HOME_01 · Befehl: ein nach Check-in",
              ),
              "15:03",
              "command",
            );
          },
        },
        {
          time: "15:40",
          title: t(
            "Okno ostane odprto",
            "A window is left open",
            "Ein Fenster bleibt offen",
          ),
          text: t(
            "Otroci odprejo okno, klima pa še teče. Po desetih minutah Nexavia klimo ustavi in gostom pošlje obvestilo.",
            "The children open a window while the AC is still running. After ten minutes Nexavia stops the AC and sends the guests a message.",
            "Die Kinder öffnen ein Fenster, während die Klimaanlage noch läuft. Nach zehn Minuten stoppt Nexavia die Klimaanlage und schickt den Gästen eine Nachricht.",
          ),
          run(api, play) {
            api.setReading("mh-window", t("Odprto", "Open", "Offen"));
            api.setReading("mh-ac", `${n(0, 1)} kW`);
            api.pin("mobile-home");
            play.toast(
              t(
                "MH-01 · okno je odprto",
                "MH-01 · a window is open",
                "MH-01 · ein Fenster ist offen",
              ),
              t(
                "Klima je ustavljena, dokler okno ni zaprto",
                "The AC is paused until the window is closed",
                "Die Klimaanlage pausiert, bis das Fenster geschlossen ist",
              ),
              "15:40",
            );
            api.log(
              t(
                "MH_01 · Okno odprto 10 min → klima ustavljena",
                "MH_01 · Window open 10 min → AC paused",
                "MH_01 · Fenster 10 min offen → Klima pausiert",
              ),
              "15:40",
              "decision",
            );
          },
        },
        {
          time: "15:55",
          title: t(
            "Klima nadaljuje",
            "The AC resumes",
            "Die Klimaanlage läuft wieder",
          ),
          text: t(
            "Ko je okno zaprto, se klima sama spet vklopi. Do odhoda hišica porabi tretjino manj kot brez samodejnega upravljanja.",
            "Once the window is closed, the AC comes back by itself. By departure the home uses a third less than without automatic control.",
            "Sobald das Fenster geschlossen ist, schaltet sich die Klimaanlage von selbst wieder ein. Bis zur Abreise verbraucht das Mobilheim ein Drittel weniger als ohne automatische Steuerung.",
          ),
          run(api) {
            api.setReading("mh-window", t("Zaprto", "Closed", "Geschlossen"));
            api.setReading("mh-ac", `${n(0.9, 1)} kW`);
            api.spotlight(api.$reading("mobile-home"));
            api.log(
              t(
                "MH_01 · Okno zaprto → klima vklopljena",
                "MH_01 · Window closed → AC on",
                "MH_01 · Fenster zu → Klima ein",
              ),
              "15:55",
              "command",
            );
          },
        },
      ],
    },
    {
      // Check-out: the final readings go to billing without anyone reading a meter.
      id: "check-out",
      title: t(
        "Odjava in samodejni račun",
        "Check-out and the automatic bill",
        "Check-out und die automatische Rechnung",
      ),
      setup(api) {
        api.setReading("camp-pedestal", socket(t, n, 1.4));
        api.setReading("camp-pedestal-kwh", `${n(6.2, 1)} kWh`);
        api.setReading(
          "camp-pedestal-guest",
          t(
            "6 noči · do danes",
            "6 nights · until today",
            "6 Nächte · bis heute",
          ),
        );
        api.setReading("pms-camp", "21 / 24");
        api.setReading("kpi-camp", "21 / 24");
        api.setReading(
          "bill-2",
          "–",
          t("odjava ob 11:00", "checks out at 11:00", "Check-out um 11:00"),
        );
        api.setAlarms([]);
        api.pin("camp-pedestal");
        api.narrate({
          rule: t(
            "Pravilo: odjava v PMS → končna poraba v obračun · vtičnica izklop",
            "Rule: check-out in the PMS → final use to billing · socket off",
            "Regel: Check-out im PMS → Endverbrauch an die Abrechnung · Steckdose aus",
          ),
        });
      },
      steps: [
        {
          time: "10:30",
          focus: VIEW.pitch,
          title: t("Zadnje jutro", "The last morning", "Der letzte Morgen"),
          text: t(
            "Družina Novak po šestih nočeh pospravlja parcelo 07. Števec na priključku je ves teden štel elektriko, vodomer vodo.",
            "After six nights the Novak family is packing up on pitch 07. All week the hook-up has metered electricity, and the water meter water.",
            "Nach sechs Nächten packt Familie Novak auf Stellplatz 07 zusammen. Die ganze Woche hat der Anschluss den Strom gemessen und der Wasserzähler das Wasser.",
          ),
          run(api) {
            api.spotlight(api.$reading("camp-pedestal"));
          },
        },
        {
          time: "11:02",
          focus: VIEW.reception,
          title: t(
            "Odjava na recepciji",
            "Check-out at the reception",
            "Check-out an der Rezeption",
          ),
          text: t(
            "Recepcija potrdi odjavo v PMS. Nexavia v istem trenutku prebere končno stanje števcev parcele: 38,9 kWh in 1,92 m³.",
            "The reception confirms the check-out in the PMS. Nexavia reads the pitch's final meter values at the same moment: 38.9 kWh and 1.92 m³.",
            "Die Rezeption bestätigt den Check-out im PMS. Im selben Moment liest Nexavia die Endstände des Stellplatzes: 38,9 kWh und 1,92 m³.",
          ),
          run(api) {
            api.setReading("pms-camp", "20 / 24");
            api.setReading("kpi-camp", "20 / 24");
            api.pin("pms-camp");
            api.log(
              t(
                "PITCH_07 · Končno stanje 38,9 kWh · 1,92 m³",
                "PITCH_07 · Final reading 38.9 kWh · 1.92 m³",
                "PITCH_07 · Endstand 38,9 kWh · 1,92 m³",
              ),
              "11:02",
              "reading",
            );
          },
        },
        {
          time: "11:03",
          focus: VIEW.pitch,
          title: t(
            "Vtičnica se izklopi",
            "The socket switches off",
            "Die Steckdose schaltet sich aus",
          ),
          text: t(
            "Brez rezervacije parcela nima elektrike: Nexavia prek prehoda izklopi vtičnico, da je nihče ne uporablja na račun kampa.",
            "Without a booking a pitch has no power: Nexavia switches the socket off through the gateway so nobody uses it on the camp's bill.",
            "Ohne Buchung hat ein Stellplatz keinen Strom: Nexavia schaltet die Steckdose über das Gateway ab, damit niemand sie auf Kosten des Campingplatzes nutzt.",
          ),
          run(api) {
            api.setReading("camp-pedestal", socketOff(t));
            api.pin("camp-pedestal");
            api.log(
              t(
                "PITCH_07 · Ukaz: izklop vtičnice po odjavi",
                "PITCH_07 · Command: socket off after check-out",
                "PITCH_07 · Befehl: Steckdose aus nach Check-out",
              ),
              "11:03",
              "command",
            );
          },
        },
        {
          time: "11:03",
          title: t("Račun v PMS", "The bill in the PMS", "Die Rechnung im PMS"),
          text: t(
            "Poraba gre neposredno v PMS in na račun gosta. Nihče ni hodil od parcele do parcele s svinčnikom.",
            "The use goes straight into the PMS and onto the guest's bill. Nobody walked from pitch to pitch with a pencil.",
            "Der Verbrauch geht direkt ins PMS und auf die Rechnung des Gastes. Niemand ist mit dem Bleistift von Stellplatz zu Stellplatz gelaufen.",
          ),
          run(api, play) {
            api.setReading(
              "bill-2",
              `${n(38.9, 1)} kWh`,
              t(
                "1,92 m³ · poslano v PMS",
                "1.92 m³ · sent to the PMS",
                "1,92 m³ · an das PMS gesendet",
              ),
            );
            api.spotlight(api.$reading("bill-2"));
            play.toast(
              t(
                "Račun · parcela 07",
                "Invoice · pitch 07",
                "Rechnung · Stellplatz 07",
              ),
              t(
                "6 noči · 38,9 kWh · 1,92 m³",
                "6 nights · 38.9 kWh · 1.92 m³",
                "6 Nächte · 38,9 kWh · 1,92 m³",
              ),
              "11:03",
            );
            api.log(
              t(
                "PMS_CAMP · Račun parcele 07 poslan",
                "PMS_CAMP · Pitch 07 invoice sent",
                "PMS_CAMP · Rechnung Stellplatz 07 gesendet",
              ),
              "11:03",
              "notify",
            );
          },
        },
        {
          time: "11:20",
          title: t(
            "Pripravljeno za naslednje",
            "Ready for the next guests",
            "Bereit für die nächsten Gäste",
          ),
          text: t(
            "Čistilna ekipa dobi nalog za parcelo 07. Ko jo ob 15:00 prevzamejo novi gostje, se vtičnica ob prijavi spet vklopi.",
            "The cleaning crew gets a job for pitch 07. When new guests take it at 15:00, the socket switches on again at check-in.",
            "Das Reinigungsteam erhält einen Auftrag für Stellplatz 07. Wenn neue Gäste ihn um 15:00 übernehmen, schaltet sich die Steckdose beim Check-in wieder ein.",
          ),
          run(api) {
            api.spotlight(api.$reading("pms-camp"));
            api.log(
              t(
                "PITCH_07 · Nalog za čiščenje · prosta od 15:00",
                "PITCH_07 · Cleaning job · free from 15:00",
                "PITCH_07 · Reinigungsauftrag · frei ab 15:00",
              ),
              "11:20",
              "notify",
            );
          },
        },
      ],
    },
    {
      // KAI keeps the whole site under its contracted power.
      id: "peak",
      title: t("Večerna konica", "The evening peak", "Die Abendspitze"),
      setup(api) {
        api.setReading("kpi-peak", "196 kW");
        api.setReading("shore-kw", `${n(18.4, 1)} kW`);
        api.setReading("camp-feeder", "68 kW");
        api.setReading("ev", `${n(11, 1)} kW`);
        api.setReading("camp-hot", "58 °C");
        api.setAlarms([]);
        api.pin("shore-power");
        api.narrate({
          rule: t(
            "Pravilo: konica ostane pod pogodbenimi 250 kW",
            "Rule: the peak stays under the contracted 250 kW",
            "Regel: Die Spitze bleibt unter den vertraglichen 250 kW",
          ),
        });
      },
      steps: [
        {
          time: "16:30",
          focus: VIEW.quays,
          title: t(
            "Vroče popoldne",
            "A hot afternoon",
            "Ein heißer Nachmittag",
          ),
          text: t(
            `${berths.occupied} jaht na privezih in 21 zasedenih enot v kampu. Marina in kamp skupaj vlečeta 196 kW od pogodbenih 250 kW.`,
            `${berths.occupied} yachts on their berths and 21 camp units in use. The marina and camp together draw 196 kW of the contracted 250 kW.`,
            `${berths.occupied} Yachten an ihren Liegeplätzen und 21 belegte Einheiten auf dem Campingplatz. Marina und Campingplatz ziehen zusammen 196 kW der vertraglichen 250 kW.`,
          ),
          run(api) {
            api.spotlight(api.$ui("kpi-peak")?.parentElement);
          },
        },
        {
          time: "17:00",
          title: t(
            "KAI napove konico",
            "KAI forecasts the peak",
            "KAI prognostiziert die Spitze",
          ),
          text: t(
            "Ko se gostje vrnejo s plaže, vsi hkrati vklopijo klime. KAI iz zgodovine napove 262 kW ob 19:00 – nad pogodbo in s kaznijo.",
            "When the guests come back from the beach, everyone turns on the AC at once. From history KAI forecasts 262 kW at 19:00 – above the contract, with a penalty.",
            "Wenn die Gäste vom Strand zurückkommen, schalten alle gleichzeitig die Klimaanlage ein. Aus der Historie prognostiziert KAI 262 kW um 19:00 – über dem Vertrag, mit Strafzahlung.",
          ),
          run(api) {
            api.spotlight(api.$reading("kai-peak"));
            api.log(
              t(
                "KAI · Napoved 262 kW ob 19:00 > 250 kW",
                "KAI · Forecast 262 kW at 19:00 > 250 kW",
                "KAI · Prognose 262 kW um 19:00 > 250 kW",
              ),
              "17:00",
              "decision",
            );
          },
        },
        {
          time: "17:30",
          focus: VIEW.camp,
          title: t(
            "Predhlajenje in bojlerji",
            "Pre-cooling and boilers",
            "Vorkühlung und Boiler",
          ),
          text: t(
            "Nexavia mobilne hišice ohladi že zdaj, ko je še zaloga moči, bojlerje v sanitarijah pa zamakne za 40 minut – topla voda se zaradi zalogovnika ne ohladi.",
            "Nexavia cools the mobile homes now while power is still to spare, and delays the sanitary blocks' boilers by 40 minutes – the tank keeps the water hot.",
            "Nexavia kühlt die Mobilheime jetzt vor, solange noch Leistung frei ist, und verzögert die Boiler der Sanitärblöcke um 40 Minuten – der Speicher hält das Wasser warm.",
          ),
          run(api, play) {
            play.count("camp-feeder", 68, 82, (v) => `${Math.round(v)} kW`);
            api.pin("camp-feeder");
            api.log(
              t(
                "CAMP_FEEDER · Predhlajenje · bojlerji +40 min",
                "CAMP_FEEDER · Pre-cooling · boilers +40 min",
                "CAMP_FEEDER · Vorkühlung · Boiler +40 min",
              ),
              "17:30",
              "command",
            );
          },
        },
        {
          time: "18:40",
          focus: VIEW.quays,
          title: t(
            "Polnilnici se umakneta",
            "The chargers step back",
            "Die Ladestationen treten zurück",
          ),
          text: t(
            "Polnilnici za električna vozila za pol ure zmanjšata moč z 11 na 3,7 kW. Vozila so do jutra vseeno polna.",
            "The EV chargers drop from 11 to 3.7 kW for half an hour. The cars are still full by morning.",
            "Die E-Ladestationen reduzieren für eine halbe Stunde von 11 auf 3,7 kW. Die Autos sind bis zum Morgen trotzdem voll.",
          ),
          run(api, play) {
            play.count("ev", 11, 3.7, (v) => `${n(v, 1)} kW`);
            api.pin("ev");
            api.log(
              t(
                "EV_01 · Ukaz: omejitev 3,7 kW do 19:30",
                "EV_01 · Command: limit 3.7 kW until 19:30",
                "EV_01 · Befehl: Begrenzung 3,7 kW bis 19:30",
              ),
              "18:40",
              "command",
            );
          },
        },
        {
          time: "19:00",
          title: t(
            "Konica ostane pod pogodbo",
            "The peak stays under contract",
            "Die Spitze bleibt unter dem Vertrag",
          ),
          text: t(
            "Vse jahte imajo klimo, gostje topel tuš – konica pa je 238 kW namesto 262 kW. Brez kazni za preseženo moč, brez višje priključne moči.",
            "Every yacht has its AC and every guest a hot shower – yet the peak is 238 kW instead of 262 kW. No penalty for exceeding, no larger connection.",
            "Jede Yacht hat ihre Klimaanlage und jeder Gast eine warme Dusche – trotzdem liegt die Spitze bei 238 kW statt 262 kW. Keine Strafe für Überschreitung, kein größerer Anschluss.",
          ),
          run(api, play) {
            play.count("kpi-peak", 196, 238, (v) => `${Math.round(v)} kW`);
            api.setReading("shore-kw", `${n(31, 1)} kW`);
            api.spotlight(api.$ui("kpi-peak")?.parentElement);
            play.toast(
              t("Konica 238 kW", "Peak 238 kW", "Spitze 238 kW"),
              t(
                "Pod pogodbenimi 250 kW · brez kazni",
                "Under the contracted 250 kW · no penalty",
                "Unter den vertraglichen 250 kW · keine Strafe",
              ),
              "19:00",
            );
            api.log(
              t(
                "KAI · Konica 238 kW · pod pogodbo",
                "KAI · Peak 238 kW · under contract",
                "KAI · Spitze 238 kW · unter dem Vertrag",
              ),
              "19:00",
              "notify",
            );
          },
        },
      ],
    },
    {
      // A boat on a berth that nobody booked.
      id: "unbooked",
      title: t(
        "Plovilo na tujem privezu",
        "A boat on someone else's berth",
        "Ein Boot auf einem fremden Liegeplatz",
      ),
      setup(api) {
        api.setReading("berths", ...occupied());
        api.setReading("berths-unauth", "0");
        PIERS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("berths");
        api.narrate({
          rule: t(
            "Pravilo: plovilo brez rezervacije → vtičnica zaklenjena",
            "Rule: boat without a booking → socket locked",
            "Regel: Boot ohne Buchung → Steckdose gesperrt",
          ),
        });
      },
      steps: [
        {
          time: "21:40",
          focus: VIEW.piers,
          title: t(
            "Privez B-07 je prost",
            "Berth B-07 is free",
            "Liegeplatz B-07 ist frei",
          ),
          text: t(
            "Privez B-07 je rezerviran šele za jutri. Senzor zasedenosti na njem ne zazna ničesar.",
            "Berth B-07 is only booked from tomorrow. Its occupancy sensor detects nothing.",
            "Liegeplatz B-07 ist erst ab morgen gebucht. Sein Belegungssensor erkennt nichts.",
          ),
          run(api) {
            api.spotlight(api.$reading("berths"));
          },
        },
        {
          time: "22:15",
          title: t("Plovilo se priveže", "A boat moors", "Ein Boot legt an"),
          text: t(
            "Pozno zvečer na privez B-07 pripluje jadrnica. Senzor zazna plovilo in zasedenost marine se poveča.",
            "Late in the evening a sailboat comes into berth B-07. The sensor detects it and marina occupancy goes up.",
            "Spät am Abend läuft ein Segelboot in Liegeplatz B-07 ein. Der Sensor erkennt es und die Belegung der Marina steigt.",
          ),
          run(api) {
            api.setReading("berths", ...occupied(1));
            api.pin("berths");
            api.log(
              t(
                "BERTH_OCC_A · B-07 zaseden",
                "BERTH_OCC_A · B-07 occupied",
                "BERTH_OCC_A · B-07 belegt",
              ),
              "22:15",
              "reading",
            );
          },
        },
        {
          time: "22:16",
          title: t("Brez rezervacije", "No booking", "Keine Buchung"),
          text: t(
            "Nexavia preveri PMS: za B-07 nocoj ni rezervacije. Odpre alarm in obvesti kapitanijo.",
            "Nexavia checks the PMS: there is no booking for B-07 tonight. It opens an alarm and notifies the harbour office.",
            "Nexavia prüft das PMS: Für B-07 gibt es heute Nacht keine Buchung. Es öffnet einen Alarm und benachrichtigt das Hafenbüro.",
          ),
          run(api) {
            api.setReading("berths-unauth", "1");
            api.setAlarms([
              [
                "BERTH_B07",
                t(
                  "Plovilo brez rezervacije · 1 min",
                  "Boat without a booking · 1 min",
                  "Boot ohne Buchung · 1 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "BERTH_B07 · Ni rezervacije v PMS → alarm",
                "BERTH_B07 · No booking in the PMS → alarm",
                "BERTH_B07 · Keine Buchung im PMS → Alarm",
              ),
              "22:16",
              "alarm",
            );
          },
        },
        {
          time: "22:18",
          title: t(
            "Vtičnica ostane zaklenjena",
            "The socket stays locked",
            "Die Steckdose bleibt gesperrt",
          ),
          text: t(
            "Posadka priključi kabel, a brez veljavne kartice NFC vtičnica B-07 ne da toka. Poskus se zabeleži.",
            "The crew plugs in a cable, but without a valid NFC card socket B-07 gives no power. The attempt is logged.",
            "Die Crew steckt ein Kabel ein, aber ohne gültige NFC-Karte gibt die Steckdose B-07 keinen Strom. Der Versuch wird protokolliert.",
          ),
          run(api) {
            api.setAlarms([
              [
                "BERTH_B07",
                t(
                  "Plovilo brez rezervacije · 3 min",
                  "Boat without a booking · 3 min",
                  "Boot ohne Buchung · 3 min",
                ),
              ],
              [
                "PEDESTAL_B07",
                t(
                  "Poskus priklopa brez kartice",
                  "Plug-in attempt without a card",
                  "Anschlussversuch ohne Karte",
                ),
              ],
            ]);
            api.log(
              t(
                "PEDESTAL_B07 · Priklop brez kartice zavrnjen",
                "PEDESTAL_B07 · Plug-in without a card refused",
                "PEDESTAL_B07 · Anschluss ohne Karte abgelehnt",
              ),
              "22:18",
              "command",
            );
          },
        },
        {
          time: "22:30",
          title: t(
            "Dežurni uredi",
            "The night guard sorts it out",
            "Der Nachtdienst regelt es",
          ),
          text: t(
            "Dežurni mornar skiperju ponudi prost privez A-03. Rezervacija se vpiše v PMS, kartica deluje, alarm se zapre.",
            "The night guard offers the skipper free berth A-03. The booking goes into the PMS, the card works and the alarm closes.",
            "Der Nachtdienst bietet dem Skipper den freien Liegeplatz A-03 an. Die Buchung geht ins PMS, die Karte funktioniert und der Alarm schließt sich.",
          ),
          run(api, play) {
            api.setReading("berths-unauth", "0");
            api.setAlarms([]);
            play.toast(
              t("Rezervacija · A-03", "Booking · A-03", "Buchung · A-03"),
              t(
                "Jadrnica preseljena · 1 noč",
                "Sailboat moved · 1 night",
                "Segelboot umgelegt · 1 Nacht",
              ),
              "22:30",
            );
            api.log(
              t(
                "PMS_MARINA · A-03 rezerviran · alarm zaprt",
                "PMS_MARINA · A-03 booked · alarm closed",
                "PMS_MARINA · A-03 gebucht · Alarm geschlossen",
              ),
              "22:30",
              "notify",
            );
          },
        },
      ],
    },
    {
      id: "pool",
      title: t(
        "Klor v bazenu pade",
        "Pool chlorine drops",
        "Das Chlor im Pool sinkt",
      ),
      setup(api) {
        api.setReading("pool-cl", `${n(0.6, 2)} mg/l`);
        api.setReading("pool-ph", n(7.3, 1));
        api.setAlarms([]);
        api.pin("pool");
        api.narrate({
          rule: t(
            "Pravilo: klor < 0,3 mg/l → bazen zaprt",
            "Rule: chlorine < 0.3 mg/l → pool closed",
            "Regel: Chlor < 0,3 mg/l → Pool gesperrt",
          ),
        });
      },
      steps: [
        {
          time: "13:00",
          focus: VIEW.pool,
          title: t("Poln bazen", "A busy pool", "Ein voller Pool"),
          text: t(
            "Vroče popoldne, v bazenu je 40 kopalcev. Analizator vsakih pet minut meri klor, pH in ORP.",
            "A hot afternoon with 40 swimmers in the pool. The analyser measures chlorine, pH and ORP every five minutes.",
            "Ein heißer Nachmittag mit 40 Badegästen im Pool. Der Analysator misst Chlor, pH und Redoxpotenzial alle fünf Minuten.",
          ),
          run(api) {
            api.spotlight(api.$reading("pool"));
          },
        },
        {
          time: "14:10",
          title: t("Klor pada", "Chlorine falls", "Das Chlor sinkt"),
          text: t(
            "Sonce in kopalci hitro porabljajo klor. V uri pade z 0,6 na 0,25 mg/l.",
            "Sun and swimmers use up the chlorine quickly. Within an hour it falls from 0.6 to 0.25 mg/l.",
            "Sonne und Badegäste verbrauchen das Chlor schnell. Innerhalb einer Stunde fällt es von 0,6 auf 0,25 mg/l.",
          ),
          run(api, play) {
            play.count("pool-cl", 0.6, 0.25, (v) => `${n(v, 2)} mg/l`);
            api.log(
              t(
                "POOL_01 · Klor 0,25 mg/l",
                "POOL_01 · Chlorine 0.25 mg/l",
                "POOL_01 · Chlor 0,25 mg/l",
              ),
              "14:10",
              "reading",
            );
          },
        },
        {
          time: "14:12",
          title: t(
            "Bazen zaprt",
            "The pool is closed",
            "Der Pool wird gesperrt",
          ),
          text: t(
            "Pravilo se sproži: reševalec iz vode dobi obvestilo, da zapre bazen. Zapis gre v dnevnik za sanitarno inšpekcijo.",
            "The rule fires: the lifeguard is told to close the pool. The record goes into the log for the health inspector.",
            "Die Regel greift: Der Bademeister wird angewiesen, den Pool zu sperren. Der Eintrag geht ins Protokoll für das Gesundheitsamt.",
          ),
          run(api, play) {
            api.setAlarms([
              [
                "POOL_01",
                t(
                  "Klor 0,25 mg/l · meja 0,3",
                  "Chlorine 0.25 mg/l · limit 0.3",
                  "Chlor 0,25 mg/l · Grenze 0,3",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            play.toast(
              t("Bazen zaprt", "Pool closed", "Pool gesperrt"),
              t(
                "Klor 0,25 mg/l · reševalec obveščen",
                "Chlorine 0.25 mg/l · lifeguard alerted",
                "Chlor 0,25 mg/l · Bademeister alarmiert",
              ),
              "14:12",
            );
            api.log(
              t(
                "POOL_01 · Alarm: klor pod mejo → bazen zaprt",
                "POOL_01 · Alarm: chlorine below limit → pool closed",
                "POOL_01 · Alarm: Chlor unter Grenzwert → Pool gesperrt",
              ),
              "14:12",
              "alarm",
            );
          },
        },
        {
          time: "14:13",
          title: t(
            "Dozirna črpalka popravi",
            "The dosing pump corrects",
            "Die Dosierpumpe korrigiert",
          ),
          text: t(
            "Nexavia poveča odmerek dozirne črpalke. Nihče ne dodaja klora na oko.",
            "Nexavia raises the dosing pump's rate. Nobody adds chlorine by eye.",
            "Nexavia erhöht die Dosierrate der Pumpe. Niemand dosiert Chlor nach Augenmaß.",
          ),
          run(api) {
            api.spotlight(api.$reading("pool"));
            api.log(
              t(
                "POOL_01 · Ukaz: odmerek klora +40 %",
                "POOL_01 · Command: chlorine dose +40%",
                "POOL_01 · Befehl: Chlordosis +40 %",
              ),
              "14:13",
              "command",
            );
          },
        },
        {
          time: "14:45",
          title: t("Spet v mejah", "Back in range", "Wieder im Bereich"),
          text: t(
            "V pol ure je klor spet 0,55 mg/l. Alarm se zapre, bazen se odpre, dnevnik pa ima ves potek s časi.",
            "In half an hour chlorine is back at 0.55 mg/l. The alarm closes, the pool reopens and the log keeps the whole course with times.",
            "Nach einer halben Stunde liegt das Chlor wieder bei 0,55 mg/l. Der Alarm schließt sich, der Pool öffnet wieder, und das Protokoll enthält den gesamten Verlauf mit Uhrzeiten.",
          ),
          run(api, play) {
            play.count("pool-cl", 0.25, 0.55, (v) => `${n(v, 2)} mg/l`);
            api.setAlarms([]);
            api.log(
              t(
                "POOL_01 · Klor 0,55 mg/l · bazen odprt",
                "POOL_01 · Chlorine 0.55 mg/l · pool reopened",
                "POOL_01 · Chlor 0,55 mg/l · Pool wieder geöffnet",
              ),
              "14:45",
              "alarm",
            );
          },
        },
      ],
    },
  ];
}
