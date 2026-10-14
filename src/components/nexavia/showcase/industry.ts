import type { Locale } from "../../../lib/i18n";
import type { ReadingRow, Sensor, Tone, Twin } from "./types";
import geometry from "./industry-geometry.json";

// The industry maquette, rendered by scripts/generate-industry-maquette.mjs:
// a manufacturing plant and a supermarket, both shown in section. In the plant
// the sensors follow the utilities – electricity, compressed air, gas and
// water – from the yard to every line, and watch the machines for OEE; in the
// store they watch the cold chain, the shoppers and the car park. Hotspots,
// unlit patches and sensor pins come from the generated geometry.
export function industryTwin(locale: Locale): Twin {
  const t = (sl: string, en: string, de: string) => ({ sl, en, de })[locale];
  // Slovenian and German use a decimal comma.
  const d = (value: string) =>
    locale === "en" ? value : value.replace(".", ",");
  const pct = (value: number | string) =>
    t(`${value} %`, `${value}%`, `${value} %`);
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
  const every1 = t("vsako minuto", "every minute", "jede Minute");
  const every5 = t("vsakih 5 min", "every 5 min", "alle 5 min");
  const every15 = t("vsakih 15 min", "every 15 min", "alle 15 min");
  const closed = t("Zaprta", "Closed", "Geschlossen");
  const running = t("Teče", "Running", "Läuft");

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
      title: t("Industrija", "Industry", "Industrie"),
      meta: t(
        "Maketa 60 × 60 cm · 7 naprav",
        "60 × 60 cm model · 7 devices",
        "Modell 60 × 60 cm · 7 Geräte",
      ),
    },
    intro: {
      title: t(
        "Proizvodnja in trgovina, ki vesta, kaj se dogaja pod streho.",
        "A plant and a store that know what is happening under their roofs.",
        "Ein Werk und ein Markt, die wissen, was unter ihrem Dach passiert.",
      ),
      lead: t(
        "Stavbi sta prikazani v prerezu. V proizvodnem podjetju meritve sledijo elektriki, komprimiranemu zraku, plinu in vodi od dvorišča do vsake linije, stroji pa poročajo stanje, kose in vibracije – iz tega Nexavia računa OEE in porabo na kos, KAI pa napove okvaro, še preden ustavi linijo. V supermarketu senzorji varujejo hladno verigo od hladilnega agregata do vsake vitrine, štejejo kupce, čakajoče na blagajnah in prosta parkirna mesta. Ob odstopanju Nexavia sproži alarm, obvesti odgovorne in hrani zapis za HACCP.",
        "Both buildings are shown in section. In the manufacturing plant the readings follow electricity, compressed air, gas and water from the yard to every line, and the machines report their state, pieces and vibration – from which Nexavia works out OEE and energy per piece, and KAI predicts a failure before it stops the line. In the supermarket, sensors guard the cold chain from the refrigeration plant to every chiller, and count shoppers, the queue at the checkouts and the free parking bays. When a reading drifts, Nexavia raises an alarm, notifies the people responsible and keeps the HACCP record.",
        "Beide Gebäude sind im Schnitt dargestellt. Im Fertigungswerk verfolgen die Messungen Strom, Druckluft, Gas und Wasser vom Hof bis zu jeder Linie, und die Maschinen melden Zustand, Stückzahlen und Schwingungen – daraus berechnet Nexavia OEE und Energie pro Stück, und KAI sagt einen Ausfall voraus, bevor er die Linie stoppt. Im Supermarkt überwachen Sensoren die Kühlkette von der Kälteanlage bis zu jedem Kühlregal und zählen Kunden, die Warteschlange an den Kassen und die freien Parkplätze. Weicht ein Messwert ab, löst Nexavia einen Alarm aus, benachrichtigt die Verantwortlichen und führt den HACCP-Nachweis.",
      ),
    },
    panel: {
      view: t(
        "Pogled v prerezu · povlecite za raziskovanje",
        "Section view · drag to explore",
        "Schnittansicht · ziehen zum Erkunden",
      ),
      hint: t(
        "Kliknite senzor na stroju, števcu ali v dvorišču, da pošlje meritev, ali halo, trgovino, napis oz. svetilko na dvorišču za vklop in izklop",
        "Click a sensor on a machine, a meter or in the yard to send a reading, or the hall, the store, the sign or a yard lamp to switch it on or off",
        "Klicken Sie auf einen Sensor an einer Maschine, einem Zähler oder im Hof, um einen Messwert zu senden, oder auf die Halle, den Markt, das Schild oder eine Hofleuchte, um sie ein- oder auszuschalten",
      ),
      hintPanel: t(
        "Tudi deli nadzorne plošče Nexavia so interaktivni – preklopite posamezno napravo ali vse zunanje svetilke hkrati.",
        "Parts of the Nexavia dashboard are interactive too – switch a single device or all outdoor lamps at once.",
        "Auch Teile des Nexavia-Dashboards sind interaktiv – schalten Sie ein einzelnes Gerät oder alle Außenleuchten gleichzeitig.",
      ),
      step: t(
        "Senzor bere svetlobo okolice",
        "Sensor is reading ambient light",
        "Sensor misst das Umgebungslicht",
      ),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/industry/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa industrijske cone velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: levo proizvodno podjetje v prerezu s CNC stroji s signalnimi lučmi, montažno linijo z robotoma, stroji za brizganje plastike, terminalom zastojev, skladiščem, klimatsko napravo in pisarno, desno supermarket v prerezu s policami, hladilnimi vitrinami, zamrzovalniki, toplo vitrino in blagajnami, ob njem kondenzatorja hladilnega agregata in zabojnika za odpadke, spredaj dvorišče s tovornjakom, transformatorjem, glavnim razdelilnikom, kompresorsko postajo in silosoma, parkirišče s polnilnicama za električna vozila, vremenska postaja in steber s prikazom prostih parkirnih mest",
        "60 by 60 centimetre industry maquette of four 30 by 30 centimetre modules: on the left a manufacturing plant in section with CNC machines and their stack lights, an assembly line with two robots, injection moulding machines, a downtime terminal, a warehouse, an air handling unit and an office, on the right a supermarket in section with shelves, chillers, freezers, a hot deli counter and checkouts, beside it the refrigeration plant's condensing units and two waste containers, in front a yard with a lorry, a transformer, the main switchboard, a compressor station and two silos, a car park with two electric vehicle chargers, a weather station and a pylon showing the free parking bays",
        "Industriemodell im Format 60 × 60 cm aus vier Modulen à 30 × 30 cm: links ein Fertigungswerk im Schnitt mit CNC-Maschinen und ihren Signalsäulen, einer Montagelinie mit zwei Robotern, Spritzgießmaschinen, einem Stillstandsterminal, einem Lager, einer Lüftungsanlage und einem Büro, rechts ein Supermarkt im Schnitt mit Regalen, Kühlregalen, Tiefkühltruhen, einer warmen Feinkosttheke und Kassen, daneben die Verflüssiger der Kälteanlage und zwei Abfallbehälter, vorne ein Hof mit Lkw, Transformator, Hauptverteiler, Kompressorstation und zwei Silos, ein Parkplatz mit zwei Ladestationen für Elektrofahrzeuge, eine Wetterstation und ein Pylon mit Anzeige der freien Parkplätze",
      ),
      lightsDir: "/images/nexavia/showcase-room/industry/lights",
      modules: [
        {
          letter: "A",
          name: t("Proizvodnja", "Manufacturing", "Fertigung"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t("Supermarket", "Supermarket", "Supermarkt"),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t(
            "Dvorišče · energija",
            "Yard · utilities",
            "Hof · Versorgung",
          ),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t(
            "Parkirišče · e-mobilnost",
            "Car park · EV",
            "Parkplatz · E-Mobilität",
          ),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      lighting: [
        device(
          "FACTORY_01",
          t(
            "Razsvetljava proizvodne hale",
            "Production hall lighting",
            "Beleuchtung Produktionshalle",
          ),
        ),
        device(
          "MARKET_01",
          t(
            "Razsvetljava prodajnega prostora",
            "Sales floor lighting",
            "Beleuchtung Verkaufsfläche",
          ),
        ),
        device(
          "SIGN_01",
          t("Svetlobni napis", "Illuminated sign", "Leuchtschild"),
        ),
        device(
          "LAMP_01",
          t("Svetilka dvorišča 1", "Yard lamp 1", "Hofleuchte 1"),
          true,
        ),
        device(
          "LAMP_02",
          t("Svetilka dvorišča 2", "Yard lamp 2", "Hofleuchte 2"),
          true,
        ),
        device(
          "LAMP_03",
          t("Svetilka parkirišča 1", "Car park lamp 1", "Parkplatzleuchte 1"),
          true,
        ),
        device(
          "LAMP_04",
          t("Svetilka parkirišča 2", "Car park lamp 2", "Parkplatzleuchte 2"),
          true,
        ),
      ],
      sensors: [
        {
          key: "lux",
          id: "LIGHT_03",
          tone: "light",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor", "Lichtsensor"),
          event: t("Svetloba okolice", "Ambient light", "Umgebungslicht"),
          at: at("lux"),
          side: "below",
          every: every5,
          uses: t(
            "Pravilo: svetloba < 25 lx → vklop razsvetljave",
            "Rule: light < 25 lx → lighting on",
            "Regel: Licht < 25 lx → Beleuchtung ein",
          ),
          card: {
            kind: "sensor",
            title: t("Svetloba okolice", "Ambient light", "Umgebungslicht"),
            value: "52 lx",
            note: t(
              "Zid proizvodne hale",
              "Production hall wall",
              "Wand der Produktionshalle",
            ),
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
            "Zähler Hauptverteiler Werk",
          ),
          t(
            "Glavni razdelilnik · proizvodnja",
            "Main switchboard · plant",
            "Hauptverteiler · Werk",
          ),
          [
            [t("Moč", "Load", "Last"), d("371.2 kW")],
            [
              t("Konica danes", "Peak today", "Spitze heute"),
              d("388.6 kW"),
              "main-power-peak",
            ],
            [
              t("Pogodbena moč", "Contracted", "Vertragsleistung"),
              "400 kW",
              "main-power-limit",
            ],
            ["cos φ", d("0.96"), "main-power-pf"],
            ["THD", pct(d("4.2")), "main-power-thd"],
            [t("Danes", "Today", "Heute"), "3920 kWh", "main-power-kwh"],
          ],
          {
            card: meter,
            align: "end",
            alert: 400,
            every: every1,
            uses: t(
              "Pravilo: napoved konice > 400 kW → zamik kompresorja 2 in polnjenja EV",
              "Rule: peak forecast > 400 kW → compressor 2 and EV charging shifted",
              "Regel: Spitzenprognose > 400 kW → Kompressor 2 und E-Laden verschoben",
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
            "Unterverteiler Produktionshalle",
          ),
          t("Razdelilnik hale", "Hall distribution board", "Hallenverteiler"),
          [
            [t("Moč", "Load", "Last"), d("186.4 kW")],
            ["L1", "281 A", "factory-power-l1"],
            ["L2", "268 A", "factory-power-l2"],
            ["L3", "262 A", "factory-power-l3"],
            [t("Napetost", "Voltage", "Spannung"), "231 V", "factory-power-v"],
            [
              t("Vrata omare", "Cabinet door", "Schranktür"),
              closed,
              "factory-power-door",
            ],
          ],
          {
            card: meter,
            align: "start",
            every: every15,
            uses: t(
              "Tok in napetost po fazah · izpad napajanja → alarm · odpiranje omare → alarm",
              "Current and voltage per phase · power outage → alarm · cabinet opened → alarm",
              "Strom und Spannung je Phase · Stromausfall → Alarm · Schrank geöffnet → Alarm",
            ),
          },
        ),
        pin(
          "air",
          "COMP_01",
          "air",
          "Nm³/h",
          t(
            "Merilnik kompresorske postaje",
            "Compressor station meter",
            "Zähler Kompressorstation",
          ),
          t("Komprimiran zrak", "Compressed air", "Druckluft"),
          [
            [t("Pretok", "Flow", "Durchfluss"), "540 Nm³/h"],
            [t("Tlak", "Pressure", "Luftdruck"), d("7.1 bar"), "air-bar"],
            [t("Moč", "Power", "Leistung"), d("52.4 kW"), "air-kw"],
            [
              t("Temp. komp.", "Comp. temp.", "Temp. Komp."),
              "78 °C",
              "air-temp",
            ],
            [t("Puščanje", "Leaks", "Leckagen"), pct(18), "air-leak"],
            ["kWh/Nm³", d("0.10"), "air-spec"],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "KAI: pretok ob vikendu brez proizvodnje = puščanje → izguba v € na leto",
              "KAI: flow over a weekend with no production = leaks → loss in € per year",
              "KAI: Durchfluss am Wochenende ohne Produktion = Leckagen → Verlust in € pro Jahr",
            ),
          },
        ),
        pin(
          "gas",
          "GAS_01",
          "gas",
          "m³/h",
          t("Plinomer proizvodnje", "Plant gas meter", "Gaszähler Werk"),
          t("Poraba plina", "Gas use", "Gasverbrauch"),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("14.2 m³/h")],
            [t("Danes", "Today", "Heute"), "168 m³", "gas-day"],
            [t("Tlak", "Pressure", "Luftdruck"), "22 mbar", "gas-bar"],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Poraba po procesu in stroškovnem mestu · gorilnik izven izmene → anomalija",
              "Use per process and cost centre · burner running outside the shift → anomaly",
              "Verbrauch pro Prozess und Kostenstelle · Brenner außerhalb der Schicht in Betrieb → Anomalie",
            ),
          },
        ),
        pin(
          "water",
          "WATER_01",
          "water",
          "m³/h",
          t("Vodomer proizvodnje", "Plant water meter", "Wasserzähler Werk"),
          t("Poraba vode", "Water use", "Wasserverbrauch"),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("1.8 m³/h")],
            [t("Danes", "Today", "Heute"), d("24.6 m³"), "water-day"],
            [t("Tlak", "Pressure", "Luftdruck"), d("3.9 bar"), "water-bar"],
            [
              t("Nočni pretok", "Night flow", "Nachtdurchfluss"),
              d("0.0 m³/h"),
              "water-night",
            ],
          ],
          {
            card: meter,
            align: "start",
            every: every15,
            uses: t(
              "Pravilo: neprekinjen nočni pretok > 0,3 m³/h → alarm puščanja",
              "Rule: continuous night flow > 0.3 m³/h → leak alarm",
              "Regel: dauerhafter Nachtdurchfluss > 0,3 m³/h → Leckagealarm",
            ),
          },
        ),
        pin(
          "silo",
          "SILO_01",
          "structure",
          "%",
          t(
            "Radarski senzor nivoja v silosu",
            "Silo level radar",
            "Radar-Füllstandssensor Silo",
          ),
          t("Silosa za granulat", "Granulate silos", "Granulatsilos"),
          [
            [t("Silos 1", "Silo 1", "Silo 1"), pct(64)],
            [t("Zaloga", "Stock", "Bestand"), d("18.4 t"), "silo-t"],
            [t("Silos 2", "Silo 2", "Silo 2"), pct(41), "silo-2"],
            [
              t("Dovolj za", "Lasts", "Reicht für"),
              t("4,5 dni", "4.5 days", "4,5 Tage"),
              "silo-days",
            ],
          ],
          {
            side: "above",
            align: "start",
            every: every15,
            uses: t(
              "Pravilo: nivo < 25 % → samodejno naročilo granulata",
              "Rule: level < 25% → granulate ordered automatically",
              "Regel: Füllstand < 25 % → Granulat automatisch bestellt",
            ),
          },
        ),

        // --- Plant: machines and production --------------------------------
        pin(
          "line-cnc",
          "CNC_01–04",
          "power",
          "RUN",
          t(
            "Stanje CNC strojev",
            "CNC machine states",
            "Zustand der CNC-Maschinen",
          ),
          t("CNC stroji", "CNC machines", "CNC-Maschinen"),
          [
            [t("Tečejo", "Running", "Läuft"), "2 / 4"],
            [
              t("CNC 3 · material", "CNC 3 · material", "CNC 3 · Material"),
              "IDLE",
              "line-cnc-3",
            ],
            [
              t("CNC 4 · orodje", "CNC 4 · tooling", "CNC 4 · Werkzeug"),
              "STOP",
              "line-cnc-4",
            ],
            [
              t("Kosi danes", "Pieces today", "Stück heute"),
              "412",
              "line-cnc-pcs",
            ],
            [t("Moč", "Load", "Last"), d("38.6 kW"), "line-cnc-kw"],
            [
              t("Delovne ure", "Running hours", "Betriebsstunden"),
              "18240 h",
              "line-cnc-hours",
            ],
          ],
          {
            every: every1,
            uses: t(
              "RUN / IDLE / STOP / OFF → razpoložljivost v OEE · servis po delovnih urah",
              "RUN / IDLE / STOP / OFF → availability in OEE · service by running hours",
              "RUN / IDLE / STOP / OFF → Verfügbarkeit in der OEE · Wartung nach Betriebsstunden",
            ),
          },
        ),
        pin(
          "line-robot",
          "LINE_01",
          "mobility",
          t("kos", "pcs", "Stk."),
          t(
            "Števec kosov montažne linije",
            "Assembly line piece counter",
            "Stückzähler Montagelinie",
          ),
          t("Montažna linija", "Assembly line", "Montagelinie"),
          [
            [t("Kosi danes", "Pieces today", "Stück heute"), "1284"],
            [
              t("Takt", "Cycle time", "Taktzeit"),
              d("22.4 s"),
              "line-robot-cycle",
            ],
            [t("Cilj", "Target", "Ziel"), d("22.0 s"), "line-robot-target"],
            ["OEE", pct(79), "line-robot-oee"],
            [t("Moč", "Load", "Last"), d("24.8 kW"), "line-robot-kw"],
            [
              t("Na kos", "Per piece", "Pro Stück"),
              d("0.21 kWh"),
              "line-robot-kwh",
            ],
          ],
          {
            every: every1,
            uses: t(
              "Takt in kosi → zmogljivost v OEE · kWh na kos",
              "Cycle time and pieces → performance in OEE · kWh per piece",
              "Taktzeit und Stückzahl → Leistung in der OEE · kWh pro Stück",
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
            "Schwingungs- und Temperatursensor Roboter",
          ),
          t("Robot 2 · stanje", "Robot 2 · condition", "Roboter 2 · Zustand"),
          [
            [t("Vibracije", "Vibration", "Schwingung"), d("3.4 mm/s")],
            [t("Ležaj", "Bearing", "Lager"), "47 °C", "robot-vib-bearing"],
            [t("Motor", "Motor", "Motor"), "52 °C", "robot-vib-motor"],
            [
              t("Tok motorja", "Motor current", "Motorstrom"),
              d("6.4 A"),
              "robot-vib-a",
            ],
            ["KAI", t("Obraba", "Wear", "Verschleiß"), "robot-vib-kai"],
            [
              t("Servis", "Service", "Wartung"),
              t("~12 dni", "~12 days", "~12 Tage"),
              "robot-vib-service",
            ],
          ],
          {
            alert: 4.5,
            every: every1,
            uses: t(
              "KAI: napoved okvare iz trenda vibracij in temperature · meja 4,5 mm/s",
              "KAI: failure forecast from the vibration and temperature trend · limit 4.5 mm/s",
              "KAI: Ausfallprognose aus dem Schwingungs- und Temperaturtrend · Grenze 4,5 mm/s",
            ),
          },
        ),
        pin(
          "line-mould",
          "MOULD_01–03",
          "power",
          t("kos", "pcs", "Stk."),
          t(
            "Števci strojev za brizganje",
            "Moulding machine counters",
            "Zähler Spritzgießmaschinen",
          ),
          t("Brizganje plastike", "Injection moulding", "Spritzgießen"),
          [
            [t("Dobri kosi", "Good pieces", "Gutteile"), "2316"],
            [
              t("Izmet", "Scrap", "Ausschuss"),
              pct(d("2.1")),
              "line-mould-scrap",
            ],
            [t("Cikel", "Cycle", "Zyklus"), d("31.5 s"), "line-mould-cycle"],
            ["OEE", pct(71), "line-mould-oee"],
            [t("Moč", "Load", "Last"), "96 kW", "line-mould-kw"],
            [
              t("Na kos", "Per piece", "Pro Stück"),
              d("0.33 kWh"),
              "line-mould-kwh",
            ],
          ],
          {
            every: every1,
            uses: t(
              "Dobri in slabi kosi → kakovost v OEE in izmet · kWh na kos",
              "Good and bad pieces → quality in OEE and scrap · kWh per piece",
              "Gut- und Schlechtteile → Qualität in der OEE und Ausschuss · kWh pro Stück",
            ),
          },
        ),
        pin(
          "terminal",
          "TERM_01",
          "structure",
          "min",
          t(
            "Terminal razlogov zastoja",
            "Downtime reason terminal",
            "Terminal für Stillstandsgründe",
          ),
          t("Zastoji danes", "Downtime today", "Stillstände heute"),
          [
            [t("Zastoji", "Downtime", "Stillstände"), "46 min"],
            [
              t("Zadnji · CNC 4", "Last · CNC 4", "Zuletzt · CNC 4"),
              t("Orodje", "Tooling", "Werkzeug"),
              "terminal-last",
            ],
            [t("Material", "Material", "Material"), "18 min", "terminal-top"],
          ],
          {
            every: undefined,
            uses: t(
              "Razlog vpiše operater → Pareto izgub in analiza vzrokov",
              "The operator enters the reason → Pareto of losses and root-cause analysis",
              "Der Bediener erfasst den Grund → Pareto der Verluste und Ursachenanalyse",
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
            "Klima- und Luftqualitätssensor Halle",
          ),
          event: t("Proizvodna hala", "Production hall", "Produktionshalle"),
          eventNote: true,
          at: at("hall-temp"),
          side: "below",
          align: "start",
          alert: 30,
          every: every5,
          uses: t(
            "Pravilo: temperatura > 30 °C ali CO₂ > 1000 ppm → prezračevanje in obvestilo",
            "Rule: temperature > 30 °C or CO₂ > 1000 ppm → ventilation and a notification",
            "Regel: Temperatur > 30 °C oder CO₂ > 1000 ppm → Lüftung und Benachrichtigung",
          ),
          card: {
            kind: "sensor",
            title: t(
              "Klima v proizvodni hali",
              "Production hall climate",
              "Klima Produktionshalle",
            ),
            value: d("22.4 °C"),
            grid: [
              {
                label: "Temp.",
                key: "hall-temp",
                value: d("22.4 °C"),
              },
              {
                label: t("Vlaga", "Humidity", "Luftfeuchtigkeit"),
                key: "hall-rh",
                value: pct(46),
              },
              { label: "CO₂", key: "hall-co2", value: "640 ppm" },
              { label: "PM2,5", key: "hall-pm", value: "12 µg/m³" },
              { label: "VOC", key: "hall-voc", value: "180 ppb" },
              {
                label: t("Hrup", "Noise", "Lärm"),
                key: "hall-noise",
                value: "74 dB",
              },
            ],
          },
        },
        pin(
          "ahu",
          "AHU_01",
          "air",
          "kW",
          t(
            "Krmilnik klimatske naprave",
            "Air handling unit controller",
            "Steuerung Lüftungsanlage",
          ),
          t("Klimatska naprava", "Air handling unit", "Lüftungsanlage"),
          [
            [t("Moč", "Power", "Leistung"), d("18.6 kW")],
            [
              t("Pretok zraka", "Airflow", "Luftvolumenstrom"),
              pct(62),
              "ahu-flow",
            ],
            [t("Dovod", "Supply air", "Zuluft"), d("19.5 °C"), "ahu-supply"],
            [t("Stanje", "State", "Zustand"), running, "ahu-state"],
            [
              t("Gorilnik", "Burner", "Brenner"),
              t("Izklopljen", "Off", "Aus"),
              "ahu-burner",
            ],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "Poraba HVAC · stanje in okvare · pretok sledi CO₂ in temperaturi v hali",
              "HVAC energy · state and faults · airflow follows CO₂ and the hall temperature",
              "HLK-Energie · Zustand und Störungen · Luftstrom folgt CO₂ und Hallentemperatur",
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
            "Feuchte- und Temperatursensor Lager",
          ),
          event: t("Skladišče", "Warehouse", "Lager"),
          eventNote: true,
          at: at("wh-rh"),
          side: "below",
          alert: 60,
          every: every5,
          uses: t(
            "Pravilo: vlaga > 60 % dlje kot 15 min → razvlaževanje",
            "Rule: humidity > 60% for over 15 min → dehumidifying",
            "Regel: Feuchte > 60 % länger als 15 min → Entfeuchtung",
          ),
          card: {
            kind: "sensor",
            title: t("Klima v skladišču", "Warehouse climate", "Klima Lager"),
            value: pct(48),
            grid: [
              {
                label: t("Vlaga", "Humidity", "Luftfeuchtigkeit"),
                key: "wh-rh",
                value: pct(48),
              },
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
          t("Telematika viličarja", "Forklift telematics", "Stapler-Telematik"),
          t("Viličar", "Forklift", "Stapler"),
          [
            [t("Baterija", "Battery", "Batterie"), pct(68)],
            [
              t("Delovne ure", "Running hours", "Betriebsstunden"),
              "2412 h",
              "forklift-hours",
            ],
            [
              t("Stanje", "State", "Zustand"),
              t("Vozi", "Driving", "Fährt"),
              "forklift-state",
            ],
            [
              t("Servis", "Service", "Wartung"),
              t("čez 88 h", "in 88 h", "in 88 h"),
              "forklift-service",
            ],
          ],
          {
            align: "end",
            uses: t(
              "Načrtovanje polnjenja in servisa po delovnih urah",
              "Charging and service planned by running hours",
              "Laden und Wartung nach Betriebsstunden geplant",
            ),
          },
        ),
        pin(
          "dock",
          "DOCK_01",
          "structure",
          "min",
          t(
            "Kontakt vrat nakladalne rampe",
            "Dock door contact",
            "Torkontakt Laderampe",
          ),
          t("Nakladalni rampi", "Loading docks", "Laderampen"),
          [
            [t("Rampa 1 odprta", "Dock 1 open", "Rampe 1 offen"), "6 min"],
            [
              t("Rampa 1 · tovornjak", "Dock 1 · lorry", "Rampe 1 · Lkw"),
              t("Odprta", "Open", "Offen"),
              "dock-1",
            ],
            [t("Rampa 2", "Dock 2", "Rampe 2"), closed, "dock-2"],
            [
              t("Izguba toplote", "Heat lost", "Wärmeverlust"),
              "0 kWh",
              "dock-loss",
            ],
          ],
          {
            side: "above",
            align: "end",
            alert: 15,
            every: undefined,
            uses: t(
              "Pravilo: rampa odprta > 15 min med ogrevanjem → alarm in izguba v kWh",
              "Rule: dock open > 15 min while heating → alarm and energy lost in kWh",
              "Regel: Rampe > 15 min offen während der Heizperiode → Alarm und Energieverlust in kWh",
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
            "Rauch- und CO-Melder · Büro",
          ),
          t(
            "Dim in CO · pisarna",
            "Smoke and CO · office",
            "Rauch und CO · Büro",
          ),
          [
            [t("Dim", "Smoke", "Rauch"), d("0.02 %/m")],
            ["CO", "2 ppm", "smoke-co"],
            [
              t("Stanje", "State", "Zustand"),
              t("Ni dima", "Clear", "Kein Rauch"),
              "smoke-state",
            ],
          ],
          {
            align: "start",
            alert: 0.1,
            every: undefined,
            uses: t(
              "Pravilo: dim ali CO > 30 ppm → alarm in obvestilo vsem v stavbi",
              "Rule: smoke or CO > 30 ppm → alarm and everyone in the building notified",
              "Regel: Rauch oder CO > 30 ppm → Alarm und alle im Gebäude benachrichtigt",
            ),
          },
        ),
        pin(
          "gas-detect",
          "GASDET_01",
          "gas",
          "% LEL",
          t(
            "Detektor plina ob grelniku",
            "Gas detector by the heater",
            "Gasmelder am Heizgerät",
          ),
          t("Detektor plina", "Gas detector", "Gasmelder"),
          [
            [t("Metan", "Methane", "Methan"), "0 % LEL"],
            [
              t("Stanje", "State", "Zustand"),
              t("Ni plina", "Clear", "Kein Rauch"),
              "gas-detect-state",
            ],
          ],
          {
            side: "above",
            alert: 10,
            every: undefined,
            uses: t(
              "Pravilo: metan > 10 % LEL → alarm in zapora plinskega ventila",
              "Rule: methane > 10% LEL → alarm and the gas valve closed",
              "Regel: Methan > 10 % UEG → Alarm und Gasventil geschlossen",
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
            "Kühlregalsensor · Molkereiprodukte",
          ),
          t(
            "Hladilna vitrina · mlečni izdelki",
            "Dairy chiller",
            "Kühlregal Molkereiprodukte",
          ),
          [
            ["Temp.", d("3.8 °C")],
            [
              t("Nad mejo danes", "Over limit today", "Heute über Grenzwert"),
              "0 min",
              "fridge-dairy-over",
            ],
            [t("Meja", "Limit", "Grenzwert"), "8 °C", "fridge-dairy-limit"],
          ],
          {
            alert: 8,
            uses: t(
              "Pravilo: temperatura > 8 °C dlje kot 10 min → alarm · samodejni zapis HACCP",
              "Rule: temperature > 8 °C for over 10 min → alarm · automatic HACCP record",
              "Regel: Temperatur > 8 °C länger als 10 min → Alarm · automatischer HACCP-Nachweis",
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
            "Kühlregalsensor · Fleisch und Feinkost",
          ),
          t("Hladilna vitrina · meso", "Meat chiller", "Kühlregal Fleisch"),
          [
            ["Temp.", d("1.6 °C")],
            [
              t("Nad mejo danes", "Over limit today", "Heute über Grenzwert"),
              "0 min",
              "fridge-meat-over",
            ],
            [t("Meja", "Limit", "Grenzwert"), "4 °C", "fridge-meat-limit"],
          ],
          {
            alert: 4,
            uses: t(
              "Pravilo: temperatura > 4 °C dlje kot 10 min → alarm · samodejni zapis HACCP",
              "Rule: temperature > 4 °C for over 10 min → alarm · automatic HACCP record",
              "Regel: Temperatur > 4 °C länger als 10 min → Alarm · automatischer HACCP-Nachweis",
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
            "Kühlraumsensor und Türkontakt",
          ),
          t("Hladilnica", "Cold room", "Kühlraum"),
          [
            ["Temp.", d("2.1 °C")],
            [t("Vrata", "Door", "Tür"), closed, "coldroom-door"],
            [
              t("Odprta danes", "Open today", "Heute offen"),
              "14 min",
              "coldroom-opens",
            ],
          ],
          {
            align: "end",
            alert: 5,
            uses: t(
              "Pravilo: vrata odprta > 5 min → alarm vodji izmene · izguba v kWh",
              "Rule: door open > 5 min → alarm to the shift lead · energy lost in kWh",
              "Regel: Tür > 5 min offen → Alarm an den Schichtleiter · Energieverlust in kWh",
            ),
          },
        ),
        pin(
          "freezer",
          "FREEZER_01",
          "water",
          "°C",
          t(
            "Senzor zamrzovalnih skrinj",
            "Chest freezer sensor",
            "Sensor Tiefkühltruhen",
          ),
          t("Zamrzovalne skrinje", "Chest freezers", "Tiefkühltruhen"),
          [
            ["Temp.", d("-21.4 °C")],
            [
              t("Nad mejo danes", "Over limit today", "Heute über Grenzwert"),
              "0 min",
              "freezer-over",
            ],
            [t("Meja", "Limit", "Grenzwert"), "−15 °C", "freezer-limit"],
          ],
          {
            align: "end",
            alert: -15,
            uses: t(
              "Pravilo: temperatura > −15 °C dlje kot 10 min → alarm",
              "Rule: temperature > −15 °C for over 10 min → alarm",
              "Regel: Temperatur > −15 °C länger als 10 min → Alarm",
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
            "Sensor Tiefkühlschränke und Türkontakt",
          ),
          t("Zamrzovalne omare", "Upright freezers", "Tiefkühlschränke"),
          [
            ["Temp.", d("-19.8 °C")],
            [
              t("Vrata odprta", "Door open", "Tür offen"),
              "4 min",
              "freezer-wall-door",
            ],
            [t("Meja", "Limit", "Grenzwert"), "−15 °C", "freezer-wall-limit"],
          ],
          {
            align: "end",
            alert: -15,
            uses: t(
              "Pravilo: vrata odprta > 3 min → alarm · temperatura > −15 °C → alarm",
              "Rule: door open > 3 min → alarm · temperature > −15 °C → alarm",
              "Regel: Tür > 3 min offen → Alarm · Temperatur > −15 °C → Alarm",
            ),
          },
        ),
        pin(
          "refrig",
          "REFRIG_01",
          "water",
          "kW",
          t(
            "Krmilnik hladilnega agregata",
            "Refrigeration plant controller",
            "Steuerung Kälteanlage",
          ),
          t("Hladilni agregat", "Refrigeration plant", "Kälteanlage"),
          [
            [t("Moč", "Power", "Leistung"), d("26.3 kW")],
            [t("Komp. 1", "Comp. 1", "Komp. 1"), pct(74), "refrig-c1"],
            [t("Komp. 2", "Comp. 2", "Komp. 2"), pct(58), "refrig-c2"],
            [
              t("Sesalni tlak", "Suction", "Saugdruck"),
              d("2.9 bar"),
              "refrig-suction",
            ],
            [
              t("Tlačni tlak", "Discharge", "Hochdruck"),
              d("16.8 bar"),
              "refrig-discharge",
            ],
            [t("Hladivo", "Refrig.", "Kältem."), "38 °C", "refrig-temp"],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "KAI: napoved okvare kompresorja iz tlakov, temperature in porabe",
              "KAI: compressor failure forecast from pressures, temperature and power",
              "KAI: Ausfallprognose des Kompressors aus Drücken, Temperatur und Leistung",
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
            "Kerntemperaturfühler · warme Feinkosttheke",
          ),
          t("Topla vitrina", "Hot deli counter", "Warme Feinkosttheke"),
          [
            [t("Jedro hrane", "Food core", "Kerntemperatur"), d("71.2 °C")],
            [t("Vitrina", "Counter", "Theke"), "68 °C", "deli-air"],
            [t("Meja", "Limit", "Grenzwert"), "≥ 63 °C", "deli-limit"],
          ],
          {
            align: "start",
            uses: t(
              "Pravilo: jedro < 63 °C dlje kot 15 min → alarm · digitalni HACCP",
              "Rule: core < 63 °C for over 15 min → alarm · digital HACCP",
              "Regel: Kern < 63 °C länger als 15 min → Alarm · digitales HACCP",
            ),
          },
        ),
        pin(
          "market-power",
          "MARKET_POWER_01",
          "power",
          "kW",
          t(
            "Električni števec supermarketa",
            "Supermarket electricity meter",
            "Stromzähler Supermarkt",
          ),
          t(
            "Poraba elektrike · supermarket",
            "Electricity use · supermarket",
            "Stromverbrauch · Supermarkt",
          ),
          [
            [t("Moč", "Load", "Last"), d("64.2 kW")],
            [t("Hlajenje", "Cooling", "Kühlung"), pct(41), "market-power-ref"],
            [t("Danes", "Today", "Heute"), "812 kWh", "market-power-kwh"],
            [
              t("Napajanje", "Supply", "Versorgung"),
              t("Omrežje", "Mains", "Netz"),
              "market-power-mains",
            ],
            [
              t("Vrata omare", "Cabinet door", "Schranktür"),
              closed,
              "market-power-door",
            ],
          ],
          {
            card: meter,
            side: "above",
            align: "end",
            every: every15,
            uses: t(
              "Izpad napajanja → alarm in zaščita hladne verige · konica · kWh na m²",
              "Power outage → alarm and cold-chain protection · peak · kWh per m²",
              "Stromausfall → Alarm und Schutz der Kühlkette · Spitze · kWh pro m²",
            ),
          },
        ),
        pin(
          "flood",
          "FLOOD_01",
          "water",
          "mm",
          t(
            "Senzor poplave · tehnični kot",
            "Flood sensor · technical corner",
            "Wassersensor · Technikecke",
          ),
          t(
            "Poplava · tehnični kot",
            "Flood · technical corner",
            "Wasser · Technikecke",
          ),
          [
            [t("Voda", "Water", "Wasser"), "0 mm"],
            [
              t("Stanje", "State", "Zustand"),
              t("Suho", "Dry", "Trocken"),
              "flood-state",
            ],
          ],
          {
            align: "end",
            alert: 1,
            every: undefined,
            uses: t(
              "Pravilo: voda na tleh → alarm vzdrževanju",
              "Rule: water on the floor → alarm to maintenance",
              "Regel: Wasser am Boden → Alarm an die Instandhaltung",
            ),
          },
        ),

        // --- Store: shoppers and the car park -------------------------------
        pin(
          "people",
          "FOOTFALL_01",
          "mobility",
          t("os.", "ppl", "Pers."),
          t(
            "Števec obiskovalcev na vhodu",
            "Entrance people counter",
            "Personenzähler Eingang",
          ),
          t("Obiskovalci", "Visitors", "Besucher"),
          [
            [t("Danes", "Today", "Heute"), "1412"],
            [t("Ta ura", "This hour", "Diese Stunde"), "186", "people-hour"],
            [t("V trgovini", "In the store", "Im Markt"), "48", "people-in"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "Obisk po urah → razpored osebja · kWh na obiskovalca",
              "Visitors by the hour → staff planning · kWh per visitor",
              "Besucher pro Stunde → Personalplanung · kWh pro Besucher",
            ),
          },
        ),
        pin(
          "queue",
          "QUEUE_01",
          "mobility",
          t("os.", "ppl", "Pers."),
          t("Senzor čakalnih vrst", "Queue sensor", "Warteschlangensensor"),
          t("Blagajne", "Checkouts", "Kassen"),
          [
            [t("Čakajoči", "Waiting", "Wartende"), "5"],
            [
              t("Najdaljša · bl. 3", "Longest · no. 3", "Längste · Nr. 3"),
              "3",
              "queue-max",
            ],
            [t("Odprte", "Open", "Offen"), "3 / 5", "queue-open"],
          ],
          {
            alert: 9,
            every: every1,
            uses: t(
              "Pravilo: več kot 3 čakajoči na blagajno → obvestilo »odprite blagajno«",
              "Rule: more than 3 waiting per checkout → “open a checkout” notification",
              "Regel: mehr als 3 Wartende pro Kasse → Benachrichtigung „Kasse öffnen“",
            ),
          },
        ),
        pin(
          "ev",
          "EV_01–02",
          "power",
          "kW",
          t(
            "Polnilnici za električna vozila",
            "EV chargers",
            "Ladestationen für E-Fahrzeuge",
          ),
          t("Polnilnici EV", "EV chargers", "Ladestationen für E-Fahrzeuge"),
          [
            [t("Moč", "Power", "Leistung"), d("11.0 kW")],
            ["EV 1", t("Polni", "Charging", "Lädt"), "ev-1"],
            ["EV 2", t("Prosta", "Free", "Frei"), "ev-2"],
            [t("Danes", "Today", "Heute"), "96 kWh", "ev-day"],
            [t("Seje", "Sessions", "Ladevorgänge"), "7", "ev-sessions"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "kWh na sejo za obračun · omejitev moči ob konici trgovine",
              "kWh per session for billing · power limited near the store's peak",
              "kWh pro Ladevorgang für die Abrechnung · Leistung zur Spitzenzeit des Markts begrenzt",
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
            "Belegungssensoren Parkplätze",
          ),
          t("Parkirišče", "Car park", "Parkplatz"),
          [
            [t("Prosta mesta", "Free bays", "Freie Plätze"), String(free)],
            [
              t("Zasedena", "Taken", "Belegt"),
              `${parked} / ${bays}`,
              "parking-taken",
            ],
            [
              t("Prosta EV", "Free EV", "Freie E-Plätze"),
              "1 / 2",
              "parking-ev",
            ],
          ],
          {
            side: "above",
            every: undefined,
            uses: t(
              "Prosta mesta na stebru ob cesti in v aplikaciji",
              "Free bays shown on the pylon by the road and in the app",
              "Freie Plätze werden am Pylon an der Straße und in der App angezeigt",
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
            "Füllstandssensoren Abfallbehälter",
          ),
          t("Zabojnika za odpadke", "Waste containers", "Abfallbehälter"),
          [
            [t("Embalaža", "Packaging", "Verpackung"), pct(72)],
            [t("Mešani", "Mixed", "Restmüll"), pct(41), "waste-2"],
            ["Temp.", "18 °C", "waste-temp"],
            [
              t("Odvoz", "Pickup", "Abholung"),
              t("jutri", "tomorrow", "morgen"),
              "waste-pickup",
            ],
          ],
          {
            align: "end",
            alert: 90,
            every: every15,
            uses: t(
              "Odvoz le ob polnem zabojniku · temperatura > 60 °C → alarm požara",
              "Collected only when full · temperature > 60 °C → fire alarm",
              "Abholung nur bei vollem Behälter · Temperatur > 60 °C → Brandalarm",
            ),
          },
        ),
        pin(
          "weather",
          "WEATHER_01",
          "air",
          "°C",
          t("Vremenska postaja", "Weather station", "Wetterstation"),
          t(
            "Vreme in zrak zunaj",
            "Weather and outdoor air",
            "Wetter und Außenluft",
          ),
          [
            ["Temp.", d("24.8 °C")],
            [t("Vlaga", "Humidity", "Luftfeuchtigkeit"), pct(52), "weather-rh"],
            [t("Veter", "Wind", "Wind"), d("3.2 m/s"), "weather-wind"],
            ["PM10", "18 µg/m³", "weather-pm"],
          ],
          {
            side: "above",
            every: every5,
            uses: t(
              "Korelacija z energijo HVAC in hlajenja · vhod za napoved KAI",
              "Correlated with HVAC and refrigeration energy · input to the KAI forecast",
              "Korreliert mit HLK- und Kälteenergie · Eingang für die KAI-Prognose",
            ),
          },
        ),
      ],
      loader: {
        subject: t(
          "Maketa 60 × 60 cm · 4 moduli",
          "Model 60 × 60 cm · 4 modules",
          "Modell 60 × 60 cm · 4 Module",
        ),
        stage: t(
          "Nalaganje modela industrije",
          "Loading the industry model",
          "Industriemodell wird geladen",
        ),
      },
    },
    dashboard: {
      title: t("Pregled industrije", "Industry overview", "Industrieübersicht"),
      subtitle: t(
        "2 objekta · 34 senzorjev in števcev · demonstracijski podatki",
        "2 buildings · 34 sensors and meters · simulated data",
        "2 Gebäude · 34 Sensoren und Zähler · Demodaten",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices", "Aktive Geräte"),
          value: "0 / 7",
          note: t("Razsvetljava", "Lighting", "Beleuchtung"),
        },
        {
          key: "power",
          label: t("Skupna moč", "Total power", "Gesamtleistung"),
          value: "0 W",
          note: t(
            "Trenutna simulacija",
            "Current simulation",
            "Aktuelle Simulation",
          ),
        },
        {
          key: "lux",
          label: t("Svetloba okolice", "Ambient light", "Umgebungslicht"),
          value: "52 lx",
          note: t("Senzor LIGHT_03", "Sensor LIGHT_03", "Sensor LIGHT_03"),
        },
      ],
      rule: t(
        "Pravilo: svetloba < 25 lx",
        "Rule: light < 25 lx",
        "Regel: Licht < 25 lx",
      ),
      ruleStatus: t(
        "Čaka na naslednjo meritev",
        "Waiting for next reading",
        "Wartet auf nächsten Messwert",
      ),
      devices: [
        {
          id: "FACTORY_01",
          name: t("Proizvodna hala", "Production hall", "Produktionshalle"),
        },
        {
          id: "MARKET_01",
          name: t("Prodajni prostor", "Sales floor", "Verkaufsfläche"),
        },
        {
          id: "SIGN_01",
          name: t("Svetlobni napis", "Illuminated sign", "Leuchtschild"),
        },
        {
          id: "LAMP_01",
          name: t("Svetilka dvorišča 1", "Yard lamp 1", "Hofleuchte 1"),
        },
        {
          id: "LAMP_02",
          name: t("Svetilka dvorišča 2", "Yard lamp 2", "Hofleuchte 2"),
        },
        {
          id: "LAMP_03",
          name: t(
            "Svetilka parkirišča 1",
            "Car park lamp 1",
            "Parkplatzleuchte 1",
          ),
        },
        {
          id: "LAMP_04",
          name: t(
            "Svetilka parkirišča 2",
            "Car park lamp 2",
            "Parkplatzleuchte 2",
          ),
        },
      ],
      group: t("Zunanja razsvetljava", "Outdoor lighting", "Außenbeleuchtung"),
      alarms: [
        {
          id: "FREEZER_02",
          text: t(
            "Vrata zamrzovalne omare odprta · 4 min",
            "Freezer door open · 4 min",
            "Tür Tiefkühlschrank offen · 4 min",
          ),
        },
        {
          id: "LAMP_04",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
            "Schwaches Gateway-Signal · 3 min",
          ),
        },
      ],
      meters: {
        title: t(
          "Proizvodnja · energija in mediji",
          "Plant · energy and utilities",
          "Werk · Energie und Medien",
        ),
        rows: [
          row(
            t("Glavni razdelilnik", "Main switchboard", "Hauptverteiler"),
            "MAIN_LV_01",
            "main-power",
            d("371.2 kW"),
            t(
              "pogodbena 400 kW",
              "contracted 400 kW",
              "Vertragsleistung 400 kW",
            ),
          ),
          row(
            t("Razdelilnik hale", "Hall distribution", "Hallenverteiler"),
            "FACTORY_POWER_01",
            "factory-power",
            d("186.4 kW"),
            t("L1 281 A", "L1 281 A", "L1 281 A"),
          ),
          row(
            t("Komprimiran zrak", "Compressed air", "Druckluft"),
            "COMP_01",
            "air",
            "540 Nm³/h",
            t(
              "7,1 bar · puščanje 18 %",
              "7.1 bar · leaks 18%",
              "7,1 bar · Leckagen 18 %",
            ),
          ),
          row(
            t("Plin", "Gas", "Gas"),
            "GAS_01",
            "gas",
            d("14.2 m³/h"),
            t("danes 168 m³", "today 168 m³", "heute 168 m³"),
          ),
          row(
            t("Voda", "Water", "Wasser"),
            "WATER_01",
            "water",
            d("1.8 m³/h"),
            t("nočni pretok 0", "night flow 0", "Nachtdurchfluss 0"),
          ),
          row(
            t("Silosa", "Silos", "Silos"),
            "SILO_01",
            "silo",
            pct(64),
            t("dovolj za 4,5 dni", "lasts 4.5 days", "reicht für 4,5 Tage"),
          ),
          row(
            t("Temperatura v hali", "Hall temperature", "Hallentemperatur"),
            "HALL_TH_01",
            "hall-temp",
            d("22.4 °C"),
            t("Vlaga 46 %", "Humidity 46%", "Feuchte 46 %"),
          ),
          row(
            t("Vlaga v skladišču", "Warehouse humidity", "Feuchte Lager"),
            "WH_TH_01",
            "wh-rh",
            pct(48),
            d("18.6 °C"),
          ),
        ],
      },
      sensors: {
        title: t(
          "Supermarket · hladna veriga",
          "Supermarket · cold chain",
          "Supermarkt · Kühlkette",
        ),
        rows: [
          row(
            t(
              "Vitrina · mlečni izdelki",
              "Dairy chiller",
              "Kühlregal Molkereiprodukte",
            ),
            "FRIDGE_01",
            "fridge-dairy",
            d("3.8 °C"),
            t("Normalno", "Normal", "Normal"),
          ),
          row(
            t("Vitrina · meso", "Meat chiller", "Kühlregal Fleisch"),
            "FRIDGE_02",
            "fridge-meat",
            d("1.6 °C"),
            t("Normalno", "Normal", "Normal"),
          ),
          row(
            t("Hladilnica", "Cold room", "Kühlraum"),
            "COLDROOM_01",
            "coldroom",
            d("2.1 °C"),
            t("Vrata zaprta", "Door closed", "Tür geschlossen"),
          ),
          row(
            t("Zamrzovalne skrinje", "Chest freezers", "Tiefkühltruhen"),
            "FREEZER_01",
            "freezer",
            d("-21.4 °C"),
            t("Normalno", "Normal", "Normal"),
          ),
          row(
            t("Zamrzovalne omare", "Upright freezers", "Tiefkühlschränke"),
            "FREEZER_02",
            "freezer-wall",
            d("-19.8 °C"),
            t("Vrata odprta", "Door open", "Tür offen"),
          ),
          row(
            t("Hladilni agregat", "Refrigeration plant", "Kälteanlage"),
            "REFRIG_01",
            "refrig",
            d("26.3 kW"),
            t("2 / 2 kompresorja", "2 / 2 compressors", "2 / 2 Kompressoren"),
          ),
          row(
            t("Topla vitrina", "Hot deli counter", "Warme Feinkosttheke"),
            "DELI_01",
            "deli",
            d("71.2 °C"),
            t("meja ≥ 63 °C", "limit ≥ 63 °C", "Grenze ≥ 63 °C"),
          ),
          row(
            t(
              "Elektrika supermarketa",
              "Supermarket electricity",
              "Strom Supermarkt",
            ),
            "MARKET_POWER_01",
            "market-power",
            d("64.2 kW"),
            t("hlajenje 41 %", "refrigeration 41%", "Kühlung 41 %"),
          ),
        ],
      },
      panels: [
        {
          title: t(
            "KPI in analitika",
            "KPIs and analytics",
            "KPIs und Analytik",
          ),
          tag: "ANALYTICS",
          rows: [
            row(
              t("OEE proizvodnje", "Plant OEE", "OEE Werk"),
              "A × P × Q",
              "kpi-oee",
              pct(73),
              t(
                "87 % × 87 % × 97 % · cilj 85 %",
                "87% × 87% × 97% · target 85%",
                "87 % × 87 % × 97 % · Ziel 85 %",
              ),
            ),
            row(
              t("Energija na kos", "Energy per piece", "Energie pro Stück"),
              t("vse linije", "all lines", "alle Linien"),
              "kpi-kwh-pc",
              d("1.84 kWh"),
              t(
                "−6 % glede na prejšnji teden",
                "−6% on last week",
                "−6 % ggü. Vorwoche",
              ),
            ),
            row(
              t(
                "Konica / pogodbena moč",
                "Peak / contracted",
                "Spitze / Vertragsleistung",
              ),
              "MAIN_LV_01",
              "kpi-peak",
              pct(93),
              t("371 od 400 kW", "371 of 400 kW", "371 von 400 kW"),
            ),
            row(
              t("Puščanje zraka", "Compressed-air leaks", "Druckluftleckagen"),
              "COMP_01",
              "kpi-leak",
              pct(18),
              t("≈ 6.900 € na leto", "≈ €6,900 a year", "≈ 6.900 € pro Jahr"),
            ),
            row(
              t("Energija trgovine", "Store energy", "Energie Markt"),
              t("na m² · leto", "per m² · year", "pro m² · Jahr"),
              "kpi-store",
              "331 kWh/m²",
              t(
                "0,41 kWh na obiskovalca",
                "0.41 kWh per visitor",
                "0,41 kWh pro Besucher",
              ),
            ),
            row(
              t("Skladnost HACCP", "HACCP compliance", "HACCP-Konformität"),
              t("7 merilnih mest", "7 measuring points", "7 Messstellen"),
              "kpi-haccp",
              pct(d("99.6")),
              t(
                "zapis pripravljen za inšpekcijo",
                "record ready for inspection",
                "Nachweis bereit für die Kontrolle",
              ),
            ),
          ],
        },
        {
          title: t(
            "Proizvodnja in stroji",
            "Production and machines",
            "Produktion und Maschinen",
          ),
          tag: "PRODUCTION · MACHINES",
          rows: [
            row(
              t("CNC stroji", "CNC machines", "CNC-Maschinen"),
              "CNC_01–04",
              "line-cnc",
              "2 / 4",
              t(
                "tečejo · CNC 4 stoji",
                "running · CNC 4 stopped",
                "laufen · CNC 4 steht",
              ),
            ),
            row(
              t("Montažna linija", "Assembly line", "Montagelinie"),
              "LINE_01",
              "line-robot",
              "1284",
              t(
                "OEE 79 % · takt 22,4 s",
                "OEE 79% · 22.4 s cycle",
                "OEE 79 % · Takt 22,4 s",
              ),
            ),
            row(
              t("Brizganje plastike", "Injection moulding", "Spritzgießen"),
              "MOULD_01–03",
              "line-mould",
              "2316",
              t(
                "OEE 71 % · izmet 2,1 %",
                "OEE 71% · scrap 2.1%",
                "OEE 71 % · Ausschuss 2,1 %",
              ),
            ),
            row(
              t("Zastoji danes", "Downtime today", "Stillstände heute"),
              "TERM_01",
              "terminal",
              "46 min",
              t("največ: material", "top: material", "häufigster: Material"),
            ),
            row(
              t(
                "Robot 2 · vibracije",
                "Robot 2 · vibration",
                "Roboter 2 · Schwingung",
              ),
              "ROBOT_02",
              "robot-vib",
              d("3.4 mm/s"),
              t("meja 4,5 mm/s", "limit 4.5 mm/s", "Grenze 4,5 mm/s"),
            ),
            row(
              t("Klimatska naprava", "Air handling unit", "Lüftungsanlage"),
              "AHU_01",
              "ahu",
              d("18.6 kW"),
              t("pretok 62 %", "airflow 62%", "Luftstrom 62 %"),
            ),
            row(
              t("Viličar", "Forklift", "Stapler"),
              "FL_01",
              "forklift",
              pct(68),
              t("servis čez 88 h", "service in 88 h", "Wartung in 88 h"),
            ),
            row(
              t("Nakladalni rampi", "Loading docks", "Laderampen"),
              "DOCK_01",
              "dock",
              "6 min",
              t("rampa 1 odprta", "dock 1 open", "Rampe 1 offen"),
            ),
          ],
        },
        {
          title: t(
            "Trgovina in kupci",
            "Store and shoppers",
            "Markt und Kunden",
          ),
          tag: "RETAIL ANALYTICS",
          rows: [
            row(
              t("Obiskovalci danes", "Visitors today", "Besucher heute"),
              "FOOTFALL_01",
              "people",
              "1412",
              t("ta ura 186", "this hour 186", "diese Stunde 186"),
            ),
            row(
              t(
                "Čakajoči na blagajnah",
                "Waiting at checkouts",
                "Wartende an den Kassen",
              ),
              "QUEUE_01",
              "queue",
              "5",
              t("odprte 3 / 5", "3 / 5 open", "3 / 5 offen"),
            ),
            row(
              t(
                "Prosta parkirna mesta",
                "Free parking bays",
                "Freie Parkplätze",
              ),
              "PARK_01",
              "parking",
              `${free} / ${bays}`,
              t("EV 1 / 2", "EV 1 / 2", "E 1 / 2"),
            ),
            row(
              t(
                "Polnilnici EV",
                "EV chargers",
                "Ladestationen für E-Fahrzeuge",
              ),
              "EV_01–02",
              "ev",
              d("11.0 kW"),
              t(
                "danes 96 kWh · 7 sej",
                "today 96 kWh · 7 sessions",
                "heute 96 kWh · 7 Ladevorgänge",
              ),
            ),
            row(
              t("Zabojnika za odpadke", "Waste containers", "Abfallbehälter"),
              "WASTE_01–02",
              "waste",
              pct(72),
              t("odvoz jutri", "collection tomorrow", "Abholung morgen"),
            ),
            row(
              t("Sanitarije", "Restrooms", "Toiletten"),
              t("števec obiskov", "visit counter", "Besuchszähler"),
              "store-sanitary",
              "214",
              t(
                "čiščenje čez 26 obiskov",
                "cleaning in 26 visits",
                "Reinigung in 26 Besuchen",
              ),
            ),
            row(
              t("Vreme zunaj", "Weather outside", "Wetter draußen"),
              "WEATHER_01",
              "weather",
              d("24.8 °C"),
              t("PM10 18 µg/m³", "PM10 18 µg/m³", "PM10 18 µg/m³"),
            ),
          ],
        },
        {
          title: t("Varnost", "Safety", "Sicherheit"),
          tag: "SAFETY",
          in: "overview devices alarms",
          rows: [
            row(
              t(
                "Dim in CO · pisarna",
                "Smoke and CO · office",
                "Rauch und CO · Büro",
              ),
              "SMOKE_01",
              "smoke",
              d("0.02 %/m"),
              t("ni dima", "clear", "kein Rauch"),
            ),
            row(
              t("Plin ob grelniku", "Gas by the heater", "Gas am Heizgerät"),
              "GASDET_01",
              "gas-detect",
              "0 % LEL",
              t("ni plina", "clear", "kein Rauch"),
            ),
            row(
              t("Poplava · trgovina", "Flood · store", "Wasser · Markt"),
              "FLOOD_01",
              "flood",
              "0 mm",
              t("suho", "dry", "trocken"),
            ),
            row(
              t(
                "Omare razdelilnikov",
                "Switchboard cabinets",
                "Verteilerschränke",
              ),
              t("3 kontakti", "3 contacts", "3 Kontakte"),
              "safety-cabinets",
              "3 / 3",
              t("zaprte", "closed", "geschlossen"),
            ),
          ],
        },
        {
          title: t(
            "KAI · odstopanja in napovedi",
            "KAI · anomalies and forecasts",
            "KAI · Anomalien und Prognosen",
          ),
          tag: "KAI",
          in: "overview alarms",
          rows: [
            row(
              t("Robot 2 · ležaj", "Robot 2 · bearing", "Roboter 2 · Lager"),
              "ROBOT_02",
              "kai-robot",
              t("Obraba", "Wear", "Verschleiß"),
              t(
                "vibracije +34 % v 9 dneh · servis čez ~12 dni",
                "vibration +34% in 9 days · service in ~12 days",
                "Schwingung +34 % in 9 Tagen · Wartung in ~12 Tagen",
              ),
            ),
            row(
              t("Hladilni agregat", "Refrigeration plant", "Kälteanlage"),
              "REFRIG_01",
              "kai-refrig",
              t("Opozorilo", "Warning", "Warnung"),
              t(
                "tlačni tlak +12 % · kondenzator umazan",
                "discharge +12% · condenser fouling",
                "Hochdruck +12 % · Verflüssiger verschmutzt",
              ),
            ),
            row(
              t("Napoved konice", "Peak forecast", "Spitzenprognose"),
              t("danes", "today", "heute"),
              "kai-peak",
              "425 kW",
              t(
                "ob 18:00 → zamik kompresorja 2",
                "at 18:00 → shift compressor 2",
                "um 18:00 → Kompressor 2 verschieben",
              ),
            ),
            row(
              t("Anomalije porabe", "Energy anomalies", "Energieanomalien"),
              t(
                "elektrika · plin · voda · zrak",
                "power · gas · water · air",
                "Strom · Gas · Wasser · Luft",
              ),
              "kai-energy",
              t("Brez", "None", "Keine"),
              t(
                "v mejah vzorca",
                "within the learned pattern",
                "im gelernten Muster",
              ),
            ),
            row(
              t("Primerjava poslovalnic", "Store benchmark", "Filialvergleich"),
              t("5 trgovin", "5 stores", "5 Märkte"),
              "kai-bench",
              t("3. od 5", "3rd of 5", "3. von 5"),
              "331 kWh/m²",
            ),
          ],
        },
        {
          title: "NOC",
          tag: t("OPERATIVNI NADZOR", "OPERATIONS", "BETRIEB"),
          in: "overview gateways alarms",
          rows: [
            row(
              t("Naprave", "Devices", "Geräte"),
              t(
                "senzorji, števci, luči",
                "sensors, meters, lights",
                "Sensoren, Zähler, Leuchten",
              ),
              "noc-online",
              "41 / 41",
              t("povezanih", "online", "online"),
            ),
            row(
              t("Kakovost povezave", "Link quality", "Verbindungsqualität"),
              "RSSI · SNR",
              "noc-rssi",
              "−74 dBm",
              t(
                "najšibkejša: LAMP_04",
                "weakest: LAMP_04",
                "schwächste: LAMP_04",
              ),
            ),
            row(
              t("Baterije senzorjev", "Sensor batteries", "Sensorbatterien"),
              t("najnižja", "lowest", "niedrigste"),
              "noc-battery",
              pct(58),
              "WASTE_02",
            ),
            row(
              t("Integracije", "Integrations", "Integrationen"),
              "ERP · POS · MES · BMS",
              "noc-links",
              "4 / 4",
              t("povezane", "connected", "verbunden"),
            ),
          ],
        },
      ],
    },
  };
}
