// Three.js model of the smart-marina maquette, rendered in a headless browser
// by scripts/generate-marina-maquette.mjs.
//
// World units are millimetres on the 60 × 60 cm board: x to the right, y
// towards the viewer, z up, origin at the board's back-left corner. In three.js
// that is (x, z, y). The camera is fitted to the city photo's board outline,
// so both maquettes share one geometry (scene pixels 1536 × 1024).

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const SCENE_W = 1536;
export const SCENE_H = 1024;
// [x, y, z, pitch, yaw, focal, principal x, principal y], fitted to the city
// photo's board corners.
export const CAMERA = [
  306.06093, 1132.10177, 623.06862, 0.70541, -0.00658, 1816.51778, 772.99048,
  471.55042,
];

// ---------------------------------------------------------------------------
// Layout (mm). The town fills the back of the board, the coast road and
// promenade run across it, and the marina sits in the middle between the west
// quay (hotel, car park, harbour office) and the east quay (restaurant,
// sanitary block, car park, fuel kiosk). The sea runs across the front.
export const LAYOUT = {
  townBack: 156,
  road: [162, 198],
  promenade: [198, 238],
  westQuay: [0, 172],
  eastQuay: [428, 600],
  quayFront: 536,
  piers: [292, 372, 452],
  pierEnds: { west: 262, east: 338 },
  berth: 20.5,
  entrance: [262, 338],
  breakwaterY: 538,
  waterZ: -5,
  westLot: {
    x: [10, 164],
    rows: [
      [326, 352],
      [380, 404],
      [404, 428],
      [452, 476],
    ],
    island: 132,
  },
  eastLot: {
    x: [436, 594],
    rows: [
      [380, 404],
      [460, 484],
    ],
  },
};

// Devices: switchable lighting.
export const DEVICES = [
  "HOTEL_01",
  "RESTAURANT_01",
  "SANITARY_01",
  "PIER_01",
  "PIER_02",
  "PIER_03",
  "PIER_04",
];
const PIER_LAMPS = {
  PIER_01: [257, LAYOUT.piers[0] - 3],
  PIER_02: [257, LAYOUT.piers[2] - 3],
  PIER_03: [343, LAYOUT.piers[0] - 3],
  PIER_04: [343, LAYOUT.piers[2] - 3],
};

// Sensor pins (world points).
export const SENSORS = {
  "sea-level": [300, 239, 1.5],
  berths: [214, 372, 1.5],
  "shore-power": [382, 372, 7],
  fuel: [432, 508, 10],
  "sanitary-water": [522, 372, 8],
  "hotel-power": [150, 300, 9],
  parking: [70, 366, 1],
  wind: [104, 520, 66],
};

// ---------------------------------------------------------------------------
const rngOf = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
let random = rngOf(20260927);
const rand = (a, b) => a + random() * (b - a);
const pick = (list) => list[Math.floor(random() * list.length)];

// World (x, y, z) to three.js.
const V = (x, y, z = 0) => new THREE.Vector3(x, z, y);
function place(object, x, y, z = 0, heading = 0) {
  object.position.set(x, z, y);
  object.rotation.y = -heading;
  return object;
}

// ---------------------------------------------------------------------------
// Procedural textures, drawn on canvases.
function canvas(size, paint) {
  const element = document.createElement("canvas");
  element.width = element.height = size;
  paint(element.getContext("2d"), size);
  return element;
}
function texture(element, { srgb = true, repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(element);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 16;
  return t;
}
function speckle(g, size, count, colors, min = 0.5, max = 1.6) {
  for (let i = 0; i < count; i++) {
    g.fillStyle = pick(colors);
    g.globalAlpha = rand(0.08, 0.35);
    const r = rand(min, max);
    g.fillRect(rand(0, size), rand(0, size), r, r);
  }
  g.globalAlpha = 1;
}
function mottle(g, size, colors, count = 60, radius = [20, 90]) {
  for (let i = 0; i < count; i++) {
    const x = rand(0, size);
    const y = rand(0, size);
    const r = rand(...radius);
    const gradient = g.createRadialGradient(x, y, 0, x, y, r);
    const color = pick(colors);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "transparent");
    g.globalAlpha = rand(0.06, 0.18);
    g.fillStyle = gradient;
    for (const dx of [-size, 0, size])
      for (const dy of [-size, 0, size])
        g.fillRect(x - r + dx, y - r + dy, r * 2, r * 2);
  }
  g.globalAlpha = 1;
}
// Height canvas to a tangent-space normal map.
function normalMap(height, strength = 2) {
  const size = height.width;
  const src = height.getContext("2d").getImageData(0, 0, size, size).data;
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const g = out.getContext("2d");
  const image = g.createImageData(size, size);
  const h = (x, y) =>
    src[(((y + size) % size) * size + ((x + size) % size)) * 4] / 255;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const dx = (h(x - 1, y) - h(x + 1, y)) * strength;
      const dy = (h(x, y - 1) - h(x, y + 1)) * strength;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      image.data[i] = ((dx / l) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((dy / l) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  g.putImageData(image, 0, 0);
  return texture(out, { srgb: false });
}

// Surfaces use world-space UVs (see worldUV), so `scale` is millimetres per
// texture repeat.
function makeMaterials() {
  const m = {};
  const pavers = (base, joint, tile, size = 512) => {
    const height = canvas(size, (g) => {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, size, size);
      g.fillStyle = "#8a8a8a";
      for (let y = 0; y < size; y += tile) {
        g.fillRect(0, y, size, 2);
        const offset = (y / tile) % 2 ? tile / 2 : 0;
        for (let x = offset; x < size + tile; x += tile)
          g.fillRect(x, y, 2, tile);
      }
    });
    const color = canvas(size, (g) => {
      g.fillStyle = base;
      g.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += tile) {
        const offset = (y / tile) % 2 ? tile / 2 : 0;
        for (let x = offset - tile; x < size + tile; x += tile) {
          g.fillStyle = `rgba(${random() < 0.5 ? "255,250,240" : "40,35,30"},${rand(0.02, 0.1)})`;
          g.fillRect(x, y, tile, tile);
        }
      }
      speckle(g, size, 5000, ["#5a5249", "#fff8ea", "#8a8074"]);
      g.globalCompositeOperation = "multiply";
      g.drawImage(height, 0, 0);
      g.globalCompositeOperation = "source-over";
    });
    return {
      map: texture(color),
      normalMap: normalMap(height, 1.2),
      roughness: 0.92,
    };
  };
  const promenade = pavers("#a99f8f", "#6f675c", 32);
  m.promenade = new THREE.MeshStandardMaterial({
    ...promenade,
    userData: { scale: 40 },
  });
  const town = pavers("#9c9282", "#655d52", 16);
  m.townPaving = new THREE.MeshStandardMaterial({
    ...town,
    userData: { scale: 40 },
  });
  const quay = pavers("#a1988a", "#6a6258", 48);
  m.quay = new THREE.MeshStandardMaterial({ ...quay, userData: { scale: 60 } });

  const asphalt = canvas(512, (g, s) => {
    // Worn mid-grey, as the roads on the city model.
    g.fillStyle = "#6a6d6f";
    g.fillRect(0, 0, s, s);
    mottle(g, s, ["#5b5e61", "#787b7d", "#636669"], 50);
    speckle(
      g,
      s,
      16000,
      ["#484b4d", "#8a8d8f", "#75787a", "#a3a5a6"],
      0.6,
      1.4,
    );
  });
  m.asphalt = new THREE.MeshStandardMaterial({
    map: texture(asphalt),
    roughness: 0.74,
    userData: { scale: 45 },
  });

  const grassHeight = canvas(512, (g, s) => {
    g.fillStyle = "#777";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 18000; i++) {
      g.fillStyle = random() < 0.5 ? "#fff" : "#000";
      g.globalAlpha = rand(0.05, 0.25);
      g.fillRect(rand(0, s), rand(0, s), rand(1, 2.5), rand(1, 2.5));
    }
    g.globalAlpha = 1;
  });
  const grass = canvas(512, (g, s) => {
    g.fillStyle = "#56693d";
    g.fillRect(0, 0, s, s);
    mottle(g, s, ["#3f5230", "#6b7d45", "#4b5e33", "#7a8550"], 90, [15, 70]);
    speckle(g, s, 22000, ["#2f3f22", "#7f9152", "#9aa564", "#3d4c2b"], 0.8, 2);
  });
  m.grass = new THREE.MeshStandardMaterial({
    map: texture(grass),
    normalMap: normalMap(grassHeight, 4),
    roughness: 0.97,
    userData: { scale: 40 },
  });

  const stoneHeight = canvas(512, (g, s) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#222";
    const rows = 8;
    for (let r = 0; r < rows; r++) {
      const y = (r * s) / rows;
      g.fillRect(0, y, s, 3);
      let x = r % 2 ? -rand(10, 40) : 0;
      while (x < s) {
        g.fillRect(x, y, 3, s / rows);
        x += rand(40, 90);
      }
    }
  });
  const stone = canvas(512, (g, s) => {
    g.fillStyle = "#9b958a";
    g.fillRect(0, 0, s, s);
    mottle(g, s, ["#7d776c", "#b3ada2", "#8b8478", "#6c675e"], 70, [10, 50]);
    speckle(g, s, 9000, ["#5b564e", "#d0cabe"]);
    g.globalCompositeOperation = "multiply";
    g.drawImage(stoneHeight, 0, 0);
    g.globalCompositeOperation = "source-over";
  });
  m.stone = new THREE.MeshStandardMaterial({
    map: texture(stone),
    normalMap: normalMap(stoneHeight, 3),
    roughness: 0.9,
    userData: { scale: 40 },
  });
  // Lower courses darkened by the water.
  m.quayWall = new THREE.MeshStandardMaterial({
    map: texture(stone),
    normalMap: normalMap(stoneHeight, 3),
    roughness: 0.85,
    color: "#8f8a80",
    userData: { scale: 30 },
  });

  const stuccoHeight = canvas(256, (g, s) => {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = random() < 0.5 ? "#fff" : "#000";
      g.globalAlpha = rand(0.03, 0.12);
      g.fillRect(rand(0, s), rand(0, s), rand(1, 3), rand(1, 3));
    }
  });
  const stucco = canvas(256, (g, s) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, s, s);
    mottle(g, s, ["#d8d0c0", "#ffffff", "#e6ddcc"], 40, [10, 50]);
    speckle(g, s, 5000, ["#bfb6a6", "#ffffff"]);
  });
  m.stuccoMap = texture(stucco);
  m.stuccoNormal = normalMap(stuccoHeight, 1.5);
  m.stucco = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      map: m.stuccoMap,
      normalMap: m.stuccoNormal,
      roughness: 0.93,
      userData: { scale: 30 },
    });

  // Mediterranean clay tiles: courses of half-round tiles down the slope.
  const tileHeight = canvas(256, (g, s) => {
    const cols = 16;
    for (let c = 0; c < cols; c++) {
      const x = (c * s) / cols;
      const gradient = g.createLinearGradient(x, 0, x + s / cols, 0);
      gradient.addColorStop(0, "#222");
      gradient.addColorStop(0.5, "#fff");
      gradient.addColorStop(1, "#222");
      g.fillStyle = gradient;
      g.fillRect(x, 0, s / cols, s);
    }
    g.fillStyle = "#000";
    for (let r = 0; r < 10; r++) {
      g.globalAlpha = 0.55;
      g.fillRect(0, (r * s) / 10, s, 3);
    }
    g.globalAlpha = 1;
  });
  const tiles = canvas(256, (g, s) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, s, s);
    for (let c = 0; c < 16; c++)
      for (let r = 0; r < 10; r++) {
        g.fillStyle = `hsl(${rand(8, 24)} ${rand(35, 60)}% ${rand(55, 85)}%)`;
        g.globalAlpha = 0.35;
        g.fillRect((c * s) / 16, (r * s) / 10, s / 16, s / 10);
      }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "multiply";
    g.drawImage(tileHeight, 0, 0);
    g.globalCompositeOperation = "source-over";
    speckle(g, s, 3000, ["#5a3a2a", "#ffe8d0"]);
  });
  m.tileMap = texture(tiles);
  m.tileNormal = normalMap(tileHeight, 2.5);
  m.roof = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      map: m.tileMap,
      normalMap: m.tileNormal,
      roughness: 0.8,
      userData: { scale: 16, roof: true },
    });

  // Slate (or concrete) shingles in offset courses, as on the city model's houses.
  const slateHeight = canvas(256, (g, s) => {
    g.fillStyle = "#bbb";
    g.fillRect(0, 0, s, s);
    const rows = 12;
    const cols = 10;
    for (let r = 0; r < rows; r++) {
      const y = (r * s) / rows;
      const gradient = g.createLinearGradient(0, y, 0, y + s / rows);
      gradient.addColorStop(0, "#666");
      gradient.addColorStop(1, "#eee");
      g.fillStyle = gradient;
      g.fillRect(0, y, s, s / rows);
      g.fillStyle = "#222";
      g.fillRect(0, y, s, 2);
      const offset = r % 2 ? s / cols / 2 : 0;
      for (let c = -1; c <= cols; c++)
        g.fillRect(offset + (c * s) / cols, y, 2, s / rows);
    }
  });
  const slate = canvas(256, (g, s) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, s, s);
    for (let r = 0; r < 12; r++)
      for (let c = -1; c <= 10; c++) {
        g.fillStyle = `hsl(210 ${rand(4, 12)}% ${rand(60, 95)}%)`;
        g.globalAlpha = 0.5;
        g.fillRect(
          (c + (r % 2 ? 0.5 : 0)) * (s / 10),
          (r * s) / 12,
          s / 10,
          s / 12,
        );
      }
    g.globalAlpha = 1;
    g.globalCompositeOperation = "multiply";
    g.drawImage(slateHeight, 0, 0);
    g.globalCompositeOperation = "source-over";
    speckle(g, s, 2500, ["#2a2d30", "#f0f2f4"]);
  });
  m.slateMap = texture(slate);
  m.slateNormal = normalMap(slateHeight, 2);
  m.slate = (color) =>
    new THREE.MeshStandardMaterial({
      color,
      map: m.slateMap,
      normalMap: m.slateNormal,
      roughness: 0.7,
      userData: { scale: 18, roof: true },
    });

  const plankHeight = canvas(256, (g, s) => {
    g.fillStyle = "#999";
    g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 16) {
      g.fillStyle = "#222";
      g.fillRect(0, y, s, 2);
      for (let i = 0; i < 20; i++) {
        g.fillStyle = random() < 0.5 ? "#bbb" : "#777";
        g.globalAlpha = 0.4;
        g.fillRect(rand(0, s), y + rand(2, 14), rand(20, 90), 1);
      }
      g.globalAlpha = 1;
      g.fillStyle = "#333";
      g.fillRect(rand(0, s), y, 2, 16);
    }
  });
  const planks = (base) =>
    canvas(256, (g, s) => {
      g.fillStyle = base;
      g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 16) {
        g.fillStyle = `rgba(${random() < 0.5 ? "255,240,220" : "30,20,10"},${rand(0.04, 0.16)})`;
        g.fillRect(0, y, s, 16);
      }
      g.globalCompositeOperation = "multiply";
      g.drawImage(plankHeight, 0, 0);
      g.globalCompositeOperation = "source-over";
    });
  const plankNormal = normalMap(plankHeight, 2);
  m.deck = new THREE.MeshStandardMaterial({
    map: texture(planks("#a88b6a")),
    normalMap: plankNormal,
    roughness: 0.85,
    userData: { scale: 28 },
  });
  m.teak = new THREE.MeshStandardMaterial({
    map: texture(planks("#b58a5a")),
    normalMap: plankNormal,
    roughness: 0.7,
    userData: { scale: 10 },
  });
  m.cladding = new THREE.MeshStandardMaterial({
    map: texture(planks("#9a7350")),
    normalMap: plankNormal,
    roughness: 0.8,
    userData: { scale: 12, vertical: true },
  });

  const leafHeight = canvas(256, (g, s) => {
    g.fillStyle = "#666";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = random() < 0.55 ? "#fff" : "#000";
      g.globalAlpha = rand(0.1, 0.4);
      g.beginPath();
      g.ellipse(
        rand(0, s),
        rand(0, s),
        rand(1, 3),
        rand(0.6, 1.6),
        rand(0, 3.14),
        0,
        7,
      );
      g.fill();
    }
  });
  const leaf = canvas(256, (g, s) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 7000; i++) {
      g.fillStyle = pick([
        "#9fb07a",
        "#ffffff",
        "#c9d6a0",
        "#5f7048",
        "#e8e9b8",
      ]);
      g.globalAlpha = rand(0.2, 0.6);
      g.beginPath();
      g.ellipse(
        rand(0, s),
        rand(0, s),
        rand(1, 3),
        rand(0.6, 1.6),
        rand(0, 3.14),
        0,
        7,
      );
      g.fill();
    }
    g.globalAlpha = 1;
  });
  m.leafMap = texture(leaf);
  m.leafNormal = normalMap(leafHeight, 5);
  m.foliage = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: m.leafMap,
    normalMap: m.leafNormal,
    roughness: 0.95,
    userData: { scale: 9 },
  });
  m.bark = new THREE.MeshStandardMaterial({ color: "#5a4636", roughness: 1 });

  m.glassDark = new THREE.MeshStandardMaterial({
    color: "#1c2a33",
    roughness: 0.12,
    metalness: 0.4,
  });
  m.frame = new THREE.MeshStandardMaterial({
    color: "#e9e6de",
    roughness: 0.6,
  });
  m.frameDark = new THREE.MeshStandardMaterial({
    color: "#3a3f42",
    roughness: 0.5,
    metalness: 0.3,
  });
  m.shutter = new THREE.MeshStandardMaterial({
    color: "#3f5d4a",
    roughness: 0.7,
  });
  m.metal = new THREE.MeshStandardMaterial({
    color: "#b9bdbf",
    roughness: 0.3,
    metalness: 0.9,
  });
  m.darkMetal = new THREE.MeshStandardMaterial({
    color: "#2b3033",
    roughness: 0.45,
    metalness: 0.6,
  });
  m.concrete = new THREE.MeshStandardMaterial({
    color: "#c4bfb5",
    map: m.stuccoMap,
    normalMap: m.stuccoNormal,
    roughness: 0.95,
    userData: { scale: 40 },
  });
  m.white = new THREE.MeshStandardMaterial({
    color: "#f3f2ee",
    roughness: 0.5,
  });
  m.gelcoat = (color = "#f4f3ef") =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.25,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      side: THREE.DoubleSide,
    });
  m.canvas = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  m.paint = (color) =>
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.35,
      metalness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
  m.tyre = new THREE.MeshStandardMaterial({ color: "#1a1b1c", roughness: 0.9 });
  m.line = new THREE.MeshStandardMaterial({ color: "#e9e7df", roughness: 0.8 });
  m.pool = new THREE.MeshPhysicalMaterial({
    color: "#58c4d6",
    roughness: 0.05,
    transmission: 0,
    emissive: "#1f7f96",
    emissiveIntensity: 0.35,
  });
  m.rope = new THREE.MeshStandardMaterial({ color: "#2b2d2e", roughness: 0.8 });
  m.float = new THREE.MeshStandardMaterial({
    color: "#5d6a73",
    roughness: 0.6,
  });
  m.rock = (tone) =>
    new THREE.MeshStandardMaterial({
      color: tone,
      map: m.stuccoMap,
      normalMap: m.stuccoNormal,
      roughness: 0.95,
      userData: { scale: 12 },
    });
  return m;
}

// World-space (triplanar) UVs so every surface keeps the same texel size.
function worldUV(geometry, scale, object) {
  object.updateMatrixWorld(true);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  if (!position || !normal) return;
  const uv = new Float32Array(position.count * 2);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(object.matrixWorld);
  for (let i = 0; i < position.count; i++) {
    p.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
    n.fromBufferAttribute(normal, i).applyMatrix3(normalMatrix).normalize();
    const ax = Math.abs(n.x);
    const ay = Math.abs(n.y);
    const az = Math.abs(n.z);
    let u;
    let v;
    if (ay >= ax && ay >= az) [u, v] = [p.x, p.z];
    else if (ax >= az) [u, v] = [p.z, p.y];
    else [u, v] = [p.x, p.y];
    uv[i * 2] = u / scale;
    uv[i * 2 + 1] = v / scale;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

// ---------------------------------------------------------------------------
export function buildScene() {
  random = rngOf(20260927);
  const scene = new THREE.Scene();
  const M = makeMaterials();
  // Registry of what the renderer needs to know about.
  const world = {
    devices: Object.fromEntries(
      DEVICES.map((id) => [id, { lights: [], emissive: [], meshes: [] }]),
    ),
    occluders: [],
    water: null,
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
  // Emissive glass that follows a device (or is always lit).
  const litGlass = (color, intensity, device) => {
    const material = new THREE.MeshStandardMaterial({
      color: "#2a2620",
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.25,
    });
    material.userData.on = { intensity };
    if (device) world.devices[device].emissive.push(material);
    return material;
  };
  const occluder = (object, kind) => world.occluders.push({ object, kind });

  // --- Board base: plinth, rim and floor -----------------------------------
  // Matte charcoal, as on the city model: one body with a flat rim around the
  // board, rounded corners, and a jigsaw joint between the modules. Its front
  // is traced from the city photo's base (65,768 · 70,873 · 1462,897 ·
  // 1472,777), so the marina sits on the same studio floor and shadow: the
  // photo's base is not a true box in this camera, so below the board the
  // body is warped to that outline.
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: "#4a4a4d",
    roughness: 0.78,
    metalness: 0,
  });
  // The rim's top catches the key light and reads a shade lighter than the
  // front, as in the photo.
  const rimTopMaterial = new THREE.MeshStandardMaterial({
    color: "#47484b",
    roughness: 0.78,
    metalness: 0,
  });
  const PLINTH = { x0: -12, x1: 613.2, y0: -8, y1: 607, top: 1, radius: 3.5 };
  const FOOT = { x0: -28.4, x1: 630.6, z0: -74.8, z1: -87.4 };
  const WARP_FROM = LAYOUT.waterZ - 1;
  const warp = (geometry) => {
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const z = position.getY(i);
      if (z >= WARP_FROM) continue;
      const u = (position.getX(i) - PLINTH.x0) / (PLINTH.x1 - PLINTH.x0);
      const bottom = FOOT.z0 + (FOOT.z1 - FOOT.z0) * u;
      const w = (WARP_FROM - z) / (WARP_FROM - FOOT.z0);
      const x =
        PLINTH.x0 +
        (FOOT.x0 - PLINTH.x0) * w +
        (PLINTH.x1 -
          PLINTH.x0 +
          (FOOT.x1 - FOOT.x0 - (PLINTH.x1 - PLINTH.x0)) * w) *
          u;
      position.setXY(i, x, WARP_FROM + (bottom - WARP_FROM) * w);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    return geometry;
  };
  const roundRect = (path, x0, y0, x1, y1, r) => {
    path.moveTo(x0 + r, -y0);
    path.lineTo(x1 - r, -y0);
    path.quadraticCurveTo(x1, -y0, x1, -y0 - r);
    path.lineTo(x1, -y1 + r);
    path.quadraticCurveTo(x1, -y1, x1 - r, -y1);
    path.lineTo(x0 + r, -y1);
    path.quadraticCurveTo(x0, -y1, x0, -y1 + r);
    path.lineTo(x0, -y0 - r);
    path.quadraticCurveTo(x0, -y0, x0 + r, -y0);
    return path;
  };
  {
    // Built down to the photo's left bottom corner; the warp tilts and flares it.
    const outline = roundRect(
      new THREE.Shape(),
      PLINTH.x0,
      PLINTH.y0,
      PLINTH.x1,
      PLINTH.y1,
      PLINTH.radius,
    );
    outline.holes.push(
      roundRect(new THREE.Path(), 0.5, 0.5, 599.5, 599.5, 0.01),
    );
    const bevel = 0.9;
    const depth = PLINTH.top - FOOT.z0;
    const geometry = new THREE.ExtrudeGeometry(outline, {
      depth: depth - 2 * bevel,
      bevelEnabled: false,
      bevelSize: bevel,
      bevelOffset: -bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      curveSegments: 6,
    });
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, FOOT.z0 + bevel, 0);
    // Caps (the rim's top) and sides; the front takes no shadows, which only
    // smudge it at this depth.
    add(
      mesh(warp(geometry), [rimTopMaterial, baseMaterial], { receive: false }),
    );
    // Floor under the board.
    add(
      mesh(
        warp(
          new THREE.BoxGeometry(
            600,
            LAYOUT.waterZ - 0.3 - FOOT.z0,
            600,
          ).translate(300, (LAYOUT.waterZ - 0.3 + FOOT.z0) / 2, 300),
        ),
        baseMaterial,
      ),
    );
  }
  // The modules' joints, as on the city model: a groove down the plinth front
  // with the right module's jigsaw tab reaching into the left one, carried on
  // across the rim and the board where the four modules meet.
  const SEAM = { x: 300, y: 308 };
  const seamMaterial = new THREE.MeshStandardMaterial({
    color: "#050506",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  {
    const tab = { z: -41, neck: 22, head: 29, reach: 10, radius: 3.5 };
    const top = tab.z + tab.head / 2;
    const bottom = tab.z - tab.head / 2;
    const tip = SEAM.x - tab.reach;
    const path = new THREE.Path();
    path.moveTo(SEAM.x, PLINTH.top);
    path.lineTo(SEAM.x, tab.z + tab.neck / 2 + 1.4);
    // In at the neck, round the tab's four corners, and back out.
    path.quadraticCurveTo(
      SEAM.x,
      tab.z + tab.neck / 2,
      SEAM.x - 1.6,
      tab.z + tab.neck / 2,
    );
    path.quadraticCurveTo(SEAM.x - 2.6, top, SEAM.x - 4.6, top);
    path.lineTo(tip + tab.radius, top);
    path.quadraticCurveTo(tip, top, tip, top - tab.radius);
    path.lineTo(tip, bottom + tab.radius);
    path.quadraticCurveTo(tip, bottom, tip + tab.radius, bottom);
    path.lineTo(SEAM.x - 4.6, bottom);
    path.quadraticCurveTo(
      SEAM.x - 2.6,
      bottom,
      SEAM.x - 1.6,
      tab.z - tab.neck / 2,
    );
    path.quadraticCurveTo(
      SEAM.x,
      tab.z - tab.neck / 2,
      SEAM.x,
      tab.z - tab.neck / 2 - 1.4,
    );
    path.lineTo(SEAM.x, FOOT.z0 + 1.2);
    const points = path.getPoints(8).map((point) => [point.x, point.y]);
    // Ribbon along the path, just proud of the front face.
    const half = 0.5;
    const vertices = [];
    const index = [];
    points.forEach(([x, z], i) => {
      const [ax, az] = points[Math.max(0, i - 1)];
      const [bx, bz] = points[Math.min(points.length - 1, i + 1)];
      const length = Math.hypot(bx - ax, bz - az) || 1;
      const nx = -(bz - az) / length;
      const nz = (bx - ax) / length;
      vertices.push(
        x + nx * half,
        z + nz * half,
        PLINTH.y1 + 0.05,
        x - nx * half,
        z - nz * half,
        PLINTH.y1 + 0.05,
      );
      if (i)
        index.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    geometry.setIndex(index);
    add(mesh(warp(geometry), seamMaterial, { cast: false }));
    // Across the rim on all four sides.
    const flat = { cast: false, receive: false };
    const z = PLINTH.top + 0.04;
    for (const [y0, y1] of [
      [PLINTH.y0, 0.5],
      [599.5, PLINTH.y1 + 0.05],
    ])
      add(
        box(
          SEAM.x - half,
          y0,
          SEAM.x + half,
          y1,
          z - 0.3,
          z,
          seamMaterial,
          flat,
        ),
      );
    for (const [x0, x1] of [
      [PLINTH.x0, 0.5],
      [599.5, PLINTH.x1],
    ])
      add(
        box(
          x0,
          SEAM.y - half,
          x1,
          SEAM.y + half,
          z - 0.3,
          z,
          seamMaterial,
          flat,
        ),
      );
  }
  // The modules' trays show as a pale edge between the board and the rim.
  {
    const tray = new THREE.MeshStandardMaterial({
      color: "#8d8c88",
      roughness: 0.9,
    });
    const z1 = PLINTH.top + 0.35;
    const options = { cast: false };
    add(box(0, 599.5, 600, 600.9, LAYOUT.waterZ, z1, tray, options));
    add(box(0, -0.9, 600, 0.5, 0, z1, tray, options));
    add(box(-0.9, 0, 0.5, 600, LAYOUT.waterZ, z1, tray, options));
    add(box(599.5, 0, 600.9, 600, LAYOUT.waterZ, z1, tray, options));
  }

  // --- Water ----------------------------------------------------------------
  const waterNormals = (() => {
    const size = 512;
    const height = canvas(size, (g) => {
      g.fillStyle = "#808080";
      g.fillRect(0, 0, size, size);
      for (let i = 0; i < 900; i++) {
        const x = rand(0, size);
        const y = rand(0, size);
        const r = rand(4, 22);
        const gradient = g.createRadialGradient(x, y, 0, x, y, r);
        const bright = random() < 0.5;
        gradient.addColorStop(
          0,
          bright ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)",
        );
        gradient.addColorStop(1, "rgba(128,128,128,0)");
        g.fillStyle = gradient;
        for (const dx of [-size, 0, size])
          for (const dy of [-size, 0, size])
            g.fillRect(x - r + dx, y - r + dy, r * 2, r * 2);
      }
    });
    return normalMap(height, 6);
  })();
  // Resin water, as on the city model: deep teal, glossy and rippled, so every
  // lamp draws a long glittering streak across it.
  waterNormals.repeat.set(600 / 26, 362 / 26);
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(600, 362),
    // The glow of the tinted resin bed stands in for light scattered under the surface.
    new THREE.MeshPhysicalMaterial({
      color: "#123f45",
      emissive: "#0a2c31",
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0,
      normalMap: waterNormals,
      normalScale: new THREE.Vector2(0.5, 0.5),
      envMapIntensity: 0.8,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.name = "water";
  water.position.set(300, LAYOUT.waterZ, 238 + 181);
  water.receiveShadow = true;
  add(water);
  world.water = water;
  // Dark bed under the water, visible through nothing but keeps edges clean.
  add(
    box(
      0,
      238,
      600,
      600,
      -12,
      LAYOUT.waterZ - 0.5,
      new THREE.MeshStandardMaterial({ color: "#0d1d20", roughness: 1 }),
      { cast: false },
    ),
  );

  // --- Land -----------------------------------------------------------------
  const Z = LAYOUT.waterZ;
  const land = (points, material) =>
    add(slab(points, -12, 0, material, { cast: false }));
  // Town block and road corridor (back half, all land).
  land(rect(0, 0, 600, LAYOUT.road[0] - 6), M.townPaving);
  land(rect(0, LAYOUT.road[0] - 6, 600, LAYOUT.road[0]), M.promenade);
  land(rect(0, LAYOUT.road[0], 600, LAYOUT.road[1]), M.asphalt);
  land(rect(0, LAYOUT.road[1], 600, LAYOUT.promenade[1]), M.promenade);
  // Kerbs, lifting the pavements 1 mm above the road.
  add(
    slab(rect(0, LAYOUT.road[0] - 6, 600, LAYOUT.road[0]), 0, 1, M.promenade, {
      cast: false,
    }),
  );
  add(
    slab(rect(0, LAYOUT.road[1], 600, LAYOUT.promenade[1]), 0, 1, M.promenade, {
      cast: false,
    }),
  );
  // Pale stone kerbs, as along the city model's roads.
  const kerb = new THREE.MeshStandardMaterial({
    color: "#d2cec4",
    map: M.stuccoMap,
    roughness: 0.9,
    userData: { scale: 40 },
  });
  add(
    box(0, LAYOUT.road[0] - 1.5, 600, LAYOUT.road[0], 0, 1.25, kerb, {
      cast: false,
    }),
  );
  add(
    box(0, LAYOUT.road[1], 600, LAYOUT.road[1] + 1.5, 0, 1.25, kerb, {
      cast: false,
    }),
  );
  // Road markings: short centre dashes, crossings with stop lines, and the
  // lighter tracks the wheels wear into each lane.
  const markings = new THREE.MeshStandardMaterial({
    color: "#dedbd2",
    roughness: 0.8,
  });
  const wear = new THREE.MeshStandardMaterial({
    color: "#a9abac",
    roughness: 0.6,
    transparent: true,
    opacity: 0.16,
    depthWrite: false,
  });
  const crossings = [150, 452];
  const centre = (LAYOUT.road[0] + LAYOUT.road[1]) / 2;
  for (const y of [centre - 12.5, centre - 5.5, centre + 5.5, centre + 12.5])
    add(
      box(0, y - 1.6, 600, y + 1.6, 0, 0.06, wear, {
        cast: false,
        receive: false,
      }),
    );
  for (let x = 3; x < 600; x += 15) {
    if (crossings.some((cx) => Math.abs(x + 3.5 - cx) < 24)) continue;
    add(
      box(x, centre - 0.45, x + 7, centre + 0.45, 0, 0.12, markings, {
        cast: false,
      }),
    );
  }
  for (const cx of crossings) {
    for (let i = 0; i < 7; i++)
      add(
        box(
          cx - 13 + i * 4,
          LAYOUT.road[0] + 3,
          cx - 11 + i * 4,
          LAYOUT.road[1] - 3,
          0,
          0.12,
          markings,
          { cast: false },
        ),
      );
    // Stop lines, each across its own lane.
    add(
      box(cx - 19.6, centre, cx - 18.4, LAYOUT.road[1] - 2, 0, 0.12, markings, {
        cast: false,
      }),
    );
    add(
      box(cx + 18.4, LAYOUT.road[0] + 2, cx + 19.6, centre, 0, 0.12, markings, {
        cast: false,
      }),
    );
  }
  // The modules' joints across the land (the resin water is poured over them).
  {
    const flat = { cast: false, receive: false };
    add(
      box(
        SEAM.x - 0.3,
        0.5,
        SEAM.x + 0.3,
        LAYOUT.promenade[1],
        0,
        1.12,
        seamMaterial,
        flat,
      ),
    );
    for (const [x0, x1] of [LAYOUT.westQuay, LAYOUT.eastQuay])
      add(
        box(
          Math.max(0.5, x0),
          SEAM.y - 0.3,
          Math.min(599.5, x1),
          SEAM.y + 0.3,
          0,
          1.12,
          seamMaterial,
          flat,
        ),
      );
  }
  // Quays (west and east) down to the water, with stone walls.
  const quays = [
    [0, LAYOUT.promenade[1], LAYOUT.westQuay[1], LAYOUT.quayFront],
    [LAYOUT.eastQuay[0], LAYOUT.promenade[1], 600, LAYOUT.quayFront],
  ];
  for (const [x0, y0, x1, y1] of quays) {
    add(slab(rect(x0, y0, x1, y1), -12, -0.2, M.quayWall, { cast: false }));
    add(slab(rect(x0, y0, x1, y1), -0.2, 1, M.quay, { cast: false }));
  }
  // Back quay wall along the promenade.
  add(
    box(
      LAYOUT.westQuay[1],
      LAYOUT.promenade[1] - 2,
      LAYOUT.eastQuay[0],
      LAYOUT.promenade[1],
      -12,
      1,
      M.quayWall,
      { cast: false },
    ),
  );
  // Coping stones along every quay edge.
  const coping = new THREE.MeshStandardMaterial({
    color: "#aaa396",
    map: M.stuccoMap,
    roughness: 0.8,
    userData: { scale: 20 },
  });
  add(
    box(
      LAYOUT.westQuay[1] - 2,
      LAYOUT.promenade[1] - 2,
      LAYOUT.eastQuay[0] + 2,
      LAYOUT.promenade[1] + 0.2,
      1,
      1.8,
      coping,
    ),
  );
  add(
    box(
      LAYOUT.westQuay[1] - 2.4,
      LAYOUT.promenade[1],
      LAYOUT.westQuay[1] + 0.2,
      LAYOUT.quayFront + 0.2,
      1,
      1.8,
      coping,
    ),
  );
  add(
    box(
      LAYOUT.eastQuay[0] - 0.2,
      LAYOUT.promenade[1],
      LAYOUT.eastQuay[0] + 2.4,
      LAYOUT.quayFront + 0.2,
      1,
      1.8,
      coping,
    ),
  );
  add(
    box(
      0,
      LAYOUT.quayFront - 2.4,
      LAYOUT.westQuay[1],
      LAYOUT.quayFront + 0.2,
      1,
      1.8,
      coping,
    ),
  );
  add(
    box(
      LAYOUT.eastQuay[0],
      LAYOUT.quayFront - 2.4,
      600,
      LAYOUT.quayFront + 0.2,
      1,
      1.8,
      coping,
    ),
  );
  // Mooring bollards along the quay edges.
  const bollard = new THREE.CylinderGeometry(0.9, 1.1, 2.4, 10);
  for (let x = 8; x < 172; x += 26)
    add(place(mesh(bollard, M.darkMetal), x, LAYOUT.quayFront - 3, 3));
  for (let x = 440; x < 600; x += 26)
    add(place(mesh(bollard, M.darkMetal), x, LAYOUT.quayFront - 3, 3));
  for (let x = 184; x < 420; x += 30)
    add(place(mesh(bollard, M.darkMetal), x, LAYOUT.promenade[1] - 3.2, 3));

  // Green areas.
  const lawn = (x0, y0, x1, y1) => {
    add(slab(rect(x0, y0, x1, y1), 0.9, 1.6, M.grass, { cast: false }));
  };
  lawn(6, 486, 164, 530);
  lawn(478, 492, 594, 530);
  lawn(560, 244, 594, 372);
  lawn(6, 244, 18, 318);

  // Parking asphalt and bays.
  const bays = (x0, x1, y0, y1, width = 17) => {
    for (let x = x0; x <= x1 + 0.1; x += width)
      add(box(x - 0.5, y0, x + 0.5, y1, 1, 1.12, markings, { cast: false }));
    const edge = y0 < y1 ? y1 : y0;
    add(
      box(x0, edge - 0.5, x1, edge + 0.5, 1, 1.12, markings, { cast: false }),
    );
  };
  const west = LAYOUT.westLot;
  add(slab(rect(0, 322, west.x[1], 480), 1, 1.08, M.asphalt, { cast: false }));
  bays(14, 150, 326, 352);
  bays(14, 116, 380, 404);
  bays(14, 116, 404, 428);
  bays(14, 150, 452, 476);
  // Planted island at the end of the middle double row.
  add(slab(rect(118, 382, 130, 426), 1, 2.6, M.grass));
  const east = LAYOUT.eastLot;
  add(
    slab(rect(east.x[0], 376, 600, 488), 1, 1.08, M.asphalt, { cast: false }),
  );
  bays(452, 588, 380, 404);
  bays(452, 588, 460, 484);

  // --- Trees and planting ----------------------------------------------------
  const leafColors = {
    broad: ["#4d6536", "#5d7640", "#3f5530", "#6c8248", "#56703a"],
    olive: ["#7c8a63", "#8e9a74", "#6d7a57", "#99a37e"],
    pine: ["#3d5230", "#4a6138", "#35482a", "#556b3e"],
    cypress: ["#2f4428", "#3a5231", "#283a22"],
  };
  // Lumpy sphere. The icosahedron's faces do not share vertices, so the
  // displacement is a hash of the position: shared corners move together.
  const blob = (radius, detail = 1) => {
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const p = geometry.attributes.position;
    const seed = rand(0, 1000);
    const hash = (x, y, z) => {
      const h =
        Math.sin(
          Math.round(x * 97) * 12.9898 +
            Math.round(y * 97) * 78.233 +
            Math.round(z * 97) * 37.719 +
            seed,
        ) * 43758.5453;
      return h - Math.floor(h);
    };
    for (let i = 0; i < p.count; i++) {
      const k =
        1 +
        (hash(p.getX(i) / radius, p.getY(i) / radius, p.getZ(i) / radius) -
          0.5) *
          0.44;
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  const colorize = (geometry, color, lift = 0) => {
    const c = new THREE.Color(color);
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const hsl = {};
    c.getHSL(hsl);
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
  const treeParts = [];
  function foliageTree(
    x,
    y,
    { height = 34, spread = 13, kind = "broad", clumps = 26 } = {},
  ) {
    const parts = [];
    const colors = leafColors[kind];
    const trunkTop = height * (kind === "pine" ? 0.72 : 0.42);
    // Trunk with two limbs.
    const trunk = new THREE.CylinderGeometry(0.55, 1.1, trunkTop, 7);
    trunk.translate(0, trunkTop / 2, 0);
    treeParts.push({ geometry: trunk, material: M.bark, x, y });
    for (let i = 0; i < clumps; i++) {
      let px;
      let py;
      let pz;
      if (kind === "pine") {
        // Umbrella pine: a flat, wide crown.
        const a = rand(0, Math.PI * 2);
        const r = spread * Math.sqrt(random());
        px = Math.cos(a) * r;
        pz = Math.sin(a) * r * 0.9;
        py =
          trunkTop + rand(0, height - trunkTop) * (1 - (r / spread) ** 2 * 0.6);
      } else {
        const a = rand(0, Math.PI * 2);
        const e = Math.acos(rand(-0.6, 1));
        const r = spread * Math.cbrt(rand(0.2, 1));
        px = Math.cos(a) * Math.sin(e) * r;
        pz = Math.sin(a) * Math.sin(e) * r;
        py = trunkTop + (height - trunkTop) * 0.5 + Math.cos(e) * r * 0.75;
      }
      const size = rand(0.28, 0.46) * spread * (kind === "pine" ? 0.7 : 1);
      const geometry = colorize(
        blob(size, 1),
        pick(colors),
        ((py - trunkTop) / height) * 0.3,
      );
      geometry.translate(px, py, pz);
      parts.push(geometry);
    }
    const crown = mergeGeometries(parts);
    treeParts.push({ geometry: crown, material: M.foliage, x, y, crown: true });
  }
  function cypress(x, y, height = 44) {
    const parts = [];
    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const r =
        4.2 *
          Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) *
          (1 - t * 0.55) +
        0.6;
      const geometry = colorize(
        blob(r * rand(0.8, 1.1), 1),
        pick(leafColors.cypress),
        t * 0.25,
      );
      geometry.scale(1, 1.4, 1);
      geometry.translate(
        rand(-0.6, 0.6),
        3 + t * (height - 6),
        rand(-0.6, 0.6),
      );
      parts.push(geometry);
    }
    treeParts.push({
      geometry: mergeGeometries(parts),
      material: M.foliage,
      x,
      y,
      crown: true,
    });
  }
  function palm(x, y, height = 42) {
    const lean = rand(-0.12, 0.12);
    const trunk = new THREE.CylinderGeometry(0.7, 1.3, height, 8, 8);
    const p = trunk.attributes.position;
    for (let i = 0; i < p.count; i++)
      p.setX(i, p.getX(i) + (p.getY(i) / height + 0.5) ** 2 * lean * height);
    trunk.translate(0, height / 2, 0);
    trunk.computeVertexNormals();
    treeParts.push({ geometry: trunk, material: M.bark, x, y });
    const fronds = [];
    for (let i = 0; i < 11; i++) {
      const frond = new THREE.PlaneGeometry(2.8, 17, 1, 6);
      const q = frond.attributes.position;
      for (let j = 0; j < q.count; j++) {
        const t = (q.getY(j) + 8.5) / 17;
        q.setZ(j, -t * t * 7);
        q.setX(j, q.getX(j) * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)));
      }
      frond.translate(0, 8.5, 0);
      frond.rotateX(Math.PI / 2 - 0.35);
      frond.rotateY((i / 11) * Math.PI * 2 + rand(-0.2, 0.2));
      frond.translate(lean * height, height, 0);
      frond.computeVertexNormals();
      fronds.push(colorize(frond, pick(leafColors.broad), 0.1));
    }
    treeParts.push({
      geometry: mergeGeometries(fronds),
      material: M.foliage,
      x,
      y,
      crown: true,
      doubleSide: true,
    });
  }
  function shrubRow(x0, y0, x1, y1, height = 4, color = "#4c6334") {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const parts = [];
    for (let d = 0; d < length; d += 2.2) {
      const t = d / length;
      const geometry = colorize(blob(rand(1.6, 2.6), 1), color, 0.1);
      geometry.translate(0, height * rand(0.5, 0.9), 0);
      geometry.translate(
        x0 + (x1 - x0) * t + rand(-0.6, 0.6),
        0,
        y0 + (y1 - y0) * t + rand(-0.6, 0.6),
      );
      parts.push(geometry);
    }
    treeParts.push({
      geometry: mergeGeometries(parts),
      material: M.foliage,
      x: 0,
      y: 0,
      crown: true,
      absolute: true,
    });
  }
  // Flower planter: stone trough with blooms.
  function planter(x, y, width = 14) {
    add(box(x - width / 2, y - 3, x + width / 2, y + 3, 1, 3.6, M.concrete));
    const parts = [];
    for (let i = 0; i < width * 1.4; i++) {
      const geometry = colorize(
        blob(rand(0.9, 1.5), 0),
        pick(["#4f6a36", "#c24a5a", "#e7c14a", "#d86f8a", "#5c7a3c"]),
        0.1,
      );
      geometry.translate(
        x + rand(-width / 2 + 1, width / 2 - 1),
        4.4,
        y + rand(-2, 2),
      );
      parts.push(geometry);
    }
    treeParts.push({
      geometry: mergeGeometries(parts),
      material: M.foliage,
      x: 0,
      y: 0,
      crown: true,
      absolute: true,
    });
  }

  // --- Buildings --------------------------------------------------------------
  // Window with a frame and inset glass. `face` is the wall's outward heading.
  function windowOn(
    group,
    cx,
    cy,
    z0,
    w,
    h,
    heading,
    glassMaterial,
    { frame = M.frame, shutters = null, depth = 0.6 } = {},
  ) {
    const holder = new THREE.Group();
    holder.add(
      box(
        -w / 2 - 0.35,
        -0.15,
        w / 2 + 0.35,
        0.25,
        z0 - 0.35,
        z0 + h + 0.35,
        frame,
        { cast: false },
      ),
    );
    const glass = box(-w / 2, 0.2, w / 2, 0.26, z0, z0 + h, glassMaterial, {
      cast: false,
    });
    holder.add(glass);
    // Mullion and sill.
    holder.add(box(-0.12, 0.2, 0.12, 0.34, z0, z0 + h, frame, { cast: false }));
    holder.add(
      box(-w / 2 - 0.6, 0.2, w / 2 + 0.6, 0.9, z0 - 0.5, z0 - 0.1, frame, {
        cast: false,
      }),
    );
    if (shutters)
      for (const side of [-1, 1]) {
        const s = box(
          side * (w / 2 + 0.3) - (side > 0 ? 0 : w * 0.45),
          0.2,
          side * (w / 2 + 0.3) + (side > 0 ? w * 0.45 : 0),
          0.6,
          z0,
          z0 + h,
          shutters,
          { cast: false },
        );
        holder.add(s);
      }
    holder.position.set(cx, 0, cy);
    holder.rotation.y = -heading + Math.PI / 2;
    group.add(holder);
    return holder;
  }
  // Rectangular building with a roof and windows on its visible walls.
  function house({
    x0,
    y0,
    x1,
    y1,
    h,
    wall,
    roof,
    roofType = "hip",
    roofH = 8,
    floors = 3,
    device,
    lit = 0.55,
    shutters = true,
    chimney = true,
    glassColor = "#ffcf85",
    roofMaterial: roofOverride,
    windowW = 3.2,
    windowSpacing = 9,
    windowRatio = 0.55,
  }) {
    const group = new THREE.Group();
    group.add(box(x0, y0, x1, y1, 0, h, M.stucco(wall)));
    // Plinth.
    group.add(
      box(
        x0 - 0.3,
        y0 - 0.3,
        x1 + 0.3,
        y1 + 0.3,
        0,
        1.6,
        M.stucco(new THREE.Color(wall).multiplyScalar(0.8)),
      ),
    );
    // Roof.
    const overhang = 1.4;
    const roofMaterial = roofOverride ?? M.roof(roof);
    if (roofType === "hip" || roofType === "gable") {
      const w = x1 - x0 + overhang * 2;
      const d = y1 - y0 + overhang * 2;
      const along = w >= d;
      const ridge =
        roofType === "gable"
          ? along
            ? w
            : d
          : Math.max(0.01, Math.abs(w - d));
      const geometry = new THREE.BufferGeometry();
      const hw = w / 2;
      const hd = d / 2;
      const r = ridge / 2;
      const vertices = along
        ? [
            [-hw, 0, -hd],
            [hw, 0, -hd],
            [hw, 0, hd],
            [-hw, 0, hd],
            [-r, roofH, 0],
            [r, roofH, 0],
          ]
        : [
            [-hw, 0, -hd],
            [hw, 0, -hd],
            [hw, 0, hd],
            [-hw, 0, hd],
            [0, roofH, -r],
            [0, roofH, r],
          ];
      // Slopes, then the hip ends (a gable has walls there instead).
      const slopes = along
        ? [
            [0, 5, 1],
            [0, 4, 5],
            [3, 2, 5],
            [3, 5, 4],
          ]
        : [
            [0, 3, 5],
            [0, 5, 4],
            [1, 4, 5],
            [1, 5, 2],
          ];
      const ends = along
        ? [
            [0, 3, 4],
            [1, 5, 2],
          ]
        : [
            [0, 4, 1],
            [3, 5, 2],
          ];
      const faces = roofType === "gable" ? slopes : [...slopes, ...ends];
      const position = [];
      for (const face of faces)
        for (const index of face) position.push(...vertices[index]);
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(position, 3),
      );
      geometry.computeVertexNormals();
      const item = mesh(geometry.toNonIndexed(), roofMaterial);
      item.material.side = THREE.DoubleSide;
      item.position.set((x0 + x1) / 2, h, (y0 + y1) / 2);
      group.add(item);
      // Gable ends are walls.
      if (roofType === "gable") {
        const ends = new THREE.BufferGeometry();
        const hw2 = (x1 - x0) / 2;
        const hd2 = (y1 - y0) / 2;
        const p = along
          ? [
              [-hw2, 0, -hd2],
              [-hw2, 0, hd2],
              [-hw2, roofH - 0.8, 0],
              [hw2, 0, hd2],
              [hw2, 0, -hd2],
              [hw2, roofH - 0.8, 0],
            ]
          : [
              [-hw2, 0, hd2],
              [hw2, 0, hd2],
              [0, roofH - 0.8, hd2],
              [hw2, 0, -hd2],
              [-hw2, 0, -hd2],
              [0, roofH - 0.8, -hd2],
            ];
        ends.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(p.flat(), 3),
        );
        ends.computeVertexNormals();
        const endMesh = mesh(ends, M.stucco(wall));
        endMesh.material.side = THREE.DoubleSide;
        endMesh.position.set((x0 + x1) / 2, h, (y0 + y1) / 2);
        group.add(endMesh);
      }
      if (chimney && random() < 0.7) {
        const cx = rand(x0 + 4, x1 - 4);
        const cy = rand(y0 + 3, y1 - 3);
        group.add(
          box(
            cx - 1.4,
            cy - 1.4,
            cx + 1.4,
            cy + 1.4,
            h,
            h + roofH + 2.5,
            M.stucco(wall),
          ),
        );
        group.add(
          box(
            cx - 1.8,
            cy - 1.8,
            cx + 1.8,
            cy + 1.8,
            h + roofH + 2.5,
            h + roofH + 3.1,
            M.concrete,
          ),
        );
      }
    } else {
      group.add(
        box(x0 - 0.4, y0 - 0.4, x1 + 0.4, y1 + 0.4, h, h + 1.2, M.concrete),
      );
    }
    // Windows on the walls that face the camera (front, and the side facing
    // the board's centre line).
    const floorH = (h - 2) / floors;
    const walls = [
      { a: [x0, y1], b: [x1, y1], heading: Math.PI / 2 },
      x0 + x1 < 600
        ? { a: [x1, y1], b: [x1, y0], heading: 0 }
        : { a: [x0, y0], b: [x0, y1], heading: Math.PI },
    ];
    for (const { a, b, heading } of walls) {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const cols = Math.max(1, Math.floor(length / windowSpacing));
      for (let f = 0; f < floors; f++)
        for (let c = 0; c < cols; c++) {
          const t = (c + 0.5) / cols;
          const on = random() < lit;
          const glass = on
            ? litGlass(glassColor, rand(1.2, 2.2), device)
            : M.glassDark;
          if (device && !on) continue;
          const nx = Math.cos(heading) * 0.05;
          const ny = Math.sin(heading) * 0.05;
          windowOn(
            group,
            a[0] + (b[0] - a[0]) * t + nx,
            a[1] + (b[1] - a[1]) * t + ny,
            2.2 + f * floorH + floorH * 0.18,
            windowW,
            floorH * windowRatio,
            heading,
            glass,
            {
              shutters:
                shutters && !on
                  ? M.shutter
                  : shutters && random() < 0.5
                    ? M.shutter
                    : null,
            },
          );
        }
    }
    add(group);
    occluder(group, "building");
    if (device) world.devices[device].meshes.push(group);
    return group;
  }

  // Promenade lamps (also used in the town's gardens and square).
  const lantern = (
    x,
    y,
    { h = 22, device, color = "#ffe0a0", power = 900, reach = 95 } = {},
  ) => {
    const group = new THREE.Group();
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(0.35, 0.55, h, 8), M.darkMetal),
        0,
        0,
        h / 2,
      ),
    );
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(1.1, 1.3, 1.2, 8), M.darkMetal),
        0,
        0,
        0.6,
      ),
    );
    const glassMaterial = litGlass(color, 3.2, device);
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(1.25, 0.9, 2.6, 8), glassMaterial),
        0,
        0,
        h + 1.1,
      ),
    );
    group.add(
      place(
        mesh(new THREE.ConeGeometry(1.8, 1.4, 8), M.darkMetal),
        0,
        0,
        h + 3,
      ),
    );
    add(place(group, x, y, 1));
    const light = new THREE.PointLight("#ffc584", power, reach, 2);
    light.position.set(x, h + 1, y);
    add(light);
    if (device) {
      world.devices[device].lights.push(light);
      world.devices[device].meshes.push(group);
    } else world.staticLights.push(light);
    occluder(group, "lamp");
    return group;
  };

  // Town, in the style of the smart-city maquette: detached family houses in
  // gardens (steep slate or clay roofs, big warm windows, hedges and trees)
  // either side of a square with a modern civic building and a fountain. It
  // draws from its own random sequence, so the rest of the board is unchanged.
  const outerRandom = random;
  random = rngOf(20260928);
  {
    const townLawn = (x0, y0, x1, y1) =>
      add(slab(rect(x0, y0, x1, y1), 0, 0.7, M.grass, { cast: false }));
    const path = (x0, y0, x1, y1) =>
      add(slab(rect(x0, y0, x1, y1), 0, 0.85, M.promenade, { cast: false }));
    townLawn(4, 4, 234, 146);
    townLawn(366, 4, 596, 146);
    // Lane between the back and front gardens.
    path(4, 64, 234, 72);
    path(366, 64, 596, 72);

    const houseWalls = ["#f1ece2", "#e9e1d2", "#f4f1ea", "#e6dccb", "#efe6d6"];
    const slateTones = ["#4a4f56", "#565b62", "#3f444a"];
    const clayTones = ["#a3503a", "#9a4a36", "#b05a40"];
    // One family house: a main block plus an optional lower wing, a front
    // door with a canopy and a garden path out to the lane or pavement.
    const villa = ({
      x0,
      y0,
      x1,
      y1,
      h = 20,
      slate = true,
      wing = null,
      roofType = "gable",
      pitch = 0.95,
    }) => {
      const roofMaterial = slate
        ? M.slate(pick(slateTones))
        : M.roof(pick(clayTones));
      const wall = pick(houseWalls);
      const common = {
        wall,
        roofMaterial,
        roofType,
        floors: 2,
        lit: 0.62,
        shutters: false,
        windowW: 4.6,
        windowSpacing: 11,
        windowRatio: 0.62,
        glassColor: pick(["#ffd08a", "#ffc878", "#ffd9a0"]),
      };
      house({
        ...common,
        x0,
        y0,
        x1,
        y1,
        h,
        roofH: (Math.min(x1 - x0, y1 - y0) / 2) * pitch,
      });
      if (wing)
        house({
          ...common,
          ...wing,
          h: wing.h ?? h * 0.62,
          floors: 1,
          chimney: false,
          roofH: (Math.min(wing.x1 - wing.x0, wing.y1 - wing.y0) / 2) * pitch,
        });
      const cx = (x0 + x1) / 2 + rand(-4, 4);
      add(
        box(cx - 2, y1, cx + 2, y1 + 0.35, 1.6, 8.5, M.frameDark, {
          cast: false,
        }),
      );
      add(box(cx - 3.2, y1, cx + 3.2, y1 + 3, 9.2, 9.8, M.white));
      add(
        box(
          cx - 3,
          y1 + 0.35,
          cx + 3,
          y1 + 0.5,
          8.6,
          9.2,
          litGlass("#ffe1a8", 2.2),
          { cast: false },
        ),
      );
      path(cx - 2.5, y1, cx + 2.5, y1 < 64 ? 64 : 146);
      return cx;
    };
    const gardenLamp = (x, y) =>
      lantern(x, y, { h: 11, power: 260, reach: 45, color: "#ffe6b8" });
    // Hedge along a plot front, open where the garden paths cross it.
    const hedge = (x0, x1, y, gaps) => {
      let start = x0;
      for (const g of [...gaps].sort((a, b) => a - b)) {
        if (g - 4 > start) shrubRow(start, y, g - 4, y, 3.4, "#3f5a2e");
        start = g + 4;
      }
      if (x1 > start) shrubRow(start, y, x1, y, 3.4, "#3f5a2e");
    };

    // West quarter.
    const westBack = [
      villa({
        x0: 14,
        y0: 18,
        x1: 58,
        y1: 46,
        slate: true,
        wing: { x0: 58, y0: 24, x1: 74, y1: 46 },
      }),
      villa({ x0: 98, y0: 14, x1: 128, y1: 48, h: 22, slate: false }),
      villa({ x0: 164, y0: 20, x1: 208, y1: 48, slate: true, roofType: "hip" }),
    ];
    const westFront = [
      villa({
        x0: 20,
        y0: 92,
        x1: 52,
        y1: 124,
        h: 22,
        slate: false,
        wing: { x0: 52, y0: 104, x1: 70, y1: 124 },
      }),
      villa({ x0: 96, y0: 94, x1: 142, y1: 122, slate: true }),
      villa({
        x0: 178,
        y0: 90,
        x1: 212,
        y1: 122,
        h: 21,
        slate: false,
        roofType: "hip",
      }),
    ];
    // East quarter.
    const eastBack = [
      villa({
        x0: 390,
        y0: 18,
        x1: 430,
        y1: 46,
        slate: false,
        roofType: "hip",
      }),
      villa({ x0: 468, y0: 14, x1: 500, y1: 48, h: 22, slate: true }),
      villa({
        x0: 534,
        y0: 20,
        x1: 580,
        y1: 48,
        slate: false,
        wing: { x0: 518, y0: 28, x1: 534, y1: 48 },
      }),
    ];
    const eastFront = [
      villa({
        x0: 386,
        y0: 92,
        x1: 422,
        y1: 124,
        h: 21,
        slate: true,
        wing: { x0: 422, y0: 104, x1: 438, y1: 124 },
      }),
      villa({ x0: 464, y0: 90, x1: 508, y1: 122, slate: false }),
      villa({
        x0: 546,
        y0: 94,
        x1: 580,
        y1: 124,
        h: 22,
        slate: true,
        roofType: "hip",
      }),
    ];
    hedge(4, 234, 144, westFront);
    hedge(366, 596, 144, eastFront);
    hedge(4, 234, 62, westBack);
    hedge(366, 596, 62, eastBack);
    for (const x of [...westFront, ...eastFront]) gardenLamp(x + 6, 140);
    for (const x of [...westBack, ...eastBack]) gardenLamp(x + 6, 58);
    // Hedges between the plots.
    for (const x of [84, 150, 452, 520]) {
      shrubRow(x, 8, x, 60, 3);
      shrubRow(x, 76, x, 142, 3);
    }

    // Trees: a tall tree line along the back edge, and a few in every garden.
    for (let x = 10; x < 596; x += rand(24, 34)) {
      if (x > 240 && x < 360) continue;
      foliageTree(x, rand(4, 9), {
        height: rand(38, 48),
        spread: rand(11, 14),
        kind: pick(["broad", "broad", "olive"]),
        clumps: 26,
      });
    }
    for (const [x, y] of [
      [80, 34],
      [146, 30],
      [80, 84],
      [158, 106],
      [12, 136],
      [226, 78],
      [226, 136],
      [374, 80],
      [446, 34],
      [512, 84],
      [592, 80],
      [590, 136],
      [444, 136],
      [376, 136],
    ])
      foliageTree(x + rand(-3, 3), y + rand(-3, 3), {
        height: rand(26, 36),
        spread: rand(8, 11),
        kind: pick(["broad", "broad", "olive"]),
        clumps: 22,
      });

    // Civic building: pale stone, a glazed ground floor, a window band above,
    // a flat roof with a plant room and solar panels.
    {
      const x0 = 250;
      const x1 = 350;
      const y0 = 16;
      const y1 = 62;
      const h = 36;
      const group = new THREE.Group();
      group.add(box(x0, y0, x1, y1, 0, h, M.stucco("#e4ddcf")));
      // Ground floor: full-height glazing behind slim mullions.
      group.add(
        box(
          x0 + 4,
          y1 - 0.1,
          x1 - 4,
          y1 + 0.25,
          1,
          15,
          litGlass("#ffd392", 2.2),
        ),
      );
      for (let x = x0 + 4; x <= x1 - 4 + 0.01; x += 11.5)
        group.add(
          box(x - 0.45, y1, x + 0.45, y1 + 0.6, 1, 15, M.frameDark, {
            cast: false,
          }),
        );
      group.add(
        box(x0 + 4, y1, x1 - 4, y1 + 0.6, 14.4, 15.4, M.frameDark, {
          cast: false,
        }),
      );
      // Upper floor: a band of windows.
      for (let x = x0 + 8; x < x1 - 4; x += 12) {
        const on = random() < 0.8;
        group.add(
          box(
            x - 4.5,
            y1 - 0.1,
            x + 4.5,
            y1 + 0.2,
            19,
            30,
            on ? litGlass("#ffd392", rand(1.4, 2.2)) : M.glassDark,
            { cast: false },
          ),
        );
      }
      // Side walls: tall windows on both floors.
      for (const x of [x0, x1])
        for (let y = y0 + 8; y < y1 - 4; y += 12) {
          group.add(
            box(
              x - 0.25,
              y - 3.5,
              x + 0.25,
              y + 3.5,
              3,
              13,
              litGlass("#ffd392", 1.8),
              { cast: false },
            ),
          );
          group.add(
            box(
              x - 0.25,
              y - 3.5,
              x + 0.25,
              y + 3.5,
              19,
              30,
              random() < 0.7 ? litGlass("#ffd392", 1.6) : M.glassDark,
              { cast: false },
            ),
          );
        }
      // Entrance canopy.
      group.add(box(284, y1, 316, y1 + 8, 15.4, 16.4, M.frameDark));
      // Parapet, roof, plant room and solar panels.
      group.add(
        box(
          x0 - 0.8,
          y0 - 0.8,
          x1 + 0.8,
          y1 + 0.8,
          h,
          h + 2,
          M.stucco("#d6cfc1"),
        ),
      );
      group.add(
        box(
          x0 + 1,
          y0 + 1,
          x1 - 1,
          y1 - 1,
          h,
          h + 1,
          new THREE.MeshStandardMaterial({
            color: "#8f8b84",
            map: M.stuccoMap,
            roughness: 0.95,
            userData: { scale: 40 },
          }),
        ),
      );
      group.add(box(262, 24, 282, 40, h + 1, h + 7, M.stucco("#cfc8ba")));
      const panel = new THREE.MeshStandardMaterial({
        color: "#1d2b4a",
        roughness: 0.25,
        metalness: 0.5,
      });
      for (let i = 0; i < 4; i++) {
        const holder = new THREE.Group();
        holder.add(box(-6, -4, 6, 4, -0.3, 0.3, panel));
        holder.rotation.x = -0.35;
        holder.position.set(298 + i * 13, h + 3, 36);
        group.add(holder);
      }
      add(group);
      occluder(group, "building");
      const light = new THREE.PointLight("#ffcf8f", 900, 80, 2);
      add(place(light, 300, 74, 10));
      world.staticLights.push(light);
    }

    // Square: a round fountain, benches, trees, planters and lamps.
    {
      const cx = 300;
      const cy = 108;
      const rim = new THREE.MeshStandardMaterial({
        color: "#d9d2c4",
        map: M.stuccoMap,
        roughness: 0.7,
        userData: { scale: 20 },
      });
      add(
        place(
          mesh(new THREE.CylinderGeometry(22, 22.5, 0.6, 48), rim),
          cx,
          cy,
          0.3,
        ),
      );
      add(
        place(
          mesh(new THREE.CylinderGeometry(15, 15.4, 3, 48), rim),
          cx,
          cy,
          1.5,
        ),
      );
      const pool = new THREE.MeshPhysicalMaterial({
        color: "#3c8f9e",
        roughness: 0.08,
        emissive: "#2a9fb3",
        emissiveIntensity: 0.55,
      });
      add(
        place(
          mesh(new THREE.CylinderGeometry(13.6, 13.6, 0.4, 48), pool, {
            cast: false,
          }),
          cx,
          cy,
          2.8,
        ),
      );
      add(
        place(mesh(new THREE.CylinderGeometry(3.2, 4, 3, 24), rim), cx, cy, 4),
      );
      // The jet: a glowing column with a falling crown of water.
      const spray = new THREE.MeshStandardMaterial({
        color: "#eaf6fa",
        emissive: "#fff1d6",
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0.8,
        roughness: 0.2,
      });
      add(
        place(
          mesh(new THREE.CylinderGeometry(0.5, 1.2, 14, 12), spray, {
            cast: false,
          }),
          cx,
          cy,
          11,
        ),
      );
      add(
        place(
          mesh(new THREE.ConeGeometry(4.5, 7, 20, 1, true), spray, {
            cast: false,
          }),
          cx,
          cy,
          10,
        ),
      );
      const glow = new THREE.PointLight("#ffe2b0", 500, 60, 2);
      add(place(glow, cx, cy, 6));
      world.staticLights.push(glow);
      // Benches facing the fountain.
      for (const a of [0.5, 2.64, 3.64, 5.78]) {
        const bench = new THREE.Group();
        bench.add(box(-5, -1.3, 5, 1.3, 2.6, 3.2, M.teak));
        bench.add(box(-5, 1, 5, 1.6, 3.2, 5.6, M.teak));
        for (const dx of [-4, 4])
          bench.add(box(dx - 0.4, -1.1, dx + 0.4, 1.1, 0, 2.6, M.darkMetal));
        add(
          place(
            bench,
            cx + Math.cos(a) * 31,
            cy + Math.sin(a) * 31,
            1,
            -a - Math.PI / 2,
          ),
        );
      }
      for (const [x, y] of [
        [248, 86],
        [352, 86],
        [246, 138],
        [354, 138],
      ])
        foliageTree(x, y, { height: 32, spread: 9, kind: "broad", clumps: 22 });
      planter(270, 142, 14);
      planter(330, 142, 14);
      for (const [x, y] of [
        [262, 74],
        [338, 74],
        [262, 132],
        [338, 132],
      ])
        lantern(x, y, { h: 16, power: 500, reach: 60 });
    }
  }
  random = outerRandom;

  // Street furniture on the town pavement.
  for (const x of [40, 120, 200, 400, 480, 560]) {
    add(
      place(
        mesh(new THREE.CylinderGeometry(0.35, 0.5, 20, 8), M.darkMetal),
        x,
        LAYOUT.road[0] - 3,
        11,
      ),
    );
    const head = mesh(
      new THREE.SphereGeometry(1.4, 12, 8),
      litGlass("#ffe2a8", 3),
    );
    add(place(head, x, LAYOUT.road[0] - 3, 21.5));
    const light = new THREE.PointLight("#ffc98a", 700, 80, 2);
    add(place(light, x, LAYOUT.road[0] - 1, 19));
    world.staticLights.push(light);
  }

  // Promenade lamps, palms, benches and planters.
  for (let x = 30; x < 600; x += 68) lantern(x, 204);
  for (const x of [66, 202, 398, 534]) palm(x, 228, rand(38, 46));
  for (const x of [100, 168, 434, 500]) {
    add(box(x - 5, 226, x + 5, 228.5, 3, 3.6, M.teak));
    add(box(x - 5, 228, x + 5, 228.6, 3.6, 6.2, M.teak));
    for (const dx of [-4, 4])
      add(box(x + dx - 0.4, 226.2, x + dx + 0.4, 228.4, 1, 3, M.darkMetal));
  }
  planter(236, 230, 12);
  planter(364, 230, 12);

  // Hotel, in the style of the town's houses and the city model: cream stucco
  // under a hipped slate roof, framed warm windows, an entrance bay with a
  // canopy, balconies with dark railings, and a pool.
  {
    const x0 = 24;
    const x1 = 150;
    const y0 = 246;
    const y1 = 300;
    const h = 54;
    const floors = 4;
    // The earlier flat-roofed hotel drew its windows from the board's random
    // sequence; the same draws keep everything built after it unchanged.
    for (let f = 0; f < 5; f++) {
      for (let c = 0; c < 12; c++)
        if (random() < 0.78) {
          pick([0]);
          rand(0, 1);
        }
      for (let c = 0; c < 4; c++) if (random() < 0.7) rand(0, 1);
    }
    const boardRandom = random;
    random = rngOf(20260929);
    const style = {
      wall: "#eadfc8",
      roofMaterial: M.slate("#5d636b"),
      roofType: "hip",
      floors,
      device: "HOTEL_01",
      lit: 1,
      shutters: false,
      chimney: false,
      windowW: 4.6,
      windowSpacing: 10.5,
      windowRatio: 0.6,
      glassColor: "#ffd08a",
    };
    house({ ...style, x0, y0, x1, y1, h, roofH: 16 });
    // Entrance bay, one step forward under its own roof.
    const bay = { x0: 68, x1: 106, y1: y1 + 7 };
    house({
      ...style,
      x0: bay.x0,
      y0: y1 - 6,
      x1: bay.x1,
      y1: bay.y1,
      h: h + 3,
      roofH: 9,
      windowSpacing: 12,
    });
    const group = new THREE.Group();
    // Lobby doors, canopy and sign.
    group.add(
      box(
        bay.x0 + 5,
        bay.y1,
        bay.x1 - 5,
        bay.y1 + 0.5,
        1.6,
        10.4,
        litGlass("#ffd89a", 1.8, "HOTEL_01"),
        { cast: false },
      ),
    );
    for (const x of [bay.x0 + 5, 87, bay.x1 - 5])
      group.add(
        box(x - 0.3, bay.y1, x + 0.3, bay.y1 + 0.6, 1.6, 10.4, M.frameDark, {
          cast: false,
        }),
      );
    group.add(
      box(bay.x0 + 2, bay.y1, bay.x1 - 2, bay.y1 + 7, 10.6, 11.4, M.frameDark),
    );
    for (const x of [bay.x0 + 3, bay.x1 - 3])
      group.add(
        box(x - 0.4, bay.y1 + 6, x + 0.4, bay.y1 + 6.8, 1, 10.6, M.frameDark),
      );
    group.add(
      box(
        bay.x0 + 9,
        bay.y1 + 7,
        bay.x1 - 9,
        bay.y1 + 7.4,
        11.4,
        14.2,
        litGlass("#fff1d6", 2.2, "HOTEL_01"),
        { cast: false },
      ),
    );
    // Balconies on the upper floors, either side of the bay and on the east.
    const floorH = (h - 2) / floors;
    for (let f = 1; f < floors; f++) {
      const z = 2.2 + f * floorH + floorH * 0.18 - 1.3;
      for (const [a, b] of [
        [x0 + 2, bay.x0 - 2],
        [bay.x1 + 2, x1 - 2],
      ]) {
        group.add(box(a, y1, b, y1 + 3.2, z, z + 0.7, M.concrete));
        group.add(
          box(a, y1 + 2.9, b, y1 + 3.2, z + 3.3, z + 3.7, M.darkMetal, {
            cast: false,
          }),
        );
        for (let x = a; x <= b + 0.01; x += (b - a) / 12)
          group.add(
            box(
              x - 0.15,
              y1 + 2.9,
              x + 0.15,
              y1 + 3.2,
              z + 0.7,
              z + 3.3,
              M.darkMetal,
              {
                cast: false,
              },
            ),
          );
      }
      group.add(box(x1, y0 + 4, x1 + 3.2, y1 - 2, z, z + 0.7, M.concrete));
      group.add(
        box(x1 + 2.9, y0 + 4, x1 + 3.2, y1 - 2, z + 3.3, z + 3.7, M.darkMetal, {
          cast: false,
        }),
      );
      for (let y = y0 + 4; y <= y1 - 1.99; y += (y1 - y0 - 6) / 10)
        group.add(
          box(
            x1 + 2.9,
            y - 0.15,
            x1 + 3.2,
            y + 0.15,
            z + 0.7,
            z + 3.3,
            M.darkMetal,
            {
              cast: false,
            },
          ),
        );
    }
    // Chimneys on the ridge.
    for (const x of [58, 116]) {
      group.add(
        box(x - 2, 270, x + 2, 276, h + 8, h + 20, M.stucco(style.wall)),
      );
      group.add(
        box(x - 2.5, 269.5, x + 2.5, 276.5, h + 20, h + 20.8, M.concrete),
      );
    }
    random = boardRandom;
    add(group);
    occluder(group, "building");
    world.devices.HOTEL_01.meshes.push(group);
    const hotelLight = new THREE.PointLight("#ffcf8f", 1100, 90, 2);
    add(place(hotelLight, 87, 312, 10));
    world.devices.HOTEL_01.lights.push(hotelLight);
    // Pool terrace.
    add(slab(rect(20, 306, 100, 320), 1, 1.8, M.deck, { cast: false }));
    add(slab(rect(24, 308, 80, 318), 1.8, 1.9, M.pool, { cast: false }));
    for (let i = 0; i < 4; i++)
      add(box(84 + i * 0, 308 + i * 3, 96, 309.6 + i * 3, 1.8, 2.8, M.white));
    const poolLight = new THREE.PointLight("#7fe2f0", 60, 30, 2);
    add(place(poolLight, 52, 313, 4));
    world.devices.HOTEL_01.lights.push(poolLight);
  }
  for (const [x, y] of [
    [12, 256],
    [12, 290],
    [158, 316],
  ])
    cypress(x, y, 36);

  // Harbour master's office with a weather mast.
  house({
    x0: 30,
    y0: 490,
    x1: 86,
    y1: 526,
    h: 22,
    wall: "#e9e1cf",
    roof: "#a9553a",
    roofType: "hip",
    roofH: 8,
    floors: 1,
    lit: 1,
    chimney: false,
  });
  {
    const group = new THREE.Group();
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(0.45, 0.6, 62, 8), M.metal),
        0,
        0,
        31,
      ),
    );
    // Anemometer cups and wind vane.
    const cups = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const arm = mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 5), M.metal);
      arm.rotation.z = Math.PI / 2;
      arm.rotation.y = (i / 3) * Math.PI * 2;
      cups.add(arm);
      const cup = mesh(
        new THREE.SphereGeometry(0.8, 8, 6, 0, Math.PI),
        M.white,
      );
      cup.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 2.5,
        0,
        -Math.sin((i / 3) * Math.PI * 2) * 2.5,
      );
      cups.add(cup);
    }
    group.add(place(cups, 0, 0, 63));
    group.add(
      place(mesh(new THREE.BoxGeometry(6, 1.6, 0.3), M.white), 0, 0, 60),
    );
    const flag = mesh(
      new THREE.PlaneGeometry(7, 4.5),
      new THREE.MeshStandardMaterial({
        color: "#1d4f8f",
        side: THREE.DoubleSide,
        roughness: 0.8,
      }),
    );
    flag.position.set(3.8, 55, 0);
    group.add(flag);
    add(place(group, 104, 520, 1));
    occluder(group, "lamp");
  }
  for (const [x, y, s] of [
    [14, 506, 1],
    [120, 500, 0.9],
    [150, 522, 1.1],
  ])
    foliageTree(x, y, {
      height: 30 * s,
      spread: 11 * s,
      kind: pick(["broad", "olive"]),
    });
  shrubRow(8, 482, 164, 482, 4);
  shrubRow(14, 320, 160, 320, 3);
  for (const x of [30, 70, 110, 150])
    foliageTree(x, 450 + 32, { height: 24, spread: 8, clumps: 18 });
  for (const [x, y] of [
    [40, 540 - 10],
    [100, 505],
    [60, 512],
  ])
    shrubRow(x - 8, y, x + 8, y, 3);
  // Parking lamps.
  lantern(124, 440, { h: 30, power: 1400, reach: 110, color: "#fff0d0" });
  lantern(520, 432, { h: 30, power: 1400, reach: 110, color: "#fff0d0" });

  // Restaurant: stone walls, big windows, pergola terrace with festoon lights.
  {
    const x0 = 444;
    const x1 = 552;
    const y0 = 246;
    const y1 = 288;
    const h = 20;
    const group = new THREE.Group();
    group.add(box(x0, y0, x1, y1, 0, h, M.stone));
    group.add(
      box(x0 - 0.8, y0 - 0.8, x1 + 0.8, y1 + 0.8, h, h + 1.6, M.frameDark),
    );
    for (let c = 0; c < 8; c++) {
      const cx = x0 + 8 + c * 13;
      group.add(
        box(
          cx - 5,
          y1 - 0.05,
          cx + 5,
          y1 + 0.3,
          2,
          15,
          litGlass("#ffc574", 2.2, "RESTAURANT_01"),
          { cast: false },
        ),
      );
      group.add(
        box(cx - 5.6, y1 + 0.1, cx + 5.6, y1 + 0.5, 15, 16, M.frameDark, {
          cast: false,
        }),
      );
    }
    for (let c = 0; c < 3; c++) {
      const cy = y0 + 8 + c * 13;
      group.add(
        box(
          x0 - 0.3,
          cy - 5,
          x0 + 0.05,
          cy + 5,
          2,
          15,
          litGlass("#ffc574", 2.2, "RESTAURANT_01"),
          { cast: false },
        ),
      );
    }
    // Terrace deck and pergola.
    group.add(slab(rect(440, 290, 556, 330), 1, 1.8, M.deck, { cast: false }));
    for (const x of [442, 480, 518, 554])
      for (const y of [292, 328])
        group.add(box(x - 0.7, y - 0.7, x + 0.7, y + 0.7, 1.8, 17, M.teak));
    for (const y of [292, 328])
      group.add(box(440, y - 0.8, 556, y + 0.8, 17, 18.4, M.teak));
    for (let x = 444; x <= 552; x += 6)
      group.add(box(x - 0.35, 290, x + 0.35, 330, 18.4, 19.2, M.teak));
    // Tables with umbrellas.
    for (let i = 0; i < 4; i++)
      for (const row of [302, 318]) {
        const x = 452 + i * 26 + (row === 318 ? 12 : 0);
        if (x > 552) continue;
        group.add(
          place(
            mesh(new THREE.CylinderGeometry(3, 3, 0.4, 16), M.white),
            x,
            row,
            6,
          ),
        );
        group.add(
          place(
            mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.5, 6), M.darkMetal),
            x,
            row,
            3.8,
          ),
        );
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4;
          group.add(
            box(
              x + Math.cos(a) * 4.4 - 0.9,
              row + Math.sin(a) * 4.4 - 0.9,
              x + Math.cos(a) * 4.4 + 0.9,
              row + Math.sin(a) * 4.4 + 0.9,
              1.8,
              4.2,
              M.teak,
            ),
          );
        }
      }
    add(group);
    occluder(group, "building");
    world.devices.RESTAURANT_01.meshes.push(group);
    // Festoon lights under the pergola.
    const bulb = new THREE.SphereGeometry(0.55, 8, 6);
    const bulbMaterial = litGlass("#ffe6b0", 4, "RESTAURANT_01");
    for (const [ya, yb] of [
      [293, 327],
      [327, 293],
    ])
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const x = 442 + t * 112;
        const y = ya + (yb - ya) * t;
        const sag = Math.sin(((t * 18) % 1) * Math.PI) * 1.5;
        add(place(mesh(bulb, bulbMaterial, { cast: false }), x, y, 16.6 - sag));
      }
    for (const x of [470, 526]) {
      const light = new THREE.PointLight("#ffc680", 800, 70, 2);
      add(place(light, x, 310, 14));
      world.devices.RESTAURANT_01.lights.push(light);
    }
  }
  planter(446, 334, 10);
  planter(550, 334, 10);

  // Sanitary block: timber cladding, metal roof, frosted windows.
  {
    const x0 = 452;
    const x1 = 528;
    const y0 = 340;
    const y1 = 372;
    const h = 16;
    const group = new THREE.Group();
    group.add(box(x0, y0, x1, y1, 0, h, M.cladding));
    group.add(
      box(
        x0 - 1.2,
        y0 - 1.2,
        x1 + 1.2,
        y1 + 1.2,
        h,
        h + 1,
        new THREE.MeshStandardMaterial({
          color: "#5b6368",
          roughness: 0.4,
          metalness: 0.7,
        }),
      ),
    );
    for (let c = 0; c < 6; c++) {
      const cx = x0 + 7 + c * 12.5;
      group.add(
        box(
          cx - 3.5,
          y1 - 0.05,
          cx + 3.5,
          y1 + 0.25,
          10,
          13.5,
          litGlass("#f3f0e0", 1.6, "SANITARY_01"),
          { cast: false },
        ),
      );
      if (c % 2 === 0)
        group.add(
          box(cx - 2.4, y1 - 0.05, cx + 2.4, y1 + 0.3, 1, 9, M.frameDark, {
            cast: false,
          }),
        );
    }
    group.add(
      box(
        x1 - 0.05,
        y0 + 6,
        x1 + 0.25,
        y1 - 6,
        10,
        13.5,
        litGlass("#f3f0e0", 1.6, "SANITARY_01"),
        { cast: false },
      ),
    );
    add(group);
    occluder(group, "building");
    world.devices.SANITARY_01.meshes.push(group);
    const light = new THREE.PointLight("#fff2d6", 600, 60, 2);
    add(place(light, 490, 378, 14));
    world.devices.SANITARY_01.lights.push(light);
  }
  // Fuel kiosk and pump.
  {
    const group = new THREE.Group();
    group.add(box(440, 496, 468, 522, 0, 12, M.stucco("#f1efe9")));
    group.add(
      box(
        438,
        494,
        470,
        524,
        12,
        13.6,
        new THREE.MeshStandardMaterial({ color: "#c63b32", roughness: 0.5 }),
      ),
    );
    group.add(box(448, 522, 462, 522.3, 2, 9, litGlass("#fff1d0", 1.6)));
    group.add(
      box(
        429,
        503,
        433,
        509,
        1,
        11,
        new THREE.MeshStandardMaterial({ color: "#d23f35", roughness: 0.4 }),
      ),
    );
    group.add(
      box(429.4, 508.9, 432.6, 509.2, 6, 9.5, litGlass("#fff6e0", 1.2)),
    );
    add(group);
    occluder(group, "building");
  }
  for (const [x, y, s] of [
    [572, 262, 0.9],
    [580, 316, 1],
    [574, 356, 0.85],
    [494, 512, 1],
    [540, 520, 1.1],
    [584, 508, 0.8],
  ])
    foliageTree(x, y, {
      height: 30 * s,
      spread: 11 * s,
      kind: pick(["broad", "olive", "broad"]),
    });
  shrubRow(478, 490, 594, 490, 4);
  shrubRow(440, 376, 594, 376, 3);
  for (const x of [470, 520, 570])
    foliageTree(x, 488, { height: 24, spread: 8, clumps: 18 });
  for (const [x, y] of [
    [566, 300],
    [586, 340],
    [562, 250],
  ])
    foliageTree(x, y, {
      height: rand(20, 26),
      spread: 8,
      kind: "olive",
      clumps: 18,
    });
  shrubRow(560, 376, 594, 376, 3.5);

  // Parked cars.
  const carColors = [
    "#d8d6d0",
    "#c9cccf",
    "#2a2e33",
    "#3a4e66",
    "#8d2f2c",
    "#f2f1ed",
    "#6f7a82",
    "#1f2326",
    "#a7a9aa",
    "#4b5a3f",
  ];
  function parkedCar(x, y, heading) {
    const group = new THREE.Group();
    const paint = M.paint(pick(carColors));
    const body = mesh(new RoundedBoxGeometry(18, 4.2, 8.2, 2, 1.4), paint);
    body.position.y = 2.9;
    group.add(body);
    const cabin = mesh(
      new RoundedBoxGeometry(9.5, 3.2, 7.2, 2, 1.2),
      M.glassDark,
    );
    cabin.position.set(-0.8, 5.8, 0);
    group.add(cabin);
    const roof = mesh(new RoundedBoxGeometry(8.2, 0.7, 7, 2, 0.3), paint);
    roof.position.set(-1, 7.4, 0);
    group.add(roof);
    const wheel = new THREE.CylinderGeometry(1.6, 1.6, 1.2, 12);
    wheel.rotateX(Math.PI / 2);
    for (const dx of [-5.8, 5.8])
      for (const dz of [-3.6, 3.6])
        group.add(place(mesh(wheel, M.tyre), dx, dz, 1.6));
    add(place(group, x, y, 1.1, heading));
    occluder(group, "car");
  }
  const parking = { total: 0, parked: 0 };
  const park = (x0, x1, y, heading, empty = []) => {
    for (let x = x0, i = 0; x < x1 - 8; x += 17, i++) {
      parking.total++;
      if (empty.includes(i) || random() >= 0.9) continue;
      parking.parked++;
      parkedCar(x + 8.5, y, heading + rand(-0.04, 0.04));
    }
  };
  park(14, 150, 339, Math.PI / 2, [2, 5]);
  park(14, 116, 392, Math.PI / 2, [1]);
  park(14, 116, 416, -Math.PI / 2, [3, 4]);
  park(14, 150, 464, -Math.PI / 2, [0, 6]);
  park(452, 588, 392, Math.PI / 2, [2, 6]);
  park(452, 588, 472, -Math.PI / 2, [1, 4]);
  world.parking = parking;

  // --- Piers, boats, breakwaters --------------------------------------------
  const deckZ = 0.6;
  function pontoon(x0, y0, x1, y1) {
    const group = new THREE.Group();
    group.add(box(x0, y0, x1, y1, deckZ - 1.2, deckZ, M.deck));
    // Floats below the deck, just above the waterline.
    group.add(
      box(
        x0 + 0.3,
        y0 + 0.3,
        x1 - 0.3,
        y1 - 0.3,
        Z - 0.5,
        deckZ - 1.2,
        M.float,
      ),
    );
    add(group);
    return group;
  }
  function cleat(x, y) {
    add(
      place(
        mesh(new THREE.BoxGeometry(1.8, 0.6, 0.6), M.metal),
        x,
        y,
        deckZ + 0.3,
      ),
    );
  }
  // Boats. `x, y` is the hull centre, `heading` the bow direction.
  const hullMaterials = [
    M.gelcoat(),
    M.gelcoat(),
    M.gelcoat(),
    M.gelcoat("#1f3550"),
    M.gelcoat("#e9e6de"),
    M.gelcoat("#2d4a3c"),
  ];
  const canvasColors = [
    "#1e3a5a",
    "#2f4f6f",
    "#c9bfa6",
    "#6b6f72",
    "#8a2d2a",
    "#1f5f6e",
  ];
  function hullGeometry(length, beam, height, deadrise = 0.35) {
    // Lofted sections from stern (t = 0) to bow (t = 1).
    const sections = 22;
    const around = 9;
    const position = [];
    const index = [];
    for (let s = 0; s <= sections; s++) {
      const t = s / sections;
      const half =
        (beam / 2) *
        (t < 0.55
          ? 1 - (0.55 - t) * 0.18
          : Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2)) * 0.98 + 0.02);
      const sheer = height * (1 + Math.max(0, t - 0.6) * 0.5);
      const keel = -height * 0.35 * (1 - t * 0.2);
      for (let a = 0; a <= around; a++) {
        const u = a / around; // 0 = port sheer, 1 = starboard sheer
        const side = u < 0.5 ? -1 : 1;
        const k = Math.abs(u - 0.5) * 2; // 1 at sheer, 0 at keel
        const y = keel + (sheer - keel) * k ** 1.6;
        const x =
          side *
          half *
          Math.min(1, k * (1 + deadrise) - (k > 0.9 ? 0 : 0)) *
          (0.55 + 0.45 * k);
        position.push((t - 0.5) * length, y, x);
      }
    }
    for (let s = 0; s < sections; s++)
      for (let a = 0; a < around; a++) {
        const i = s * (around + 1) + a;
        const j = i + around + 1;
        index.push(i, j, i + 1, i + 1, j, j + 1);
      }
    // Transom.
    const base = position.length / 3;
    for (let a = 0; a <= around; a++)
      position.push(position[a * 3], position[a * 3 + 1], position[a * 3 + 2]);
    position.push(-length / 2, height, 0);
    const centre = base + around + 1;
    for (let a = 0; a < around; a++) index.push(base + a, base + a + 1, centre);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(position, 3),
    );
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    return geometry;
  }
  function deckGeometry(length, beam, z) {
    const shape = new THREE.Shape();
    const steps = 20;
    const half = (t) =>
      (beam / 2) *
        (t < 0.55
          ? 1 - (0.55 - t) * 0.18
          : Math.sqrt(Math.max(0, 1 - ((t - 0.55) / 0.45) ** 2)) * 0.98 +
            0.02) -
      0.4;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const p = [(t - 0.5) * length, -half(t)];
      if (s === 0) shape.moveTo(...p);
      else shape.lineTo(...p);
    }
    for (let s = steps; s >= 0; s--) {
      const t = s / steps;
      shape.lineTo((t - 0.5) * length, half(t));
    }
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, z, 0);
    return geometry;
  }
  function boat(
    x,
    y,
    heading,
    { type = pick(["sail", "sail", "motor", "motor", "fishing"]), length } = {},
  ) {
    const group = new THREE.Group();
    const L =
      length ??
      (type === "motor"
        ? rand(34, 44)
        : type === "sail"
          ? rand(32, 40)
          : rand(22, 28));
    const B = L * (type === "sail" ? 0.33 : 0.34);
    const H = type === "fishing" ? 3.4 : 4.2;
    const hullMaterial =
      type === "fishing"
        ? M.gelcoat(pick(["#2c5f8a", "#b8412f", "#f0eee8", "#3d6b4f"]))
        : pick(hullMaterials);
    group.add(mesh(hullGeometry(L, B, H), hullMaterial));
    // Boot stripe at the waterline.
    const stripe = mesh(
      hullGeometry(L * 1.003, B * 1.01, 0.6),
      M.gelcoat(pick(["#1c2c40", "#0f1a24", "#7a1f1f"])),
    );
    stripe.position.y = -0.15;
    stripe.scale.set(1, 1, 1);
    group.add(stripe);
    group.add(
      mesh(
        deckGeometry(L, B, H - 0.05),
        type !== "fishing" && random() < 0.3 ? M.teak : M.white,
      ),
    );
    const accent = M.canvas(pick(canvasColors));
    if (type === "motor") {
      const cabin = mesh(
        new RoundedBoxGeometry(L * 0.46, 4.6, B * 0.72, 3, 1.4),
        M.gelcoat(),
      );
      cabin.position.set(-L * 0.04, H + 2.2, 0);
      group.add(cabin);
      const glass = mesh(
        new RoundedBoxGeometry(L * 0.47, 1.9, B * 0.74, 2, 0.8),
        M.glassDark,
      );
      glass.position.set(-L * 0.04, H + 3, 0);
      group.add(glass);
      const fly = mesh(
        new RoundedBoxGeometry(L * 0.26, 2.2, B * 0.58, 2, 0.8),
        M.gelcoat(),
      );
      fly.position.set(-L * 0.12, H + 5.4, 0);
      group.add(fly);
      const bimini = mesh(
        new RoundedBoxGeometry(L * 0.2, 0.5, B * 0.6, 2, 0.2),
        accent,
      );
      bimini.position.set(-L * 0.18, H + 8.8, 0);
      group.add(bimini);
    } else if (type === "sail") {
      const cabin = mesh(
        new RoundedBoxGeometry(L * 0.36, 2.4, B * 0.6, 3, 1),
        M.gelcoat(),
      );
      cabin.position.set(-L * 0.02, H + 1, 0);
      group.add(cabin);
      group.add(
        place(
          mesh(
            new RoundedBoxGeometry(L * 0.36, 0.6, B * 0.62, 2, 0.25),
            M.glassDark,
          ),
          -L * 0.02,
          0,
          H + 1.4,
        ),
      );
      const mastH = L * 1.45;
      const mast = mesh(
        new THREE.CylinderGeometry(0.28, 0.36, mastH, 6),
        M.metal,
      );
      mast.position.set(L * 0.12, H + mastH / 2, 0);
      group.add(mast);
      const boom = mesh(
        new THREE.CylinderGeometry(0.22, 0.22, L * 0.42, 6),
        M.metal,
      );
      boom.rotation.z = Math.PI / 2;
      boom.position.set(L * 0.12 - L * 0.21, H + 4.6, 0);
      group.add(boom);
      // Sail cover over the boom.
      const cover = mesh(
        new THREE.CapsuleGeometry(0.75, L * 0.36, 3, 8),
        accent,
      );
      cover.rotation.z = Math.PI / 2;
      cover.position.set(L * 0.12 - L * 0.21, H + 5.4, 0);
      group.add(cover);
      // Standing rigging: forestay, backstay, shrouds.
      const wire = (a, b) => {
        const d = new THREE.Vector3().subVectors(b, a);
        const item = mesh(
          new THREE.CylinderGeometry(0.07, 0.07, d.length(), 3),
          M.rope,
          { cast: false },
        );
        item.position.copy(a).addScaledVector(d, 0.5);
        item.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          d.normalize(),
        );
        group.add(item);
      };
      const top = new THREE.Vector3(L * 0.12, H + mastH, 0);
      wire(top, new THREE.Vector3(L * 0.49, H + 0.5, 0));
      wire(top, new THREE.Vector3(-L * 0.49, H + 0.5, 0));
      wire(top, new THREE.Vector3(L * 0.1, H + 0.5, B * 0.46));
      wire(top, new THREE.Vector3(L * 0.1, H + 0.5, -B * 0.46));
    } else {
      // Fishing boat: wheelhouse forward, gear aft.
      const house = mesh(
        new RoundedBoxGeometry(L * 0.24, 5, B * 0.62, 2, 0.5),
        M.gelcoat("#f1efe9"),
      );
      house.position.set(L * 0.1, H + 2.4, 0);
      group.add(house);
      group.add(
        place(
          mesh(
            new RoundedBoxGeometry(L * 0.25, 1.4, B * 0.64, 2, 0.4),
            M.glassDark,
          ),
          L * 0.1,
          0,
          H + 3.8,
        ),
      );
      const nets = mesh(
        new THREE.SphereGeometry(B * 0.25, 8, 6),
        M.canvas(pick(["#2c6b4f", "#b0452f", "#384b5a"])),
      );
      nets.scale.set(1.4, 0.5, 1);
      nets.position.set(-L * 0.25, H + 0.6, 0);
      group.add(nets);
      group.add(
        place(
          mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 5), M.darkMetal),
          L * 0.1,
          0,
          H + 9,
        ),
      );
    }
    // Rails along the bow.
    const rail = mesh(
      new THREE.TorusGeometry(B * 0.42, 0.12, 4, 20, Math.PI),
      M.metal,
      { cast: false },
    );
    rail.rotation.x = Math.PI / 2;
    rail.rotation.z = -Math.PI / 2;
    rail.position.set(L * 0.28, H + 1.6, 0);
    rail.scale.set(1, 1.7, 1);
    group.add(rail);
    // Fenders on the pier side.
    for (const dx of [-0.2, 0.15])
      group.add(
        place(
          mesh(new THREE.CapsuleGeometry(0.7, 1.6, 3, 8), M.white),
          L * dx,
          B / 2 + 0.6,
          H - 1.5,
        ),
      );
    group.traverse((item) => item.isMesh && (item.userData.boat = true));
    add(place(group, x, y, Z + 0.9, heading));
    occluder(group, type === "sail" ? "mast" : "boat");
    return group;
  }

  const pierWidth = 6;
  const fingers = [];
  for (const y of LAYOUT.piers) {
    // West and east main pontoons.
    pontoon(
      LAYOUT.westQuay[1],
      y - pierWidth / 2,
      LAYOUT.pierEnds.west,
      y + pierWidth / 2,
    );
    pontoon(
      LAYOUT.pierEnds.east,
      y - pierWidth / 2,
      LAYOUT.eastQuay[0],
      y + pierWidth / 2,
    );
    for (const side of [-1, 1]) {
      // Four berths per side of each pier, with finger pontoons between.
      for (let i = 0; i <= 4; i++) {
        const wx = LAYOUT.westQuay[1] + 3 + i * LAYOUT.berth;
        const ex = LAYOUT.eastQuay[0] - 3 - i * LAYOUT.berth;
        for (const fx of [wx, ex]) {
          const y0 = side < 0 ? y - pierWidth / 2 - 28 : y + pierWidth / 2;
          const y1 = side < 0 ? y - pierWidth / 2 : y + pierWidth / 2 + 28;
          if (fx < LAYOUT.pierEnds.west + 1 || fx > LAYOUT.pierEnds.east - 1)
            fingers.push([fx - 1.2, y0, fx + 1.2, y1]);
        }
      }
    }
  }
  for (const [x0, y0, x1, y1] of fingers) {
    pontoon(x0, y0, x1, y1);
    cleat((x0 + x1) / 2, y0 < 300 ? y0 + 2 : y1 - 2);
  }
  // Moored boats: bows to the pier, sterns to the fairway side... In this
  // marina the boats lie stern-to the pier, bows pointing away.
  const empty = new Set(["W0-1", "W1+2", "E0+0", "E1-3", "E2+1", "W2-3"]);
  const berths = [];
  LAYOUT.piers.forEach((y, p) => {
    for (const side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        for (const [prefix, x] of [
          ["W", LAYOUT.westQuay[1] + 3 + (i + 0.5) * LAYOUT.berth],
          ["E", LAYOUT.eastQuay[0] - 3 - (i + 0.5) * LAYOUT.berth],
        ]) {
          const key = `${prefix}${p}${side < 0 ? "-" : "+"}${i}`;
          berths.push(key);
          if (empty.has(key)) continue;
          const type = pick([
            "sail",
            "sail",
            "motor",
            "motor",
            "sail",
            "fishing",
          ]);
          const L =
            type === "motor"
              ? rand(28, 30)
              : type === "sail"
                ? rand(27, 30)
                : rand(20, 24);
          const by = y + side * (pierWidth / 2 + 1 + L / 2);
          boat(x + rand(-0.5, 0.5), by, side < 0 ? -Math.PI / 2 : Math.PI / 2, {
            type,
            length: L,
          });
        }
      }
  });
  world.berths = { total: berths.length, occupied: berths.length - empty.size };
  // Service pedestals at the pier roots and ends.
  for (const y of LAYOUT.piers)
    for (const x of [200, 240, 360, 400]) {
      add(box(x - 1.2, y - 1.2, x + 1.2, y + 1.2, deckZ, deckZ + 5, M.white));
      add(
        box(
          x - 1.3,
          y - 1.3,
          x + 1.3,
          y + 1.3,
          deckZ + 5,
          deckZ + 5.6,
          new THREE.MeshStandardMaterial({ color: "#2f86b8", roughness: 0.4 }),
        ),
      );
      add(
        box(
          x - 0.8,
          y + 1.25,
          x + 0.8,
          y + 1.3,
          deckZ + 3.6,
          deckZ + 4.4,
          litGlass("#bfe8ff", 1.4),
        ),
      );
    }
  // Pier lights (switchable).
  for (const [id, [x, y]] of Object.entries(PIER_LAMPS))
    lantern(x, y, {
      h: 18,
      device: id,
      power: 2200,
      reach: 120,
      color: "#ffd98f",
    });
  // Fuel dock.
  pontoon(414, 496, 428, 526);

  // Breakwaters of rock with a concrete walkway and harbour lights.
  function breakwater(x0, x1) {
    const y = LAYOUT.breakwaterY;
    const group = new THREE.Group();
    group.add(box(x0, y - 3, x1, y + 3, Z - 1, 3, M.concrete));
    const tones = ["#8e8a82", "#7a766e", "#a19c92", "#6d6a64"];
    for (let x = x0; x < x1; x += 3.2)
      for (const dy of [-6.5, -3.5, 3.5, 6.5]) {
        const r = rand(2, 3.4);
        const rock = mesh(blob(r, 1), M.rock(pick(tones)));
        rock.scale.set(1, 0.6, 1);
        rock.position.set(
          x + rand(-1, 1),
          Z + r * 0.35 + (Math.abs(dy) < 4 ? 1.4 : 0),
          y + dy + rand(-1, 1),
        );
        rock.rotation.set(rand(0, 3), rand(0, 3), rand(0, 3));
        group.add(rock);
      }
    add(group);
    occluder(group, "breakwater");
  }
  breakwater(LAYOUT.westQuay[1] - 20, LAYOUT.entrance[0] - 4);
  breakwater(LAYOUT.entrance[1] + 4, LAYOUT.eastQuay[0] + 20);
  const harbourLight = (x, color) => {
    const group = new THREE.Group();
    const paint = new THREE.MeshStandardMaterial({
      color: color === "red" ? "#c43f35" : "#2f8f55",
      roughness: 0.5,
    });
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(3.2, 3.8, 24, 16), paint),
        0,
        0,
        12,
      ),
    );
    for (const z of [6, 14])
      group.add(
        place(
          mesh(new THREE.CylinderGeometry(3.3, 3.3, 1.6, 16), M.white),
          0,
          0,
          z,
        ),
      );
    group.add(
      place(
        mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.8, 16), M.darkMetal),
        0,
        0,
        24.4,
      ),
    );
    const lamp = mesh(
      new THREE.CylinderGeometry(1.6, 1.6, 3, 12),
      litGlass(color === "red" ? "#ff4a36" : "#39ff7a", 5),
    );
    group.add(place(lamp, 0, 0, 26.6));
    group.add(
      place(
        mesh(new THREE.ConeGeometry(2.2, 1.6, 12), M.darkMetal),
        0,
        0,
        28.9,
      ),
    );
    add(place(group, x, LAYOUT.breakwaterY, 2));
    const light = new THREE.PointLight(
      color === "red" ? "#ff5a40" : "#40ff80",
      500,
      70,
      2,
    );
    add(place(light, x, LAYOUT.breakwaterY + 4, 26));
    world.staticLights.push(light);
    occluder(group, "lamp");
  };
  harbourLight(LAYOUT.entrance[0] - 6, "red");
  harbourLight(LAYOUT.entrance[1] + 6, "green");

  // Promenade life-buoy stands.
  for (const x of [186, 414]) {
    add(box(x - 0.4, 232, x + 0.4, 232.8, 1, 12, M.darkMetal));
    const buoy = mesh(
      new THREE.TorusGeometry(2, 0.7, 8, 16),
      new THREE.MeshStandardMaterial({ color: "#e0572f", roughness: 0.6 }),
    );
    add(place(buoy, x, 233.4, 9));
  }

  // --- Finish trees: world UVs, placement, shadows. ------------------------
  for (const part of treeParts) {
    const item = mesh(part.geometry, part.material);
    if (part.doubleSide) {
      item.material = part.material.clone();
      item.material.side = THREE.DoubleSide;
    }
    if (!part.absolute) item.position.set(part.x, 1.4, part.y);
    else item.position.y = 0;
    add(item);
    if (part.crown) occluder(item, "tree");
  }
  scene.traverse((item) => {
    if (!item.isMesh || item === water) return;
    const scale = item.material?.userData?.scale;
    if (scale) worldUV(item.geometry, scale, item);
  });
  return { scene, world, materials: M };
}

// ---------------------------------------------------------------------------
// Camera matching the city photo: the principal point is off centre, so the
// view is a window into a larger virtual frame centred on it.
export function makeCamera() {
  const [cx, cy, cz, pitch, yaw, focal, px, py] = CAMERA;
  const fullW = 2 * Math.max(px, SCENE_W - px);
  const fullH = 2 * Math.max(py, SCENE_H - py);
  const camera = new THREE.PerspectiveCamera(
    (2 * Math.atan(fullH / 2 / focal) * 180) / Math.PI,
    fullW / fullH,
    20,
    4000,
  );
  camera.position.set(cx, cz, cy);
  const forward = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch),
  );
  camera.up.set(0, 1, 0);
  camera.lookAt(camera.position.clone().add(forward));
  camera.setViewOffset(
    fullW,
    fullH,
    fullW / 2 - px,
    fullH / 2 - py,
    SCENE_W,
    SCENE_H,
  );
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

// World point to scene pixels.
export function projector(camera) {
  const v = new THREE.Vector3();
  return ([x, y, z = 0]) => {
    v.set(x, z, y).project(camera);
    return [((v.x + 1) / 2) * SCENE_W, ((1 - v.y) / 2) * SCENE_H];
  };
}

// ---------------------------------------------------------------------------
// Renderer: lights, post-processing, and the passes the generator needs.
export function makeRenderer(width, height) {
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);
  return renderer;
}

export function light(scene, renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.3;
  // The water mirrors a pale evening sky.
  const sky = new THREE.Scene();
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(10, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader:
        "varying vec3 p; void main(){ p = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader:
        "varying vec3 p; void main(){ float h = normalize(p).y; vec3 c = mix(vec3(0.62, 0.66, 0.70), vec3(0.34, 0.42, 0.52), smoothstep(0.0, 0.8, h)); gl_FragColor = vec4(c, 1.0); }",
    }),
  );
  sky.add(dome);
  const water = scene.getObjectByName("water");
  if (water) water.material.envMap = pmrem.fromScene(sky).texture;
  scene.background = new THREE.Color("#dfe2e4");
  const hemi = new THREE.HemisphereLight("#c9d2de", "#3a3129", 0.5);
  scene.add(hemi);
  // Soft studio key from the back left, warm like the city photo.
  const key = new THREE.DirectionalLight("#ffd7a8", 1.25);
  key.position.set(300 - 380, 780, 300 - 520);
  key.target.position.set(300, 0, 320);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  const s = key.shadow.camera;
  s.left = -520;
  s.right = 520;
  s.top = 520;
  s.bottom = -520;
  s.near = 100;
  s.far = 2200;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  // Fill from the camera side.
  const fill = new THREE.DirectionalLight("#cfdcff", 0.35);
  fill.position.set(300, 500, 1400);
  scene.add(fill);
  return { key, hemi, fill };
}

// Tilt-shift: the far back and the plinth soften slightly, as in a macro photo.
const TiltShift = {
  uniforms: {
    tDiffuse: { value: null },
    amount: { value: 1.6 },
    focus: { value: 0.46 },
    band: { value: 0.3 },
    texel: { value: new THREE.Vector2() },
  },
  vertexShader:
    "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float amount; uniform float focus; uniform float band; uniform vec2 texel; varying vec2 vUv;
  void main(){ float d = max(0.0, abs((1.0 - vUv.y) - focus) - band) / (1.0 - band); float r = amount * d * d * 6.0;
    vec4 sum = vec4(0.0); float total = 0.0;
    for (int i = -6; i <= 6; i++) for (int j = -3; j <= 3; j++) { vec2 o = vec2(float(j) * 1.6, float(i)) * texel * r / 3.0; float w = exp(-float(i*i + j*j) / 18.0); sum += texture2D(tDiffuse, vUv + o) * w; total += w; }
    gl_FragColor = sum / total; }`,
};

export function makeComposer(
  renderer,
  scene,
  camera,
  width,
  height,
  { ao = true, bloom = true, tilt = true } = {},
) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    samples: 4,
  });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(1);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  if (ao) {
    const gtao = new GTAOPass(scene, camera, width, height);
    gtao.updateGtaoMaterial({
      radius: 6,
      distanceExponent: 1.2,
      thickness: 3,
      scale: 1.2,
      samples: 16,
    });
    gtao.updatePdMaterial({
      lumaPhi: 10,
      depthPhi: 2,
      normalPhi: 3,
      radius: 6,
      rings: 2,
      samples: 16,
    });
    gtao.blendIntensity = 0.85;
    composer.addPass(gtao);
  }
  if (bloom)
    composer.addPass(
      new UnrealBloomPass(new THREE.Vector2(width, height), 0.32, 0.35, 0.96),
    );
  composer.addPass(new OutputPass());
  if (tilt) {
    const pass = new ShaderPass(TiltShift);
    pass.uniforms.texel.value.set(1 / width, 1 / height);
    composer.addPass(pass);
  }
  return composer;
}

// Switches a device's lamps and glazing.
export function setDevice(world, id, on) {
  const device = world.devices[id];
  for (const light of device.lights) {
    light.userData.power ??= light.intensity;
    light.intensity = on ? light.userData.power : 0;
  }
  for (const material of device.emissive) {
    material.emissiveIntensity = on ? material.userData.on.intensity : 0;
    material.color.set(on ? "#2a2620" : "#1e2a31");
    material.roughness = on ? 0.25 : 0.1;
    material.metalness = on ? 0 : 0.4;
  }
}

export { THREE };
