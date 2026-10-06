import type { Sensor, Twin } from "./types";
import geometry from "./datacenter-geometry.json";
import {
  LEVELS,
  RACKS,
  rackAt,
  rackKey,
  rackNumber,
  warmest,
} from "../../../nexavia/showcase-room/datacenter-racks.js";

// The datacenter maquette, rendered by scripts/generate-datacenter-maquette.mjs:
// one building of three levels, cut in steps, with a row of water-cooled racks
// on every level. Hotspots, unlit patches and sensor pins come from the
// generated geometry.
export function datacenterTwin(en: boolean): Twin {
  const t = (sl: string, english: string) => (en ? english : sl);
  const d = (value: string) => (en ? value : value.replace(".", ","));
  const pct = (value: number) => t(`${value} %`, `${value}%`);
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

  // One temperature and humidity sensor per rack.
  const racks: Sensor[] = LEVELS.flatMap((level) =>
    Array.from({ length: RACKS }, (_, index): Sensor => {
      const rack = index + 1;
      const key = rackKey(level, rack);
      const { temp, rh } = rackAt(level, rack);
      const number = rackNumber(level, rack);
      const name = t(`Omara ${number}`, `Rack ${number}`);
      return {
        key,
        id: `RACK_${number.replace(".", "")}`,
        tone: "air",
        tag: "°C",
        label: t(
          `Senzor temperature in vlage · omara ${number}`,
          `Temperature and humidity sensor · rack ${number}`,
        ),
        event: name,
        at: at(key),
        side: level === 1 ? "above" : "below",
        ...(rack <= 2 ? { align: "start" as const } : {}),
        alert: 30,
        every: every5,
        uses: t(
          "Pravilo: vstopni zrak > 30 °C → alarm in večji pretok hladilne vode",
          "Rule: inlet air > 30 °C → alarm and more cooling water",
        ),
        card: {
          kind: "sensor",
          title: t(
            `${name} · ${level}. nadstropje`,
            `${name} · level ${level}`,
          ),
          value: d(`${temp.toFixed(1)} °C`),
          grid: [
            {
              label: t("Vstopni zrak", "Inlet air"),
              key,
              value: d(`${temp.toFixed(1)} °C`),
            },
            {
              label: t("Vlaga", "Humidity"),
              key: `${key}-rh`,
              value: pct(rh),
            },
          ],
        },
      };
    }),
  );
  // One leak detector per level, in the raised floor's void.
  const leaks: Sensor[] = LEVELS.map((level) => ({
    key: `leak-${level}`,
    id: `LEAK_0${level}`,
    tone: "water",
    tag: "mm",
    label: t(
      `Senzor izliva vode · ${level}. nadstropje`,
      `Leak detector · level ${level}`,
    ),
    event: t(
      `Voda pod dvignjenim podom · ${level}. nadstropje`,
      `Water under the raised floor · level ${level}`,
    ),
    eventNote: true,
    at: at(`leak-${level}`),
    side: level === 1 ? "above" : "below",
    align: "end",
    alert: 1,
    uses: t(
      "Pravilo: voda pod podom → alarm in zapora ventila hladilne zanke",
      "Rule: water under the floor → alarm and the loop's valve closed",
    ),
    card: {
      kind: "sensor",
      title: t(
        `Izliv vode · ${level}. nadstropje`,
        `Leak detection · level ${level}`,
      ),
      value: "0 mm",
      note: t("Suho", "Dry"),
    },
  }));

  return {
    id: "datacenter",
    tab: {
      title: t("Podatkovni center", "Datacenter"),
      meta: t("Maketa 60 × 60 cm · 6 naprav", "60 × 60 cm model · 6 devices"),
    },
    intro: {
      title: t(
        "Podatkovni center, ki ve za vsako omaro in vsako kapljo.",
        "A datacenter that knows every rack and every drop.",
      ),
      lead: t(
        "Stavba je prikazana v stopničastem prerezu, zato vsako nadstropje vidite hkrati kot tloris in kot naris. Vsaka strežniška omara ima senzor temperature in vlage, pod dvignjenim podom vsakega nadstropja pa senzor izliva nadzira cevi vodnega hlajenja. Nexavia ob odstopanju sproži alarm, ukrepa in hrani zapis meritev.",
        "The building is shown in a stepped section, so every level reads as a floor plan and a side view at once. Each server rack has a temperature and humidity sensor, and under each level's raised floor a leak detector watches the water-cooling pipes. When a reading drifts, Nexavia raises an alarm, acts and keeps the record.",
      ),
    },
    panel: {
      view: t(
        "Pogled v prerezu · povlecite za raziskovanje",
        "Section view · drag to explore",
      ),
      hint: t(
        "Kliknite senzor na omari ali pod podom, da pošlje meritev, ali nadstropje oz. zunanjo svetilko za vklop in izklop",
        "Click a sensor on a rack or under a floor to send a reading, or a level or an outdoor lamp to switch it on or off",
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
      photo: "/images/nexavia/showcase-room/datacenter/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa podatkovnega centra velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: trinadstropna stavba v stopničastem prerezu, v vsakem nadstropju vrsta desetih strežniških omar z vmesnimi hladilniki na dvignjenem podu z modrimi in rdečimi cevmi hladilne vode, ob dvoranah strojnica hlajenja, prostor z napajanjem in nadzorna soba, desno hladilna stolpa, spredaj parkirišče, agregat, rezervoar goriva in transformator",
        "60 by 60 centimetre datacenter maquette of four 30 by 30 centimetre modules: a three-level building in a stepped section, on each level a row of ten server racks with in-row coolers on a raised floor carrying blue and red cooling-water pipes, beside the halls a cooling plant room, a power room and a control room, on the right two cooling towers, and in front a car park, a generator, a fuel tank and a transformer",
      ),
      lightsDir: "/images/nexavia/showcase-room/datacenter/lights",
      modules: [
        {
          letter: "A",
          name: t("Podatkovne dvorane", "Data halls"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t("Hlajenje", "Cooling"),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t("Dostop · parkirišče", "Access · car park"),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Napajanje", "Power supply"),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      lighting: [
        device("FLOOR_01", t("Razsvetljava 1. nadstropja", "Level 1 lighting")),
        device("FLOOR_02", t("Razsvetljava 2. nadstropja", "Level 2 lighting")),
        device("FLOOR_03", t("Razsvetljava 3. nadstropja", "Level 3 lighting")),
        device("LAMP_01", t("Svetilka parkirišča", "Car park lamp"), true),
        device("LAMP_02", t("Svetilka vhoda", "Gate lamp"), true),
        device(
          "LAMP_03",
          t("Svetilka hladilnega dvorišča", "Cooling yard lamp"),
          true,
        ),
      ],
      sensors: [
        {
          key: "lux",
          id: "LIGHT_04",
          tone: "light",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor"),
          event: t("Svetloba okolice", "Ambient light"),
          at: at("lux"),
          side: "below",
          align: "end",
          every: every5,
          uses: t(
            "Pravilo: svetloba < 25 lx → vklop razsvetljave",
            "Rule: light < 25 lx → lighting on",
          ),
          card: {
            kind: "sensor",
            title: t("Svetloba okolice", "Ambient light"),
            value: "52 lx",
            note: t("Streha podatkovnega centra", "Datacenter roof"),
          },
        },
        ...racks,
        ...leaks,
        {
          key: "cooling",
          id: "CHW_01",
          tone: "water",
          tag: "°C",
          label: t(
            "Senzor temperature hladilne vode",
            "Cooling water temperature sensor",
          ),
          event: t("Hladilna voda · dovod", "Cooling water · supply"),
          eventNote: true,
          at: at("cooling"),
          side: "above",
          align: "end",
          alert: 22,
          every: every1,
          uses: t(
            "Pravilo: dovod > 22 °C → vklop drugega hladilnega stolpa",
            "Rule: supply > 22 °C → second cooling tower on",
          ),
          card: {
            kind: "sensor",
            title: t("Hladilna voda", "Cooling water"),
            value: d("17.8 °C"),
            grid: [
              {
                label: t("Dovod", "Supply"),
                key: "cooling",
                value: d("17.8 °C"),
              },
              {
                label: t("Povratek", "Return"),
                key: "cooling-return",
                value: d("23.9 °C"),
              },
            ],
          },
        },
        {
          key: "power",
          id: "POWER_01",
          tone: "power",
          tag: "kW",
          label: t(
            "Električni števec podatkovnega centra",
            "Datacenter electricity meter",
          ),
          event: t("Električna moč", "Electrical load"),
          eventNote: true,
          at: at("power"),
          side: "below",
          align: "end",
          every: every15,
          card: {
            kind: "meter",
            title: t("Poraba elektrike", "Electricity use"),
            value: d("412.6 kW"),
            note: t("PUE 1,18", "PUE 1.18"),
          },
        },
      ],
      loader: {
        subject: t(
          "Maketa 60 × 60 cm · 4 moduli",
          "Model 60 × 60 cm · 4 modules",
        ),
        stage: t(
          "Nalaganje modela podatkovnega centra",
          "Loading the datacenter model",
        ),
      },
    },
    dashboard: {
      title: t("Pregled podatkovnega centra", "Datacenter overview"),
      subtitle: t(
        "3 nadstropja · 30 omar · demonstracijski podatki",
        "3 levels · 30 racks · simulated data",
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne naprave", "Active devices"),
          value: "0 / 6",
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
          note: t("Senzor LIGHT_04", "Sensor LIGHT_04"),
        },
      ],
      rule: t("Pravilo: svetloba < 25 lx", "Rule: light < 25 lx"),
      ruleStatus: t("Čaka na naslednjo meritev", "Waiting for next reading"),
      devices: [
        { id: "FLOOR_01", name: t("1. nadstropje", "Level 1") },
        { id: "FLOOR_02", name: t("2. nadstropje", "Level 2") },
        { id: "FLOOR_03", name: t("3. nadstropje", "Level 3") },
        { id: "LAMP_01", name: t("Svetilka parkirišča", "Car park lamp") },
        { id: "LAMP_02", name: t("Svetilka vhoda", "Gate lamp") },
        {
          id: "LAMP_03",
          name: t("Svetilka hladilnega dvorišča", "Cooling yard lamp"),
        },
      ],
      group: t("Zunanja razsvetljava", "Outdoor lighting"),
      alarms: [
        {
          id: "LAMP_03",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
          ),
        },
      ],
      meters: {
        title: t("Hlajenje in napajanje", "Cooling and power"),
        rows: [
          {
            label: t("Hladilna voda · dovod", "Cooling water · supply"),
            id: "CHW_01",
            key: "cooling",
            value: d("17.8 °C"),
            note: t("Povratek 23,9 °C", "Return 23.9 °C"),
          },
          {
            label: t("Električna moč", "Electrical load"),
            id: "POWER_01",
            key: "power",
            value: d("412.6 kW"),
            note: t("PUE 1,18", "PUE 1.18"),
          },
          ...LEVELS.map((level) => ({
            label: t(
              `Izliv vode · ${level}. nadstropje`,
              `Leak detection · level ${level}`,
            ),
            id: `LEAK_0${level}`,
            key: `leak-${level}`,
            value: "0 mm",
            note: t("Suho", "Dry"),
          })),
        ],
      },
      sensors: {
        title: t(
          "Omare · najtoplejša v nadstropju",
          "Racks · warmest per level",
        ),
        rows: LEVELS.map((level) => {
          const { rack, temp } = warmest(level);
          const number = rackNumber(level, rack);
          return {
            label: t(`${level}. nadstropje`, `Level ${level}`),
            id: t(`${RACKS} senzorjev`, `${RACKS} sensors`),
            key: `level-${level}`,
            value: d(`${temp.toFixed(1)} °C`),
            note: t(`Omara ${number}`, `Rack ${number}`),
          };
        }),
      },
    },
  };
}
