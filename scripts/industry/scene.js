// Three.js model of the industry maquette, rendered in a headless browser by
// scripts/generate-industry-maquette.mjs.
//
// Two buildings shown in section, without roofs and with their walls cut down
// towards the viewer: a manufacturing plant on the left and a supermarket on
// the right. It stands on the marina's board and uses its materials, camera,
// lighting and post-processing (scripts/marina/scene.js), so all maquettes
// share one geometry and one look. World units are millimetres: x to the
// right, y towards the viewer, z up.

import {
  THREE,
  buildBase,
  makeMaterials,
  rngOf,
  setDevice as switchDevice,
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
} from "../marina/scene.js";

// ---------------------------------------------------------------------------
// Layout (mm). Both buildings stand at the back of the board; in front of them
// are the plant's yard with its loading docks and the supermarket's car park,
// then the road across the front.
export const LAYOUT = {
  factory: { x0: 12, x1: 286, y0: 44, y1: 352, h: 34 },
  market: { x0: 314, x1: 588, y0: 44, y1: 352, h: 26 },
  // Height the walls are cut down to at the front, and the floor level.
  cut: 6,
  floor: 2.2,
  pavement: [352, 376],
  lot: { x: [348, 586], rows: [386, 440, 464], bay: 24, crossing: 5 },
  road: [540, 578],
};

// Devices: switchable lighting.
export const DEVICES = [
  "FACTORY_01",
  "MARKET_01",
  "SIGN_01",
  "LAMP_01",
  "LAMP_02",
  "LAMP_03",
  "LAMP_04",
];
const YARD_LAMPS = {
  LAMP_01: [112, 432],
  LAMP_02: [196, 470],
  LAMP_03: [400, 464],
  LAMP_04: [536, 464],
};

// Sensor pins, the light sensor and the gateway (world points).
export const SENSORS = {
  lux: [150, 45, 39],
  gateway: [262, 45, 48],
  "hall-temp": [100, 130, 31],
  "wh-rh": [241, 120, 23],
  "factory-power": [18, 128, 14],
  "fridge-dairy": [365, 52, 12],
  "fridge-meat": [457, 52, 12],
  coldroom: [547, 90, 16],
  freezer: [542, 135, 7],
  "freezer-wall": [581, 175, 12],
  "market-power": [582, 330, 13],
};

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
  // Box faces in the order of BoxGeometry's groups.
  const faces = ({ east, west, top, front, back, rest }) => [
    east ?? rest,
    west ?? rest,
    top ?? rest,
    rest,
    front ?? rest,
    back ?? rest,
  ];

  buildBase(add, mesh, box);

  const { factory: F, market: K, floor: FLOOR, cut: CUT } = LAYOUT;
  const X = {
    // Where a wall is cut through.
    cut: plain("#2c2e30", 0.8),
    factoryWall: plain("#c9ced1", 0.6),
    marketWall: plain("#ece8df", 0.75),
    steel: plain("#3f5c75", 0.5, 0.3),
    whiteSteel: plain("#e6e6e2", 0.5, 0.2),
    lane: plain("#e0b53a", 0.7),
    machine: plain("#dfe2e3", 0.45),
    machineDark: plain("#3b4044", 0.5, 0.3),
    accent: plain("#2f6f9f", 0.5),
    orange: plain("#e07a2a", 0.5),
    yellow: plain("#e6b422", 0.5),
    green: plain("#3f7a5a", 0.55),
    cardboard: plain("#b98f5e", 0.9),
    pallet: plain("#a88660", 0.9),
    belt: plain("#1f2224", 0.6),
    desk: plain("#b99a72", 0.7),
    chilled: plain("#f4f6f7", 0.35),
    partition: plain("#f1efe9", 0.7),
    factoryFloor: new THREE.MeshStandardMaterial({
      color: "#8d9593",
      map: M.stuccoMap,
      roughness: 0.5,
      userData: { scale: 60 },
    }),
    marketFloor: new THREE.MeshStandardMaterial({
      color: "#c2bdb0",
      map: M.stuccoMap,
      roughness: 0.38,
      userData: { scale: 50 },
    }),
    yard: new THREE.MeshStandardMaterial({
      color: "#a9a69d",
      map: M.stuccoMap,
      normalMap: M.stuccoNormal,
      roughness: 0.95,
      userData: { scale: 55 },
    }),
    markings: plain("#dedbd2", 0.8),
  };

  // --- Ground ---------------------------------------------------------------
  add(box(0, 0, 600, 600, -5.3, 1, M.asphalt, flat));
  const lawn = (x0, y0, x1, y1) =>
    add(slab(rect(x0, y0, x1, y1), 1, 1.6, M.grass, flat));
  const paving = (x0, y0, x1, y1, material = M.promenade) =>
    add(slab(rect(x0, y0, x1, y1), 1, 2, material, flat));
  const [roadBack, roadFront] = LAYOUT.road;
  lawn(4, 4, 596, F.y0);
  lawn(F.x1, F.y0, K.x0, 376);
  lawn(F.x1 + 6, 376, K.x0, 536);
  lawn(4, F.y0, F.x0, 376);
  lawn(K.x1, K.y0, 596, 376);
  // Verge between the yard, the car park and the road; the yard's gate
  // crosses it.
  lawn(4, 524, 118, 536);
  lawn(152, 524, 594, 536);
  paving(4, LAYOUT.pavement[0], 208, LAYOUT.pavement[1]);
  paving(K.x0, LAYOUT.pavement[0], 596, LAYOUT.pavement[1]);
  paving(0, roadFront + 2, 600, 600);
  // The plant's concrete yard.
  add(slab(rect(4, 376, F.x1 + 6, 524), 1, 1.1, X.yard, flat));
  add(slab(rect(208, F.y1, F.x1 + 6, 376), 1, 1.1, X.yard, flat));
  // Kerbs along the road and its centre line.
  const kerb = new THREE.MeshStandardMaterial({
    color: "#d2cec4",
    map: M.stuccoMap,
    roughness: 0.9,
    userData: { scale: 40 },
  });
  add(box(0, roadBack - 3, 600, roadBack - 1.5, 1, 2.25, kerb, flat));
  add(box(0, roadFront + 0.5, 600, roadFront + 2, 1, 2.25, kerb, flat));
  for (let x = 6; x < 596; x += 22)
    add(box(x, 558.6, x + 10, 559.4, 1, 1.1, X.markings, flat));
  // Zebra crossing from the car park to the pavement on the far side.
  for (let x = 432; x < 452; x += 4)
    add(box(x, roadBack, x + 2.2, roadFront, 1, 1.1, X.markings, flat));

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
  function hedge(x0, y0, x1, y1, height = 4) {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const parts = [];
    for (let d = 0; d < length; d += 1.7) {
      const t = d / length;
      const geometry = colorize(flock(rand(1.5, 2.4)), "#465a2c", 0.05);
      geometry.translate(
        x0 + (x1 - x0) * t + rand(-0.7, 0.7),
        height * rand(0.45, 0.9),
        y0 + (y1 - y0) * t + rand(-0.7, 0.7),
      );
      parts.push(geometry);
    }
    const item = mesh(mergeGeometries(parts), M.foliage);
    item.position.y = 1.4;
    occluder(add(item), "tree");
  }
  for (let x = 16; x < 600; x += 36)
    tree(x + rand(-5, 5), rand(14, 24), {
      height: rand(34, 44),
      spread: rand(11, 14),
      kind: random() < 0.3 ? "conifer" : "broad",
    });
  for (const y of [112, 232, 392, 448, 500])
    tree(300 + rand(-2, 2), y, { height: rand(22, 27), spread: 9 });
  for (const x of [30, 84, 210, 262, 350, 500, 566])
    tree(x, 530, { height: rand(15, 19), spread: 7 });
  hedge(156, 530, 290, 530);
  hedge(322, 530, 590, 530);
  hedge(300, 60, 300, 350, 3.4);

  // --- Building shells --------------------------------------------------------
  // A wall from a to b whose top follows `profile`, [[distance along, height]].
  // Its faces take the wall colour and every edge the cut colour, so wherever
  // the wall is cut down it reads as a section.
  const WALL = 2.6;
  const wall = (a, b, profile, material, thickness = WALL) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(length, 0);
    for (const [s, z] of [...profile].reverse()) shape.lineTo(s, z);
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -thickness / 2);
    const item = mesh(geometry, [material, X.cut]);
    item.position.set(a[0], FLOOR, a[1]);
    item.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    return item;
  };
  const level = (length, z) => [
    [0, z],
    [length, z],
  ];
  // Floor, back wall at full height, side walls cut down on a slope, a low
  // front wall with its doorways, and the frames that carried the roof, with
  // the hall's lamps hanging from them.
  function shell(
    B,
    { device, wallMaterial, floor, frame, doors, frames, power = 520 },
  ) {
    const group = new THREE.Group();
    const { x0, x1, y0, y1, h } = B;
    const half = WALL / 2;
    group.add(box(x0, y0, x1, y1, 1, FLOOR, floor));
    group.add(
      wall(
        [x0, y0 + half],
        [x1, y0 + half],
        level(x1 - x0, h - FLOOR),
        wallMaterial,
      ),
    );
    const depth = y1 - y0;
    const side = [
      [0, h - FLOOR],
      [depth * 0.2, h - FLOOR],
      [depth * 0.5, CUT],
      [depth, CUT],
    ];
    for (const x of [x0 + half, x1 - half])
      group.add(wall([x, y0], [x, y1], side, wallMaterial));
    // Front wall between the doorways.
    let from = x0;
    for (const [d0, d1] of [...doors, [x1, x1]]) {
      if (d0 > from) {
        const part = wall(
          [from, y1 - half],
          [d0, y1 - half],
          level(d0 - from, CUT),
          wallMaterial,
        );
        group.add(part);
        occluder(part, "wall");
      }
      // Door posts.
      if (d1 > d0)
        for (const x of [d0, d1])
          group.add(
            box(x - 0.5, y1 - WALL, x + 0.5, y1, FLOOR, FLOOR + 9, X.cut),
          );
      from = d1;
    }
    add(group);
    world.devices[device].meshes.push(group);
    const glow = litGlass("#fff0cf", 3, device);
    for (const y of frames) {
      for (const x of [x0 + WALL + 1.2, x1 - WALL - 1.2])
        occluder(
          add(box(x - 1.1, y - 1.1, x + 1.1, y + 1.1, FLOOR, h, frame)),
          "frame",
        );
      occluder(
        add(box(x0 + WALL, y - 1, x1 - WALL, y + 1, h - 2.8, h, frame)),
        "frame",
      );
      for (const t of [0.2, 0.5, 0.8]) {
        const x = x0 + (x1 - x0) * t;
        add(
          box(
            x - 0.15,
            y - 0.15,
            x + 0.15,
            y + 0.15,
            h - 6.4,
            h - 2.8,
            frame,
            flat,
          ),
        );
        add(
          place(
            mesh(new THREE.CylinderGeometry(1.1, 1.9, 1.3, 12), glow, flat),
            x,
            y,
            h - 7,
          ),
        );
        const lamp = new THREE.PointLight("#ffe2b0", power, 130, 2);
        lamp.position.set(x, h - 8.2, y);
        add(lamp);
        world.devices[device].lights.push(lamp);
      }
    }
    return group;
  }
  // A fixture standing on a building's floor: z is measured from the floor.
  const fixture = (group, kind = "fixture") => {
    group.position.y += FLOOR;
    return occluder(add(group), kind);
  };
  const part = (group, ...args) => group.add(box(...args));

  // --- Manufacturing plant ------------------------------------------------------
  shell(F, {
    device: "FACTORY_01",
    wallMaterial: X.factoryWall,
    floor: X.factoryFloor,
    frame: X.steel,
    doors: [
      [187, 199],
      [214, 240],
      [250, 276],
    ],
    frames: [130, 230, 330],
  });
  {
    const fx0 = F.x0 + WALL;
    const fy0 = F.y0 + WALL;
    const fy1 = F.y1 - WALL;
    // Band and high windows along the back wall.
    add(
      box(
        fx0,
        fy0,
        F.x1 - WALL,
        fy0 + 0.15,
        F.h - 5,
        F.h - 3.6,
        X.accent,
        flat,
      ),
    );
    for (let x = 28; x < 272; x += 22)
      add(box(x, fy0, x + 14, fy0 + 0.2, 21, 27.5, M.glassDark, flat));
    // Back door to the changing rooms.
    add(box(188, fy0, 198, fy0 + 0.3, FLOOR, FLOOR + 9, X.machineDark, flat));
    // Walkways marked on the floor.
    const line = (x0, y0, x1, y1) =>
      add(box(x0, y0, x1, y1, FLOOR, FLOOR + 0.06, X.lane, flat));
    for (const x of [186, 199.5]) line(x, 78, x + 0.5, fy1);
    for (const y of [78, 98, 156, 174, 260, 278]) line(24, y, 186, y + 0.5);
    for (const y of [260, 278]) line(200, y, 283, y + 0.5);

    // CNC machining centres along the back wall.
    const tower = (group, x, y, z, color) => {
      part(
        group,
        x - 0.2,
        y - 0.2,
        x + 0.2,
        y + 0.2,
        z,
        z + 2.4,
        X.machineDark,
      );
      part(
        group,
        x - 0.45,
        y - 0.45,
        x + 0.45,
        y + 0.45,
        z + 2.4,
        z + 3.6,
        new THREE.MeshStandardMaterial({
          color: "#20241f",
          emissive: color,
          emissiveIntensity: 2.4,
        }),
        flat,
      );
    };
    for (const x of [36, 74, 112, 150]) {
      const group = new THREE.Group();
      part(group, x, 50, x + 30, 74, 0, 15, X.machine);
      part(group, x, 73.9, x + 30, 74.2, 11.5, 13, X.accent, flat);
      part(group, x + 3, 73.9, x + 19, 74.3, 4, 10.5, M.glassDark, flat);
      // Control panel on a swing arm, and the chip conveyor's bin.
      part(group, x + 22, 74, x + 27, 76, 5, 11, X.machineDark);
      part(group, x + 30.5, 56, x + 34, 66, 0, 5, X.machineDark);
      tower(group, x + 27, 54, 15, random() < 0.8 ? "#39e06a" : "#ffb020");
      fixture(group);
    }
    // Switchgear on the side wall.
    {
      const group = new THREE.Group();
      for (let y = 106; y < 150; y += 11) {
        part(group, 15, y, 20, y + 10.4, 0, 11, X.machine);
        part(group, 20, y + 1.2, 20.15, y + 9.2, 1, 10, X.machineDark, flat);
      }
      fixture(group);
    }
    // Assembly line: a conveyor with two robots, parts in cages behind it.
    {
      const group = new THREE.Group();
      part(group, 40, 122, 178, 130, 0, 4.4, X.machineDark);
      part(group, 40.6, 122.6, 177.4, 129.4, 4.4, 4.9, X.belt, flat);
      for (let x = 48; x < 174; x += rand(9, 15))
        part(group, x, 124, x + 4.5, 128, 4.9, 4.9 + rand(2, 3.4), X.cardboard);
      fixture(group);
      for (const x of [74, 142]) {
        const robot = new THREE.Group();
        robot.add(
          place(
            mesh(new THREE.CylinderGeometry(2.4, 2.8, 3, 14), X.machineDark),
            0,
            0,
            1.5,
          ),
        );
        const arm = (length, y, z, tilt) => {
          const geometry = new THREE.BoxGeometry(1.7, length, 1.7);
          geometry.translate(0, length / 2, 0);
          const item = mesh(geometry, X.orange);
          item.position.set(0, z, y);
          item.rotation.x = tilt;
          robot.add(item);
        };
        arm(8, 0, 3, 0.25);
        arm(8.5, 2, 10.4, 1.25);
        robot.add(box(-0.9, 9.4, 0.9, 11, 11.6, 13.4, X.machineDark));
        fixture(place(robot, x, 113, 0));
      }
      for (let x = 44; x < 176; x += 22)
        if (Math.abs(x - 74) > 8 && Math.abs(x - 142) > 8) {
          const cage = new THREE.Group();
          part(cage, x, 105, x + 9, 112, 0, 0.9, X.pallet);
          part(
            cage,
            x + 0.5,
            105.5,
            x + 8.5,
            111.5,
            0.9,
            rand(3.5, 6),
            X.accent,
          );
          fixture(cage);
        }
    }
    // Injection moulding machines.
    for (const x of [36, 84, 132]) {
      const group = new THREE.Group();
      part(group, x, 184, x + 42, 198, 0, 6, X.green);
      part(group, x + 1, 185, x + 17, 197, 6, 13, X.machine);
      part(group, x + 3, 196.9, x + 15, 197.2, 7.5, 12, M.glassDark, flat);
      const barrel = new THREE.CylinderGeometry(2, 2, 20, 12);
      barrel.rotateZ(Math.PI / 2);
      group.add(place(mesh(barrel, X.machineDark), x + 28, 191, 9));
      group.add(
        place(
          mesh(new THREE.CylinderGeometry(3.2, 1, 5, 12), X.machine),
          x + 30,
          191,
          14,
        ),
      );
      part(group, x + 38, 198, x + 42, 201, 0, 9, X.machineDark);
      tower(group, x + 40, 186, 6, "#39e06a");
      fixture(group);
    }
    // Packing tables and the pallets the finished boxes are stacked on.
    for (const x of [44, 80, 116]) {
      const group = new THREE.Group();
      part(group, x, 226, x + 16, 233, 3.6, 4.4, X.desk);
      for (const [px, py] of [
        [x + 0.5, 226.5],
        [x + 15, 226.5],
        [x + 0.5, 232],
        [x + 15, 232],
      ])
        part(group, px, py, px + 0.5, py + 0.5, 0, 3.6, X.machineDark, flat);
      for (let b = x + 1; b < x + 13; b += rand(3.6, 5.4))
        part(group, b, 227.5, b + 3, 231, 4.4, 4.4 + rand(1.6, 3), X.cardboard);
      fixture(group);
    }
    const stack = (x, y, levels = 3) => {
      const group = new THREE.Group();
      part(group, x, y, x + 11, y + 11, 0, 1, X.pallet);
      for (let l = 0; l < levels; l++)
        for (const [dx, dy] of [
          [0.4, 0.4],
          [5.7, 0.4],
          [0.4, 5.7],
          [5.7, 5.7],
        ])
          if (l < levels - 1 || random() < 0.7)
            part(
              group,
              x + dx,
              y + dy,
              x + dx + 4.9,
              y + dy + 4.9,
              1 + l * 2.6,
              3.5 + l * 2.6,
              X.cardboard,
            );
      return fixture(group);
    };
    stack(158, 232, 2);
    stack(172, 220, 3);
    // Office behind glazed partitions.
    {
      const group = new THREE.Group();
      const glazing = new THREE.MeshStandardMaterial({
        color: "#9fc3cf",
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.35,
      });
      part(group, fx0, 288, 100, 289.2, 0, 4, X.partition);
      part(group, fx0, 288.3, 100, 288.9, 4, 9, glazing, flat);
      part(group, fx0, 288, 100, 289.2, 9, 9.6, X.cut);
      for (const [y0, y1] of [
        [289.2, 302],
        [314, fy1],
      ]) {
        part(group, 98.8, y0, 100, y1, 0, 4, X.partition);
        part(group, 99.1, y0, 99.7, y1, 4, 9, glazing, flat);
        part(group, 98.8, y0, 100, y1, 9, 9.6, X.cut);
      }
      fixture(group);
      for (const [x, y] of [
        [24, 300],
        [48, 300],
        [72, 300],
        [30, 328],
        [62, 328],
      ]) {
        const desk = new THREE.Group();
        part(desk, x, y, x + 14, y + 7, 2.8, 3.4, X.desk);
        part(
          desk,
          x + 0.6,
          y + 0.6,
          x + 13.4,
          y + 6.4,
          0,
          2.8,
          X.machineDark,
          flat,
        );
        part(desk, x + 4, y + 1, x + 9, y + 1.5, 3.4, 6.6, X.belt);
        fixture(desk);
      }
    }
    // Air handling unit with its duct.
    {
      const group = new THREE.Group();
      part(group, 112, 322, 176, 344, 0, 11, X.machine);
      part(group, 112, 343.9, 176, 344.2, 7, 8.4, X.accent, flat);
      for (const x of [120, 142, 164])
        part(group, x, 343.9, x + 8, 344.3, 1.5, 6, X.machineDark, flat);
      const duct = new THREE.CylinderGeometry(3.4, 3.4, 12, 16);
      group.add(place(mesh(duct, M.metal), 126, 332, 17));
      fixture(group);
    }
    // Warehouse: pallet racking along the building.
    const rack = (x0, x1) => {
      const group = new THREE.Group();
      for (let y = 62; y <= 196.1; y += 13.4)
        for (const x of [x0, x1 - 0.5])
          part(group, x, y - 0.25, x + 0.5, y + 0.25, 0, 20, X.accent);
      for (const z of [6.6, 13.2])
        for (const x of [x0, x1 - 0.5])
          part(group, x, 62, x + 0.5, 196, z, z + 0.8, X.orange);
      for (let y = 62.8; y < 195; y += 13.4)
        for (const z of [0, 7.4, 14])
          if (random() < 0.86)
            part(
              group,
              x0 + 0.7,
              y,
              x1 - 0.7,
              y + rand(9.5, 11.8),
              z,
              z + rand(3.6, 5.2),
              random() < 0.75 ? X.cardboard : X.chilled,
            );
      fixture(group);
    };
    rack(204, 210);
    rack(234, 248);
    rack(277, 283.4);
    stack(206, 292, 3);
    stack(206, 310, 2);
    stack(244, 300, 3);
    // Forklift.
    {
      const group = new THREE.Group();
      part(group, -4.5, -3, 3.5, 3, 0.8, 4.2, X.yellow);
      part(group, -4.5, -2.6, -1.5, 2.6, 4.2, 5.4, X.machineDark);
      for (const [px, py] of [
        [-2.6, -2.4],
        [-2.6, 2.4],
        [1.4, -2.4],
        [1.4, 2.4],
      ])
        part(
          group,
          px,
          py - 0.15,
          px + 0.3,
          py + 0.15,
          4.2,
          8.6,
          X.machineDark,
          flat,
        );
      part(group, -2.9, -2.7, 2, 2.7, 8.6, 9, X.machineDark);
      for (const side of [-1.6, 1.6]) {
        part(group, 3.5, side - 0.25, 4.1, side + 0.25, 0.4, 10, X.machineDark);
        part(group, 4.1, side - 0.35, 9, side + 0.35, 0.5, 0.8, X.machineDark);
      }
      part(group, 4.6, -2.6, 9, 2.6, 0.8, 3.8, X.cardboard);
      fixture(place(group, 262, 232, 0, -Math.PI / 2));
    }
  }

  // --- Supermarket -------------------------------------------------------------
  shell(K, {
    device: "MARKET_01",
    wallMaterial: X.marketWall,
    floor: X.marketFloor,
    frame: X.whiteSteel,
    doors: [
      [328, 348],
      [536, 556],
    ],
    frames: [120, 215, 310],
    power: 330,
  });
  // Goods on shelves, painted as rows of packs.
  const PACKS = {
    grocery: [
      "#c8452f",
      "#e0b53a",
      "#3f7a5a",
      "#2f6f9f",
      "#e9e6dc",
      "#7a4a8c",
      "#d9772b",
      "#8b5a3c",
    ],
    dairy: ["#f4f3ee", "#e8eef4", "#bcd6ee", "#f0d77a", "#e7f0dc", "#d8e6f2"],
    meat: ["#b5433f", "#d98a7c", "#f0e2d6", "#8f2f2c", "#e2b8a6"],
    frozen: ["#dfeaf2", "#7fb0d6", "#2f6f9f", "#f2f4f6", "#c9485a"],
  };
  const shelves = (palette, length, { rows = 4, back = "#2a2e31" } = {}) =>
    painted(Math.round(length * 9), 96, (g, w, h) => {
      g.fillStyle = back;
      g.fillRect(0, 0, w, h);
      const row = h / rows;
      for (let r = 0; r < rows; r++) {
        let x = 0;
        while (x < w) {
          const width = rand(7, 20);
          const height = row * rand(0.5, 0.84);
          g.fillStyle = pick(palette);
          g.fillRect(x + 1, (r + 1) * row - 3 - height, width - 2, height);
          x += width;
        }
        g.fillStyle = "#e3e4e2";
        g.fillRect(0, (r + 1) * row - 3, w, 3);
      }
    });
  // Refrigerated cabinets glow with their own cold white light.
  const chilled = (map) =>
    new THREE.MeshStandardMaterial({
      map,
      emissive: "#e4f1ff",
      emissiveMap: map,
      emissiveIntensity: 0.95,
      roughness: 0.4,
    });
  {
    const ky0 = K.y0 + WALL;
    const kx1 = K.x1 - WALL;
    // Gondolas in two blocks, their aisles running towards the viewer.
    const shelf = plain("#eceae4", 0.6);
    // Seen from above: the top shelf's goods either side of the spine.
    const topShelf = (length) =>
      new THREE.MeshStandardMaterial({
        map: painted(90, Math.round(length * 9), (g, w, h) => {
          g.fillStyle = "#e3e4e2";
          g.fillRect(0, 0, w, h);
          for (const x of [5, 49]) {
            let y = 4;
            while (y < h - 6) {
              const depth = rand(8, 20);
              g.fillStyle = pick(PACKS.grocery);
              g.fillRect(x + rand(0, 5), y + 1, rand(26, 34), depth - 2);
              y += depth;
            }
          }
        }),
        roughness: 0.7,
      });
    for (const x of [344, 376, 408, 440, 472, 504])
      for (const [y0, y1] of [
        [72, 150],
        [170, 248],
      ]) {
        const group = new THREE.Group();
        const side = () =>
          new THREE.MeshStandardMaterial({
            map: shelves(PACKS.grocery, y1 - y0),
            roughness: 0.7,
          });
        const end = plain(
          pick(["#c8452f", "#2f6f9f", "#e0b53a", "#3f7a5a"]),
          0.6,
        );
        part(
          group,
          x - 5,
          y0,
          x + 5,
          y1,
          0,
          8,
          faces({
            east: side(),
            west: side(),
            top: topShelf(y1 - y0),
            front: end,
            back: end,
            rest: shelf,
          }),
        );
        fixture(group);
      }
    // Open chillers along the back wall: dairy, then meat and delicatessen.
    for (const [x0, x1, palette, banner] of [
      [322, 408, PACKS.dairy, "#2f6f9f"],
      [414, 500, PACKS.meat, "#a8372f"],
    ]) {
      const group = new THREE.Group();
      part(
        group,
        x0,
        ky0,
        x1,
        55,
        0,
        9,
        faces({
          front: chilled(shelves(palette, x1 - x0, { back: "#11161a" })),
          rest: X.chilled,
        }),
      );
      part(group, x0, ky0, x1, 56.2, 9, 10, X.chilled);
      fixture(group);
      add(box(x0, ky0, x1, ky0 + 0.15, 14, 21, plain(banner, 0.7), flat));
    }
    // Walk-in cold room in the back corner.
    {
      const group = new THREE.Group();
      part(group, 510, ky0, kx1, 90, 0, 13, X.chilled);
      for (let x = 522; x < kx1; x += 12)
        part(group, x, 90, x + 0.2, 90.12, 0, 13, X.machine, flat);
      part(group, 539, 90, 551, 90.4, 0, 9.4, X.machine, flat);
      part(group, 549.4, 90.4, 550, 90.9, 3.6, 5.6, X.machineDark, flat);
      part(group, 520, 56, 540, 70, 13, 16.5, X.machine);
      part(group, 524, 70, 536, 70.2, 13.6, 15.9, X.machineDark, flat);
      fixture(group);
    }
    // Upright freezers behind glass doors along the side wall.
    {
      const group = new THREE.Group();
      const doors = painted(1350, 96, (g, w, h) => {
        g.fillStyle = "#101820";
        g.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 90) {
          for (let r = 0; r < 4; r++) {
            let px = x + 8;
            while (px < x + 78) {
              const width = rand(8, 18);
              g.fillStyle = pick(PACKS.frozen);
              g.fillRect(px, r * 22 + 6 + rand(0, 6), width - 2, 13);
              px += width;
            }
            g.fillStyle = "#cfd8de";
            g.fillRect(x + 6, r * 22 + 21, 78, 2);
          }
          g.fillStyle = "#e9edf0";
          g.fillRect(x, 0, 6, h);
          g.fillRect(x + 84, 0, 6, h);
          g.fillRect(x, 0, 90, 4);
        }
      });
      part(
        group,
        578,
        100,
        kx1,
        250,
        0,
        9,
        faces({ west: chilled(doors), rest: X.chilled }),
      );
      fixture(group);
    }
    // Chest freezers in two islands.
    for (const [y0, y1] of [
      [104, 166],
      [184, 246],
    ]) {
      const group = new THREE.Group();
      const top = painted(108, Math.round((y1 - y0) * 9), (g, w, h) => {
        g.fillStyle = "#f2f4f5";
        g.fillRect(0, 0, w, h);
        for (let y = 6; y < h - 20; y += 92)
          for (const x of [7, 57]) {
            g.fillStyle = "#16202a";
            g.fillRect(x, y, 44, 84);
            for (let i = 0; i < 14; i++) {
              g.fillStyle = pick(PACKS.frozen);
              g.fillRect(
                x + rand(2, 30),
                y + rand(2, 68),
                rand(8, 14),
                rand(8, 14),
              );
            }
          }
      });
      part(
        group,
        536,
        y0,
        548,
        y1,
        0,
        4.5,
        faces({ top: chilled(top), rest: X.chilled }),
      );
      fixture(group);
    }
    // Fruit and vegetables: crates along the side wall and two islands.
    const crates = (x0, y0, x1, y1, z) => {
      const group = new THREE.Group();
      part(group, x0, y0, x1, y1, 0, z, X.desk);
      for (let y = y0 + 0.5; y < y1 - 3; y += 4.4)
        for (let x = x0 + 0.5; x < x1 - 2; x += 4.2)
          part(
            group,
            x,
            y,
            Math.min(x1 - 0.4, x + 3.7),
            y + 3.8,
            z,
            z + rand(0.5, 1.1),
            plain(
              pick([
                "#c8452f",
                "#e0b53a",
                "#5f8a3a",
                "#d9772b",
                "#8ea63a",
                "#a23b52",
              ]),
              0.8,
            ),
            flat,
          );
      fixture(group);
    };
    crates(K.x0 + WALL, 72, 323, 248, 3.6);
    crates(350, 284, 368, 292, 3.6);
    crates(350, 296, 368, 304, 3.6);
    // Checkouts: a counter with its belt and till.
    for (const x of [392, 424, 456, 488, 520]) {
      const group = new THREE.Group();
      part(group, x - 3, 284, x + 3, 310, 0, 4, X.machine);
      part(group, x - 2.2, 285, x + 2.2, 301, 4, 4.2, X.belt, flat);
      part(group, x - 2.4, 303, x + 2.4, 308, 4, 6.2, X.machineDark);
      fixture(group);
    }
    // Distribution board by the exit.
    {
      const group = new THREE.Group();
      part(group, 580, 320, kx1, 340, 0, 10, X.machine);
      part(group, 579.85, 322, 580, 338, 1, 9, X.machineDark, flat);
      fixture(group);
    }
    // Entrance canopy with the shop's sign, and the trolley shelter.
    const sign = painted(256, 64, (g, w, h) => {
      g.fillStyle = "#16643f";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#ffffff";
      g.font = "bold 44px Arial, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("MARKET", w / 2, h / 2 + 3);
    });
    const signGlow = new THREE.MeshStandardMaterial({
      map: sign,
      emissive: "#ffffff",
      emissiveMap: sign,
      emissiveIntensity: 0.85,
      roughness: 0.4,
    });
    signGlow.userData.on = { intensity: 0.85 };
    const signDevice = world.devices.SIGN_01;
    {
      const group = new THREE.Group();
      part(group, 322, K.y1, 354, 364, 11, 12.4, X.whiteSteel);
      for (const x of [323, 353])
        part(group, x - 0.4, 363, x + 0.4, 363.8, 2, 11, X.whiteSteel);
      part(
        group,
        326,
        364,
        350,
        364.2,
        12.4,
        18.4,
        faces({ front: signGlow, rest: X.cut }),
        flat,
      );
      add(group);
      occluder(group, "canopy");
    }
    {
      const group = new THREE.Group();
      for (const x of [372, 396])
        part(group, x - 0.3, 356, x + 0.3, 368, 2, 8, X.whiteSteel, flat);
      part(group, 371, 355, 397, 369, 8, 8.5, M.glassDark);
      for (let y = 357; y < 367; y += 3.2)
        part(group, 374, y, 394, y + 2.2, 2, 5, M.metal);
      add(group);
      occluder(group, "canopy");
    }
    // Pylon sign by the road.
    {
      const group = new THREE.Group();
      part(group, 304, 520, 316, 522.4, 1.6, 26, X.whiteSteel);
      part(
        group,
        304.6,
        522.4,
        315.4,
        522.6,
        19,
        25.2,
        faces({ front: signGlow, rest: X.cut }),
        flat,
      );
      add(group);
      occluder(group, "lamp");
      signDevice.meshes.push(group);
      const lamp = new THREE.PointLight("#dff5e6", 320, 70, 2);
      lamp.position.set(310, 22, 527);
      add(lamp);
      signDevice.lights.push(lamp);
    }
    // The sign's panels switch like the glazing of the other devices, but
    // keep their artwork.
    signDevice.sign = signGlow;
  }

  // --- Yard, car park and road ------------------------------------------------
  const paints = [
    "#d9d4c9",
    "#35465e",
    "#8f4038",
    "#9a9fa3",
    "#8d9295",
    "#2b2f33",
    "#6d7470",
    "#c3c3bd",
    "#f2f1ed",
    "#4b5a3f",
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
    add(place(group, x, y, 1.05, heading));
    occluder(group, "car");
  }
  const bays = (x0, x1, y0, y1, width = 17) => {
    for (let x = x0; x <= x1 + 0.1; x += width)
      add(box(x - 0.5, y0, x + 0.5, y1, 1, 1.12, X.markings, flat));
  };
  const parking = { total: 0, parked: 0 };
  const park = (x0, x1, y, heading, empty = []) => {
    for (let x = x0, i = 0; x < x1 - 8; x += 17, i++) {
      if (empty.includes(i)) continue;
      parking.total++;
      if (random() >= 0.72) continue;
      parking.parked++;
      car(x + 8.5, y, heading + rand(-0.04, 0.04));
    }
  };
  const lot = LAYOUT.lot;
  for (const y of lot.rows) bays(lot.x[0], lot.x[1], y, y + lot.bay);
  add(box(lot.x[0], 463.5, lot.x[1], 464.5, 1, 1.12, X.markings, flat));
  // The crossing from the car park to the entrance takes one bay of the row.
  {
    const x = lot.x[0] + lot.crossing * 17;
    for (let y = 378; y < 410; y += 4)
      add(box(x + 2, y, x + 15, y + 2.2, 1, 1.13, X.markings, flat));
  }
  park(lot.x[0], lot.x[1], lot.rows[0] + 12, -Math.PI / 2, [lot.crossing]);
  park(lot.x[0], lot.x[1], lot.rows[1] + 12, -Math.PI / 2);
  park(lot.x[0], lot.x[1], lot.rows[2] + 12, Math.PI / 2);
  world.parking = parking;
  // Staff parking in the yard.
  bays(60, 179, 386, 410);
  for (let x = 60, i = 0; x < 170; x += 17, i++)
    if (i !== 2 && i !== 5) car(x + 8.5, 398, -Math.PI / 2 + rand(-0.04, 0.04));

  // Articulated lorry backed up to the first dock.
  {
    const group = new THREE.Group();
    const wheel = new THREE.CylinderGeometry(1.7, 1.7, 1.3, 14);
    wheel.rotateX(Math.PI / 2);
    const wheels = (x) => {
      for (const side of [-4.4, 4.4])
        group.add(place(mesh(wheel, M.tyre), x, side, 1.7));
    };
    part(group, -30, -5.2, 26, 5.2, 4.4, 16.4, X.chilled);
    part(group, -30, -4.6, 26, 4.6, 2.6, 4.4, X.machineDark);
    part(group, -30, -5.25, 26, 5.25, 9, 10.4, X.accent, flat);
    for (const x of [-25, -21, -17]) wheels(x);
    part(group, 22, -4.4, 37, 4.4, 2.2, 4, X.machineDark);
    part(group, 28.5, -4.9, 37.5, 4.9, 3.4, 13.6, M.paint("#2f5a78"));
    part(group, 35, -4.5, 37.6, 4.5, 8.6, 12.4, M.glassDark, flat);
    for (const x of [24, 34]) wheels(x);
    add(place(group, 227, 387.5, 1.05, Math.PI / 2));
    occluder(group, "car");
  }
  // Dock bumpers and the roller doors, raised.
  for (const [x0, x1] of [
    [214, 240],
    [250, 276],
  ])
    add(box(x0, F.y1 - 0.4, x1, F.y1, FLOOR + 9, FLOOR + 10.6, X.machineDark));
  // Silos at the corner of the plant.
  for (const y of [398, 420]) {
    const group = new THREE.Group();
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(7.6, 7.6, 24, 24), M.metal),
        0,
        0,
        16,
      ),
    );
    group.add(
      place(mesh(new THREE.ConeGeometry(7.6, 5, 24), M.metal), 0, 0, 30.5),
    );
    for (const [dx, dy] of [
      [-5, -5],
      [5, -5],
      [-5, 5],
      [5, 5],
    ])
      part(group, dx - 0.5, dy - 0.5, dx + 0.5, dy + 0.5, 0, 6, X.steel);
    add(place(group, 30, y, 1.1));
    occluder(group, "silo");
  }
  // Containers, pallets waiting outside, and a skip.
  for (const [x, y, z, color] of [
    [20, 462, 0, "#2f5a78"],
    [20, 474, 0, "#9a4a32"],
    [48, 468, 0, "#5d6a73"],
    [20, 468, 10, "#3f7a5a"],
  ]) {
    const item = box(
      x,
      y,
      x + 25,
      y + 10,
      1.1 + z,
      11.1 + z,
      plain(color, 0.6, 0.3),
    );
    occluder(add(item), "container");
  }
  for (const [x, y] of [
    [150, 452],
    [164, 452],
    [150, 466],
  ]) {
    const group = new THREE.Group();
    part(group, x, y, x + 11, y + 11, 1.1, 2.1, X.pallet);
    part(
      group,
      x + 0.5,
      y + 0.5,
      x + 10.5,
      y + 10.5,
      2.1,
      rand(5, 9),
      X.cardboard,
    );
    occluder(add(group), "fixture");
  }
  // Fence and sliding gate along the yard's front.
  {
    const group = new THREE.Group();
    for (const [x0, x1] of [
      [6, 118],
      [152, 290],
    ]) {
      part(group, x0, 522, x1, 522.3, 5.4, 5.8, X.machineDark, flat);
      part(group, x0, 522, x1, 522.3, 3.2, 3.5, X.machineDark, flat);
      for (let x = x0; x <= x1; x += 8.5)
        part(group, x, 521.9, x + 0.4, 522.4, 1.1, 6.2, X.machineDark, flat);
    }
    part(group, 150, 520.4, 184, 520.8, 1.6, 6, X.accent, flat);
    add(group);
  }

  // Yard and car park lamps.
  for (const [id, [x, y]] of Object.entries(YARD_LAMPS)) {
    const group = new THREE.Group();
    const h = 27;
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(0.4, 0.65, h, 8), M.darkMetal),
        0,
        0,
        h / 2,
      ),
    );
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.4, 8), M.darkMetal),
        0,
        0,
        0.7,
      ),
    );
    part(group, -3.4, -0.9, 3.4, 0.9, h, h + 0.7, M.darkMetal);
    for (const side of [-2.1, 2.1])
      part(
        group,
        side - 1.2,
        -0.7,
        side + 1.2,
        0.7,
        h - 0.35,
        h,
        litGlass("#ffe0a0", 3.4, id),
        flat,
      );
    add(place(group, x, y, 1));
    const lamp = new THREE.PointLight("#ffc584", 1500, 150, 2);
    lamp.position.set(x, h - 1, y);
    add(lamp);
    world.devices[id].lights.push(lamp);
    world.devices[id].meshes.push(group);
    occluder(group, "lamp");
  }

  // Gateway mast and light sensor on the plant's back wall.
  {
    const [gx, gy] = SENSORS.gateway;
    add(
      box(gx - 0.3, gy - 0.3, gx + 0.3, gy + 0.3, F.h, F.h + 13, M.darkMetal),
    );
    add(
      box(
        gx - 1.6,
        gy - 0.9,
        gx + 1.6,
        gy + 0.9,
        F.h + 3,
        F.h + 6.4,
        X.chilled,
      ),
    );
    const [lx, ly] = SENSORS.lux;
    add(
      box(lx - 0.2, ly - 0.2, lx + 0.2, ly + 0.2, F.h, F.h + 3.4, M.darkMetal),
    );
    add(box(lx - 1, ly - 1, lx + 1, ly + 1, F.h + 3.4, F.h + 4.6, X.chilled));
  }

  scene.traverse((item) => {
    if (!item.isMesh) return;
    const scale = item.material?.userData?.scale;
    if (scale) worldUV(item.geometry, scale, item);
  });
  return { scene, world, materials: M };
}

// Switches a device's lamps and glazing; the shop's sign keeps its artwork.
export function setDevice(world, id, on) {
  switchDevice(world, id, on);
  const { sign } = world.devices[id];
  if (sign) sign.emissiveIntensity = on ? sign.userData.on.intensity : 0;
}
