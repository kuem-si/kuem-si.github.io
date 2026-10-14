import type { Locale } from "../../../lib/i18n";
import type { ReadingRow, Sensor, Tone, Twin } from "./types";
import geometry from "./datacenter-geometry.json";
import {
  LEVELS,
  PANEL_KW,
  RACKS,
  levelPower,
  rackAt,
  rackKey,
  rackNumber,
  warmest,
} from "../../../nexavia/showcase-room/datacenter-racks.js";

// The datacenter maquette, rendered by scripts/generate-datacenter-maquette.mjs:
// one building of three levels, cut in steps, with a row of water-cooled racks
// on every level. The sensors follow the power from the transformer to each
// rack's PDU and the cooling water from the racks out to the towers, and watch
// every level for water, smoke and open doors. Hotspots, unlit patches and
// sensor pins come from the generated geometry.
export function datacenterTwin(locale: Locale): Twin {
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
  const dry = t("Suho", "Dry", "Trocken");
  const floorOf = (level: number) =>
    t(`${level}. nadstropje`, `level ${level}`, `Ebene ${level}`);

  // A pin whose card shows several readings side by side; the first one is
  // the tracked value and carries the pin's key.
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
        key: index ? `${key}-${cell}` : key,
        value,
      })),
    },
  });

  // One sensor per rack: inlet and outlet air, humidity, the PDU's load and
  // the door.
  const racks: Sensor[] = LEVELS.flatMap((level) =>
    Array.from({ length: RACKS }, (_, index): Sensor => {
      const rack = index + 1;
      const key = rackKey(level, rack);
      const { temp, rh, kw, out } = rackAt(level, rack);
      const number = rackNumber(level, rack);
      const name = t(`Omara ${number}`, `Rack ${number}`, `Rack ${number}`);
      return pin(
        key,
        `RACK_${number.replace(".", "")}`,
        "air",
        "°C",
        t(
          `Senzor in PDU · omara ${number}`,
          `Sensor and PDU · rack ${number}`,
          `Sensor und PDU · Rack ${number}`,
        ),
        t(
          `${name} · ${level}. nadstropje`,
          `${name} · level ${level}`,
          `${name} · Ebene ${level}`,
        ),
        [
          [
            t("Vstopni zrak", "Inlet air", "Zuluft"),
            d(`${temp.toFixed(1)} °C`),
          ],
          [
            t("Izstopni zrak", "Outlet air", "Abluft"),
            d(`${out.toFixed(1)} °C`),
            "out",
          ],
          [t("Vlaga", "Humidity", "Luftfeuchtigkeit"), pct(rh), "rh"],
          [
            t("Moč PDU", "PDU load", "PDU-Last"),
            d(`${kw.toFixed(1)} kW`),
            "kw",
          ],
          ["ΔT", d(`${(out - temp).toFixed(1)} K`), "dt"],
          [
            t("Vrata", "Doors", "Türen"),
            t("Zaprta", "Closed", "Geschlossen"),
            "door",
          ],
        ],
        {
          event: name,
          side: level === 1 ? "above" : "below",
          ...(rack <= 2 ? { align: "start" as const } : {}),
          alert: 30,
          uses: t(
            "Pravilo: vstopni zrak > 30 °C → alarm in večji pretok hladilne vode",
            "Rule: inlet air > 30 °C → alarm and more cooling water",
            "Regel: Zuluft > 30 °C → Alarm und mehr Kühlwasser",
          ),
        },
      );
    }),
  );
  // Per level: the leak detector's cable in the floor void, the row's power
  // panel, the smoke detector, the gas suppression and the door to the room
  // beside the hall.
  const rooms = [
    t("strojnica hlajenja", "cooling plant", "Kältezentrale"),
    t("prostor napajanja", "power room", "Stromversorgungsraum"),
    t("nadzorna soba", "control room", "Leitwarte"),
  ];
  const perLevel: Sensor[] = LEVELS.flatMap((level) => {
    const side = level === 1 ? ("above" as const) : ("below" as const);
    const load = levelPower(level);
    const amps = (share: number) =>
      `${Math.round((load * 1000 * share) / 230)} A`;
    return [
      pin(
        `leak-${level}`,
        `LEAK_0${level}`,
        "water",
        "mm",
        t(
          `Tipalni kabel izliva vode · ${level}. nadstropje`,
          `Leak-sensing cable · level ${level}`,
          `Leckage-Sensorkabel · Ebene ${level}`,
        ),
        t(
          `Izliv vode · ${level}. nadstropje`,
          `Leak detection · level ${level}`,
          `Leckageerkennung · Ebene ${level}`,
        ),
        [
          [t("Voda", "Water", "Wasser"), "0 mm"],
          [
            t("Mesto na kablu", "Place on the cable", "Stelle am Kabel"),
            "–",
            "at",
          ],
          [t("Dolžina kabla", "Cable length", "Kabellänge"), "42 m", "length"],
        ],
        {
          event: t(
            `Voda pod dvignjenim podom · ${level}. nadstropje`,
            `Water under the raised floor · level ${level}`,
            `Wasser unter dem Doppelboden · Ebene ${level}`,
          ),
          eventNote: true,
          side,
          align: "end",
          alert: 1,
          every: undefined,
          uses: t(
            "Pravilo: voda pod podom → alarm in zapora ventila hladilne zanke",
            "Rule: water under the floor → alarm and the loop's valve closed",
            "Regel: Wasser unter dem Boden → Alarm und Ventil des Kühlkreises geschlossen",
          ),
        },
      ),
      pin(
        `rpp-${level}`,
        `RPP_0${level}`,
        "power",
        "kW",
        t(
          `Razdelilnik vrste (RPP) · ${level}. nadstropje`,
          `Row power panel (RPP) · level ${level}`,
          `Reihenverteiler (RPP) · Ebene ${level}`,
        ),
        t(
          `Razdelilnik vrste · ${floorOf(level)}`,
          `Row power panel · ${floorOf(level)}`,
          `Reihenverteiler · ${floorOf(level)}`,
        ),
        [
          [t("Moč", "Load", "Last"), d(`${load.toFixed(1)} kW`)],
          ["L1", amps(0.35), "l1"],
          ["L2", amps(0.33), "l2"],
          ["L3", amps(0.32), "l3"],
          [
            t("Zasedenost", "Capacity used", "Ausgelastete Kapazität"),
            pct(Math.round((load / PANEL_KW) * 100)),
            "load",
          ],
          [t("Veje", "Branches", "Abgänge"), "10 / 10", "branches"],
        ],
        {
          side,
          alert: PANEL_KW * 0.9,
          every: every1,
          uses: t(
            "Pravilo: veja > 90 % → alarm preobremenitve · uravnoteženje faz",
            "Rule: branch > 90% → overload alarm · phase balancing",
            "Regel: Abgang > 90 % → Überlastalarm · Phasenausgleich",
          ),
        },
      ),
      pin(
        `smoke-${level}`,
        `SMOKE_0${level}`,
        "air",
        "%/m",
        t(
          `Javljalnik dima · ${level}. nadstropje`,
          `Smoke detector · level ${level}`,
          `Rauchmelder · Ebene ${level}`,
        ),
        t(
          `Dim · ${floorOf(level)}`,
          `Smoke · ${floorOf(level)}`,
          `Rauch · ${floorOf(level)}`,
        ),
        [
          [t("Zatemnitev", "Obscuration", "Verdunkelung"), d("0.02 %/m")],
          [
            t("Dvig temperature", "Temperature rise", "Temperaturanstieg"),
            d("0.1 °C/min"),
            "rise",
          ],
          [
            t("Stanje", "State", "Zustand"),
            t("Ni dima", "Clear", "Kein Rauch"),
            "state",
          ],
        ],
        {
          side,
          align: "start",
          alert: 0.1,
          every: undefined,
          uses: t(
            "Pravilo: dim ali nenaden dvig temperature → alarm in priprava gašenja",
            "Rule: smoke or a sudden temperature rise → alarm and suppression armed",
            "Regel: Rauch oder plötzlicher Temperaturanstieg → Alarm und Löschanlage scharf geschaltet",
          ),
        },
      ),
      pin(
        `gas-${level}`,
        `GAS_0${level}`,
        "gas",
        "bar",
        t(
          `Plinsko gašenje · ${level}. nadstropje`,
          `Gas suppression · level ${level}`,
          `Gaslöschanlage · Ebene ${level}`,
        ),
        t(
          `Plinsko gašenje · ${floorOf(level)}`,
          `Gas suppression · ${floorOf(level)}`,
          `Gaslöschanlage · ${floorOf(level)}`,
        ),
        [
          [t("Tlak", "Pressure", "Luftdruck"), "42 bar"],
          [
            t("Stanje", "State", "Zustand"),
            t("Pripravljeno", "Armed", "Scharf"),
            "state",
          ],
          [t("Jeklenke", "Cylinders", "Flaschen"), "4 / 4", "cylinders"],
        ],
        { side, align: "start", every: every15 },
      ),
      pin(
        `door-${level}`,
        `DOOR_0${level}`,
        "structure",
        "IO",
        t(
          `Kontakt požarnih vrat · ${rooms[level - 1]}`,
          `Fire door contact · ${rooms[level - 1]}`,
          `Brandschutztürkontakt · ${rooms[level - 1]}`,
        ),
        t(
          `Vrata · ${rooms[level - 1]}`,
          `Door · ${rooms[level - 1]}`,
          `Tür · ${rooms[level - 1]}`,
        ),
        [
          [t("Vrata", "Door", "Tür"), closed],
          [t("Prisotni", "People inside", "Personen im Raum"), "1", "occ"],
          [t("Zadnji vstop", "Last entry", "Letzter Zutritt"), "13:42", "last"],
        ],
        {
          side,
          align: "end",
          every: undefined,
          uses: t(
            "Fizična varnost · dnevnik vstopov in prisotnosti",
            "Physical security · log of entries and presence",
            "Physische Sicherheit · Protokoll von Zutritten und Anwesenheit",
          ),
        },
      ),
    ];
  });

  const row = (
    label: string,
    id: string,
    key: string,
    value: string,
    note: string,
  ): ReadingRow => ({ label, id, key, value, note });
  const total = LEVELS.reduce((sum, level) => sum + levelPower(level), 0);

  return {
    id: "datacenter",
    tab: {
      title: t("Podatkovni center", "Datacenter", "Rechenzentrum"),
      meta: t(
        "Maketa 60 × 60 cm · 6 naprav",
        "60 × 60 cm model · 6 devices",
        "Modell 60 × 60 cm · 6 Geräte",
      ),
    },
    intro: {
      title: t(
        "Podatkovni center, ki ve za vsako omaro in vsako kapljo.",
        "A datacenter that knows every rack and every drop.",
        "Ein Rechenzentrum, das jedes Rack und jeden Tropfen kennt.",
      ),
      lead: t(
        "Stavba je prikazana v stopničastem prerezu, zato vsako nadstropje vidite hkrati kot tloris in kot naris. Meritve sledijo elektriki od transformatorja prek UPS-a in razdelilnika vrste do PDU-ja vsake omare ter hladilni vodi od omar do hladilnih stolpov; vsako nadstropje nadzirajo še tipalni kabel izliva, javljalnik dima in kontakti vrat. Nexavia iz tega računa PUE, WUE in zasedenost, KAI pa napove okvaro, še preden nastane.",
        "The building is shown in a stepped section, so every level reads as a floor plan and a side view at once. The readings follow the electricity from the transformer through the UPS and the row's power panel to each rack's PDU, and the cooling water from the racks out to the towers; a leak-sensing cable, a smoke detector and door contacts watch every level. From these Nexavia works out PUE, WUE and capacity in use, and KAI predicts a failure before it happens.",
        "Das Gebäude ist in einem gestuften Schnitt dargestellt, sodass jede Ebene zugleich als Grundriss und als Seitenansicht lesbar ist. Die Messungen verfolgen den Strom vom Transformator über die USV und den Reihenverteiler bis zur PDU jedes Racks sowie das Kühlwasser von den Racks bis zu den Kühltürmen; ein Leckage-Sensorkabel, ein Rauchmelder und Türkontakte überwachen jede Ebene. Daraus berechnet Nexavia PUE, WUE und die genutzte Kapazität, und KAI sagt einen Ausfall voraus, bevor er eintritt.",
      ),
    },
    panel: {
      view: t(
        "Pogled v prerezu · povlecite za raziskovanje",
        "Section view · drag to explore",
        "Schnittansicht · ziehen zum Erkunden",
      ),
      hint: t(
        "Kliknite senzor na omari, razdelilniku ali v dvorišču, da pošlje meritev, ali nadstropje oz. zunanjo svetilko za vklop in izklop",
        "Click a sensor on a rack, a power panel or in the yard to send a reading, or a level or an outdoor lamp to switch it on or off",
        "Klicken Sie auf einen Sensor an einem Rack, einem Verteiler oder im Hof, um einen Messwert zu senden, oder auf eine Ebene bzw. eine Außenleuchte, um sie ein- oder auszuschalten",
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
      photo: "/images/nexavia/showcase-room/datacenter/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa podatkovnega centra velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: trinadstropna stavba v stopničastem prerezu, v vsakem nadstropju vrsta desetih strežniških omar z vmesnimi hladilniki in razdelilnikom vrste na dvignjenem podu z modrimi in rdečimi cevmi hladilne vode, ob dvoranah strojnica hlajenja, prostor z napajanjem in nadzorna soba, desno hladilna stolpa z vodomerom, spredaj parkirišče, agregat, rezervoar goriva, transformator in glavni razdelilnik",
        "60 by 60 centimetre datacenter maquette of four 30 by 30 centimetre modules: a three-level building in a stepped section, on each level a row of ten server racks with in-row coolers and the row's power panel on a raised floor carrying blue and red cooling-water pipes, beside the halls a cooling plant room, a power room and a control room, on the right two cooling towers with a water meter, and in front a car park, a generator, a fuel tank, a transformer and the main switchboard",
        "Rechenzentrumsmodell im Format 60 × 60 cm aus vier Modulen à 30 × 30 cm: ein dreistöckiges Gebäude im gestuften Schnitt, auf jeder Ebene eine Reihe von zehn Server-Racks mit Inrow-Kühlern und dem Reihenverteiler auf einem Doppelboden mit blauen und roten Kühlwasserleitungen, neben den Sälen eine Kältezentrale, ein Stromversorgungsraum und eine Leitwarte, rechts zwei Kühltürme mit Wasserzähler, vorne ein Parkplatz, ein Notstromaggregat, ein Kraftstofftank, ein Transformator und der Hauptverteiler",
      ),
      lightsDir: "/images/nexavia/showcase-room/datacenter/lights",
      modules: [
        {
          letter: "A",
          name: t("Podatkovne dvorane", "Data halls", "Datensäle"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t("Hlajenje", "Cooling", "Kühlung"),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t(
            "Dostop · parkirišče",
            "Access · car park",
            "Zufahrt · Parkplatz",
          ),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Napajanje", "Power supply", "Stromversorgung"),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      lighting: [
        device(
          "FLOOR_01",
          t(
            "Razsvetljava 1. nadstropja",
            "Level 1 lighting",
            "Beleuchtung Ebene 1",
          ),
        ),
        device(
          "FLOOR_02",
          t(
            "Razsvetljava 2. nadstropja",
            "Level 2 lighting",
            "Beleuchtung Ebene 2",
          ),
        ),
        device(
          "FLOOR_03",
          t(
            "Razsvetljava 3. nadstropja",
            "Level 3 lighting",
            "Beleuchtung Ebene 3",
          ),
        ),
        device(
          "LAMP_01",
          t("Svetilka parkirišča", "Car park lamp", "Parkplatzleuchte"),
          true,
        ),
        device("LAMP_02", t("Svetilka vhoda", "Gate lamp", "Torleuchte"), true),
        device(
          "LAMP_03",
          t(
            "Svetilka hladilnega dvorišča",
            "Cooling yard lamp",
            "Leuchte Kühlhof",
          ),
          true,
        ),
      ],
      sensors: [
        {
          key: "lux",
          id: "LIGHT_04",
          tone: "light",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor", "Lichtsensor"),
          event: t("Svetloba okolice", "Ambient light", "Umgebungslicht"),
          at: at("lux"),
          side: "below",
          align: "end",
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
              "Streha podatkovnega centra",
              "Datacenter roof",
              "Dach des Rechenzentrums",
            ),
          },
        },
        ...racks,
        ...perLevel,
        // The power, from the grid to the halls.
        pin(
          "power",
          "POWER_01",
          "power",
          "kW",
          t(
            "Števec glavnega razdelilnika",
            "Main switchboard meter",
            "Zähler Hauptverteiler",
          ),
          t("Električna moč", "Electrical load", "Elektrische Last"),
          [
            [t("Moč", "Load", "Last"), d("412.6 kW")],
            [t("Danes", "Today", "Heute"), "6184 kWh", "kwh"],
            [t("Konica", "Peak", "Spitze"), d("431.2 kW"), "peak"],
          ],
          {
            eventNote: true,
            align: "end",
            alert: 450,
            every: every15,
            card: { kind: "meter" } as Sensor["card"],
            uses: t(
              "Pravilo: konica > 450 kW → omejevanje konice · stroškovni KPI",
              "Rule: peak > 450 kW → peak management · cost KPI",
              "Regel: Spitze > 450 kW → Lastspitzenmanagement · Kosten-KPI",
            ),
          },
        ),
        pin(
          "pq",
          "PQ_01",
          "power",
          "V",
          t(
            "Analizator kakovosti električne energije",
            "Power-quality analyser",
            "Netzqualitätsanalysator",
          ),
          t(
            "Kakovost napajanja · dovod A",
            "Power quality · feed A",
            "Netzqualität · Einspeisung A",
          ),
          [
            [t("Napetost", "Voltage", "Spannung"), "231 V"],
            ["THD", pct(d("3.1")), "thd"],
            ["cos φ", d("0.97"), "pf"],
            [t("Frekvenca", "Frequency", "Frequenz"), d("50.00 Hz"), "hz"],
            [t("Tok", "Current", "Strom"), "612 A", "a"],
            [
              t("Dogodki danes", "Events today", "Ereignisse heute"),
              "0",
              "events",
            ],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "Izpad, upad in prenapetost s časovnim žigom → korelacija alarmov",
              "Outage, sag and swell with a timestamp → alarm correlation",
              "Ausfall, Spannungseinbruch und Überspannung mit Zeitstempel → Alarmkorrelation",
            ),
          },
        ),
        pin(
          "gen",
          "GEN_01",
          "power",
          "kW",
          t("Rezervni agregat", "Standby generator", "Notstromaggregat"),
          t("Agregat", "Generator", "Aggregat"),
          [
            [t("Izhodna moč", "Output", "Ausgangsleistung"), "0 kW"],
            [
              t("Stanje", "State", "Zustand"),
              t("Pripravljen", "Standby", "Bereit"),
              "state",
            ],
            [
              t("Delovne ure", "Running hours", "Betriebsstunden"),
              "312 h",
              "hours",
            ],
            [t("Motor", "Engine", "Motor"), "38 °C", "temp"],
            [t("Napetost", "Voltage", "Spannung"), "0 V", "v"],
            [t("Frekvenca", "Frequency", "Frequenz"), d("0.0 Hz"), "hz"],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "Pravilo: izpad omrežja → zagon · servis na 500 delovnih ur",
              "Rule: mains failure → start · service every 500 running hours",
              "Regel: Netzausfall → Start · Wartung alle 500 Betriebsstunden",
            ),
          },
        ),
        pin(
          "fuel",
          "FUEL_01",
          "gas",
          "%",
          t(
            "Senzor nivoja goriva",
            "Fuel level sensor",
            "Füllstandssensor Kraftstoff",
          ),
          t("Rezervoar goriva", "Fuel tank", "Kraftstofftank"),
          [
            [t("Nivo", "Level", "Pegel"), pct(86)],
            [t("Avtonomija", "Autonomy", "Autonomie"), "41 h", "hours"],
            [t("Puščanje", "Leak", "Leckage"), dry, "leak"],
          ],
          {
            side: "above",
            align: "end",
            every: every15,
            uses: t(
              "Pravilo: nivo < 40 % → naročilo goriva · puščanje → alarm",
              "Rule: level < 40% → fuel order · leak → alarm",
              "Regel: Füllstand < 40 % → Kraftstoff bestellt · Leckage → Alarm",
            ),
          },
        ),
        pin(
          "ups",
          "UPS_01",
          "power",
          "%",
          t(
            "Brezprekinitveno napajanje (UPS)",
            "Uninterruptible power supply",
            "Unterbrechungsfreie Stromversorgung (USV)",
          ),
          "UPS",
          [
            [t("Obremenitev", "Load", "Last"), pct(58)],
            [
              t("Izhod", "Output", "Ausgangsleistung"),
              d(`${total.toFixed(1)} kW`),
              "kw",
            ],
            [t("Vhod", "Input", "Eingang"), "231 V", "in"],
            [
              t("Vir", "Source", "Quelle"),
              t("Omrežje", "Mains", "Netz"),
              "mode",
            ],
            ["Bypass", t("Izklopljen", "Off", "Aus"), "bypass"],
            [t("Alarmi", "Alarms", "Alarme"), "0", "alarms"],
          ],
          {
            alert: 90,
            every: every1,
            uses: t(
              "Pravilo: obremenitev > 90 % ali bypass → alarm · redundanca",
              "Rule: load > 90% or bypass → alarm · redundancy",
              "Regel: Last > 90 % oder Bypass → Alarm · Redundanz",
            ),
          },
        ),
        pin(
          "battery",
          "BATT_01",
          "power",
          "%",
          t(
            "Nadzor baterijskih nizov",
            "Battery string monitor",
            "Batteriestrang-Überwachung",
          ),
          t("Baterije UPS", "UPS batteries", "USV-Batterien"),
          [
            [t("Naboj", "Charge", "Ladung"), pct(100)],
            [
              t("Avtonomija", "Runtime", "Überbrückungszeit"),
              "14 min",
              "runtime",
            ],
            ["SoH", pct(94), "soh"],
            [t("Temp.", "Temperature", "Temperatur"), d("24.1 °C"), "temp"],
            [
              t("Napetost niza", "String voltage", "Strangspannung"),
              "544 V",
              "v",
            ],
            [
              t("Upornost celice", "Cell resistance", "Zellwiderstand"),
              d("3.2 mΩ"),
              "r",
            ],
          ],
          {
            align: "end",
            uses: t(
              "KAI: napoved okvare iz upornosti in temperature celic",
              "KAI: failure forecast from cell resistance and temperature",
              "KAI: Ausfallprognose aus Zellwiderstand und Temperatur",
            ),
          },
        ),
        // The cooling water, from the halls to the towers.
        {
          key: "cooling",
          id: "CHW_01",
          tone: "water",
          tag: "°C",
          label: t(
            "Senzor temperature hladilne vode",
            "Cooling water temperature sensor",
            "Temperatursensor Kühlwasser",
          ),
          event: t(
            "Hladilna voda · dovod",
            "Cooling water · supply",
            "Kühlwasser · Vorlauf",
          ),
          eventNote: true,
          at: at("cooling"),
          side: "above",
          align: "end",
          alert: 22,
          every: every1,
          uses: t(
            "Pravilo: dovod > 22 °C → vklop drugega hladilnega stolpa",
            "Rule: supply > 22 °C → second cooling tower on",
            "Regel: Vorlauf > 22 °C → zweiter Kühlturm ein",
          ),
          card: {
            kind: "sensor",
            title: t("Hladilna voda", "Cooling water", "Kühlwasser"),
            value: d("17.8 °C"),
            grid: [
              {
                label: t("Dovod", "Supply", "Versorgung"),
                key: "cooling",
                value: d("17.8 °C"),
              },
              {
                label: t("Povratek", "Return", "Rücklauf"),
                key: "cooling-return",
                value: d("23.9 °C"),
              },
            ],
          },
        },
        pin(
          "pump",
          "PUMP_01",
          "water",
          "m³/h",
          t(
            "Merilnik pretoka in tlaka hladilne vode",
            "Cooling water flow and pressure meter",
            "Durchfluss- und Druckmesser Kühlwasser",
          ),
          t("Obtočni črpalki", "Circulation pumps", "Umwälzpumpen"),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("49.3 m³/h")],
            [t("Tlak", "Pressure", "Luftdruck"), d("2.8 bar"), "bar"],
            [
              t("Hladilna moč", "Cooling delivered", "Kälteleistung"),
              "349 kW",
              "cool",
            ],
            [
              t("Moč črpalk", "Pump power", "Pumpenleistung"),
              d("11.2 kW"),
              "kw",
            ],
            [
              t("Stanje", "State", "Zustand"),
              t("Tečeta", "Running", "Läuft"),
              "state",
            ],
            [t("Δp hodnikov", "Aisle Δp", "Δp Gänge"), "12 Pa", "dp"],
          ],
          {
            side: "above",
            every: every1,
            uses: t(
              "Hladilna moč in poraba hlajenja za PUE · diagnostika tlaka",
              "Cooling delivered and cooling energy for PUE · pressure diagnostics",
              "Kälteleistung und Kühlenergie für die PUE · Druckdiagnose",
            ),
          },
        ),
        pin(
          "tower",
          "TOWER_01",
          "water",
          "%",
          t(
            "Krmilnik hladilnega stolpa",
            "Cooling tower controller",
            "Steuerung Kühlturm",
          ),
          t("Hladilna stolpa", "Cooling towers", "Kühltürme"),
          [
            [t("Ventilator", "Fan speed", "Lüfterdrehzahl"), pct(62)],
            [
              t("Stolp 1", "Tower 1", "Turm 1"),
              t("Teče", "Running", "Läuft"),
              "state",
            ],
            [
              t("Stolp 2", "Tower 2", "Turm 2"),
              t("Pripravljen", "Standby", "Bereit"),
              "second",
            ],
            [t("Moč", "Power", "Leistung"), d("18.4 kW"), "kw"],
            ["COP", d("6.9"), "cop"],
            [
              t("Naslednji servis", "Next service", "Nächste Wartung"),
              t("38 dni", "38 days", "38 Tage"),
              "service",
            ],
          ],
          {
            align: "end",
            every: every1,
            uses: t(
              "KAI: napoved okvare hladilne opreme iz hitrosti in porabe ventilatorja",
              "KAI: cooling-equipment failure forecast from fan speed and power",
              "KAI: Ausfallprognose der Kühltechnik aus Lüfterdrehzahl und Leistung",
            ),
          },
        ),
        pin(
          "water",
          "WATER_01",
          "water",
          "m³/h",
          t(
            "Vodomer dopolnilne vode",
            "Make-up water meter",
            "Wasserzähler Zusatzwasser",
          ),
          t("Poraba vode", "Water use", "Wasserverbrauch"),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("0.15 m³/h")],
            [t("Danes", "Today", "Heute"), d("2.1 m³"), "day"],
            [t("Tlak", "Pressure", "Luftdruck"), d("3.4 bar"), "bar"],
          ],
          {
            align: "end",
            every: every15,
            card: { kind: "meter" } as Sensor["card"],
            uses: t(
              "WUE in stroškovni nadzor porabe vode",
              "WUE and cost control of water use",
              "WUE und Kostenkontrolle des Wasserverbrauchs",
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
          "Nalaganje modela podatkovnega centra",
          "Loading the datacenter model",
          "Rechenzentrumsmodell wird geladen",
        ),
      },
    },
    dashboard: {
      title: t(
        "Pregled podatkovnega centra",
        "Datacenter overview",
        "Rechenzentrumsübersicht",
      ),
      subtitle: t(
        "3 nadstropja · 30 omar · demonstracijski podatki",
        "3 levels · 30 racks · simulated data",
        "3 Ebenen · 30 Racks · Demodaten",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices", "Aktive Geräte"),
          value: "0 / 6",
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
          note: t("Senzor LIGHT_04", "Sensor LIGHT_04", "Sensor LIGHT_04"),
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
        { id: "FLOOR_01", name: t("1. nadstropje", "Level 1", "Ebene 1") },
        { id: "FLOOR_02", name: t("2. nadstropje", "Level 2", "Ebene 2") },
        { id: "FLOOR_03", name: t("3. nadstropje", "Level 3", "Ebene 3") },
        {
          id: "LAMP_01",
          name: t("Svetilka parkirišča", "Car park lamp", "Parkplatzleuchte"),
        },
        { id: "LAMP_02", name: t("Svetilka vhoda", "Gate lamp", "Torleuchte") },
        {
          id: "LAMP_03",
          name: t(
            "Svetilka hladilnega dvorišča",
            "Cooling yard lamp",
            "Leuchte Kühlhof",
          ),
        },
      ],
      group: t("Zunanja razsvetljava", "Outdoor lighting", "Außenbeleuchtung"),
      alarms: [
        {
          id: "LAMP_03",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
            "Schwaches Gateway-Signal · 3 min",
          ),
        },
      ],
      meters: {
        title: t("Hlajenje in voda", "Cooling and water", "Kühlung und Wasser"),
        rows: [
          row(
            t(
              "Hladilna voda · dovod",
              "Cooling water · supply",
              "Kühlwasser · Vorlauf",
            ),
            "CHW_01",
            "cooling",
            d("17.8 °C"),
            t("Povratek 23,9 °C", "Return 23.9 °C", "Rücklauf 23,9 °C"),
          ),
          row(
            t(
              "Pretok hladilne vode",
              "Cooling water flow",
              "Kühlwasserdurchfluss",
            ),
            "PUMP_01",
            "pump",
            d("49.3 m³/h"),
            t(
              "2,8 bar · 349 kW hladu",
              "2.8 bar · 349 kW cooling",
              "2,8 bar · 349 kW Kälte",
            ),
          ),
          row(
            t("Hladilna stolpa", "Cooling towers", "Kühltürme"),
            "TOWER_01",
            "tower",
            pct(62),
            t(
              "COP 6,9 · stolp 2 pripravljen",
              "COP 6.9 · tower 2 standby",
              "COP 6,9 · Turm 2 in Bereitschaft",
            ),
          ),
          row(
            t("Poraba vode", "Water use", "Wasserverbrauch"),
            "WATER_01",
            "water",
            d("0.15 m³/h"),
            t("Danes 2,1 m³", "Today 2.1 m³", "Heute 2,1 m³"),
          ),
          ...LEVELS.map((level) =>
            row(
              t(
                `Izliv vode · ${level}. nadstropje`,
                `Leak detection · level ${level}`,
                `Leckageerkennung · Ebene ${level}`,
              ),
              `LEAK_0${level}`,
              `leak-${level}`,
              "0 mm",
              dry,
            ),
          ),
        ],
      },
      sensors: {
        title: t(
          "Omare · najtoplejša v nadstropju",
          "Racks · warmest per level",
          "Racks · wärmstes pro Ebene",
        ),
        rows: LEVELS.map((level) => {
          const { rack, temp } = warmest(level);
          const number = rackNumber(level, rack);
          return {
            label: t(
              `${level}. nadstropje`,
              `Level ${level}`,
              `Ebene ${level}`,
            ),
            id: t(
              `${RACKS} senzorjev`,
              `${RACKS} sensors`,
              `${RACKS} Sensoren`,
            ),
            key: `level-${level}`,
            value: d(`${temp.toFixed(1)} °C`),
            note: t(`Omara ${number}`, `Rack ${number}`, `Rack ${number}`),
          };
        }),
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
              "PUE",
              t("objekt ÷ IT", "facility ÷ IT", "Gebäude ÷ IT"),
              "kpi-pue",
              d("1.18"),
              t("cilj ≤ 1,25", "target ≤ 1.25", "Ziel ≤ 1,25"),
            ),
            row(
              "WUE",
              t(
                "voda ÷ energija IT",
                "water ÷ IT energy",
                "Wasser ÷ IT-Energie",
              ),
              "kpi-wue",
              d("0.42 L/kWh"),
              t("zadnjih 30 dni", "last 30 days", "letzte 30 Tage"),
            ),
            row(
              t("Breme IT", "IT load", "IT-Last"),
              t("30 omar", "30 racks", "30 Racks"),
              "kpi-it",
              d(`${total.toFixed(1)} kW`),
              t(
                "od 412,6 kW objekta",
                "of 412.6 kW facility",
                "von 412,6 kW Gebäude",
              ),
            ),
            row(
              t(
                "Zasedenost napajanja",
                "Power capacity used",
                "Genutzte Stromkapazität",
              ),
              "PDU · RPP · UPS",
              "kpi-pcap",
              pct(69),
              t("412,6 od 600 kW", "412.6 of 600 kW", "412,6 von 600 kW"),
            ),
            row(
              t(
                "Zasedenost hlajenja",
                "Cooling capacity used",
                "Genutzte Kühlkapazität",
              ),
              t("zanka · stolpa", "loop · towers", "Kreislauf · Türme"),
              "kpi-ccap",
              pct(58),
              t("349 od 600 kW", "349 of 600 kW", "349 von 600 kW"),
            ),
            row(
              t("Poraba najemnikov", "Energy by tenant", "Energie nach Mieter"),
              t(
                "4 najemniki · ta mesec",
                "4 tenants · this month",
                "4 Mieter · dieser Monat",
              ),
              "kpi-tenant",
              d("171.3 MWh"),
              t(
                "največji: A · 61,2 MWh",
                "largest: A · 61.2 MWh",
                "größter: A · 61,2 MWh",
              ),
            ),
          ],
        },
        {
          title: t("Napajalna veriga", "Power chain", "Stromkette"),
          tag: t("OMREŽJE → OMARA", "GRID → RACK", "NETZ → RACK"),
          rows: [
            row(
              t("Električna moč", "Electrical load", "Elektrische Last"),
              "POWER_01",
              "power",
              d("412.6 kW"),
              t("konica 431,2 kW", "peak 431.2 kW", "Spitze 431,2 kW"),
            ),
            row(
              t("Kakovost napajanja", "Power quality", "Netzqualität"),
              "PQ_01",
              "pq",
              "231 V",
              t(
                "THD 3,1 % · cos φ 0,97",
                "THD 3.1% · cos φ 0.97",
                "THD 3,1 % · cos φ 0,97",
              ),
            ),
            row(
              "UPS",
              "UPS_01",
              "ups",
              pct(58),
              t("vir: omrežje", "source: mains", "Quelle: Netz"),
            ),
            row(
              t("Baterije UPS", "UPS batteries", "USV-Batterien"),
              "BATT_01",
              "battery",
              pct(100),
              t("avtonomija 14 min", "runtime 14 min", "Überbrückung 14 min"),
            ),
            row(
              t("Agregat", "Generator", "Aggregat"),
              "GEN_01",
              "gen",
              "0 kW",
              t("pripravljen", "standby", "Bereitschaft"),
            ),
            row(
              t("Gorivo", "Fuel", "Kraftstoff"),
              "FUEL_01",
              "fuel",
              pct(86),
              t("avtonomija 41 h", "41 h autonomy", "41 h Autonomie"),
            ),
            ...LEVELS.map((level) => {
              const load = levelPower(level);
              return row(
                t(
                  `Razdelilnik · ${level}. nadstropje`,
                  `Power panel · level ${level}`,
                  `Verteiler · Ebene ${level}`,
                ),
                `RPP_0${level}`,
                `rpp-${level}`,
                d(`${load.toFixed(1)} kW`),
                t(
                  `${Math.round((load / PANEL_KW) * 100)} % od ${PANEL_KW} kW`,
                  `${Math.round((load / PANEL_KW) * 100)}% of ${PANEL_KW} kW`,
                  `${Math.round((load / PANEL_KW) * 100)} % von ${PANEL_KW} kW`,
                ),
              );
            }),
          ],
        },
        {
          title: t(
            "Varnost in dostop",
            "Safety and access",
            "Sicherheit und Zutritt",
          ),
          tag: "SAFETY · SECURITY",
          in: "overview devices alarms",
          rows: [
            ...LEVELS.map((level) =>
              row(
                t(
                  `Dim · ${level}. nadstropje`,
                  `Smoke · level ${level}`,
                  `Rauch · Ebene ${level}`,
                ),
                `SMOKE_0${level}`,
                `smoke-${level}`,
                d("0.02 %/m"),
                t("ni dima", "clear", "kein Rauch"),
              ),
            ),
            row(
              t("Plinsko gašenje", "Gas suppression", "Gaslöschanlage"),
              "GAS_01–GAS_03",
              "safety-gas",
              "3 / 3",
              t("pripravljeno", "armed", "scharf"),
            ),
            row(
              t("Požarna vrata", "Fire doors", "Brandschutztüren"),
              "DOOR_01–DOOR_03",
              "safety-doors",
              "3 / 3",
              t("zaprta", "closed", "geschlossen"),
            ),
            row(
              t("Vrata omar", "Rack doors", "Racktüren"),
              t("30 omar", "30 racks", "30 Racks"),
              "safety-racks",
              "30 / 30",
              t("zaprta", "closed", "geschlossen"),
            ),
            row(
              t("Prisotnost", "Occupancy", "Anwesenheit"),
              t("po prostorih", "by room", "nach Raum"),
              "safety-occ",
              "3",
              t(
                "oseb v stavbi",
                "people in the building",
                "Personen im Gebäude",
              ),
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
              t("Anomalije porabe", "Energy anomalies", "Energieanomalien"),
              t(
                "objekt · RPP · omare",
                "site · RPP · racks",
                "Gebäude · RPP · Racks",
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
              t(
                "Termalne anomalije",
                "Thermal anomalies",
                "Thermische Anomalien",
              ),
              t("omare · hodniki", "racks · aisles", "Racks · Gänge"),
              "kai-thermal",
              t("Brez", "None", "Keine"),
              t("ni vročih točk", "no hot spots", "keine Hotspots"),
            ),
            row(
              t("Baterija UPS", "UPS battery", "USV-Batterie"),
              "BATT_01",
              "kai-battery",
              t("SoH 94 %", "SoH 94%", "SoH 94 %"),
              t(
                "zamenjava čez ~26 mes.",
                "replace in ~26 months",
                "Austausch in ~26 Monaten",
              ),
            ),
            row(
              t("Hladilna oprema", "Cooling equipment", "Kühltechnik"),
              "TOWER_01 · PUMP_01",
              "kai-cooling",
              t("V redu", "Healthy", "In Ordnung"),
              t(
                "servis čez 38 dni",
                "service in 38 days",
                "Wartung in 38 Tagen",
              ),
            ),
            row(
              t("Odstopanje PUE", "PUE deviation", "PUE-Abweichung"),
              t(
                "glede na vzorec",
                "against the pattern",
                "im Vergleich zum Muster",
              ),
              "kai-pue",
              d("+0.00"),
              t(
                "brez vzroka za ukrep",
                "nothing to act on",
                "kein Handlungsbedarf",
              ),
            ),
            row(
              t("Napoved konice", "Peak forecast", "Spitzenprognose"),
              t("naslednjih 24 h", "next 24 h", "nächste 24 h"),
              "kai-peak",
              "443 kW",
              t("jutri ob 14:00", "tomorrow at 14:00", "morgen um 14:00"),
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
                "senzorji in merilniki",
                "sensors and meters",
                "Sensoren und Zähler",
              ),
              "noc-online",
              "62 / 62",
              t("povezanih", "online", "online"),
            ),
            row(
              t("Kakovost povezave", "Link quality", "Verbindungsqualität"),
              "RSSI · SNR",
              "noc-rssi",
              "−71 dBm",
              t(
                "najšibkejša: LAMP_03",
                "weakest: LAMP_03",
                "schwächste: LAMP_03",
              ),
            ),
            row(
              t("Baterije senzorjev", "Sensor batteries", "Sensorbatterien"),
              t("najnižja", "lowest", "niedrigste"),
              "noc-battery",
              pct(64),
              "RACK_207",
            ),
            row(
              t("Korelacija alarmov", "Alarm correlation", "Alarmkorrelation"),
              "KAI",
              "noc-incidents",
              "0",
              t("odprtih incidentov", "open incidents", "offene Vorfälle"),
            ),
            row(
              t("Integracije", "Integrations", "Integrationen"),
              "BMS · DCIM · SNMP · Modbus · BACnet",
              "noc-links",
              "6 / 6",
              t(
                "z izdajo delovnih nalogov",
                "with ticketing",
                "mit Ticketsystem",
              ),
            ),
          ],
        },
      ],
    },
  };
}
