import { initTraffic } from "./traffic.js";
import { initWater } from "./water.js";
import { initSmoke } from "./smoke.js";

// The smart-city twin: garden house, office building, factory and four street
// lights under one lighting rule, with utility meters and infrastructure
// sensors. Driven by twin.js.

const LAMPS = ["LAMP_01", "LAMP_02", "LAMP_03", "LAMP_04"];
const ALL = ["HOUSE_01", "OFFICE_01", "FACTORY_01", ...LAMPS];
const off = () => Array(ALL.length).fill(0);

export const city = {
  effects: [initTraffic, initWater, initSmoke],
  // The radio gateway on the office roof.
  gateway: { id: "GW_01", at: [1010, 112] },
  devices: (t) => [
    { id: "HOUSE_01", name: t("Hiša z vrtom", "Garden house"), watts: 28 },
    { id: "OFFICE_01", name: t("Poslovna stavba", "Office building"), watts: 120 },
    { id: "FACTORY_01", name: t("Tovarna", "Factory"), watts: 210 },
    { id: "LAMP_01", name: t("Ulična svetilka 1", "Street light 1"), watts: 65 },
    { id: "LAMP_02", name: t("Ulična svetilka 2", "Street light 2"), watts: 62 },
    { id: "LAMP_03", name: t("Ulična svetilka 3", "Street light 3"), watts: 68 },
    { id: "LAMP_04", name: t("Ulična svetilka 4", "Street light 4"), watts: 64 },
  ],
  group: { ids: LAMPS, subject: "LAMP_01–LAMP_04", name: (t) => t("Ulične svetilke", "Street lights") },
  // The cyclist counter only ever counts up.
  counters: ["cyclists"],
  steps: (t) => [
    {
      at: "day",
      text: t("Senzor LIGHT_01: 46 lx · dovolj dnevne svetlobe", "Sensor LIGHT_01: 46 lx · enough daylight"),
      lux: 46,
      states: off(),
      rule: t("Pogoj ni izpolnjen · razsvetljava izklopljena", "Condition not met · lighting is off"),
      log: [["reading", t("LIGHT_01 · Svetloba okolice 46 lx", "LIGHT_01 · Ambient light 46 lx")]],
    },
    {
      at: "dusk",
      text: t("Senzor LIGHT_01: 18 lx · padec svetlobe", "Sensor LIGHT_01: 18 lx · light level drops"),
      lux: 18,
      states: off(),
      rule: t("Pogoj izpolnjen · ukaz se pošilja prek GW_01", "Condition met · command sent via GW_01"),
      log: [
        ["reading", t("LIGHT_01 · Svetloba okolice 18 lx · prek prehoda GW_01", "LIGHT_01 · Ambient light 18 lx · via gateway GW_01")],
        ["decision", t("Pravilo svetloba < 25 lx izpolnjeno (18 lx) → vklop razsvetljave, stavbo za stavbo", "Rule light < 25 lx met (18 lx) → lighting on, one building at a time")],
      ],
    },
    {
      at: "dusk+10",
      text: t("V hiši z vrtom se prižgejo luči", "The garden house lights switch on"),
      lux: 18,
      states: [1, 0, 0, 0, 0, 0, 0],
      rule: t("Aktivno · samodejni vklop razsvetljave", "Active · automatic lighting control"),
      log: [["command", t("HOUSE_01 · Razsvetljava vklopljena", "HOUSE_01 · Lighting switched on")]],
    },
    {
      at: "dusk+20",
      text: t("V poslovni stavbi se prižgejo luči", "The office building lights switch on"),
      lux: 18,
      states: [1, 1, 0, 0, 0, 0, 0],
      rule: t("Aktivno · samodejni vklop razsvetljave", "Active · automatic lighting control"),
      log: [["command", t("OFFICE_01 · Razsvetljava vklopljena", "OFFICE_01 · Lighting switched on")]],
    },
    {
      at: "dusk+30",
      text: t("Tovarna vklopi razsvetljavo", "The factory lights come on"),
      lux: 18,
      states: [1, 1, 1, 0, 0, 0, 0],
      rule: t("Aktivno · prilagoditev svetlosti", "Active · brightness adjustment"),
      log: [["command", t("FACTORY_01 · Razsvetljava vklopljena", "FACTORY_01 · Lighting switched on")]],
    },
    {
      at: "dusk+40",
      text: t("Ulične svetilke zaznajo padec dnevne svetlobe", "Street lights respond to falling daylight"),
      lux: 18,
      states: [1, 1, 1, 1, 1, 1, 1],
      rule: t("Samodejna razsvetljava je aktivna", "Automatic lighting active"),
      log: [["command", t("LAMP_01–LAMP_04 · Ulične svetilke vklopljene", "LAMP_01–LAMP_04 · Street lights switched on")]],
    },
    {
      at: "dawn",
      text: t("Svetloba se vrne · sistem ugasne luči", "Daylight returns · system switches lights off"),
      lux: 46,
      states: off(),
      rule: t("Pogoj ni več izpolnjen · luči izklopljene", "Condition no longer met · lights switched off"),
      log: [
        ["reading", t("LIGHT_01 · Svetloba okolice 46 lx", "LIGHT_01 · Ambient light 46 lx")],
        ["decision", t("Pravilo svetloba < 25 lx ni več izpolnjeno → izklop razsvetljave", "Rule light < 25 lx no longer met → lighting off")],
        ["command", t("Vse luči izklopljene", "All lights switched off")],
      ],
    },
  ],
  // The office sensor stays down; the factory's weak gateway signal clears
  // while the office and factory lights come on.
  alarms: (index) => (index === 3 || index === 4 ? ["OFFICE_01"] : ["OFFICE_01", "FACTORY_01"]),
  tick(index, { setReading, t, n }) {
    const meterDrift = [0, 0.02, 0.01, 0.04, 0.03, 0.06, 0.02][index % 7];
    setReading("house-water", `${n(0.84 + meterDrift, 2)} m³/d`);
    setReading("office-water", `${n(12.6 + meterDrift * 10, 1)} m³/d`);
    setReading("factory-gas", `${n(34.2 + meterDrift * 10, 1)} m³/h`);
    setReading("electricity", `${n(18.6 + meterDrift * 4, 1)} kWh`);
    const sensorDrift = [0, 0.02, -0.01, 0.03, 0.01, -0.02, 0][index % 7];
    const temperature = n(18.7 + sensorDrift * 10, 1);
    const humidity = 56 - (index % 3);
    setReading("vibration", `${n(0.42 + sensorDrift, 2)} mm/s`);
    setReading("water", `${n(1.36 + sensorDrift, 2)} m`);
    setReading("air", `${18 + (index % 3)} µg/m³`, `${temperature} °C · ${humidity}${t(" % RH", "% RH")}`);
    setReading("air-temp", `${temperature} °C`);
    setReading("air-humidity", `${humidity}${t(" %", "%")}`);
  },
  scenarios,
};

// Guided scenarios. `t(sl, en)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarios(t, n) {
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
          focus: { x: 1080, y: 130, zoom: 1.7, radius: 0.22 },
          title: t("Senzor meri", "A sensor measures"),
          text: t(
            "Senzor svetlobe LIGHT_01 na strehi poslovne stavbe meri dnevno svetlobo. Ob mraku pade pod 25 lx. Senzor deluje na baterijo in meritev pošlje vsakih 5 minut.",
            "Light sensor LIGHT_01 on the office roof measures daylight. At dusk it falls below 25 lx. The sensor runs on a battery and reports every 5 minutes.",
          ),
          run() {},
        },
        {
          time: "19:52",
          title: t("Radio jo ponese do prehoda", "Radio carries it to the gateway"),
          text: t(
            "Meritev po radiu LoRaWAN potuje do prehoda GW_01. En prehod pokrije celo mesto, zato noben senzor ne potrebuje kabla.",
            "The reading travels by LoRaWAN radio to gateway GW_01. One gateway covers the whole city, so no sensor needs a cable.",
          ),
          run(api) {
            api.send("lux");
            api.log(t("LIGHT_01 · Svetloba okolice pod 25 lx", "LIGHT_01 · Ambient light below 25 lx"), "19:52", "reading");
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
            api.log(t("GW_01 → Nexavia · meritev shranjena", "GW_01 → Nexavia · reading stored"), "19:52", "system");
          },
        },
        {
          time: "19:53",
          title: t("Pravilo odloči", "A rule decides"),
          text: t(
            "Nexavia vsako novo meritev preveri glede na pravila. Svetloba pod 25 lx izpolni pravilo razsvetljave, zato Nexavia odloči, da prižge luči.",
            "Nexavia checks each new reading against its rules. Light below 25 lx meets the lighting rule, so Nexavia decides to switch the lights on.",
          ),
          run(api) {
            api.spotlight(".twin-rule");
            api.narrate({ rule: t("Pogoj izpolnjen · svetloba < 25 lx", "Condition met · light < 25 lx") });
            api.log(t("Pravilo svetloba < 25 lx izpolnjeno → vklop uličnih svetilk", "Rule light < 25 lx met → street lights on"), "19:53", "decision");
          },
        },
        {
          time: "19:53",
          focus: { x: 900, y: 420, zoom: 1.2, radius: 0.45 },
          title: t("Ukaz gre nazaj", "A command goes back"),
          text: t(
            "Nexavia prek prehoda pošlje ukaz vsaki ulični svetilki – rumeni paketi. Svetilke potrdijo in nadzorna plošča jih prikaže kot vklopljene.",
            "Nexavia sends a command back through the gateway to each street light – the yellow packets. The lights confirm, and the dashboard shows them on.",
          ),
          run(api) {
            LAMPS.forEach((id) => api.setLevel(id, 1));
            api.spotlight(api.$row("LAMP_01"));
            api.log(t("LAMP_01–LAMP_04 · Ukaz: vklop", "LAMP_01–LAMP_04 · Command: switch on"), "19:53", "command");
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
      id: "water-leak",
      title: t("Nočno puščanje vode", "Water leak at night"),
      setup(api) {
        api.setLevel("HOUSE_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setReading("house-water", `${n(0, 2)} m³/h`);
        api.setAlarms([]);
        api.pin("house-water");
        api.narrate({ rule: t("Pravilo: nočni pretok > 0,1 m³/h dlje kot 30 min", "Rule: night flow > 0.1 m³/h for over 30 min") });
      },
      steps: [
        {
          time: "02:10",
          focus: { x: 470, y: 180, zoom: 1.55, radius: 0.24 },
          title: t("Noč v hiši z vrtom", "Night at the garden house"),
          text: t("Vsi spijo, luči so ugasnjene. Ponoči je pretok vode v hiši skoraj nič.", "Everyone is asleep and the lights are off. At night, water flow in the house is close to zero."),
          run(api) {
            api.spotlight(api.$reading("house-water"));
          },
        },
        {
          time: "02:14",
          title: t("Voda začne teči", "Water starts flowing"),
          text: t("Števec HOUSE_WATER_01 zazna stalen pretok, čeprav v hiši nihče ne porablja vode.", "Meter HOUSE_WATER_01 detects a steady flow although nobody in the house is using water."),
          run(api, play) {
            play.count("house-water", 0, 0.36, (v) => `${n(v, 2)} m³/h`);
            api.log(t("HOUSE_WATER_01 · Nočni pretok 0,36 m³/h", "HOUSE_WATER_01 · Night flow 0.36 m³/h"), "02:14", "reading");
          },
        },
        {
          time: "02:44",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t("Po 30 minutah neprekinjenega pretoka Nexavia prepozna sum puščanja in odpre alarm.", "After 30 minutes of uninterrupted flow, Nexavia recognises a suspected leak and opens an alarm."),
          run(api) {
            api.setReading("house-water", `${n(0.36, 2)} m³/h`);
            api.setAlarms([["HOUSE_WATER_01", t("Sum puščanja · 30 min", "Suspected leak · 30 min")]]);
            api.spotlight(".twin-alerts");
            api.log(t("HOUSE_WATER_01 · Alarm: sum puščanja", "HOUSE_WATER_01 · Alarm: suspected leak"), "02:44", "alarm");
          },
        },
        {
          time: "02:45",
          title: t("Obvestilo na telefon", "Notification sent"),
          text: t("Lastnik in vzdrževalec prejmeta SMS in e-pošto. Glavni ventil lahko zapreta na daljavo.", "The owner and the caretaker get an SMS and an email. They can close the main valve remotely."),
          run(api, play) {
            play.toast(t("Sum puščanja vode", "Suspected water leak"), t("Hiša z vrtom · 0,36 m³/h že 30 min", "Garden house · 0.36 m³/h for 30 min"), "02:45");
            api.log(t("Obvestilo poslano · SMS in e-pošta", "Notification sent · SMS and email"), "02:45", "notify");
          },
        },
        {
          time: "02:52",
          title: t("Puščanje ustavljeno", "Leak stopped"),
          text: t("Ventil je zaprt, pretok pade na nič in alarm se zapre. Škoda je preprečena ure pred jutranjim odčitkom.", "The valve is closed, flow drops to zero and the alarm closes. Damage is avoided hours before anyone would have noticed."),
          run(api, play) {
            play.count("house-water", 0.36, 0, (v) => `${n(v, 2)} m³/h`);
            api.setAlarms([]);
            api.spotlight(api.$reading("house-water"));
            api.log(t("HOUSE_WATER_01 · Ventil zaprt · alarm zaprt", "HOUSE_WATER_01 · Valve closed · alarm closed"), "02:52", "command");
          },
        },
      ],
    },
    {
      id: "river",
      title: t("Narasla reka", "Rising river"),
      setup(api) {
        api.setReading("water", `${n(1.36, 2)} m`, t("Normalno območje", "Normal range"));
        api.setReading("vibration", `${n(0.42, 2)} mm/s`, t("Običajno", "Normal"));
        api.setLevel("LAMP_04", 0);
        api.setAlarms([]);
        api.pin("water");
        api.narrate({ rule: t("Pravilo: gladina reke > 1,80 m", "Rule: river level > 1.80 m") });
      },
      steps: [
        {
          time: "14:00",
          focus: { x: 1010, y: 560, zoom: 1.45, radius: 0.3 },
          title: t("Reka ob običajni gladini", "River at its normal level"),
          text: t("Senzor RIVER_LEVEL_01 meri gladino vsakih pet minut, senzor na mostu pa tresljaje konstrukcije.", "Sensor RIVER_LEVEL_01 measures the level every five minutes; the bridge sensor tracks vibration of the structure."),
          run(api) {
            api.spotlight(api.$reading("water"));
          },
        },
        {
          time: "16:20",
          title: t("Močno deževje", "Heavy rain"),
          text: t("Po nalivu gladina hitro narašča – skoraj 30 cm v dveh urah.", "After a downpour the level climbs fast – almost 30 cm in two hours."),
          run(api, play) {
            play.count("water", 1.36, 1.64, (v) => `${n(v, 2)} m`, t("Narašča", "Rising"));
            api.log(t("RIVER_LEVEL_01 · Gladina 1,64 m · narašča", "RIVER_LEVEL_01 · Level 1.64 m · rising"), "16:20", "reading");
          },
        },
        {
          time: "17:05",
          title: t("Opozorilna gladina", "Warning level reached"),
          text: t("Gladina preseže 1,80 m. Nexavia odpre alarm, senzor na mostu hkrati zazna močnejše tresljaje.", "The level passes 1.80 m. Nexavia opens an alarm while the bridge sensor records stronger vibration."),
          run(api, play) {
            play.count("water", 1.64, 1.84, (v) => `${n(v, 2)} m`, t("Opozorilna gladina", "Warning level"));
            api.setReading("vibration", `${n(0.91, 2)} mm/s`, t("Povišano", "Elevated"));
            api.setAlarms([
              ["RIVER_LEVEL_01", t("Opozorilna gladina 1,84 m", "Warning level 1.84 m")],
              ["BRIDGE_VIB_01", t("Povišani tresljaji 0,91 mm/s", "Elevated vibration 0.91 mm/s")],
            ]);
            api.spotlight(".twin-alerts");
            api.log(t("RIVER_LEVEL_01 · Alarm: opozorilna gladina", "RIVER_LEVEL_01 · Alarm: warning level"), "17:05", "alarm");
          },
        },
        {
          time: "17:06",
          focus: { x: 1130, y: 540, zoom: 1.55, radius: 0.24 },
          title: t("Samodejni ukrepi", "Automatic response"),
          text: t("Razsvetljava ob mostu se vklopi za boljšo vidnost, civilna zaščita prejme obvestilo.", "Lighting by the bridge switches on for visibility, and civil protection is notified."),
          run(api, play) {
            api.setLevel("LAMP_04", 1);
            api.spotlight(api.$row("LAMP_04"));
            play.toast(t("Opozorilo: gladina reke", "Warning: river level"), t("1,84 m · obveščena civilna zaščita", "1.84 m · civil protection notified"), "17:06");
            api.log(t("LAMP_04 · Varnostna razsvetljava mostu vklopljena", "LAMP_04 · Bridge safety lighting on"), "17:06", "command");
          },
        },
        {
          time: "22:30",
          focus: { x: 1010, y: 560, zoom: 1.3, radius: 0.34 },
          title: t("Voda upada", "Water recedes"),
          text: t("Gladina pade pod mejo in alarm se samodejno zapre. Celoten dogodek ostane v zgodovini za analizo.", "The level drops below the limit and the alarm closes automatically. The whole event stays in the history for analysis."),
          run(api, play) {
            play.count("water", 1.84, 1.52, (v) => `${n(v, 2)} m`, t("Upada", "Falling"));
            api.setReading("vibration", `${n(0.44, 2)} mm/s`, t("Običajno", "Normal"));
            api.setLevel("LAMP_04", 0);
            api.setAlarms([]);
            api.spotlight(api.$reading("water"));
            api.log(t("RIVER_LEVEL_01 · Gladina 1,52 m · alarm zaprt", "RIVER_LEVEL_01 · Level 1.52 m · alarm closed"), "22:30", "alarm");
          },
        },
      ],
    },
    {
      id: "dimming",
      title: t("Pametno zatemnjevanje", "Smart dimming"),
      setup(api) {
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setReading("cyclists", t("124 danes", "124 today"));
        api.setAlarms([]);
        api.pin(null);
        api.narrate({ rule: t("Pravilo: brez gibanja 30 min → zatemnitev na 50 %", "Rule: no movement for 30 min → dim to 50%") });
      },
      steps: [
        {
          time: "22:00",
          focus: { x: 760, y: 430, zoom: 1.2, radius: 0.46 },
          title: t("Polna razsvetljava", "Full lighting"),
          text: t("Po sončnem zahodu svetijo vse štiri ulične svetilke s polno močjo.", "After sunset all four street lights run at full power."),
          run(api) {
            api.spotlight(api.$ui("power"));
          },
        },
        {
          time: "00:30",
          title: t("Ulice se izpraznijo", "Streets go quiet"),
          text: t("Senzorji pol ure ne zaznajo gibanja. Svetilke se zatemnijo na 50 % – poraba se prepolovi.", "Sensors see no movement for half an hour. The lights dim to 50% and consumption halves."),
          run(api) {
            LAMPS.forEach((id) => api.setLevel(id, 0.5));
            api.spotlight(api.$ui("power"));
            api.log(t("LAMP_01–LAMP_04 · Zatemnitev na 50 %", "LAMP_01–LAMP_04 · Dimmed to 50%"), "00:30", "command");
          },
        },
        {
          time: "01:12",
          focus: { x: 703, y: 440, zoom: 1.6, radius: 0.2 },
          title: t("Kolesar na poti", "A cyclist passes"),
          text: t("Senzor zazna kolesarja in svetilka LAMP_03 za dve minuti spet zasveti s polno močjo.", "A sensor detects a cyclist and LAMP_03 returns to full power for two minutes."),
          run(api) {
            api.setLevel("LAMP_03", 1);
            api.setReading("cyclists", t("125 danes", "125 today"));
            api.spotlight(api.$row("LAMP_03"));
            api.log(t("LAMP_03 · Gibanje zaznano · 100 %", "LAMP_03 · Movement detected · 100%"), "01:12", "reading");
          },
        },
        {
          time: "01:14",
          title: t("Nazaj na varčni način", "Back to saving mode"),
          text: t("Ko je ulica spet prazna, se svetilka ponovno zatemni.", "Once the street is empty again, the light dims back down."),
          run(api) {
            api.setLevel("LAMP_03", 0.5);
            api.log(t("LAMP_03 · Zatemnitev na 50 %", "LAMP_03 · Dimmed to 50%"), "01:14", "command");
          },
        },
        {
          time: "06:40",
          focus: { x: 760, y: 430, zoom: 1.2, radius: 0.46 },
          title: t("Jutro", "Morning"),
          text: t("Ob zori se razsvetljava izklopi. Zatemnjevanje je to noč prihranilo 36 % energije ulične razsvetljave.", "At dawn the lights switch off. Dimming saved 36% of the street-lighting energy tonight."),
          run(api, play) {
            LAMPS.forEach((id) => api.setLevel(id, 0));
            play.toast(t("Prihranek noči", "Tonight's saving"), t("0,80 kWh · 36 % manj energije", "0.80 kWh · 36% less energy"), "06:40");
            api.log(t("Ulična razsvetljava izklopljena · prihranek 0,80 kWh", "Street lighting off · 0.80 kWh saved"), "06:40", "command");
          },
        },
      ],
    },
    {
      id: "gateway",
      title: t("Izpad prehoda", "Gateway outage"),
      setup(api) {
        api.setOnline(ALL, true);
        api.setSync(true);
        api.setStale(false);
        api.setAlarms([]);
        api.pin(null);
        api.narrate({ rule: t("Pravilo: 3 zamujena javljanja → naprava nedosegljiva", "Rule: 3 missed reports → device unreachable") });
      },
      steps: [
        {
          time: "09:00",
          focus: { x: 768, y: 500, zoom: 1, radius: 0.6, spot: false },
          title: t("Vse naprave povezane", "All devices connected"),
          text: t("Vseh sedem naprav pošilja podatke prek prehoda GW_01 v Nexavio.", "All seven devices send their data to Nexavia through gateway GW_01."),
          run(api) {
            api.spotlight(".twin-sync");
          },
        },
        {
          time: "09:12",
          title: t("Prehod ne odgovarja", "The gateway stops responding"),
          text: t("Prehodu GW_01 zmanjka napajanja. Po treh zamujenih javljanjih Nexavia označi naprave kot nedosegljive.", "Gateway GW_01 loses power. After three missed reports Nexavia marks the devices as unreachable."),
          run(api) {
            api.setOnline(ALL, false);
            api.setSync(false);
            api.setAlarms([["GW_01", t("Prehod ne odgovarja · 3 min", "Gateway not responding · 3 min")]]);
            api.spotlight(".twin-table");
            api.log(t("GW_01 · Alarm: prehod ne odgovarja", "GW_01 · Alarm: gateway not responding"), "09:12", "alarm");
          },
        },
        {
          time: "09:13",
          title: t("Zadnje znane vrednosti", "Last known values"),
          text: t("Nadzorna plošča prikaže zadnje znane meritve in jih označi kot zastarele. Naprave na terenu delujejo naprej samostojno.", "The dashboard keeps the last known readings and marks them as stale. Devices in the field carry on working on their own."),
          run(api) {
            api.setStale(true);
            api.spotlight(".twin-meter-readings");
          },
        },
        {
          time: "09:41",
          title: t("Serviser na terenu", "Technician on site"),
          text: t("Nexavia samodejno odpre servisni nalog. Serviser zamenja napajalnik prehoda.", "Nexavia opens a service ticket automatically. A technician replaces the gateway's power supply."),
          run(api, play) {
            play.toast(t("Servisni nalog #2481", "Service ticket #2481"), t("GW_01 · zamenjava napajalnika", "GW_01 · power supply replacement"), "09:41");
            api.log(t("Servisni nalog #2481 odprt · GW_01", "Service ticket #2481 opened · GW_01"), "09:41", "notify");
          },
        },
        {
          time: "09:42",
          title: t("Povezava obnovljena", "Connection restored"),
          text: t("Naprave se ponovno povežejo in pošljejo meritve, shranjene med izpadom. V podatkih ni vrzeli.", "The devices reconnect and upload the readings they stored during the outage. The data has no gaps."),
          run(api) {
            api.setOnline(ALL, true);
            api.setSync(true);
            api.setStale(false);
            api.setAlarms([]);
            api.spotlight(".twin-table");
            api.log(t("GW_01 · 7 naprav ponovno povezanih · 30 min podatkov prenesenih", "GW_01 · 7 devices reconnected · 30 min of data uploaded"), "09:42", "system");
          },
        },
      ],
    },
  ];
}



