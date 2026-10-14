import type { Locale } from "../../../lib/i18n";
import type { ReadingRow, Sensor, Tone, Twin } from "./types";
import geometry from "./marina-geometry.json";

// The smart marina and camp, rendered by scripts/generate-marina-maquette.mjs:
// the marina in the middle of the board, the camp behind it. Every berth's
// pedestal meters power and water and knows the boat on it; the camp's
// pitches and mobile homes follow the reception's bookings; the hotel pool,
// the restaurant, the car parks and the greenery serve both. Pins are grouped
// into layers (one network at a time) and two sites. Hotspots, unlit patches
// and sensor pins come from the generated geometry.
export function marinaTwin(locale: Locale): Twin {
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
    // Pier lights are a few pixels wide; give them a larger click target.
    const target = hit
      ? { hit: `M${anchor[0] - 16} ${anchor[1] - 12}h32v46h-32z` }
      : {};
    return { id, label, off, shape, anchor, ...target };
  };
  const every1 = t("vsako minuto", "every minute", "jede Minute");
  const every5 = t("vsakih 5 min", "every 5 min", "alle 5 min");
  const every15 = t("vsakih 15 min", "every 15 min", "alle 15 min");
  const closed = t("Zaprta", "Closed", "Geschlossen");
  const socketOff = t("IZKLOP", "OFF", "AUS");

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
  const socket = (kw: string) =>
    t(`VKLOP · ${d(kw)} kW`, `ON · ${kw} kW`, `EIN · ${d(kw)} kW`);

  return {
    id: "marina",
    tab: {
      title: t(
        "Pametna marina in kamp",
        "Smart marina and camp",
        "Smarte Marina und Campingplatz",
      ),
      meta: t(
        "Maketa 60 × 60 cm · 10 naprav · 30 senzorjev",
        "60 × 60 cm model · 10 devices · 30 sensors",
        "Modell 60 × 60 cm · 10 Geräte · 30 Sensoren",
      ),
    },
    intro: {
      title: t(
        "Marina in kamp, ki vesta, kaj se dogaja na vsakem privezu in parceli.",
        "A marina and a camp that know what is happening on every berth and pitch.",
        "Eine Marina und ein Campingplatz, die wissen, was an jedem Liegeplatz und Stellplatz passiert.",
      ),
      lead: t(
        "Vsaka priključna omarica na pomolu meri elektriko in vodo po privezu, prepozna gosta po kartici NFC in ve, ali je plovilo na privezu – vse gre samodejno na račun ob odhodu. V kampu recepcija ob prijavi gosta vklopi parcelo ali mobilno hišico, ki se predhodno ohladi, ob odjavi pa končna poraba odide v obračun. Hotelski bazen, restavracija, parkirišča, polnilnice in zelenice služijo obema, senzorji morja, vremena in varnosti pa varujejo ljudi, plovila in elektriko na pomolih.",
        "Every service pedestal on the piers meters power and water per berth, recognises the guest by their NFC card and knows whether the boat is on its berth – and all of it goes on the bill at departure without a manual reading. In the camp, the reception switches a pitch or a mobile home on at check-in, pre-cooling it, and sends the final reading to billing at check-out. The hotel pool, the restaurant, the car parks, the EV chargers and the greenery serve both, while sea, weather and safety sensors protect people, boats and the electricity on the piers.",
        "Jede Versorgungssäule am Steg misst Strom und Wasser pro Liegeplatz, erkennt den Gast an seiner NFC-Karte und weiß, ob das Boot am Liegeplatz liegt – und alles landet bei der Abreise ohne manuelle Ablesung auf der Rechnung. Auf dem Campingplatz schaltet die Rezeption beim Check-in einen Stellplatz oder ein Mobilheim ein, das vorgekühlt wird, und schickt beim Check-out den Endstand an die Abrechnung. Hotelpool, Restaurant, Parkplätze, Ladestationen und Grünflächen dienen beiden, während Sensoren für Meer, Wetter und Sicherheit Menschen, Boote und die Stromversorgung an den Stegen schützen.",
      ),
    },
    panel: {
      view: t(
        "Pogled marine in kampa · povlecite za raziskovanje",
        "Marina and camp view · drag to explore",
        "Ansicht von Marina und Campingplatz · ziehen zum Erkunden",
      ),
      hint: t(
        "Izberite lokacijo ali plast senzorjev, kliknite senzor, da pošlje meritev, ali luč, hotel, restavracijo, sanitarije oz. mobilno hišico za vklop in izklop",
        "Pick a site or a sensor layer, click a sensor to send a reading, or a light, the hotel, restaurant, a sanitary block or a mobile home to switch it on or off",
        "Wählen Sie einen Standort oder eine Sensorebene, klicken Sie auf einen Sensor, um einen Messwert zu senden, oder auf eine Leuchte, das Hotel, das Restaurant, einen Sanitärblock oder ein Mobilheim, um es ein- oder auszuschalten",
      ),
      hintPanel: t(
        "Kartica priključne omarice izklopi vtičnico na daljavo in pokaže svojo vrstico na nadzorni plošči.",
        "A pedestal's card switches its socket remotely and points at its row on the dashboard.",
        "Die Karte einer Versorgungssäule schaltet ihre Steckdose aus der Ferne und zeigt ihre Zeile im Dashboard.",
      ),
      step: t(
        "Senzor bere svetlobo okolice",
        "Sensor is reading ambient light",
        "Sensor misst das Umgebungslicht",
      ),
    },
    scene: {
      photo: "/images/nexavia/showcase-room/marina/maquette.webp",
      width: geometry.photo.width,
      height: geometry.photo.height,
      alt: t(
        "Maketa marine in kampa velikosti 60 × 60 cm iz štirih modulov velikosti 30 × 30 cm: v sredini bazen s pomoli, priključnimi omaricami in privezanimi plovili, boja za kakovost vode in svetilnika ob vhodu, ob njem hotel z bazenom, restavracija, sanitarni blok, parkirišči z zabojnikoma za odpadke in polnilnicama za električna vozila, točilnica goriva s postajo za praznjenje fekalnih tankov in kapitanija z vremensko postajo, v ozadju kamp z recepcijo in zapornico, razdelilno omarico, dvema mobilnima hišicama, sanitarnim blokom s sončnimi kolektorji in parcelami s počitniškimi prikolicami",
        "60 by 60 centimetre marina and camp maquette of four 30 by 30 centimetre modules: a basin with piers, service pedestals and moored boats in the middle, a water-quality buoy and harbour lights at the entrance, around it a hotel with a pool, a restaurant, a sanitary block, two car parks with waste containers and electric vehicle chargers, a fuel dock with a pump-out station and the harbour office with a weather station, and behind it a camp with a reception and barrier, a feeder cabinet, two mobile homes, a sanitary block with solar collectors and pitches with holiday trailers",
        "Modell einer Marina mit Campingplatz im Format 60 × 60 cm aus vier Modulen à 30 × 30 cm: in der Mitte ein Hafenbecken mit Stegen, Versorgungssäulen und festgemachten Booten, eine Wasserqualitätsboje und Hafenfeuer an der Einfahrt, daneben ein Hotel mit Pool, ein Restaurant, ein Sanitärblock, zwei Parkplätze mit Abfallbehältern und Ladestationen für Elektrofahrzeuge, eine Tankstelle mit Absauganlage und das Hafenbüro mit Wetterstation, dahinter ein Campingplatz mit Rezeption und Schranke, Verteilerschrank, zwei Mobilheimen, einem Sanitärblock mit Solarkollektoren und Stellplätzen mit Wohnwagen",
      ),
      lightsDir: "/images/nexavia/showcase-room/marina/lights",
      water: "/images/nexavia/showcase-room/marina/water.webp",
      glints: Object.entries(geometry.glints as Record<string, number[]>).map(
        ([id, box]) => ({ id, box }),
      ),
      modules: [
        {
          letter: "A",
          name: t("Kamp · hotel", "Camp · hotel", "Campingplatz · Hotel"),
          plan: [520, 236],
          label: [22, 18],
        },
        {
          letter: "B",
          name: t(
            "Kamp · restavracija",
            "Camp · restaurant",
            "Campingplatz · Restaurant",
          ),
          plan: [1010, 236],
          label: [66, 18],
        },
        {
          letter: "C",
          name: t(
            "Pomoli · parkirišče",
            "Piers · parking",
            "Stege · Parkplatz",
          ),
          plan: [480, 566],
          label: [16, 57],
        },
        {
          letter: "D",
          name: t("Pomoli · storitve", "Piers · services", "Stege · Services"),
          plan: [1080, 566],
          label: [72, 57],
        },
      ],
      sites: [
        {
          id: "all",
          label: t("Marina + kamp", "Marina + camp", "Marina + Campingplatz"),
        },
        {
          id: "marina",
          label: t("Marina", "Marina", "Marina"),
          focus: { x: 768, y: 470, zoom: 1.2 },
        },
        {
          id: "camp",
          label: t("Kamp", "Camp", "Campingplatz"),
          focus: { x: 760, y: 175, zoom: 1.7 },
        },
      ],
      layers: [
        { id: "power", label: t("Elektrika", "Electricity", "Strom") },
        { id: "water", label: t("Voda", "Water", "Wasser") },
        { id: "guests", label: t("Gostje", "Guests", "Gäste") },
        {
          id: "environment",
          label: t("Morje in vreme", "Sea and weather", "Meer und Wetter"),
        },
        { id: "safety", label: t("Varnost", "Safety", "Sicherheit") },
        { id: "services", label: t("Storitve", "Services", "Services") },
      ],
      lighting: [
        device(
          "HOTEL_01",
          t("Razsvetljava hotela", "Hotel lighting", "Beleuchtung Hotel"),
        ),
        device(
          "RESTAURANT_01",
          t(
            "Razsvetljava restavracije in terase",
            "Restaurant and terrace lighting",
            "Beleuchtung Restaurant und Terrasse",
          ),
        ),
        device(
          "SANITARY_01",
          t(
            "Razsvetljava sanitarij",
            "Sanitary block lighting",
            "Beleuchtung Sanitärblock",
          ),
        ),
        device(
          "PIER_01",
          t("Luč pomola A1", "Pier light A1", "Stegleuchte A1"),
          true,
        ),
        device(
          "PIER_02",
          t("Luč pomola A2", "Pier light A2", "Stegleuchte A2"),
          true,
        ),
        device(
          "PIER_03",
          t("Luč pomola B1", "Pier light B1", "Stegleuchte B1"),
          true,
        ),
        device(
          "PIER_04",
          t("Luč pomola B2", "Pier light B2", "Stegleuchte B2"),
          true,
        ),
        device(
          "MOBILE_HOME_01",
          t("Mobilna hišica MH-01", "Mobile home MH-01", "Mobilheim MH-01"),
        ),
        device(
          "MOBILE_HOME_02",
          t("Mobilna hišica MH-02", "Mobile home MH-02", "Mobilheim MH-02"),
        ),
        device(
          "CAMP_SANITARY_01",
          t(
            "Razsvetljava sanitarij v kampu",
            "Camp sanitary block lighting",
            "Beleuchtung Sanitärblock Campingplatz",
          ),
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
          t(
            "Priključna omarica priveza A-05",
            "Berth A-05 service pedestal",
            "Versorgungssäule Liegeplatz A-05",
          ),
          t(
            "Privez A-05 · jahta Mirta",
            "Berth A-05 · yacht Mirta",
            "Liegeplatz A-05 · Yacht Mirta",
          ),
          [
            [
              t("Vtičnica 16 A", "Socket 16 A", "Steckdose 16 A"),
              socket("2.3"),
            ],
            [
              t("Napetost · tok", "Voltage · current", "Spannung · Strom"),
              "231 V · 10 A",
              "pedestal-a-v",
            ],
            [
              t("Ta postanek", "This stay", "Dieser Aufenthalt"),
              d("31.7 kWh"),
              "pedestal-a-kwh",
            ],
            [
              t("Gost · NFC", "Guest · NFC", "Gast · NFC"),
              "I. Kos ✓",
              "pedestal-a-guest",
            ],
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
              "Steckdose schaltet nur mit der Karte des Gastes ein · kWh auf den Liegeplatz abgerechnet · Überlast → Alarm",
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
          t(
            "Priključna omarica priveza B-06",
            "Berth B-06 service pedestal",
            "Versorgungssäule Liegeplatz B-06",
          ),
          t(
            "Privez B-06 · Galeb, 11,4 m",
            "Berth B-06 · Galeb, 11.4 m",
            "Liegeplatz B-06 · Galeb, 11,4 m",
          ),
          [
            [
              t("Vtičnica 16 A", "Socket 16 A", "Steckdose 16 A"),
              socket("1.6"),
            ],
            [
              t("Faktor moči", "Power factor", "Leistungsfaktor"),
              d("0.96"),
              "pedestal-b-pf",
            ],
            [
              t("Ta postanek", "This stay", "Dieser Aufenthalt"),
              d("18.2 kWh"),
              "pedestal-b-kwh",
            ],
            [
              t("Gost · NFC", "Guest · NFC", "Gast · NFC"),
              "K. Horvat ✓",
              "pedestal-b-guest",
            ],
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
              "Die NFC-Karte des Gastes schaltet nur seine Steckdose ein · Verbrauch wird abgerechnet",
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
          t(
            "Vodomer priveza A-09",
            "Berth A-09 water meter",
            "Wasserzähler Liegeplatz A-09",
          ),
          t(
            "Voda na privezu A-09",
            "Water at berth A-09",
            "Wasser am Liegeplatz A-09",
          ),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("0.00 m³/h")],
            [
              t("Ta postanek", "This stay", "Dieser Aufenthalt"),
              d("0.46 m³"),
              "berth-water-stay",
            ],
            [
              t("Stalni pretok", "Continuous flow", "Dauerdurchfluss"),
              t("Ne", "No", "Nein"),
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
              "Regel: Dauerdurchfluss > 30 min → Alarm und Ventil geschlossen · KAI: Verbrauch im Vergleich zur Historie des Boots",
            ),
          },
        ),
        pin(
          "berths",
          "BERTH_OCC_A",
          "mobility",
          "guests",
          "marina",
          t("Privezi", "Berths", "Liegeplätze"),
          t(
            "Senzorji zasedenosti privezov",
            "Berth occupancy sensors",
            "Belegungssensoren Liegeplätze",
          ),
          t(
            "Zasedenost privezov",
            "Berth occupancy",
            "Belegung der Liegeplätze",
          ),
          [
            [t("Zasedeni", "Occupied", "Belegt"), String(berths.occupied)],
            [
              t("Prihodi danes", "Arrivals today", "Ankünfte heute"),
              "3",
              "berths-in",
            ],
            [
              t("Brez rezervacije", "No booking", "Keine Buchung"),
              "1",
              "berths-unauth",
            ],
          ],
          {
            every: undefined,
            uses: t(
              "Pravilo: plovilo na privezu brez rezervacije → izklop vtičnice in obvestilo kapitaniji",
              "Rule: boat on a berth without a booking → socket off and harbour office notified",
              "Regel: Boot am Liegeplatz ohne Buchung → Steckdose aus und Hafenbüro benachrichtigt",
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
          t(
            "Razdelilna omara pomola B",
            "Pier B feeder cabinet",
            "Verteilerschrank Steg B",
          ),
          t("Elektrika na pomolu B", "Pier B shore power", "Landstrom Steg B"),
          [
            [t("Danes", "Today", "Heute"), d("46.8 kWh")],
            [t("Zdaj", "Now", "Jetzt"), d("18.4 kW"), "shore-kw"],
            [
              t("Konica danes", "Peak today", "Spitze heute"),
              "31 kW",
              "shore-peak",
            ],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Konica po pomolu in coni · KAI napove večerno konico, ko vse jahte vklopijo klimo",
              "Peak per pier and zone · KAI forecasts the evening peak when every yacht turns on its AC",
              "Spitze pro Steg und Zone · KAI prognostiziert die Abendspitze, wenn alle Yachten ihre Klimaanlage einschalten",
            ),
          },
        ),
        pin(
          "fuel",
          "FUEL_TANK_01",
          "gas",
          "services",
          "marina",
          t("Gorivo", "Fuel", "Kraftstoff"),
          t(
            "Senzor rezervoarja točilnice",
            "Fuel dock tank sensor",
            "Tanksensor Bootstankstelle",
          ),
          t("Točilnica goriva", "Fuel dock", "Bootstankstelle"),
          [
            [t("Rezervoar", "Tank", "Tank"), pct(72)],
            [
              t("Natočeno danes", "Dispensed today", "Heute getankt"),
              "184 L",
              "fuel-day",
            ],
            [
              t("Zadnje", "Last", "Zuletzt"),
              t("Galeb · 46 L", "Galeb · 46 L", "Galeb · 46 L"),
              "fuel-last",
            ],
          ],
          {
            side: "above",
            align: "end",
            every: t("vsako uro", "every hour", "jede Stunde"),
            uses: t(
              "Litri po plovilu na račun gosta · zaloga < 25 % → naročilo dobavitelju",
              "Litres per boat on the guest's bill · stock < 25% → order from the supplier",
              "Liter pro Boot auf der Rechnung des Gastes · Bestand < 25 % → Bestellung beim Lieferanten",
            ),
          },
        ),
        pin(
          "pumpout",
          "PUMPOUT_01",
          "water",
          "services",
          "marina",
          t("Fekalije", "Pump-out", "Absaugung"),
          t(
            "Postaja za praznjenje fekalnih tankov",
            "Pump-out station",
            "Fäkalien-Absauganlage",
          ),
          t(
            "Praznjenje fekalnih tankov",
            "Pump-out station",
            "Fäkalien-Absauganlage",
          ),
          [
            [t("Zbirni rezervoar", "Holding tank", "Sammeltank"), pct(38)],
            [
              t("Črpalka", "Pump", "Pumpe"),
              t("Pripravljena", "Ready", "Bereit"),
              "pumpout-pump",
            ],
            [
              t("Danes", "Today", "Heute"),
              t("3 plovila", "3 boats", "3 Boote"),
              "pumpout-day",
            ],
          ],
          {
            side: "above",
            align: "end",
            every: every15,
            uses: t(
              "Rezervoar > 80 % → naročilo odvoza · napaka črpalke → alarm",
              "Tank > 80% → collection ordered · pump fault → alarm",
              "Tank > 80 % → Abholung bestellt · Pumpenstörung → Alarm",
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
            "Hafenbüro · Buchungssystem",
          ),
          t("Rezervacije privezov", "Berth bookings", "Liegeplatzbuchungen"),
          [
            [t("Prihodi danes", "Arrivals today", "Ankünfte heute"), "3"],
            [
              t("Odhodi danes", "Departures today", "Abreisen heute"),
              "2",
              "pms-marina-out",
            ],
            [
              t(
                "Samodejni obračun",
                "Billed automatically",
                "Automatisch abgerechnet",
              ),
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
              "Eine Buchung schaltet die Services des Liegeplatzes ein · bei der Abreise geht der Verbrauch in die Abrechnung",
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
          label: t("Senzor svetlobe", "Light sensor", "Lichtsensor"),
          event: t("Svetloba okolice", "Ambient light", "Umgebungslicht"),
          at: [330, 212],
          side: "below",
          align: "start",
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
            note: t("Streha hotela", "Hotel roof", "Dach des Hotels"),
          },
        },
        pin(
          "sea-level",
          "SEA_LEVEL_01",
          "water",
          "environment",
          "marina",
          t("Morje", "Sea", "Meer"),
          t(
            "Senzor gladine morja in valov",
            "Sea level and wave sensor",
            "Sensor für Meeresspiegel und Wellen",
          ),
          t("Gladina morja", "Sea level", "Meeresspiegel"),
          [
            [t("Gladina", "Level", "Pegel"), d("+0.42 m")],
            [
              t(
                "Valovi na vhodu",
                "Waves at the entrance",
                "Wellen an der Einfahrt",
              ),
              d("0.3 m"),
              "sea-waves",
            ],
          ],
          {
            alert: 0.7,
            uses: t(
              "Pravilo: gladina > +0,70 m → izklop priključkov",
              "Rule: sea level > +0.70 m → pedestals cut off",
              "Regel: Meeresspiegel > +0,70 m → Versorgungssäulen abgeschaltet",
            ),
          },
        ),
        pin(
          "buoy",
          "BUOY_01",
          "water",
          "environment",
          "marina",
          t("Boja", "Buoy", "Boje"),
          t(
            "Boja za kakovost morja",
            "Water-quality buoy",
            "Wasserqualitätsboje",
          ),
          t("Kakovost morja", "Sea water quality", "Meerwasserqualität"),
          [
            [t("Temperatura", "Temperature", "Temperatur"), d("19.4 °C")],
            [t("Slanost", "Salinity", "Salzgehalt"), d("37.8 PSU"), "buoy-sal"],
            ["pH", d("8.1"), "buoy-ph"],
            [t("Motnost", "Turbidity", "Trübung"), d("2.1 NTU"), "buoy-ntu"],
            [t("Kisik", "Oxygen", "Sauerstoff"), d("7.6 mg/l"), "buoy-o2"],
          ],
          {
            side: "above",
            every: every15,
            uses: t(
              "Okoljski monitoring za modro zastavo · nenadna motnost → sum razlitja",
              "Environmental record for the Blue Flag · sudden turbidity → suspected spill",
              "Umweltnachweis für die Blaue Flagge · plötzliche Trübung → Verdacht auf Ölaustritt",
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
          t("Vremenska postaja", "Weather station", "Wetterstation"),
          t("Veter in vreme", "Wind and weather", "Wind und Wetter"),
          [
            [t("Veter", "Wind", "Wind"), "9 kn"],
            [t("Sunki", "Gusts", "Böen"), "13 kn", "wind-gust"],
            [t("Temp.", "Temp.", "Temp."), d("17.9 °C"), "wind-temp"],
            [t("Tlak", "Pressure", "Luftdruck"), "1016 hPa", "wind-hpa"],
            [t("Vlaga", "Humidity", "Luftfeuchtigkeit"), pct(64), "wind-rh"],
            [t("Dež", "Rain", "Regen"), "0 mm", "wind-rain"],
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
              "Böen > 30 kn → Eigner gewarnt · fallender Luftdruck → Bora-Warnung",
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
          t(
            "Zaščita omarice pomola B1",
            "Pier B1 cabinet protection",
            "Schutz Schrank Steg B1",
          ),
          t("Omarica pomola B1", "Pier B1 cabinet", "Schrank Steg B1"),
          [
            [t("Vrata", "Door", "Tür"), closed],
            [
              t("Temperatura", "Temperature", "Temperatur"),
              "31 °C",
              "cabinet-temp",
            ],
            [
              t("Voda", "Water", "Wasser"),
              t("Suho", "Dry", "Trocken"),
              "cabinet-flood",
            ],
            [t("Nagib", "Tilt", "Neigung"), "0°", "cabinet-tilt"],
          ],
          {
            every: undefined,
            uses: t(
              "Odprta vrata, pregrevanje, voda ali udarec plovila → alarm in izklop omarice",
              "Door opened, overheating, water or a boat strike → alarm and the cabinet switched off",
              "Tür geöffnet, Überhitzung, Wasser oder Bootsanprall → Alarm und Schrank abgeschaltet",
            ),
          },
        ),
        pin(
          "nav-lights",
          "NAV_LIGHTS",
          "light",
          "safety",
          "marina",
          t("Svetilnik", "Beacons", "Leuchtfeuer"),
          t(
            "Svetilnika ob vhodu v marino",
            "Harbour entrance lights",
            "Hafenfeuer an der Einfahrt",
          ),
          t(
            "Svetilnika ob vhodu",
            "Harbour entrance lights",
            "Hafenfeuer an der Einfahrt",
          ),
          [
            [t("Rdeča", "Red", "Rot"), t("Deluje", "Working", "In Betrieb")],
            [
              t("Zelena", "Green", "Grün"),
              t("Deluje", "Working", "In Betrieb"),
              "nav-green",
            ],
            [t("Poraba", "Power", "Leistung"), "6 W", "nav-w"],
          ],
          {
            side: "above",
            every: every15,
            uses: t(
              "Ugasnjen svetilnik → takojšen alarm kapitaniji, ne le servisni nalog",
              "A dark beacon → instant alarm to the harbour office, not just a maintenance ticket",
              "Ein dunkles Leuchtfeuer → sofortiger Alarm an das Hafenbüro, nicht nur ein Wartungsauftrag",
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
            "Rauchmelder · Restaurantküche",
          ),
          t("Dim · kuhinja", "Smoke · kitchen", "Rauch · Küche"),
          [
            [t("Dim", "Smoke", "Rauch"), d("0.02 %/m")],
            [
              t("Stanje", "Status", "Status"),
              t("Ni dima", "Clear", "Kein Rauch"),
              "smoke-state",
            ],
          ],
          {
            align: "end",
            every: undefined,
            uses: t(
              "Dim → alarm dežurnemu in izklop plina v kuhinji",
              "Smoke → alarm to the person on call and the kitchen gas shut off",
              "Rauch → Alarm an die Bereitschaft und Gaszufuhr der Küche abgesperrt",
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
          t(
            "Električni števec hotela",
            "Hotel electricity meter",
            "Stromzähler Hotel",
          ),
          t(
            "Poraba elektrike · hotel",
            "Electricity use · hotel",
            "Stromverbrauch · Hotel",
          ),
          [
            [t("Trenutna moč", "Current load", "Aktuelle Last"), d("38.5 kW")],
            [t("Danes", "Today", "Heute"), "412 kWh", "hotel-kwh"],
          ],
          { card: meter, every: every15 },
        ),
        pin(
          "pool",
          "POOL_01",
          "water",
          "services",
          undefined,
          t("Bazen", "Pool", "Pool"),
          t(
            "Merilnik kakovosti vode v bazenu",
            "Pool water analyser",
            "Poolwasser-Analysator",
          ),
          t("Hotelski bazen", "Hotel pool", "Hotelpool"),
          [
            [t("Temperatura", "Temperature", "Temperatur"), d("26.4 °C")],
            ["pH", d("7.3"), "pool-ph"],
            [t("Klor", "Chlorine", "Chlor"), d("0.6 mg/l"), "pool-cl"],
            ["ORP", "720 mV", "pool-orp"],
            [t("Črpalka", "Pump", "Pumpe"), d("1.1 kW"), "pool-pump"],
          ],
          {
            align: "start",
            uses: t(
              "Klor < 0,3 mg/l ali pH zunaj 7,0–7,6 → bazen zaprt, dozirna črpalka popravi, zapis za inšpekcijo",
              "Chlorine < 0.3 mg/l or pH outside 7.0–7.6 → pool closed, the dosing pump corrects, record kept for inspection",
              "Chlor < 0,3 mg/l oder pH außerhalb 7,0–7,6 → Pool gesperrt, Dosierpumpe korrigiert, Nachweis für die Behörde gespeichert",
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
          t(
            "Senzorji HACCP · restavracija",
            "HACCP sensors · restaurant",
            "HACCP-Sensoren · Restaurant",
          ),
          t("HACCP · restavracija", "HACCP · restaurant", "HACCP · Restaurant"),
          [
            [t("Hladilnik", "Fridge", "Kühlschrank"), d("3.6 °C")],
            [
              t("Zamrzovalnik", "Freezer", "Tiefkühler"),
              d("-19.2 °C"),
              "haccp-freezer",
            ],
            [
              t("Topla vitrina", "Hot counter", "Warmtheke"),
              "68 °C",
              "haccp-hot",
            ],
          ],
          {
            align: "end",
            alert: 8,
            uses: t(
              "Samodejni zapis HACCP · hladilnik > 8 °C 15 min → alarm kuharju",
              "Automatic HACCP record · fridge > 8 °C for 15 min → alarm to the chef",
              "Automatischer HACCP-Nachweis · Kühlschrank > 8 °C über 15 min → Alarm an den Küchenchef",
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
          t(
            "Vodomer sanitarij",
            "Sanitary block water meter",
            "Wasserzähler Sanitärblock",
          ),
          t(
            "Sanitarije marine",
            "Marina sanitary block",
            "Sanitärblock Marina",
          ),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("0.84 m³/h")],
            [
              t("Topla voda", "Hot water", "Warmwasser"),
              "52 °C",
              "sanitary-hot",
            ],
            [
              t("Obiski danes", "Visits today", "Besuche heute"),
              "214",
              "sanitary-visits",
            ],
          ],
          {
            card: meter,
            align: "end",
            every: every15,
            uses: t(
              "Pravilo: nočni pretok > 0,2 m³/h 20 min → alarm puščanja · čiščenje po dejanski uporabi",
              "Rule: night flow > 0.2 m³/h for 20 min → leak alarm · cleaning by real use",
              "Regel: Nachtdurchfluss > 0,2 m³/h über 20 min → Leckagealarm · Reinigung nach tatsächlicher Nutzung",
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
          t("Senzorji parkirišča", "Car park sensors", "Parkplatzsensoren"),
          t("Parkirišče marine", "Marina car park", "Parkplatz Marina"),
          [
            [t("Prosta mesta", "Free spaces", "Freie Plätze"), String(free)],
            [
              t("Uvozi danes", "In today", "Einfahrten heute"),
              "58",
              "parking-in",
            ],
            [
              t("Izvozi danes", "Out today", "Ausfahrten heute"),
              "51",
              "parking-out",
            ],
          ],
          { align: "start", every: undefined },
        ),
        pin(
          "waste",
          "WASTE_01",
          "structure",
          "services",
          undefined,
          t("Odpadki", "Waste", "Abfall"),
          t(
            "Senzorja v zabojnikih za odpadke",
            "Waste container sensors",
            "Sensoren in den Abfallbehältern",
          ),
          t("Zabojnika za odpadke", "Waste containers", "Abfallbehälter"),
          [
            [t("Napolnjenost", "Fill level", "Füllstand"), pct(64)],
            [
              t("Temperatura", "Temperature", "Temperatur"),
              "21 °C",
              "waste-temp",
            ],
          ],
          {
            align: "end",
            every: t("vsako uro", "every hour", "jede Stunde"),
            uses: t(
              "Odvoz le, ko je zabojnik poln · skok temperature → zgodnji alarm požara",
              "Collected only when full · temperature jump → early fire alarm",
              "Abholung nur bei vollem Behälter · Temperatursprung → frühzeitiger Brandalarm",
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
          t(
            "Polnilnici za električna vozila",
            "EV chargers",
            "Ladestationen für E-Fahrzeuge",
          ),
          t("Polnilnici EV", "EV chargers", "Ladestationen für E-Fahrzeuge"),
          [
            [t("Moč", "Power", "Leistung"), d("11.0 kW")],
            [t("Prosti", "Free", "Frei"), "1 / 2", "ev-free"],
            [
              t("Danes", "Today", "Heute"),
              t(
                "38 kWh · 4 seje",
                "38 kWh · 4 sessions",
                "38 kWh · 4 Ladevorgänge",
              ),
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
              "kWh pro Ladevorgang auf der Rechnung des Gastes · Laden weicht der Abendspitze aus",
            ),
          },
        ),
        pin(
          "irrigation",
          "IRRIGATION_01",
          "water",
          "services",
          undefined,
          t("Zalivanje", "Irrigation", "Bewässerung"),
          t(
            "Senzor vlage tal in ventil zalivanja",
            "Soil moisture sensor and irrigation valve",
            "Bodenfeuchtesensor und Bewässerungsventil",
          ),
          t(
            "Pametno zalivanje",
            "Smart irrigation",
            "Intelligente Bewässerung",
          ),
          [
            [t("Vlaga tal", "Soil moisture", "Bodenfeuchte"), pct(31)],
            [t("Ventil", "Valve", "Ventil"), closed, "irrigation-valve"],
            [
              t("Pretok", "Flow", "Durchfluss"),
              d("0.0 m³/h"),
              "irrigation-flow",
            ],
          ],
          {
            side: "above",
            align: "end",
            every: t("vsakih 30 min", "every 30 min", "alle 30 min"),
            uses: t(
              "Vlaga < 25 % in brez dežja → zalivanje ob 5:00 · pretok pri zaprtem ventilu → puščanje",
              "Moisture < 25% and no rain → watering at 05:00 · flow with the valve closed → leak",
              "Feuchte < 25 % und kein Regen → Bewässerung um 05:00 · Durchfluss bei geschlossenem Ventil → Leckage",
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
            "Rezeption · Buchungen und Schranke",
          ),
          t("Recepcija kampa", "Camp reception", "Rezeption Campingplatz"),
          [
            [
              t("Enote v uporabi", "Units in use", "Belegte Einheiten"),
              "21 / 24",
            ],
            [
              t("Prijave danes", "Check-ins today", "Check-ins heute"),
              "4",
              "pms-camp-in",
            ],
            [
              t(
                "Zapornica noter · ven",
                "Barrier in · out",
                "Schranke ein · aus",
              ),
              "38 · 31",
              "pms-camp-gate",
            ],
          ],
          {
            every: undefined,
            uses: t(
              "Prijava vklopi parcelo ali hišico · odjava pošlje končno porabo v obračun",
              "Check-in switches the pitch or mobile home on · check-out sends the final reading to billing",
              "Check-in schaltet Stellplatz oder Mobilheim ein · Check-out sendet den Endstand an die Abrechnung",
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
          t(
            "Priključek parcele 07",
            "Pitch 07 hook-up",
            "Anschluss Stellplatz 07",
          ),
          t("Parcela 07 · Novak", "Pitch 07 · Novak", "Stellplatz 07 · Novak"),
          [
            [t("Vtičnica", "Socket", "Steckdose"), socket("1.4")],
            [t("Danes", "Today", "Heute"), d("6.2 kWh"), "camp-pedestal-kwh"],
            [
              t("Rezervacija", "Booking", "Buchung"),
              t(
                "6 noči · do sobote",
                "6 nights · to Saturday",
                "6 Nächte · bis Samstag",
              ),
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
              "Strom nur während der Buchung · Überlast → Alarm · kWh auf den Stellplatz abgerechnet",
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
          t(
            "Vodomer parcele 14",
            "Pitch 14 water meter",
            "Wasserzähler Stellplatz 14",
          ),
          t(
            "Voda na parceli 14",
            "Water at pitch 14",
            "Wasser am Stellplatz 14",
          ),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("0.00 m³/h")],
            [t("Danes", "Today", "Heute"), d("0.21 m³"), "camp-water-day"],
            [
              t("Nočni pretok", "Night flow", "Nachtdurchfluss"),
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
              "Regel: dauerhafter Nachtdurchfluss → offener Schlauch, Alarm an die Rezeption",
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
            "Komfortsensoren · Mobilheim MH-01",
          ),
          t("Mobilna hišica MH-01", "Mobile home MH-01", "Mobilheim MH-01"),
          [
            [t("Temperatura", "Temperature", "Temperatur"), d("24.1 °C")],
            [t("Vlaga", "Humidity", "Luftfeuchtigkeit"), pct(52), "mh-rh"],
            ["CO₂", "610 ppm", "mh-co2"],
            [t("Okno", "Window", "Fenster"), closed, "mh-window"],
            [t("Klima", "AC", "Klima"), d("0.9 kW"), "mh-ac"],
          ],
          {
            uses: t(
              "Odprto okno → klima se ustavi · predhlajenje uro pred prihodom gosta",
              "Window open → AC pauses · pre-cooling an hour before the guest arrives",
              "Fenster offen → Klimaanlage pausiert · Vorkühlung eine Stunde vor Ankunft des Gastes",
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
            "Rauch, CO und Gas · Mobilheim MH-02",
          ),
          t("Varnost · MH-02", "Safety · MH-02", "Sicherheit · MH-02"),
          [
            [t("Dim", "Smoke", "Rauch"), d("0.01 %/m")],
            ["CO", "0 ppm", "mh-co"],
            [t("Plin UNP", "LPG", "Flüssiggas"), "0 % LEL", "mh-lpg"],
          ],
          {
            every: undefined,
            uses: t(
              "Dim, CO ali uhajanje plina → alarm na telefon gosta in recepciji",
              "Smoke, CO or a gas leak → alarm to the guest's phone and the reception",
              "Rauch, CO oder Gasaustritt → Alarm auf das Telefon des Gastes und an die Rezeption",
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
          t(
            "Senzorji sanitarij v kampu",
            "Camp sanitary block sensors",
            "Sensoren Sanitärblock Campingplatz",
          ),
          t(
            "Sanitarije v kampu",
            "Camp sanitary block",
            "Sanitärblock Campingplatz",
          ),
          [
            [t("Pretok", "Flow", "Durchfluss"), d("0.42 m³/h")],
            [t("Bojler", "Boiler", "Boiler"), "58 °C", "camp-hot"],
            [
              t("Obiski danes", "Visits today", "Besuche heute"),
              "168",
              "camp-visits",
            ],
            [
              t("Milo · papir", "Soap · paper", "Seife · Papier"),
              t("72 % · 64 %", "72% · 64%", "72 % · 64 %"),
              "camp-soap",
            ],
          ],
          {
            card: meter,
            every: every15,
            uses: t(
              "Čiščenje po obiskih, ne po uri · bojler < 45 °C → alarm · sončni kolektorji najprej",
              "Cleaning by visits, not by the clock · boiler < 45 °C → alarm · solar collectors first",
              "Reinigung nach Besuchen, nicht nach Uhrzeit · Boiler < 45 °C → Alarm · Solarkollektoren zuerst",
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
          t(
            "Razdelilna omara kampa",
            "Camp feeder cabinet",
            "Verteilerschrank Campingplatz",
          ),
          t("Elektrika kampa", "Camp electricity", "Strom Campingplatz"),
          [
            [t("Zdaj", "Now", "Jetzt"), "68 kW"],
            [
              t("Konica danes", "Peak today", "Spitze heute"),
              "96 kW",
              "camp-feeder-peak",
            ],
            [
              t(
                "Delež pogodbene moči",
                "Share of contract",
                "Anteil der Vertragsleistung",
              ),
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
              "KAI verschiebt Klimaanlagen und Boiler, damit Campingplatz und Marina unter 250 kW bleiben",
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
          "Nalaganje modela marine",
          "Loading the marina model",
          "Marinamodell wird geladen",
        ),
      },
    },
    dashboard: {
      title: t("Marina in kamp", "Marina and camp", "Marina und Campingplatz"),
      subtitle: t(
        `${berths.total} privezov · 24 enot v kampu · demonstracijski podatki`,
        `${berths.total} berths · 24 camp units · simulated data`,
        `${berths.total} Liegeplätze · 24 Einheiten auf dem Campingplatz · Demodaten`,
      ),
      kpis: [
        {
          key: "active",
          label: t("Aktivne luči", "Active lights", "Aktive Leuchten"),
          value: "0 / 10",
          note: t(
            "Marina in kamp",
            "Marina and camp",
            "Marina und Campingplatz",
          ),
        },
        {
          key: "power",
          label: t(
            "Moč razsvetljave",
            "Lighting power",
            "Beleuchtungsleistung",
          ),
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
          note: t("Senzor LIGHT_02", "Sensor LIGHT_02", "Sensor LIGHT_02"),
        },
        {
          key: "kpi-berths",
          reading: "kpi-berths",
          site: "marina",
          label: t(
            "Zasedeni privezi",
            "Berths occupied",
            "Belegte Liegeplätze",
          ),
          value: `${berths.occupied} / ${berths.total}`,
          note: t(
            "1 brez rezervacije",
            "1 without a booking",
            "1 ohne Buchung",
          ),
        },
        {
          key: "kpi-camp",
          reading: "kpi-camp",
          site: "camp",
          label: t(
            "Enote v kampu",
            "Camp units in use",
            "Belegte Einheiten Campingplatz",
          ),
          value: "21 / 24",
          note: t(
            "vklopil PMS",
            "switched on by the PMS",
            "vom PMS eingeschaltet",
          ),
        },
        {
          key: "kpi-peak",
          reading: "kpi-peak",
          label: t("Konica / pogodba", "Peak / contract", "Spitze / Vertrag"),
          value: "196 kW",
          note: t(
            "od 250 kW · napoved 232 kW ob 19:00",
            "of 250 kW · forecast 232 kW at 19:00",
            "von 250 kW · Prognose 232 kW um 19:00",
          ),
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
        { id: "HOTEL_01", name: t("Hotel", "Hotel", "Hotel") },
        {
          id: "RESTAURANT_01",
          name: t(
            "Restavracija s teraso",
            "Restaurant and terrace",
            "Restaurant und Terrasse",
          ),
        },
        {
          id: "SANITARY_01",
          name: t(
            "Sanitarni blok marine",
            "Marina sanitary block",
            "Sanitärblock Marina",
          ),
          site: "marina",
        },
        {
          id: "PIER_01",
          name: t("Luč pomola A1", "Pier light A1", "Stegleuchte A1"),
          site: "marina",
        },
        {
          id: "PIER_02",
          name: t("Luč pomola A2", "Pier light A2", "Stegleuchte A2"),
          site: "marina",
        },
        {
          id: "PIER_03",
          name: t("Luč pomola B1", "Pier light B1", "Stegleuchte B1"),
          site: "marina",
        },
        {
          id: "PIER_04",
          name: t("Luč pomola B2", "Pier light B2", "Stegleuchte B2"),
          site: "marina",
        },
        {
          id: "MOBILE_HOME_01",
          name: t(
            "Mobilna hišica MH-01",
            "Mobile home MH-01",
            "Mobilheim MH-01",
          ),
          site: "camp",
        },
        {
          id: "MOBILE_HOME_02",
          name: t(
            "Mobilna hišica MH-02",
            "Mobile home MH-02",
            "Mobilheim MH-02",
          ),
          site: "camp",
        },
        {
          id: "CAMP_SANITARY_01",
          name: t(
            "Sanitarije v kampu",
            "Camp sanitary block",
            "Sanitärblock Campingplatz",
          ),
          site: "camp",
        },
      ],
      group: t("Razsvetljava pomolov", "Pier lighting", "Stegbeleuchtung"),
      alarms: [
        {
          id: "PEDESTAL_B07",
          text: t(
            "Priključek B-07 · sprožena zaščita · 9 min",
            "Pedestal B-07 · breaker tripped · 9 min",
            "Säule B-07 · Schutzschalter ausgelöst · 9 min",
          ),
        },
        {
          id: "PIER_04",
          text: t(
            "Šibek signal prehoda · 3 min",
            "Gateway signal weak · 3 min",
            "Schwaches Gateway-Signal · 3 min",
          ),
        },
      ],
      meters: {
        title: t(
          "Marina · privezi in priključki",
          "Marina · berths and pedestals",
          "Marina · Liegeplätze und Säulen",
        ),
        site: "marina",
        rows: [
          row(
            t(
              "Privez A-05 · Mirta",
              "Berth A-05 · Mirta",
              "Liegeplatz A-05 · Mirta",
            ),
            "PEDESTAL_A05",
            "pedestal-a",
            socket("2.3"),
            t(
              "31,7 kWh ta postanek",
              "31.7 kWh this stay",
              "31,7 kWh dieser Aufenthalt",
            ),
          ),
          row(
            t(
              "Privez B-06 · Galeb",
              "Berth B-06 · Galeb",
              "Liegeplatz B-06 · Galeb",
            ),
            "PEDESTAL_B06",
            "pedestal-b",
            socket("1.6"),
            t(
              "18,2 kWh ta postanek",
              "18.2 kWh this stay",
              "18,2 kWh dieser Aufenthalt",
            ),
          ),
          row(
            t(
              "Elektrika na pomolu B",
              "Pier B shore power",
              "Landstrom Steg B",
            ),
            "SHORE_POWER_B",
            "shore-power",
            d("46.8 kWh"),
            t("konica danes 31 kW", "peak today 31 kW", "Spitze heute 31 kW"),
          ),
          row(
            t(
              "Voda na privezu A-09",
              "Water at berth A-09",
              "Wasser am Liegeplatz A-09",
            ),
            "WATER_A09",
            "berth-water",
            d("0.00 m³/h"),
            t(
              "0,46 m³ ta postanek",
              "0.46 m³ this stay",
              "0,46 m³ dieser Aufenthalt",
            ),
          ),
          row(
            t("Rezervoar točilnice", "Fuel dock tank", "Tank Bootstankstelle"),
            "FUEL_TANK_01",
            "fuel",
            pct(72),
            t("danes 184 L", "184 L today", "heute 184 L"),
          ),
          row(
            t(
              "Praznjenje fekalij",
              "Pump-out station",
              "Fäkalien-Absauganlage",
            ),
            "PUMPOUT_01",
            "pumpout",
            pct(38),
            t("danes 3 plovila", "3 boats today", "heute 3 Boote"),
          ),
        ],
      },
      sensors: {
        title: t(
          "Marina · morje, vreme in gostje",
          "Marina · sea, weather and guests",
          "Marina · Meer, Wetter und Gäste",
        ),
        site: "marina",
        rows: [
          row(
            t(
              "Zasedenost privezov",
              "Berth occupancy",
              "Belegung der Liegeplätze",
            ),
            "BERTH_OCC_A",
            "berths",
            `${berths.occupied} / ${berths.total}`,
            t("1 brez rezervacije", "1 without a booking", "1 ohne Buchung"),
          ),
          row(
            t("Rezervacije privezov", "Berth bookings", "Liegeplatzbuchungen"),
            "PMS_MARINA",
            "pms-marina",
            "3",
            t(
              "prihodi danes · 2 odhoda",
              "arrivals today · 2 departures",
              "Ankünfte heute · 2 Abreisen",
            ),
          ),
          row(
            t("Gladina morja", "Sea level", "Meeresspiegel"),
            "SEA_LEVEL_01",
            "sea-level",
            d("+0.42 m"),
            t(
              "Normalno · valovi 0,3 m",
              "Normal · waves 0.3 m",
              "Normal · Wellen 0,3 m",
            ),
          ),
          row(
            t("Veter", "Wind", "Wind"),
            "WIND_01",
            "wind",
            "9 kn",
            t("Sunki 13 kn · SV", "Gusts 13 kn · NE", "Böen 13 kn · NO"),
          ),
          row(
            t("Kakovost morja", "Sea water quality", "Meerwasserqualität"),
            "BUOY_01",
            "buoy",
            d("19.4 °C"),
            t(
              "pH 8,1 · kisik 7,6 mg/l",
              "pH 8.1 · oxygen 7.6 mg/l",
              "pH 8,1 · Sauerstoff 7,6 mg/l",
            ),
          ),
        ],
      },
      panels: [
        {
          title: t("Kamp", "Camp", "Campingplatz"),
          tag: "CAMP · PMS",
          site: "camp",
          rows: [
            row(
              t("Enote v uporabi", "Units in use", "Belegte Einheiten"),
              "PMS_CAMP",
              "pms-camp",
              "21 / 24",
              t("4 prijave danes", "4 check-ins today", "4 Check-ins heute"),
            ),
            row(
              t(
                "Parcela 07 · Novak",
                "Pitch 07 · Novak",
                "Stellplatz 07 · Novak",
              ),
              "PITCH_07",
              "camp-pedestal",
              socket("1.4"),
              t("danes 6,2 kWh", "6.2 kWh today", "heute 6,2 kWh"),
            ),
            row(
              t(
                "Voda na parceli 14",
                "Water at pitch 14",
                "Wasser am Stellplatz 14",
              ),
              "PITCH_14_WATER",
              "camp-water",
              d("0.00 m³/h"),
              t("nočni pretok 0", "night flow 0", "Nachtdurchfluss 0"),
            ),
            row(
              t("Mobilna hišica MH-01", "Mobile home MH-01", "Mobilheim MH-01"),
              "MH_01",
              "mobile-home",
              d("24.1 °C"),
              t(
                "okno zaprto · klima 0,9 kW",
                "window closed · AC 0.9 kW",
                "Fenster zu · Klima 0,9 kW",
              ),
            ),
            row(
              t(
                "Sanitarije v kampu",
                "Camp sanitary block",
                "Sanitärblock Campingplatz",
              ),
              "CAMP_SAN_WATER",
              "camp-sanitary",
              d("0.42 m³/h"),
              t(
                "168 obiskov · 58 °C",
                "168 visits · 58 °C",
                "168 Besuche · 58 °C",
              ),
            ),
            row(
              t("Elektrika kampa", "Camp electricity", "Strom Campingplatz"),
              "CAMP_FEEDER",
              "camp-feeder",
              "68 kW",
              t("konica danes 96 kW", "peak today 96 kW", "Spitze heute 96 kW"),
            ),
          ],
        },
        {
          title: t("Skupne storitve", "Shared services", "Gemeinsame Services"),
          tag: t("STORITVE", "SERVICES", "SERVICES"),
          rows: [
            row(
              t("Elektrika hotela", "Hotel electricity", "Strom Hotel"),
              "HOTEL_POWER_01",
              "hotel-power",
              d("38.5 kW"),
              t("danes 412 kWh", "412 kWh today", "heute 412 kWh"),
            ),
            row(
              t("Hotelski bazen", "Hotel pool", "Hotelpool"),
              "POOL_01",
              "pool",
              d("26.4 °C"),
              t(
                "pH 7,3 · klor 0,6 mg/l",
                "pH 7.3 · chlorine 0.6 mg/l",
                "pH 7,3 · Chlor 0,6 mg/l",
              ),
            ),
            row(
              t(
                "HACCP · restavracija",
                "HACCP · restaurant",
                "HACCP · Restaurant",
              ),
              "HACCP_01",
              "haccp",
              d("3.6 °C"),
              t(
                "zamrzovalnik −19,2 °C",
                "freezer −19.2 °C",
                "Tiefkühler −19,2 °C",
              ),
            ),
            row(
              t(
                "Sanitarije marine",
                "Marina sanitary block",
                "Sanitärblock Marina",
              ),
              "SANITARY_WATER_01",
              "sanitary-water",
              d("0.84 m³/h"),
              t(
                "214 obiskov · 52 °C",
                "214 visits · 52 °C",
                "214 Besuche · 52 °C",
              ),
            ),
            row(
              t(
                "Prosta parkirna mesta",
                "Free parking spaces",
                "Freie Parkplätze",
              ),
              "PARKING_01",
              "parking",
              `${free} / ${parking.total}`,
              t("58 uvozov danes", "58 in today", "58 Einfahrten heute"),
            ),
            row(
              t(
                "Polnilnici EV",
                "EV chargers",
                "Ladestationen für E-Fahrzeuge",
              ),
              "EV_01",
              "ev",
              d("11.0 kW"),
              t(
                "prosta 1 / 2 · danes 38 kWh",
                "1 / 2 free · 38 kWh today",
                "1 / 2 frei · heute 38 kWh",
              ),
            ),
            row(
              t("Zabojnika za odpadke", "Waste containers", "Abfallbehälter"),
              "WASTE_01",
              "waste",
              pct(64),
              t(
                "odvoz čez 2 dni",
                "collection in 2 days",
                "Abholung in 2 Tagen",
              ),
            ),
            row(
              t("Zalivanje", "Irrigation", "Bewässerung"),
              "IRRIGATION_01",
              "irrigation",
              pct(31),
              t("ventil zaprt", "valve closed", "Ventil zu"),
            ),
          ],
        },
        {
          title: t("Varnost", "Safety", "Sicherheit"),
          tag: "SAFETY",
          in: "overview devices alarms",
          rows: [
            row(
              t("Omarica pomola B1", "Pier B1 cabinet", "Schrank Steg B1"),
              "CABINET_B1",
              "cabinet",
              closed,
              t(
                "31 °C · suho · nagib 0°",
                "31 °C · dry · tilt 0°",
                "31 °C · trocken · Neigung 0°",
              ),
            ),
            row(
              t(
                "Svetilnika ob vhodu",
                "Harbour entrance lights",
                "Hafenfeuer an der Einfahrt",
              ),
              "NAV_LIGHTS",
              "nav-lights",
              t("Deluje", "Working", "In Betrieb"),
              t(
                "rdeča in zelena · 6 W",
                "red and green · 6 W",
                "Rot und Grün · 6 W",
              ),
            ),
            row(
              t("Dim · kuhinja", "Smoke · kitchen", "Rauch · Küche"),
              "SMOKE_01",
              "smoke",
              d("0.02 %/m"),
              t("ni dima", "clear", "kein Rauch"),
            ),
            row(
              t(
                "Dim, CO in plin · MH-02",
                "Smoke, CO and gas · MH-02",
                "Rauch, CO und Gas · MH-02",
              ),
              "MH_02_SAFETY",
              "mh-safety",
              d("0.01 %/m"),
              t(
                "CO 0 ppm · plin 0 %",
                "CO 0 ppm · gas 0%",
                "CO 0 ppm · Gas 0 %",
              ),
            ),
          ],
        },
        {
          title: t(
            "Obračun ob odhodu",
            "Billed at check-out",
            "Abrechnung beim Check-out",
          ),
          tag: "INTEGRATION · PMS",
          in: "overview",
          rows: [
            row(
              t(
                "Jahta Mirta · A-04",
                "Yacht Mirta · A-04",
                "Yacht Mirta · A-04",
              ),
              t("4 noči", "4 nights", "4 Nächte"),
              "bill-1",
              d("61.2 kWh"),
              t(
                "0,84 m³ · poslano v PMS",
                "0.84 m³ · sent to the PMS",
                "0,84 m³ · an das PMS gesendet",
              ),
            ),
            row(
              t(
                "Parcela 07 · Novak",
                "Pitch 07 · Novak",
                "Stellplatz 07 · Novak",
              ),
              t("6 noči", "6 nights", "6 Nächte"),
              "bill-2",
              d("38.9 kWh"),
              t(
                "1,92 m³ · poslano v PMS",
                "1.92 m³ · sent to the PMS",
                "1,92 m³ · an das PMS gesendet",
              ),
            ),
            row(
              t(
                "Mobilna hišica MH-02 · Rossi",
                "Mobile home MH-02 · Rossi",
                "Mobilheim MH-02 · Rossi",
              ),
              t("5 noči", "5 nights", "5 Nächte"),
              "bill-3",
              d("71.5 kWh"),
              t(
                "3,10 m³ · poslano v PMS",
                "3.10 m³ · sent to the PMS",
                "3,10 m³ · an das PMS gesendet",
              ),
            ),
            row(
              t(
                "Jadrnica Bura · B-09",
                "Sailboat Bura · B-09",
                "Segelboot Bura · B-09",
              ),
              t("2 noči", "2 nights", "2 Nächte"),
              "bill-4",
              d("14.0 kWh"),
              t(
                "0,21 m³ · odhod ob 11:00",
                "0.21 m³ · leaves at 11:00",
                "0,21 m³ · Abreise um 11:00",
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
              t("Privez B-07", "Berth B-07", "Liegeplatz B-07"),
              "BERTH_OCC_A",
              "kai-berth",
              t("Resno", "Serious", "Ernst"),
              t(
                "brez rezervacije · 36 h",
                "no booking · 36 h",
                "keine Buchung · 36 h",
              ),
            ),
            row(
              t("Mobilna hišica MH-02", "Mobile home MH-02", "Mobilheim MH-02"),
              "MH_02",
              "kai-mh",
              t("Opozorilo", "Warning", "Warnung"),
              t(
                "okno odprto → klima stop",
                "window open → AC off",
                "Fenster offen → Klima aus",
              ),
            ),
            row(
              t(
                "Parcela 14 · voda",
                "Pitch 14 · water",
                "Stellplatz 14 · Wasser",
              ),
              "PITCH_14_WATER",
              "kai-water",
              t("Opozorilo", "Warning", "Warnung"),
              t("0,2 m³/h ponoči", "0.2 m³/h at night", "0,2 m³/h nachts"),
            ),
            row(
              t("Napoved konice", "Peak forecast", "Spitzenprognose"),
              t("danes", "today", "heute"),
              "kai-peak",
              "232 kW",
              t(
                "predhlajenje ob 17:30",
                "pre-cool at 17:30",
                "Vorkühlung um 17:30",
              ),
            ),
            row(
              t("Burja jutri", "Bora tomorrow", "Bora morgen"),
              "WIND_01",
              "kai-bora",
              "06:00",
              t(
                "−6 hPa · 34 kn → SMS",
                "−6 hPa · 34 kn → SMS",
                "−6 hPa · 34 kn → SMS",
              ),
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
              "40 / 40",
              t("povezanih", "online", "online"),
            ),
            row(
              t("Kakovost povezave", "Link quality", "Verbindungsqualität"),
              "RSSI · SNR",
              "noc-rssi",
              "−78 dBm",
              t(
                "najšibkejša: PIER_04",
                "weakest: PIER_04",
                "schwächste: PIER_04",
              ),
            ),
            row(
              t("Baterije senzorjev", "Sensor batteries", "Sensorbatterien"),
              t("najnižja", "lowest", "niedrigste"),
              "noc-battery",
              pct(54),
              "BUOY_01",
            ),
            row(
              t("Integracije", "Integrations", "Integrationen"),
              t(
                "PMS · obračun · BMS",
                "PMS · billing · BMS",
                "PMS · Abrechnung · GLT",
              ),
              "noc-links",
              "3 / 3",
              t("povezane", "connected", "verbunden"),
            ),
          ],
        },
      ],
    },
  };
}
