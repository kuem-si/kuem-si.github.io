// One showcase twin: a maquette on the left, its Nexavia dashboard on the
// right. Rendered by ShowcaseTwin.astro and driven by the matching config in
// src/nexavia/showcase-room/ (city.js, marina.js, …). Maquette coordinates are
// scene pixels (1536 × 1024), the geometry all maquettes share.

export type Tone =
  "water" | "air" | "mobility" | "gas" | "power" | "structure" | "light";

export interface LightingDevice {
  id: string;
  label: string;
  // Unlit patch [x, y, width, height].
  off: number[];
  shape: string;
  // Larger invisible click target (lamps).
  hit?: string;
  anchor: number[];
}

// A pin on the maquette and the reading card it opens.
export interface Sensor {
  // Reading key: ties the pin, its card and the dashboard row together.
  key: string;
  id: string;
  tone: Tone;
  tag: string;
  label: string;
  // Name used in the event log, e.g. "River level: 1.36 m."
  event: string;
  // Add the reading's note to the logged event.
  eventNote?: boolean;
  at: [number, number];
  side: "above" | "below";
  align?: "start" | "end";
  alert?: number;
  // How often the real device reports ("every 5 min"); absent for devices
  // that report on every change.
  every?: string;
  // What Nexavia does with the readings, e.g. the rule they feed.
  uses?: string;
  // The scene's layer and site the pin belongs to (Scene.layers, sites).
  layer?: string;
  site?: string;
  // A socket the card can switch remotely: the reading key of its state
  // cell and that cell's text when on and off.
  switchable?: { key: string; on: string; off: string };
  card: {
    kind: "sensor" | "meter";
    title: string;
    value: string;
    note?: string;
    // Several readings side by side; the first one is the tracked value.
    grid?: { label: string; key: string; value: string }[];
    // Grid columns, for readings too long to sit three abreast (default 3).
    columns?: 2 | 3;
  };
}

export interface Scene {
  photo: string;
  // Natural size of the photo; the overlays always use scene pixels.
  width: number;
  height: number;
  alt: string;
  lightsDir: string;
  modules: {
    letter: string;
    name: string;
    plan: [number, number];
    label: [number, number];
  }[];
  lighting: LightingDevice[];
  sensors: Sensor[];
  // City only: asphalt covering a figure in the traffic lane.
  lanePatch?: {
    href: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Marina only: the water surface alone, for the moving water, and each pier
  // light's reflection on it [x, y, width, height].
  water?: string;
  glints?: { id: string; box: number[] }[];
  // Pin layers a visitor can pick (one network at a time), and the sites of
  // a model with more than one: the camera framing for each (scene px) and
  // the dashboard filtered to it.
  layers?: { id: string; label: string }[];
  sites?: {
    id: string;
    label: string;
    focus?: { x: number; y: number; zoom: number };
  }[];
  loader: { subject: string; stage: string };
}

export interface ReadingRow {
  label: string;
  id: string;
  key: string;
  value: string;
  note?: string;
}

// A block of reading rows on the dashboard; `site` shows it only with that
// site (or every site) selected.
export interface ReadingBlock {
  title: string;
  rows: ReadingRow[];
  site?: string;
}

export interface Twin {
  id: string;
  tab: { title: string; meta: string };
  intro: { title: string; lead: string };
  panel: { view: string; hint: string; hintPanel: string; step: string };
  scene: Scene;
  dashboard: {
    title: string;
    subtitle: string;
    // `reading` lets scenarios update a tile like any reading (setReading).
    kpis: {
      key: string;
      label: string;
      value: string;
      note: string;
      reading?: string;
      site?: string;
    }[];
    rule: string;
    ruleStatus: string;
    devices: { id: string; name: string; site?: string }[];
    group: string;
    alarms: { id: string; text: string }[];
    meters: ReadingBlock;
    sensors: ReadingBlock;
    // Further blocks of readings, each with a tag beside its title and the
    // sections that show it (data-in; "overview devices" unless given).
    panels?: (ReadingBlock & { tag: string; in?: string })[];
  };
}
