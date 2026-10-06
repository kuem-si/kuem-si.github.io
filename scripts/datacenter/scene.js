// Three.js model of the datacenter maquette, rendered in a headless browser by
// scripts/generate-datacenter-maquette.mjs.
//
// One building of three levels, cut in steps: each level is open from where
// the level above ends, so the model reads as a floor plan from above and as
// a section from the front. Every level has a row of water-cooled racks on a
// raised floor, with the cooling water's pipes in the floor void. It stands on
// the marina's board and uses its materials, camera, lighting and
// post-processing (scripts/marina/scene.js), so all maquettes share one
// geometry and one look. The model is at about 1:90, larger than the other
// maquettes, so that each rack can carry its own sensor. World units are
// millimetres: x to the right, y towards the viewer, z up.

import {
  THREE,
  buildBase,
  makeMaterials,
  rngOf,
  worldUV,
} from "../marina/scene.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export {
  THREE,
  makeCamera,
  makeComposer,
  makeRenderer,
  light,
  projector,
  setDevice,
} from "../marina/scene.js";

// ---------------------------------------------------------------------------
// Layout (mm). The building stands across the back of the board, with the
// cooling towers beside it; in front are the forecourt with its car park and
// the generator, fuel tank and transformer.
export const LAYOUT = {
  building: { x0: 50, x1: 480, back: 160 },
  storey: 40,
  slab: 4,
  // Height of the raised floor above the slab.
  raised: 8,
  // Levels, bottom up: the slab's top, where the level above ends (the level
  // is open from there) and its cut front.
  levels: [
    { z: 2, open: 380, front: 470 },
    { z: 42, open: 290, front: 380 },
    { z: 82, open: 200, front: 290 },
  ],
  // The partition between the data hall and the room beside it.
  partition: 372,
  // Racks alternate with in-row coolers; y is measured from `open`.
  racks: { count: 10, x0: 96, width: 12, cooler: 9, y: [36, 48], height: 24 },
};
const { building: B, levels: LEVELS, racks: RACKS } = LAYOUT;
const rackX = (index) =>
  RACKS.x0 + RACKS.cooler + index * (RACKS.width + RACKS.cooler);

// Devices: switchable lighting.
export const DEVICES = [
  "FLOOR_01",
  "FLOOR_02",
  "FLOOR_03",
  "LAMP_01",
  "LAMP_02",
  "LAMP_03",
];
const YARD_LAMPS = {
  LAMP_01: [30, 508],
  LAMP_02: [326, 562],
  LAMP_03: [496, 476],
};

// Sensor pins, the light sensor and the gateway (world points): a temperature
// and humidity sensor on every rack (r101 is level 1, rack 01) and a leak
// detector in every level's floor void.
export const SENSORS = {
  lux: [404, 196, 127],
  gateway: [446, 180, 134],
  cooling: [455, 400, 35],
  power: [410, 338, 74],
};
LEVELS.forEach(({ z, open, front }, level) => {
  const top = z + LAYOUT.raised + RACKS.height;
  for (let index = 0; index < RACKS.count; index++)
    SENSORS[`r${level + 1}${String(index + 1).padStart(2, "0")}`] = [
      rackX(index) + RACKS.width / 2,
      open + RACKS.y[1],
      top - 1.6,
    ];
  SENSORS[`leak-${level + 1}`] = [340, front - 1, z + 3.5];
});

// ---------------------------------------------------------------------------
let random = rngOf(20261006);
const rand = (a, b) => a + random() * (b - a);
const pick = (list) => list[Math.floor(random() * list.length)];

function place(object, x, y, z = 0, heading = 0) {
  object.position.set(x, z, y);
  object.rotation.y = -heading;
  return object;
}

// Texture painted on a canvas of the given size.
function painted(width, height, paint) {
  const element = document.createElement("canvas");
  element.width = width;
  element.height = height;
  paint(element.getContext("2d"), width, height);
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

// ---------------------------------------------------------------------------
export function buildScene() {
  random = rngOf(20261006);
  const scene = new THREE.Scene();
  const M = makeMaterials();
  const world = {
    devices: Object.fromEntries(
      DEVICES.map((id) => [id, { lights: [], emissive: [], meshes: [] }]),
    ),
    occluders: [],
    staticLights: [],
  };
  const add = (object, parent = scene) => {
    parent.add(object);
    return object;
  };
  const mesh = (geometry, material, { cast = true, receive = true } = {}) => {
    const item = new THREE.Mesh(geometry, material);
    item.castShadow = cast;
    item.receiveShadow = receive;
    return item;
  };
  // Box by world extents.
  const box = (x0, y0, x1, y1, z0, z1, material, options) => {
    const item = mesh(
      new THREE.BoxGeometry(x1 - x0, z1 - z0, y1 - y0),
      material,
      options,
    );
    item.position.set((x0 + x1) / 2, (z0 + z1) / 2, (y0 + y1) / 2);
    return item;
  };
  // Flat polygon at height z (world points).
  const slab = (points, z0, z1, material, options) => {
    const shape = new THREE.Shape(
      points.map(([x, y]) => new THREE.Vector2(x, -y)),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: z1 - z0,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, z0, 0);
    return mesh(geometry, material, options);
  };
  const rect = (x0, y0, x1, y1) => [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
  // Pipe or tank lying along x (or along y), centred on (x, y, z).
  const tube = (radius, length, material, along = "x") => {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 14);
    if (along === "x") geometry.rotateZ(Math.PI / 2);
    else if (along === "y") geometry.rotateX(Math.PI / 2);
    return mesh(geometry, material);
  };
  // Emissive glass that follows a device.
  const litGlass = (color, intensity, device) => {
    const material = new THREE.MeshStandardMaterial({
      color: "#2a2620",
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.25,
    });
    material.userData.on = { intensity };
    world.devices[device].emissive.push(material);
    return material;
  };
  const occluder = (object, kind) => {
    world.occluders.push({ object, kind });
    return object;
  };
  const flat = { cast: false };
  const plain = (color, roughness = 0.7, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  // A material that glows where `glow` is painted.
  const lit = (map, glow, intensity, roughness = 0.45) =>
    new THREE.MeshStandardMaterial({
      map,
      emissive: "#ffffff",
      emissiveMap: glow,
      emissiveIntensity: intensity,
      roughness,
    });
  // Box faces in the order of BoxGeometry's groups.
  const faces = ({ east, west, top, front, back, rest }) => [
    east ?? rest,
    west ?? rest,
    top ?? rest,
    rest,
    front ?? rest,
    back ?? rest,
  ];
  const part = (group, ...args) => group.add(box(...args));

  buildBase(add, mesh, box);

  const { storey: STOREY, slab: SLAB, raised: RAISED } = LAYOUT;
  const WALL = 2.6;
  const ix0 = B.x0 + WALL;
  const ix1 = B.x1 - WALL;
  const TOP = LEVELS[2].z + STOREY;
  const tiles = painted(128, 128, (g, w, h) => {
    g.fillStyle = "#c9cdcd";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#aeb3b4";
    for (const p of [0, 64]) {
      g.fillRect(p, 0, 2, h);
      g.fillRect(0, p, w, 2);
    }
  });
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  const X = {
    // Where the building is cut through.
    cut: plain("#2c2e30", 0.8),
    wall: plain("#d3d7d9", 0.65),
    concrete: new THREE.MeshStandardMaterial({
      color: "#9ea3a2",
      map: M.stuccoMap,
      roughness: 0.7,
      userData: { scale: 60 },
    }),
    tile: new THREE.MeshStandardMaterial({
      map: tiles,
      roughness: 0.42,
      userData: { scale: 15 },
    }),
    vent: plain("#7d8486", 0.6, 0.3),
    steel: plain("#3f5c75", 0.5, 0.3),
    rack: plain("#1b1e21", 0.5, 0.3),
    rackTop: plain("#262a2e", 0.55, 0.3),
    machine: plain("#dfe2e3", 0.45),
    machineDark: plain("#3b4044", 0.5, 0.3),
    accent: plain("#2f6f9f", 0.5),
    chilled: plain("#f4f6f7", 0.35),
    supply: plain("#2f7fc4", 0.4, 0.2),
    return: plain("#c8452f", 0.4, 0.2),
    cable: plain("#e6b422", 0.55),
    gas: plain("#b5332d", 0.45, 0.2),
    desk: plain("#b99a72", 0.7),
    genset: plain("#56655c", 0.55, 0.3),
    yard: new THREE.MeshStandardMaterial({
      color: "#a9a69d",
      map: M.stuccoMap,
      normalMap: M.stuccoNormal,
      roughness: 0.95,
      userData: { scale: 55 },
    }),
    markings: plain("#dedbd2", 0.8),
    glazing: new THREE.MeshStandardMaterial({
      color: "#9fc3cf",
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.35,
    }),
  };

  // --- Ground ---------------------------------------------------------------
  add(box(0, 0, 600, 600, -5.3, 1, M.asphalt, flat));
  const lawn = (x0, y0, x1, y1) =>
    add(slab(rect(x0, y0, x1, y1), 1, 1.6, M.grass, flat));
  const paving = (x0, y0, x1, y1, material = M.promenade) =>
    add(slab(rect(x0, y0, x1, y1), 1, 2, material, flat));
  const FRONT = LEVELS[0].front;
  lawn(4, 4, 596, B.back);
  lawn(4, B.back, B.x0, 484);
  lawn(4, 484, 40, 596);
  // In front of the car park, either side of the gate.
  lawn(40, 562, 296, 596);
  lawn(346, 562, 392, 596);
  // Paving along the cut front, the cooling yard and the power yard.
  paving(B.x0, FRONT, B.x1, 484);
  add(slab(rect(B.x1, B.back, 596, 484), 1, 1.1, X.yard, flat));
  add(slab(rect(392, 484, 596, 596), 1, 1.1, X.yard, flat));

  // --- Planting ---------------------------------------------------------------
  // Scenery trees as on the other maquettes: a trunk carrying masses of fine,
  // dark olive flock.
  const leafColors = {
    broad: ["#46542a", "#535f2e", "#3b4824", "#616b36", "#4c592b"],
    conifer: ["#2f4028", "#394a2d", "#283820", "#42522f"],
  };
  // Lumpy sphere: the displacement is a hash of the position, so the corners
  // that faces share move together.
  const flock = (radius) => {
    const geometry = new THREE.IcosahedronGeometry(radius, 1);
    const p = geometry.attributes.position;
    const seed = rand(0, 1000);
    for (let i = 0; i < p.count; i++) {
      const h =
        Math.sin(
          Math.round((p.getX(i) / radius) * 97) * 12.9898 +
            Math.round((p.getY(i) / radius) * 97) * 78.233 +
            Math.round((p.getZ(i) / radius) * 97) * 37.719 +
            seed,
        ) * 43758.5453;
      const k = 1 + (h - Math.floor(h) - 0.5) * 0.44;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    return geometry;
  };
  const colorize = (geometry, color, lift = 0) => {
    const hsl = {};
    new THREE.Color(color).getHSL(hsl);
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Lighter towards the top of each clump, as in sunlit foliage.
      const y = geometry.attributes.position.getY(i);
      const tone = new THREE.Color().setHSL(
        hsl.h + rand(-0.015, 0.015),
        hsl.s * rand(0.85, 1.1),
        Math.min(0.8, hsl.l * (0.8 + lift + y * 0.02) * rand(0.9, 1.1)),
      );
      colors.set([tone.r, tone.g, tone.b], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  };
  function tree(x, y, { height = 28, spread = 10, kind = "broad" } = {}) {
    const conifer = kind === "conifer";
    const trunkTop = height * (conifer ? 0.16 : rand(0.3, 0.38));
    const crown = height - trunkTop;
    const girth = 0.45 + height * 0.022;
    const trunk = new THREE.CylinderGeometry(
      girth * 0.5,
      girth,
      trunkTop + crown * 0.5,
      6,
    );
    trunk.translate(0, (trunkTop + crown * 0.5) / 2, 0);
    add(place(mesh(trunk, M.bark), x, y, 1.4));
    const leaves = [];
    for (let i = 0; i < (conifer ? 44 : 36); i++) {
      const a = rand(0, Math.PI * 2);
      let px;
      let py;
      let size;
      if (conifer) {
        // A spire: tiers of flock narrowing to the tip.
        const t = random() ** 1.4;
        const r = spread * 0.6 * (1 - t) * Math.sqrt(rand(0.15, 1));
        px = r;
        py = trunkTop + t * crown * 0.94;
        size = spread * rand(0.14, 0.2) * (1 - t * 0.55);
      } else {
        const e = Math.acos(rand(-1, 1));
        const r = Math.cbrt(rand(0.2, 1));
        px = Math.sin(e) * r * spread * 0.62;
        py = trunkTop + crown * 0.52 + Math.cos(e) * r * crown * 0.42;
        size = spread * rand(0.2, 0.32);
      }
      const geometry = colorize(
        flock(size),
        pick(leafColors[kind]),
        ((py - trunkTop) / height) * 0.45 - 0.08,
      );
      geometry.translate(Math.cos(a) * px, py, Math.sin(a) * px);
      leaves.push(geometry);
    }
    occluder(
      add(place(mesh(mergeGeometries(leaves), M.foliage), x, y, 1.4)),
      "tree",
    );
  }
  function hedge(x0, y0, x1, y1, height = 5) {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const parts = [];
    for (let d = 0; d < length; d += 2.2) {
      const t = d / length;
      const geometry = colorize(flock(rand(2, 3.1)), "#465a2c", 0.05);
      geometry.translate(
        x0 + (x1 - x0) * t + rand(-0.8, 0.8),
        height * rand(0.45, 0.9),
        y0 + (y1 - y0) * t + rand(-0.8, 0.8),
      );
      parts.push(geometry);
    }
    const item = mesh(mergeGeometries(parts), M.foliage);
    item.position.y = 1.4;
    occluder(add(item), "tree");
  }
  for (let x = 20; x < 600; x += 48)
    tree(x + rand(-6, 6), rand(40, 70), {
      height: rand(52, 66),
      spread: rand(17, 21),
      kind: random() < 0.3 ? "conifer" : "broad",
    });
  for (const y of [190, 262, 336, 410])
    tree(24 + rand(-3, 3), y, { height: rand(40, 50), spread: 15 });
  for (const x of [70, 132, 370])
    tree(x, 580, { height: rand(26, 32), spread: 11 });
  hedge(44, 566, 292, 566);
  hedge(8, 150, 8, 480, 6);

  // --- Building shell ---------------------------------------------------------
  // The back wall and roof stand at full height; the side walls are cut down
  // along each level, so every cut edge shows the dark of a section.
  {
    const group = new THREE.Group();
    part(
      group,
      B.x0,
      B.back,
      B.x1,
      B.back + WALL,
      1,
      TOP + 4,
      faces({ top: X.cut, rest: X.wall }),
    );
    const profile = [[0, TOP + 3]];
    [...LEVELS].reverse().forEach(({ z, open, front }) => {
      profile.push([open - B.back, z + STOREY - 1]);
      profile.push([front - B.back, z + RAISED + 10]);
    });
    profile.splice(1, 0, [LEVELS[2].open - B.back, TOP + 3]);
    for (const x of [B.x0 + WALL / 2, B.x1 - WALL / 2]) {
      const length = FRONT - B.back;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(length, 0);
      for (const [s, z] of [...profile].reverse()) shape.lineTo(s, z);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: WALL,
        bevelEnabled: false,
      });
      geometry.translate(0, 0, -WALL / 2);
      const item = mesh(geometry, [X.wall, X.cut]);
      item.position.set(x, 1, B.back);
      item.rotation.y = -Math.PI / 2;
      group.add(item);
    }
    // Ground slab, the floor slabs and the roof, each cut at its front.
    part(group, B.x0, B.back, B.x1, FRONT, 1, 2, X.concrete);
    const cutSlab = faces({ front: X.cut, rest: X.concrete });
    for (const { z, front } of LEVELS.slice(1))
      part(group, ix0, B.back + WALL, ix1, front, z - SLAB, z, cutSlab);
    part(
      group,
      ix0,
      B.back + WALL,
      ix1,
      LEVELS[2].open,
      TOP - SLAB,
      TOP,
      cutSlab,
    );
    add(group);
  }

  // Server fronts: rows of drive bays with their status lights.
  const rackFront = () => {
    const lights = [];
    const map = painted(96, 192, (g, w, h) => {
      g.fillStyle = "#14171a";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#2e3439";
      g.fillRect(0, 0, w, 6);
      g.fillRect(0, h - 8, w, 8);
      g.fillRect(0, 0, 5, h);
      g.fillRect(w - 5, 0, 5, h);
      for (let y = 12; y < h - 22; y += 14) {
        if (random() < 0.1) continue;
        g.fillStyle = "#242a2f";
        g.fillRect(9, y, w - 18, 11);
        g.fillStyle = "#3a434a";
        for (let x = 13; x < w - 44; x += 9) g.fillRect(x, y + 2.5, 6, 6);
        for (let k = 0; k < 3; k++)
          if (random() < 0.85)
            lights.push([
              w - 38 + k * 10,
              y + 3,
              pick(["#39e06a", "#39e06a", "#39e06a", "#4aa8ff", "#ffb020"]),
            ]);
      }
      for (const [x, y, color] of lights) {
        g.fillStyle = color;
        g.fillRect(x, y, 7, 5);
      }
    });
    const glow = painted(96, 192, (g, w, h) => {
      g.fillStyle = "#000000";
      g.fillRect(0, 0, w, h);
      for (const [x, y, color] of lights) {
        g.fillStyle = color;
        g.fillRect(x, y, 7, 5);
      }
    });
    return lit(map, glow, 2.6);
  };
  const rackFronts = Array.from({ length: 6 }, rackFront);
  // In-row cooler: fan grilles, a display and the cold stripe.
  const coolerArt = painted(72, 192, (g, w, h) => {
    g.fillStyle = "#eef1f2";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#2f7fc4";
    g.fillRect(0, 0, w, 14);
    g.fillStyle = "#1c2226";
    g.fillRect(22, 24, 28, 14);
    for (const y of [78, 128, 172]) {
      g.fillStyle = "#c3c9cc";
      g.beginPath();
      g.arc(w / 2, y, 20, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#7f888d";
      g.beginPath();
      g.arc(w / 2, y, 14, 0, Math.PI * 2);
      g.fill();
    }
  });
  const coolerGlow = painted(72, 192, (g, w, h) => {
    g.fillStyle = "#000000";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#58c8ff";
    g.fillRect(25, 27, 22, 8);
  });
  const coolerFront = lit(coolerArt, coolerGlow, 1.6, 0.4);
  const sensorLamp = new THREE.MeshStandardMaterial({
    color: "#20241f",
    emissive: "#39e06a",
    emissiveIntensity: 2.6,
  });
  // Cabinet fronts for the rooms beside the halls: panels and a status light.
  const cabinetFront = (color, panel) => {
    const paint = (glowing) => (g, w, h) => {
      g.fillStyle = glowing ? "#000000" : color;
      g.fillRect(0, 0, w, h);
      if (!glowing) {
        g.fillStyle = panel;
        g.fillRect(8, 40, w - 16, h - 52);
        g.fillStyle = "#1c2226";
        g.fillRect(14, 10, 36, 20);
      }
      g.fillStyle = "#39e06a";
      g.fillRect(18, 14, 28, 12);
    };
    return lit(
      painted(64, 128, paint(false)),
      painted(64, 128, paint(true)),
      1.4,
    );
  };

  // --- Levels ------------------------------------------------------------------
  LEVELS.forEach(({ z, open, front }, level) => {
    const device = DEVICES[level];
    const floor = z + RAISED;
    const recess = open - 14;
    const shell = new THREE.Group();
    // The wall behind the hall, under the level above.
    part(shell, ix0, recess - 1, ix1, recess, z, z + STOREY - SLAB, X.wall);
    // Raised floor: tiles on pedestals, open at the cut so the void shows.
    part(shell, ix0, recess, ix1, open, floor - 1, floor, X.tile);
    part(shell, ix0, front - 13, ix1, front - 12, z, floor - 1, X.cut);
    for (let x = ix0 + 2; x < ix1; x += 15)
      part(shell, x, front - 1.3, x + 0.9, front - 0.3, z, floor - 1, X.vent);
    add(shell);
    const terrace = add(box(ix0, open, ix1, front, floor - 1, floor, X.tile));
    world.devices[device].meshes.push(terrace);
    // Cooling water in the void: supply below, return above, and the leak
    // detector with its sensing cable along the cut.
    add(
      place(
        tube(1.25, ix1 - ix0, X.supply),
        (ix0 + ix1) / 2,
        front - 2,
        z + 1.5,
      ),
    );
    add(
      place(
        tube(1.25, ix1 - ix0, X.return),
        (ix0 + ix1) / 2,
        front - 2,
        z + 4.6,
      ),
    );
    add(box(ix0, front - 0.5, ix1, front - 0.2, z, z + 0.4, X.cable, flat));
    {
      const [lx, ly] = SENSORS[`leak-${level + 1}`];
      add(box(lx - 2.4, ly - 1.4, lx + 2.4, ly + 0.6, z, z + 5.6, X.cable));
      add(
        box(
          lx - 0.6,
          ly + 0.6,
          lx + 0.6,
          ly + 0.8,
          z + 3,
          z + 4.2,
          sensorLamp,
          flat,
        ),
      );
    }

    // Racks and in-row coolers, facing the viewer.
    const [ry0, ry1] = [open + RACKS.y[0], open + RACKS.y[1]];
    const top = floor + RACKS.height;
    const row = new THREE.Group();
    for (let index = 0; index <= RACKS.count; index++) {
      const cx = rackX(index) - RACKS.cooler;
      part(
        row,
        cx,
        ry0 + 0.6,
        cx + RACKS.cooler,
        ry1 - 0.4,
        floor,
        top,
        faces({ front: coolerFront, rest: X.chilled }),
      );
      // The cooler's connections to the headers above the row.
      for (const [dy, material] of [
        [3, X.supply],
        [9, X.return],
      ])
        row.add(
          place(
            tube(0.7, 3.4, material, "z"),
            cx + RACKS.cooler / 2,
            ry0 + dy,
            top + 1.7,
          ),
        );
      if (index === RACKS.count) break;
      const x = rackX(index);
      part(
        row,
        x,
        ry0,
        x + RACKS.width,
        ry1,
        floor,
        top,
        faces({ front: pick(rackFronts), top: X.rackTop, rest: X.rack }),
      );
      // The rack's temperature and humidity sensor, on its door.
      const sx = x + RACKS.width / 2;
      part(
        row,
        sx - 1.5,
        ry1,
        sx + 1.5,
        ry1 + 0.7,
        top - 3,
        top - 0.5,
        X.chilled,
      );
      part(
        row,
        sx - 0.4,
        ry1 + 0.7,
        sx + 0.4,
        ry1 + 0.85,
        top - 1.6,
        top - 1,
        sensorLamp,
        flat,
      );
    }
    add(row);
    // Headers above the row and on to the riser beside the hall, and the
    // fibre trough.
    const rowX0 = RACKS.x0;
    const riser = LAYOUT.partition + 26;
    for (const [dy, dx, material] of [
      [3, 0, X.supply],
      [9, 6, X.return],
    ]) {
      add(
        place(
          tube(1.1, riser + dx - rowX0, material),
          (rowX0 + riser + dx) / 2,
          ry0 + dy,
          top + 3.4,
        ),
      );
      add(
        place(
          tube(1.1, ry0 + dy - recess, material, "y"),
          riser + dx,
          (ry0 + dy + recess) / 2,
          top + 3.4,
        ),
      );
    }
    add(
      box(
        rowX0,
        ry0 - 4,
        rackX(RACKS.count),
        ry0 - 1.6,
        top + 1,
        top + 2.2,
        X.cable,
      ),
    );
    // Perforated tiles along the cold aisle.
    for (let x = rowX0 + 2; x < rackX(RACKS.count) - 6; x += 15)
      add(
        box(x, ry1 + 3, x + 6.6, ry1 + 9.6, floor, floor + 0.06, X.vent, flat),
      );
    // Fire suppression: gas cylinders at the end of the row.
    for (let i = 0; i < 4; i++) {
      const cylinder = tube(2.3, 17, X.gas, "z");
      add(place(cylinder, 60 + i * 6.4, open + 30, floor + 8.5));
      add(
        place(
          tube(0.9, 2, X.machineDark, "z"),
          60 + i * 6.4,
          open + 30,
          floor + 18,
        ),
      );
    }
    // What stands against the wall under the level above: distribution
    // cabinets and the pipes they feed.
    for (let x = 70; x < LAYOUT.partition - 30; x += 58) {
      add(
        box(
          x,
          recess,
          x + 24,
          recess + 7,
          floor,
          floor + 14,
          faces({
            front: cabinetFront("#dfe2e3", "#cdd2d4"),
            rest: X.machine,
          }),
        ),
      );
    }

    // What is left of the ceiling: a beam on posts carrying the lamps.
    const beamY = open + 66;
    const glow = litGlass("#f1f6ff", 3, device);
    occluder(
      add(box(ix0, beamY - 1, ix1, beamY + 1, floor + 27, floor + 29, X.steel)),
      "frame",
    );
    for (const x of [ix0 + 1.2, LAYOUT.partition, ix1 - 1.2])
      occluder(
        add(
          box(x - 1, beamY - 1, x + 1, beamY + 1, floor, floor + 27, X.steel),
        ),
        "frame",
      );
    for (const x of [86, 140, 194, 248, 302, 348, 402, 452]) {
      add(
        place(
          mesh(new THREE.CylinderGeometry(1.4, 2.2, 1.3, 12), glow, flat),
          x,
          beamY,
          floor + 26.3,
        ),
      );
      const lamp = new THREE.PointLight("#eaf1ff", 560, 110, 2);
      lamp.position.set(x, floor + 25, beamY);
      add(lamp);
      world.devices[device].lights.push(lamp);
    }

    // Glazed partition to the room beside the hall, with a doorway on the
    // aisle.
    {
      const group = new THREE.Group();
      const px = LAYOUT.partition;
      for (const [y0, y1] of [
        [recess, open + 54],
        [open + 68, front],
      ]) {
        part(group, px - 0.6, y0, px + 0.6, y1, floor, floor + 5, X.wall);
        part(
          group,
          px - 0.3,
          y0,
          px + 0.3,
          y1,
          floor + 5,
          floor + 17,
          X.glazing,
          flat,
        );
        part(
          group,
          px - 0.6,
          y0,
          px + 0.6,
          y1,
          floor + 17,
          floor + 17.8,
          X.cut,
        );
      }
      occluder(add(group), "wall");
    }
  });

  // A fixture standing on a level's raised floor: z is measured from it.
  const fixture = (group, level, kind = "fixture") => {
    group.position.y += LEVELS[level].z + RAISED;
    return occluder(add(group), kind);
  };
  const [rx0, rx1] = [LAYOUT.partition + 4, ix1 - 1];

  // --- Level 1: cooling plant ---------------------------------------------------
  {
    const { open } = LEVELS[0];
    // Buffer tanks.
    for (const [x, y, radius, height] of [
      [455, open + 20, 9, 24],
      [433, open + 18, 7, 20],
    ]) {
      const group = new THREE.Group();
      group.add(
        place(tube(radius, height, M.metal, "z"), x, y, height / 2 + 2),
      );
      const cap = mesh(
        new THREE.SphereGeometry(radius, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        M.metal,
      );
      cap.scale.set(1, 0.4, 1);
      group.add(place(cap, x, y, height + 2));
      fixture(group, 0);
    }
    // Plate heat exchanger.
    {
      const group = new THREE.Group();
      part(group, rx0 + 4, open + 12, rx0 + 6, open + 24, 0, 17, X.accent);
      part(group, rx0 + 22, open + 12, rx0 + 24, open + 24, 0, 17, X.accent);
      part(group, rx0 + 6, open + 13, rx0 + 22, open + 23, 2, 16, X.machine);
      fixture(group, 0);
    }
    // Circulation pumps on the supply and the return.
    for (const [y, material] of [
      [open + 66, X.supply],
      [open + 78, X.return],
    ]) {
      const group = new THREE.Group();
      part(group, rx0 + 8, y - 3, rx0 + 26, y + 3, 0, 1.4, X.machineDark);
      group.add(place(tube(3, 8, X.accent), rx0 + 13, y, 4.6));
      group.add(place(tube(2.2, 7, X.machineDark), rx0 + 21, y, 4.6));
      // The pipe on through the wall to the cooling towers.
      group.add(
        place(
          tube(1.7, ix1 - rx0 - 24, material),
          (rx0 + 24 + ix1) / 2,
          y,
          4.6,
        ),
      );
      fixture(group, 0);
    }
  }

  // --- Level 2: power -----------------------------------------------------------
  {
    const { open } = LEVELS[1];
    // Uninterruptible power supplies, in line with the racks.
    const ups = cabinetFront("#e3e5e2", "#d2d6d3");
    for (let i = 0; i < 4; i++) {
      const group = new THREE.Group();
      const x = rx0 + 4 + i * 15;
      part(
        group,
        x,
        open + RACKS.y[0],
        x + 14,
        open + RACKS.y[1],
        0,
        22,
        faces({ front: ups, rest: X.machine }),
      );
      fixture(group, 1);
    }
    // Battery strings along the side wall.
    {
      const group = new THREE.Group();
      const cells = painted(256, 96, (g, w, h) => {
        g.fillStyle = "#23272b";
        g.fillRect(0, 0, w, h);
        for (let r = 0; r < 3; r++)
          for (let x = 6; x < w - 14; x += 18) {
            g.fillStyle = "#3d7a55";
            g.fillRect(x, r * 30 + 8, 14, 19);
            g.fillStyle = "#c9ced1";
            g.fillRect(x + 2, r * 30 + 5, 3, 3);
            g.fillRect(x + 9, r * 30 + 5, 3, 3);
          }
      });
      part(
        group,
        rx1 - 9,
        open + 54,
        rx1,
        open + 88,
        0,
        17,
        faces({
          west: new THREE.MeshStandardMaterial({ map: cells, roughness: 0.6 }),
          rest: X.machineDark,
        }),
      );
      fixture(group, 1);
    }
  }

  // --- Level 3: control room ----------------------------------------------------
  {
    const { z, open } = LEVELS[2];
    const floor = z + RAISED;
    // Video wall.
    const screens = painted(512, 96, (g, w, h) => {
      g.fillStyle = "#0b1118";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 6; i++) {
        const x = 6 + i * 84;
        g.fillStyle = "#101b26";
        g.fillRect(x, 6, 78, 84);
        g.strokeStyle = pick(["#39e06a", "#4aa8ff", "#ffb020", "#4aa8ff"]);
        g.lineWidth = 3;
        g.beginPath();
        for (let k = 0; k <= 8; k++)
          g.lineTo(x + 6 + k * 8.4, 70 - rand(4, 46));
        g.stroke();
        g.fillStyle = "#4aa8ff";
        for (let k = 0; k < 5; k++)
          g.fillRect(x + 6 + k * 14, 76, 10, rand(4, 10));
      }
    });
    add(
      box(
        rx0 + 40,
        open - 14,
        rx1 - 6,
        open - 13.4,
        floor + 2,
        floor + 15,
        faces({ front: lit(screens, screens, 1.5, 0.3), rest: X.cut }),
        flat,
      ),
    );
    // Two rows of desks with their monitors.
    for (const y of [open + 26, open + 50]) {
      const group = new THREE.Group();
      part(group, rx0 + 10, y, rx1 - 10, y + 9, 7.4, 8.2, X.desk);
      for (const x of [rx0 + 11, rx1 - 12])
        part(group, x, y + 1, x + 1, y + 8, 0, 7.4, X.machineDark, flat);
      for (let x = rx0 + 15; x < rx1 - 22; x += 14)
        part(group, x, y + 1.6, x + 10, y + 2.4, 9.2, 15.4, X.rack);
      fixture(group, 2);
    }
  }

  // --- Roof ---------------------------------------------------------------------
  // Dry coolers, the gateway mast and the light sensor.
  for (const x of [72, 176, 280]) {
    const group = new THREE.Group();
    part(group, x, 168, x + 84, 194, TOP, TOP + 2, X.machineDark);
    part(group, x + 1, 169, x + 83, 193, TOP + 2, TOP + 7, X.machine);
    for (let fx = x + 12; fx < x + 80; fx += 20)
      group.add(place(tube(8, 0.8, X.machineDark, "z"), fx, 181, TOP + 7.3));
    add(group);
  }
  {
    const [gx, gy] = SENSORS.gateway;
    add(
      box(gx - 0.5, gy - 0.5, gx + 0.5, gy + 0.5, TOP, TOP + 13, M.darkMetal),
    );
    add(
      box(
        gx - 2.6,
        gy - 1.4,
        gx + 2.6,
        gy + 1.4,
        TOP + 3,
        TOP + 8.6,
        X.chilled,
      ),
    );
    const [lx, ly] = SENSORS.lux;
    add(box(lx - 0.3, ly - 0.3, lx + 0.3, ly + 0.3, TOP, TOP + 4, M.darkMetal));
    add(
      box(
        lx - 1.6,
        ly - 1.6,
        lx + 1.6,
        ly + 1.6,
        TOP + 4,
        TOP + 5.8,
        X.chilled,
      ),
    );
  }

  // --- Cooling yard -------------------------------------------------------------
  const louvres = painted(128, 96, (g, w, h) => {
    g.fillStyle = "#d9dcdd";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#6f777b";
    for (let y = 44; y < h - 8; y += 9) g.fillRect(8, y, w - 16, 5);
    g.fillStyle = "#2f7fc4";
    g.fillRect(0, 12, w, 10);
  });
  const louvred = new THREE.MeshStandardMaterial({
    map: louvres,
    roughness: 0.5,
  });
  for (const y of [214, 312]) {
    const group = new THREE.Group();
    part(
      group,
      522,
      y,
      582,
      y + 56,
      1.1,
      33,
      faces({ front: louvred, west: louvred, rest: X.machine }),
    );
    group.add(place(tube(21, 5, X.machineDark, "z"), 552, y + 28, 35.5));
    group.add(place(tube(18, 0.6, X.vent, "z"), 552, y + 28, 38.2));
    add(group);
    occluder(group, "fixture");
    // The tower's connections to the yard's pipes.
    add(place(tube(1.7, 12, X.supply), 516, y + 20, 15.6));
    add(place(tube(1.7, 18, X.return), 513, y + 36, 15.6));
  }
  // From the plant on level 1 out to the towers.
  {
    const floor = LEVELS[0].z + RAISED + 4.6;
    const supplyY = LEVELS[0].open + 66;
    const returnY = LEVELS[0].open + 78;
    add(place(tube(1.7, 30, X.supply), 495, supplyY, floor));
    add(place(tube(1.7, 24, X.return), 492, returnY, floor));
    add(
      place(
        tube(1.7, supplyY - 234, X.supply, "y"),
        510,
        (supplyY + 234) / 2,
        floor + 1,
      ),
    );
    add(
      place(
        tube(1.7, returnY - 250, X.return, "y"),
        504,
        (returnY + 250) / 2,
        floor + 1,
      ),
    );
    for (let y = 250; y < 440; y += 38)
      add(box(502, y, 512, y + 1.6, 1.1, floor - 0.6, X.machineDark));
  }

  // --- Power yard ---------------------------------------------------------------
  // Standby generator, its fuel tank and the transformer.
  {
    const group = new THREE.Group();
    part(group, 404, 498, 496, 526, 1.1, 24, X.genset);
    for (let x = 412; x < 470; x += 9)
      part(group, x, 526, x + 6, 526.2, 6, 19, X.machineDark, flat);
    part(group, 474, 526, 490, 526.2, 3, 21, X.machineDark, flat);
    group.add(place(tube(2.2, 14, M.metal, "z"), 482, 506, 31));
    add(group);
    occluder(group, "fixture");
  }
  {
    const group = new THREE.Group();
    group.add(place(tube(9, 44, X.chilled), 550, 512, 13));
    for (const x of [534, 566])
      part(group, x - 1.5, 503, x + 1.5, 521, 1.1, 8, X.machineDark);
    part(group, 524, 498, 576, 526, 1.1, 2, X.concrete);
    add(group);
    occluder(group, "fixture");
  }
  {
    const group = new THREE.Group();
    part(group, 430, 548, 470, 572, 1.1, 19, X.machineDark);
    for (let x = 432; x < 469; x += 3.4)
      part(group, x, 572, x + 1.6, 575.5, 3, 16, X.vent);
    for (const x of [438, 450, 462]) {
      group.add(place(tube(1.3, 6, X.desk, "z"), x, 556, 22));
      group.add(place(tube(0.5, 2, M.metal, "z"), x, 556, 26));
    }
    add(group);
    occluder(group, "fixture");
  }

  // --- Forecourt ----------------------------------------------------------------
  const paints = [
    "#d9d4c9",
    "#35465e",
    "#8f4038",
    "#9a9fa3",
    "#2b2f33",
    "#f2f1ed",
  ];
  const tyre = new THREE.CylinderGeometry(1.25, 1.25, 1.1, 12);
  tyre.rotateX(Math.PI / 2);
  function car(x, y, heading) {
    const group = new THREE.Group();
    const length = rand(17.5, 20);
    const width = 7.8;
    const paint = M.paint(pick(paints));
    const tall = random() < 0.35;
    const bit = (geometry, material, px, pz, py = 0) => {
      const item = mesh(geometry, material);
      item.position.set(px, pz, py);
      group.add(item);
    };
    bit(new RoundedBoxGeometry(length, 2.7, width, 3, 1.1), paint, 0, 2.05);
    const cabin = length * (tall ? 0.6 : 0.5);
    const top = tall ? 5.6 : 5;
    bit(
      new RoundedBoxGeometry(cabin, top - 2.6, width - 1.3, 3, 0.9),
      M.glassDark,
      -length * (tall ? 0.1 : 0.06),
      (top + 2.6) / 2,
    );
    bit(
      new RoundedBoxGeometry(cabin - 1.8, 0.6, width - 1.7, 2, 0.28),
      paint,
      -length * (tall ? 0.1 : 0.06),
      top + 0.1,
    );
    for (const ax of [-length * 0.3, length * 0.3])
      for (const side of [-1, 1])
        bit(tyre, M.tyre, ax, 1.25, side * (width / 2 - 0.5));
    // The other maquettes' car, at this model's scale.
    group.scale.setScalar(2.3);
    add(place(group, x, y, 1.05, heading));
    occluder(group, "car");
  }
  const BAY = 25;
  for (let x = 64; x <= 264.1; x += BAY)
    add(box(x - 0.6, 498, x + 0.6, 548, 1, 1.12, X.markings, flat));
  [0, 1, 3, 4, 6].forEach((bay) =>
    car(64 + (bay + 0.5) * BAY, 523, -Math.PI / 2 + rand(-0.04, 0.04)),
  );
  // Fence and sliding gate along the front, and the name by the gate.
  {
    const group = new THREE.Group();
    for (const [x0, x1] of [
      [6, 296],
      [346, 594],
    ]) {
      for (const z of [5, 9.4])
        part(group, x0, 590, x1, 590.4, z, z + 0.5, X.machineDark, flat);
      for (let x = x0; x <= x1; x += 11)
        part(group, x, 589.9, x + 0.6, 590.5, 1.1, 10.4, X.machineDark, flat);
    }
    part(group, 300, 588, 352, 588.6, 2, 10, X.accent, flat);
    add(group);
  }
  {
    const name = painted(384, 96, (g, w, h) => {
      g.fillStyle = "#1c2733";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#58c8ff";
      g.fillRect(0, h - 10, w, 10);
      g.fillStyle = "#ffffff";
      g.font = "bold 50px Arial, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("DATA CENTER", w / 2, h / 2 - 3);
    });
    const group = new THREE.Group();
    part(
      group,
      206,
      574,
      276,
      577,
      1.6,
      19,
      faces({ front: lit(name, name, 0.8, 0.4), rest: X.cut }),
    );
    add(group);
    occluder(group, "fixture");
  }

  // Forecourt and yard lamps.
  for (const [id, [x, y]] of Object.entries(YARD_LAMPS)) {
    const group = new THREE.Group();
    const h = 44;
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(0.6, 0.95, h, 8), M.darkMetal),
        0,
        0,
        h / 2,
      ),
    );
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(1.8, 2.2, 2, 8), M.darkMetal),
        0,
        0,
        1,
      ),
    );
    part(group, -5, -1.3, 5, 1.3, h, h + 1, M.darkMetal);
    for (const side of [-3.1, 3.1])
      part(
        group,
        side - 1.8,
        -1,
        side + 1.8,
        1,
        h - 0.5,
        h,
        litGlass("#ffe0a0", 3.4, id),
        flat,
      );
    add(place(group, x, y, 1));
    const lamp = new THREE.PointLight("#ffc584", 2600, 210, 2);
    lamp.position.set(x, h - 1.5, y);
    add(lamp);
    world.devices[id].lights.push(lamp);
    world.devices[id].meshes.push(group);
    occluder(group, "lamp");
  }

  scene.traverse((item) => {
    if (!item.isMesh) return;
    const scale = item.material?.userData?.scale;
    if (scale) worldUV(item.geometry, scale, item);
  });
  return { scene, world, materials: M };
}
