import type { ReadingRow, Sensor, Tone, Twin } from "./types";
import geometry from "./marina-geometry.json";

// The smart marina and camp, rendered by scripts/generate-marina-maquette.mjs:
// the marina in the middle of the board, the camp behind it. Every berth's
// pedestal meters power and water and knows the boat on it; the camp's
// pitches and mobile homes follow the reception's bookings; the hotel pool,
// the restaurant, the car parks and the greenery serve both. Pins are grouped
// into layers (one network at a time) and two sites. Hotspots, unlit patches
// and sensor pins come from the generated geometry.
export function marinaTwin(en: boolean): Twin {
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
    // Pier lights are a few pixels wide; give them a larger click target.
    const target = hit
      ? { hit: `M${anchor[0] - 16} ${anchor[1] - 12}h32v46h-32z` }
      : {};
    return { id, label, off, shape, anchor, ...target };
  };
  const every1 = t("vsako minuto", "every minute");
  const every5 = t("vsakih 5 min", "every 5 min");
  const every15 = t("vsakih 15 min", "every 15 min");
  const closed = t("Zaprta", "Closed");
  const socketOff = t("IZKLOP", "OFF");

  // A pin whose card shows one or more readings side by side. The first one
  // is the tracked value and carries the pin's key; the others carry their
  // own reading keys.
  const pin = (
    key: string,
    id: string,
    tone: Tone,
    layer: string,
    site: string | undefined,
    tag: string,
    label: string,
    title: string,
    cells: [label: string, value: string, key?: string][],
    rest: Partial<Sensor> = {},
  ): Sensor => ({
    key,
    id,
    tone,
    layer,
    site,
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
      // Long words and values (sockets, guests) sit two abreast.
      columns: cells.some(
        ([name, value]) =>
          value.length > 8 || name.split(" ").some((word) => word.length > 9),
      )
        ? 2
        : 3,
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
    note?: string,
  ): ReadingRow => ({ label, id, key, value, note });

  const { berths, parking } = geometry;
  const free = parking.total - parking.parked;
  const socket = (kw: string) => t(`VKLOP · ${d(kw)} kW`, `ON · ${kw} kW`);

  return {
    id: "marina",
    tab: {
      title: t("Pametna marina in kamp", "Smart marina and camp"),
      meta: t(
        "Maketa 60 × 60 cm · 10 naprav · 30 senzorjev",
        "60 × 60 cm model · 10 devices · 30 sensors",
      ),
    },
    intro: {
      title: t(
        "Marina in kamp, ki vesta, kaj se dogaja na vsakem privezu in parceli.",
        "A marina and a camp that know what is happening on every berth and pitch.",
      ),
      lead: t(
        "Vsaka priključna omarica na pomolu meri elektriko in vodo po privezu, prepozna gosta po kartici NFC in ve, ali je plovilo na privezu – vse gre samodejno na račun ob odhodu. V kampu recepcija ob prijavi gosta vklopi parcelo ali mobilno hišico, ki se predhodno ohladi, ob odjavi pa končna poraba odide v obračun. Hotelski bazen, restavracija, parkirišča, polnilnice in zelenice služijo obema, senzorji morja, vremena in varnosti pa varujejo ljudi, plovila in elektriko na pomolih.",
        "Every service pedestal on the piers meters power and water per berth, recognises the guest by their NFC card and knows whether the boat is on its berth – and all of it goes on the bill at departure without a manual reading. In the camp, the reception switches a pitch or a mobile home on at check-in, pre-cooling it, and sends the final reading to billing at check-out. The hotel pool, the restaurant, the car parks, the EV chargers and the greenery serve both, while sea, weather and safety sensors protect people, boats and the electricity on the piers.",
      ),
    },
    panel: {
      view: t(
        "Pogled marine in kampa · povlecite za raziskovanje",
        "Marina and camp view · drag to explore",
      ),
      hint: t(
        "Izberite lokacijo ali plast senzorjev, kliknite senzor, da pošlje meritev, ali luč, hotel, restavracijo, sanitarije oz. mobilno hišico za vklop in izklop",
        "Pick a site or a sensor layer, click a sensor to send a reading, or a light, the hotel, restaurant, a sanitary block or a mobile home to switch it on or off",
      ),
      hintPanel: t(
        "Kartica priključne omarice izklopi vtičnico na daljavo in pokaže svojo vrstico na nadzorni plošči.",
        "A pedestal's card switches its socket remotely and points at its row on the dashboard.",
      ),
      step: t(
        "Senzor bere svetlobo okolice",
        "Sensor is reading ambient light",
      ),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/marina/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa marine in kampa velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: v sredini bazen s pomoli, priključnimi omaricami in privezanimi plovili, boja za kakovost vode in svetilnika ob vhodu, ob njem hotel z bazenom, restavracija, sanitarni blok, parkirišči z zabojnikoma za odpadke in polnilnicama za električna vozila, točilnica goriva s postajo za praznjenje fekalnih tankov in kapitanija z vremensko postajo, v ozadju kamp z recepcijo in zapornico, razdelilno omarico, dvema mobilnima hišicama, sanitarnim blokom s sončnimi kolektorji in parcelami s počitniškimi prikolicami",
        "60 by 60 centimetre marina and camp maquette of four 30 by 30 centimetre modules: a basin with piers, service pedestals and moored boats in the middle, a water-quality buoy and harbour lights at the entrance, around it a hotel with a pool, a restaurant, a sanitary block, two car parks with waste containers and electric vehicle chargers, a fuel dock with a pump-out station and the harbour office with a weather station, and behind it a camp with a reception and barrier, a feeder cabinet, two mobile homes, a sanitary block with solar collectors and pitches with holiday trailers",
      ),
      lightsDir: "/images/nexavia/showcase-room/marina/lights",
      water: "/images/nexavia/showcase-room/marina/water.webp",
      glints: Object.entries(geometry.glints as Record<string, number[]>).map(
        ([id, box]) => ({ id, box }),
      ),
      modules: [
        {
          letter: "A",
          name: t("Kamp · hotel", "Camp · hotel"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t("Kamp · restavracija", "Camp · restaurant"),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t("Pomoli · parkirišče", "Piers · parking"),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Pomoli · storitve", "Piers · services"),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      sites: [
        { id: "all", label: t("Marina + kamp", "Marina + camp") },
        {
          id: "marina",
          label: t("Marina", "Marina"),
          focus: { x: 768, y: 470, zoom: 1.2 },
        },
        {
          id: "camp",
          label: t("Kamp", "Camp"),
          focus: { x: 760, y: 175, zoom: 1.7 },
        },
      ],
      layers: [
        { id: "power", label: t("Elektrika", "Electricity") },
        { id: "water", label: t("Voda", "Water") },
        { id: "guests", label: t("Gostje", "Guests") },
        { id: "environment", label: t("Morje in vreme", "Sea and weather") },
        { id: "safety", label: t("Varnost", "Safety") },
        { id: "services", label: t("Storitve", "Services") },
      ],
      lighting: [
        device("HOTEL_01", t("Razsvetljava hotela", "Hotel lighting")),
        device(
          "RESTAURANT_01",
          t(
            "Razsvetljava restavracije in terase",
            "Restaurant and terrace lighting",
          ),
        ),
        device(
          "SANITARY_01",
          t("Razsvetljava sanitarij", "Sanitary block lighting"),
        ),
        device("PIER_01", t("Luč pomola A1", "Pier light A1"), true),
        device("PIER_02", t("Luč pomola A2", "Pier light A2"), true),
        device("PIER_03", t("Luč pomola B1", "Pier light B1"), true),
        device("PIER_04", t("Luč pomola B2", "Pier light B2"), true),
        device(
          "MOBILE_HOME_01",
          t("Mobilna hišica MH-01", "Mobile home MH-01"),
        ),
        device(
          "MOBILE_HOME_02",
          t("Mobilna hišica MH-02", "Mobile home MH-02"),
        ),
        device(
          "CAMP_SANITARY_01",
          t("Razsvetljava sanitarij v kampu", "Camp sanitary block lighting"),
        ),
      ],
      sensors: [
        // --- Marina: berths and pedestals --------------------------------
        pin(
          "pedestal-a",
          "PEDESTAL_A05",
          "power",
          "power",
          "marina",
          "kW",
          t("Priključna omarica priveza A-05", "Berth A-05 service pedestal"),
          t("Privez A-05 · jahta Mirta", "Berth A-05 · yacht Mirta"),
          [
            [t("Vtičnica 16 A", "Socket 16 A"), socket("2.3")],
            [
              t("Napetost · tok", "Voltage · current"),
              "231 V · 10 A",
              "pedestal-a-v",
            ],
            [t("Ta postanek", "This stay"), d("31.7 kWh"), "pedestal-a-kwh"],
            [t("Gost · NFC", "Guest · NFC"), "I. Kos ✓", "pedestal-a-guest"],
          ],
          {
            card: meter,
            every: every15,
            switchable: {
              key: "pedestal-a",
              on: socket("2.3"),
              off: socketOff,
            },
            uses: t(
              "Vtičnica se vklopi le s kartico gosta · kWh na račun priveza · preobremenitev → alarm",
              "Socket switches on only with the guest's card · kWh billed to the berth · overload → alarm",
            ),
          },
        ),
        pin(
          "pedestal-b",
          "PEDESTAL_B06",
          "power",
          "power",
          "marina",
          "kW",
          t("Priključna omarica priveza B-06", "Berth B-06 service pedestal"),
          t("Privez B-06 · Galeb, 11,4 m", "Berth B-06 · Galeb, 11.4 m"),
          [
            [t("Vtičnica 16 A", "Socket 16 A"), socket("1.6")],
            [t("Faktor moči", "Power factor"), d("0.96"), "pedestal-b-pf"],
            [t("Ta postanek", "This stay"), d("18.2 kWh"), "pedestal-b-kwh"],
            [t("Gost · NFC", "Guest · NFC"), "K. Horvat ✓", "pedestal-b-guest"],
          ],
          {
            card: meter,
            side: "above",
            every: every15,
            switchable: {
              key: "pedestal-b",
              on: socket("1.6"),
              off: socketOff,
            },
            uses: t(
              "Kartica NFC vklopi le gostovo vtičnico · poraba na račun",
              "The guest's NFC card switches on only their socket · use billed",
            ),
          },
        ),
        pin(
          "berth-water",
          "WATER_A09",
          "water",
          "water",
          "marina",
          "m³",
          t("Vodomer priveza A-09", "Berth A-09 water meter"),
          t("Voda na privezu A-09", "Water at berth A-09"),
          [
            [t("Pretok", "Flow"), d("0.00 m³/h")],
            [t("Ta postanek", "This stay"), d("0.46 m³"), "berth-water-stay"],
            [
              t("Stalni pretok", "Continuous flow"),
              t("Ne", "No"),
              "berth-water-cont",
            ],
          ],
          {
            card: meter,
            side: "above",
            every: every15,
            uses: t(
              "Pravilo: stalni pretok > 30 min → alarm in zapiranje ventila · KAI: poraba glede na plovilo",
              "Rule: continuous flow > 30 min → alarm and valve closed · KAI: use against the boat's history",
            ),
          },
        ),
        pin(
          "berths",
          "BERTH_OCC_A",
          "mobility",
          "guests",
          "marina",
          t("Privezi", "Berths"),
          t("Senzorji zasedenosti privezov", "Berth occupancy sensors"),
          t("Zasedenost privezov", "Berth occupancy"),
          [
            [t("Zasedeni", "Occupied"), String(berths.occupied)],
            [t("Prihodi danes", "Arrivals today"), "3", "berths-in"],
            [t("Brez rezervacije", "No booking"), "1", "berths-unauth"],
          ],
          {
            every: undefined,
            uses: t(
              "Pravilo: plovilo na privezu brez rezervacije → izklop vtičnice in obvestilo kapitaniji",
              "Rule: boat on a berth without a booking → socket off and harbour office notified",
            ),
          },
        ),
        pin(
          "shore-power",
          "SHORE_POWER_B",
          "power",
          "power",
          "marina",
          "kWh",
          t("Razdelilna omara pomola B", "Pier B feeder cabinet"),
          t("Elektrika na pomolu B", "Pier B shore power"),
          [
            [t("Danes", "Today"), d("46.8 kWh")],
            [t("Zdaj", "Now"), d("18.4 kW"), "shore-kw"],
            [t("Konica danes", "Peak today"), "31 kW", "shore-peak"],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Konica po pomolu in coni · KAI napove večerno konico, ko vse jahte vklopijo klimo",
              "Peak per pier and zone · KAI forecasts the evening peak when every yacht turns on its AC",
            ),
          },
        ),
        pin(
          "fuel",
          "FUEL_TANK_01",
          "gas",
          "services",
          "marina",
          t("Gorivo", "Fuel"),
          t("Senzor rezervoarja točilnice", "Fuel dock tank sensor"),
          t("Točilnica goriva", "Fuel dock"),
          [
            [t("Rezervoar", "Tank"), pct(72)],
            [t("Natočeno danes", "Dispensed today"), "184 L", "fuel-day"],
            [
              t("Zadnje", "Last"),
              t("Galeb · 46 L", "Galeb · 46 L"),
              "fuel-last",
            ],
          ],
          {
            side: "above",
            align: "end",
            every: t("vsako uro", "every hour"),
            uses: t(
              "Litri po plovilu na račun gosta · zaloga < 25 % → naročilo dobavitelju",
              "Litres per boat on the guest's bill · stock < 25% → order from the supplier",
            ),
          },
        ),
        pin(
          "pumpout",
          "PUMPOUT_01",
          "water",
          "services",
          "marina",
          t("Fekalije", "Pump-out"),
          t("Postaja za praznjenje fekalnih tankov", "Pump-out station"),
          t("Praznjenje fekalnih tankov", "Pump-out station"),
          [
            [t("Zbirni rezervoar", "Holding tank"), pct(38)],
            [t("Črpalka", "Pump"), t("Pripravljena", "Ready"), "pumpout-pump"],
            [t("Danes", "Today"), t("3 plovila", "3 boats"), "pumpout-day"],
          ],
          {
            side: "above",
            align: "end",
            every: every15,
            uses: t(
              "Rezervoar > 80 % → naročilo odvoza · napaka črpalke → alarm",
              "Tank > 80% → collection ordered · pump fault → alarm",
            ),
          },
        ),
        pin(
          "pms-marina",
          "PMS_MARINA",
          "mobility",
          "guests",
          "marina",
          "PMS",
          t(
            "Kapitanija · rezervacijski sistem",
            "Harbour office · booking system",
          ),
          t("Rezervacije privezov", "Berth bookings"),
          [
            [t("Prihodi danes", "Arrivals today"), "3"],
            [t("Odhodi danes", "Departures today"), "2", "pms-marina-out"],
            [
              t("Samodejni obračun", "Billed automatically"),
              pct(100),
              "pms-marina-bill",
            ],
          ],
          {
            side: "above",
            align: "start",
            every: undefined,
            uses: t(
              "Rezervacija vklopi storitve priveza · ob odhodu gre poraba v obračun",
              "A booking switches the berth's services on · at departure the use goes to billing",
            ),
          },
        ),
        // --- Sea and weather -------------------------------------------------
        {
          key: "lux",
          id: "LIGHT_02",
          tone: "light",
          layer: "environment",
          tag: "lx",
          label: t("Senzor svetlobe", "Light sensor"),
          event: t("Svetloba okolice", "Ambient light"),
          at: [330, 212],
          side: "below",
          align: "start",
          every: every5,
          uses: t(
            "Pravilo: svetloba < 25 lx → vklop razsvetljave",
            "Rule: light < 25 lx → lighting on",
          ),
          card: {
            kind: "sensor",
            title: t("Svetloba okolice", "Ambient light"),
            value: "52 lx",
            note: t("Streha hotela", "Hotel roof"),
          },
        },
        pin(
          "sea-level",
          "SEA_LEVEL_01",
          "water",
          "environment",
          "marina",
          t("Morje", "Sea"),
          t("Senzor gladine morja in valov", "Sea level and wave sensor"),
          t("Gladina morja", "Sea level"),
          [
            [t("Gladina", "Level"), d("+0.42 m")],
            [
              t("Valovi na vhodu", "Waves at the entrance"),
              d("0.3 m"),
              "sea-waves",
            ],
          ],
          {
            alert: 0.7,
            uses: t(
              "Pravilo: gladina > +0,70 m → izklop priključkov",
              "Rule: sea level > +0.70 m → pedestals cut off",
            ),
          },
        ),
        pin(
          "buoy",
          "BUOY_01",
          "water",
          "environment",
          "marina",
          t("Boja", "Buoy"),
          t("Boja za kakovost morja", "Water-quality buoy"),
          t("Kakovost morja", "Sea water quality"),
          [
            [t("Temperatura", "Temperature"), d("19.4 °C")],
            [t("Slanost", "Salinity"), d("37.8 PSU"), "buoy-sal"],
            ["pH", d("8.1"), "buoy-ph"],
            [t("Motnost", "Turbidity"), d("2.1 NTU"), "buoy-ntu"],
            [t("Kisik", "Oxygen"), d("7.6 mg/l"), "buoy-o2"],
          ],
          {
            side: "above",
            every: every15,
            uses: t(
              "Okoljski monitoring za modro zastavo · nenadna motnost → sum razlitja",
              "Environmental record for the Blue Flag · sudden turbidity → suspected spill",
            ),
          },
        ),
        pin(
          "wind",
          "WIND_01",
          "air",
          "environment",
          undefined,
          "kn",
          t("Vremenska postaja", "Weather station"),
          t("Veter in vreme", "Wind and weather"),
          [
            [t("Veter", "Wind"), "9 kn"],
            [t("Sunki", "Gusts"), "13 kn", "wind-gust"],
            [t("Temp.", "Temp."), d("17.9 °C"), "wind-temp"],
            [t("Tlak", "Pressure"), "1016 hPa", "wind-hpa"],
            [t("Vlaga", "Humidity"), pct(64), "wind-rh"],
            [t("Dež", "Rain"), "0 mm", "wind-rain"],
          ],
          {
            eventNote: true,
            side: "above",
            align: "start",
            alert: 25,
            every: every1,
            uses: t(
              "Sunki > 30 kn → opozorilo lastnikom · padec tlaka → opozorilo na burjo",
              "Gusts > 30 kn → owners warned · falling pressure → bora warning",
            ),
          },
        ),
        // --- Safety ------------------------------------------------------------
        pin(
          "cabinet",
          "CABINET_B1",
          "structure",
          "safety",
          "marina",
          "!",
          t("Zaščita omarice pomola B1", "Pier B1 cabinet protection"),
          t("Omarica pomola B1", "Pier B1 cabinet"),
          [
            [t("Vrata", "Door"), closed],
            [t("Temperatura", "Temperature"), "31 °C", "cabinet-temp"],
            [t("Voda", "Water"), t("Suho", "Dry"), "cabinet-flood"],
            [t("Nagib", "Tilt"), "0°", "cabinet-tilt"],
          ],
          {
            every: undefined,
            uses: t(
              "Odprta vrata, pregrevanje, voda ali udarec plovila → alarm in izklop omarice",
              "Door opened, overheating, water or a boat strike → alarm and the cabinet switched off",
            ),
          },
        ),
        pin(
          "nav-lights",
          "NAV_LIGHTS",
          "light",
          "safety",
          "marina",
          t("Svetilnik", "Beacons"),
          t("Svetilnika ob vhodu v marino", "Harbour entrance lights"),
          t("Svetilnika ob vhodu", "Harbour entrance lights"),
          [
            [t("Rdeča", "Red"), t("Deluje", "Working")],
            [t("Zelena", "Green"), t("Deluje", "Working"), "nav-green"],
            [t("Poraba", "Power"), "6 W", "nav-w"],
          ],
          {
            side: "above",
            every: every15,
            uses: t(
              "Ugasnjen svetilnik → takojšen alarm kapitaniji, ne le servisni nalog",
              "A dark beacon → instant alarm to the harbour office, not just a maintenance ticket",
            ),
          },
        ),
        pin(
          "smoke",
          "SMOKE_01",
          "structure",
          "safety",
          undefined,
          "!",
          t(
            "Javljalnik dima · kuhinja restavracije",
            "Smoke detector · restaurant kitchen",
          ),
          t("Dim · kuhinja", "Smoke · kitchen"),
          [
            [t("Dim", "Smoke"), d("0.02 %/m")],
            [t("Stanje", "Status"), t("Ni dima", "Clear"), "smoke-state"],
          ],
          {
            align: "end",
            every: undefined,
            uses: t(
              "Dim → alarm dežurnemu in izklop plina v kuhinji",
              "Smoke → alarm to the person on call and the kitchen gas shut off",
            ),
          },
        ),
        // --- Shared services ------------------------------------------------
        pin(
          "hotel-power",
          "HOTEL_POWER_01",
          "power",
          "power",
          undefined,
          "kW",
          t("Električni števec hotela", "Hotel electricity meter"),
          t("Poraba elektrike · hotel", "Electricity use · hotel"),
          [
            [t("Trenutna moč", "Current load"), d("38.5 kW")],
            [t("Danes", "Today"), "412 kWh", "hotel-kwh"],
          ],
          { card: meter, every: every15 },
        ),
        pin(
          "pool",
          "POOL_01",
          "water",
          "services",
          undefined,
          t("Bazen", "Pool"),
          t("Merilnik kakovosti vode v bazenu", "Pool water analyser"),
          t("Hotelski bazen", "Hotel pool"),
          [
            [t("Temperatura", "Temperature"), d("26.4 °C")],
            ["pH", d("7.3"), "pool-ph"],
            [t("Klor", "Chlorine"), d("0.6 mg/l"), "pool-cl"],
            ["ORP", "720 mV", "pool-orp"],
            [t("Črpalka", "Pump"), d("1.1 kW"), "pool-pump"],
          ],
          {
            align: "start",
            uses: t(
              "Klor < 0,3 mg/l ali pH zunaj 7,0–7,6 → bazen zaprt, dozirna črpalka popravi, zapis za inšpekcijo",
              "Chlorine < 0.3 mg/l or pH outside 7.0–7.6 → pool closed, the dosing pump corrects, record kept for inspection",
            ),
          },
        ),
        pin(
          "haccp",
          "HACCP_01",
          "air",
          "services",
          undefined,
          "HACCP",
          t("Senzorji HACCP · restavracija", "HACCP sensors · restaurant"),
          t("HACCP · restavracija", "HACCP · restaurant"),
          [
            [t("Hladilnik", "Fridge"), d("3.6 °C")],
            [t("Zamrzovalnik", "Freezer"), d("-19.2 °C"), "haccp-freezer"],
            [t("Topla vitrina", "Hot counter"), "68 °C", "haccp-hot"],
          ],
          {
            align: "end",
            alert: 8,
            uses: t(
              "Samodejni zapis HACCP · hladilnik > 8 °C 15 min → alarm kuharju",
              "Automatic HACCP record · fridge > 8 °C for 15 min → alarm to the chef",
            ),
          },
        ),
        pin(
          "sanitary-water",
          "SANITARY_WATER_01",
          "water",
          "water",
          "marina",
          "H₂O",
          t("Vodomer sanitarij", "Sanitary block water meter"),
          t("Sanitarije marine", "Marina sanitary block"),
          [
            [t("Pretok", "Flow"), d("0.84 m³/h")],
            [t("Topla voda", "Hot water"), "52 °C", "sanitary-hot"],
            [t("Obiski danes", "Visits today"), "214", "sanitary-visits"],
          ],
          {
            card: meter,
            align: "end",
            every: every15,
            uses: t(
              "Pravilo: nočni pretok > 0,2 m³/h 20 min → alarm puščanja · čiščenje po dejanski uporabi",
              "Rule: night flow > 0.2 m³/h for 20 min → leak alarm · cleaning by real use",
            ),
          },
        ),
        pin(
          "parking",
          "PARKING_01",
          "mobility",
          "guests",
          undefined,
          "P",
          t("Senzorji parkirišča", "Car park sensors"),
          t("Parkirišče marine", "Marina car park"),
          [
            [t("Prosta mesta", "Free spaces"), String(free)],
            [t("Uvozi danes", "In today"), "58", "parking-in"],
            [t("Izvozi danes", "Out today"), "51", "parking-out"],
          ],
          { align: "start", every: undefined },
        ),
        pin(
          "waste",
          "WASTE_01",
          "structure",
          "services",
          undefined,
          t("Odpadki", "Waste"),
          t("Senzorja v zabojnikih za odpadke", "Waste container sensors"),
          t("Zabojnika za odpadke", "Waste containers"),
          [
            [t("Napolnjenost", "Fill level"), pct(64)],
            [t("Temperatura", "Temperature"), "21 °C", "waste-temp"],
          ],
          {
            align: "end",
            every: t("vsako uro", "every hour"),
            uses: t(
              "Odvoz le, ko je zabojnik poln · skok temperature → zgodnji alarm požara",
              "Collected only when full · temperature jump → early fire alarm",
            ),
          },
        ),
        pin(
          "ev",
          "EV_01",
          "power",
          "power",
          undefined,
          "EV",
          t("Polnilnici za električna vozila", "EV chargers"),
          t("Polnilnici EV", "EV chargers"),
          [
            [t("Moč", "Power"), d("11.0 kW")],
            [t("Prosti", "Free"), "1 / 2", "ev-free"],
            [
              t("Danes", "Today"),
              t("38 kWh · 4 seje", "38 kWh · 4 sessions"),
              "ev-day",
            ],
          ],
          {
            card: meter,
            align: "end",
            every: every15,
            uses: t(
              "kWh na sejo na račun gosta · polnjenje se umakne večerni konici",
              "kWh per session billed to the guest · charging yields to the evening peak",
            ),
          },
        ),
        pin(
          "irrigation",
          "IRRIGATION_01",
          "water",
          "services",
          undefined,
          t("Zalivanje", "Irrigation"),
          t(
            "Senzor vlage tal in ventil zalivanja",
            "Soil moisture sensor and irrigation valve",
          ),
          t("Pametno zalivanje", "Smart irrigation"),
          [
            [t("Vlaga tal", "Soil moisture"), pct(31)],
            [t("Ventil", "Valve"), closed, "irrigation-valve"],
            [t("Pretok", "Flow"), d("0.0 m³/h"), "irrigation-flow"],
          ],
          {
            side: "above",
            align: "end",
            every: t("vsakih 30 min", "every 30 min"),
            uses: t(
              "Vlaga < 25 % in brez dežja → zalivanje ob 5:00 · pretok pri zaprtem ventilu → puščanje",
              "Moisture < 25% and no rain → watering at 05:00 · flow with the valve closed → leak",
            ),
          },
        ),
        // --- Camp -----------------------------------------------------------------
        pin(
          "pms-camp",
          "PMS_CAMP",
          "mobility",
          "guests",
          "camp",
          "PMS",
          t(
            "Recepcija · rezervacije in zapornica",
            "Reception · bookings and barrier",
          ),
          t("Recepcija kampa", "Camp reception"),
          [
            [t("Enote v uporabi", "Units in use"), "21 / 24"],
            [t("Prijave danes", "Check-ins today"), "4", "pms-camp-in"],
            [
              t("Zapornica noter · ven", "Barrier in · out"),
              "38 · 31",
              "pms-camp-gate",
            ],
          ],
          {
            every: undefined,
            uses: t(
              "Prijava vklopi parcelo ali hišico · odjava pošlje končno porabo v obračun",
              "Check-in switches the pitch or mobile home on · check-out sends the final reading to billing",
            ),
          },
        ),
        pin(
          "camp-pedestal",
          "PITCH_07",
          "power",
          "power",
          "camp",
          "kW",
          t("Priključek parcele 07", "Pitch 07 hook-up"),
          t("Parcela 07 · Novak", "Pitch 07 · Novak"),
          [
            [t("Vtičnica", "Socket"), socket("1.4")],
            [t("Danes", "Today"), d("6.2 kWh"), "camp-pedestal-kwh"],
            [
              t("Rezervacija", "Booking"),
              t("6 noči · do sobote", "6 nights · to Saturday"),
              "camp-pedestal-guest",
            ],
          ],
          {
            card: meter,
            align: "end",
            every: every15,
            switchable: {
              key: "camp-pedestal",
              on: socket("1.4"),
              off: socketOff,
            },
            uses: t(
              "Elektrika le med rezervacijo · preobremenitev → alarm · kWh na račun parcele",
              "Power only while booked · overload → alarm · kWh billed to the pitch",
            ),
          },
        ),
        pin(
          "camp-water",
          "PITCH_14_WATER",
          "water",
          "water",
          "camp",
          "m³",
          t("Vodomer parcele 14", "Pitch 14 water meter"),
          t("Voda na parceli 14", "Water at pitch 14"),
          [
            [t("Pretok", "Flow"), d("0.00 m³/h")],
            [t("Danes", "Today"), d("0.21 m³"), "camp-water-day"],
            [
              t("Nočni pretok", "Night flow"),
              d("0.0 m³/h"),
              "camp-water-night",
            ],
          ],
          {
            card: meter,
            align: "start",
            every: every15,
            uses: t(
              "Pravilo: neprekinjen nočni pretok → odprta cev, alarm recepciji",
              "Rule: continuous night flow → a hose left open, alarm to the reception",
            ),
          },
        ),
        pin(
          "mobile-home",
          "MH_01",
          "air",
          "guests",
          "camp",
          "°C",
          t(
            "Senzorji udobja · mobilna hišica MH-01",
            "Comfort sensors · mobile home MH-01",
          ),
          t("Mobilna hišica MH-01", "Mobile home MH-01"),
          [
            [t("Temperatura", "Temperature"), d("24.1 °C")],
            [t("Vlaga", "Humidity"), pct(52), "mh-rh"],
            ["CO₂", "610 ppm", "mh-co2"],
            [t("Okno", "Window"), closed, "mh-window"],
            [t("Klima", "AC"), d("0.9 kW"), "mh-ac"],
          ],
          {
            uses: t(
              "Odprto okno → klima se ustavi · predhlajenje uro pred prihodom gosta",
              "Window open → AC pauses · pre-cooling an hour before the guest arrives",
            ),
          },
        ),
        pin(
          "mh-safety",
          "MH_02_SAFETY",
          "gas",
          "safety",
          "camp",
          "!",
          t(
            "Dim, CO in plin · mobilna hišica MH-02",
            "Smoke, CO and gas · mobile home MH-02",
          ),
          t("Varnost · MH-02", "Safety · MH-02"),
          [
            [t("Dim", "Smoke"), d("0.01 %/m")],
            ["CO", "0 ppm", "mh-co"],
            [t("Plin UNP", "LPG"), "0 % LEL", "mh-lpg"],
          ],
          {
            every: undefined,
            uses: t(
              "Dim, CO ali uhajanje plina → alarm na telefon gosta in recepciji",
              "Smoke, CO or a gas leak → alarm to the guest's phone and the reception",
            ),
          },
        ),
        pin(
          "camp-sanitary",
          "CAMP_SAN_WATER",
          "water",
          "services",
          "camp",
          "WC",
          t("Senzorji sanitarij v kampu", "Camp sanitary block sensors"),
          t("Sanitarije v kampu", "Camp sanitary block"),
          [
            [t("Pretok", "Flow"), d("0.42 m³/h")],
            [t("Bojler", "Boiler"), "58 °C", "camp-hot"],
            [t("Obiski danes", "Visits today"), "168", "camp-visits"],
            [
              t("Milo · papir", "Soap · paper"),
              t("72 % · 64 %", "72% · 64%"),
              "camp-soap",
            ],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Čiščenje po obiskih, ne po uri · bojler < 45 °C → alarm · sončni kolektorji najprej",
              "Cleaning by visits, not by the clock · boiler < 45 °C → alarm · solar collectors first",
            ),
          },
        ),
        pin(
          "camp-feeder",
          "CAMP_FEEDER",
          "power",
          "power",
          "camp",
          "kW",
          t("Razdelilna omara kampa", "Camp feeder cabinet"),
          t("Elektrika kampa", "Camp electricity"),
          [
            [t("Zdaj", "Now"), "68 kW"],
            [t("Konica danes", "Peak today"), "96 kW", "camp-feeder-peak"],
            [
              t("Delež pogodbene moči", "Share of contract"),
              pct(27),
              "camp-feeder-share",
            ],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "KAI premakne klime in bojlerje, da kamp in marina ostaneta pod 250 kW",
              "KAI shifts ACs and boilers so the camp and marina stay under 250 kW",
            ),
          },
        ),
      ],
      loader: {
        subject: t(
          "Maketa 60 × 60 cm · 4 moduli",
          "Model 60 × 60 cm · 4 modules",
        ),
        stage: t("Nalaganje modela marine", "Loading the marina model"),
      },
    },
    dashboard: {
      title: t("Marina in kamp", "Marina and camp"),
      subtitle: t(
        `${berths.total} privezov · 24 enot v kampu · demonstracijski podatki`,
        `${berths.total} berths · 24 camp units · simulated data`,
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne luči", "Active lights"),
          value: "0 / 10",
          note: t("Marina in kamp", "Marina and camp"),
        },
        {
          key: "power",
          label: t("Moč razsvetljave", "Lighting power"),
          value: "0 W",
          note: t("Trenutna simulacija", "Current simulation"),
        },
        {
          key: "lux",
          label: t("Svetloba okolice", "Ambient light"),
          value: "52 lx",
          note: t("Senzor LIGHT_02", "Sensor LIGHT_02"),
        },
        {
          key: "kpi-berths",
          reading: "kpi-berths",
          site: "marina",
          label: t("Zasedeni privezi", "Berths occupied"),
          value: `${berths.occupied} / ${berths.total}`,
          note: t("1 brez rezervacije", "1 without a booking"),
        },
        {
          key: "kpi-camp",
          reading: "kpi-camp",
          site: "camp",
          label: t("Enote v kampu", "Camp units in use"),
          value: "21 / 24",
          note: t("vklopil PMS", "switched on by the PMS"),
        },
        {
          key: "kpi-peak",
          reading: "kpi-peak",
          label: t("Konica / pogodba", "Peak / contract"),
          value: "196 kW",
          note: t(
            "od 250 kW · napoved 232 kW ob 19:00",
            "of 250 kW · forecast 232 kW at 19:00",
          ),
        },
      ],
      rule: t("Pravilo: svetloba < 25 lx", "Rule: light < 25 lx"),
      ruleStatus: t("Čaka na naslednjo meritev", "Waiting for next reading"),
      devices: [
        { id: "HOTEL_01", name: t("Hotel", "Hotel") },
        {
          id: "RESTAURANT_01",
          name: t("Restavracija s teraso", "Restaurant and terrace"),
        },
        {
          id: "SANITARY_01",
          name: t("Sanitarni blok marine", "Marina sanitary block"),
          site: "marina",
        },
        {
          id: "PIER_01",
          name: t("Luč pomola A1", "Pier light A1"),
          site: "marina",
        },
        {
          id: "PIER_02",
          name: t("Luč pomola A2", "Pier light A2"),
          site: "marina",
        },
        {
          id: "PIER_03",
          name: t("Luč pomola B1", "Pier light B1"),
          site: "marina",
        },
        {
          id: "PIER_04",
          name: t("Luč pomola B2", "Pier light B2"),
          site: "marina",
        },
        {
          id: "MOBILE_HOME_01",
          name: t("Mobilna hišica MH-01", "Mobile home MH-01"),
          site: "camp",
        },
        {
          id: "MOBILE_HOME_02",
          name: t("Mobilna hišica MH-02", "Mobile home MH-02"),
          site: "camp",
        },
        {
          id: "CAMP_SANITARY_01",
          name: t("Sanitarije v kampu", "Camp sanitary block"),
          site: "camp",
        },
      ],
      group: t("Razsvetljava pomolov", "Pier lighting"),
      alarms: [
        {
          id: "PEDESTAL_B07",
          text: t(
            "Priključek B-07 · sprožena zaščita · 9 min",
            "Pedestal B-07 · breaker tripped · 9 min",
          ),
        },
        {
          id: "PIER_04",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
          ),
        },
      ],
      meters: {
        title: t(
          "Marina · privezi in priključki",
          "Marina · berths and pedestals",
        ),
        site: "marina",
        rows: [
          row(
            t("Privez A-05 · Mirta", "Berth A-05 · Mirta"),
            "PEDESTAL_A05",
            "pedestal-a",
            socket("2.3"),
            t("31,7 kWh ta postanek", "31.7 kWh this stay"),
          ),
          row(
            t("Privez B-06 · Galeb", "Berth B-06 · Galeb"),
            "PEDESTAL_B06",
            "pedestal-b",
            socket("1.6"),
            t("18,2 kWh ta postanek", "18.2 kWh this stay"),
          ),
          row(
            t("Elektrika na pomolu B", "Pier B shore power"),
            "SHORE_POWER_B",
            "shore-power",
            d("46.8 kWh"),
            t("konica danes 31 kW", "peak today 31 kW"),
          ),
          row(
            t("Voda na privezu A-09", "Water at berth A-09"),
            "WATER_A09",
            "berth-water",
            d("0.00 m³/h"),
            t("0,46 m³ ta postanek", "0.46 m³ this stay"),
          ),
          row(
            t("Rezervoar točilnice", "Fuel dock tank"),
            "FUEL_TANK_01",
            "fuel",
            pct(72),
            t("danes 184 L", "184 L today"),
          ),
          row(
            t("Praznjenje fekalij", "Pump-out station"),
            "PUMPOUT_01",
            "pumpout",
            pct(38),
            t("danes 3 plovila", "3 boats today"),
          ),
        ],
      },
      sensors: {
        title: t(
          "Marina · morje, vreme in gostje",
          "Marina · sea, weather and guests",
        ),
        site: "marina",
        rows: [
          row(
            t("Zasedenost privezov", "Berth occupancy"),
            "BERTH_OCC_A",
            "berths",
            `${berths.occupied} / ${berths.total}`,
            t("1 brez rezervacije", "1 without a booking"),
          ),
          row(
            t("Rezervacije privezov", "Berth bookings"),
            "PMS_MARINA",
            "pms-marina",
            "3",
            t("prihodi danes · 2 odhoda", "arrivals today · 2 departures"),
          ),
          row(
            t("Gladina morja", "Sea level"),
            "SEA_LEVEL_01",
            "sea-level",
            d("+0.42 m"),
            t("Normalno · valovi 0,3 m", "Normal · waves 0.3 m"),
          ),
          row(
            t("Veter", "Wind"),
            "WIND_01",
            "wind",
            "9 kn",
            t("Sunki 13 kn · SV", "Gusts 13 kn · NE"),
          ),
          row(
            t("Kakovost morja", "Sea water quality"),
            "BUOY_01",
            "buoy",
            d("19.4 °C"),
            t("pH 8,1 · kisik 7,6 mg/l", "pH 8.1 · oxygen 7.6 mg/l"),
          ),
        ],
      },
      panels: [
        {
          title: t("Kamp", "Camp"),
          tag: "CAMP · PMS",
          site: "camp",
          rows: [
            row(
              t("Enote v uporabi", "Units in use"),
              "PMS_CAMP",
              "pms-camp",
              "21 / 24",
              t("4 prijave danes", "4 check-ins today"),
            ),
            row(
              t("Parcela 07 · Novak", "Pitch 07 · Novak"),
              "PITCH_07",
              "camp-pedestal",
              socket("1.4"),
              t("danes 6,2 kWh", "6.2 kWh today"),
            ),
            row(
              t("Voda na parceli 14", "Water at pitch 14"),
              "PITCH_14_WATER",
              "camp-water",
              d("0.00 m³/h"),
              t("nočni pretok 0", "night flow 0"),
            ),
            row(
              t("Mobilna hišica MH-01", "Mobile home MH-01"),
              "MH_01",
              "mobile-home",
              d("24.1 °C"),
              t("okno zaprto · klima 0,9 kW", "window closed · AC 0.9 kW"),
            ),
            row(
              t("Sanitarije v kampu", "Camp sanitary block"),
              "CAMP_SAN_WATER",
              "camp-sanitary",
              d("0.42 m³/h"),
              t("168 obiskov · 58 °C", "168 visits · 58 °C"),
            ),
            row(
              t("Elektrika kampa", "Camp electricity"),
              "CAMP_FEEDER",
              "camp-feeder",
              "68 kW",
              t("konica danes 96 kW", "peak today 96 kW"),
            ),
          ],
        },
        {
          title: t("Skupne storitve", "Shared services"),
          tag: t("STORITVE", "SERVICES"),
          rows: [
            row(
              t("Elektrika hotela", "Hotel electricity"),
              "HOTEL_POWER_01",
              "hotel-power",
              d("38.5 kW"),
              t("danes 412 kWh", "412 kWh today"),
            ),
            row(
              t("Hotelski bazen", "Hotel pool"),
              "POOL_01",
              "pool",
              d("26.4 °C"),
              t("pH 7,3 · klor 0,6 mg/l", "pH 7.3 · chlorine 0.6 mg/l"),
            ),
            row(
              t("HACCP · restavracija", "HACCP · restaurant"),
              "HACCP_01",
              "haccp",
              d("3.6 °C"),
              t("zamrzovalnik −19,2 °C", "freezer −19.2 °C"),
            ),
            row(
              t("Sanitarije marine", "Marina sanitary block"),
              "SANITARY_WATER_01",
              "sanitary-water",
              d("0.84 m³/h"),
              t("214 obiskov · 52 °C", "214 visits · 52 °C"),
            ),
            row(
              t("Prosta parkirna mesta", "Free parking spaces"),
              "PARKING_01",
              "parking",
              `${free} / ${parking.total}`,
              t("58 uvozov danes", "58 in today"),
            ),
            row(
              t("Polnilnici EV", "EV chargers"),
              "EV_01",
              "ev",
              d("11.0 kW"),
              t("prosta 1 / 2 · danes 38 kWh", "1 / 2 free · 38 kWh today"),
            ),
            row(
              t("Zabojnika za odpadke", "Waste containers"),
              "WASTE_01",
              "waste",
              pct(64),
              t("odvoz čez 2 dni", "collection in 2 days"),
            ),
            row(
              t("Zalivanje", "Irrigation"),
              "IRRIGATION_01",
              "irrigation",
              pct(31),
              t("ventil zaprt", "valve closed"),
            ),
          ],
        },
        {
          title: t("Varnost", "Safety"),
          tag: "SAFETY",
          in: "overview devices alarms",
          rows: [
            row(
              t("Omarica pomola B1", "Pier B1 cabinet"),
              "CABINET_B1",
              "cabinet",
              closed,
              t("31 °C · suho · nagib 0°", "31 °C · dry · tilt 0°"),
            ),
            row(
              t("Svetilnika ob vhodu", "Harbour entrance lights"),
              "NAV_LIGHTS",
              "nav-lights",
              t("Deluje", "Working"),
              t("rdeča in zelena · 6 W", "red and green · 6 W"),
            ),
            row(
              t("Dim · kuhinja", "Smoke · kitchen"),
              "SMOKE_01",
              "smoke",
              d("0.02 %/m"),
              t("ni dima", "clear"),
            ),
            row(
              t("Dim, CO in plin · MH-02", "Smoke, CO and gas · MH-02"),
              "MH_02_SAFETY",
              "mh-safety",
              d("0.01 %/m"),
              t("CO 0 ppm · plin 0 %", "CO 0 ppm · gas 0%"),
            ),
          ],
        },
        {
          title: t("Obračun ob odhodu", "Billed at check-out"),
          tag: "INTEGRATION · PMS",
          in: "overview",
          rows: [
            row(
              t("Jahta Mirta · A-04", "Yacht Mirta · A-04"),
              t("4 noči", "4 nights"),
              "bill-1",
              d("61.2 kWh"),
              t("0,84 m³ · poslano v PMS", "0.84 m³ · sent to the PMS"),
            ),
            row(
              t("Parcela 07 · Novak", "Pitch 07 · Novak"),
              t("6 noči", "6 nights"),
              "bill-2",
              d("38.9 kWh"),
              t("1,92 m³ · poslano v PMS", "1.92 m³ · sent to the PMS"),
            ),
            row(
              t("Mobilna hišica MH-02 · Rossi", "Mobile home MH-02 · Rossi"),
              t("5 noči", "5 nights"),
              "bill-3",
              d("71.5 kWh"),
              t("3,10 m³ · poslano v PMS", "3.10 m³ · sent to the PMS"),
            ),
            row(
              t("Jadrnica Bura · B-09", "Sailboat Bura · B-09"),
              t("2 noči", "2 nights"),
              "bill-4",
              d("14.0 kWh"),
              t("0,21 m³ · odhod ob 11:00", "0.21 m³ · leaves at 11:00"),
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
              t("Privez B-07", "Berth B-07"),
              "BERTH_OCC_A",
              "kai-berth",
              t("Resno", "Serious"),
              t("brez rezervacije · 36 h", "no booking · 36 h"),
            ),
            row(
              t("Mobilna hišica MH-02", "Mobile home MH-02"),
              "MH_02",
              "kai-mh",
              t("Opozorilo", "Warning"),
              t("okno odprto → klima stop", "window open → AC off"),
            ),
            row(
              t("Parcela 14 · voda", "Pitch 14 · water"),
              "PITCH_14_WATER",
              "kai-water",
              t("Opozorilo", "Warning"),
              t("0,2 m³/h ponoči", "0.2 m³/h at night"),
            ),
            row(
              t("Napoved konice", "Peak forecast"),
              t("danes", "today"),
              "kai-peak",
              "232 kW",
              t("predhlajenje ob 17:30", "pre-cool at 17:30"),
            ),
            row(
              t("Burja jutri", "Bora tomorrow"),
              "WIND_01",
              "kai-bora",
              "06:00",
              t("−6 hPa · 34 kn → SMS", "−6 hPa · 34 kn → SMS"),
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
              "40 / 40",
              t("povezanih", "online"),
            ),
            row(
              t("Kakovost povezave", "Link quality"),
              "RSSI · SNR",
              "noc-rssi",
              "−78 dBm",
              t("najšibkejša: PIER_04", "weakest: PIER_04"),
            ),
            row(
              t("Baterije senzorjev", "Sensor batteries"),
              t("najnižja", "lowest"),
              "noc-battery",
              pct(54),
              "BUOY_01",
            ),
            row(
              t("Integracije", "Integrations"),
              t("PMS · obračun · BMS", "PMS · billing · BMS"),
              "noc-links",
              "3 / 3",
              t("povezane", "connected"),
            ),
          ],
        },
      ],
    },
  };
}
