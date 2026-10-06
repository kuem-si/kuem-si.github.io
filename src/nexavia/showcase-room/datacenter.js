import { initTraffic } from "./traffic.js";
import {
  LEVELS,
  RACKS,
  rackAt,
  rackKey,
  rackNumber,
  warmest,
} from "./datacenter-racks.js";
import geometry from "../../components/nexavia/showcase/datacenter-geometry.json";

// The datacenter twin: a building of three levels shown in a stepped section,
// with a temperature and humidity sensor on every rack, a leak detector under
// every level's raised floor and its lighting under one rule. Driven by
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

export const datacenter = {
  effects: [(root) => initTraffic(root, TRAFFIC)],
  // The radio gateway on the roof.
  gateway: { id: "GW_04", at: geometry.points.gateway },
  devices: (t) => [
    { id: "FLOOR_01", name: t("1. nadstropje", "Level 1"), watts: 900 },
    { id: "FLOOR_02", name: t("2. nadstropje", "Level 2"), watts: 900 },
    { id: "FLOOR_03", name: t("3. nadstropje", "Level 3"), watts: 900 },
    {
      id: "LAMP_01",
      name: t("Svetilka parkirišča", "Car park lamp"),
      watts: 90,
    },
    { id: "LAMP_02", name: t("Svetilka vhoda", "Gate lamp"), watts: 90 },
    {
      id: "LAMP_03",
      name: t("Svetilka hladilnega dvorišča", "Cooling yard lamp"),
      watts: 90,
    },
  ],
  group: {
    ids: LAMPS,
    subject: "LAMP_01–LAMP_03",
    name: (t) => t("Zunanje svetilke", "Outdoor lamps"),
  },
  counters: [],
  steps: (t) => [
    {
      at: "day",
      text: t(
        "Senzor LIGHT_04: 52 lx · dovolj dnevne svetlobe",
        "Sensor LIGHT_04: 52 lx · enough daylight",
      ),
      lux: 52,
      states: off(),
      rule: t(
        "Pogoj ni izpolnjen · razsvetljava izklopljena",
        "Condition not met · lighting is off",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_04 · Svetloba okolice 52 lx",
            "LIGHT_04 · Ambient light 52 lx",
          ),
        ],
      ],
    },
    {
      at: "dusk",
      text: t(
        "Senzor LIGHT_04: 21 lx · sonce zahaja",
        "Sensor LIGHT_04: 21 lx · the sun is setting",
      ),
      lux: 21,
      states: off(),
      rule: t(
        "Pogoj izpolnjen · ukaz se pošilja prek GW_04",
        "Condition met · command sent via GW_04",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_04 · Svetloba okolice 21 lx · prek prehoda GW_04",
            "LIGHT_04 · Ambient light 21 lx · via gateway GW_04",
          ),
        ],
        [
          "decision",
          t(
            "Pravilo svetloba < 25 lx izpolnjeno (21 lx) → vklop razsvetljave, najprej zunanje svetilke",
            "Rule light < 25 lx met (21 lx) → lighting on, outdoor lamps first",
          ),
        ],
      ],
    },
    {
      at: "dusk+10",
      text: t(
        "Na parkirišču in dvorišču se prižgejo svetilke",
        "The car park and yard lamps switch on",
      ),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1],
      rule: t(
        "Aktivno · najprej varna pot okoli stavbe",
        "Active · safe way around the building first",
      ),
      log: [
        [
          "command",
          t(
            "LAMP_01–LAMP_03 · Zunanje svetilke vklopljene",
            "LAMP_01–LAMP_03 · Outdoor lamps switched on",
          ),
        ],
      ],
    },
    {
      at: "dusk+20",
      text: t(
        "V 1. nadstropju se prižgejo luči",
        "The level 1 lights switch on",
      ),
      lux: 21,
      states: [1, 0, 0, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
      ),
      log: [
        [
          "command",
          t(
            "FLOOR_01 · Razsvetljava vklopljena",
            "FLOOR_01 · Lighting switched on",
          ),
        ],
      ],
    },
    {
      at: "dusk+30",
      text: t("Sledita 2. in 3. nadstropje", "Levels 2 and 3 follow"),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1],
      rule: t("Samodejna razsvetljava je aktivna", "Automatic lighting active"),
      log: [
        [
          "command",
          t(
            "FLOOR_02, FLOOR_03 · Razsvetljava vklopljena",
            "FLOOR_02, FLOOR_03 · Lighting switched on",
          ),
        ],
      ],
    },
    {
      at: "dawn",
      text: t(
        "Svetloba se vrne · sistem ugasne luči",
        "Daylight returns · system switches lights off",
      ),
      lux: 52,
      states: off(),
      rule: t(
        "Pogoj ni več izpolnjen · luči izklopljene",
        "Condition no longer met · lights switched off",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_04 · Svetloba okolice 52 lx",
            "LIGHT_04 · Ambient light 52 lx",
          ),
        ],
        [
          "decision",
          t(
            "Pravilo svetloba < 25 lx ni več izpolnjeno → izklop razsvetljave",
            "Rule light < 25 lx no longer met → lighting off",
          ),
        ],
        ["command", t("Vse luči izklopljene", "All lights switched off")],
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
        const { temp, rh } = rackAt(level, rack, step);
        const key = rackKey(level, rack);
        setReading(key, `${n(temp, 1)} °C`);
        setReading(`${key}-rh`, t(`${rh} %`, `${rh}%`));
      }
      const { rack, temp } = warmest(level, step);
      const number = rackNumber(level, rack);
      setReading(
        `level-${level}`,
        `${n(temp, 1)} °C`,
        t(`Omara ${number}`, `Rack ${number}`),
      );
    }
    const i = index % 7;
    const supply = 17.8 + [0, 0.1, 0.3, 0.4, 0.2, 0, -0.1][i];
    const back = `${n(supply + 6.1 + [0, 0.1, 0.2, 0.1, 0, -0.1, 0][i], 1)} °C`;
    setReading(
      "cooling",
      `${n(supply, 1)} °C`,
      t(`Povratek ${back}`, `Return ${back}`),
    );
    setReading("cooling-return", back);
    setReading(
      "power",
      `${n(412.6 + [0, 2.4, 5.8, 7.1, 3.2, -1.6, -3.4][i], 1)} kW`,
      `PUE ${n(1.18 + [0, 0, 0.01, 0.01, 0, 0, -0.01][i], 2)}`,
    );
  },
  scenarios,
};

// Guided scenarios. `t(sl, en)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
  const celsius = (v) => `${n(v, 1)} °C`;
  const percent = (v) => t(`${Math.round(v)} %`, `${Math.round(v)}%`);
  const depth = (v) => `${Math.round(v)} mm`;
  const dry = t("Suho", "Dry");
  return [
    {
      // One reading followed from the sensor to the command it leads to.
      id: "how-it-works",
      intro: true,
      title: t(
        "Kako deluje: od senzorja do odločitve",
        "How it works: sensor to decision",
      ),
      setup(api) {
        api.showFlow(true);
        ALL.forEach((id) => api.setLevel(id, 0));
        api.setAlarms([]);
        api.pin("lux");
        api.narrate({
          rule: t("Čaka na naslednjo meritev", "Waiting for next reading"),
        });
      },
      steps: [
        {
          time: "19:52",
          focus: { x: 900, y: 110, zoom: 1.6, radius: 0.24 },
          title: t("Senzor meri", "A sensor measures"),
          text: t(
            "Senzor svetlobe LIGHT_04 na strehi meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut – enako kot senzorji na omarah.",
            "Light sensor LIGHT_04 on the roof measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes – just like the sensors on the racks.",
          ),
          run() {},
        },
        {
          time: "19:52",
          title: t(
            "Radio jo ponese do prehoda",
            "Radio carries it to the gateway",
          ),
          text: t(
            "Meritev po radiu LoRaWAN potuje do prehoda GW_04 na strehi. En prehod pokrije vsa tri nadstropja, zato noben senzor ne potrebuje kabla – ne na omari ne pod dvignjenim podom.",
            "The reading travels by LoRaWAN radio to gateway GW_04 on the roof. One gateway covers all three levels, so no sensor needs a cable – neither on a rack nor under the raised floor.",
          ),
          run(api) {
            api.send("lux");
            api.log(
              t(
                "LIGHT_04 · Svetloba okolice pod 25 lx",
                "LIGHT_04 · Ambient light below 25 lx",
              ),
              "19:52",
              "reading",
            );
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
            api.log(
              t(
                "GW_04 → Nexavia · meritev shranjena",
                "GW_04 → Nexavia · reading stored",
              ),
              "19:52",
              "system",
            );
          },
        },
        {
          time: "19:53",
          title: t("Pravilo odloči", "A rule decides"),
          text: t(
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge zunanje svetilke.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to switch on the outdoor lamps first.",
          ),
          run(api) {
            api.spotlight(".twin-rule");
            api.narrate({
              rule: t(
                "Pogoj izpolnjen · svetloba < 25 lx",
                "Condition met · light < 25 lx",
              ),
            });
            api.log(
              t(
                "Pravilo svetloba < 25 lx izpolnjeno → vklop zunanjih svetilk",
                "Rule light < 25 lx met → outdoor lamps on",
              ),
              "19:53",
              "decision",
            );
          },
        },
        {
          time: "19:53",
          focus: VIEW.outdoors,
          title: t("Ukaz gre nazaj", "A command goes back"),
          text: t(
            "Nexavia prek prehoda pošlje ukaz vsaki zunanji svetilki – rumeni paketi. Svetilke potrdijo in nadzorna plošča jih prikaže kot vklopljene.",
            "Nexavia sends a command back through the gateway to each outdoor lamp – the yellow packets. The lamps confirm, and the dashboard shows them on.",
          ),
          run(api) {
            LAMPS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(api.$row("LAMP_01"));
            api.log(
              t(
                "LAMP_01–LAMP_03 · Ukaz: vklop",
                "LAMP_01–LAMP_03 · Command: switch on",
              ),
              "19:53",
              "command",
            );
          },
        },
        {
          time: "19:54",
          title: t("Vse je zabeleženo", "Everything is on record"),
          text: t(
            "Časovnica hrani celotno verigo: meritev, odločitev, ukaz. Zdaj poskusite sami – kliknite senzor na kateri koli omari, da pošlje meritev, ali preklopite luč.",
            "The timeline keeps the whole chain: reading, decision, command. Now try it yourself – click the sensor on any rack to send a reading, or switch a light.",
          ),
          run(api) {
            api.spotlight(".twin-event");
          },
        },
      ],
    },
    {
      id: "hot-rack",
      title: t("Omara se pregreva", "A rack overheats"),
      setup(api) {
        api.setReading("r206", celsius(24.4));
        api.setReading("r206-rh", percent(45));
        api.setLevel("FLOOR_02", 1);
        api.setAlarms([]);
        api.pin("r206");
        api.narrate({
          rule: t(
            "Pravilo: vstopni zrak omare > 30 °C",
            "Rule: rack inlet air > 30 °C",
          ),
        });
      },
      steps: [
        {
          time: "14:05",
          focus: VIEW.level2,
          title: t("Vsaka omara ima svoj senzor", "Every rack has its sensor"),
          text: t(
            "Senzor RACK_206 na vratih omare 2.06 meri temperaturo in vlago vstopnega zraka. Ker meri vsaka omara posebej, se vroča točka pokaže tam, kjer nastane – ne šele v povprečju dvorane.",
            "Sensor RACK_206 on the door of rack 2.06 measures the temperature and humidity of the inlet air. With a sensor on every rack, a hot spot shows where it starts – not only in the hall's average.",
          ),
          run(api) {
            api.spotlight(api.$reading("level-2"));
          },
        },
        {
          time: "14:20",
          title: t("Ventil hladilnika se zatakne", "A cooler's valve sticks"),
          text: t(
            "Ventil hladilne vode na hladilniku ob omari 2.06 se zatakne v zaprtem položaju. Strežniki delajo naprej, vstopni zrak pa se segreva.",
            "The cooling-water valve of the in-row cooler next to rack 2.06 sticks shut. The servers keep running, but their inlet air warms up.",
          ),
          run(api, play) {
            play.count("r206", 24.4, 28.6, celsius);
            api.log(
              t("RACK_206 · 28,6 °C · narašča", "RACK_206 · 28.6 °C · rising"),
              "14:20",
              "reading",
            );
          },
        },
        {
          time: "14:26",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t(
            "Vstopni zrak preseže 30 °C. Nexavia odpre alarm, še preden se strežniki začnejo sami zaščitno ustavljati.",
            "The inlet air passes 30 °C. Nexavia opens an alarm before the servers start to throttle and shut down to protect themselves.",
          ),
          run(api, play) {
            play.count("r206", 28.6, 31.4, celsius);
            api.setAlarms([
              ["RACK_206", t("31,4 °C · meja 30 °C", "31.4 °C · limit 30 °C")],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "RACK_206 · Alarm: vstopni zrak 31,4 °C",
                "RACK_206 · Alarm: inlet air 31.4 °C",
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
          ),
          text: t(
            "Nexavia hladilnikoma na obeh straneh pošlje ukaz za največji pretok, dežurni tehnik pa prejme obvestilo z zgodovino meritev omare.",
            "Nexavia commands the coolers on either side to full flow, and the technician on duty gets a notification with the rack's reading history.",
          ),
          run(api, play) {
            play.count("r206", 31.4, 29.2, celsius);
            play.toast(
              t("Alarm: omara 2.06", "Alarm: rack 2.06"),
              t(
                "Vstopni zrak 31,4 °C · preverite hladilnik",
                "Inlet air 31.4 °C · check the cooler",
              ),
              "14:27",
            );
            api.log(
              t(
                "COOLER_206, COOLER_207 · Ukaz: pretok 100 %",
                "COOLER_206, COOLER_207 · Command: flow 100%",
              ),
              "14:27",
              "command",
            );
          },
        },
        {
          time: "15:10",
          title: t("Ventil zamenjan", "The valve is replaced"),
          text: t(
            "Tehnik zamenja pogon ventila. Temperatura pade pod mejo in alarm se zapre. Noben strežnik se ni ustavil, dogodek pa ostane v evidenci.",
            "The technician replaces the valve actuator. The temperature falls below the limit and the alarm closes. No server stopped, and the event stays on record.",
          ),
          run(api, play) {
            play.count("r206", 29.2, 24.6, celsius);
            api.setAlarms([]);
            api.spotlight(api.$reading("level-2"));
            api.log(
              t(
                "RACK_206 · 24,6 °C · alarm zaprt",
                "RACK_206 · 24.6 °C · alarm closed",
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
      title: t("Voda pod dvignjenim podom", "Water under the raised floor"),
      setup(api) {
        api.setReading("leak-1", depth(0), dry);
        api.setLevel("FLOOR_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("leak-1");
        api.narrate({
          rule: t(
            "Pravilo: voda pod podom → zapora ventila",
            "Rule: water under the floor → valve closed",
          ),
        });
      },
      steps: [
        {
          time: "03:12",
          focus: VIEW.level1,
          title: t("Cevi tečejo pod podom", "The pipes run under the floor"),
          text: t(
            "Strežniki so hlajeni z vodo: dovod in povratek tečeta pod dvignjenim podom vsakega nadstropja. Senzor izliva LEAK_01 s tipalnim kablom nadzira dno praznine. Ponoči v dvorani ni nikogar.",
            "The servers are water-cooled: supply and return run under each level's raised floor. Leak detector LEAK_01 watches the bottom of the void with its sensing cable. At night nobody is in the hall.",
          ),
          run(api) {
            api.spotlight(api.$reading("leak-1"));
          },
        },
        {
          time: "03:40",
          title: t("Spoj začne puščati", "A joint starts to leak"),
          text: t(
            "Tesnilo na spoju dovodne cevi popusti. Voda se nabira pod podom, kjer je nihče ne vidi – senzor jo zazna pri prvem milimetru.",
            "A seal on a supply pipe joint gives way. Water collects under the floor where nobody can see it – the detector senses the first millimetre.",
          ),
          run(api, play) {
            play.count("leak-1", 0, 2, depth, t("Voda zaznana", "Water found"));
            api.setAlarms([
              [
                "LEAK_01",
                t(
                  "Voda pod podom · 1. nadstropje",
                  "Water under the floor · level 1",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "LEAK_01 · Alarm: voda pod dvignjenim podom",
                "LEAK_01 · Alarm: water under the raised floor",
              ),
              "03:40",
              "alarm",
            );
          },
        },
        {
          time: "03:40",
          focus: VIEW.plant,
          title: t("Nexavia zapre zanko", "Nexavia closes the loop"),
          text: t(
            "Pravilo ne čaka na človeka: Nexavia zapre ventil hladilne zanke 1. nadstropja, hlajenje omar pa prevzame rezervna zanka.",
            "The rule does not wait for a person: Nexavia closes the valve of the level 1 cooling loop, and the standby loop takes over the racks' cooling.",
          ),
          run(api) {
            api.pin("cooling");
            api.log(
              t(
                "VALVE_01 · Ukaz: zapri zanko 1. nadstropja",
                "VALVE_01 · Command: close the level 1 loop",
              ),
              "03:40",
              "command",
            );
          },
        },
        {
          time: "03:41",
          focus: VIEW.level1,
          title: t("Dežurni dobi klic", "The person on call is alerted"),
          text: t(
            "Dežurni prejme SMS in klic z nadstropjem in mestom izliva. Nexavia prižge luči v 1. nadstropju, da lahko takoj dvigne talne plošče.",
            "The person on call gets an SMS and a call naming the level and where the leak is. Nexavia switches on the level 1 lights so the floor tiles can be lifted straight away.",
          ),
          run(api, play) {
            api.pin("leak-1");
            api.setLevel("FLOOR_01", 1);
            api.spotlight(api.$row("FLOOR_01"));
            play.count("leak-1", 2, 3, depth, t("Voda zaznana", "Water found"));
            play.toast(
              t("Alarm: izliv vode", "Alarm: water leak"),
              t("1. nadstropje · zanka zaprta", "Level 1 · loop closed"),
              "03:41",
            );
            api.log(
              t(
                "FLOOR_01 · Razsvetljava vklopljena za dežurnega",
                "FLOOR_01 · Lights on for the person on call",
              ),
              "03:41",
              "command",
            );
          },
        },
        {
          time: "05:20",
          title: t("Spoj zatesnjen, pod suh", "Joint sealed, floor dry"),
          text: t(
            "Dežurni zatesni spoj in posuši praznino. Senzor spet javi suho, alarm se zapre in zanka se odpre. Voda ni dosegla napajalnih kablov.",
            "The person on call seals the joint and dries the void. The detector reports dry again, the alarm closes and the loop reopens. The water never reached the power cables.",
          ),
          run(api, play) {
            play.count("leak-1", 3, 0, depth, dry);
            api.setAlarms([]);
            api.setLevel("FLOOR_01", 0);
            api.spotlight(api.$reading("leak-1"));
            api.log(
              t("LEAK_01 · Suho · alarm zaprt", "LEAK_01 · Dry · alarm closed"),
              "05:20",
              "alarm",
            );
          },
        },
      ],
    },
    {
      id: "humidity",
      title: t("Vlaga in kondenz", "Humidity and condensation"),
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
          ),
        });
      },
      steps: [
        {
          time: "16:30",
          focus: VIEW.level3,
          title: t("Suh zrak v dvorani", "Dry air in the hall"),
          text: t(
            "Senzorji na omarah poleg temperature merijo tudi vlago. Ob hladnih ceveh vodnega hlajenja je pomembna: prevlažen zrak na njih kondenzira.",
            "Besides temperature, the sensors on the racks measure humidity. Next to cold water-cooling pipes it matters: air that is too humid condenses on them.",
          ),
          run() {},
        },
        {
          time: "17:10",
          title: t("Nevihta in odprta loputa", "A storm and an open damper"),
          text: t(
            "Loputa svežega zraka ostane po vzdrževanju odprta, zunaj pa je soparno pred nevihto. Vlaga ob omarah 3. nadstropja narašča.",
            "A fresh-air damper is left open after maintenance, and it is muggy outside before a storm. Humidity at the level 3 racks climbs.",
          ),
          run(api, play) {
            play.count("r304-rh", 46, 58, percent);
            api.log(
              t(
                "RACK_304 · Vlaga 58 % · narašča",
                "RACK_304 · Humidity 58% · rising",
              ),
              "17:10",
              "reading",
            );
          },
        },
        {
          time: "17:22",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t(
            "Vlaga je nad 60 % že 10 minut. Nexavia odpre alarm in zviša temperaturo dovoda hladilne vode nad rosišče, da se na ceveh ne nabira kondenz.",
            "Humidity has been above 60% for 10 minutes. Nexavia opens an alarm and raises the cooling-water supply temperature above the dew point, so nothing condenses on the pipes.",
          ),
          run(api, play) {
            play.count("r304-rh", 58, 64, percent);
            api.setAlarms([
              [
                "RACK_304",
                t("Vlaga 64 % · meja 60 %", "Humidity 64% · limit 60%"),
              ],
            ]);
            api.spotlight(".twin-alerts");
            play.toast(
              t("Alarm: vlaga v dvorani", "Alarm: hall humidity"),
              t(
                "3. nadstropje · 64 % · zaprite loputo",
                "Level 3 · 64% · close the damper",
              ),
              "17:22",
            );
            api.log(
              t(
                "CHW_01 · Ukaz: dovod hladilne vode +2 °C",
                "CHW_01 · Command: cooling-water supply +2 °C",
              ),
              "17:22",
              "command",
            );
          },
        },
        {
          time: "18:05",
          title: t("Zrak je spet suh", "The air is dry again"),
          text: t(
            "Tehnik zapre loputo, razvlaževanje zniža vlago pod mejo in alarm se zapre. Dovod hladilne vode se vrne na običajno temperaturo.",
            "The technician closes the damper, dehumidifying brings humidity below the limit and the alarm closes. The cooling-water supply returns to its usual temperature.",
          ),
          run(api, play) {
            play.count("r304-rh", 64, 47, percent);
            api.setAlarms([]);
            api.log(
              t(
                "RACK_304 · Vlaga 47 % · alarm zaprt",
                "RACK_304 · Humidity 47% · alarm closed",
              ),
              "18:05",
              "alarm",
            );
          },
        },
      ],
    },
  ];
}
