import { initTraffic } from "./traffic.js";
import geometry from "../../components/nexavia/showcase/industry-geometry.json";

// The industry twin: a manufacturing plant and a supermarket, both shown in
// section, with their lighting under one rule, climate sensors in the plant
// and temperature sensors on the store's refrigeration. Driven by twin.js; the
// maquette and its geometry come from scripts/generate-industry-maquette.mjs.

const LAMPS = ["LAMP_01", "LAMP_02", "LAMP_03", "LAMP_04"];
const ALL = ["FACTORY_01", "MARKET_01", "SIGN_01", ...LAMPS];
const off = () => Array(ALL.length).fill(0);
// Camera framings on the model (scene pixels).
const VIEW = {
  plant: { x: 480, y: 250, zoom: 1.5, radius: 0.34 },
  hall: { x: 440, y: 210, zoom: 1.5, radius: 0.3 },
  warehouse: { x: 680, y: 210, zoom: 1.5, radius: 0.28 },
  store: { x: 1060, y: 240, zoom: 1.5, radius: 0.34 },
  chillers: { x: 940, y: 160, zoom: 1.5, radius: 0.28 },
  freezers: { x: 1170, y: 220, zoom: 1.5, radius: 0.28 },
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
      name: t("Proizvodna hala", "Production hall"),
      watts: 2400,
    },
    {
      id: "MARKET_01",
      name: t("Prodajni prostor", "Sales floor"),
      watts: 1800,
    },
    {
      id: "SIGN_01",
      name: t("Svetlobni napis", "Illuminated sign"),
      watts: 120,
    },
    { id: "LAMP_01", name: t("Svetilka dvorišča 1", "Yard lamp 1"), watts: 90 },
    { id: "LAMP_02", name: t("Svetilka dvorišča 2", "Yard lamp 2"), watts: 90 },
    {
      id: "LAMP_03",
      name: t("Svetilka parkirišča 1", "Car park lamp 1"),
      watts: 90,
    },
    {
      id: "LAMP_04",
      name: t("Svetilka parkirišča 2", "Car park lamp 2"),
      watts: 90,
    },
  ],
  group: {
    ids: LAMPS,
    subject: "LAMP_01–LAMP_04",
    name: (t) => t("Zunanje svetilke", "Outdoor lamps"),
  },
  counters: [],
  steps: (t) => [
    {
      at: "day",
      text: t(
        "Senzor LIGHT_03: 52 lx · dovolj dnevne svetlobe",
        "Sensor LIGHT_03: 52 lx · enough daylight",
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
            "LIGHT_03 · Svetloba okolice 52 lx",
            "LIGHT_03 · Ambient light 52 lx",
          ),
        ],
      ],
    },
    {
      at: "dusk",
      text: t(
        "Senzor LIGHT_03: 21 lx · sonce zahaja",
        "Sensor LIGHT_03: 21 lx · the sun is setting",
      ),
      lux: 21,
      states: off(),
      rule: t(
        "Pogoj izpolnjen · ukaz se pošilja prek GW_03",
        "Condition met · command sent via GW_03",
      ),
      log: [
        [
          "reading",
          t(
            "LIGHT_03 · Svetloba okolice 21 lx · prek prehoda GW_03",
            "LIGHT_03 · Ambient light 21 lx · via gateway GW_03",
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
        "Na dvorišču in parkirišču se prižgejo svetilke",
        "The yard and car park lamps switch on",
      ),
      lux: 21,
      states: [0, 0, 0, 1, 1, 1, 1],
      rule: t(
        "Aktivno · najprej varna pot do vozil",
        "Active · safe way to the vehicles first",
      ),
      log: [
        [
          "command",
          t(
            "LAMP_01–LAMP_04 · Zunanje svetilke vklopljene",
            "LAMP_01–LAMP_04 · Outdoor lamps switched on",
          ),
        ],
      ],
    },
    {
      at: "dusk+20",
      text: t("Zasveti napis supermarketa", "The supermarket sign lights up"),
      lux: 21,
      states: [0, 0, 1, 1, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
      ),
      log: [
        [
          "command",
          t(
            "SIGN_01 · Svetlobni napis vklopljen",
            "SIGN_01 · Illuminated sign switched on",
          ),
        ],
      ],
    },
    {
      at: "dusk+30",
      text: t(
        "V prodajnem prostoru se prižgejo luči",
        "The sales floor lights switch on",
      ),
      lux: 21,
      states: [0, 1, 1, 1, 1, 1, 1],
      rule: t(
        "Aktivno · samodejni vklop razsvetljave",
        "Active · automatic lighting control",
      ),
      log: [
        [
          "command",
          t(
            "MARKET_01 · Razsvetljava vklopljena",
            "MARKET_01 · Lighting switched on",
          ),
        ],
      ],
    },
    {
      at: "dusk+40",
      text: t(
        "Popoldanska izmena dobi polno svetlobo",
        "The late shift gets full light",
      ),
      lux: 21,
      states: [1, 1, 1, 1, 1, 1, 1],
      rule: t("Samodejna razsvetljava je aktivna", "Automatic lighting active"),
      log: [
        [
          "command",
          t(
            "FACTORY_01 · Razsvetljava hale vklopljena",
            "FACTORY_01 · Hall lighting switched on",
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
            "LIGHT_03 · Svetloba okolice 52 lx",
            "LIGHT_03 · Ambient light 52 lx",
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
      t(`Vlaga ${hallRh} %`, `Humidity ${hallRh}%`),
    );
    setReading("hall-rh", t(`${hallRh} %`, `${hallRh}%`));
    const whTemp = `${n(18.6 + [0, 0.1, 0.2, 0.2, 0.1, 0, -0.1][i], 1)} °C`;
    const whRh = 48 + [0, 1, 2, 1, 0, -1, 0][i];
    setReading("wh-rh", t(`${whRh} %`, `${whRh}%`), whTemp);
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
  },
  scenarios,
};

// Guided scenarios. `t(sl, en)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
  const celsius = (v) => `${n(v, 1)} °C`;
  const percent = (v) => t(`${Math.round(v)} %`, `${Math.round(v)}%`);
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
          focus: { x: 560, y: 130, zoom: 1.6, radius: 0.24 },
          title: t("Senzor meri", "A sensor measures"),
          text: t(
            "Senzor svetlobe LIGHT_03 na zidu proizvodne hale meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut.",
            "Light sensor LIGHT_03 on the production hall wall measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes.",
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
            "Meritev po radiu LoRaWAN potuje do prehoda GW_03. En prehod pokrije oba objekta, zato noben senzor ne potrebuje kabla – niti tisti v hladilnici.",
            "The reading travels by LoRaWAN radio to gateway GW_03. One gateway covers both buildings, so no sensor needs a cable – not even the one in the cold room.",
          ),
          run(api) {
            api.send("lux");
            api.log(
              t(
                "LIGHT_03 · Svetloba okolice pod 25 lx",
                "LIGHT_03 · Ambient light below 25 lx",
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
                "GW_03 → Nexavia · meritev shranjena",
                "GW_03 → Nexavia · reading stored",
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
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da najprej prižge svetilke na dvorišču in parkirišču.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to light the yard and the car park first.",
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
                "LAMP_01–LAMP_04 · Ukaz: vklop",
                "LAMP_01–LAMP_04 · Command: switch on",
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
      id: "chiller",
      title: t("Okvara hladilne vitrine", "A chiller fails"),
      setup(api) {
        api.setReading("fridge-dairy", celsius(3.8), t("Normalno", "Normal"));
        api.setReading("coldroom", celsius(2.1));
        api.setLevel("MARKET_01", 1);
        api.setAlarms([]);
        api.pin("fridge-dairy");
        api.narrate({
          rule: t(
            "Pravilo: vitrina > 8 °C dlje kot 10 min",
            "Rule: chiller > 8 °C for over 10 min",
          ),
        });
      },
      steps: [
        {
          time: "10:20",
          focus: VIEW.chillers,
          title: t("Običajno dopoldne", "An ordinary morning"),
          text: t(
            "Senzor FRIDGE_01 v vitrini z mlečnimi izdelki meri temperaturo vsakih 5 minut. Zapis meritev je obenem evidenca HACCP – brez ročnega vpisovanja.",
            "Sensor FRIDGE_01 in the dairy chiller measures the temperature every 5 minutes. The record doubles as the HACCP log – nothing to write down by hand.",
          ),
          run(api) {
            api.spotlight(api.$reading("fridge-dairy"));
          },
        },
        {
          time: "10:45",
          title: t("Kompresor odpove", "The compressor fails"),
          text: t(
            "Kompresor vitrine se ustavi. Kupci tega ne opazijo, temperatura pa začne naraščati.",
            "The chiller's compressor stops. Shoppers notice nothing, but the temperature starts to climb.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              3.8,
              7.2,
              celsius,
              t("Narašča", "Rising"),
            );
            api.log(
              t("FRIDGE_01 · 7,2 °C · narašča", "FRIDGE_01 · 7.2 °C · rising"),
              "10:45",
              "reading",
            );
          },
        },
        {
          time: "10:57",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t(
            "Temperatura je nad 8 °C že več kot 10 minut. Nexavia odpre alarm, še preden je blago ogroženo.",
            "The temperature has been above 8 °C for more than 10 minutes. Nexavia opens an alarm before the goods are at risk.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              7.2,
              9.4,
              celsius,
              t("Nad mejo", "Over the limit"),
            );
            api.setAlarms([
              [
                "FRIDGE_01",
                t(
                  "9,4 °C · meja 8 °C · 10 min",
                  "9.4 °C · limit 8 °C · 10 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "FRIDGE_01 · Alarm: previsoka temperatura",
                "FRIDGE_01 · Alarm: temperature too high",
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
          ),
          text: t(
            "Poslovodja prejme obvestilo na telefon, servis hladilne tehnike pa nalog z zgodovino meritev. Osebje blago preloži v hladilnico.",
            "The store manager gets a notification on the phone, and the refrigeration service a work order with the reading history. Staff move the goods to the cold room.",
          ),
          run(api, play) {
            api.pin("coldroom");
            api.spotlight(api.$reading("coldroom"));
            play.toast(
              t("Alarm: hladilna vitrina", "Alarm: chiller"),
              t(
                "Mlečni izdelki · 9,4 °C · preložite blago",
                "Dairy · 9.4 °C · move the goods",
              ),
              "10:58",
            );
            api.log(
              t(
                "FRIDGE_01 · Obveščena poslovodja in servis",
                "FRIDGE_01 · Manager and service notified",
              ),
              "10:58",
              "notify",
            );
          },
        },
        {
          time: "12:30",
          focus: VIEW.chillers,
          title: t("Vitrina spet hladi", "The chiller cools again"),
          text: t(
            "Serviser zamenja rele kompresorja. Temperatura pade pod mejo in alarm se zapre. Blago ni bilo zavrženo, dogodek pa ostane v evidenci.",
            "The technician replaces the compressor relay. The temperature falls below the limit and the alarm closes. No goods were thrown away, and the event stays on record.",
          ),
          run(api, play) {
            play.count(
              "fridge-dairy",
              9.4,
              3.9,
              celsius,
              t("Normalno", "Normal"),
            );
            api.setAlarms([]);
            api.pin("fridge-dairy");
            api.spotlight(api.$reading("fridge-dairy"));
            api.log(
              t(
                "FRIDGE_01 · 3,9 °C · alarm zaprt",
                "FRIDGE_01 · 3.9 °C · alarm closed",
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
      title: t("Zamrzovalnik ponoči", "A freezer at night"),
      setup(api) {
        api.setReading("freezer", celsius(-21.4), t("Normalno", "Normal"));
        api.setLevel("MARKET_01", 0);
        api.setLevel("SIGN_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setAlarms([]);
        api.pin("freezer");
        api.narrate({
          rule: t(
            "Pravilo: zamrzovalnik > −15 °C dlje kot 10 min",
            "Rule: freezer > −15 °C for over 10 min",
          ),
        });
      },
      steps: [
        {
          time: "02:10",
          focus: VIEW.freezers,
          title: t("Trgovina je zaprta", "The store is closed"),
          text: t(
            "Ponoči v trgovini ni nikogar. Senzor FREEZER_01 v zamrzovalnih skrinjah meri naprej.",
            "At night nobody is in the store. Sensor FREEZER_01 in the chest freezers keeps measuring.",
          ),
          run(api) {
            api.spotlight(api.$reading("freezer"));
          },
        },
        {
          time: "02:40",
          title: t("Izpad varovalke", "A breaker trips"),
          text: t(
            "Varovalka tokokroga zamrzovalnih skrinj izpade. Temperatura se počasi dviga.",
            "The breaker on the chest freezers' circuit trips. The temperature rises slowly.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -21.4,
              -16.8,
              celsius,
              t("Narašča", "Rising"),
            );
            api.log(
              t(
                "FREEZER_01 · −16,8 °C · narašča",
                "FREEZER_01 · −16.8 °C · rising",
              ),
              "02:40",
              "reading",
            );
          },
        },
        {
          time: "03:05",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t(
            "Temperatura preseže −15 °C in tam ostane. Brez nadzora bi napako opazili šele zjutraj – z odtajanim blagom.",
            "The temperature passes −15 °C and stays there. Without monitoring, the fault would be found in the morning – with the stock thawed.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -16.8,
              -13.9,
              celsius,
              t("Nad mejo", "Over the limit"),
            );
            api.setAlarms([
              [
                "FREEZER_01",
                t(
                  "−13,9 °C · meja −15 °C · 10 min",
                  "−13.9 °C · limit −15 °C · 10 min",
                ),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "FREEZER_01 · Alarm: zamrzovalnik se segreva",
                "FREEZER_01 · Alarm: freezer warming up",
              ),
              "03:05",
              "alarm",
            );
          },
        },
        {
          time: "03:06",
          focus: VIEW.store,
          title: t("Dežurni dobi klic", "The person on call is alerted"),
          text: t(
            "Dežurni prejme SMS in klic. Nexavia prižge luči v prodajnem prostoru, da lahko takoj pregleda zamrzovalnike.",
            "The person on call gets an SMS and a call. Nexavia switches on the sales floor lights so the freezers can be checked straight away.",
          ),
          run(api, play) {
            api.setLevel("MARKET_01", 1);
            api.spotlight(api.$row("MARKET_01"));
            play.toast(
              t("Alarm: zamrzovalnik", "Alarm: freezer"),
              t("Zamrzovalne skrinje · −13,9 °C", "Chest freezers · −13.9 °C"),
              "03:06",
            );
            api.log(
              t(
                "MARKET_01 · Razsvetljava vklopljena za dežurnega",
                "MARKET_01 · Lights on for the person on call",
              ),
              "03:06",
              "command",
            );
          },
        },
        {
          time: "03:40",
          focus: VIEW.freezers,
          title: t("Blago rešeno", "The stock is saved"),
          text: t(
            "Dežurni vklopi varovalko. Skrinje se ohladijo, alarm se zapre in luči ugasnejo. Zamrznjeno blago je ostalo ves čas pod −12 °C.",
            "The person on call resets the breaker. The freezers cool down, the alarm closes and the lights go out. The frozen stock stayed below −12 °C throughout.",
          ),
          run(api, play) {
            play.count(
              "freezer",
              -13.9,
              -20.6,
              celsius,
              t("Normalno", "Normal"),
            );
            api.setAlarms([]);
            api.setLevel("MARKET_01", 0);
            api.spotlight(api.$reading("freezer"));
            api.log(
              t(
                "FREEZER_01 · −20,6 °C · alarm zaprt",
                "FREEZER_01 · −20.6 °C · alarm closed",
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
      title: t("Vlaga v skladišču", "Humidity in the warehouse"),
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
          ),
        });
      },
      steps: [
        {
          time: "13:10",
          focus: VIEW.warehouse,
          title: t("Suho skladišče", "A dry warehouse"),
          text: t(
            "Senzor WH_TH_01 med regali meri vlago in temperaturo. Kartonska embalaža in kovinski deli potrebujejo suh zrak.",
            "Sensor WH_TH_01 among the racks measures humidity and temperature. Cardboard packaging and metal parts need dry air.",
          ),
          run(api) {
            api.spotlight(api.$reading("wh-rh"));
          },
        },
        {
          time: "13:50",
          title: t("Nevihta in odprta rampa", "A storm and an open dock"),
          text: t(
            "Med razkladanjem tovornjaka so vrata nakladalne rampe odprta, zunaj pa lije. Vlaga v skladišču hitro narašča.",
            "The dock door is open while a lorry is unloaded, and it is pouring outside. Humidity in the warehouse rises fast.",
          ),
          run(api, play) {
            play.count("wh-rh", 48, 63, percent, celsius(19.1));
            api.setReading("wh-temp", celsius(19.1));
            api.log(
              t(
                "WH_TH_01 · Vlaga 63 % · narašča",
                "WH_TH_01 · Humidity 63% · rising",
              ),
              "13:50",
              "reading",
            );
          },
        },
        {
          time: "14:05",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t(
            "Vlaga je nad 60 % že 15 minut. Nexavia odpre alarm in obvesti vodjo izmene.",
            "Humidity has been above 60% for 15 minutes. Nexavia opens an alarm and notifies the shift lead.",
          ),
          run(api, play) {
            play.count("wh-rh", 63, 67, percent, celsius(19.3));
            api.setAlarms([
              [
                "WH_TH_01",
                t("Vlaga 67 % · meja 60 %", "Humidity 67% · limit 60%"),
              ],
            ]);
            api.spotlight(".twin-alerts");
            play.toast(
              t("Alarm: vlaga v skladišču", "Alarm: warehouse humidity"),
              t("67 % · zaprite vrata rampe", "67% · close the dock door"),
              "14:05",
            );
            api.log(
              t(
                "WH_TH_01 · Alarm: previsoka vlaga",
                "WH_TH_01 · Alarm: humidity too high",
              ),
              "14:05",
              "alarm",
            );
          },
        },
        {
          time: "14:06",
          title: t("Razvlaževanje se vklopi", "Dehumidifying starts"),
          text: t(
            "Nexavia klimatski napravi pošlje ukaz za razvlaževanje. Vodja izmene da zapreti vrata rampe.",
            "Nexavia commands the air handling unit to dehumidify. The shift lead has the dock door closed.",
          ),
          run(api) {
            api.log(
              t(
                "AHU_01 · Ukaz: razvlaževanje vklopljeno",
                "AHU_01 · Command: dehumidifying on",
              ),
              "14:06",
              "command",
            );
          },
        },
        {
          time: "15:20",
          title: t("Zrak je spet suh", "The air is dry again"),
          text: t(
            "Vlaga pade pod mejo, alarm se zapre in razvlaževanje se izklopi. Blago v regalih je ostalo nepoškodovano.",
            "Humidity falls below the limit, the alarm closes and dehumidifying stops. The goods on the racks are unharmed.",
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
      title: t("Vročina v proizvodni hali", "Heat in the production hall"),
      setup(api) {
        api.setReading(
          "hall-temp",
          celsius(24.6),
          t("Vlaga 44 %", "Humidity 44%"),
        );
        api.setReading("hall-rh", percent(44));
        api.setLevel("FACTORY_01", 1);
        api.setAlarms([]);
        api.pin("hall-temp");
        api.narrate({
          rule: t(
            "Pravilo: temperatura v hali > 30 °C",
            "Rule: hall temperature > 30 °C",
          ),
        });
      },
      steps: [
        {
          time: "11:00",
          focus: VIEW.hall,
          title: t("Poletno dopoldne", "A summer morning"),
          text: t(
            "Senzor HALL_TH_01 pod stropom hale meri temperaturo in vlago. Stroji za brizganje plastike halo dodatno segrevajo.",
            "Sensor HALL_TH_01 under the hall ceiling measures temperature and humidity. The injection moulding machines add their own heat.",
          ),
          run(api) {
            api.spotlight(api.$reading("hall-temp"));
          },
        },
        {
          time: "13:30",
          title: t("Hala se segreva", "The hall heats up"),
          text: t(
            "Zunaj je 34 °C. Temperatura v hali v dveh urah naraste nad 30 °C.",
            "It is 34 °C outside. In two hours the hall temperature climbs past 30 °C.",
          ),
          run(api, play) {
            play.count(
              "hall-temp",
              24.6,
              30.8,
              celsius,
              t("Vlaga 41 %", "Humidity 41%"),
            );
            api.setReading("hall-rh", percent(41));
            api.setAlarms([
              [
                "HALL_TH_01",
                t("30,8 °C · meja 30 °C", "30.8 °C · limit 30 °C"),
              ],
            ]);
            api.spotlight(".twin-alerts");
            api.log(
              t(
                "HALL_TH_01 · Alarm: 30,8 °C v hali",
                "HALL_TH_01 · Alarm: 30.8 °C in the hall",
              ),
              "13:30",
              "alarm",
            );
          },
        },
        {
          time: "13:31",
          focus: VIEW.plant,
          title: t("Prezračevanje na polno", "Ventilation to full"),
          text: t(
            "Nexavia klimatski napravi pošlje ukaz za največji pretok zraka, vodja proizvodnje pa prejme obvestilo za dodaten odmor.",
            "Nexavia commands the air handling unit to full airflow, and the production manager is notified to schedule an extra break.",
          ),
          run(api, play) {
            play.toast(
              t("Vročina v hali", "Heat in the hall"),
              t("30,8 °C · prezračevanje 100 %", "30.8 °C · ventilation 100%"),
              "13:31",
            );
            api.log(
              t(
                "AHU_01 · Ukaz: prezračevanje 100 %",
                "AHU_01 · Command: ventilation 100%",
              ),
              "13:31",
              "command",
            );
          },
        },
        {
          time: "15:10",
          focus: VIEW.hall,
          title: t("Temperatura pade", "The temperature falls"),
          text: t(
            "Temperatura pade pod mejo in alarm se zapre. Trend meritev pokaže, kdaj se hala pregreva – podatek za načrtovanje izmen in senčenja.",
            "The temperature falls below the limit and the alarm closes. The trend shows when the hall overheats – useful for planning shifts and shading.",
          ),
          run(api, play) {
            play.count(
              "hall-temp",
              30.8,
              27.2,
              celsius,
              t("Vlaga 43 %", "Humidity 43%"),
            );
            api.setReading("hall-rh", percent(43));
            api.setAlarms([]);
            api.spotlight(api.$reading("hall-temp"));
            api.log(
              t(
                "HALL_TH_01 · 27,2 °C · alarm zaprt",
                "HALL_TH_01 · 27.2 °C · alarm closed",
              ),
              "15:10",
              "alarm",
            );
          },
        },
      ],
    },
  ];
}
