// Miniature traffic for the digital-twin maquette photo.
// Geometry uses the photo's 1536 × 1024 viewBox. Distances, sizes and speeds
// are in "ground units": photo pixels measured on the board at mid-depth.

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

// Lanes closer than this (ground units, centre to centre) are in conflict.
const CONFLICT_DISTANCE = 15;
// CYCLE_COUNT_01 watches the north road just above the junction crosswalk.
const COUNTER = { y: 300, minX: 740, maxX: 790 };

const CAR_BODIES = {
  sedan: {
    length: 33,
    width: 13.5,
    belt: 6,
    roof: 10.5,
    cabin: [-9.5, 5.5],
    top: [-7.5, 3],
  },
  hatch: {
    length: 30,
    width: 13,
    belt: 6,
    roof: 10.8,
    cabin: [-12.5, 4.5],
    top: [-11.6, 2],
  },
  suv: {
    length: 34,
    width: 14.5,
    belt: 7.5,
    roof: 12.5,
    cabin: [-14.5, 5.5],
    top: [-13.8, 2.5],
  },
  van: {
    length: 36,
    width: 14.5,
    belt: 7.5,
    roof: 14,
    cabin: [-17.5, 10],
    top: [-17, 7.5],
  },
};
const CAR_VARIANTS = [
  { body: "sedan", paint: "#d9d4c9", side: "#a9a499", roof: "#e3dfd5" },
  { body: "hatch", paint: "#8d9295", side: "#676c70", roof: "#979c9f" },
  { body: "sedan", paint: "#35465e", side: "#253041", roof: "#3d5069" },
  { body: "hatch", paint: "#8f4038", side: "#672e29", roof: "#98463e" },
  { body: "suv", paint: "#2a2d30", side: "#191b1d", roof: "#33373a" },
  { body: "van", paint: "#c3c3bd", side: "#95958f", roof: "#cdcdc7" },
  { body: "suv", paint: "#6d7470", side: "#4d5350", roof: "#777e7a" },
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
};
const CAR_COUNT = 5;
const CYCLIST_COUNT = 3;
const CYCLIST_SIZE = 1.15;

const random = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const f2 = (value) => Math.round(value * 100) / 100;
const f3 = (value) => Math.round(value * 1000) / 1000;
const angleDelta = (from, to) =>
  Math.atan2(Math.sin(to - from), Math.cos(to - from));

// Every stretch where two lanes cross or merge becomes a shared cell; each
// lane records where (in ground distance) it enters and leaves the cell.
function findConflicts(lanes) {
  for (const lane of lanes) lane.cells = [];
  for (let p = 0; p < lanes.length; p++)
    for (let q = p + 1; q < lanes.length; q++) {
      const [first, second] = [lanes[p], lanes[q]];
      const hits = [];
      // Bucket the second lane on a coarse grid so only nearby samples are
      // compared.
      const grid = new Map();
      const key = (x, y) => Math.floor(x / 40) * 100 + Math.floor(y / 40);
      for (let j = 0; j <= second.length; j += 3) {
        const cell = key(second.x[j], second.y[j]);
        if (!grid.has(cell)) grid.set(cell, []);
        grid.get(cell).push(j);
      }
      for (let i = 0; i <= first.length; i += 3) {
        const near = [];
        for (let gx = -1; gx <= 1; gx++)
          for (let gy = -1; gy <= 1; gy++)
            near.push(
              ...(grid.get(key(first.x[i], first.y[i]) + gx * 100 + gy) ?? []),
            );
        let closest = Infinity;
        let match = 0;
        for (const j of near) {
          const my = (first.y[i] + second.y[j]) / 2;
          const s = depthScale(my);
          const gap = Math.hypot(
            (first.x[i] - second.x[j]) / s,
            (first.y[i] - second.y[j]) / (s * foreshortening(my)),
          );
          if (gap < closest) {
            closest = gap;
            match = j;
          }
        }
        if (closest < CONFLICT_DISTANCE) hits.push([i, match]);
      }
      let cluster = null;
      const close = () => {
        if (!cluster) return;
        const cell = { holders: new Set() };
        // Nearest-point matching is narrow along each lane; pad both spans.
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
  for (const lane of lanes) lane.cells.sort((a, b) => a.in - b.in);
}

// Centripetal Catmull-Rom through the waypoints, resampled every ground unit.
function buildRoute(name, route) {
  const points = route.points;
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
    limit: { car: new Float32Array(count), cyclist: new Float32Array(count) },
    clipId: `city-traffic-clip-${name}`,
    occluders: route.occluders,
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
  for (let i = 0; i < count; i++) {
    const x = lane.x[i];
    const y = lane.y[i];
    if (
      lane.counter === undefined &&
      i > 0 &&
      x >= COUNTER.minX &&
      x <= COUNTER.maxX &&
      (lane.y[i - 1] - COUNTER.y) * (y - COUNTER.y) <= 0
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

// Cars are stacked horizontal slices (shadow, sills, body, lamps, glass,
// roof) projected through the camera model, so each reads as a small solid.
function createCar(layer) {
  const element = svg("g", { class: "city-traffic-car" }, layer);
  const slice = (node) => ({ node, height: 0 });
  const shadow = slice(svg("g", {}, element));
  const shade = svg(
    "rect",
    { fill: "#0b1014", "fill-opacity": 0.13 },
    shadow.node,
  );
  const contact = svg(
    "rect",
    { fill: "#0b1014", "fill-opacity": 0.22 },
    shadow.node,
  );
  const under = slice(svg("rect", { fill: "#15191c" }, element));
  const sides = [0, 1, 2].map(() => slice(svg("rect", {}, element)));
  const lamps = slice(svg("g", {}, element));
  const heads = [0, 1].map(() => svg("rect", { fill: "#f3e3bd" }, lamps.node));
  const tails = [0, 1].map(() =>
    svg("rect", { fill: "#b5332b", "fill-opacity": 0.6 }, lamps.node),
  );
  const top = slice(
    svg(
      "rect",
      { stroke: "#0b1014", "stroke-opacity": 0.28, "stroke-width": 0.35 },
      element,
    ),
  );
  const glass = [0, 1].map((index) =>
    slice(svg("rect", { fill: index ? "#34434d" : "#1c262d" }, element)),
  );
  const roof = slice(
    svg(
      "rect",
      { stroke: "#0b1014", "stroke-opacity": 0.22, "stroke-width": 0.3 },
      element,
    ),
  );
  const layers = [shadow, under, ...sides, lamps, top, ...glass, roof];
  return {
    element,
    layers,
    shade,
    contact,
    under,
    sides,
    lamps,
    heads,
    tails,
    top,
    glass,
    roof,
  };
}

function styleCar(car, variant) {
  const body = CAR_BODIES[variant.body];
  const { length: l, width: w, belt } = body;
  const rect = (node, x0, x1, y0, y1, radius) => {
    node.setAttribute("x", f2(x0));
    node.setAttribute("y", f2(y0));
    node.setAttribute("width", f2(x1 - x0));
    node.setAttribute("height", f2(y1 - y0));
    node.setAttribute("rx", radius);
  };
  rect(car.shade, -l / 2 - 1.5, l / 2 + 1.5, -w / 2 - 1.5, w / 2 + 1.5, 5.5);
  rect(car.contact, -l / 2 - 0.3, l / 2 + 0.3, -w / 2 - 0.3, w / 2 + 0.3, 3.5);
  rect(
    car.under.node,
    -l / 2 + 0.8,
    l / 2 - 0.8,
    -w / 2 + 0.3,
    w / 2 - 0.3,
    2.5,
  );
  car.under.height = 0.6;
  car.sides.forEach((side, index) => {
    rect(side.node, -l / 2, l / 2, -w / 2, w / 2, 2.2);
    side.node.setAttribute("fill", variant.side);
    side.height = 1.6 + ((belt - 2.7) * index) / 2;
  });
  // Lamps sit just under the body top, so they only show on the end facing
  // the camera.
  car.lamps.height = belt - 1.5;
  car.heads.forEach((lamp, index) =>
    rect(
      lamp,
      l / 2 - 1.4,
      l / 2 - 0.1,
      index ? w / 2 - 3.2 : -w / 2 + 1,
      index ? w / 2 - 1 : -w / 2 + 3.2,
      0.6,
    ),
  );
  car.tails.forEach((lamp, index) =>
    rect(
      lamp,
      -l / 2 + 0.1,
      -l / 2 + 1.3,
      index ? w / 2 - 3 : -w / 2 + 1,
      index ? w / 2 - 1 : -w / 2 + 3,
      0.6,
    ),
  );
  rect(car.top.node, -l / 2, l / 2, -w / 2, w / 2, 2.4);
  car.top.node.setAttribute("fill", variant.paint);
  car.top.height = belt;
  rect(
    car.glass[0].node,
    body.cabin[0],
    body.cabin[1],
    -w / 2 + 0.7,
    w / 2 - 0.7,
    2.4,
  );
  car.glass[0].height = belt + 0.9;
  rect(
    car.glass[1].node,
    body.cabin[0] + 0.6,
    body.cabin[1] - 0.8,
    -w / 2 + 1,
    w / 2 - 1,
    2.2,
  );
  car.glass[1].height = (belt + body.roof) / 2 + 0.5;
  rect(car.roof.node, body.top[0], body.top[1], -w / 2 + 1.3, w / 2 - 1.3, 2);
  car.roof.node.setAttribute("fill", variant.roof);
  car.roof.height = body.roof;
  return l / 2;
}

// Cyclists combine a side profile drawn in the vertical plane of travel with
// ground-plane slices that keep their width when seen end-on.
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

export function initTraffic(root) {
  const scene = root.querySelector("[data-city-art]");
  const layer = scene?.querySelector("[data-traffic-layer]");
  if (!layer) return;
  let setInView = null;
  // Routes and artwork are only built once the maquette nears the viewport.
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) setInView ??= startTraffic(root, layer);
      setInView?.(entry.isIntersecting);
    },
    { rootMargin: "200px" },
  ).observe(scene);
}

function startTraffic(root, layer) {
  const host = layer.ownerSVGElement;

  const lanes = Object.entries(ROUTES).map(([name, route]) =>
    buildRoute(name, route),
  );
  const defs = svg("defs", {}, null);
  host.insertBefore(defs, host.firstChild);
  for (const lane of lanes) {
    const clip = svg(
      "clipPath",
      { id: lane.clipId, clipPathUnits: "userSpaceOnUse" },
      defs,
    );
    const holes = lane.occluders.map((key) => `M${OCCLUDERS[key]}Z`).join("");
    svg("path", { d: BOARD + holes, "clip-rule": "evenodd" }, clip);
  }
  findConflicts(lanes);

  const traffic = [];
  for (let i = 0; i < CAR_COUNT + CYCLIST_COUNT; i++) {
    const kind = i < CAR_COUNT ? "car" : "cyclist";
    const art = kind === "car" ? createCar(layer) : createCyclist(layer);
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
      phase: random(0, 100),
    });
  }

  const paintOrder = [...traffic];
  const queue = [];
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const counterPanel = root.querySelector("#sensor-cyclists");
  const counterPopover = root.querySelector("#city-popover-cyclists-value");
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
    const weights = lanes.map((lane) => {
      const others = onLane(lane);
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
    if (entity.kind === "car") {
      const used = traffic
        .filter((other) => other.lane && other.kind === "car")
        .map((other) => other.variant);
      entity.variant = pick(
        CAR_VARIANTS.filter((variant) => !used.includes(variant)),
      );
      entity.half = styleCar(art, entity.variant);
    } else {
      entity.half = styleCyclist(art);
    }
    art.element.setAttribute("clip-path", `url(#${lane.clipId})`);
    art.element.style.display = "";
  }

  function retire(entity) {
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
    if (Math.random() < (entity.kind === "car" ? 0.45 : 0.3)) {
      retire(entity);
      entity.wait = random(0.5, entity.kind === "car" ? 9 : 16);
      continue;
    }
    let placed = false;
    for (let attempt = 0; attempt < 20 && !placed; attempt++) {
      const lane = pick(lanes);
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
    updateCrossings();
    for (const entity of traffic) {
      if (!entity.lane) continue;
      const value = acceleration(entity, clock);
      const previous = entity.distance;
      entity.speed = Math.max(0, entity.speed + value * delta);
      entity.distance += Math.min(entity.speed * delta, Math.max(0, clearance));
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
      const target =
        lane.heading[index] +
        angleDelta(lane.heading[index], lane.heading[index + 1]) * t;
      entity.heading +=
        angleDelta(entity.heading, target) *
        (delta ? 1 - Math.exp(-delta * 18) : 1);
      const s = depthScale(y);
      const k = foreshortening(y);
      const cos = Math.cos(entity.heading);
      const sin = Math.sin(entity.heading);
      if (entity.kind === "cyclist") {
        const offset =
          lane.offset[index] +
          (lane.offset[index + 1] - lane.offset[index]) * t +
          0.3 * Math.sin(clock * 1.6 + entity.phase);
        x -= s * sin * offset;
        y += s * k * cos * offset;
      }
      // Cyclists are drawn a touch over scale so they stay legible.
      const size = entity.kind === "cyclist" ? s * CYCLIST_SIZE : s;
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
