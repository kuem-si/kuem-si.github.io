import type { Twin } from "./types";
import geometry from "./marina-geometry.json";

// The smart-marina maquette, rendered by scripts/generate-marina-maquette.mjs:
// the marina in the middle of the board, the town behind it. Hotspots, unlit
// patches and sensor pins come from the generated geometry.
export function marinaTwin(en: boolean): Twin {
  const t = (sl: string, english: string) => (en ? english : sl);
  const d = (value: string) => (en ? value : value.replace(".", ","));
  const at = (key: keyof typeof geometry.points) => geometry.points[key] as [number, number];
  const device = (id: keyof typeof geometry.devices, label: string, hit = false) => {
    const { off, shape, anchor } = geometry.devices[id];
    // Pier lights are a few pixels wide; give them a larger click target.
    const target = hit ? { hit: `M${anchor[0] - 16} ${anchor[1] - 12}h32v46h-32z` } : {};
    return { id, label, off, shape, anchor, ...target };
  };
  const { berths, parking } = geometry;
  const free = parking.total - parking.parked;
  return {
    id: "marina",
    tab: { title: t("Pametna marina", "Smart marina"), meta: t("Maketa 60 × 60 cm · 7 naprav", "60 × 60 cm model · 7 devices") },
    intro: {
      title: t("Marina, ki ve, kaj se dogaja na vsakem pomolu.", "A marina that knows what is happening on every pier."),
      lead: t(
        "Marina sredi makete povezuje razsvetljavo pomolov, hotela, restavracije in sanitarij, števce elektrike, vode in goriva ter senzorje gladine morja, vetra, zasedenosti privezov in parkirišč. Mesto v ozadju je kulisa – vsi senzorji so v marini.",
        "The marina at the centre of the model connects lighting for the piers, hotel, restaurant and sanitary block, electricity, water and fuel meters, and sensors for sea level, wind, berth and parking occupancy. The town behind it is scenery – every sensor sits in the marina.",
      ),
    },
    panel: {
      view: t("Pogled marine · povlecite za raziskovanje", "Marina view · drag to explore"),
      hint: t("Kliknite luč na pomolu, hotel, restavracijo ali sanitarije za vklop ali izklop", "Click a pier light, the hotel, restaurant or sanitary block to switch it on or off"),
      hintPanel: t(
        "Tudi deli nadzorne plošče Nexavia so interaktivni – preklopite posamezno napravo ali vse luči na pomolih hkrati.",
        "Parts of the Nexavia dashboard are interactive too – switch a single device or all pier lights at once.",
      ),
      step: t("Senzor bere svetlobo okolice", "Sensor is reading ambient light"),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/marina/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa marine velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: v sredini bazen s pomoli in privezanimi plovili, ob njem hotel, restavracija, sanitarni blok, parkirišči in točilnica goriva, v ozadju obalno mesto z zvonikom",
        "60 by 60 centimetre marina maquette of four 30 by 30 centimetre modules: a basin with piers and moored boats in the middle, a hotel, restaurant, sanitary block, two car parks and a fuel dock around it, and a coastal town with a bell tower behind",
      ),
      lightsDir: "/images/nexavia/showcase-room/marina/lights",
      water: "/images/nexavia/showcase-room/marina/water.webp",
      glints: Object.entries(geometry.glints as Record<string, number[]>).map(([id, box]) => ({ id, box })),
      modules: [
        { letter: "A", name: t("Mesto · hotel", "Town · hotel"), plan: [520, 236], label: [22, 18] },
        { letter: "B", name: t("Mesto · restavracija", "Town · restaurant"), plan: [1010, 236], label: [66, 18] },
        { letter: "C", name: t("Pomoli · parkirišče", "Piers · parking"), plan: [480, 566], label: [16, 57] },
        { letter: "D", name: t("Pomoli · storitve", "Piers · services"), plan: [1080, 566], label: [72, 57] },
      ],
      lighting: [
        device("HOTEL_01", t("Razsvetljava hotela", "Hotel lighting")),
        device("RESTAURANT_01", t("Razsvetljava restavracije in terase", "Restaurant and terrace lighting")),
        device("SANITARY_01", t("Razsvetljava sanitarij", "Sanitary block lighting")),
        device("PIER_01", t("Luč pomola A1", "Pier light A1"), true),
        device("PIER_02", t("Luč pomola A2", "Pier light A2"), true),
        device("PIER_03", t("Luč pomola B1", "Pier light B1"), true),
        device("PIER_04", t("Luč pomola B2", "Pier light B2"), true),
      ],
      sensors: [
        {
          key: "sea-level",
          id: "SEA_LEVEL_01",
          tone: "water",
          tag: t("Morje", "Sea"),
          label: t("Senzor gladine morja", "Sea level sensor"),
          event: t("Gladina morja", "Sea level"),
          at: at("sea-level"),
          side: "below",
          alert: 0.7,
          card: { kind: "sensor", title: t("Gladina morja", "Sea level"), value: d("+0.42 m"), note: t("Nad srednjo gladino", "Above mean sea level") },
        },
        {
          key: "hotel-power",
          id: "HOTEL_POWER_01",
          tone: "power",
          tag: "kW",
          label: t("Električni števec hotela", "Hotel electricity meter"),
          event: t("Električni števec hotela", "Hotel electricity meter"),
          at: at("hotel-power"),
          side: "above",
          card: { kind: "meter", title: t("Poraba elektrike · hotel", "Electricity use · hotel"), value: d("38.5 kW"), note: t("Trenutna moč", "Current load") },
        },
        {
          key: "parking",
          id: "PARKING_01",
          tone: "mobility",
          tag: "P",
          label: t("Senzor zasedenosti parkirišča", "Car park occupancy sensor"),
          event: t("Parkirišče marine", "Marina car park"),
          at: at("parking"),
          side: "below",
          align: "start",
          card: { kind: "sensor", title: t("Prosta parkirna mesta", "Free parking spaces"), value: String(free), note: t(`od ${parking.total} mest`, `of ${parking.total} spaces`) },
        },
        {
          key: "berths",
          id: "BERTH_OCC_A",
          tone: "mobility",
          tag: t("Privezi", "Berths"),
          label: t("Senzorji zasedenosti privezov", "Berth occupancy sensors"),
          event: t("Zasedenost privezov", "Berth occupancy"),
          at: at("berths"),
          side: "above",
          card: { kind: "sensor", title: t("Zasedeni privezi", "Occupied berths"), value: String(berths.occupied), note: t(`od ${berths.total} privezov`, `of ${berths.total} berths`) },
        },
        {
          key: "shore-power",
          id: "SHORE_POWER_B",
          tone: "power",
          tag: "kWh",
          label: t("Priključni omarici pomola B", "Pier B service pedestals"),
          event: t("Elektrika na pomolu B", "Pier B shore power"),
          at: at("shore-power"),
          side: "above",
          card: { kind: "meter", title: t("Elektrika na privezih · pomol B", "Shore power · pier B"), value: d("46.8 kWh"), note: t("Danes", "Today") },
        },
        {
          key: "sanitary-water",
          id: "SANITARY_WATER_01",
          tone: "water",
          tag: "H₂O",
          label: t("Vodomer sanitarij", "Sanitary block water meter"),
          event: t("Vodomer sanitarij", "Sanitary block water meter"),
          at: at("sanitary-water"),
          side: "below",
          align: "end",
          card: { kind: "meter", title: t("Poraba vode · sanitarije", "Water use · sanitary block"), value: d("0.84 m³/h"), note: t("Trenutni pretok", "Current flow") },
        },
        {
          key: "fuel",
          id: "FUEL_TANK_01",
          tone: "gas",
          tag: t("Gorivo", "Fuel"),
          label: t("Senzor rezervoarja točilnice", "Fuel dock tank sensor"),
          event: t("Rezervoar točilnice", "Fuel dock tank"),
          at: at("fuel"),
          side: "above",
          align: "end",
          card: { kind: "sensor", title: t("Zaloga goriva · točilnica", "Fuel stock · fuel dock"), value: t("72 %", "72%"), note: t("Rezervoar 20 m³", "20 m³ tank") },
        },
        {
          key: "wind",
          id: "WIND_01",
          tone: "air",
          tag: "kn",
          label: t("Vremenska postaja", "Weather station"),
          event: t("Veter", "Wind"),
          eventNote: true,
          at: at("wind"),
          side: "above",
          align: "start",
          alert: 25,
          card: {
            kind: "sensor",
            title: t("Veter in vreme", "Wind and weather"),
            value: "9 kn",
            grid: [
              { label: t("Veter", "Wind"), key: "wind", value: "9 kn" },
              { label: t("Sunki", "Gusts"), key: "wind-gust", value: "13 kn" },
              { label: t("Temperatura", "Temperature"), key: "wind-temp", value: d("17.9 °C") },
            ],
          },
        },
      ],
      loader: { subject: t("Maketa 60 × 60 cm · 4 moduli", "Model 60 × 60 cm · 4 modules"), stage: t("Nalaganje modela marine", "Loading the marina model") },
    },
    dashboard: {
      title: t("Pregled marine", "Marina overview"),
      subtitle: t("3 objekti · 4 luči na pomolih · demonstracijski podatki", "3 buildings · 4 pier lights · simulated data"),
      kpis: [
        { key: "active", label: t("Aktivne naprave", "Active devices"), value: "0 / 7", note: t("V marini", "In the marina") },
        { key: "power", label: t("Skupna moč", "Total power"), value: "0 W", note: t("Trenutna simulacija", "Current simulation") },
        { key: "lux", label: t("Svetloba okolice", "Ambient light"), value: "52 lx", note: t("Senzor LIGHT_02", "Sensor LIGHT_02") },
      ],
      rule: t("Pravilo: svetloba < 25 lx", "Rule: light < 25 lx"),
      ruleStatus: t("Čaka na naslednjo meritev", "Waiting for next reading"),
      devices: [
        { id: "HOTEL_01", name: t("Hotel", "Hotel") },
        { id: "RESTAURANT_01", name: t("Restavracija s teraso", "Restaurant and terrace") },
        { id: "SANITARY_01", name: t("Sanitarni blok", "Sanitary block") },
        { id: "PIER_01", name: t("Luč pomola A1", "Pier light A1") },
        { id: "PIER_02", name: t("Luč pomola A2", "Pier light A2") },
        { id: "PIER_03", name: t("Luč pomola B1", "Pier light B1") },
        { id: "PIER_04", name: t("Luč pomola B2", "Pier light B2") },
      ],
      group: t("Razsvetljava pomolov", "Pier lighting"),
      alarms: [
        { id: "PEDESTAL_B07", text: t("Priključek B-07 · sprožena zaščita · 9 min", "Pedestal B-07 · breaker tripped · 9 min") },
        { id: "PIER_04", text: t("Šibek signal prehoda · 3 min", "Gateway signal weak · 3 min") },
      ],
      meters: {
        title: t("Meritve števcev", "Meter readings"),
        rows: [
          { label: t("Elektrika hotela", "Hotel electricity"), id: "HOTEL_POWER_01", key: "hotel-power", value: d("38.5 kW") },
          { label: t("Elektrika na pomolu B", "Pier B shore power"), id: "SHORE_POWER_B", key: "shore-power", value: d("46.8 kWh") },
          { label: t("Vodomer sanitarij", "Sanitary block water"), id: "SANITARY_WATER_01", key: "sanitary-water", value: d("0.84 m³/h") },
          { label: t("Rezervoar točilnice", "Fuel dock tank"), id: "FUEL_TANK_01", key: "fuel", value: t("72 %", "72%") },
        ],
      },
      sensors: {
        title: t("Senzorji marine", "Marina sensors"),
        rows: [
          { label: t("Gladina morja", "Sea level"), id: "SEA_LEVEL_01", key: "sea-level", value: d("+0.42 m"), note: t("Normalno", "Normal") },
          { label: t("Veter", "Wind"), id: "WIND_01", key: "wind", value: "9 kn", note: t("Sunki 13 kn · SV", "Gusts 13 kn · NE") },
          { label: t("Zasedenost privezov", "Berth occupancy"), id: "BERTH_OCC_A", key: "berths", value: `${berths.occupied} / ${berths.total}` },
          { label: t("Prosta parkirna mesta", "Free parking spaces"), id: "PARKING_01", key: "parking", value: `${free} / ${parking.total}` },
        ],
      },
    },
  };
}
