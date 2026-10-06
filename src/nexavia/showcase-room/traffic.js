// Miniature traffic for the showcase room maquette photo.
// Geometry uses the photo's 1536 × 1024 viewBox. Distances, sizes and speeds
// are in "ground units": photo pixels measured on the board at mid-depth.

import { createWakes } from "./wake.js";

const SVG_NS = "http://www.w3.org/2000/svg";

// Camera fitted to the board: the square board narrows toward the back (depth
// scale) and its depth is compressed on screen (foreshortening).
const depthScale = (y) => (861 + 0.733 * (y - 99)) / 1082;
const foreshortening = (y) => 0.57 + 0.00024 * (y - 235);
// Screen pixels per ground unit of height.
const RISE = 1;

// Inner edge of the board frame; nothing is drawn outside it.
const BOARD = "M345 99H1206L1442 767 95 757Z";

// Scenery standing in front of a lane, traced from the photo. Entities are
// clipped by the shapes listed on their route, so they pass behind them.
const OCCLUDERS = {
  westTree:
    "344,352 346,334 356,326 360,318 368,313 376,310 384,314 391,321 398,326 403,334 409,339 410,352",
  westConifer:
    "559,335 562,342 566,350 572,357 575,364 545,364 549,357 553,350 556,342",
  westLamp:
    "640,296 652,296 652,309 647.3,309 647.3,379 644.3,379 644.3,309 640,309",
  islandTree:
    "822,412 822,398 826,392 833,388 843,385.5 852,389 862,395 868,400 868,412",
  islandSignal:
    "882,412 882,398 885.5,395 885.5,378 888.5,378 888.5,393 896,391 905,388.5 915,388 924,390 932,394 940,400 940,412",
  islandShrub: "945,412 945,402 952,397 960,395 970,397 978,402 978,412",
  riverTree:
    "1006,418 1006,395 1008,389 1012,380 1016,375 1025,370 1035,368 1043,367 1052,369 1060,373 1067,380 1070,388 1073,396 1073,418",
  riverConifer:
    "1076,418 1076,396 1080,388 1085,381 1090,382 1095,390 1100,398 1100,418",
  eastTree:
    "1213,428 1213,422 1218,414 1226,409 1238,405 1250,406.5 1260,412 1268,420 1268,428",
  edgeTree: "1293,428 1293,422 1298,412 1306,405 1314,406 1320,412 1320,428",
  cornerTree:
    "745,502 753,507 756,514 762,524 764,532 771,543 777,556 778,572 714,572 715,558 722,548 727,536 727,526 729,514 737,506",
  bridgeTree: "815,520 826,514 833,517 837,519 837,560 800,560 801,545 806,530",
  // South parapet of the bridge with the two lamp posts standing on it.
  parapet:
    "837,517 848,517 848,523 870.5,526.6 870.5,458 868,458 868,452 878,452 878,458 875,458 875,527.3 1000,546 1150,570 1200,582.5 1203,583 1203,532 1198,532 1198,518 1212,518 1212,532 1207.5,532 1207.5,584 1222,587 1222,640 837,640",
  // Street lamps standing at the kerb in front of the sidewalks.
  gardenLamp: "513,276 522,276 522,288 519,288 519,322 516,322 516,288 513,288",
  cornerLamp:
    "698,400 707,400 707,411 703.5,411 703.5,464 700.8,464 700.8,411 698,411",
  plazaLamp:
    "887,315 897,315 897,327 893.5,327 893.5,354 890.5,354 890.5,327 887,327",
  fountainLamp:
    "1013,313 1022,313 1022,327 1019,327 1019,363 1016,363 1016,327 1013,327",
  eastLamp:
    "1256,341 1264,341 1264,353 1261.5,353 1261.5,380 1258.5,380 1258.5,353 1256,353",
};

// Lane centres as [x, y, cyclist offset]. The offset (ground units) keeps
// cyclists near the right-hand kerb. Every route starts and ends off the board.
const ROUTES = {
  westbound: {
    occluders: [
      "riverTree",
      "riverConifer",
      "westConifer",
      "westLamp",
      "westTree",
    ],
    points: [
      [1440, 401, 7],
      [1389, 398, 7],
      [1330, 395.5, 7],
      [1250, 391.5, 7],
      [1200, 389, 7],
      [1100, 385, 7],
      [1000, 376.5, 7],
      [900, 372, 7],
      [860, 368, 6],
      [820, 357, 5],
      [780, 350, 5],
      [740, 346.5, 6],
      [700, 345, 7],
      [650, 341.5, 7],
      [600, 337.5, 7],
      [500, 330.5, 7],
      [400, 323, 7],
      [300, 315.5, 7],
      [262, 312.5, 7],
      [200, 308, 7],
    ],
  },
  residential: {
    occluders: ["westTree", "westConifer", "westLamp"],
    points: [
      [190, 322, 7],
      [262, 327.5, 7],
      [300, 330.5, 7],
      [400, 338, 7],
      [500, 345.5, 7],
      [600, 352.5, 7],
      [650, 356.5, 7],
      [700, 360, 6],
      [725, 361, 4],
      [745, 357, 3],
      [760, 346, 4],
      [767, 330, 5],
      [769, 305, 5.5],
      [769, 250, 5.5],
      [769, 160, 5.5],
      [769, 99, 5.5],
      [769, 60, 5.5],
    ],
  },
  central: {
    occluders: [
      "islandTree",
      "islandSignal",
      "islandShrub",
      "riverTree",
      "riverConifer",
      "eastTree",
      "edgeTree",
    ],
    points: [
      [753, 60, 5.5],
      [753, 99, 5.5],
      [753, 200, 5.5],
      [753, 280, 5.5],
      [754, 315, 5],
      [758, 342, 4],
      [768, 364, 4],
      [786, 380, 5],
      [812, 388, 6],
      [850, 390, 7],
      [900, 388.5, 7],
      [1000, 394.5, 7],
      [1100, 403, 7],
      [1200, 407.5, 7],
      [1250, 409.5, 7],
      [1300, 412, 7],
      [1389, 416, 7],
      [1440, 418, 7],
    ],
  },
  bridgeEastbound: {
    occluders: ["cornerTree", "bridgeTree", "parapet"],
    points: [
      [618, 800, 9],
      [640, 750, 9],
      [662.5, 700, 9],
      [684, 650, 9],
      [708, 600, 8],
      [718, 578, 7],
      [727, 558, 6],
      [738, 540, 5],
      [752, 526, 4.5],
      [771, 516, 4.5],
      [795, 512, 4.5],
      [820, 511.5, 4.5],
      [850, 515, 4.5],
      [900, 522.5, 4.5],
      [1000, 538.5, 4.5],
      [1100, 554.5, 4.5],
      [1200, 575.5, 4.5],
      [1250, 590, 4.5],
      [1300, 604.5, 4.5],
      [1350, 617, 4.5],
      [1389, 627, 4.5],
      [1440, 640, 4.5],
    ],
  },
  bridgeWestbound: {
    occluders: ["cornerTree", "bridgeTree", "parapet"],
    points: [
      [1440, 627, 4.5],
      [1389, 614.5, 4.5],
      [1350, 604.5, 4.5],
      [1300, 592, 4.5],
      [1250, 577.5, 4.5],
      [1200, 563, 4.5],
      [1100, 542, 4.5],
      [1000, 526, 4.5],
      [900, 509.5, 4.5],
      [850, 502, 4.5],
      [820, 498, 4.5],
      [790, 496, 4.5],
      [763, 499, 5],
      [742, 508, 6],
      [725, 522, 7],
      [710, 540, 8],
      [697, 562, 9],
      [684, 585, 9],
      [672, 605, 9],
      [660, 625, 9],
      [648, 650, 9],
      [626.5, 700, 9],
      [604, 750, 9],
      [582, 800, 9],
    ],
  },
};

// Sidewalk and plaza paths. Each is walked in both directions, walkers keeping
// to the right (offset in ground units). "fade" marks ends at a building door,
// where walkers step in or out instead of leaving the board.
const WALKS = {
  bridgeWalk: {
    occluders: ["cornerLamp"],
    points: [
      [1400, 601],
      [1350, 589],
      [1300, 577],
      [1250, 563],
      [1200, 548],
      [1150, 535],
      [1100, 523],
      [1050, 513],
      [1000, 505],
      [950, 498],
      [900, 493],
      [873, 491],
      [850, 486],
      [820, 474],
      [805, 458],
      [798, 440],
      [794, 431],
      [775, 430],
      [750, 430],
      [725, 429],
      [712, 438],
      [697, 452],
      [690, 472],
      [684, 495],
      [674, 520],
      [662, 545],
      [646, 575],
      [638, 600],
      [628, 632],
      [619, 655],
      [609, 678],
      [600, 700],
      [592, 722],
      [585, 742],
      [578, 770],
    ],
  },
  // Garden sidewalk, over the west road zebra and down past the factory.
  gardenCross: {
    occluders: ["gardenLamp", "westLamp", "cornerLamp"],
    points: [
      [250, 307],
      [300, 309],
      [400, 312.5],
      [500, 316],
      [600, 320.5],
      [640, 324],
      [660, 328],
      [665, 337],
      [667, 352],
      [668, 368],
      [672, 382],
      [684, 398],
      [698, 414],
      [706, 428],
      [700, 446],
      [692, 466],
      [686, 490],
      [674, 520],
      [662, 545],
      [646, 575],
      [638, 600],
      [628, 632],
      [619, 655],
      [609, 678],
      [600, 700],
      [592, 722],
      [585, 742],
      [578, 770],
    ],
  },
  westWalk: {
    occluders: ["gardenLamp", "westLamp"],
    fade: [false, true],
    points: [
      [250, 307],
      [300, 309],
      [400, 312.5],
      [500, 316],
      [600, 320.5],
      [650, 325],
      [700, 330],
      [725, 329],
      [738, 326],
      [760, 326],
      [790, 326],
      [815, 327],
      [838, 329],
      [855, 326],
      [857, 310],
      [863, 293],
      [880, 277],
      [905, 265],
      [945, 254],
      [990, 242],
      [1040, 234],
      [1075, 226],
      [1085, 221],
    ],
  },
  plazaFront: {
    occluders: ["plazaLamp", "fountainLamp", "eastLamp"],
    points: [
      [1310, 380],
      [1250, 375],
      [1200, 371],
      [1150, 367],
      [1100, 363],
      [1050, 359],
      [1000, 356],
      [950, 353],
      [900, 350],
      [860, 347],
      [840, 340],
      [830, 320],
      [826, 290],
      [824, 250],
      [823, 200],
      [823, 150],
      [823, 99],
      [823, 70],
    ],
  },
  plazaStroll: {
    occluders: ["eastLamp"],
    fade: [true, false],
    points: [
      [1142, 222],
      [1128, 236],
      [1115, 250],
      [1100, 270],
      [1092, 295],
      [1096, 320],
      [1100, 338],
      [1106, 356],
      [1150, 367],
      [1200, 371],
      [1250, 375],
      [1310, 380],
    ],
  },
};
const WALK_OFFSET = 2.5;

// People with something to do. A path is a short stroll walked back and
// forth; at each end they stop in a pose, turned to "face" (ground heading in
// radians: 0 east, π/2 toward the camera, -π/2 away). "carry" says whether
// they pick up (true) or put down (false) a box when leaving that stop.
// People indoors are only seen through the window glass, passing behind the
// window frames.
const FOUNTAIN_JET = [1020, 272];
// Lawn in front of the first house, where two children play catch.
const LAWN = [
  [362, 268],
  [440, 264],
  [447, 284],
  [368, 291],
];
const CHILD_SIZE = 0.66;
const ACTORS = [
  {
    // INDUSTRIJA: at the workbenches behind the large front window.
    window: { rects: [[369, 478, 411, 514]], frames: [380, 391, 403] },
    path: [
      [375, 510],
      [390, 511.5],
      [405, 513],
    ],
    stops: [
      { pose: "work", face: -1.9, time: [3, 7] },
      { pose: "work", face: -1.25, time: [3, 7] },
    ],
  },
  {
    // Yard: unloading the truck, carrying boxes over to the pallets.
    path: [
      [528, 588],
      [524, 572],
      [516, 555],
      [512, 542],
    ],
    stops: [
      { pose: "lift", face: 0.3, time: [1.8, 2.6], carry: false },
      { pose: "load", face: -2, time: [1.5, 2.2], carry: true },
    ],
  },
  {
    // JAVNI PROSTOR, lower floor: on the phone, then looking out.
    window: {
      rects: [[1015, 191, 1116, 223]],
      frames: [1034, 1050, 1065, 1080, 1096],
    },
    path: [
      [1022, 219],
      [1060, 219.5],
      [1105, 220],
    ],
    stops: [
      { pose: "phone", face: 1.57, time: [4, 8] },
      { pose: null, face: 1.4, time: [2, 4] },
    ],
  },
  {
    // JAVNI PROSTOR, upper floor: at a desk, then talking to colleagues.
    window: {
      rects: [[1016, 157, 1119, 181]],
      frames: [1036, 1052.5, 1067.5, 1082.5, 1100],
    },
    path: [
      [1028, 182],
      [1062, 182],
      [1096, 182],
    ],
    stops: [
      { pose: "work", face: -1.57, time: [5, 9] },
      { pose: "talk", face: 1.2, time: [3, 6] },
    ],
  },
  {
    // Fountain: two visitors delighted by it, photographing, pointing,
    // waving and turning to each other.
    at: [984, 317],
    partner: 5,
    script: [
      ["photo", 3.5],
      ["point", 2.2],
      ["wave", 2.4],
      ["talk", 1.8],
    ],
  },
  {
    at: [997, 322.5],
    partner: 4,
    script: [
      ["wave", 2.6],
      ["clap", 2],
      ["point", 2.4],
      ["talk", 1.8],
    ],
  },
  // STANOVANJSKI: two children playing catch on the lawn.
  { kid: true, at: [380, 280], partner: 7 },
  { kid: true, at: [425, 275], partner: 6 },
];

// Lanes closer than this (ground units, centre to centre) are in conflict.
// Walkers only conflict with traffic where a path actually crosses a road.
const CONFLICT_DISTANCE = 15;
const WALK_CONFLICT_DISTANCE = 9;
// CYCLE_COUNT_01 watches the north road just above the junction crosswalk.
const COUNTER = { y: 300, minX: 740, maxX: 790 };

// Traffic mix. `side` and `roof` tones default to shades of the paint.
// Real traffic is mostly white, silver, grey and black, with the odd colour.
const CAR_VARIANTS = [
  { body: "sedan", paint: "#d9d4c9", side: "#a9a499", roof: "#e3dfd5" },
  { body: "sedan", paint: "#35465e", side: "#253041", roof: "#3d5069" },
  { body: "hatch", paint: "#8f4038", side: "#672e29", roof: "#98463e" },
  { body: "hatch", paint: "#9a9fa3" },
  { body: "estate", paint: "#8d9295", side: "#676c70", roof: "#979c9f" },
  { body: "estate", paint: "#2b2f33" },
  { body: "suv", paint: "#2a2d30", side: "#191b1d", roof: "#33373a" },
  { body: "suv", paint: "#6d7470", side: "#4d5350", roof: "#777e7a" },
  { body: "van", paint: "#c3c3bd", side: "#95958f", roof: "#cdcdc7" },
  { body: "sports", paint: "#b3261e" },
  {
    body: "bus",
    paint: "#d6d5ce",
    side: "#b3b2ab",
    roof: "#dcdbd4",
    stripe: "#1f6f80",
  },
  { body: "truck", paint: "#2f5a78", box: "#d3d1ca" },
];
const JERSEYS = [
  "#a9463c",
  "#2f6680",
  "#c3a043",
  "#4f7a57",
  "#d9d5cb",
  "#3a4046",
];
const FRAMES = ["#2a2f33", "#7a3128", "#5d6a70", "#2f4a5e"];
const HELMETS = ["#e4e0d6", "#2b3034", "#b9bcb8"];
// Muted, everyday clothing so no two walkers look alike.
const OUTFIT = {
  tops: [
    "#2e3b55",
    "#3f4f3a",
    "#5a6340",
    "#7a2e32",
    "#8c9094",
    "#e3ded3",
    "#23262a",
    "#4b6a8c",
    "#c49a3a",
    "#2f6b6b",
    "#a55f45",
    "#6b5a7a",
  ],
  bottoms: ["#344860", "#23262a", "#4a4d52", "#c8b79a", "#7c7355", "#5b6f86"],
  skirts: ["#2a2d33", "#7a2e32", "#3f5a6e", "#8a7a5a"],
  shoes: ["#1d1f22", "#c9c4ba", "#5a3d2b", "#2d2f33"],
  skins: ["#f1d2b6", "#e2b48f", "#c68e62", "#9c6a44", "#6e4a31", "#f5dcc6"],
  hairs: ["#1f1a17", "#3b2a1e", "#6b4a2e", "#a0663a", "#c9a66b", "#9a9894"],
};

const KINDS = {
  car: {
    accel: 14,
    brake: 20,
    minGap: 7,
    headway: 1.1,
    cruise: [38, 46],
    lateral: 22,
    bendBrake: 12,
    respawn: [10, 28],
  },
  pedestrian: {
    accel: 3,
    brake: 5,
    minGap: 2.5,
    headway: 0.8,
    cruise: [7.5, 10.5],
    lateral: 8,
    bendBrake: 3,
    respawn: [4, 18],
  },
  cyclist: {
    accel: 6,
    brake: 10,
    minGap: 4,
    headway: 0.9,
    cruise: [20, 25],
    lateral: 14,
    bendBrake: 6,
    respawn: [14, 34],
  },
  boat: {
    accel: 2.2,
    brake: 3.5,
    minGap: 14,
    headway: 2.5,
    cruise: [13, 19],
    lateral: 5,
    bendBrake: 1.6,
    respawn: [4, 16],
  },
};
// Which lanes each kind uses.
const MODE = {
  car: "road",
  cyclist: "road",
  pedestrian: "walk",
  boat: "water",
};
const LANE_KINDS = {
  road: ["car", "cyclist"],
  walk: ["pedestrian"],
  water: ["boat"],
};
const CAR_COUNT = 5;
const CYCLIST_COUNT = 3;
const CYCLIST_SIZE = 1.15;
const PEDESTRIAN_COUNT = 8;
const PEDESTRIAN_SIZE = 1.1;
// Ground distance covered by one step.
const STEP = 4.6;

const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const f2 = (value) => Math.round(value * 100) / 100;
const f3 = (value) => Math.round(value * 1000) / 1000;
// Lets the browser breathe between chunks of set-up work.
const idle = () =>
  new Promise((resolve) =>
    (window.requestIdleCallback ?? setTimeout)(() => resolve(), {
      timeout: 100,
    }),
  );
const angleDelta = (from, to) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

const BOARD_CORNERS = [
  [345, 99],
  [1206, 99],
  [1442, 767],
  [95, 757],
];
function onBoard(x, y) {
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = BOARD_CORNERS[i];
    const [x1, y1] = BOARD_CORNERS[(i + 1) % 4];
    if ((x1 - x0) * (y - y0) - (y1 - y0) * (x - x0) < 0) return false;
  }
  return true;
}

// Every stretch where two lanes cross or merge becomes a shared cell; each
// lane records where (in ground distance) it enters and leaves the cell.
async function findConflicts(lanes) {
  // Each lane is bucketed once on a coarse grid (and boxed) so only nearby
  // samples of two lanes are ever compared.
  const key = (x, y) => Math.floor(x / 40) * 100 + Math.floor(y / 40);
  for (const lane of lanes) {
    lane.cells = [];
    lane.grid = new Map();
    lane.box = [Infinity, Infinity, -Infinity, -Infinity];
    for (let j = 0; j <= lane.length; j += 3) {
      const [x, y] = [lane.x[j], lane.y[j]];
      const cell = key(x, y);
      if (!lane.grid.has(cell)) lane.grid.set(cell, []);
      lane.grid.get(cell).push(j);
      lane.box = [
        Math.min(lane.box[0], x),
        Math.min(lane.box[1], y),
        Math.max(lane.box[2], x),
        Math.max(lane.box[3], y),
      ];
    }
  }
  for (let p = 0; p < lanes.length; p++) {
    await idle();
    for (let q = p + 1; q < lanes.length; q++) {
      const [first, second] = [lanes[p], lanes[q]];
      // Walkers pass each other on sidewalks; they never reserve against
      // each other.
      if (first.walk && second.walk) continue;
      const limit =
        first.walk || second.walk ? WALK_CONFLICT_DISTANCE : CONFLICT_DISTANCE;
      const [a, b] = [first.box, second.box];
      if (
        a[0] > b[2] + 40 ||
        b[0] > a[2] + 40 ||
        a[1] > b[3] + 40 ||
        b[1] > a[3] + 40
      )
        continue;
      const hits = [];
      for (let i = 0; i <= first.length; i += 3) {
        const x = first.x[i];
        const y = first.y[i];
        if (x < b[0] - 40 || x > b[2] + 40 || y < b[1] - 40 || y > b[3] + 40)
          continue;
        // Off the board nothing is visible, so nothing can collide.
        if (!onBoard(x, y)) continue;
        const home = key(x, y);
        // Screen distance that can still be within reach at this depth.
        const reach = limit * depthScale(y) * 1.2;
        // Every sample pair within reach counts, so each lane gets the full
        // stretch where the other one is close.
        for (let g = 0; g < 9; g++)
          for (const j of second.grid.get(
            home + (Math.floor(g / 3) - 1) * 100 + (g % 3) - 1,
          ) ?? []) {
            const dx = x - second.x[j];
            const dy = y - second.y[j];
            if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
            const my = (y + second.y[j]) / 2;
            const s = depthScale(my);
            const gap = Math.hypot(dx / s, dy / (s * foreshortening(my)));
            if (gap < limit) hits.push([i, j]);
          }
      }
      let cluster = null;
      const close = () => {
        if (!cluster) return;
        const cell = { holders: new Set() };
        // Pad both spans for the width of whoever is crossing.
        first.cells.push({ cell, in: cluster[0] - 6, out: cluster[1] + 6 });
        second.cells.push({ cell, in: cluster[2] - 6, out: cluster[3] + 6 });
        cluster = null;
      };
      for (const [i, j] of hits) {
        if (cluster && i - cluster[1] > 12) close();
        if (!cluster) cluster = [i, i, j, j];
        cluster[1] = i;
        cluster[2] = Math.min(cluster[2], j);
        cluster[3] = Math.max(cluster[3], j);
      }
      close();
    }
  }
  for (const lane of lanes) lane.cells.sort((a, b) => a.in - b.in);
}

// Centripetal Catmull-Rom through the waypoints, resampled every ground unit.
function buildRoute(name, route, { prefix = "city", counter = null } = {}) {
  const mode = route.mode ?? (route.walk ? "walk" : "road");
  const points = route.points.map(([x, y, offset]) => [
    x,
    y,
    offset ?? (mode === "walk" ? WALK_OFFSET : 0),
  ]);
  const dense = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const p0 = points[i - 1] ?? [2 * p1[0] - p2[0], 2 * p1[1] - p2[1], p1[2]];
    const p3 = points[i + 2] ?? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1], p2[2]];
    const gap = (a, b) =>
      Math.max(1e-4, Math.hypot(a[0] - b[0], a[1] - b[1]) ** 0.5);
    const d0 = gap(p0, p1);
    const d1 = gap(p1, p2);
    const d2 = gap(p2, p3);
    const control = [0, 1].map((k) => {
      const t1 =
        (p1[k] - p0[k]) / d0 -
        (p2[k] - p0[k]) / (d0 + d1) +
        (p2[k] - p1[k]) / d1;
      const t2 =
        (p2[k] - p1[k]) / d1 -
        (p3[k] - p1[k]) / (d1 + d2) +
        (p3[k] - p2[k]) / d2;
      return [p1[k] + (t1 * d1) / 3, p2[k] - (t2 * d1) / 3];
    });
    const steps = Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]));
    for (let s = i === 0 ? 0 : 1; s <= steps; s++) {
      const t = s / steps;
      const u = 1 - t;
      const bezier = (k) =>
        u * u * u * p1[k] +
        3 * u * u * t * control[k][0] +
        3 * u * t * t * control[k][1] +
        t * t * t * p2[k];
      dense.push([bezier(0), bezier(1), p1[2] + (p2[2] - p1[2]) * t]);
    }
  }
  // Screen steps convert to ground distance through the local camera model.
  const along = [0];
  for (let i = 1; i < dense.length; i++) {
    const [x0, y0] = dense[i - 1];
    const [x1, y1] = dense[i];
    const my = (y0 + y1) / 2;
    along.push(
      along[i - 1] +
        Math.hypot(x1 - x0, (y1 - y0) / foreshortening(my)) / depthScale(my),
    );
  }
  const count = Math.floor(along[along.length - 1]);
  const lane = {
    name,
    length: count - 1,
    x: new Float32Array(count),
    y: new Float32Array(count),
    offset: new Float32Array(count),
    heading: new Float32Array(count),
    limit: Object.fromEntries(
      LANE_KINDS[mode].map((kind) => [kind, new Float32Array(count)]),
    ),
    clipId: `${prefix}-traffic-clip-${name}`,
    occluders: route.occluders,
    mode,
    walk: mode === "walk",
    fade: route.fade ?? [false, false],
  };
  for (let i = 0, j = 0; i < count; i++) {
    while (along[j + 1] < i) j++;
    const t = (i - along[j]) / (along[j + 1] - along[j] || 1);
    for (const [k, key] of [
      [0, "x"],
      [1, "y"],
      [2, "offset"],
    ])
      lane[key][i] = dense[j][k] + (dense[j + 1][k] - dense[j][k]) * t;
  }
  // Ground heading over a short chord ignores sub-pixel waypoint noise.
  for (let i = 0; i < count; i++) {
    const a = Math.max(0, i - 4);
    const b = Math.min(count - 1, i + 4);
    lane.heading[i] = Math.atan2(
      (lane.y[b] - lane.y[a]) / foreshortening(lane.y[i]),
      lane.x[b] - lane.x[a],
    );
  }
  // Comfortable cornering speed, eased in ahead of each bend.
  for (const [kind, limit] of Object.entries(lane.limit)) {
    const { lateral, bendBrake } = KINDS[kind];
    for (let i = 0; i < count; i++) {
      const a = Math.max(0, i - 5);
      const b = Math.min(count - 1, i + 5);
      const curvature =
        Math.abs(angleDelta(lane.heading[a], lane.heading[b])) /
        Math.max(1, b - a);
      limit[i] = curvature > 1e-4 ? Math.sqrt(lateral / curvature) : 999;
    }
    for (let i = count - 2; i >= 0; i--)
      limit[i] = Math.min(
        limit[i],
        Math.sqrt(limit[i + 1] ** 2 + 2 * bendBrake),
      );
  }
  // Timed stops (e.g. a landing): the lane position nearest each waypoint.
  // A walker's stop may also name a pose, a heading to turn to ("face") and
  // whether they leave it carrying a box ("carry").
  if (route.stops)
    lane.stops = route.stops.map(({ point, ...stop }) => {
      const [px, py] = route.points[point];
      let at = 0;
      let best = Infinity;
      for (let i = 0; i < count; i++) {
        const d = (lane.x[i] - px) ** 2 + (lane.y[i] - py) ** 2;
        if (d < best) [best, at] = [d, i];
      }
      return { ...stop, at };
    });
  for (let i = 0; i < count && counter; i++) {
    const x = lane.x[i];
    const y = lane.y[i];
    if (
      lane.counter === undefined &&
      i > 0 &&
      x >= counter.minX &&
      x <= counter.maxX &&
      (lane.y[i - 1] - counter.y) * (y - counter.y) <= 0
    )
      lane.counter = i;
  }
  return lane;
}

function svg(tag, attributes, parent) {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attributes))
    element.setAttribute(key, String(value));
  parent?.appendChild(element);
  return element;
}

// Cars are stacked horizontal slices projected through the camera model, so
// each reads as a small solid: the lower slices show along the edge facing
// the camera as the vehicle's sides. A car element is rebuilt for its body
// type each time it enters the board.
function createCar(layer) {
  return {
    element: svg("g", { class: "city-traffic-car" }, layer),
    layers: [],
    tails: [],
  };
}

function styleCar(car, variant) {
  car.element.replaceChildren();
  car.element.dataset.body = variant.body;
  car.layers = [];
  car.tails = [];
  const tones = {
    side: mix(variant.paint, "#0b1014", 0.3),
    roof: mix(variant.paint, "#ffffff", 0.05),
    ...variant,
  };
  return BODY_BUILDERS[variant.body](car, tones);
}

// --- Detailed bodies -------------------------------------------------------
// Each body is a list of height slices built in paint order. Units are ground
// units (about 6.9 per metre); x runs along the vehicle (front +x).
let carSerial = 0;
const lerp = (a, b, t) => a + (b - a) * t;

// Blends two #rrggbb colours.
function mix(from, to, amount) {
  const channel = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(lerp(channel(from, i), channel(to, i), amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

// Plan outline seen from above: straight sides, ends that round off and
// narrow by `taper`.
function outline(
  length,
  width,
  { nose = 0.25, tail = 0.22, taper = 0.14, x = 0 } = {},
) {
  const hl = length / 2;
  const hw = width / 2;
  const end = hw * (1 - taper);
  const n = length * nose;
  const t = length * tail;
  const p = (u, v) => `${f2(x + u)} ${f2(v)}`;
  return (
    `M${p(-hl + t, -hw)}L${p(hl - n, -hw)}` +
    `C${p(hl - n * 0.35, -hw)} ${p(hl, -end)} ${p(hl, 0)}` +
    `C${p(hl, end)} ${p(hl - n * 0.35, hw)} ${p(hl - n, hw)}` +
    `L${p(-hl + t, hw)}` +
    `C${p(-hl + t * 0.35, hw)} ${p(-hl, end)} ${p(-hl, 0)}` +
    `C${p(-hl, -end)} ${p(-hl + t * 0.35, -hw)} ${p(-hl + t, -hw)}Z`
  );
}

function bodyKit(car) {
  const id = `city-car-${++carSerial}`;
  const defs = svg("defs", {}, car.element);
  let clips = 0;
  const layer = (height, node) => {
    car.layers.push({ node, height });
    return node;
  };
  return {
    id,
    // A filled slice at `height`.
    slab: (height, d, fill, extra = {}) =>
      layer(height, svg("path", { d, fill, ...extra }, car.element)),
    group: (height, extra = {}) => layer(height, svg("g", extra, car.element)),
    // A clip path of the given outline, for slices that vary along the body.
    clip(d) {
      const clipId = `${id}-clip-${++clips}`;
      svg("path", { d }, svg("clipPath", { id: clipId }, defs));
      return clipId;
    },
    // Paint with a highlight down the middle, as on a curved panel.
    sheen(color, name) {
      const gradient = svg(
        "linearGradient",
        { id: `${id}-${name}`, x1: 0, y1: 0, x2: 0, y2: 1 },
        defs,
      );
      [
        [0, mix(color, "#0b1014", 0.3)],
        [0.26, color],
        [0.5, mix(color, "#ffffff", 0.2)],
        [0.74, color],
        [1, mix(color, "#0b1014", 0.3)],
      ].forEach(([offset, stop]) =>
        svg("stop", { offset, "stop-color": stop }, gradient),
      );
      return `url(#${id}-${name})`;
    },
    // Glass darkening towards the front, catching the sky towards the rear.
    glass(name, light) {
      const gradient = svg(
        "linearGradient",
        { id: `${id}-${name}`, x1: 1, y1: 0, x2: 0, y2: 0 },
        defs,
      );
      svg("stop", { offset: 0, "stop-color": "#141d23" }, gradient);
      svg("stop", { offset: 1, "stop-color": light }, gradient);
      return `url(#${id}-${name})`;
    },
    defs,
  };
}

function shadowSlices(kit, length, width, shape) {
  const shadow = kit.group(0);
  svg(
    "path",
    {
      d: outline(length + 3, width + 3, shape),
      fill: "#0b1014",
      "fill-opacity": 0.13,
    },
    shadow,
  );
  svg(
    "path",
    {
      d: outline(length + 0.6, width + 0.6, shape),
      fill: "#0b1014",
      "fill-opacity": 0.24,
    },
    shadow,
  );
}

// Tyres as dark slices at each wheel, flush with the body sides.
function wheelSlices(kit, height, axles, width, tyre, radius) {
  const group = kit.group(height, { fill: "#131517" });
  for (const x of axles)
    for (const side of [-1, 1])
      svg(
        "rect",
        {
          x: f2(x - radius),
          y: f2(side > 0 ? width / 2 - tyre : -width / 2),
          width: f2(radius * 2),
          height: f2(tyre),
          rx: f2(radius * 0.45),
        },
        group,
      );
}

function lampSlices(
  kit,
  car,
  { length, width, headHeight, tailHeight, inset = 3.2, size = 2.1 },
) {
  const heads = kit.group(headHeight, { fill: "#f3e7cd" });
  const tails = kit.group(tailHeight, { fill: "#b5332b", "fill-opacity": 0.6 });
  for (const side of [-1, 1]) {
    const y = side > 0 ? width / 2 - inset : -width / 2 + inset - size;
    svg(
      "rect",
      {
        x: f2(length / 2 - 1.7),
        y: f2(y),
        width: 1.5,
        height: f2(size),
        rx: 0.6,
      },
      heads,
    );
    car.tails.push(
      svg(
        "rect",
        {
          x: f2(-length / 2 + 0.2),
          y: f2(y),
          width: 1.4,
          height: f2(size),
          rx: 0.6,
        },
        tails,
      ),
    );
  }
}

// Passenger car proportions: length, width, plan shape, axle positions,
// wheel radius, sill/belt/roof heights, and where the glasshouse starts and
// ends at the belt and at the roof (rake of windscreen and rear window).
const PASSENGER_CARS = {
  sedan: {
    L: 33,
    W: 13.5,
    shape: { nose: 0.15, tail: 0.12, taper: 0.13 },
    axles: [-9.8, 9.8],
    wheel: 2.3,
    sill: 2,
    belt: 6,
    roof: 10.2,
    cabin: { belt: [-10.2, 6.2], roof: [-8.2, 2.3] },
  },
  hatch: {
    L: 28.5,
    W: 12.8,
    shape: { nose: 0.16, tail: 0.08, taper: 0.12 },
    axles: [-8.8, 8.6],
    wheel: 2.2,
    sill: 2,
    belt: 6,
    roof: 10.4,
    cabin: { belt: [-12.9, 4.4], roof: [-12.3, 1.2] },
  },
  estate: {
    L: 33,
    W: 13.4,
    shape: { nose: 0.15, tail: 0.08, taper: 0.12 },
    axles: [-9.6, 9.9],
    wheel: 2.3,
    sill: 2,
    belt: 6,
    roof: 10.4,
    cabin: { belt: [-15.6, 6.2], roof: [-15.2, 2.2] },
    rails: true,
  },
  suv: {
    L: 32,
    W: 14,
    shape: { nose: 0.14, tail: 0.08, taper: 0.1 },
    axles: [-9.8, 9.6],
    wheel: 2.6,
    sill: 2.6,
    belt: 7.2,
    roof: 12.2,
    cabin: { belt: [-14.6, 5.4], roof: [-14.2, 1.9] },
    rails: true,
  },
  sports: {
    L: 31,
    W: 13.6,
    shape: { nose: 0.2, tail: 0.14, taper: 0.16 },
    axles: [-8.8, 9.5],
    wheel: 2.4,
    sill: 1.6,
    belt: 4.4,
    roof: 7.6,
    cabin: { belt: [-11.2, 3.8], roof: [-7.4, -0.6] },
    glassInset: [1.8, 3.4],
    spoiler: true,
  },
};

function passengerBody(car, variant) {
  const spec = PASSENGER_CARS[variant.body];
  const { L, W, shape, axles, wheel, sill, belt, roof } = spec;
  const kit = bodyKit(car);
  const body = (inset) => outline(L - inset, W - inset, shape);
  shadowSlices(kit, L, W, shape);
  wheelSlices(kit, 0.6, axles, W, 2.1, wheel);
  wheelSlices(kit, 1.5, axles, W, 2.1, wheel);
  // Sill tucked under, then the sides up to a lighter shoulder line.
  kit.slab(sill, body(1.6), mix(variant.side, "#0b1014", 0.35));
  wheelSlices(kit, sill + 0.4, axles, W, 2, wheel - 0.1);
  for (let height = sill + 1; height < belt - 1.4; height += 1)
    kit.slab(height, body(height === sill + 1 ? 0.6 : 0.1), variant.side);
  kit.slab(belt - 1, body(0), mix(variant.side, variant.paint, 0.55));
  lampSlices(kit, car, {
    length: L,
    width: W,
    headHeight: belt - 1.4,
    tailHeight: belt - 0.9,
  });
  // Bonnet and boot, with a highlight down the middle.
  kit.slab(belt, body(0.3), kit.sheen(variant.paint, "paint"), {
    stroke: "#0b1014",
    "stroke-opacity": 0.22,
    "stroke-width": 0.3,
  });
  if (spec.spoiler)
    kit.slab(
      belt + 0.8,
      `M${f2(-L / 2 + 0.6)} ${f2(-W / 2 + 1.2)}h1.8v${f2(W - 2.4)}h-1.8z`,
      "#1d2124",
    );
  // Glasshouse: raked windscreen and rear window, narrowing towards the roof.
  const [insetLow, insetHigh] = spec.glassInset ?? [1.4, 2.8];
  const cabin = (t, extra = 0) => {
    const front = lerp(spec.cabin.belt[1], spec.cabin.roof[1], t);
    const rear = lerp(spec.cabin.belt[0], spec.cabin.roof[0], t);
    return outline(front - rear, lerp(W - insetLow, W - insetHigh, t) + extra, {
      nose: 0.16,
      tail: 0.14,
      taper: 0.08,
      x: (front + rear) / 2,
    });
  };
  const step = (roof - belt - 1.3) / 3;
  kit.slab(belt + 0.9, cabin(0), kit.glass("glass-low", "#3a4b55"));
  kit.slab(belt + 0.9 + step, cabin(0.34), kit.glass("glass-mid", "#4a5d68"));
  kit.slab(
    belt + 0.9 + step * 2,
    cabin(0.68),
    kit.glass("glass-high", "#5b6e78"),
  );
  kit.slab(roof, cabin(1), kit.sheen(variant.roof, "roof"), {
    stroke: "#0b1014",
    "stroke-opacity": 0.2,
    "stroke-width": 0.3,
  });
  if (spec.rails) {
    const rails = kit.group(roof + 0.5, { fill: "#2a2f33" });
    const [rear, front] = spec.cabin.roof;
    const half = (W - insetHigh) / 2 - 0.7;
    for (const y of [-half - 0.3, half - 0.3])
      svg(
        "rect",
        {
          x: f2(rear + 1),
          y: f2(y),
          width: f2(front - rear - 2),
          height: 0.6,
          rx: 0.3,
        },
        rails,
      );
  }
  return L / 2;
}

// Slices whose footprint is the body outline but whose fill changes along
// the vehicle (e.g. a windscreen at the front), clipped to the outline.
function bandSlice(kit, height, d, base, caps) {
  const group = kit.group(height, { "clip-path": `url(#${kit.clip(d)})` });
  svg("path", { d, fill: base }, group);
  for (const [x0, x1, fill] of caps)
    svg(
      "rect",
      { x: f2(x0), y: -20, width: f2(x1 - x0), height: 40, fill },
      group,
    );
}

// Panel van: bonnet and a raked windscreen up front, tall painted body
// behind, with cab side windows.
function vanBody(car, variant) {
  const kit = bodyKit(car);
  const L = 36;
  const W = 14.2;
  const shape = { nose: 0.12, tail: 0.05, taper: 0.1 };
  const body = (inset) => outline(L - inset, W - inset, shape);
  const axles = [-11.5, 11];
  shadowSlices(kit, L, W, shape);
  wheelSlices(kit, 0.6, axles, W, 2.2, 2.4);
  wheelSlices(kit, 1.5, axles, W, 2.2, 2.4);
  kit.slab(2.2, body(1.6), mix(variant.side, "#0b1014", 0.35));
  wheelSlices(kit, 2.6, axles, W, 2.1, 2.3);
  for (let height = 3.2; height < 6.4; height += 1)
    kit.slab(height, body(0.1), variant.side);
  lampSlices(kit, car, { length: L, width: W, headHeight: 5, tailHeight: 6 });
  const glass = "#2c3a43";
  for (let height = 7; height < 14; height += 1) {
    // Windscreen raked back as it rises; cab side windows behind it.
    const rake = (height - 7) * 0.55;
    bandSlice(kit, height, body(0), variant.side, [
      [L / 2 - 3.2 - rake, L / 2 + 1, height > 7.6 ? glass : variant.side],
      [
        L / 2 - 9.5,
        L / 2 - 4.2 - rake,
        height > 8.4 && height < 12.8 ? glass : variant.side,
      ],
    ]);
  }
  // Roof from the tail to the top of the windscreen.
  kit.slab(
    14.5,
    outline(29.5, W - 0.5, { nose: 0.08, tail: 0.05, taper: 0.06, x: -3.25 }),
    kit.sheen(variant.roof, "roof"),
    { stroke: "#0b1014", "stroke-opacity": 0.2, "stroke-width": 0.3 },
  );
  return L / 2;
}

// Box truck: cab-over cab at the front, cargo box behind on a dark chassis,
// twin rear wheels. Slices of both blocks are painted in height order.
function truckBody(car, variant) {
  const kit = bodyKit(car);
  const L = 60;
  const W = 16.2;
  const box = variant.box;
  const shape = { nose: 0.02, tail: 0.02, taper: 0.03 };
  const cab = (inset) =>
    outline(13 - inset, W - inset, {
      nose: 0.12,
      tail: 0.04,
      taper: 0.06,
      x: 23.5,
    });
  const cargo = (inset) =>
    outline(46 - inset, 17 - inset, {
      nose: 0.02,
      tail: 0.02,
      taper: 0.01,
      x: -7,
    });
  shadowSlices(kit, L, 17, shape);
  const axles = [22, -14];
  const slices = [
    [0.8, () => wheelSlices(kit, 0.8, axles, W, 3.2, 3.2)],
    [2.1, () => wheelSlices(kit, 2.1, axles, W, 3.2, 3.2)],
    [2.6, () => kit.slab(2.6, outline(L - 4, 9, shape), "#1b1e20")],
    [3.4, () => wheelSlices(kit, 3.4, axles, W, 3, 3)],
  ];
  for (let height = 3.2; height <= 16.4; height += 1.1)
    slices.push([
      height,
      () =>
        bandSlice(kit, height, cab(height < 4 ? 1 : 0), variant.side, [
          [
            28.8 - Math.max(0, height - 9) * 0.1,
            31,
            height > 9.5 ? "#26343c" : variant.side,
          ],
          [23.5, 27.2, height > 10 && height < 15.5 ? "#26343c" : variant.side],
        ]),
    ]);
  slices.push([
    17.2,
    () =>
      kit.slab(17.2, cab(0.2), kit.sheen(variant.paint, "cab"), {
        stroke: "#0b1014",
        "stroke-opacity": 0.2,
        "stroke-width": 0.3,
      }),
  ]);
  for (let height = 4.6; height <= 21.4; height += 1.2)
    slices.push([
      height,
      () => kit.slab(height, cargo(0), mix(box, "#0b1014", 0.1)),
    ]);
  slices.push([
    22.4,
    () =>
      kit.slab(22.4, cargo(0), kit.sheen(box, "box"), {
        stroke: "#0b1014",
        "stroke-opacity": 0.2,
        "stroke-width": 0.35,
      }),
  ]);
  slices.push([
    4.4,
    () => {
      const heads = kit.group(4.4, { fill: "#f3e7cd" });
      for (const y of [-W / 2 + 1.4, W / 2 - 3.6])
        svg(
          "rect",
          { x: f2(L / 2 - 1.6), y: f2(y), width: 1.4, height: 2.2, rx: 0.6 },
          heads,
        );
    },
  ]);
  slices.push([
    5.2,
    () => {
      const tails = kit.group(5.2, { fill: "#b5332b", "fill-opacity": 0.6 });
      for (const y of [-8.1, 5.9])
        car.tails.push(
          svg("rect", { x: -30.2, y, width: 1.4, height: 2.2, rx: 0.6 }, tails),
        );
    },
  ]);
  slices.sort((a, b) => a[0] - b[0]).forEach(([, make]) => make());
  return L / 2;
}

function busBody(car, variant) {
  const kit = bodyKit(car);
  const L = 83;
  const W = 17.6;
  const shape = { nose: 0.04, tail: 0.035, taper: 0.07 };
  const body = (inset) => outline(L - inset, W - inset, shape);
  const axles = [-22.8, 24.5];
  shadowSlices(kit, L, W, shape);
  wheelSlices(kit, 0.8, axles, W, 2.6, 3.4);
  wheelSlices(kit, 2.2, axles, W, 2.6, 3.4);
  kit.slab(2, body(1.4), mix(variant.side, "#0b1014", 0.45));
  wheelSlices(kit, 3.4, axles, W, 2.4, 3.2);
  // Windows with pillars, repeating along the body.
  const windows = svg(
    "pattern",
    {
      id: `${kit.id}-windows`,
      patternUnits: "userSpaceOnUse",
      width: 10,
      height: 40,
      x: 0.5,
      y: -20,
    },
    kit.defs,
  );
  // Pillars in a tone between paint and glass, so they stay continuous lines
  // when the side is seen at an angle.
  svg(
    "rect",
    { width: 10, height: 40, fill: mix(variant.side, "#1b262d", 0.55) },
    windows,
  );
  svg("rect", { x: 1.3, width: 8.7, height: 40, fill: "#1b262d" }, windows);
  // Window-band slices keep a solid windscreen at the front and a solid
  // panel at the rear, clipped to the body's rounded outline.
  const clip = svg("clipPath", { id: `${kit.id}-body` }, kit.defs);
  svg("path", { d: body(0) }, clip);
  const band = (height) => {
    const group = kit.group(height, { "clip-path": `url(#${kit.id}-body)` });
    svg("path", { d: body(0), fill: `url(#${kit.id}-windows)` }, group);
    svg(
      "rect",
      {
        x: f2(L / 2 - 3.2),
        y: f2(-W / 2),
        width: 4,
        height: f2(W),
        fill: "#1b262d",
      },
      group,
    );
    svg(
      "rect",
      {
        x: f2(-L / 2 - 1),
        y: f2(-W / 2),
        width: 3.4,
        height: f2(W),
        fill: variant.side,
      },
      group,
    );
  };
  const heights = [];
  for (let height = 3; height < 9; height += 1.5) heights.push(height);
  for (let height = 9; height < 18; height += 0.9) heights.push(height);
  heights.push(18, 19.5);
  for (const height of heights) {
    if (height >= 9 && height < 18) band(height);
    else
      kit.slab(
        height,
        body(0),
        height < 7.5 || height >= 18 ? variant.side : variant.stripe,
      );
  }
  lampSlices(kit, car, {
    length: L,
    width: W,
    headHeight: 3.6,
    tailHeight: 5.6,
    inset: 3.4,
    size: 2.4,
  });
  // Lit destination display above the windscreen.
  kit.slab(18.8, `M${f2(L / 2 - 1.3)} -5.2h1.2v10.4h-1.2z`, "#f2a33a");
  kit.slab(21, body(0), kit.sheen(variant.roof, "roof"), {
    stroke: "#0b1014",
    "stroke-opacity": 0.2,
    "stroke-width": 0.35,
  });
  // Roof hatches and the air-conditioning unit.
  const hatches = kit.group(21.1, { fill: "#2b3236", "fill-opacity": 0.55 });
  for (const x of [-18, -29])
    svg("rect", { x, y: -2.6, width: 5.4, height: 5.2, rx: 0.6 }, hatches);
  kit.slab(
    22,
    outline(18, 11.6, { nose: 0.2, tail: 0.2, taper: 0.1, x: 9 }),
    mix(variant.roof, "#0b1014", 0.18),
  );
  kit.slab(
    23.2,
    outline(17.4, 11, { nose: 0.2, tail: 0.2, taper: 0.1, x: 9 }),
    kit.sheen(mix(variant.roof, "#0b1014", 0.06), "unit"),
  );
  return L / 2;
}

const BODY_BUILDERS = {
  sedan: passengerBody,
  hatch: passengerBody,
  estate: passengerBody,
  suv: passengerBody,
  sports: passengerBody,
  van: vanBody,
  bus: busBody,
  truck: truckBody,
};

// Cyclists combine a side profile drawn in the vertical plane of travel with
// ground-plane slices that keep their width when seen end-on.
// --- Boats ------------------------------------------------------------------
// Built like the cars: horizontal slices from the waterline up (height 0 is
// the water surface), plus "profiles", vertical shapes along the keel line
// for masts and sails (drawn with negative y upwards, as on screen). Wakes are
// left in the water by wake.js. Units are ground units
// (about 1.8 per board millimetre).
function createBoat(layer) {
  return {
    element: svg("g", { class: "city-traffic-boat" }, layer),
    layers: [],
    tails: [],
    profiles: [],
    beam: 0,
  };
}

// Hull outline seen from above: a fine bow and a square transom.
const hullOutline = (length, width, x = 0) =>
  outline(length, width, { nose: 0.42, tail: 0.04, taper: 0.9, x });

const BOAT_VARIANTS = [
  {
    type: "sail",
    hull: "#f2f0ea",
    stripe: "#1d3450",
    canvas: "#1e3a5a",
    sails: true,
  },
  {
    type: "sail",
    hull: "#1f3550",
    stripe: "#f2f0ea",
    canvas: "#c9bfa6",
    sails: true,
  },
  {
    type: "sail",
    hull: "#f2f0ea",
    stripe: "#7a1f1f",
    canvas: "#2f4f6f",
    sails: true,
  },
  { type: "motor", hull: "#f4f3ef", stripe: "#23313f", canvas: "#2f4f6f" },
  { type: "motor", hull: "#e9e6de", stripe: "#0f1a24", canvas: "#6b6f72" },
  { type: "fishing", hull: "#2c5f8a", stripe: "#f1efe9", canvas: "#b0452f" },
  { type: "fishing", hull: "#b8412f", stripe: "#f1efe9", canvas: "#2c6b4f" },
  { type: "rib", hull: "#50575c", stripe: "#e0572f", canvas: "#2b2f33" },
  { type: "tour", hull: "#f3f2ec", stripe: "#1f5f8a", canvas: "#1f5f8a" },
];

// Sails are up out at sea; in the harbour boats come in under engine. The
// tour boat keeps to its harbour round.
function pickBoat(lane, used) {
  const tour = lane.name.startsWith("harbourTour");
  const sea = lane.name.startsWith("sea");
  const fits = BOAT_VARIANTS.filter((variant) =>
    tour
      ? variant.type === "tour" || variant.type === "motor"
      : variant.type !== "tour" &&
        (sea || variant.type !== "sail" || Math.random() < 0.5),
  );
  const fresh = fits.filter((variant) => !used.includes(variant));
  return pick(fresh.length ? fresh : fits);
}

// Red, green and white navigation lights.
function navLights(kit, length, width, height) {
  const lights = kit.group(height);
  for (const [side, color] of [
    [-1, "#ff5a44"],
    [1, "#4cff86"],
  ]) {
    svg(
      "circle",
      {
        cx: f2(length * 0.22),
        cy: f2(side * width * 0.36),
        r: 2.2,
        fill: color,
        "fill-opacity": 0.25,
      },
      lights,
    );
    svg(
      "circle",
      {
        cx: f2(length * 0.22),
        cy: f2(side * width * 0.36),
        r: 0.8,
        fill: color,
      },
      lights,
    );
  }
  svg(
    "circle",
    { cx: f2(-length / 2 + 1.2), cy: 0, r: 0.8, fill: "#fff8e6" },
    lights,
  );
}

function boatHull(kit, variant, length, width, freeboard) {
  const hull = (inset) => hullOutline(length - inset, width - inset);
  const shadow = kit.group(0);
  svg(
    "path",
    {
      d: hullOutline(length + 3, width + 3),
      fill: "#021014",
      "fill-opacity": 0.28,
    },
    shadow,
  );
  kit.slab(0.4, hull(1.2), mix(variant.hull, "#0b1014", 0.35));
  kit.slab(1.2, hull(0.5), variant.stripe);
  for (let height = 2.2; height < freeboard - 0.4; height += 1)
    kit.slab(
      height,
      hull(0),
      mix(variant.hull, "#0b1014", 0.12 - height * 0.01),
    );
}

function boatProfile(boat, extra = {}) {
  const node = svg("g", extra, boat.element);
  boat.profiles.push({ node });
  return node;
}

function styleBoat(boat, variant, lane) {
  boat.element.replaceChildren();
  boat.layers = [];
  boat.tails = [];
  boat.profiles = [];
  const kit = bodyKit(boat);
  const sails = variant.sails && lane.name.startsWith("sea");
  if (variant.type === "sail") {
    const L = 60;
    const W = 19;
    boat.beam = W;
    boatHull(kit, variant, L, W, 6);
    kit.slab(6, hullOutline(L - 0.6, W - 0.6), kit.sheen("#f1efe9", "deck"), {
      stroke: "#0b1014",
      "stroke-opacity": 0.2,
      "stroke-width": 0.3,
    });
    kit.slab(
      6.2,
      `M${f2(-L / 2 + 2)} ${f2(-W * 0.28)}h14v${f2(W * 0.56)}h-14z`,
      "#a8805a",
    );
    kit.slab(
      8,
      outline(L * 0.34, W * 0.56, { nose: 0.3, tail: 0.1, taper: 0.3, x: -2 }),
      "#e8e6df",
    );
    kit.slab(
      8.6,
      outline(L * 0.32, W * 0.5, { nose: 0.3, tail: 0.1, taper: 0.3, x: -2 }),
      "#2c3a43",
    );
    kit.slab(
      9.4,
      outline(L * 0.3, W * 0.46, { nose: 0.3, tail: 0.1, taper: 0.3, x: -2 }),
      kit.sheen("#f4f2ec", "roof"),
    );
    navLights(kit, L, W, 6.4);
    const mast = 8;
    const profile = boatProfile(boat);
    if (sails) {
      // Mainsail and jib, full of wind.
      svg(
        "path",
        {
          d: `M${mast - 1} -10L${mast - 1} -104Q${mast - 16} -60 ${mast - 30} -12Z`,
          fill: "#f7f5ee",
          "fill-opacity": 0.96,
          stroke: "#c9c6bd",
          "stroke-width": 0.5,
        },
        profile,
      );
      svg(
        "path",
        {
          d: `M${mast + 1} -96L${L / 2 - 2} -8Q${mast + 14} -30 ${mast + 2} -12Z`,
          fill: "#eceae2",
          "fill-opacity": 0.94,
          stroke: "#c9c6bd",
          "stroke-width": 0.5,
        },
        profile,
      );
    } else {
      svg(
        "path",
        { d: `M${mast - 30} -12.5h29v-3h-29z`, fill: variant.canvas },
        profile,
      );
    }
    svg(
      "path",
      { d: `M${mast} -6V-108`, stroke: "#c9cdcf", "stroke-width": 1.1 },
      profile,
    );
    svg(
      "path",
      {
        d: `M${mast} -108L${L / 2 - 1} -7M${mast} -108L${-L / 2 + 1} -7`,
        stroke: "#3a4045",
        "stroke-width": 0.3,
        "stroke-opacity": 0.8,
      },
      profile,
    );
    svg("circle", { cx: mast, cy: -108, r: 1.1, fill: "#fff8e6" }, profile);
    return L / 2;
  }
  if (variant.type === "motor") {
    const L = 68;
    const W = 22;
    boat.beam = W;
    boatHull(kit, variant, L, W, 7);
    kit.slab(7, hullOutline(L - 0.6, W - 0.6), kit.sheen("#f3f1ec", "deck"), {
      stroke: "#0b1014",
      "stroke-opacity": 0.2,
      "stroke-width": 0.3,
    });
    kit.slab(
      7.2,
      `M${f2(-L / 2 + 1.5)} ${f2(-W * 0.36)}h11v${f2(W * 0.72)}h-11z`,
      "#a8805a",
    );
    const cabin = (inset, x = -3) =>
      outline(L * 0.5 - inset, W * 0.78 - inset, {
        nose: 0.35,
        tail: 0.08,
        taper: 0.4,
        x,
      });
    for (let height = 8; height < 13; height += 1)
      kit.slab(
        height,
        cabin(0),
        height > 9.4 && height < 12 ? "#26343e" : "#eeede8",
      );
    kit.slab(13, cabin(0.6), kit.sheen("#f6f5f1", "roof"), {
      stroke: "#0b1014",
      "stroke-opacity": 0.2,
      "stroke-width": 0.3,
    });
    kit.slab(
      14.2,
      outline(L * 0.26, W * 0.6, { nose: 0.2, tail: 0.1, taper: 0.2, x: -9 }),
      "#f0efea",
    );
    kit.slab(
      17.5,
      outline(L * 0.2, W * 0.62, { nose: 0.1, tail: 0.1, taper: 0.1, x: -11 }),
      variant.canvas,
    );
    // Cabin lights at dusk.
    const glow = kit.group(10.6, { fill: "#ffd99a", "fill-opacity": 0.85 });
    for (const x of [-12, -4, 4])
      for (const side of [-1, 1])
        svg(
          "rect",
          { x, y: f2(side * W * 0.39 - 0.6), width: 5, height: 1.2, rx: 0.5 },
          glow,
        );
    navLights(kit, L, W, 7.4);
    const profile = boatProfile(boat);
    svg(
      "path",
      { d: "M-6 -17V-25M-6 -25h-4", stroke: "#dfe2e3", "stroke-width": 0.9 },
      profile,
    );
    return L / 2;
  }
  if (variant.type === "fishing") {
    const L = 46;
    const W = 16;
    boat.beam = W;
    boatHull(kit, variant, L, W, 6);
    kit.slab(6, hullOutline(L - 0.8, W - 0.8), "#cfd2cf");
    kit.slab(6.4, `M${f2(-L / 2 + 3)} -5.5h13v11h-13z`, variant.canvas);
    const house = (inset) =>
      outline(L * 0.26 - inset, W * 0.66 - inset, {
        nose: 0.1,
        tail: 0.1,
        taper: 0.1,
        x: 5,
      });
    for (let height = 7; height < 14; height += 1)
      kit.slab(
        height,
        house(0),
        height > 9.4 && height < 12.2 ? "#27343d" : "#f1efe9",
      );
    kit.slab(14, house(0.5), kit.sheen("#e9e7e0", "roof"));
    navLights(kit, L, W, 6.4);
    const profile = boatProfile(boat);
    svg(
      "path",
      { d: "M5 -14V-34M5 -30L-18 -8", stroke: "#3a4045", "stroke-width": 0.8 },
      profile,
    );
    svg("circle", { cx: 5, cy: -34, r: 1.1, fill: "#fff8e6" }, profile);
    return L / 2;
  }
  if (variant.type === "rib") {
    const L = 32;
    const W = 14;
    boat.beam = W;
    const shadow = kit.group(0);
    svg(
      "path",
      { d: hullOutline(L + 3, W + 3), fill: "#021014", "fill-opacity": 0.28 },
      shadow,
    );
    for (let height = 0.6; height < 3.6; height += 1)
      kit.slab(
        height,
        hullOutline(L, W),
        height < 1.4 ? variant.stripe : mix(variant.hull, "#0b1014", 0.1),
      );
    kit.slab(3.6, hullOutline(L - 4, W - 5), "#2a2e31");
    kit.slab(5.5, `M-2 -2.8h6v5.6h-6z`, "#e9e7e0");
    kit.slab(7.5, `M-6 -2.2h4v4.4h-4z`, "#34495e");
    kit.slab(5, `M${f2(-L / 2 - 1.5)} -1.8h3.5v3.6h-3.5z`, "#15181a");
    navLights(kit, L, W, 3.8);
    return L / 2;
  }
  // Tour boat: long cabin with lit windows and an open upper deck.
  const L = 112;
  const W = 30;
  boat.beam = W;
  boatHull(kit, variant, L, W, 8);
  kit.slab(8, hullOutline(L - 0.6, W - 0.6), kit.sheen("#f1f0ec", "deck"), {
    stroke: "#0b1014",
    "stroke-opacity": 0.2,
    "stroke-width": 0.3,
  });
  const cabin = (inset) =>
    outline(L * 0.72 - inset, W * 0.84 - inset, {
      nose: 0.12,
      tail: 0.06,
      taper: 0.2,
      x: -4,
    });
  for (let height = 9; height < 18; height += 1)
    kit.slab(
      height,
      cabin(0),
      height > 10.4 && height < 15.6 ? "#ffd99a" : "#f2f1ec",
    );
  kit.slab(18, cabin(0.4), kit.sheen("#f4f3ef", "roof"), {
    stroke: "#0b1014",
    "stroke-opacity": 0.2,
    "stroke-width": 0.3,
  });
  // Window mullions on the lit band.
  const mullions = kit.group(15.2, { fill: "#f2f1ec" });
  for (let x = -40; x < 32; x += 6)
    for (const side of [-1, 1])
      svg(
        "rect",
        { x, y: f2(side * W * 0.42 - 0.8), width: 1, height: 1.6 },
        mullions,
      );
  const rail = kit.group(21, {
    fill: "none",
    stroke: "#dfe2e3",
    "stroke-width": 0.6,
  });
  svg("path", { d: cabin(1.2) }, rail);
  const people = kit.group(20.5);
  for (let i = 0; i < 9; i++)
    svg(
      "circle",
      {
        cx: f2(-34 + i * 7.5 + random(-1.5, 1.5)),
        cy: f2(random(-8, 8)),
        r: 1.5,
        fill: pick(OUTFIT.tops),
      },
      people,
    );
  navLights(kit, L, W, 8.4);
  return L / 2;
}

function createCyclist(layer) {
  const element = svg("g", { class: "city-traffic-cyclist" }, layer);
  const shadow = svg(
    "ellipse",
    { rx: 6.5, ry: 1.7, fill: "#0b1014", "fill-opacity": 0.2 },
    element,
  );
  const spine = svg(
    "rect",
    { x: -6, y: -0.45, width: 12, height: 0.9, rx: 0.45, fill: "#1d2327" },
    element,
  );
  const profile = svg(
    "g",
    { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" },
    element,
  );
  svg(
    "circle",
    { cx: -4.1, cy: 2.6, r: 2.5, stroke: "#1d2327", "stroke-width": 0.75 },
    profile,
  );
  svg(
    "circle",
    { cx: 4.1, cy: 2.6, r: 2.5, stroke: "#1d2327", "stroke-width": 0.75 },
    profile,
  );
  const frame = svg(
    "path",
    {
      d: "M-4.1 2.6H.2L-1.8 7H3L4.1 2.6M.2 2.6 3 7M-1.8 7-2.2 7.7M3 7l.4 1",
      "stroke-width": 0.7,
    },
    profile,
  );
  svg(
    "path",
    { d: "M-1.6 7.6 1.2 5.4.6 1.9", stroke: "#262b30", "stroke-width": 1.3 },
    profile,
  );
  const torso = svg(
    "path",
    { d: "M-1.6 7.6 1.9 10.3M1.9 10.2 3.4 7.9", "stroke-width": 2.4 },
    profile,
  );
  const legs = svg(
    "ellipse",
    { cx: 0.6, rx: 1.2, ry: 0.85, fill: "#262b30" },
    element,
  );
  const hips = svg(
    "ellipse",
    { cx: -1.2, rx: 1.5, ry: 1.4, fill: "#262b30" },
    element,
  );
  const back = [0, 1].map(() =>
    svg("ellipse", { cx: 0.6, rx: 2.1, ry: 1.9 }, element),
  );
  const head = svg(
    "circle",
    { r: 1.15, stroke: "#20272b", "stroke-width": 0.3 },
    element,
  );
  return {
    element,
    shadow,
    spine,
    profile,
    frame,
    torso,
    legs,
    hips,
    back,
    head,
  };
}

function styleCyclist(cyclist) {
  const jersey = pick(JERSEYS);
  cyclist.frame.setAttribute("stroke", pick(FRAMES));
  cyclist.torso.setAttribute("stroke", jersey);
  for (const part of cyclist.back) part.setAttribute("fill", jersey);
  cyclist.head.setAttribute("fill", pick(HELMETS));
  return 6.5 * CYCLIST_SIZE;
}

// Pedestrians: limbs are strokes between projected joints and the torso and
// head are ground-plane slices, so a walker reads correctly from any side.
// Legs, arms and a slight bob follow the distance walked.
function createPedestrian(layer) {
  const element = svg(
    "g",
    {
      class: "city-traffic-pedestrian",
      fill: "none",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    },
    layer,
  );
  const shadow = svg(
    "ellipse",
    { rx: 2.1, ry: 1.6, fill: "#0b1014", "fill-opacity": 0.24 },
    element,
  );
  const limb = () => svg("polyline", {}, element);
  // Far-side limbs first, torso, then near-side limbs and head on top.
  const legs = [limb(), limb()];
  const shoes = [limb(), limb()];
  const farArm = [limb(), limb()];
  // Coat hem or skirt, hips, and upper body are single strokes whose width
  // follows the viewing angle; the shoulders are a slice seen from above.
  const body = () => svg("polyline", { "stroke-linecap": "butt" }, element);
  const coat = body();
  const torso = [body(), body()];
  const shoulders = svg("ellipse", { rx: 0.95, ry: 1.7 }, element);
  const nearArm = [limb(), limb()];
  // A cardboard box, shown only while carrying.
  const box = svg(
    "g",
    { fill: "#a9824f", stroke: "#6d5232", "stroke-width": 0.2 },
    element,
  );
  const boxSlices = [0, 1, 2].map(() =>
    svg("rect", { x: 0.6, y: -1.6, width: 2.8, height: 3.2, rx: 0.25 }, box),
  );
  box.style.display = "none";
  const head = svg("circle", { r: 0.95 }, element);
  const longHair = svg("ellipse", { cx: -0.55, rx: 0.8, ry: 1.05 }, element);
  const hair = svg("ellipse", { cx: -0.2, rx: 1, ry: 0.95 }, element);
  return {
    element,
    shadow,
    legs,
    shoes,
    farArm,
    coat,
    torso,
    shoulders,
    nearArm,
    box,
    boxSlices,
    head,
    longHair,
    hair,
    size: 0,
  };
}

// Children have relatively larger heads.
function makeChild(walker) {
  walker.head.setAttribute("r", 1.25);
  walker.hair.setAttribute("rx", 1.3);
  walker.hair.setAttribute("ry", 1.25);
  walker.longHair.setAttribute("rx", 1.05);
  walker.longHair.setAttribute("ry", 1.3);
}

function dressPedestrian(walker, taken) {
  const top = pick(OUTFIT.tops.filter((color) => !taken.includes(color)));
  const skin = pick(OUTFIT.skins);
  const style = Math.random();
  const coat = style < 0.25;
  const skirt = style >= 0.25 && style < 0.45;
  const sleeve = style > 0.85 ? skin : top;
  const bottom = skirt ? pick(OUTFIT.skirts) : pick(OUTFIT.bottoms);
  const legs = skirt ? skin : bottom;
  for (const leg of walker.legs) leg.setAttribute("stroke", legs);
  const shoes = pick(OUTFIT.shoes);
  for (const shoe of walker.shoes) shoe.setAttribute("stroke", shoes);
  for (const arm of [walker.farArm, walker.nearArm]) {
    arm[0].setAttribute("stroke", sleeve);
    arm[1].setAttribute("stroke", skin);
  }
  // A long coat or a skirt covers the upper legs; otherwise hidden.
  walker.coat.style.display = coat || skirt ? "" : "none";
  walker.coat.setAttribute("stroke", coat ? top : bottom);
  walker.hem = skirt ? 1.85 : 1.6;
  walker.torso[0].setAttribute("stroke", coat ? top : bottom);
  walker.torso[1].setAttribute("stroke", top);
  walker.shoulders.setAttribute("fill", top);
  walker.head.setAttribute("fill", skin);
  const hair = pick(OUTFIT.hairs);
  walker.hair.setAttribute("fill", hair);
  walker.longHair.setAttribute("fill", hair);
  walker.longHair.style.display = Math.random() < 0.35 ? "" : "none";
  walker.top = top;
  return 1.8;
}

// Arm poses for people doing something. Each returns the elbow and hand of
// one arm as [forward, sideways, height] in ground units, for side +1 (right)
// or -1 (left), at time t in seconds.
const POSES = {
  // Hands busy at a workbench or desk.
  work: (t, side) => [
    0.9,
    side * 1.6,
    8.6,
    1.7 + 0.25 * Math.sin(t * 6 + side),
    side * 0.8,
    8.2 + 0.2 * Math.sin(t * 5 + side * 2),
  ],
  // Bent forward, setting a box down on the pallets.
  lift: (t, side) => [1, side * 1.5, 7.4, 1.8, side * 0.9, 5.6],
  // Holding a box in front of the body.
  carry: (t, side) => [0.8, side * 1.6, 8.3, 1.5, side * 1.15, 8],
  // Reaching up into the truck for a box.
  load: (t, side) => [1.1, side * 1.4, 9.8, 2.1, side * 1, 10.3],
  // Right hand at the ear, left arm across the body.
  phone: (t, side) =>
    side > 0
      ? [0.3, 1.9, 9.6, 0.4, 1.05, 11.4]
      : [0.4, -1.7, 8.6, 1, -0.6, 8.9],
  // Talking with the hands.
  talk: (t, side) => [
    0.6,
    side * 1.8,
    8.6,
    1.3 + 0.3 * Math.sin(t * 4 + side * 1.3),
    side * 1.2,
    9 + 0.4 * Math.sin(t * 3.3 + side),
  ],
  // Both hands in front of the face, holding a phone to take a picture.
  photo: (t, side) => [0.7, side * 1.5, 9.8, 1.35, side * 0.35, 11.2],
  // Right arm pointing up at the jet.
  point: (t, side) =>
    side > 0
      ? [1.2, 1.5, 10.6, 2.6, 1.2, 11.8 + 0.15 * Math.sin(t * 3)]
      : [0, -1.85, 8.4, 0.1, -1.9, 6.6],
  // Both arms up, waving.
  wave: (t, side) => [
    0.2,
    side * 2.3,
    11.6,
    0.4 + 0.3 * Math.sin(t * 9 + side),
    side * (2.2 + 0.5 * Math.sin(t * 9 + side * 1.5)),
    13.4,
  ],
  // Holding the ball in both hands, ready to throw.
  ready: (t, side) => [0.7, side * 1.3, 8.8, 1.2, side * 0.45, 9.1],
  // Right arm following through after a throw.
  throw: (t, side) =>
    side > 0 ? [1.1, 1.4, 10.6, 2.2, 1.1, 11.3] : [0.5, -1.8, 8.6, 1, -1.5, 8],
  // Hands out in front, waiting for the ball.
  catch: (t, side) => [1, side * 1.5, 9.2, 1.8, side * 0.9, 9.8],
  // Clapping in front of the chest.
  clap: (t, side) => [
    0.8,
    side * 1.6,
    9,
    1.3,
    side * (0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 8))),
    9.4,
  ],
};

// Poses a walker for this frame. Feet swing alternately along the heading
// with a slight lift, arms swing against the legs, and the body bobs a
// little at mid-stride. Limbs on the side facing away from the camera are
// drawn behind the torso.
function drawPedestrian(entity, x, y, size, k, cos, sin, ground) {
  const walker = entity.art;
  const phase = (entity.stride / STEP) * Math.PI;
  const swing = Math.sin(phase);
  const amplitude =
    2.1 * Math.min(1, entity.speed / (0.6 * entity.cruise || 1));
  const hop = entity.hop || 0;
  const bob = 0.22 * (1 - Math.abs(swing)) * (amplitude / 2.1) + hop;
  const point = (u, v, h) =>
    `${f2(x + size * (u * cos - v * sin))},${f2(
      y + size * k * (u * sin + v * cos) - h * RISE * size,
    )}`;
  const pose = POSES[entity.pose];
  const weight = pose ? entity.poseWeight : 0;
  const near = cos >= 0 ? 1 : -1;
  for (let i = 0; i < 2; i++) {
    // i = 0 is the far side, i = 1 the near side.
    const side = i ? near : -near;
    const forward = side * swing;
    const foot = amplitude * forward;
    const lift = Math.max(0, side * Math.cos(phase)) * 0.28 * amplitude + hop;
    walker.legs[i].setAttribute(
      "points",
      `${point(0, side * 0.7, 6.6 + bob)} ${point(
        foot * 0.45 + 0.25,
        side * 0.7,
        3.4 + lift * 0.4,
      )} ${point(foot, side * 0.7, 0.35 + lift)}`,
    );
    walker.shoes[i].setAttribute(
      "points",
      `${point(foot - 0.2, side * 0.7, 0.3 + lift)} ${point(
        foot + 0.8,
        side * 0.7,
        0.25 + lift,
      )}`,
    );
    const arm = i ? walker.nearArm : walker.farArm;
    const hand = -foot * 0.6;
    // Elbow and hand as [forward, sideways, height]; a pose blends in over
    // the natural arm swing.
    const joints = [hand * 0.45, side * 1.85, 8.4, hand, side * 1.9, 6.6];
    if (weight) {
      const target = pose(entity.poseTime, side);
      for (let j = 0; j < 6; j++) joints[j] += (target[j] - joints[j]) * weight;
    }
    const [eu, ev, eh, hu, hv, hh] = joints;
    const wrist = point(
      eu + (hu - eu) * 0.75,
      ev + (hv - ev) * 0.75,
      eh + (hh - eh) * 0.75 + bob,
    );
    arm[0].setAttribute(
      "points",
      `${point(0.1, side * 1.7, 10.1 + bob)} ${point(eu, ev, eh + bob)} ${wrist}`,
    );
    arm[1].setAttribute("points", `${wrist} ${point(hu, hv, hh + bob)}`);
  }
  if (Math.abs(size - walker.size) > 0.01) {
    walker.size = size;
    for (const leg of walker.legs)
      leg.setAttribute("stroke-width", f2(1.25 * size));
    for (const shoe of walker.shoes)
      shoe.setAttribute("stroke-width", f2(1.05 * size));
    for (const arm of [walker.farArm, walker.nearArm]) {
      arm[0].setAttribute("stroke-width", f2(0.9 * size));
      arm[1].setAttribute("stroke-width", f2(0.75 * size));
    }
  }
  walker.shadow.setAttribute("transform", ground(0));
  // Visible width of an upright body section with the given half depth and
  // half width, seen from the camera.
  const width = (depth, half) =>
    f2(2 * size * Math.hypot(depth * cos, half * sin));
  const section = (node, from, to, depth, half) => {
    node.setAttribute("points", `${point(0, 0, from)} ${point(0, 0, to)}`);
    node.setAttribute("stroke-width", width(depth, half));
  };
  section(walker.coat, 5.3 + bob, 7 + bob, 1.05, walker.hem);
  section(walker.torso[0], 6.6 + bob, 7.6 + bob, 0.9, 1.4);
  section(walker.torso[1], 7.5 + bob, 10 + bob, 0.95, 1.55);
  walker.shoulders.setAttribute("transform", ground(10 + bob));
  const [hx, hy] = point(0.05, 0, 11.55 + bob).split(",");
  walker.head.setAttribute(
    "transform",
    `translate(${hx} ${hy}) scale(${f3(size)})`,
  );
  walker.longHair.setAttribute("transform", ground(11.2 + bob));
  walker.hair.setAttribute("transform", ground(12.1 + bob));
  // The box sits in front of the body, or behind it when walking away.
  walker.box.style.display = entity.carrying ? "" : "none";
  if (entity.carrying) {
    walker.boxSlices.forEach((slice, index) =>
      slice.setAttribute("transform", ground(6.9 + index * 1.1 + bob)),
    );
    const before = sin >= 0 ? walker.nearArm[0] : walker.coat;
    if (walker.box.nextSibling !== before)
      walker.element.insertBefore(walker.box, before);
  }
  // Walkers step out of and into building doors instead of popping in.
  const [fadeIn, fadeOut] = entity.lane?.fade ?? [false, false];
  const opacity = Math.min(
    fadeIn ? Math.min(1, entity.distance / 8) : 1,
    fadeOut ? Math.min(1, (entity.lane.length - entity.distance) / 8) : 1,
  );
  if (
    Math.abs(opacity - entity.opacity) > 0.01 ||
    (opacity === 1) !== (entity.opacity === 1)
  ) {
    entity.opacity = opacity;
    walker.element.style.opacity = opacity === 1 ? "" : f2(opacity);
  }
}

// The city's map: its routes, walks, scenery in front of them and the scripted
// people around the fountain. Other maquettes pass their own (marina.js).
const CITY = {
  id: "city",
  routes: ROUTES,
  walks: WALKS,
  occluders: OCCLUDERS,
  actors: ACTORS,
  counts: {
    car: CAR_COUNT,
    cyclist: CYCLIST_COUNT,
    pedestrian: PEDESTRIAN_COUNT,
  },
  counter: COUNTER,
};

export function initTraffic(root, map = CITY) {
  const scene = root.querySelector("[data-city-art]");
  const layer = scene?.querySelector("[data-traffic-layer]");
  if (!layer) return;
  let setInView = null;
  let starting = null;
  let visible = false;
  // Routes and artwork are only built once the maquette nears the viewport.
  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible)
        starting ??= startTraffic(root, layer, map).then((set) => {
          setInView = set;
          set(visible);
        });
      setInView?.(visible);
    },
    { rootMargin: "200px" },
  ).observe(scene);
}

async function startTraffic(root, layer, map) {
  const host = layer.ownerSVGElement;
  const board = map.board ?? BOARD;
  // Walks run both ways, unless marked "oneWay"; walks may also sit among the
  // routes (mode "walk").
  const walks = {
    ...(map.walks ?? {}),
    ...Object.fromEntries(
      Object.entries(map.routes).filter(([, route]) => route.mode === "walk"),
    ),
  };
  const specs = [
    ...Object.entries(map.routes).filter(([, route]) => route.mode !== "walk"),
    ...Object.entries(walks).flatMap(([name, walk]) => [
      [name, { ...walk, walk: true }],
      ...(walk.oneWay
        ? []
        : [
            [
              `${name}Back`,
              {
                ...walk,
                walk: true,
                points: [...walk.points].reverse(),
                fade: walk.fade && [walk.fade[1], walk.fade[0]],
              },
            ],
          ]),
    ]),
  ];
  // One lane per idle slice keeps every set-up task short.
  const lanes = [];
  for (const [name, spec] of specs) {
    lanes.push(
      buildRoute(name, spec, { prefix: map.id, counter: map.counter }),
    );
    await idle();
  }
  const defs = svg("defs", {}, null);
  host.insertBefore(defs, host.firstChild);
  for (const lane of lanes) {
    if (map.masks) {
      // A mask, so overlapping outlines of scenery still hide what is behind.
      const mask = svg(
        "mask",
        {
          id: lane.clipId,
          maskUnits: "userSpaceOnUse",
          x: 0,
          y: 0,
          width: 1536,
          height: 1024,
        },
        defs,
      );
      svg("path", { d: board, fill: "#fff" }, mask);
      for (const key of lane.occluders)
        svg("path", { d: `M${map.occluders[key]}Z`, fill: "#000" }, mask);
      lane.clipAttribute = ["mask", `url(#${lane.clipId})`];
      continue;
    }
    const clip = svg(
      "clipPath",
      { id: lane.clipId, clipPathUnits: "userSpaceOnUse" },
      defs,
    );
    const holes = lane.occluders
      .map((key) => `M${map.occluders[key]}Z`)
      .join("");
    svg("path", { d: board + holes, "clip-rule": "evenodd" }, clip);
    lane.clipAttribute = ["clip-path", `url(#${lane.clipId})`];
  }
  await findConflicts(lanes);
  const wakes = map.counts.boat ? createWakes(host, board) : null;

  const traffic = [];
  const create = {
    car: createCar,
    cyclist: createCyclist,
    pedestrian: createPedestrian,
    boat: createBoat,
  };
  const kinds = Object.entries(map.counts).flatMap(([kind, count]) =>
    Array(count).fill(kind),
  );
  for (const kind of kinds) {
    const art = create[kind](layer);
    art.element.style.display = "none";
    traffic.push({
      kind,
      settings: KINDS[kind],
      art,
      lane: null,
      distance: 0,
      speed: 0,
      cruise: 0,
      half: 6,
      heading: 0,
      depth: -1,
      wait: 0,
      // Conflict cells on the lane: [next, until) are held, the rest ahead.
      next: 0,
      until: 0,
      queued: false,
      braking: false,
      variant: null,
      // Next timed stop on the lane, and the time left there.
      stop: 0,
      dwell: -1,
      phase: random(0, 100),
      // Distance walked (drives the gait) and last drawn position.
      stride: 0,
      x: 0,
      y: 0,
      opacity: 1,
      // A walker's pose at a stop, and the box they may carry away from it.
      pose: null,
      poseWeight: 0,
      poseTime: 0,
      carrying: false,
    });
  }

  const actors = (map.actors ?? []).map((spec, index) => {
    const art = createPedestrian(layer);
    const clipId = `${map.id}-traffic-actor-${index}`;
    const clip = svg(
      "clipPath",
      { id: clipId, clipPathUnits: "userSpaceOnUse" },
      defs,
    );
    let d = board;
    if (spec.window) {
      // Window glass, with the frames cut out so people pass behind them.
      d = "";
      for (const [x0, y0, x1, y1] of spec.window.rects) {
        d += `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
        for (const frame of spec.window.frames)
          if (frame > x0 && frame < x1)
            d += `M${frame - 0.6} ${y0}H${frame + 0.6}V${y1}H${frame - 0.6}Z`;
      }
      // Seen through glass, against the lit interior.
      art.element.setAttribute("opacity", 0.82);
    }
    svg("path", { d, "clip-rule": "evenodd" }, clip);
    art.element.setAttribute("clip-path", `url(#${clipId})`);
    if (spec.occluders?.length) {
      // Scenery in front of the stroll hides the person, as on the lanes.
      const mask = svg(
        "mask",
        {
          id: `${clipId}-mask`,
          maskUnits: "userSpaceOnUse",
          x: 0,
          y: 0,
          width: 1536,
          height: 1024,
        },
        defs,
      );
      svg("path", { d: board, fill: "#fff" }, mask);
      for (const key of spec.occluders)
        svg("path", { d: `M${map.occluders[key]}Z`, fill: "#000" }, mask);
      art.element.setAttribute("mask", `url(#${clipId}-mask)`);
    }
    const lanes = spec.path && [
      buildRoute(`actor${index}`, {
        points: spec.path.map(([x, y]) => [x, y, 0]),
        walk: true,
        occluders: [],
      }),
      buildRoute(`actor${index}Back`, {
        points: [...spec.path].reverse().map(([x, y]) => [x, y, 0]),
        walk: true,
        occluders: [],
      }),
    ];
    return {
      kind: "pedestrian",
      spec,
      art,
      lanes,
      lane: lanes?.[0] ?? null,
      // Starts paused at the first stop, part way through it.
      stop: 0,
      pause: spec.stops ? random(0.5, spec.stops[0].time[1]) : 0,
      step: 0,
      scriptTime: random(0, 2),
      distance: 0,
      speed: 0,
      cruise: random(6.5, 8.5),
      stride: 0,
      heading: spec.stops ? spec.stops[0].face : 0,
      pose: spec.stops?.[0].pose ?? spec.script?.[0][0] ?? null,
      poseWeight: 1,
      poseTime: random(0, 10),
      carrying: false,
      hop: 0,
      pos: spec.at && [...spec.at],
      face: 0,
      // `size` draws a person to a larger model's scale (the datacenter).
      size: (spec.kid ? CHILD_SIZE : 1) * (spec.size ?? 1),
      depth: -1,
      x: 0,
      y: 0,
      opacity: 1,
    };
  });
  for (const actor of actors) {
    dressPedestrian(
      actor.art,
      actors.map((other) => other.art.top),
    );
    if (actor.spec.kid) makeChild(actor.art);
  }

  // The children's ball and its shadow on the grass.
  const kids = actors.filter((actor) => actor.spec.kid);
  const hasGame = kids.length >= 2;
  const ball = {
    art: {
      element: svg(
        "g",
        { "clip-path": `url(#${map.id}-traffic-actor-6)` },
        layer,
      ),
    },
    depth: -1,
  };
  if (!hasGame) ball.art.element.remove();
  const ballShadow = svg(
    "ellipse",
    { fill: "#0b1014", "fill-opacity": 0.25 },
    ball.art.element,
  );
  const ballBody = svg(
    "circle",
    { r: 1.2, fill: "#d9473c", stroke: "#8e2a24", "stroke-width": 0.3 },
    ball.art.element,
  );
  // Catch: whoever holds the ball waits a moment (sometimes running to a new
  // spot first), throws it in an arc, and the other catches it with a hop.
  const game = {
    holder: 0,
    phase: "hold",
    timer: random(0.8, 1.6),
    flight: 0,
    duration: 1,
    arc: 8,
    from: [0, 0, 0],
    to: [0, 0, 0],
    target: null,
  };

  const paintOrder = [...traffic, ...actors, ...(hasGame ? [ball] : [])];
  const queue = [];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const counterPanel = root.querySelector(
    ".twin-dashboard [data-reading=cyclists]",
  );
  const counterPopover = root.querySelector(
    ".city-sensor-popover [data-reading=cyclists]",
  );
  const en = document.documentElement.lang.startsWith("en");
  let cyclistCount = 124;
  let counterPulse = 0;
  let inView = false;
  let frame = 0;
  let lastTime = 0;
  let clock = 0;

  function countCyclist() {
    cyclistCount += 1;
    if (counterPanel) {
      counterPanel.textContent = `${cyclistCount} ${en ? "today" : "danes"}`;
      counterPanel.classList.remove("is-counted");
      // Reflow only on the infrequent sensor event so each pass can pulse.
      void counterPanel.offsetWidth;
      counterPanel.classList.add("is-counted");
    }
    if (counterPopover) counterPopover.textContent = String(cyclistCount);
    clearTimeout(counterPulse);
    counterPulse = setTimeout(
      () => counterPanel?.classList.remove("is-counted"),
      650,
    );
  }

  const onLane = (lane, kind) =>
    traffic.filter(
      (other) => other.lane === lane && (!kind || other.kind === kind),
    );

  // Prefers quiet routes, keeps cars off routes where a cyclist has only just
  // set off, and never places anything on top of existing traffic.
  function chooseLane(entity) {
    let total = 0;
    const walking = entity.kind === "pedestrian";
    const weights = lanes.map((lane) => {
      if (lane.mode !== MODE[entity.kind]) return 0;
      const others = onLane(lane);
      if (others.some((other) => other.distance < 70)) return 0;
      // Walkers favour paths with a zebra crossing, so crossings are common.
      if (walking && lane.cells.length) {
        const weight =
          2.5 /
          (1 + others.filter((other) => other.kind === entity.kind).length);
        total += weight;
        return weight;
      }
      if (others.some((other) => other.distance < 70)) return 0;
      let weight =
        1 / (1 + others.filter((other) => other.kind === entity.kind).length);
      if (
        entity.kind === "car" &&
        others.some(
          (other) =>
            other.kind === "cyclist" && other.distance < lane.length * 0.45,
        )
      )
        weight *= 0.25;
      total += weight;
      return weight;
    });
    if (!total) return null;
    let roll = Math.random() * total;
    return lanes.find((lane, index) => (roll -= weights[index]) <= 0) ?? null;
  }

  function spawn(entity, lane, distance) {
    const art = entity.art;
    entity.lane = lane;
    entity.distance = distance;
    entity.cruise = random(...entity.settings.cruise);
    entity.speed = Math.min(
      entity.cruise,
      lane.limit[entity.kind][Math.floor(distance)],
    );
    entity.heading = lane.heading[Math.floor(distance)];
    entity.next = lane.cells.findIndex((item) => item.in > distance);
    if (entity.next < 0) entity.next = lane.cells.length;
    entity.until = entity.next;
    entity.stop = lane.stops
      ? lane.stops.findIndex((item) => item.at > distance)
      : -1;
    if (entity.stop < 0) entity.stop = lane.stops?.length ?? 0;
    entity.dwell = -1;
    entity.carrying = false;
    entity.poseWeight = 0;
    if (entity.kind === "boat") {
      const used = traffic
        .filter((other) => other.lane && other.kind === "boat")
        .map((other) => other.variant);
      entity.variant = pickBoat(lane, used);
      entity.half = styleBoat(art, entity.variant, lane);
      wakes?.start(
        entity,
        lane.occluders.map((key) => map.occluders[key]),
        art.beam,
      );
    } else if (entity.kind === "car") {
      const used = traffic
        .filter((other) => other.lane && other.kind === "car")
        .map((other) => other.variant);
      const unused = CAR_VARIANTS.filter((variant) => !used.includes(variant));
      entity.variant = pick(unused.length ? unused : CAR_VARIANTS);
      entity.half = styleCar(art, entity.variant);
    } else if (entity.kind === "pedestrian") {
      const taken = traffic
        .filter((other) => other.lane && other.kind === "pedestrian")
        .map((other) => other.art.top);
      entity.half = dressPedestrian(art, taken);
    } else {
      entity.half = styleCyclist(art);
    }
    art.element.setAttribute(...lane.clipAttribute);
    art.element.style.display = "";
  }

  function retire(entity) {
    if (entity.kind === "boat") wakes?.stop(entity);
    entity.depth = -1;
    for (const item of entity.lane?.cells ?? [])
      item.cell.holders.delete(entity);
    if (entity.queued) queue.splice(queue.indexOf(entity), 1);
    entity.queued = false;
    entity.lane = null;
    entity.art.element.style.display = "none";
    entity.wait = random(...entity.settings.respawn);
  }

  // Scatter the opening scene: some traffic already under way, the rest
  // arriving later. Nobody starts inside the junction or on another entity.
  for (const entity of traffic) {
    if (Math.random() < (entity.kind === "cyclist" ? 0.3 : 0.45)) {
      retire(entity);
      entity.wait = random(0.5, entity.kind === "car" ? 9 : 16);
      continue;
    }
    let placed = false;
    for (let attempt = 0; attempt < 20 && !placed; attempt++) {
      const choices = lanes.filter((item) => item.mode === MODE[entity.kind]);
      if (!choices.length) break;
      const lane = pick(choices);
      const distance = random(0.08, 0.85) * lane.length;
      const clear =
        onLane(lane).every(
          (other) => Math.abs(other.distance - distance) > 80,
        ) &&
        lane.cells.every(
          (item) => distance < item.in - 60 || distance > item.out + 30,
        ) &&
        !(
          entity.kind === "car" &&
          onLane(lane, "cyclist").some((other) => other.distance > distance)
        );
      if (clear) {
        spawn(entity, lane, distance);
        placed = true;
      }
    }
    if (!placed) retire(entity);
  }

  // Cells ahead that belong to the same crossing are requested together, so a
  // vehicle never holds one cell while waiting for another (no deadlock).
  function crossing(entity) {
    const cells = entity.lane.cells;
    let end = entity.next;
    while (end < cells.length && cells[end].in - cells[entity.next].in < 200)
      end++;
    return end;
  }

  function updateCrossings() {
    for (const entity of traffic) {
      const lane = entity.lane;
      if (!lane) continue;
      const cells = lane.cells;
      if (entity.kind === "pedestrian") {
        // A walker keeps the whole crossing until they are on the far
        // pavement, so traffic waits for them to cross completely.
        if (
          entity.next < entity.until &&
          entity.distance - entity.half > cells[entity.until - 1].out + 2
        )
          while (entity.next < entity.until)
            cells[entity.next++].cell.holders.delete(entity);
      } else
        while (
          entity.next < entity.until &&
          entity.distance - entity.half > cells[entity.next].out + 2
        )
          cells[entity.next++].cell.holders.delete(entity);
      if (
        entity.next < entity.until ||
        entity.next >= cells.length ||
        entity.queued
      )
        continue;
      const { brake, minGap } = entity.settings;
      const ahead = cells[entity.next].in - entity.distance - entity.half;
      if (ahead < (entity.speed * entity.speed) / (2 * brake) + minGap + 25) {
        entity.queued = true;
        queue.push(entity);
      }
    }
    // First come, first served. A request is granted when none of its cells
    // is held by another lane or wanted by another lane queued earlier.
    for (let i = 0; i < queue.length; i++) {
      const entity = queue[i];
      const cells = entity.lane.cells;
      const end = crossing(entity);
      let free = true;
      for (let c = entity.next; c < end && free; c++) {
        const cell = cells[c].cell;
        for (const holder of cell.holders)
          if (holder.lane !== entity.lane) free = false;
        for (let j = 0; j < i && free; j++) {
          const other = queue[j];
          if (other.lane === entity.lane) continue;
          for (let o = other.next, stop = crossing(other); o < stop; o++)
            if (other.lane.cells[o].cell === cell) free = false;
        }
      }
      if (!free) continue;
      for (let c = entity.next; c < end; c++) cells[c].cell.holders.add(entity);
      entity.until = end;
      entity.queued = false;
      queue.splice(i--, 1);
    }
  }

  // Intelligent Driver Model: smooth approach to cruise speed, bends, the
  // entity ahead on the same lane, and the junction stop line. Also leaves
  // the free distance ahead in `clearance`.
  let clearance = Infinity;
  function acceleration(entity, time) {
    const { accel, brake, minGap, headway } = entity.settings;
    const lane = entity.lane;
    const index = Math.max(
      0,
      Math.min(lane.length, Math.floor(entity.distance)),
    );
    // Two slow, incommensurate waves give each rider an individual rhythm.
    const drift =
      entity.kind === "car"
        ? 0.03 * Math.sin(time * 0.21 + entity.phase)
        : entity.kind === "pedestrian"
          ? 0.06 * Math.sin(time * 0.29 + entity.phase)
          : 0.045 * Math.sin(time * 0.37 + entity.phase) +
            0.02 * Math.sin(time * 0.93 + entity.phase * 1.7);
    const desired = Math.max(
      3,
      Math.min(entity.cruise * (1 + drift), lane.limit[entity.kind][index]),
    );
    let result = accel * (1 - (entity.speed / desired) ** 4);
    let gap = Infinity;
    let leaderSpeed = 0;
    let spacing = minGap;
    for (const other of traffic) {
      if (
        other === entity ||
        other.lane !== lane ||
        other.distance <= entity.distance
      )
        continue;
      const candidate =
        other.distance - entity.distance - other.half - entity.half;
      if (candidate < gap) {
        gap = candidate;
        leaderSpeed = other.speed;
        spacing =
          entity.kind === "car" && other.kind === "cyclist"
            ? minGap + 3
            : minGap;
      }
    }
    // Walkers on other paths merging or overtaking: fall in behind anyone
    // just ahead who is heading the same way.
    if (entity.kind === "pedestrian")
      for (const other of traffic) {
        if (other === entity || other.kind !== "pedestrian" || !other.lane)
          continue;
        if (
          other.lane === lane ||
          Math.cos(other.heading - entity.heading) < 0.3
        )
          continue;
        const s = depthScale(entity.y);
        const dx = (other.x - entity.x) / s;
        const dy = (other.y - entity.y) / (s * foreshortening(entity.y));
        const cos = Math.cos(entity.heading);
        const sin = Math.sin(entity.heading);
        const ahead = dx * cos + dy * sin;
        if (ahead <= 0 || ahead > 14 || Math.abs(dy * cos - dx * sin) > 2.6)
          continue;
        const candidate = ahead - other.half - entity.half;
        if (candidate < gap) {
          gap = candidate;
          leaderSpeed = other.speed;
          spacing = minGap;
        }
      }
    // A timed stop ahead (a landing, the fuel dock): come to rest on it.
    const timed = lane.stops?.[entity.stop];
    if (timed) {
      const stop = timed.at - entity.distance;
      if (stop < gap) {
        gap = Math.max(0, stop);
        leaderSpeed = 0;
        spacing = 0;
      }
    }
    if (entity.queued) {
      const stop =
        lane.cells[entity.next].in - entity.distance - entity.half - 1.5;
      if (stop < gap) {
        gap = stop;
        leaderSpeed = 0;
        spacing = 0.5;
      }
    }
    if (gap < Infinity) {
      const closing = entity.speed - leaderSpeed;
      const wanted =
        spacing +
        Math.max(
          0,
          entity.speed * headway +
            (entity.speed * closing) / (2 * Math.sqrt(accel * brake)),
        );
      result -= accel * (wanted / Math.max(gap, 0.5)) ** 2;
    }
    clearance = gap;
    return Math.max(-2.5 * brake, result);
  }

  // Scripted people: stroll between stops and do something at each, or, at
  // the fountain, run through a loop of reactions.
  function updateActors(delta) {
    for (const actor of actors) {
      const { spec } = actor;
      actor.poseTime += delta;
      if (spec.kid) continue;
      if (spec.script) {
        actor.scriptTime += delta;
        let [pose, duration] = spec.script[actor.step];
        if (actor.scriptTime > duration) {
          actor.scriptTime = 0;
          actor.step = (actor.step + 1) % spec.script.length;
          [pose, duration] = spec.script[actor.step];
        }
        actor.pose = pose;
        actor.poseWeight = Math.min(1, actor.poseWeight + delta * 3);
        actor.hop =
          pose === "wave" ? 0.45 * Math.abs(Math.sin(actor.poseTime * 6.5)) : 0;
        continue;
      }
      const stop = spec.stops[actor.stop];
      if (actor.pause > 0) {
        actor.pause -= delta;
        actor.speed = 0;
        actor.pose = stop.pose ?? actor.pose;
        actor.poseWeight = stop.pose
          ? Math.min(1, actor.poseWeight + delta * 3)
          : Math.max(0, actor.poseWeight - delta * 3);
        if (actor.pause <= 0) {
          if (stop.carry !== undefined) actor.carrying = stop.carry;
          actor.lane = actor.lanes[actor.stop === 0 ? 0 : 1];
          actor.distance = 0;
        }
        continue;
      }
      // Walking: a box is carried in both hands, otherwise arms swing.
      actor.pose = actor.carrying ? "carry" : actor.pose;
      actor.poseWeight = actor.carrying
        ? Math.min(1, actor.poseWeight + delta * 3)
        : Math.max(0, actor.poseWeight - delta * 3);
      actor.speed = Math.min(actor.cruise, actor.speed + 3 * delta);
      const step = actor.speed * delta;
      actor.distance += step;
      actor.stride += step;
      if (actor.distance >= actor.lane.length) {
        actor.distance = actor.lane.length;
        actor.stop = actor.stop === 0 ? 1 : 0;
        actor.pause = random(...spec.stops[actor.stop].time);
      }
    }
  }

  // Where a child's hands hold the ball, in world units.
  function handsOf(kid) {
    const s = depthScale(kid.pos[1]);
    const reach = 1.2 * PEDESTRIAN_SIZE * CHILD_SIZE * s;
    return [
      kid.pos[0] + reach * Math.cos(kid.heading),
      kid.pos[1] + reach * foreshortening(kid.pos[1]) * Math.sin(kid.heading),
      (9.2 + kid.hop) * PEDESTRIAN_SIZE * CHILD_SIZE,
    ];
  }

  function updateGame(delta) {
    const holder = kids[game.holder];
    const other = kids[1 - game.holder];
    for (const kid of kids) {
      kid.hop = Math.max(0, kid.hop - delta * 2.5);
      kid.speed = 0;
    }
    const facing = (kid, [x, y]) =>
      Math.atan2((y - kid.pos[1]) / foreshortening(kid.pos[1]), x - kid.pos[0]);
    if (game.phase === "run") {
      // Run with the ball to a new spot on the lawn.
      const [tx, ty] = game.target;
      const s = depthScale(holder.pos[1]);
      const dx = (tx - holder.pos[0]) / s;
      const dy = (ty - holder.pos[1]) / (s * foreshortening(holder.pos[1]));
      const left = Math.hypot(dx, dy);
      const step = Math.min(left, 12 * delta);
      holder.pos[0] += (dx / (left || 1)) * step * s;
      holder.pos[1] +=
        (dy / (left || 1)) * step * s * foreshortening(holder.pos[1]);
      holder.stride += step * 1.6;
      holder.speed = 12;
      holder.face = facing(holder, game.target);
      if (left < 0.5) {
        game.phase = "hold";
        game.timer = random(0.5, 1.1);
      }
    } else if (game.phase === "hold") {
      holder.face = facing(holder, other.pos);
      game.timer -= delta;
      if (game.timer <= 0) {
        game.phase = "flight";
        game.flight = 0;
        game.from = handsOf(holder);
        game.duration = random(0.9, 1.25);
        game.arc = random(5, 9);
        holder.pose = "throw";
        holder.poseTime = 0;
      }
    } else {
      game.flight += delta;
      other.pose = "catch";
      other.face = facing(other, holder.pos);
      game.to = handsOf(other);
      if (game.flight >= game.duration) {
        game.holder = 1 - game.holder;
        other.hop = 0.9;
        game.phase = "hold";
        game.timer = random(0.7, 1.6);
        // Sometimes run off with the ball before throwing it back.
        if (Math.random() < 0.35) {
          const [a, b, c, d] = LAWN;
          const u = random(0.1, 0.9);
          const v = random(0.15, 0.85);
          game.target = [
            (a[0] + (b[0] - a[0]) * u) * (1 - v) +
              (d[0] + (c[0] - d[0]) * u) * v,
            (a[1] + (b[1] - a[1]) * u) * (1 - v) +
              (d[1] + (c[1] - d[1]) * u) * v,
          ];
          game.phase = "run";
        }
      }
    }
    // The thrower follows through, then both settle to holding or waiting.
    if (holder.pose === "throw" && game.phase !== "flight") holder.pose = null;
    const current = kids[game.holder];
    if (game.phase !== "flight") current.pose = "ready";
    for (const kid of kids) {
      kid.poseWeight = kid.pose
        ? Math.min(1, kid.poseWeight + delta * 5)
        : Math.max(0, kid.poseWeight - delta * 3);
      if (kid !== current && game.phase !== "flight") kid.pose = null;
    }
  }

  function drawBall() {
    let x;
    let y;
    let h;
    if (game.phase === "flight") {
      const u = Math.min(1, game.flight / game.duration);
      [x, y, h] = game.from.map((value, i) => value + (game.to[i] - value) * u);
      h += 4 * game.arc * u * (1 - u);
    } else [x, y, h] = handsOf(kids[game.holder]);
    const s = depthScale(y);
    const k = foreshortening(y);
    ballShadow.setAttribute("cx", f2(x));
    ballShadow.setAttribute("cy", f2(y));
    ballShadow.setAttribute("rx", f2(1.4 * s));
    ballShadow.setAttribute("ry", f2(1.4 * s * k));
    ballBody.setAttribute(
      "transform",
      `translate(${f2(x)} ${f2(y - h * RISE * s)}) scale(${f3(s)})`,
    );
    ball.depth = y + 0.5;
  }

  function update(delta) {
    clock += delta;
    for (const entity of traffic) {
      if (entity.lane) continue;
      entity.wait -= delta;
      if (entity.wait > 0) continue;
      const lane = chooseLane(entity);
      if (lane) spawn(entity, lane, 0);
      else entity.wait = 1.2;
    }
    updateActors(delta);
    if (hasGame) updateGame(delta);
    updateCrossings();
    for (const entity of traffic) {
      if (!entity.lane) continue;
      const value = acceleration(entity, clock);
      const previous = entity.distance;
      entity.speed = Math.max(0, entity.speed + value * delta);
      // Waiting at a timed stop, then on to the next one.
      const timed = entity.lane.stops?.[entity.stop];
      if (timed && entity.distance >= timed.at - 1.5 && entity.speed < 1) {
        if (entity.dwell < 0) entity.dwell = timed.time;
        entity.dwell -= delta;
        entity.speed = 0;
        if (entity.dwell <= 0) {
          if (timed.carry !== undefined) entity.carrying = timed.carry;
          entity.stop++;
          entity.dwell = -1;
        }
      }
      if (entity.kind === "pedestrian") {
        // Busy at a stop (reaching for a shelf, paying), or carrying a box.
        const pose =
          (entity.dwell >= 0 && timed?.pose) ||
          (entity.carrying ? "carry" : null);
        entity.pose = pose ?? entity.pose;
        entity.poseTime += delta;
        entity.poseWeight = pose
          ? Math.min(1, entity.poseWeight + delta * 3)
          : Math.max(0, entity.poseWeight - delta * 3);
      }
      const step = Math.min(entity.speed * delta, Math.max(0, clearance));
      entity.distance += step;
      entity.stride += step;
      const braking = value < -6 && entity.speed > 1;
      if (entity.kind === "car" && braking !== entity.braking)
        for (const lamp of entity.art.tails)
          lamp.setAttribute("fill-opacity", braking ? 1 : 0.6);
      entity.braking = braking;
      const counter = entity.lane.counter;
      if (
        entity.kind === "cyclist" &&
        counter !== undefined &&
        previous < counter &&
        entity.distance >= counter
      )
        countCyclist();
      if (entity.distance >= entity.lane.length) retire(entity);
    }
  }

  function render(delta) {
    for (const entity of traffic) {
      const lane = entity.lane;
      if (!lane) continue;
      const index = Math.min(lane.length - 1, Math.floor(entity.distance));
      const t = entity.distance - index;
      let x = lane.x[index] + (lane.x[index + 1] - lane.x[index]) * t;
      let y = lane.y[index] + (lane.y[index + 1] - lane.y[index]) * t;
      // At a stop a walker turns to what they came for.
      const facing = entity.dwell >= 0 && lane.stops?.[entity.stop]?.face;
      const target =
        typeof facing === "number"
          ? facing
          : lane.heading[index] +
            angleDelta(lane.heading[index], lane.heading[index + 1]) * t;
      entity.heading +=
        angleDelta(entity.heading, target) *
        (delta ? 1 - Math.exp(-delta * (entity.dwell >= 0 ? 4 : 18)) : 1);
      const s = depthScale(y);
      const k = foreshortening(y);
      const cos = Math.cos(entity.heading);
      const sin = Math.sin(entity.heading);
      if (entity.kind !== "car") {
        const offset =
          lane.offset[index] +
          (lane.offset[index + 1] - lane.offset[index]) * t +
          (entity.kind === "cyclist"
            ? 0.3 * Math.sin(clock * 1.6 + entity.phase)
            : 0);
        x -= s * sin * offset;
        y += s * k * cos * offset;
      }
      entity.x = x;
      entity.y = y;
      // Cyclists and walkers are drawn a touch over scale to stay legible.
      const size =
        s *
        (entity.kind === "cyclist"
          ? CYCLIST_SIZE
          : entity.kind === "pedestrian"
            ? PEDESTRIAN_SIZE
            : 1);
      const a = f3(size * cos);
      const b = f3(size * k * sin);
      const c = f3(-size * sin);
      const d = f3(size * k * cos);
      const ground = (height) =>
        `matrix(${a} ${b} ${c} ${d} ${f2(x)} ${f2(y - height * RISE * size)})`;
      const art = entity.art;
      if (entity.kind === "car") {
        for (const item of art.layers)
          item.node.setAttribute("transform", ground(item.height));
      } else if (entity.kind === "boat") {
        // Riding the swell, leaving a wake in the water.
        wakes?.track(entity, x, y, s, k, clock);
        const bob =
          0.5 * Math.sin(clock * 1.7 + entity.phase) +
          0.25 * Math.sin(clock * 2.9 + entity.phase * 2);
        for (const item of art.layers)
          item.node.setAttribute(
            "transform",
            ground(item.height + (item.height > 0 ? bob : 0)),
          );
        const lift = f2(y - bob * RISE * size);
        for (const item of art.profiles)
          item.node.setAttribute(
            "transform",
            `matrix(${a} ${b} 0 ${f3(RISE * size)} ${f2(x)} ${lift})`,
          );
      } else if (entity.kind === "pedestrian") {
        drawPedestrian(entity, x, y, size, k, cos, sin, ground);
      } else {
        art.shadow.setAttribute("transform", ground(0));
        art.spine.setAttribute("transform", ground(2.6));
        art.profile.setAttribute(
          "transform",
          `matrix(${a} ${b} 0 ${f3(-RISE * size)} ${f2(x)} ${f2(y)})`,
        );
        art.legs.setAttribute("transform", ground(4.4));
        art.hips.setAttribute("transform", ground(7.2));
        art.back[0].setAttribute("transform", ground(8.4));
        art.back[1].setAttribute("transform", ground(9.8));
        art.head.setAttribute(
          "transform",
          `translate(${f2(x + 2.9 * size * cos)} ${f2(y + 2.9 * size * k * sin - 11.6 * RISE * size)}) scale(${f3(size)})`,
        );
      }
      entity.depth = y;
    }
    for (const actor of actors) {
      let x;
      let y;
      let target;
      if (actor.spec.kid) {
        [x, y] = actor.pos;
        target = actor.face;
      } else if (actor.spec.at) {
        [x, y] = actor.pos;
        // Face the jet, or the companion while talking.
        const [tx, ty] =
          actor.pose === "talk" ? actors[actor.spec.partner].pos : FOUNTAIN_JET;
        target = Math.atan2((ty - y) / foreshortening(y), tx - x);
      } else {
        const lane = actor.lane;
        const index = Math.min(lane.length - 1, Math.floor(actor.distance));
        const t = Math.min(1, actor.distance - index);
        x = lane.x[index] + (lane.x[index + 1] - lane.x[index]) * t;
        y = lane.y[index] + (lane.y[index + 1] - lane.y[index]) * t;
        target =
          actor.pause > 0
            ? actor.spec.stops[actor.stop].face
            : lane.heading[index];
      }
      // Turning on the spot is slower than following a path.
      actor.heading +=
        angleDelta(actor.heading, target) *
        (delta ? 1 - Math.exp(-delta * (actor.speed > 0.5 ? 12 : 4)) : 1);
      const s = depthScale(y);
      const k = foreshortening(y);
      const cos = Math.cos(actor.heading);
      const sin = Math.sin(actor.heading);
      const size = s * PEDESTRIAN_SIZE * actor.size;
      const a = f3(size * cos);
      const b = f3(size * k * sin);
      const c = f3(-size * sin);
      const d = f3(size * k * cos);
      const ground = (height) =>
        `matrix(${a} ${b} ${c} ${d} ${f2(x)} ${f2(y - height * RISE * size)})`;
      actor.x = x;
      actor.y = y;
      drawPedestrian(actor, x, y, size, k, cos, sin, ground);
      actor.depth = y;
    }
    if (hasGame) drawBall();
    wakes?.draw(clock);
    // Nearer traffic (lower on screen) paints over traffic behind it; the
    // DOM is only reordered when two entities actually swap depth.
    let sorted = true;
    for (let i = 1; i < paintOrder.length; i++)
      if (paintOrder[i].depth < paintOrder[i - 1].depth) sorted = false;
    if (!sorted) {
      paintOrder.sort((p, q) => p.depth - q.depth);
      for (const entity of paintOrder) layer.appendChild(entity.art.element);
    }
  }

  function tick(time) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    update(delta);
    render(delta);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const shouldRun = inView && !document.hidden && !motion.matches;
    if (shouldRun && !frame) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!shouldRun && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  // Reduced motion keeps the opening scene as a still.
  render(0);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  return (visible) => {
    inView = visible;
    sync();
  };
}
