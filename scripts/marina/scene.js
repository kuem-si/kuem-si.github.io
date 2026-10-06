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
// Layout (mm). The camp fills the back of the board, the coast road and
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
export const rngOf = (seed) => () => {
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
export function makeMaterials() {
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
export function worldUV(geometry, scale, object) {
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

// The board's base, shared by the maquettes built on it (the industry model,
// scripts/industry/scene.js, stands on the same one). `add`, `mesh` and `box`
// are the scene's builders.
export function buildBase(add, mesh, box) {
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
  return { SEAM, seamMaterial };
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

  const { SEAM, seamMaterial } = buildBase(add, mesh, box);

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
  // Camp block and road corridor (back half, all land).
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
  // Scenery trees as on the city model: a bare trunk forking into limbs, each
  // carrying a mass of fine, dark olive flock.
  const leafColors = {
    broad: ["#46542a", "#535f2e", "#3b4824", "#616b36", "#4c592b"],
    olive: ["#5f6a38", "#6d743f", "#545f33", "#787c46"],
    conifer: ["#2f4028", "#394a2d", "#283820", "#42522f"],
  };
  // Lumpy sphere. The icosahedron's faces do not share vertices, so the
  // displacement is a hash of the position: shared corners move together.
  // Rocks are faceted; flock keeps the sphere's smooth normals.
  const blob = (radius, detail = 1, faceted = true) => {
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
    if (faceted) geometry.computeVertexNormals();
    return geometry;
  };
  const flock = (radius) => blob(radius, 1, false);
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
  // Planting draws from its own sequence, seeded by where it stands. `draws`
  // is what the earlier, simpler planting took from the board's sequence, so
  // everything built after it stays as it was.
  const planting = (x, y, draws, build) => {
    for (let i = 0; i < draws; i++) random();
    const board = random;
    random = rngOf(Math.round(x * 7919 + y * 104729) + 17);
    build();
    random = board;
  };
  // Tapered branch between two points (three.js coordinates).
  const limb = (from, to, r0, r1) => {
    const d = new THREE.Vector3().subVectors(to, from);
    const length = d.length();
    const geometry = new THREE.CylinderGeometry(r1, r0, length, 6);
    geometry.translate(0, length / 2, 0);
    geometry.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      ),
    );
    geometry.translate(from.x, from.y, from.z);
    return geometry;
  };
  function foliageTree(
    x,
    y,
    {
      height = 34,
      spread = 13,
      kind = "broad",
      clumps = 26,
      draws = clumps * 726,
    } = {},
  ) {
    planting(x, y, draws, () => {
      const colors = leafColors[kind];
      const conifer = kind === "conifer";
      const girth = 0.45 + height * 0.022;
      const trunkTop = height * (conifer ? 0.14 : rand(0.3, 0.38));
      const crown = height - trunkTop;
      const wood = [];
      const leaves = [];
      const clump = (px, py, pz, size) => {
        const geometry = colorize(
          flock(size),
          pick(colors),
          ((py - trunkTop) / height) * 0.45 - 0.08,
        );
        geometry.translate(px, py, pz);
        leaves.push(geometry);
      };
      if (conifer) {
        // A spire: tiers of flock narrowing to the tip.
        wood.push(
          limb(
            new THREE.Vector3(),
            new THREE.Vector3(0, height * 0.8, 0),
            girth * 0.8,
            0.2,
          ),
        );
        const reach = spread * 0.62;
        for (let i = 0; i < clumps * 2.2; i++) {
          const t = random() ** 1.4;
          const a = rand(0, Math.PI * 2);
          const r = reach * (1 - t) * Math.sqrt(rand(0.15, 1));
          clump(
            Math.cos(a) * r,
            trunkTop + t * crown * 0.94,
            Math.sin(a) * r,
            reach * rand(0.22, 0.32) * (1 - t * 0.55),
          );
        }
      } else {
        const fork = new THREE.Vector3(
          rand(-0.6, 0.6),
          trunkTop,
          rand(-0.6, 0.6),
        );
        wood.push(limb(new THREE.Vector3(), fork, girth, girth * 0.7));
        // A leader and a ring of side limbs, each ending in a lobe of flock.
        const limbs = 4 + Math.floor(rand(0, 3));
        const turn = rand(0, Math.PI * 2);
        for (let l = 0; l < limbs; l++) {
          const leader = l === 0;
          const a = turn + (l / (limbs - 1)) * Math.PI * 2 + rand(-0.4, 0.4);
          const out = leader
            ? rand(0, 0.12) * spread
            : spread * rand(0.42, 0.62);
          const centre = new THREE.Vector3(
            Math.cos(a) * out,
            trunkTop + crown * (leader ? rand(0.6, 0.68) : rand(0.26, 0.5)),
            Math.sin(a) * out,
          );
          wood.push(limb(fork, centre, girth * 0.5, girth * 0.2));
          const rx = spread * (leader ? rand(0.5, 0.62) : rand(0.4, 0.55));
          const ry = crown * (leader ? 0.3 : rand(0.22, 0.3));
          const count = Math.round((clumps * (leader ? 3.2 : 1.8)) / limbs + 3);
          for (let i = 0; i < count; i++) {
            const a2 = rand(0, Math.PI * 2);
            const e = Math.acos(rand(-1, 1));
            const r = Math.cbrt(rand(0.25, 1));
            clump(
              centre.x + Math.cos(a2) * Math.sin(e) * r * rx,
              centre.y + Math.cos(e) * r * ry,
              centre.z + Math.sin(a2) * Math.sin(e) * r * rx,
              spread * rand(0.17, 0.3),
            );
          }
        }
      }
      treeParts.push({
        geometry: mergeGeometries(wood),
        material: M.bark,
        x,
        y,
      });
      treeParts.push({
        geometry: mergeGeometries(leaves),
        material: M.foliage,
        x,
        y,
        crown: true,
      });
    });
  }
  function shrubRow(x0, y0, x1, y1, height = 4, color = "#465a2c") {
    const length = Math.hypot(x1 - x0, y1 - y0);
    let earlier = 0;
    for (let d = 0; d < length; d += 2.2) earlier++;
    planting(x0 + x1, y0 + y1, earlier * 725, () => {
      const parts = [];
      for (let d = 0; d < length; d += 1.7) {
        const t = d / length;
        const geometry = colorize(flock(rand(1.5, 2.4)), color, 0.05);
        geometry.translate(0, height * rand(0.45, 0.9), 0);
        geometry.translate(
          x0 + (x1 - x0) * t + rand(-0.7, 0.7),
          0,
          y0 + (y1 - y0) * t + rand(-0.7, 0.7),
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
    });
  }
  // Flower planter: stone trough with blooms.
  function planter(x, y, width = 14) {
    add(box(x - width / 2, y - 3, x + width / 2, y + 3, 1, 3.6, M.concrete));
    planting(x, y, Math.ceil(width * 1.4) * 185, () => {
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

  // Promenade lamps (also used along the camp lane).
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

  // Camp behind the coast road: a reception by the entrance, two mobile homes,
  // and pitches with holiday trailers under the trees either side of a gravel
  // lane. It draws from its own random sequence, so the rest of the board is
  // unchanged.
  const campCars = [];
  const outerRandom = random;
  random = rngOf(20260928);
  {
    const ground = (x0, y0, x1, y1, material, z = 0.85) =>
      add(slab(rect(x0, y0, x1, y1), 0, z, material, { cast: false }));
    const gravel = new THREE.MeshStandardMaterial({
      color: "#b3a78f",
      map: M.stuccoMap,
      normalMap: M.stuccoNormal,
      roughness: 1,
      userData: { scale: 14 },
    });
    const LANE = [92, 104];
    const DRIVE = [288, 312];
    ground(4, 4, 596, 150, M.grass, 0.7);
    ground(14, LANE[0], 586, LANE[1], gravel);
    // Entrance drive from the coast road, across the pavement.
    ground(DRIVE[0], LANE[1], DRIVE[1], 156, M.asphalt, 0.9);
    ground(DRIVE[0], 150, DRIVE[1], LAYOUT.road[0] + 0.2, M.asphalt, 1.3);

    const campLamp = (x, y) =>
      lantern(x, y, { h: 11, power: 260, reach: 45, color: "#ffe6b8" });
    // Hook-up pedestal on a pitch: power and water.
    const pedestalTop = new THREE.MeshStandardMaterial({
      color: "#2f86b8",
      roughness: 0.4,
    });
    const hookup = (x, y) => {
      add(box(x - 0.7, y - 0.7, x + 0.7, y + 0.7, 0.7, 4.6, M.white));
      add(box(x - 0.8, y - 0.8, x + 0.8, y + 0.8, 4.6, 5.1, pedestalTop));
    };

    // Holiday trailer. `heading` is where its drawbar points; the awning is
    // on its right-hand side (towards the viewer at heading 0).
    const stripes = ["#2f6f8f", "#b8412f", "#3d6b4f", "#c98a2b", "#5d6a73"];
    const awnings = ["#c9bfa6", "#2f4f6f", "#8a2d2a", "#3d6b4f", "#d8d2c2"];
    const caravan = (x, y, heading, { awning = true, lit = false } = {}) => {
      const group = new THREE.Group();
      const L = rand(21, 25);
      const W = 9.6;
      const H = 8.6;
      const floor = 2.2;
      const part = (geometry, material, px, py, pz, options) => {
        const item = mesh(geometry, material, options);
        item.position.set(px, py, pz);
        group.add(item);
        return item;
      };
      part(
        new RoundedBoxGeometry(L, H, W, 3, 1.8),
        M.gelcoat(pick(["#f4f3ef", "#efeee8", "#e9e6de"])),
        0,
        floor + H / 2,
        0,
      );
      part(
        new THREE.BoxGeometry(L - 3.4, 0.9, W + 0.12),
        M.canvas(pick(stripes)),
        0,
        floor + H * 0.36,
        0,
        { cast: false },
      );
      const glass = lit ? litGlass("#ffd08a", 1.8) : M.glassDark;
      // Side windows, and the big windows at both ends.
      part(
        new THREE.BoxGeometry(L * 0.3, 2.6, W + 0.16),
        glass,
        -L * 0.16,
        floor + H * 0.66,
        0,
        { cast: false },
      );
      part(
        new THREE.BoxGeometry(L + 0.14, 2.4, W * 0.62),
        glass,
        0,
        floor + H * 0.66,
        0,
        { cast: false },
      );
      // Door on the awning side.
      part(
        new THREE.BoxGeometry(3, 6.2, 0.2),
        M.frame,
        L * 0.2,
        floor + 3.4,
        W / 2 + 0.02,
        { cast: false },
      );
      part(new THREE.BoxGeometry(3, 0.6, 3), M.white, -L * 0.1, floor + H, 0);
      const wheel = new THREE.CylinderGeometry(1.5, 1.5, 1.1, 12);
      wheel.rotateX(Math.PI / 2);
      for (const side of [-1, 1])
        part(wheel, M.tyre, -1, 1.5, side * (W / 2 - 0.4));
      // Drawbar and jockey wheel.
      part(
        new THREE.BoxGeometry(6, 0.5, 0.7),
        M.darkMetal,
        L / 2 + 2.6,
        floor - 0.2,
        0,
      );
      part(
        new THREE.CylinderGeometry(0.35, 0.35, 2, 6),
        M.darkMetal,
        L / 2 + 5,
        1,
        0,
      );
      if (awning) {
        const depth = 8.5;
        const width = L * 0.72;
        const cloth = M.canvas(pick(awnings));
        cloth.side = THREE.DoubleSide;
        const roof = part(
          new THREE.BoxGeometry(width, 0.25, depth),
          cloth,
          -L * 0.04,
          floor + H - 2,
          W / 2 + depth / 2,
        );
        roof.rotation.x = 0.17;
        for (const side of [-1, 1])
          part(
            new THREE.CylinderGeometry(0.16, 0.16, floor + H - 2.8, 5),
            M.metal,
            -L * 0.04 + side * (width / 2 - 0.4),
            (floor + H - 2.8) / 2,
            W / 2 + depth - 0.4,
            { cast: false },
          );
        // Groundsheet with a table and two chairs.
        part(
          new THREE.BoxGeometry(width, 0.12, depth),
          M.canvas("#7d8a6a"),
          -L * 0.04,
          0.06,
          W / 2 + depth / 2,
          { cast: false },
        );
        part(
          new THREE.CylinderGeometry(1.5, 1.5, 0.3, 12),
          M.white,
          -L * 0.1,
          2.6,
          W / 2 + 4.6,
        );
        part(
          new THREE.CylinderGeometry(0.2, 0.2, 2.5, 5),
          M.darkMetal,
          -L * 0.1,
          1.25,
          W / 2 + 4.6,
        );
        for (const side of [-1, 1])
          part(
            new THREE.BoxGeometry(1.4, 1.8, 1.4),
            M.teak,
            -L * 0.1 + side * 2.8,
            0.9,
            W / 2 + 4.6,
          );
      }
      add(place(group, x, y, 0.85, heading));
      occluder(group, "building");
      if (lit) {
        const glow = new THREE.PointLight("#ffcf8f", 140, 32, 2);
        add(
          place(glow, x - Math.sin(heading) * 9, y + Math.cos(heading) * 9, 6),
        );
        world.staticLights.push(glow);
      }
    };
    // A pitch: gravel pad, hook-up, and usually a trailer with its car.
    const pitch = (cx, y0, y1, { trailer = true, car = true } = {}) => {
      ground(cx - 22, y0, cx + 22, y1, gravel);
      hookup(cx - 24, y0 + 4);
      if (!trailer) return;
      const lit = random() < 0.55;
      if (random() < 0.3) {
        // End-on, the awning to one side.
        const side = random() < 0.5 ? 1 : -1;
        caravan(
          cx - side * 7,
          y0 + 17,
          (side * Math.PI) / 2 + rand(-0.05, 0.05),
          {
            lit,
          },
        );
        if (car) campCars.push([cx + side * 15, y0 + 18, -Math.PI / 2]);
      } else {
        caravan(cx + rand(-4, 2), y0 + 9, rand(-0.06, 0.06), {
          lit,
          awning: random() < 0.85,
        });
        if (car)
          campCars.push([
            cx + rand(-6, 6),
            y1 - 7,
            random() < 0.5 ? 0 : Math.PI,
          ]);
      }
    };

    // Back row: nine pitches between hedges.
    const backPitches = [44, 108, 172, 236, 300, 364, 428, 492, 556];
    backPitches.forEach((cx, i) =>
      pitch(cx, 40, LANE[0], {
        trailer: i !== 3 && i !== 6,
        car: i !== 1 && i !== 7,
      }),
    );
    for (let x = 76; x < 560; x += 64) shrubRow(x, 26, x, 88, 3, "#3f5a2e");
    shrubRow(8, 20, 592, 20, 3.4, "#3f5a2e");
    // Front row: two pitches at the west end, three east of the reception.
    for (const cx of [42, 102, 428, 490, 552])
      pitch(cx, 112, 144, { car: false });
    for (const x of [72, 458, 520]) shrubRow(x, 110, x, 144, 3, "#3f5a2e");

    // Mobile homes: clad cabins under shallow metal roofs, each with a deck.
    const mobileHome = (x0, x1, wall) => {
      const y0 = 114;
      const y1 = 131;
      house({
        x0,
        y0,
        x1,
        y1,
        h: 10.5,
        wall,
        roofMaterial: M.slate("#666c72"),
        roofType: "gable",
        roofH: 3.2,
        floors: 1,
        lit: 1,
        shutters: false,
        chimney: false,
        windowW: 5,
        windowSpacing: 12,
        windowRatio: 0.52,
        glassColor: "#ffd08a",
      });
      // Deck with a railing, a table and chairs, and steps down to the path.
      const d0 = x0 + 3;
      const d1 = x1 - 12;
      const dy = y1 + 9;
      add(slab(rect(d0, y1, d1, dy), 0.7, 2.4, M.deck));
      for (let x = d0; x <= d1 + 0.01; x += (d1 - d0) / 6)
        add(box(x - 0.3, dy - 0.6, x + 0.3, dy, 2.4, 5.6, M.teak));
      add(box(d0, dy - 0.6, d1, dy, 5.4, 6, M.teak));
      for (const x of [d0, d1])
        add(box(x - 0.3, y1 + 0.4, x + 0.3, dy, 5.4, 6, M.teak));
      const tx = (d0 + d1) / 2 - 5;
      add(
        place(
          mesh(new THREE.CylinderGeometry(2, 2, 0.3, 12), M.white),
          tx,
          y1 + 4.4,
          5,
        ),
      );
      add(box(tx - 0.2, y1 + 4.2, tx + 0.2, y1 + 4.6, 2.4, 5, M.darkMetal));
      for (const dx of [-3.6, 3.6])
        add(
          box(
            tx + dx - 0.8,
            y1 + 3.6,
            tx + dx + 0.8,
            y1 + 5.2,
            2.4,
            4.4,
            M.teak,
          ),
        );
      add(box(d1, y1 + 2, d1 + 3, y1 + 6, 0.7, 1.6, M.deck));
      ground(d1 + 3, y1 + 2, x1 + 2, y1 + 6, gravel);
      const porch = new THREE.PointLight("#ffcf8f", 220, 36, 2);
      add(place(porch, (d0 + d1) / 2, y1 + 5, 8));
      world.staticLights.push(porch);
    };
    mobileHome(146, 194, "#e3e6dc");
    mobileHome(214, 262, "#ead9c0");
    ground(140, 139.5, DRIVE[0], 143.5, gravel);
    shrubRow(204, 112, 204, 138, 3, "#3f5a2e");

    // Reception: stucco under a clay roof, a canopy over the door, a forecourt
    // with flags, an information sign and the entrance barrier.
    {
      const x0 = 326;
      const x1 = 384;
      const y0 = 110;
      const y1 = 134;
      add(slab(rect(314, y1, 394, 150), 0, 0.85, M.promenade, { cast: false }));
      house({
        x0,
        y0,
        x1,
        y1,
        h: 15,
        wall: "#efe6d6",
        roofMaterial: M.roof("#a3503a"),
        roofType: "hip",
        roofH: 6.5,
        floors: 1,
        lit: 1,
        shutters: false,
        chimney: false,
        windowW: 5.2,
        windowSpacing: 11.5,
        windowRatio: 0.5,
        glassColor: "#ffd392",
      });
      const group = new THREE.Group();
      const door = (x0 + x1) / 2;
      group.add(
        box(
          door - 4.5,
          y1,
          door + 4.5,
          y1 + 0.5,
          1.6,
          10.6,
          litGlass("#ffe1a8", 2.2),
          {
            cast: false,
          },
        ),
      );
      for (const x of [door - 4.5, door, door + 4.5])
        group.add(
          box(x - 0.3, y1, x + 0.3, y1 + 0.6, 1.6, 10.6, M.frameDark, {
            cast: false,
          }),
        );
      group.add(box(door - 12, y1, door + 12, y1 + 8, 11.2, 12.2, M.frameDark));
      for (const x of [door - 11, door + 11])
        group.add(
          box(x - 0.4, y1 + 7, x + 0.4, y1 + 7.8, 0.85, 11.2, M.frameDark),
        );
      // Information sign by the drive.
      const sign = texture(
        canvas(64, (g, s) => {
          g.fillStyle = "#1f5f9f";
          g.fillRect(0, 0, s, s);
          g.fillStyle = "#ffffff";
          g.font = "bold 52px Georgia, serif";
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText("i", s / 2, s / 2 + 3);
        }),
      );
      const signMaterial = new THREE.MeshStandardMaterial({
        map: sign,
        emissive: "#ffffff",
        emissiveMap: sign,
        emissiveIntensity: 0.9,
        roughness: 0.5,
      });
      group.add(box(318.6, 146.6, 319.4, 147.4, 0.85, 9, M.darkMetal));
      group.add(box(315.5, 147.2, 322.5, 147.9, 9, 16, signMaterial));
      // Barrier across the drive.
      const red = new THREE.MeshStandardMaterial({
        color: "#c63b32",
        roughness: 0.5,
      });
      group.add(box(313, 141, 315.4, 143.4, 0.85, 6, M.white));
      group.add(box(DRIVE[0] + 1, 141.8, 313, 142.6, 4.6, 5.4, M.white));
      for (let x = DRIVE[0] + 3; x < 311; x += 6)
        group.add(box(x, 141.75, x + 3, 142.65, 4.55, 5.45, red));
      // Flags.
      for (const [i, color] of ["#1d4f8f", "#f3f2ee", "#2f8f55"].entries()) {
        const x = 378 + i * 6;
        group.add(
          place(
            mesh(new THREE.CylinderGeometry(0.22, 0.3, 30, 6), M.metal),
            x,
            147,
            15.8,
          ),
        );
        const flag = mesh(
          new THREE.PlaneGeometry(4.6, 6.5),
          new THREE.MeshStandardMaterial({
            color,
            side: THREE.DoubleSide,
            roughness: 0.8,
          }),
        );
        group.add(place(flag, x + 2.5, 147, 26.8));
      }
      add(group);
      occluder(group, "building");
      const light = new THREE.PointLight("#ffcf8f", 700, 70, 2);
      add(place(light, door, y1 + 9, 9));
      world.staticLights.push(light);
      for (const x of [door - 16, door + 16]) planter(x, y1 + 3.6, 8);
    }

    // Hedge along the pavement, open at the drive and the forecourt.
    shrubRow(4, 148, DRIVE[0] - 3, 148, 3.4, "#3f5a2e");
    shrubRow(396, 148, 596, 148, 3.4, "#3f5a2e");
    for (const x of [30, 94, 158, 222, 276, 324, 388, 452, 516, 574])
      campLamp(x, LANE[1] + 2);

    // Trees: a tall line along the back edge, one at the head of every hedge,
    // and a few between the front pitches.
    for (let x = 10; x < 596; x += rand(26, 36))
      foliageTree(x, rand(5, 11), {
        height: rand(38, 48),
        spread: rand(11, 14),
        kind: pick(["broad", "broad", "olive", "conifer"]),
      });
    for (let x = 76; x < 560; x += 64)
      foliageTree(x + rand(-2, 2), rand(28, 36), {
        height: rand(28, 36),
        spread: rand(8.5, 11),
        kind: pick(["broad", "broad", "olive"]),
        clumps: 22,
      });
    for (const [x, y] of [
      [12, 86],
      [588, 86],
      [10, 142],
      [130, 124],
      [274, 122],
      [404, 118],
      [590, 140],
      [72, 146],
      [520, 146],
    ])
      foliageTree(x + rand(-2, 2), y + rand(-2, 2), {
        height: rand(26, 34),
        spread: rand(8, 10.5),
        kind: pick(["broad", "broad", "olive"]),
        clumps: 22,
      });
  }
  random = outerRandom;

  // Street furniture on the pavement along the camp.
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

  // Promenade lamps, trees, benches and planters.
  for (let x = 30; x < 600; x += 68) lantern(x, 204);
  for (const x of [66, 202, 398, 534])
    foliageTree(x, 228, {
      height: rand(38, 46) * 0.72,
      spread: 7.5,
      clumps: 18,
      draws: 485,
    });
  for (const x of [100, 168, 434, 500]) {
    add(box(x - 5, 226, x + 5, 228.5, 3, 3.6, M.teak));
    add(box(x - 5, 228, x + 5, 228.6, 3.6, 6.2, M.teak));
    for (const dx of [-4, 4])
      add(box(x + dx - 0.4, 226.2, x + dx + 0.4, 228.4, 1, 3, M.darkMetal));
  }
  planter(236, 230, 12);
  planter(364, 230, 12);

  // Hotel, in the style of the city model: cream stucco
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
    foliageTree(x, y, { height: 36, spread: 9, kind: "conifer", draws: 11600 });

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

  // Parked cars, in the body styles and paints of the city model's traffic
  // (src/nexavia/showcase-room/traffic.js) plus an off-roader and a pickup.
  // Units as there, about 6.9 per metre, front towards +x: length, width,
  // plan shape, axles, wheel radius, sill/belt/roof heights, and where the
  // glasshouse starts and ends at the belt and at the roof.
  const CAR_SCALE = 0.58;
  const CARS = {
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
      spoiler: true,
    },
    // Boxy off-roader: upright glass, big wheels, a spare on the tailgate.
    jeep: {
      L: 29,
      W: 14,
      shape: { nose: 0.06, tail: 0.04, taper: 0.05 },
      axles: [-9.2, 9.4],
      wheel: 3.1,
      sill: 3.4,
      belt: 8,
      roof: 13.4,
      cabin: { belt: [-13.6, 4.4], roof: [-13.3, 3.2] },
      upright: true,
      spare: true,
    },
    van: {
      L: 34,
      W: 14.2,
      shape: { nose: 0.1, tail: 0.04, taper: 0.08 },
      axles: [-10.5, 10.5],
      wheel: 2.4,
      sill: 2.2,
      belt: 7,
      roof: 14.6,
      cabin: { belt: [-16.6, 10], roof: [-16.4, 5.6] },
      upright: true,
      panel: true,
    },
    pickup: {
      L: 35,
      W: 14,
      shape: { nose: 0.1, tail: 0.04, taper: 0.07 },
      axles: [-10.5, 10.6],
      wheel: 2.8,
      sill: 3,
      belt: 7.6,
      roof: 12.4,
      cabin: { belt: [-3.6, 6.6], roof: [-3.2, 3.2] },
      upright: true,
      bed: true,
    },
  };
  const carBodies = [
    ...["sedan", "sedan", "sedan", "hatch", "hatch", "hatch"],
    ...["estate", "estate", "suv", "suv", "suv", "jeep", "jeep"],
    ...["sports", "sports", "van", "pickup"],
  ];
  const carPaints = [
    "#d9d4c9",
    "#35465e",
    "#8f4038",
    "#9a9fa3",
    "#8d9295",
    "#2b2f33",
    "#2a2d30",
    "#6d7470",
    "#c3c3bd",
    "#f2f1ed",
    "#4b5a3f",
  ];
  const sportsPaints = ["#b3261e", "#b3261e", "#d0a21c", "#2f5a78", "#f2f1ed"];
  const carParts = {
    hub: new THREE.MeshStandardMaterial({
      color: "#b4b7b9",
      roughness: 0.35,
      metalness: 0.8,
    }),
    head: new THREE.MeshStandardMaterial({ color: "#f1ecdc", roughness: 0.2 }),
    tail: new THREE.MeshStandardMaterial({ color: "#8f1d1a", roughness: 0.3 }),
    trim: new THREE.MeshStandardMaterial({ color: "#1b1d1f", roughness: 0.6 }),
  };
  // Plan outline with a rounded, tapering nose and tail.
  const carOutline = (L, W, { nose, tail, taper }) => {
    const hl = L / 2;
    const hw = W / 2;
    const end = hw * (1 - taper);
    const n = L * nose;
    const t = L * tail;
    const shape = new THREE.Shape();
    shape.moveTo(-hl + t, -hw);
    shape.lineTo(hl - n, -hw);
    shape.bezierCurveTo(hl - n * 0.35, -hw, hl, -end, hl, 0);
    shape.bezierCurveTo(hl, end, hl - n * 0.35, hw, hl - n, hw);
    shape.lineTo(-hl + t, hw);
    shape.bezierCurveTo(-hl + t * 0.35, hw, -hl, end, -hl, 0);
    shape.bezierCurveTo(-hl, -end, -hl + t * 0.35, -hw, -hl + t, -hw);
    return shape;
  };
  // Glasshouse: a box that narrows from [rear, front, half width] at the
  // bottom to the same at the top.
  const frustum = (b, t, y0, y1) => {
    const v = [
      [b[0], y0, -b[2]],
      [b[1], y0, -b[2]],
      [b[1], y0, b[2]],
      [b[0], y0, b[2]],
      [t[0], y1, -t[2]],
      [t[1], y1, -t[2]],
      [t[1], y1, t[2]],
      [t[0], y1, t[2]],
    ];
    const position = [];
    for (const [a, c, d, e] of [
      [0, 4, 5, 1],
      [1, 5, 6, 2],
      [3, 2, 6, 7],
      [0, 3, 7, 4],
      [4, 7, 6, 5],
    ])
      for (const i of [a, c, d, a, d, e]) position.push(...v[i]);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(position, 3),
    );
    geometry.computeVertexNormals();
    return geometry;
  };
  function parkedCar(x, y, heading) {
    // Own sequence; the earlier, simpler cars took one draw from the board's.
    planting(x, y, 1, () => {
      const type = pick(carBodies);
      const spec = CARS[type];
      const { L, W, axles, wheel, sill, belt, roof, cabin } = spec;
      const paint = M.paint(pick(type === "sports" ? sportsPaints : carPaints));
      const group = new THREE.Group();
      const part = (geometry, material, px = 0, py = 0, pz = 0) => {
        const item = mesh(geometry, material);
        item.position.set(px, py, pz);
        group.add(item);
        return item;
      };
      // Wheels with bright hubs.
      const tyre = new THREE.CylinderGeometry(wheel, wheel, 2.2, 14);
      tyre.rotateX(Math.PI / 2);
      const hub = new THREE.CylinderGeometry(
        wheel * 0.55,
        wheel * 0.55,
        2.3,
        10,
      );
      hub.rotateX(Math.PI / 2);
      for (const ax of axles)
        for (const side of [-1, 1]) {
          part(tyre, M.tyre, ax, wheel, side * (W / 2 - 1.1));
          part(hub, carParts.hub, ax, wheel, side * (W / 2 - 1.08));
        }
      // Body from sill to belt, with softened edges.
      const bevel = 0.7;
      const body = new THREE.ExtrudeGeometry(carOutline(L, W, spec.shape), {
        depth: belt - sill - bevel * 2,
        bevelEnabled: true,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelOffset: -bevel,
        bevelSegments: 2,
        curveSegments: 6,
      });
      body.rotateX(-Math.PI / 2);
      part(body, paint, 0, sill + bevel, 0);
      // Lamps.
      const lampZ = (W / 2) * (1 - spec.shape.taper) * 0.72;
      for (const side of [-1, 1]) {
        part(
          new THREE.BoxGeometry(0.8, 1, 2.4),
          carParts.head,
          L / 2 - L * spec.shape.nose * 0.3,
          belt - 1.5,
          side * lampZ,
        );
        part(
          new THREE.BoxGeometry(0.8, 1, 2.4),
          carParts.tail,
          -L / 2 + L * spec.shape.tail * 0.3,
          belt - 1.4,
          side * lampZ,
        );
      }
      // Glasshouse and roof.
      const inset = spec.upright ? 1.1 : 1.9;
      const low = [cabin.belt[0], cabin.belt[1], W / 2 - 0.5];
      const high = [cabin.roof[0], cabin.roof[1], W / 2 - inset];
      part(
        frustum(low, high, belt - 0.2, roof - 0.5),
        spec.panel ? paint : M.glassDark,
      );
      if (spec.panel) {
        // Panel van: glass only around the driver.
        const k = (roof - 1.6 - belt) / (roof - belt);
        part(
          frustum(
            [cabin.belt[1] - 7.5, cabin.belt[1] + 0.1, W / 2 - 0.42],
            [
              cabin.belt[1] - 7.5,
              cabin.belt[1] + (cabin.roof[1] - cabin.belt[1]) * k + 0.1,
              W / 2 - 0.5 - (inset - 0.5) * k + 0.08,
            ],
            belt + 0.8,
            roof - 1.6,
          ),
          M.glassDark,
        );
      }
      part(
        new RoundedBoxGeometry(
          high[1] - high[0] + 0.5,
          0.8,
          high[2] * 2 + 0.4,
          2,
          0.35,
        ),
        paint,
        (high[0] + high[1]) / 2,
        roof - 0.4,
        0,
      );
      if (spec.rails)
        for (const side of [-1, 1])
          part(
            new THREE.BoxGeometry((high[1] - high[0]) * 0.8, 0.5, 0.5),
            carParts.trim,
            (high[0] + high[1]) / 2,
            roof + 0.3,
            side * (high[2] - 0.9),
          );
      if (spec.spoiler) {
        part(
          new THREE.BoxGeometry(1.6, 0.4, W - 2.4),
          paint,
          -L / 2 + 2.2,
          belt + 1.3,
          0,
        );
        for (const side of [-1, 1])
          part(
            new THREE.BoxGeometry(0.6, 1.2, 0.5),
            carParts.trim,
            -L / 2 + 2.2,
            belt + 0.6,
            side * (W / 2 - 2.6),
          );
      }
      if (spec.spare) {
        const spare = new THREE.CylinderGeometry(
          wheel * 0.9,
          wheel * 0.9,
          1.6,
          14,
        );
        spare.rotateZ(Math.PI / 2);
        part(spare, M.tyre, -L / 2 - 0.5, belt - 0.6, 0);
        // Bull bar.
        part(
          new THREE.BoxGeometry(0.7, 1.4, W - 3),
          carParts.trim,
          L / 2 + 0.2,
          sill + 1.2,
          0,
        );
      }
      if (spec.bed) {
        // Open load bed behind the cab.
        const x0 = -L / 2 + 1.4;
        const x1 = cabin.belt[0] - 0.6;
        part(
          new THREE.BoxGeometry(x1 - x0, 0.2, W - 2.6),
          carParts.trim,
          (x0 + x1) / 2,
          belt + 0.06,
          0,
        );
        for (const side of [-1, 1])
          part(
            new THREE.BoxGeometry(x1 - x0 + 1, 1.5, 0.8),
            paint,
            (x0 + x1) / 2,
            belt + 0.6,
            side * (W / 2 - 0.9),
          );
        part(
          new THREE.BoxGeometry(0.8, 1.5, W - 1.8),
          paint,
          x0 - 0.2,
          belt + 0.6,
          0,
        );
      }
      group.scale.setScalar(CAR_SCALE);
      add(place(group, x, y, 1.1, heading));
      occluder(group, "car");
    });
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
  // The campers' cars, from the camp's own sequence.
  {
    const board = random;
    random = rngOf(20260930);
    for (const [x, y, heading] of campCars)
      parkedCar(x, y, heading + rand(-0.05, 0.05));
    random = board;
  }

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
