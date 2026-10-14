import type { ReadingRow, Sensor, Tone, Twin } from "./types";
import geometry from "./industry-geometry.json";

// The industry maquette, rendered by scripts/generate-industry-maquette.mjs:
// a manufacturing plant and a supermarket, both shown in section. In the plant
// the sensors follow the utilities – electricity, compressed air, gas and
// water – from the yard to every line, and watch the machines for OEE; in the
// store they watch the cold chain, the shoppers and the car park. Hotspots,
// unlit patches and sensor pins come from the generated geometry.
export function industryTwin(en: boolean): Twin {
  const t = (sl: string, english: string) => (en ? english : sl);
  const d = (value: string) => (en ? value : value.replace(".", ","));
  const pct = (value: number | string) => t(`${value} %`, `${value}%`);
  const at = (key: string) =>
    (geometry.points as Record<string, number[]>)[key] as [number, number];
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
  const every1 = t("vsako minuto", "every minute");
  const every5 = t("vsakih 5 min", "every 5 min");
  const every15 = t("vsakih 15 min", "every 15 min");
  const closed = t("Zaprta", "Closed");
  const running = t("Teče", "Running");

  // A pin whose card shows several readings side by side. The first one is
  // the tracked value and carries the pin's key; the others carry their own
  // reading keys.
  const pin = (
    key: string,
    id: string,
    tone: Tone,
    tag: string,
    label: string,
    title: string,
    cells: [label: string, value: string, key?: string][],
    rest: Partial<Sensor> = {},
  ): Sensor => ({
    key,
    id,
    tone,
    tag,
    label,
    event: title,
    at: at(key),
    side: "below",
    every: every5,
    ...rest,
    card: {
      kind: rest.card?.kind ?? "sensor",
      title,
      value: cells[0][1],
      grid: cells.map(([name, value, cell], index) => ({
        label: name,
        key: index ? (cell ?? `${key}-${index}`) : key,
        value,
      })),
    },
  });
  const meter = { kind: "meter" } as Sensor["card"];
  const row = (
    label: string,
    id: string,
    key: string,
    value: string,
    note: string,
  ): ReadingRow => ({ label, id, key, value, note });

  const { total: bays, parked } = geometry.parking;
  const free = bays - parked;

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
        "Stavbi sta prikazani v prerezu. V proizvodnem podjetju meritve sledijo elektriki, komprimiranemu zraku, plinu in vodi od dvorišča do vsake linije, stroji pa poročajo stanje, kose in vibracije – iz tega Nexavia računa OEE in porabo na kos, KAI pa napove okvaro, še preden ustavi linijo. V supermarketu senzorji varujejo hladno verigo od hladilnega agregata do vsake vitrine, štejejo kupce, čakajoče na blagajnah in prosta parkirna mesta. Ob odstopanju Nexavia sproži alarm, obvesti odgovorne in hrani zapis za HACCP.",
        "Both buildings are shown in section. In the manufacturing plant the readings follow electricity, compressed air, gas and water from the yard to every line, and the machines report their state, pieces and vibration – from which Nexavia works out OEE and energy per piece, and KAI predicts a failure before it stops the line. In the supermarket, sensors guard the cold chain from the refrigeration plant to every chiller, and count shoppers, the queue at the checkouts and the free parking bays. When a reading drifts, Nexavia raises an alarm, notifies the people responsible and keeps the HACCP record.",
      ),
    },
    panel: {
      view: t(
        "Pogled v prerezu · povlecite za raziskovanje",
        "Section view · drag to explore",
      ),
      hint: t(
        "Kliknite senzor na stroju, števcu ali v dvorišču, da pošlje meritev, ali halo, trgovino, napis oz. svetilko na dvorišču za vklop in izklop",
        "Click a sensor on a machine, a meter or in the yard to send a reading, or the hall, the store, the sign or a yard lamp to switch it on or off",
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
        "Maketa industrijske cone velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: levo proizvodno podjetje v prerezu s CNC stroji s signalnimi lučmi, montažno linijo z robotoma, stroji za brizganje plastike, terminalom zastojev, skladiščem, klimatsko napravo in pisarno, desno supermarket v prerezu s policami, hladilnimi vitrinami, zamrzovalniki, toplo vitrino in blagajnami, ob njem kondenzatorja hladilnega agregata in zabojnika za odpadke, spredaj dvorišče s tovornjakom, transformatorjem, glavnim razdelilnikom, kompresorsko postajo in silosoma, parkirišče s polnilnicama za električna vozila, vremenska postaja in steber s prikazom prostih parkirnih mest",
        "60 by 60 centimetre industry maquette of four 30 by 30 centimetre modules: on the left a manufacturing plant in section with CNC machines and their stack lights, an assembly line with two robots, injection moulding machines, a downtime terminal, a warehouse, an air handling unit and an office, on the right a supermarket in section with shelves, chillers, freezers, a hot deli counter and checkouts, beside it the refrigeration plant's condensing units and two waste containers, in front a yard with a lorry, a transformer, the main switchboard, a compressor station and two silos, a car park with two electric vehicle chargers, a weather station and a pylon showing the free parking bays",
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
          name: t("Dvorišče · energija", "Yard · utilities"),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Parkirišče · e-mobilnost", "Car park · EV"),
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

        // --- Plant: supply and utilities -----------------------------------
        pin(
          "main-power",
          "MAIN_LV_01",
          "power",
          "kW",
          t(
            "Števec glavnega razdelilnika proizvodnje",
            "Plant main switchboard meter",
          ),
          t("Glavni razdelilnik · proizvodnja", "Main switchboard · plant"),
          [
            [t("Moč", "Load"), d("371.2 kW")],
            [t("Konica danes", "Peak today"), d("388.6 kW"), "main-power-peak"],
            [t("Pogodbena moč", "Contracted"), "400 kW", "main-power-limit"],
            ["cos φ", d("0.96"), "main-power-pf"],
            ["THD", pct(d("4.2")), "main-power-thd"],
            [t("Danes", "Today"), "3920 kWh", "main-power-kwh"],
          ],
          {
            card: meter,
            align: "end",
            alert: 400,
            every: every1,
            uses: t(
              "Pravilo: napoved konice > 400 kW → zamik kompresorja 2 in polnjenja EV",
              "Rule: peak forecast > 400 kW → compressor 2 and EV charging shifted",
            ),
          },
        ),
        pin(
          "factory-power",
          "FACTORY_POWER_01",
          "power",
          "kW",
          t(
            "Razdelilnik proizvodne hale",
            "Production hall distribution board",
          ),
          t("Razdelilnik hale", "Hall distribution board"),
          [
            [t("Moč", "Load"), d("186.4 kW")],
            ["L1", "281 A", "factory-power-l1"],
            ["L2", "268 A", "factory-power-l2"],
            ["L3", "262 A", "factory-power-l3"],
            [t("Napetost", "Voltage"), "231 V", "factory-power-v"],
            [t("Vrata omare", "Cabinet door"), closed, "factory-power-door"],
          ],
          {
            card: meter,
            align: "start",
            every: every15,
            uses: t(
              "Tok in napetost po fazah · izpad napajanja → alarm · odpiranje omare → alarm",
              "Current and voltage per phase · power outage → alarm · cabinet opened → alarm",
            ),
          },
        ),
        pin(
          "air",
          "COMP_01",
          "air",
          "Nm³/h",
          t("Merilnik kompresorske postaje", "Compressor station meter"),
          t("Komprimiran zrak", "Compressed air"),
          [
            [t("Pretok", "Flow"), "540 Nm³/h"],
            [t("Tlak", "Pressure"), d("7.1 bar"), "air-bar"],
            [t("Moč", "Power"), d("52.4 kW"), "air-kw"],
            [t("Temp. komp.", "Comp. temp."), "78 °C", "air-temp"],
            [t("Puščanje", "Leaks"), pct(18), "air-leak"],
            ["kWh/Nm³", d("0.10"), "air-spec"],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "KAI: pretok ob vikendu brez proizvodnje = puščanje → izguba v € na leto",
              "KAI: flow over a weekend with no production = leaks → loss in € per year",
            ),
          },
        ),
        pin(
          "gas",
          "GAS_01",
          "gas",
          "m³/h",
          t("Plinomer proizvodnje", "Plant gas meter"),
          t("Poraba plina", "Gas use"),
          [
            [t("Pretok", "Flow"), d("14.2 m³/h")],
            [t("Danes", "Today"), "168 m³", "gas-day"],
            [t("Tlak", "Pressure"), "22 mbar", "gas-bar"],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Poraba po procesu in stroškovnem mestu · gorilnik izven izmene → anomalija",
              "Use per process and cost centre · burner running outside the shift → anomaly",
            ),
          },
        ),
        pin(
          "water",
          "WATER_01",
          "water",
          "m³/h",
          t("Vodomer proizvodnje", "Plant water meter"),
          t("Poraba vode", "Water use"),
          [
            [t("Pretok", "Flow"), d("1.8 m³/h")],
            [t("Danes", "Today"), d("24.6 m³"), "water-day"],
            [t("Tlak", "Pressure"), d("3.9 bar"), "water-bar"],
            [t("Nočni pretok", "Night flow"), d("0.0 m³/h"), "water-night"],
          ],
          {
            card: meter,
            align: "start",
            every: every15,
            uses: t(
              "Pravilo: neprekinjen nočni pretok > 0,3 m³/h → alarm puščanja",
              "Rule: continuous night flow > 0.3 m³/h → leak alarm",
            ),
          },
        ),
        pin(
          "silo",
          "SILO_01",
          "structure",
          "%",
          t("Radarski senzor nivoja v silosu", "Silo level radar"),
          t("Silosa za granulat", "Granulate silos"),
          [
            [t("Silos 1", "Silo 1"), pct(64)],
            [t("Zaloga", "Stock"), d("18.4 t"), "silo-t"],
            [t("Silos 2", "Silo 2"), pct(41), "silo-2"],
            [t("Dovolj za", "Lasts"), t("4,5 dni", "4.5 days"), "silo-days"],
          ],
          {
            side: "above",
            align: "start",
            every: every15,
            uses: t(
              "Pravilo: nivo < 25 % → samodejno naročilo granulata",
              "Rule: level < 25% → granulate ordered automatically",
            ),
          },
        ),

        // --- Plant: machines and production --------------------------------
        pin(
          "line-cnc",
          "CNC_01–04",
          "power",
          "RUN",
          t("Stanje CNC strojev", "CNC machine states"),
          t("CNC stroji", "CNC machines"),
          [
            [t("Tečejo", "Running"), "2 / 4"],
            [t("CNC 3 · material", "CNC 3 · material"), "IDLE", "line-cnc-3"],
            [t("CNC 4 · orodje", "CNC 4 · tooling"), "STOP", "line-cnc-4"],
            [t("Kosi danes", "Pieces today"), "412", "line-cnc-pcs"],
            [t("Moč", "Load"), d("38.6 kW"), "line-cnc-kw"],
            [t("Delovne ure", "Running hours"), "18240 h", "line-cnc-hours"],
          ],
          {
            every: every1,
            uses: t(
              "RUN / IDLE / STOP / OFF → razpoložljivost v OEE · servis po delovnih urah",
              "RUN / IDLE / STOP / OFF → availability in OEE · service by running hours",
            ),
          },
        ),
        pin(
          "line-robot",
          "LINE_01",
          "mobility",
          t("kos", "pcs"),
          t("Števec kosov montažne linije", "Assembly line piece counter"),
          t("Montažna linija", "Assembly line"),
          [
            [t("Kosi danes", "Pieces today"), "1284"],
            [t("Takt", "Cycle time"), d("22.4 s"), "line-robot-cycle"],
            [t("Cilj", "Target"), d("22.0 s"), "line-robot-target"],
            ["OEE", pct(79), "line-robot-oee"],
            [t("Moč", "Load"), d("24.8 kW"), "line-robot-kw"],
            [t("Na kos", "Per piece"), d("0.21 kWh"), "line-robot-kwh"],
          ],
          {
            every: every1,
            uses: t(
              "Takt in kosi → zmogljivost v OEE · kWh na kos",
              "Cycle time and pieces → performance in OEE · kWh per piece",
            ),
          },
        ),
        pin(
          "robot-vib",
          "ROBOT_02",
          "structure",
          "mm/s",
          t(
            "Senzor vibracij in temperature robota",
            "Robot vibration and temperature sensor",
          ),
          t("Robot 2 · stanje", "Robot 2 · condition"),
          [
            [t("Vibracije", "Vibration"), d("3.4 mm/s")],
            [t("Ležaj", "Bearing"), "47 °C", "robot-vib-bearing"],
            [t("Motor", "Motor"), "52 °C", "robot-vib-motor"],
            [t("Tok motorja", "Motor current"), d("6.4 A"), "robot-vib-a"],
            ["KAI", t("Obraba", "Wear"), "robot-vib-kai"],
            [
              t("Servis", "Service"),
              t("~12 dni", "~12 days"),
              "robot-vib-service",
            ],
          ],
          {
            alert: 4.5,
            every: every1,
            uses: t(
              "KAI: napoved okvare iz trenda vibracij in temperature · meja 4,5 mm/s",
              "KAI: failure forecast from the vibration and temperature trend · limit 4.5 mm/s",
            ),
          },
        ),
        pin(
          "line-mould",
          "MOULD_01–03",
          "power",
          t("kos", "pcs"),
          t("Števci strojev za brizganje", "Moulding machine counters"),
          t("Brizganje plastike", "Injection moulding"),
          [
            [t("Dobri kosi", "Good pieces"), "2316"],
            [t("Izmet", "Scrap"), pct(d("2.1")), "line-mould-scrap"],
            [t("Cikel", "Cycle"), d("31.5 s"), "line-mould-cycle"],
            ["OEE", pct(71), "line-mould-oee"],
            [t("Moč", "Load"), "96 kW", "line-mould-kw"],
            [t("Na kos", "Per piece"), d("0.33 kWh"), "line-mould-kwh"],
          ],
          {
            every: every1,
            uses: t(
              "Dobri in slabi kosi → kakovost v OEE in izmet · kWh na kos",
              "Good and bad pieces → quality in OEE and scrap · kWh per piece",
            ),
          },
        ),
        pin(
          "terminal",
          "TERM_01",
          "structure",
          "min",
          t("Terminal razlogov zastoja", "Downtime reason terminal"),
          t("Zastoji danes", "Downtime today"),
          [
            [t("Zastoji", "Downtime"), "46 min"],
            [
              t("Zadnji · CNC 4", "Last · CNC 4"),
              t("Orodje", "Tooling"),
              "terminal-last",
            ],
            [t("Material", "Material"), "18 min", "terminal-top"],
          ],
          {
            every: undefined,
            uses: t(
              "Razlog vpiše operater → Pareto izgub in analiza vzrokov",
              "The operator enters the reason → Pareto of losses and root-cause analysis",
            ),
          },
        ),
        {
          key: "hall-temp",
          id: "HALL_TH_01",
          tone: "air",
          tag: "°C",
          label: t(
            "Senzor klime in kakovosti zraka v hali",
            "Hall climate and air quality sensor",
          ),
          event: t("Proizvodna hala", "Production hall"),
          eventNote: true,
          at: at("hall-temp"),
          side: "below",
          align: "start",
          alert: 30,
          every: every5,
          uses: t(
            "Pravilo: temperatura > 30 °C ali CO₂ > 1000 ppm → prezračevanje in obvestilo",
            "Rule: temperature > 30 °C or CO₂ > 1000 ppm → ventilation and a notification",
          ),
          card: {
            kind: "sensor",
            title: t("Klima v proizvodni hali", "Production hall climate"),
            value: d("22.4 °C"),
            grid: [
              {
                label: "Temp.",
                key: "hall-temp",
                value: d("22.4 °C"),
              },
              { label: t("Vlaga", "Humidity"), key: "hall-rh", value: pct(46) },
              { label: "CO₂", key: "hall-co2", value: "640 ppm" },
              { label: "PM2,5", key: "hall-pm", value: "12 µg/m³" },
              { label: "VOC", key: "hall-voc", value: "180 ppb" },
              { label: t("Hrup", "Noise"), key: "hall-noise", value: "74 dB" },
            ],
          },
        },
        pin(
          "ahu",
          "AHU_01",
          "air",
          "kW",
          t("Krmilnik klimatske naprave", "Air handling unit controller"),
          t("Klimatska naprava", "Air handling unit"),
          [
            [t("Moč", "Power"), d("18.6 kW")],
            [t("Pretok zraka", "Airflow"), pct(62), "ahu-flow"],
            [t("Dovod", "Supply air"), d("19.5 °C"), "ahu-supply"],
            [t("Stanje", "State"), running, "ahu-state"],
            [t("Gorilnik", "Burner"), t("Izklopljen", "Off"), "ahu-burner"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "Poraba HVAC · stanje in okvare · pretok sledi CO₂ in temperaturi v hali",
              "HVAC energy · state and faults · airflow follows CO₂ and the hall temperature",
            ),
          },
        ),
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
                label: "Temp.",
                key: "wh-temp",
                value: d("18.6 °C"),
              },
            ],
          },
        },
        pin(
          "forklift",
          "FL_01",
          "mobility",
          "%",
          t("Telematika viličarja", "Forklift telematics"),
          t("Viličar", "Forklift"),
          [
            [t("Baterija", "Battery"), pct(68)],
            [t("Delovne ure", "Running hours"), "2412 h", "forklift-hours"],
            [t("Stanje", "State"), t("Vozi", "Driving"), "forklift-state"],
            [
              t("Servis", "Service"),
              t("čez 88 h", "in 88 h"),
              "forklift-service",
            ],
          ],
          {
            align: "end",
            uses: t(
              "Načrtovanje polnjenja in servisa po delovnih urah",
              "Charging and service planned by running hours",
            ),
          },
        ),
        pin(
          "dock",
          "DOCK_01",
          "structure",
          "min",
          t("Kontakt vrat nakladalne rampe", "Dock door contact"),
          t("Nakladalni rampi", "Loading docks"),
          [
            [t("Rampa 1 odprta", "Dock 1 open"), "6 min"],
            [
              t("Rampa 1 · tovornjak", "Dock 1 · lorry"),
              t("Odprta", "Open"),
              "dock-1",
            ],
            [t("Rampa 2", "Dock 2"), closed, "dock-2"],
            [t("Izguba toplote", "Heat lost"), "0 kWh", "dock-loss"],
          ],
          {
            side: "above",
            align: "end",
            alert: 15,
            every: undefined,
            uses: t(
              "Pravilo: rampa odprta > 15 min med ogrevanjem → alarm in izguba v kWh",
              "Rule: dock open > 15 min while heating → alarm and energy lost in kWh",
            ),
          },
        ),
        pin(
          "smoke",
          "SMOKE_01",
          "air",
          "%/m",
          t(
            "Javljalnik dima in CO · pisarna",
            "Smoke and CO detector · office",
          ),
          t("Dim in CO · pisarna", "Smoke and CO · office"),
          [
            [t("Dim", "Smoke"), d("0.02 %/m")],
            ["CO", "2 ppm", "smoke-co"],
            [t("Stanje", "State"), t("Ni dima", "Clear"), "smoke-state"],
          ],
          {
            align: "start",
            alert: 0.1,
            every: undefined,
            uses: t(
              "Pravilo: dim ali CO > 30 ppm → alarm in obvestilo vsem v stavbi",
              "Rule: smoke or CO > 30 ppm → alarm and everyone in the building notified",
            ),
          },
        ),
        pin(
          "gas-detect",
          "GASDET_01",
          "gas",
          "% LEL",
          t("Detektor plina ob grelniku", "Gas detector by the heater"),
          t("Detektor plina", "Gas detector"),
          [
            [t("Metan", "Methane"), "0 % LEL"],
            [t("Stanje", "State"), t("Ni plina", "Clear"), "gas-detect-state"],
          ],
          {
            side: "above",
            alert: 10,
            every: undefined,
            uses: t(
              "Pravilo: metan > 10 % LEL → alarm in zapora plinskega ventila",
              "Rule: methane > 10% LEL → alarm and the gas valve closed",
            ),
          },
        ),

        // --- Store: the cold chain ------------------------------------------
        pin(
          "fridge-dairy",
          "FRIDGE_01",
          "water",
          "°C",
          t(
            "Senzor hladilne vitrine · mlečni izdelki",
            "Chiller sensor · dairy",
          ),
          t("Hladilna vitrina · mlečni izdelki", "Dairy chiller"),
          [
            ["Temp.", d("3.8 °C")],
            [
              t("Nad mejo danes", "Over limit today"),
              "0 min",
              "fridge-dairy-over",
            ],
            [t("Meja", "Limit"), "8 °C", "fridge-dairy-limit"],
          ],
          {
            alert: 8,
            uses: t(
              "Pravilo: temperatura > 8 °C dlje kot 10 min → alarm · samodejni zapis HACCP",
              "Rule: temperature > 8 °C for over 10 min → alarm · automatic HACCP record",
            ),
          },
        ),
        pin(
          "fridge-meat",
          "FRIDGE_02",
          "water",
          "°C",
          t(
            "Senzor hladilne vitrine · meso in delikatesa",
            "Chiller sensor · meat and deli",
          ),
          t("Hladilna vitrina · meso", "Meat chiller"),
          [
            ["Temp.", d("1.6 °C")],
            [
              t("Nad mejo danes", "Over limit today"),
              "0 min",
              "fridge-meat-over",
            ],
            [t("Meja", "Limit"), "4 °C", "fridge-meat-limit"],
          ],
          {
            alert: 4,
            uses: t(
              "Pravilo: temperatura > 4 °C dlje kot 10 min → alarm · samodejni zapis HACCP",
              "Rule: temperature > 4 °C for over 10 min → alarm · automatic HACCP record",
            ),
          },
        ),
        pin(
          "coldroom",
          "COLDROOM_01",
          "water",
          "°C",
          t(
            "Senzor hladilnice in kontakt vrat",
            "Cold room sensor and door contact",
          ),
          t("Hladilnica", "Cold room"),
          [
            ["Temp.", d("2.1 °C")],
            [t("Vrata", "Door"), closed, "coldroom-door"],
            [t("Odprta danes", "Open today"), "14 min", "coldroom-opens"],
          ],
          {
            align: "end",
            alert: 5,
            uses: t(
              "Pravilo: vrata odprta > 5 min → alarm vodji izmene · izguba v kWh",
              "Rule: door open > 5 min → alarm to the shift lead · energy lost in kWh",
            ),
          },
        ),
        pin(
          "freezer",
          "FREEZER_01",
          "water",
          "°C",
          t("Senzor zamrzovalnih skrinj", "Chest freezer sensor"),
          t("Zamrzovalne skrinje", "Chest freezers"),
          [
            ["Temp.", d("-21.4 °C")],
            [t("Nad mejo danes", "Over limit today"), "0 min", "freezer-over"],
            [t("Meja", "Limit"), "−15 °C", "freezer-limit"],
          ],
          {
            align: "end",
            alert: -15,
            uses: t(
              "Pravilo: temperatura > −15 °C dlje kot 10 min → alarm",
              "Rule: temperature > −15 °C for over 10 min → alarm",
            ),
          },
        ),
        pin(
          "freezer-wall",
          "FREEZER_02",
          "water",
          "°C",
          t(
            "Senzor zamrzovalnih omar in kontakt vrat",
            "Upright freezer sensor and door contact",
          ),
          t("Zamrzovalne omare", "Upright freezers"),
          [
            ["Temp.", d("-19.8 °C")],
            [t("Vrata odprta", "Door open"), "4 min", "freezer-wall-door"],
            [t("Meja", "Limit"), "−15 °C", "freezer-wall-limit"],
          ],
          {
            align: "end",
            alert: -15,
            uses: t(
              "Pravilo: vrata odprta > 3 min → alarm · temperatura > −15 °C → alarm",
              "Rule: door open > 3 min → alarm · temperature > −15 °C → alarm",
            ),
          },
        ),
        pin(
          "refrig",
          "REFRIG_01",
          "water",
          "kW",
          t("Krmilnik hladilnega agregata", "Refrigeration plant controller"),
          t("Hladilni agregat", "Refrigeration plant"),
          [
            [t("Moč", "Power"), d("26.3 kW")],
            [t("Komp. 1", "Comp. 1"), pct(74), "refrig-c1"],
            [t("Komp. 2", "Comp. 2"), pct(58), "refrig-c2"],
            [t("Sesalni tlak", "Suction"), d("2.9 bar"), "refrig-suction"],
            [t("Tlačni tlak", "Discharge"), d("16.8 bar"), "refrig-discharge"],
            [t("Hladivo", "Refrig."), "38 °C", "refrig-temp"],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "KAI: napoved okvare kompresorja iz tlakov, temperature in porabe",
              "KAI: compressor failure forecast from pressures, temperature and power",
            ),
          },
        ),
        pin(
          "deli",
          "DELI_01",
          "gas",
          "°C",
          t(
            "Sonda temperature jedra · topla vitrina",
            "Core probe · hot deli counter",
          ),
          t("Topla vitrina", "Hot deli counter"),
          [
            [t("Jedro hrane", "Food core"), d("71.2 °C")],
            [t("Vitrina", "Counter"), "68 °C", "deli-air"],
            [t("Meja", "Limit"), "≥ 63 °C", "deli-limit"],
          ],
          {
            align: "start",
            uses: t(
              "Pravilo: jedro < 63 °C dlje kot 15 min → alarm · digitalni HACCP",
              "Rule: core < 63 °C for over 15 min → alarm · digital HACCP",
            ),
          },
        ),
        pin(
          "market-power",
          "MARKET_POWER_01",
          "power",
          "kW",
          t("Električni števec supermarketa", "Supermarket electricity meter"),
          t("Poraba elektrike · supermarket", "Electricity use · supermarket"),
          [
            [t("Moč", "Load"), d("64.2 kW")],
            [t("Hlajenje", "Cooling"), pct(41), "market-power-ref"],
            [t("Danes", "Today"), "812 kWh", "market-power-kwh"],
            [
              t("Napajanje", "Supply"),
              t("Omrežje", "Mains"),
              "market-power-mains",
            ],
            [t("Vrata omare", "Cabinet door"), closed, "market-power-door"],
          ],
          {
            card: meter,
            side: "above",
            align: "end",
            every: every15,
            uses: t(
              "Izpad napajanja → alarm in zaščita hladne verige · konica · kWh na m²",
              "Power outage → alarm and cold-chain protection · peak · kWh per m²",
            ),
          },
        ),
        pin(
          "flood",
          "FLOOD_01",
          "water",
          "mm",
          t("Senzor poplave · tehnični kot", "Flood sensor · technical corner"),
          t("Poplava · tehnični kot", "Flood · technical corner"),
          [
            [t("Voda", "Water"), "0 mm"],
            [t("Stanje", "State"), t("Suho", "Dry"), "flood-state"],
          ],
          {
            align: "end",
            alert: 1,
            every: undefined,
            uses: t(
              "Pravilo: voda na tleh → alarm vzdrževanju",
              "Rule: water on the floor → alarm to maintenance",
            ),
          },
        ),

        // --- Store: shoppers and the car park -------------------------------
        pin(
          "people",
          "FOOTFALL_01",
          "mobility",
          t("os.", "ppl"),
          t("Števec obiskovalcev na vhodu", "Entrance people counter"),
          t("Obiskovalci", "Visitors"),
          [
            [t("Danes", "Today"), "1412"],
            [t("Ta ura", "This hour"), "186", "people-hour"],
            [t("V trgovini", "In the store"), "48", "people-in"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "Obisk po urah → razpored osebja · kWh na obiskovalca",
              "Visitors by the hour → staff planning · kWh per visitor",
            ),
          },
        ),
        pin(
          "queue",
          "QUEUE_01",
          "mobility",
          t("os.", "ppl"),
          t("Senzor čakalnih vrst", "Queue sensor"),
          t("Blagajne", "Checkouts"),
          [
            [t("Čakajoči", "Waiting"), "5"],
            [t("Najdaljša · bl. 3", "Longest · no. 3"), "3", "queue-max"],
            [t("Odprte", "Open"), "3 / 5", "queue-open"],
          ],
          {
            alert: 9,
            every: every1,
            uses: t(
              "Pravilo: več kot 3 čakajoči na blagajno → obvestilo »odprite blagajno«",
              "Rule: more than 3 waiting per checkout → “open a checkout” notification",
            ),
          },
        ),
        pin(
          "ev",
          "EV_01–02",
          "power",
          "kW",
          t("Polnilnici za električna vozila", "EV chargers"),
          t("Polnilnici EV", "EV chargers"),
          [
            [t("Moč", "Power"), d("11.0 kW")],
            ["EV 1", t("Polni", "Charging"), "ev-1"],
            ["EV 2", t("Prosta", "Free"), "ev-2"],
            [t("Danes", "Today"), "96 kWh", "ev-day"],
            [t("Seje", "Sessions"), "7", "ev-sessions"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "kWh na sejo za obračun · omejitev moči ob konici trgovine",
              "kWh per session for billing · power limited near the store's peak",
            ),
          },
        ),
        pin(
          "parking",
          "PARK_01",
          "mobility",
          "P",
          t(
            "Senzorji zasedenosti parkirnih mest",
            "Parking bay occupancy sensors",
          ),
          t("Parkirišče", "Car park"),
          [
            [t("Prosta mesta", "Free bays"), String(free)],
            [t("Zasedena", "Taken"), `${parked} / ${bays}`, "parking-taken"],
            [t("Prosta EV", "Free EV"), "1 / 2", "parking-ev"],
          ],
          {
            side: "above",
            every: undefined,
            uses: t(
              "Prosta mesta na stebru ob cesti in v aplikaciji",
              "Free bays shown on the pylon by the road and in the app",
            ),
          },
        ),
        pin(
          "waste",
          "WASTE_01–02",
          "structure",
          "%",
          t(
            "Senzorja napolnjenosti zabojnikov",
            "Waste container fill sensors",
          ),
          t("Zabojnika za odpadke", "Waste containers"),
          [
            [t("Embalaža", "Packaging"), pct(72)],
            [t("Mešani", "Mixed"), pct(41), "waste-2"],
            ["Temp.", "18 °C", "waste-temp"],
            [t("Odvoz", "Pickup"), t("jutri", "tomorrow"), "waste-pickup"],
          ],
          {
            align: "end",
            alert: 90,
            every: every15,
            uses: t(
              "Odvoz le ob polnem zabojniku · temperatura > 60 °C → alarm požara",
              "Collected only when full · temperature > 60 °C → fire alarm",
            ),
          },
        ),
        pin(
          "weather",
          "WEATHER_01",
          "air",
          "°C",
          t("Vremenska postaja", "Weather station"),
          t("Vreme in zrak zunaj", "Weather and outdoor air"),
          [
            ["Temp.", d("24.8 °C")],
            [t("Vlaga", "Humidity"), pct(52), "weather-rh"],
            [t("Veter", "Wind"), d("3.2 m/s"), "weather-wind"],
            ["PM10", "18 µg/m³", "weather-pm"],
          ],
          {
            side: "above",
            every: every5,
            uses: t(
              "Korelacija z energijo HVAC in hlajenja · vhod za napoved KAI",
              "Correlated with HVAC and refrigeration energy · input to the KAI forecast",
            ),
          },
        ),
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
        "2 objekta · 34 senzorjev in števcev · demonstracijski podatki",
        "2 buildings · 34 sensors and meters · simulated data",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices"),
          value: "0 / 7",
          note: t("Razsvetljava", "Lighting"),
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
        title: t(
          "Proizvodnja · energija in mediji",
          "Plant · energy and utilities",
        ),
        rows: [
          row(
            t("Glavni razdelilnik", "Main switchboard"),
            "MAIN_LV_01",
            "main-power",
            d("371.2 kW"),
            t("pogodbena 400 kW", "contracted 400 kW"),
          ),
          row(
            t("Razdelilnik hale", "Hall distribution"),
            "FACTORY_POWER_01",
            "factory-power",
            d("186.4 kW"),
            t("L1 281 A", "L1 281 A"),
          ),
          row(
            t("Komprimiran zrak", "Compressed air"),
            "COMP_01",
            "air",
            "540 Nm³/h",
            t("7,1 bar · puščanje 18 %", "7.1 bar · leaks 18%"),
          ),
          row(
            t("Plin", "Gas"),
            "GAS_01",
            "gas",
            d("14.2 m³/h"),
            t("danes 168 m³", "today 168 m³"),
          ),
          row(
            t("Voda", "Water"),
            "WATER_01",
            "water",
            d("1.8 m³/h"),
            t("nočni pretok 0", "night flow 0"),
          ),
          row(
            t("Silosa", "Silos"),
            "SILO_01",
            "silo",
            pct(64),
            t("dovolj za 4,5 dni", "lasts 4.5 days"),
          ),
          row(
            t("Temperatura v hali", "Hall temperature"),
            "HALL_TH_01",
            "hall-temp",
            d("22.4 °C"),
            t("Vlaga 46 %", "Humidity 46%"),
          ),
          row(
            t("Vlaga v skladišču", "Warehouse humidity"),
            "WH_TH_01",
            "wh-rh",
            pct(48),
            d("18.6 °C"),
          ),
        ],
      },
      sensors: {
        title: t("Supermarket · hladna veriga", "Supermarket · cold chain"),
        rows: [
          row(
            t("Vitrina · mlečni izdelki", "Dairy chiller"),
            "FRIDGE_01",
            "fridge-dairy",
            d("3.8 °C"),
            t("Normalno", "Normal"),
          ),
          row(
            t("Vitrina · meso", "Meat chiller"),
            "FRIDGE_02",
            "fridge-meat",
            d("1.6 °C"),
            t("Normalno", "Normal"),
          ),
          row(
            t("Hladilnica", "Cold room"),
            "COLDROOM_01",
            "coldroom",
            d("2.1 °C"),
            t("Vrata zaprta", "Door closed"),
          ),
          row(
            t("Zamrzovalne skrinje", "Chest freezers"),
            "FREEZER_01",
            "freezer",
            d("-21.4 °C"),
            t("Normalno", "Normal"),
          ),
          row(
            t("Zamrzovalne omare", "Upright freezers"),
            "FREEZER_02",
            "freezer-wall",
            d("-19.8 °C"),
            t("Vrata odprta", "Door open"),
          ),
          row(
            t("Hladilni agregat", "Refrigeration plant"),
            "REFRIG_01",
            "refrig",
            d("26.3 kW"),
            t("2 / 2 kompresorja", "2 / 2 compressors"),
          ),
          row(
            t("Topla vitrina", "Hot deli counter"),
            "DELI_01",
            "deli",
            d("71.2 °C"),
            t("meja ≥ 63 °C", "limit ≥ 63 °C"),
          ),
          row(
            t("Elektrika supermarketa", "Supermarket electricity"),
            "MARKET_POWER_01",
            "market-power",
            d("64.2 kW"),
            t("hlajenje 41 %", "refrigeration 41%"),
          ),
        ],
      },
      panels: [
        {
          title: t("KPI in analitika", "KPIs and analytics"),
          tag: "ANALYTICS",
          rows: [
            row(
              t("OEE proizvodnje", "Plant OEE"),
              "A × P × Q",
              "kpi-oee",
              pct(73),
              t(
                "87 % × 87 % × 97 % · cilj 85 %",
                "87% × 87% × 97% · target 85%",
              ),
            ),
            row(
              t("Energija na kos", "Energy per piece"),
              t("vse linije", "all lines"),
              "kpi-kwh-pc",
              d("1.84 kWh"),
              t("−6 % glede na prejšnji teden", "−6% on last week"),
            ),
            row(
              t("Konica / pogodbena moč", "Peak / contracted"),
              "MAIN_LV_01",
              "kpi-peak",
              pct(93),
              t("371 od 400 kW", "371 of 400 kW"),
            ),
            row(
              t("Puščanje zraka", "Compressed-air leaks"),
              "COMP_01",
              "kpi-leak",
              pct(18),
              t("≈ 6.900 € na leto", "≈ €6,900 a year"),
            ),
            row(
              t("Energija trgovine", "Store energy"),
              t("na m² · leto", "per m² · year"),
              "kpi-store",
              "331 kWh/m²",
              t("0,41 kWh na obiskovalca", "0.41 kWh per visitor"),
            ),
            row(
              t("Skladnost HACCP", "HACCP compliance"),
              t("7 merilnih mest", "7 measuring points"),
              "kpi-haccp",
              pct(d("99.6")),
              t(
                "zapis pripravljen za inšpekcijo",
                "record ready for inspection",
              ),
            ),
          ],
        },
        {
          title: t("Proizvodnja in stroji", "Production and machines"),
          tag: "PRODUCTION · MACHINES",
          rows: [
            row(
              t("CNC stroji", "CNC machines"),
              "CNC_01–04",
              "line-cnc",
              "2 / 4",
              t("tečejo · CNC 4 stoji", "running · CNC 4 stopped"),
            ),
            row(
              t("Montažna linija", "Assembly line"),
              "LINE_01",
              "line-robot",
              "1284",
              t("OEE 79 % · takt 22,4 s", "OEE 79% · 22.4 s cycle"),
            ),
            row(
              t("Brizganje plastike", "Injection moulding"),
              "MOULD_01–03",
              "line-mould",
              "2316",
              t("OEE 71 % · izmet 2,1 %", "OEE 71% · scrap 2.1%"),
            ),
            row(
              t("Zastoji danes", "Downtime today"),
              "TERM_01",
              "terminal",
              "46 min",
              t("največ: material", "top: material"),
            ),
            row(
              t("Robot 2 · vibracije", "Robot 2 · vibration"),
              "ROBOT_02",
              "robot-vib",
              d("3.4 mm/s"),
              t("meja 4,5 mm/s", "limit 4.5 mm/s"),
            ),
            row(
              t("Klimatska naprava", "Air handling unit"),
              "AHU_01",
              "ahu",
              d("18.6 kW"),
              t("pretok 62 %", "airflow 62%"),
            ),
            row(
              t("Viličar", "Forklift"),
              "FL_01",
              "forklift",
              pct(68),
              t("servis čez 88 h", "service in 88 h"),
            ),
            row(
              t("Nakladalni rampi", "Loading docks"),
              "DOCK_01",
              "dock",
              "6 min",
              t("rampa 1 odprta", "dock 1 open"),
            ),
          ],
        },
        {
          title: t("Trgovina in kupci", "Store and shoppers"),
          tag: "RETAIL ANALYTICS",
          rows: [
            row(
              t("Obiskovalci danes", "Visitors today"),
              "FOOTFALL_01",
              "people",
              "1412",
              t("ta ura 186", "this hour 186"),
            ),
            row(
              t("Čakajoči na blagajnah", "Waiting at checkouts"),
              "QUEUE_01",
              "queue",
              "5",
              t("odprte 3 / 5", "3 / 5 open"),
            ),
            row(
              t("Prosta parkirna mesta", "Free parking bays"),
              "PARK_01",
              "parking",
              `${free} / ${bays}`,
              t("EV 1 / 2", "EV 1 / 2"),
            ),
            row(
              t("Polnilnici EV", "EV chargers"),
              "EV_01–02",
              "ev",
              d("11.0 kW"),
              t("danes 96 kWh · 7 sej", "today 96 kWh · 7 sessions"),
            ),
            row(
              t("Zabojnika za odpadke", "Waste containers"),
              "WASTE_01–02",
              "waste",
              pct(72),
              t("odvoz jutri", "collection tomorrow"),
            ),
            row(
              t("Sanitarije", "Restrooms"),
              t("števec obiskov", "visit counter"),
              "store-sanitary",
              "214",
              t("čiščenje čez 26 obiskov", "cleaning in 26 visits"),
            ),
            row(
              t("Vreme zunaj", "Weather outside"),
              "WEATHER_01",
              "weather",
              d("24.8 °C"),
              t("PM10 18 µg/m³", "PM10 18 µg/m³"),
            ),
          ],
        },
        {
          title: t("Varnost", "Safety"),
          tag: "SAFETY",
          in: "overview devices alarms",
          rows: [
            row(
              t("Dim in CO · pisarna", "Smoke and CO · office"),
              "SMOKE_01",
              "smoke",
              d("0.02 %/m"),
              t("ni dima", "clear"),
            ),
            row(
              t("Plin ob grelniku", "Gas by the heater"),
              "GASDET_01",
              "gas-detect",
              "0 % LEL",
              t("ni plina", "clear"),
            ),
            row(
              t("Poplava · trgovina", "Flood · store"),
              "FLOOD_01",
              "flood",
              "0 mm",
              t("suho", "dry"),
            ),
            row(
              t("Omare razdelilnikov", "Switchboard cabinets"),
              t("3 kontakti", "3 contacts"),
              "safety-cabinets",
              "3 / 3",
              t("zaprte", "closed"),
            ),
          ],
        },
        {
          title: t(
            "KAI · odstopanja in napovedi",
            "KAI · anomalies and forecasts",
          ),
          tag: "KAI",
          in: "overview alarms",
          rows: [
            row(
              t("Robot 2 · ležaj", "Robot 2 · bearing"),
              "ROBOT_02",
              "kai-robot",
              t("Obraba", "Wear"),
              t(
                "vibracije +34 % v 9 dneh · servis čez ~12 dni",
                "vibration +34% in 9 days · service in ~12 days",
              ),
            ),
            row(
              t("Hladilni agregat", "Refrigeration plant"),
              "REFRIG_01",
              "kai-refrig",
              t("Opozorilo", "Warning"),
              t(
                "tlačni tlak +12 % · kondenzator umazan",
                "discharge +12% · condenser fouling",
              ),
            ),
            row(
              t("Napoved konice", "Peak forecast"),
              t("danes", "today"),
              "kai-peak",
              "425 kW",
              t(
                "ob 18:00 → zamik kompresorja 2",
                "at 18:00 → shift compressor 2",
              ),
            ),
            row(
              t("Anomalije porabe", "Energy anomalies"),
              t("elektrika · plin · voda · zrak", "power · gas · water · air"),
              "kai-energy",
              t("Brez", "None"),
              t("v mejah vzorca", "within the learned pattern"),
            ),
            row(
              t("Primerjava poslovalnic", "Store benchmark"),
              t("5 trgovin", "5 stores"),
              "kai-bench",
              t("3. od 5", "3rd of 5"),
              "331 kWh/m²",
            ),
          ],
        },
        {
          title: "NOC",
          tag: t("OPERATIVNI NADZOR", "OPERATIONS"),
          in: "overview gateways alarms",
          rows: [
            row(
              t("Naprave", "Devices"),
              t("senzorji, števci, luči", "sensors, meters, lights"),
              "noc-online",
              "41 / 41",
              t("povezanih", "online"),
            ),
            row(
              t("Kakovost povezave", "Link quality"),
              "RSSI · SNR",
              "noc-rssi",
              "−74 dBm",
              t("najšibkejša: LAMP_04", "weakest: LAMP_04"),
            ),
            row(
              t("Baterije senzorjev", "Sensor batteries"),
              t("najnižja", "lowest"),
              "noc-battery",
              pct(58),
              "WASTE_02",
            ),
            row(
              t("Integracije", "Integrations"),
              "ERP · POS · MES · BMS",
              "noc-links",
              "4 / 4",
              t("povezane", "connected"),
            ),
          ],
        },
      ],
    },
  };
}
