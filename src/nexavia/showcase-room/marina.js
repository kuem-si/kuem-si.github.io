import { initWater, sample, fountain } from "./water.js";
import { initBeacons } from "./beacons.js";
import { initFountain } from "./fountain.js";
import { initTraffic } from "./traffic.js";
import { initTide } from "./tide.js";
import geometry from "../../components/nexavia/showcase/marina-geometry.json";

// The smart-marina twin: hotel, restaurant, sanitary block and four pier
// lights under one lighting rule, with meters and sensors across the marina
// (the town behind it has none). Driven by twin.js; the maquette and its
// geometry come from scripts/generate-marina-maquette.mjs.

const PIERS = ["PIER_01", "PIER_02", "PIER_03", "PIER_04"];
const ALL = ["HOTEL_01", "RESTAURANT_01", "SANITARY_01", ...PIERS];
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
};

const { berths, parking } = geometry;
// Berths and parking spaces as the model shows them.
const occupied = (extra = 0) => [`${berths.occupied + extra} / ${berths.total}`, undefined, String(berths.occupied + extra)];
const freeSpaces = (change = 0) => {
  const free = parking.total - parking.parked + change;
  return [`${free} / ${parking.total}`, undefined, String(free)];
};

// The whole water surface moves: the water rendered alone is redrawn in
// wavering strips (its alpha keeps boats, piers and quays still). Waves are
// larger and longer nearer the viewer. Same motion as the town's river: a
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
  // The square's fountain, played and lit like the town's.
  fountain({
    x: 774,
    top: 155,
    base: 176,
    basinY: 179,
    basinRx: 23,
    basinRy: 10,
    jet: [
      [160, 1.8],
      [165, 3.2],
      [170, 4.6],
      [176, 6.5],
    ],
    lightJet: [
      [157, 0],
      [162, 1.3],
      [168, 2.6],
      [176, 4.2],
    ],
  }),
];

// Water playing from the fountain on the square: a jet about 18 px high,
// falling into the basin 3 px below the nozzle.
const FOUNTAIN = { nozzle: [774, 173], height: 18, water: -3, spread: 16, rate: 520, basin: { rx: 23, ry: 10 } };

// The red and green lights at the harbour entrance flash out of step.
const BEACONS = [
  { lamp: [673, 620], reflection: [676, 721], color: "#ff3a2a", glint: "#ffb3a6", dark: "#200605", period: 4, phase: 0, on: 1.1 },
  { lamp: [863, 620], reflection: [859, 721], color: "#22ff78", glint: "#b8ffd4", dark: "#03170b", period: 4, phase: 2, on: 1.1 },
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
const TIDE = { base: 0.45, perMetre: 18, max: 8, pedestals: [865, 893, 921, 949, 977, 1005].map((x) => [x, 531]) };

function water(root) {
  const surface = waves(root.querySelector("[data-city-art]")?.dataset.waterSrc);
  const redraw = initWater(root, surface);
  const en = document.documentElement.lang.startsWith("en");
  initTide(root, { water: redraw, patch: surface[0], ...TIDE, label: en ? "6 pedestals switched off" : "6 priključkov izklopljenih" });
}

export const marina = {
  effects: [water, (root) => initBeacons(root, BEACONS), (root) => initFountain(root, FOUNTAIN), (root) => initTraffic(root, TRAFFIC)],
  // The radio gateway on the hotel roof.
  gateway: { id: "GW_02", at: [424, 214] },
  devices: (t) => [
    { id: "HOTEL_01", name: t("Hotel", "Hotel"), watts: 180 },
    { id: "RESTAURANT_01", name: t("Restavracija s teraso", "Restaurant and terrace"), watts: 140 },
    { id: "SANITARY_01", name: t("Sanitarni blok", "Sanitary block"), watts: 45 },
    { id: "PIER_01", name: t("Luč pomola A1", "Pier light A1"), watts: 40 },
    { id: "PIER_02", name: t("Luč pomola A2", "Pier light A2"), watts: 40 },
    { id: "PIER_03", name: t("Luč pomola B1", "Pier light B1"), watts: 40 },
    { id: "PIER_04", name: t("Luč pomola B2", "Pier light B2"), watts: 40 },
  ],
  group: { ids: PIERS, subject: "PIER_01–PIER_04", name: (t) => t("Luči na pomolih", "Pier lights") },
  counters: [],
  steps: (t) => [
    {
      at: "day",
      text: t("Senzor LIGHT_02: 52 lx · dovolj dnevne svetlobe", "Sensor LIGHT_02: 52 lx · enough daylight"),
      lux: 52,
      states: off(),
      rule: t("Pogoj ni izpolnjen · razsvetljava izklopljena", "Condition not met · lighting is off"),
      log: [["reading", t("LIGHT_02 · Svetloba okolice 52 lx", "LIGHT_02 · Ambient light 52 lx")]],
    },
    {
      at: "dusk",
      text: t("Senzor LIGHT_02: 21 lx · sonce zahaja", "Sensor LIGHT_02: 21 lx · the sun is setting"),
      lux: 21,
      states: off(),
      rule: t("Pogoj izpolnjen · ukaz se pošilja prek GW_02", "Condition met · command sent via GW_02"),
      log: [
        ["reading", t("LIGHT_02 · Svetloba okolice 21 lx · prek prehoda GW_02", "LIGHT_02 · Ambient light 21 lx · via gateway GW_02")],
        ["decision", t("Pravilo svetloba < 25 lx izpolnjeno (21 lx) → vklop razsvetljave, najprej pomoli", "Rule light < 25 lx met (21 lx) → lighting on, piers first")],
      ],
    },
    {
      at: "dusk+10",
      text: t("Na pomolih se prižgejo luči", "The pier lights switch on"),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1, 1],
      rule: t("Aktivno · najprej varna pot do plovil", "Active · safe access to the boats first"),
      log: [["command", t("PIER_01–PIER_04 · Luči na pomolih vklopljene", "PIER_01–PIER_04 · Pier lights switched on")]],
    },
    {
      at: "dusk+20",
      text: t("Restavracija prižge luči na terasi", "The restaurant lights up its terrace"),
      lux: 21,
      states: [0, 1, 0, 1, 1, 1, 1],
      rule: t("Aktivno · samodejni vklop razsvetljave", "Active · automatic lighting control"),
      log: [["command", t("RESTAURANT_01 · Razsvetljava terase vklopljena", "RESTAURANT_01 · Terrace lighting switched on")]],
    },
    {
      at: "dusk+30",
      text: t("V hotelu se prižgejo luči", "The hotel lights switch on"),
      lux: 21,
      states: [1, 1, 0, 1, 1, 1, 1],
      rule: t("Aktivno · samodejni vklop razsvetljave", "Active · automatic lighting control"),
      log: [["command", t("HOTEL_01 · Razsvetljava vklopljena", "HOTEL_01 · Lighting switched on")]],
    },
    {
      at: "dusk+40",
      text: t("Sanitarni blok vklopi razsvetljavo", "The sanitary block lights come on"),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1, 1],
      rule: t("Samodejna razsvetljava je aktivna", "Automatic lighting active"),
      log: [["command", t("SANITARY_01 · Razsvetljava vklopljena", "SANITARY_01 · Lighting switched on")]],
    },
    {
      at: "dawn",
      text: t("Svetloba se vrne · sistem ugasne luči", "Daylight returns · system switches lights off"),
      lux: 52,
      states: off(),
      rule: t("Pogoj ni več izpolnjen · luči izklopljene", "Condition no longer met · lights switched off"),
      log: [
        ["reading", t("LIGHT_02 · Svetloba okolice 52 lx", "LIGHT_02 · Ambient light 52 lx")],
        ["decision", t("Pravilo svetloba < 25 lx ni več izpolnjeno → izklop razsvetljave", "Rule light < 25 lx no longer met → lighting off")],
        ["command", t("Vse luči v marini izklopljene", "All marina lights switched off")],
      ],
    },
  ],
  // The tripped pedestal stays open; the weak gateway signal to the far pier
  // light clears for a while.
  alarms: (index) => (index === 3 || index === 4 ? ["PEDESTAL_B07"] : ["PEDESTAL_B07", "PIER_04"]),
  tick(index, { setReading, t, n }) {
    const i = index % 7;
    setReading("hotel-power", `${n(38.5 + [0, 0.4, 1.1, 1.8, 2.6, 3.1, 0.9][i], 1)} kW`);
    setReading("shore-power", `${n(46.8 + i * 0.2, 1)} kWh`);
    setReading("sanitary-water", `${n(0.84 + [0, 0.06, -0.04, 0.1, 0.02, -0.08, 0.03][i], 2)} m³/h`);
    const fuel = [72, 72, 71, 71, 71, 70, 70][i];
    setReading("fuel", t(`${fuel} %`, `${fuel}%`));
    setReading("sea-level", `+${n(0.42 + [0, 0.02, 0.03, 0.05, 0.04, 0.02, 0.01][i], 2)} m`);
    const wind = 9 + [0, 1, -1, 2, 1, 0, -1][i];
    setReading("wind", `${wind} kn`, t(`Sunki ${wind + 4} kn · SV`, `Gusts ${wind + 4} kn · NE`));
    setReading("wind-gust", `${wind + 4} kn`);
    setReading("wind-temp", `${n(17.9 - i * 0.2, 1)} °C`);
    setReading("parking", ...freeSpaces([0, 0, -1, -1, -2, -1, 0][i]));
  },
  scenarios,
};

// Guided scenarios. `t(sl, en)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
  const kn = (v) => `${Math.round(v)} kn`;
  const sea = (v) => `+${n(v, 2)} m`;
  return [
    {
      // One reading followed from the sensor to the command it leads to.
      id: "how-it-works",
      intro: true,
      title: t("Kako deluje: od senzorja do odločitve", "How it works: sensor to decision"),
      setup(api) {
        api.showFlow(true);
        ALL.forEach((id) => api.setLevel(id, 0));
        api.setAlarms([]);
        api.pin("lux");
        api.narrate({ rule: t("Čaka na naslednjo meritev", "Waiting for next reading") });
      },
      steps: [
        {
          time: "19:52",
          focus: { x: 380, y: 215, zoom: 1.7, radius: 0.22 },
          title: t("Senzor meri", "A sensor measures"),
          text: t(
            "Senzor svetlobe LIGHT_02 na strehi hotela meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut.",
            "Light sensor LIGHT_02 on the hotel roof measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes.",
          ),
          run() {},
        },
        {
          time: "19:52",
          title: t("Radio jo ponese do prehoda", "Radio carries it to the gateway"),
          text: t(
            "Meritev po radiu LoRaWAN potuje do prehoda GW_02. En prehod pokrije celo marino, zato noben senzor ne potrebuje kabla.",
            "The reading travels by LoRaWAN radio to gateway GW_02. One gateway covers the whole marina, so no sensor needs a cable.",
          ),
          run(api) {
            api.send("lux");
            api.log(t("LIGHT_02 · Svetloba okolice pod 25 lx", "LIGHT_02 · Ambient light below 25 lx"), "19:52", "reading");
          },
        },
        {
          time: "19:52",
          title: t("Nexavia jo prejme", "Nexavia receives it"),
          text: t(
            "Prehod meritev prek interneta posreduje Nexavii, ki jo shrani skupaj s časom. Ploščica svetlobe okolice na nadzorni plošči se posodobi.",
            "The gateway forwards the reading over the internet to Nexavia, which stores it with its time. The ambient light tile on the dashboard updates.",
          ),
          run(api) {
            api.spotlight(api.$ui("lux")?.parentElement);
            api.log(t("GW_02 → Nexavia · meritev shranjena", "GW_02 → Nexavia · reading stored"), "19:52", "system");
          },
        },
        {
          time: "19:53",
          title: t("Pravilo odloči", "A rule decides"),
          text: t(
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge luči na pomolih.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to light the piers first.",
          ),
          run(api) {
            api.spotlight(".twin-rule");
            api.narrate({ rule: t("Pogoj izpolnjen · svetloba < 25 lx", "Condition met · light < 25 lx") });
            api.log(t("Pravilo svetloba < 25 lx izpolnjeno → vklop luči na pomolih", "Rule light < 25 lx met → pier lights on"), "19:53", "decision");
          },
        },
        {
          time: "19:53",
          focus: VIEW.piers,
          title: t("Ukaz gre nazaj", "A command goes back"),
          text: t(
            "Nexavia prek prehoda pošlje ukaz vsaki luči na pomolih – rumeni paketi. Luči potrdijo in nadzorna plošča jih prikaže kot vklopljene.",
            "Nexavia sends a command back through the gateway to each pier light – the yellow packets. The lights confirm, and the dashboard shows them on.",
          ),
          run(api) {
            PIERS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(api.$row("PIER_01"));
            api.log(t("PIER_01–PIER_04 · Ukaz: vklop", "PIER_01–PIER_04 · Command: switch on"), "19:53", "command");
          },
        },
        {
          time: "19:54",
          title: t("Vse je zabeleženo", "Everything is on record"),
          text: t(
            "Časovnica hrani celotno verigo: meritev, odločitev, ukaz. Zdaj poskusite sami – kliknite kateri koli senzor, da pošlje meritev, ali preklopite luč.",
            "The timeline keeps the whole chain: reading, decision, command. Now try it yourself – click any sensor to send a reading, or switch a light.",
          ),
          run(api) {
            api.spotlight(".twin-event");
          },
        },
      ],
    },
    {
      id: "bora",
      title: t("Burja v marini", "Bora in the marina"),
      setup(api) {
        api.setReading("wind", "9 kn", t("Sunki 13 kn · SV", "Gusts 13 kn · NE"));
        api.setReading("wind-gust", "13 kn");
        PIERS.forEach((id) => api.setLevel(id, 0));
        api.setAlarms([]);
        api.pin("wind");
        api.narrate({ rule: t("Pravilo: sunki vetra > 30 kn", "Rule: wind gusts > 30 kn") });
      },
      steps: [
        {
          time: "18:40",
          focus: VIEW.wind,
          title: t("Miren večer", "A calm evening"),
          text: t("Vremenska postaja WIND_01 ob kapitaniji meri veter in sunke vsakih deset sekund.", "Weather station WIND_01 by the harbour office measures wind and gusts every ten seconds."),
          run(api) {
            api.spotlight(api.$reading("wind"));
          },
        },
        {
          time: "19:05",
          title: t("Burja se okrepi", "The bora picks up"),
          text: t("Veter s severovzhoda v pol ure naraste s 9 na 27 vozlov.", "The north-easterly wind rises from 9 to 27 knots in half an hour."),
          run(api, play) {
            play.count("wind", 9, 27, kn, t("Sunki 34 kn · SV", "Gusts 34 kn · NE"));
            api.setReading("wind-gust", "34 kn");
            api.log(t("WIND_01 · Veter 27 kn · sunki 34 kn", "WIND_01 · Wind 27 kn · gusts 34 kn"), "19:05", "reading");
          },
        },
        {
          time: "19:06",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t("Sunki presežejo 30 vozlov. Nexavia odpre alarm za celotno marino.", "Gusts pass 30 knots. Nexavia opens an alarm for the whole marina."),
          run(api) {
            api.setReading("wind", "27 kn", t("Sunki 41 kn · SV", "Gusts 41 kn · NE"));
            api.setReading("wind-gust", "41 kn");
            api.setAlarms([["WIND_01", t("Sunki 41 kn · meja 30 kn", "Gusts 41 kn · limit 30 kn")]]);
            api.spotlight(".twin-alerts");
            api.log(t("WIND_01 · Alarm: močni sunki burje", "WIND_01 · Alarm: strong bora gusts"), "19:06", "alarm");
          },
        },
        {
          time: "19:07",
          focus: VIEW.piers,
          title: t("Opozorilo lastnikom plovil", "Boat owners are warned"),
          text: t(`Lastniki ${berths.occupied} privezanih plovil prejmejo SMS, naj preverijo privezne vrvi. Luči na pomolih se prižgejo za varen dostop.`, `The owners of the ${berths.occupied} moored boats get an SMS to check their mooring lines. The pier lights switch on for safe access.`),
          run(api, play) {
            PIERS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(".twin-lamp-group");
            play.toast(t("Opozorilo: burja", "Warning: bora"), t("Sunki 41 kn · preverite privezne vrvi", "Gusts 41 kn · check your mooring lines"), "19:07");
            api.log(t(`PIER_01–PIER_04 · Varnostna razsvetljava · ${berths.occupied} SMS poslanih`, `PIER_01–PIER_04 · Safety lighting · ${berths.occupied} SMS sent`), "19:07", "notify");
          },
        },
        {
          time: "23:30",
          focus: VIEW.basin,
          title: t("Burja pojenja", "The bora eases"),
          text: t("Veter pade pod mejo in alarm se samodejno zapre. Nobeno plovilo se ni odtrgalo s priveza.", "The wind drops below the limit and the alarm closes by itself. No boat broke loose from its berth."),
          run(api, play) {
            play.count("wind", 27, 11, kn, t("Sunki 16 kn · SV", "Gusts 16 kn · NE"));
            api.setReading("wind-gust", "16 kn");
            api.setAlarms([]);
            api.spotlight(api.$reading("wind"));
            api.log(t("WIND_01 · Veter 11 kn · alarm zaprt", "WIND_01 · Wind 11 kn · alarm closed"), "23:30", "alarm");
          },
        },
      ],
    },
    {
      id: "high-tide",
      title: t("Visoka plima", "High tide"),
      setup(api) {
        api.setReading("sea-level", sea(0.42), t("Normalno", "Normal"));
        api.setReading("shore-power", `${n(46.8, 1)} kWh`);
        api.setAlarms([]);
        api.signal("pedestals", false);
        api.pin("sea-level");
        api.narrate({ rule: t("Pravilo: gladina morja > +0,70 m", "Rule: sea level > +0.70 m") });
      },
      steps: [
        {
          time: "07:00",
          focus: VIEW.sea,
          title: t("Običajna plima", "An ordinary tide"),
          text: t("Senzor SEA_LEVEL_01 na obali meri gladino morja glede na srednjo vrednost.", "Sensor SEA_LEVEL_01 on the quay measures the sea level against its mean."),
          run(api) {
            api.spotlight(api.$reading("sea-level"));
          },
        },
        {
          time: "09:20",
          title: t("Jugo dviguje morje", "The sirocco raises the sea"),
          text: t("Z jugom in plimo se gladina dviga hitreje kot običajno.", "With the sirocco and the tide together, the level climbs faster than usual."),
          run(api, play) {
            play.count("sea-level", 0.42, 0.63, sea, t("Narašča", "Rising"));
            api.log(t("SEA_LEVEL_01 · +0,63 m · narašča", "SEA_LEVEL_01 · +0.63 m · rising"), "09:20", "reading");
          },
        },
        {
          time: "10:05",
          title: t("Opozorilna gladina", "Warning level reached"),
          text: t("Gladina preseže +0,70 m. Morje se bliža robu obale in najnižjim priključkom.", "The level passes +0.70 m. The sea is nearing the quay edge and the lowest pedestals."),
          run(api, play) {
            play.count("sea-level", 0.63, 0.78, sea, t("Opozorilna gladina", "Warning level"));
            api.setAlarms([["SEA_LEVEL_01", t("+0,78 m · nevarnost poplavljanja obale", "+0.78 m · risk of quay flooding")]]);
            api.spotlight(".twin-alerts");
            api.log(t("SEA_LEVEL_01 · Alarm: opozorilna gladina", "SEA_LEVEL_01 · Alarm: warning level"), "10:05", "alarm");
          },
        },
        {
          time: "10:06",
          focus: VIEW.shore,
          title: t("Samodejni varnostni odklop", "Automatic safety cut-off"),
          text: t("Nexavia izklopi elektriko na šestih najnižjih priključkih pomola B, preden jih doseže morje. Mornarji prejmejo obvestilo.", "Nexavia switches off power at the six lowest pedestals on pier B before the sea reaches them. The marina crew is notified."),
          run(api, play) {
            api.setAlarms([
              ["SEA_LEVEL_01", t("+0,78 m · nevarnost poplavljanja obale", "+0.78 m · risk of quay flooding")],
              ["SHORE_POWER_B", t("Varnostni odklop · 6 priključkov", "Safety cut-off · 6 pedestals")],
            ]);
            api.pin("shore-power");
            api.signal("pedestals", true);
            api.spotlight(api.$reading("shore-power"));
            play.toast(t("Visoka plima", "High tide"), t("+0,78 m · izklopljenih 6 priključkov", "+0.78 m · 6 pedestals switched off"), "10:06");
            api.log(t("SHORE_POWER_B · Varnostni odklop 6 priključkov", "SHORE_POWER_B · 6 pedestals cut off"), "10:06", "command");
          },
        },
        {
          time: "13:30",
          focus: VIEW.sea,
          title: t("Morje upada", "The sea recedes"),
          text: t("Gladina pade pod mejo, priključki se ponovno vklopijo in alarma se zapreta. Dogodek ostane v zgodovini.", "The level falls below the limit, the pedestals switch back on and both alarms close. The event stays in the history."),
          run(api, play) {
            play.count("sea-level", 0.78, 0.51, sea, t("Upada", "Falling"));
            api.setAlarms([]);
            api.signal("pedestals", false);
            api.pin("sea-level");
            api.spotlight(api.$reading("sea-level"));
            api.log(t("SEA_LEVEL_01 · +0,51 m · priključki ponovno vklopljeni", "SEA_LEVEL_01 · +0.51 m · pedestals back on"), "13:30", "command");
          },
        },
      ],
    },
    {
      id: "leak",
      title: t("Puščanje v sanitarijah", "Leak in the sanitary block"),
      setup(api) {
        api.setLevel("SANITARY_01", 0);
        PIERS.forEach((id) => api.setLevel(id, 1));
        api.setReading("sanitary-water", `${n(0, 2)} m³/h`);
        api.setAlarms([]);
        api.pin("sanitary-water");
        api.narrate({ rule: t("Pravilo: nočni pretok > 0,2 m³/h dlje kot 20 min", "Rule: night flow > 0.2 m³/h for over 20 min") });
      },
      steps: [
        {
          time: "01:30",
          focus: VIEW.sanitary,
          title: t("Noč v marini", "Night in the marina"),
          text: t("Sanitarni blok je zaklenjen, luči so ugasnjene. Ponoči je pretok vode nič.", "The sanitary block is locked and dark. At night, water flow is zero."),
          run(api) {
            api.spotlight(api.$reading("sanitary-water"));
          },
        },
        {
          time: "01:42",
          title: t("Voda začne teči", "Water starts flowing"),
          text: t("Vodomer SANITARY_WATER_01 zazna stalen pretok, čeprav v sanitarijah ni nikogar.", "Meter SANITARY_WATER_01 detects a steady flow although nobody is inside."),
          run(api, play) {
            play.count("sanitary-water", 0, 0.46, (v) => `${n(v, 2)} m³/h`);
            api.log(t("SANITARY_WATER_01 · Nočni pretok 0,46 m³/h", "SANITARY_WATER_01 · Night flow 0.46 m³/h"), "01:42", "reading");
          },
        },
        {
          time: "02:02",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t("Po 20 minutah neprekinjenega pretoka Nexavia prepozna sum puščanja.", "After 20 minutes of uninterrupted flow, Nexavia recognises a suspected leak."),
          run(api) {
            api.setReading("sanitary-water", `${n(0.46, 2)} m³/h`);
            api.setAlarms([["SANITARY_WATER_01", t("Sum puščanja · 20 min", "Suspected leak · 20 min")]]);
            api.spotlight(".twin-alerts");
            api.log(t("SANITARY_WATER_01 · Alarm: sum puščanja", "SANITARY_WATER_01 · Alarm: suspected leak"), "02:02", "alarm");
          },
        },
        {
          time: "02:03",
          title: t("Nočni čuvaj obveščen", "The night guard is alerted"),
          text: t("Čuvaj prejme obvestilo, razsvetljava sanitarij se prižge, da lahko hitro preveri stanje.", "The night guard gets a notification and the sanitary block lights come on so the fault can be checked quickly."),
          run(api, play) {
            api.setLevel("SANITARY_01", 1);
            api.spotlight(api.$row("SANITARY_01"));
            play.toast(t("Sum puščanja vode", "Suspected water leak"), t("Sanitarije · 0,46 m³/h že 20 min", "Sanitary block · 0.46 m³/h for 20 min"), "02:03");
            api.log(t("SANITARY_01 · Razsvetljava vklopljena za čuvaja", "SANITARY_01 · Lights on for the night guard"), "02:03", "command");
          },
        },
        {
          time: "02:15",
          title: t("Puščanje ustavljeno", "Leak stopped"),
          text: t("Pokvarjen kotliček je zaprt, pretok pade na nič in alarm se zapre. Do jutra bi odteklo 3 m³ vode.", "The faulty cistern is shut off, flow drops to zero and the alarm closes. By morning 3 m³ of water would have run away."),
          run(api, play) {
            play.count("sanitary-water", 0.46, 0, (v) => `${n(v, 2)} m³/h`);
            api.setAlarms([]);
            api.setLevel("SANITARY_01", 0);
            api.spotlight(api.$reading("sanitary-water"));
            api.log(t("SANITARY_WATER_01 · Pretok ustavljen · alarm zaprt", "SANITARY_WATER_01 · Flow stopped · alarm closed"), "02:15", "alarm");
          },
        },
      ],
    },
    {
      id: "arrival",
      title: t("Prihod plovila", "A boat arrives"),
      setup(api) {
        api.setReading("berths", ...occupied());
        api.setReading("parking", ...freeSpaces());
        api.setReading("shore-power", `${n(46.8, 1)} kWh`);
        api.setAlarms([]);
        api.pin("berths");
        api.narrate({ rule: t("Pravilo: zaseden privez → začni obračun storitev", "Rule: berth occupied → start billing services") });
      },
      steps: [
        {
          time: "16:10",
          focus: VIEW.piers,
          title: t("Rezervacija priveza", "Berth booked"),
          text: t("Gost prek aplikacije rezervira privez za eno noč. Nexavia mu dodeli prost privez B-11 na pomolu B.", "A guest books a berth for one night in the app. Nexavia assigns free berth B-11 on pier B."),
          run(api) {
            api.spotlight(api.$reading("berths"));
            api.log(t("BERTH_B11 · Rezervirano · 1 noč", "BERTH_B11 · Booked · 1 night"), "16:10", "system");
          },
        },
        {
          time: "16:48",
          focus: VIEW.parking,
          title: t("Posadka parkira", "The crew parks"),
          text: t("Del posadke pripelje z avtom. Senzor na parkirišču zazna zasedeno mesto.", "Part of the crew arrives by car. The car park sensor detects the occupied space."),
          run(api) {
            api.setReading("parking", ...freeSpaces(-1));
            api.pin("parking");
            api.spotlight(api.$reading("parking"));
            api.log(t(`PARKING_01 · Prostih mest: ${freeSpaces(-1)[2]}`, `PARKING_01 · Free spaces: ${freeSpaces(-1)[2]}`), "16:48", "reading");
          },
        },
        {
          time: "17:05",
          focus: VIEW.piers,
          title: t("Plovilo na privezu", "Boat on its berth"),
          text: t("Senzor zasedenosti na privezu B-11 zazna plovilo. Zasedenost marine se osveži v realnem času.", "The occupancy sensor on berth B-11 detects the boat. Marina occupancy updates in real time."),
          run(api) {
            api.setReading("berths", ...occupied(1));
            api.pin("berths");
            api.spotlight(api.$reading("berths"));
            api.log(t("BERTH_B11 · Privez zaseden", "BERTH_B11 · Berth occupied"), "17:05", "reading");
          },
        },
        {
          time: "17:12",
          focus: VIEW.shore,
          title: t("Elektrika in voda na privezu", "Power and water at the berth"),
          text: t("Priključna omarica se odklene za gosta. Poraba elektrike in vode se beleži na njegov privez.", "The service pedestal unlocks for the guest. Electricity and water are metered to the berth."),
          run(api, play) {
            play.count("shore-power", 46.8, 49.2, (v) => `${n(v, 1)} kWh`);
            api.pin("shore-power");
            api.spotlight(api.$reading("shore-power"));
            api.log(t("PEDESTAL_B11 · Odklenjen · merjenje začeto", "PEDESTAL_B11 · Unlocked · metering started"), "17:12", "command");
          },
        },
        {
          time: "09:30",
          focus: VIEW.basin,
          title: t("Odhod in račun", "Departure and invoice"),
          text: t("Zjutraj plovilo odpluje. Gost prejme račun s privezom, elektriko in vodo – brez ročnega odčitavanja.", "In the morning the boat leaves. The guest gets one invoice for the berth, power and water – no manual readings."),
          run(api, play) {
            api.setReading("berths", ...occupied());
            api.setReading("parking", ...freeSpaces());
            api.pin("berths");
            play.toast(t("Račun za privez B-11", "Invoice for berth B-11"), t("1 noč · 6,4 kWh · 0,3 m³ vode", "1 night · 6.4 kWh · 0.3 m³ water"), "09:30");
            api.log(t("BERTH_B11 · Prost · račun poslan", "BERTH_B11 · Free · invoice sent"), "09:30", "notify");
          },
        },
      ],
    },
  ];
}
