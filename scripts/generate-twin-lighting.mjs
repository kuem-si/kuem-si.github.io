// Builds the "lights off" patches for the digital-twin maquette.
//
// The maquette photo is a dusk shot with every light already on, so the lit
// state is simply the photo. For each controllable device this script derives
// an unlit version of its area from the photo itself: warm emissive pixels
// (windows, lanterns) become dark glass, and the light they cast on nearby
// walls and paving is taken back out. The patches are layered over the photo
// in the same 1536 × 1024 coordinate space and faded in when a device is off.
//
// Usage: node scripts/generate-twin-lighting.mjs [--preview <dir>]

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SOURCE = "public/images/digital-twin-city-modular.png";
const OUT_DIR = "public/images/digital-twin/lights";

// Areas are in photo pixels, traced from the photo.
// - glass: window and door glazing, which goes dark.
// - sconces: small wall lights [x, y, radius], put out like lanterns.
// - glints: small lit details (door lights) that are dimmed where they glow.
// - spill: where light cast onto walls, canopies and paving is removed.
const DEVICES = {
  HOUSE_01: {
    box: [404, 104, 158, 124],
    glass: [
      [[496, 137], [504, 136], [504, 147], [496, 148]],
      [[425, 152], [437, 155], [437, 169], [425, 166]],
      [[453, 162], [466, 166], [466, 180], [453, 177]],
      [[424, 181], [439, 185], [439, 205], [424, 202]],
      [[454, 192], [468, 196], [468, 210], [454, 208]],
      [[489, 167], [500, 164], [500, 178], [489, 181]],
      [[516, 155], [528, 152], [528, 165], [516, 168]],
      [[489, 195], [500, 192], [500, 206], [489, 209]],
      [[506, 187], [518, 185], [518, 210], [506, 211]],
      [[518, 184], [531, 181], [531, 195], [518, 198]],
      [[538, 176], [552, 172], [552, 186], [538, 190]],
    ],
    sconces: [[444.5, 191, 2.5], [510, 190, 2.5]],
    glints: [],
    spill: [[[406, 140], [456, 112], [512, 124], [558, 150], [560, 226], [406, 226]]],
    spillSigma: 6,
    spillStrength: 0.42,
  },
  OFFICE_01: {
    box: [972, 144, 190, 90],
    glass: [
      [[980, 151], [1002, 151], [1002, 177], [980, 177]],
      [[980, 186], [1000, 186], [1000, 212], [980, 212]],
      [[1016, 155.5], [1119, 164.5], [1117.5, 188], [1015.5, 180]],
      [[1014, 188.5], [1116.5, 197], [1115, 227], [1013, 217]],
      [[1131, 202.5], [1154, 202.5], [1154, 228.5], [1131, 228.5]],
    ],
    sconces: [],
    glints: [],
    spill: [[[974, 146], [1162, 146], [1162, 232], [974, 232]]],
    spillSigma: 7,
    spillStrength: 0.4,
  },
  FACTORY_01: {
    box: [340, 424, 290, 124],
    glass: [
      [[368, 468], [412, 472], [412, 515], [368, 509.5]],
      [[430.5, 477], [474, 481], [474, 491], [430.5, 487.5]],
      [[492, 487], [537.5, 492.5], [537.5, 536], [492, 531]],
      [[565, 495], [580.5, 479.5], [580.5, 501], [565, 513]],
      [[598.5, 452.5], [611, 442], [611, 467.5], [598.5, 479]],
      [[580, 522], [597.5, 522], [597.5, 535], [580, 535]],
    ],
    sconces: [[353.75, 476.25, 3.6], [418.75, 483.5, 3], [481.5, 495.5, 3], [544, 504.5, 3], [567, 496, 2.5], [595, 465.5, 2.5], [598.5, 454.5, 2.5], [615.5, 439, 3]],
    glints: [[[431, 500], [474, 504], [474, 513], [431, 509]]],
    spill: [[[342, 440], [626, 426], [628, 546], [342, 546]]],
    spillSigma: 8,
    spillStrength: 0.45,
  },
  // Lamps: lantern centre, lantern radius, and the pool of light on the
  // ground as a perspective ellipse [cx, cy, rx, ry, strength].
  LAMP_01: { box: [612, 280, 72, 116], head: [646, 302, 6], pool: [648, 372, 30, 12, 0.26] },
  LAMP_02: { box: [986, 304, 70, 76], head: [1019, 325, 6], pool: [1020, 360, 30, 12, 0.28] },
  LAMP_03: { box: [668, 392, 84, 98], head: [703, 410, 6], pool: [712, 462, 34, 26, 0.32] },
  LAMP_04: { box: [1172, 504, 74, 100], head: [1208, 527, 6], pool: [1206, 582, 32, 13, 0.28] },
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v, a, b) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function inPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// Three box-blur passes approximate a Gaussian.
function blur(src, w, h, sigma) {
  if (sigma <= 0) return Float32Array.from(src);
  const r = Math.max(1, Math.round(Math.sqrt((12 * sigma * sigma) / 3 + 1) / 2));
  let a = Float32Array.from(src);
  let b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= w) continue;
          sum += a[y * w + xx];
          n++;
        }
        b[y * w + x] = sum / n;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let n = 0;
        for (let k = -r; k <= r; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= h) continue;
          sum += b[yy * w + x];
          n++;
        }
        a[y * w + x] = sum / n;
      }
    }
  }
  return a;
}

function regionMask(polys, box, feather) {
  const [bx, by, w, h] = box;
  const mask = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (polys.some((p) => inPolygon(bx + x + 0.5, by + y + 0.5, p)))
        mask[y * w + x] = 1;
  return feather ? blur(mask, w, h, feather) : mask;
}

function hsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, max ? d / max : 0, max / 255];
}

// How strongly a pixel reads as artificial warm light.
function emission(r, g, b) {
  const [h, s, v] = hsv(r, g, b);
  const warmHue = smooth(h, 12, 22) * (1 - smooth(h, 52, 64));
  const saturated = smooth(s, 0.36, 0.56) * smooth(v, 0.55, 0.8) * warmHue;
  const blown = smooth(v, 0.9, 0.98) * smooth(r - b, 4, 24);
  return Math.max(saturated, blown);
}

// A wall light's glow is filled in from the wall just above and below it,
// column by column, so vertical cladding and render texture carry through.
// A small unlit glass shade is left where the bulb was.
function inpaintSconces(px, w, h, device) {
  const [bx, by] = device.box;
  const src = Float32Array.from(px);
  const at = (x, y, c) => src[(Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))) * 3 + c];
  for (const [sx, sy, sr] of device.sconces) {
    const cx = sx - bx;
    const cy = sy - by;
    const halo = sr * 3.4;
    for (let x = Math.floor(cx - halo); x <= cx + halo; x++) {
      const dx = x + 0.5 - cx;
      const span = Math.sqrt(Math.max(0, halo * halo - dx * dx));
      const top = Math.floor(cy - span) - 1;
      const bottom = Math.ceil(cy + span) + 1;
      for (let y = top + 1; y < bottom; y++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        const t = (y - top) / (bottom - top);
        const d = Math.hypot(dx, y + 0.5 - cy);
        const fill = 1 - smooth(d, halo * 0.45, halo);
        const shade = 1 - smooth(d, sr * 0.3, sr * 0.75);
        for (let c = 0; c < 3; c++) {
          const wall = at(x, top, c) * (1 - t) + at(x, bottom, c) * t;
          const target = wall + (wall * 0.72 - wall) * shade;
          px[i * 3 + c] += (target - px[i * 3 + c]) * fill;
        }
      }
    }
  }
}

function building(data, width, device) {
  const [bx, by, w, h] = device.box;
  const glassRegion = regionMask(device.glass, device.box, 0.6);
  const glintRegion = regionMask(device.glints, device.box, 0.8);
  const spillRegion = regionMask(device.spill, device.box, 3);
  const n = w * h;
  const src = new Float32Array(n * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const o = ((by + y) * width + bx + x) * 3;
      src.set([data[o], data[o + 1], data[o + 2]], (y * w + x) * 3);
    }
  inpaintSconces(src, w, h, device);
  const out = new Float32Array(n * 3);
  const light = new Float32Array(n);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let [r, g, b] = [src[i * 3], src[i * 3 + 1], src[i * 3 + 2]];
      const e = emission(r, g, b);
      const grey = 0.3 * r + 0.59 * g + 0.11 * b;
      // Unlit glazing keeps the interior detail, far darker and cooler, as if
      // reflecting the dusk sky.
      const pane = glassRegion[i] * Math.max(0.85, e);
      const glass = [grey * 0.2 + 14, grey * 0.22 + 18, grey * 0.24 + 24];
      r += (glass[0] - r) * pane;
      g += (glass[1] - g) * pane;
      b += (glass[2] - b) * pane;
      const glow = e * glintRegion[i] * (1 - pane) * 0.7;
      r *= 1 - glow;
      g *= 1 - glow * 0.92;
      b *= 1 - glow * 0.8;
      out.set([r, g, b], i * 3);
      light[i] = Math.max(pane, glow);
    }
  // Take the warm cast light back off walls, canopies and paving.
  const cast = blur(light, w, h, device.spillSigma);
  let castMax = 0;
  for (let i = 0; i < n; i++) castMax = Math.max(castMax, cast[i]);
  for (let i = 0; i < n; i++) {
    const s = clamp((cast[i] / castMax) * 1.5) * device.spillStrength * spillRegion[i] * (1 - light[i]);
    out[i * 3] *= 1 - s * 0.56;
    out[i * 3 + 1] *= 1 - s * 0.5;
    out[i * 3 + 2] *= 1 - s * 0.44;
  }
  return out;
}

function lamp(data, width, device) {
  const [bx, by, w, h] = device.box;
  const [hx, hy, hr] = device.head;
  const [px, py, prx, pry, strength] = device.pool;
  const out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const gx = bx + x + 0.5;
      const gy = by + y + 0.5;
      const o = ((by + y) * width + bx + x) * 3;
      let [r, g, b] = [data[o], data[o + 1], data[o + 2]];
      const lum = (0.3 * r + 0.59 * g + 0.11 * b) / 255;
      // Lantern: bright glass becomes a dark, faintly reflective housing.
      // Lanterns are narrow and upright.
      const dh = Math.hypot((gx - hx) * 1.45, (gy - hy) * 1.05);
      const lantern = (1 - smooth(dh, hr * 0.45, hr * 1.05)) * smooth(lum, 0.28, 0.55);
      const housing = [44 + lum * 30, 47 + lum * 30, 49 + lum * 30];
      r += (housing[0] - r) * lantern;
      g += (housing[1] - g) * lantern;
      b += (housing[2] - b) * lantern;
      // Bloom around the lantern.
      const db = Math.hypot(gx - hx, gy - hy);
      const bloom = Math.exp(-(db * db) / (2 * (hr * 1.1) ** 2)) * 0.3 * (1 - lantern) * smooth(lum, 0.35, 0.7);
      // Pool of light on the ground, strongest under the lamp.
      const dp = Math.hypot((gx - px) / prx, (gy - py) / pry);
      const pool = Math.exp(-(dp * dp) * 1.6) * strength;
      const k = Math.max(bloom, pool);
      r *= 1 - k;
      g *= 1 - k * 0.92;
      b *= 1 - k * 0.8;
      out.set([r, g, b], i * 3);
    }
  return out;
}

async function main() {
  const previewIndex = process.argv.indexOf("--preview");
  const previewDir = previewIndex > 0 ? process.argv[previewIndex + 1] : null;
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await mkdir(OUT_DIR, { recursive: true });
  if (previewDir) await mkdir(previewDir, { recursive: true });
  const composite = previewDir ? Buffer.from(data) : null;

  for (const [id, device] of Object.entries(DEVICES)) {
    const [bx, by, w, h] = device.box;
    const target = device.head ? lamp(data, info.width, device) : building(data, info.width, device);
    // Alpha follows the size of the change and fades to zero at the patch
    // edge, so the patch disappears into the photo without a seam.
    const alpha = new Float32Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const o = ((by + y) * info.width + bx + x) * 3;
        const diff = Math.max(...[0, 1, 2].map((c) => Math.abs(target[i * 3 + c] - data[o + c])));
        const edge = Math.min(x, y, w - 1 - x, h - 1 - y);
        alpha[i] = clamp(diff / 5) * smooth(edge, 0, 4);
      }
    const soft = blur(alpha, w, h, 1).map((v, i) => Math.max(v, alpha[i]));
    const rgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      rgba[i * 4] = clamp(target[i * 3], 0, 255);
      rgba[i * 4 + 1] = clamp(target[i * 3 + 1], 0, 255);
      rgba[i * 4 + 2] = clamp(target[i * 3 + 2], 0, 255);
      rgba[i * 4 + 3] = Math.round(soft[i] * 255);
      if (composite) {
        const o = ((by + Math.floor(i / w)) * info.width + bx + (i % w)) * 3;
        for (let c = 0; c < 3; c++)
          composite[o + c] = Math.round(data[o + c] + (rgba[i * 4 + c] - data[o + c]) * soft[i]);
      }
    }
    const file = path.join(OUT_DIR, `${id.toLowerCase()}-off.webp`);
    const { size } = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
      .webp({ quality: 92, alphaQuality: 100, smartSubsample: true })
      .toFile(file);
    console.log(`${id}: ${file} ${w}×${h} at ${bx},${by} (${(size / 1024).toFixed(1)} kB)`);
  }

  if (previewDir) {
    await sharp(composite, { raw: { width: info.width, height: info.height, channels: 3 } })
      .png()
      .toFile(path.join(previewDir, "all-off.png"));
  }
}

main();
