// Renders the smart-marina maquette for the Nexavia showcase room.
//
// The model (scripts/marina/scene.js) is rendered with three.js in headless
// Microsoft Edge through Playwright, then composited with sharp into the city
// photo's studio backdrop. The camera is fitted to the city photo's board, so
// both maquettes share one geometry (scene pixels 1536 × 1024).
//
// Outputs in public/images/nexavia/showcase-room/marina/:
//   maquette.webp            every light on
//   water.webp               the water surface alone (alpha: where it shows),
//                            the source for the moving water
//   lights/<id>-off.webp     unlit patch per device (alpha where it changes)
//   lights/<id>-glint.webp   a pier light's reflection on the water
// and src/components/nexavia/showcase/marina-geometry.json: hotspots, sensor
// pins, and the traffic map (routes and occluders for cars, walkers, boats).
//
// Usage: node scripts/generate-marina-maquette.mjs [--preview]
// Needs Microsoft Edge and two tools the site itself does not use, installed
// once without saving: npm i --no-save three@0.170.0 playwright

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { ROUTES } from "./marina/routes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/images/nexavia/showcase-room/marina");
const GEOMETRY = path.join(
  ROOT,
  "src/components/nexavia/showcase/marina-geometry.json",
);
const CITY_PHOTO = path.join(
  ROOT,
  "public/images/nexavia/showcase-room/maquette.png",
);
// three/build/three.cjs → the package folder.
const THREE_DIR = path.resolve(
  path.dirname(createRequire(import.meta.url).resolve("three")),
  "..",
);
const preview = process.argv.includes("--preview");

// Rendered at 2× the scene size and reduced to 1.5× for the published image.
const SCENE = { width: 1536, height: 1024 };
const RENDER = { width: 3072, height: 2048 };
const OUTPUT = { width: 2304, height: 1536 };

const browser = await chromium.launch({
  channel: "msedge",
  args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on(
  "console",
  (message) =>
    message.type() === "error" && console.error("[page]", message.text()),
);
page.on("pageerror", (error) => console.error("[page]", error.message));
const types = { ".js": "text/javascript", ".html": "text/html" };
await page.route("http://marina.local/**", async (route) => {
  const url = new URL(route.request().url());
  let file;
  if (url.pathname === "/") {
    return route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><body style="margin:0;background:#000">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module">import * as S from "/marina/scene.js"; window.S = S; window.loaded = true;</script></body></html>`,
    });
  }
  if (url.pathname.startsWith("/three/"))
    file = path.join(THREE_DIR, url.pathname.slice(7));
  else if (url.pathname.startsWith("/marina/"))
    file = path.join(ROOT, "scripts/marina", url.pathname.slice(8));
  if (!file) return route.fulfill({ status: 404, body: "" });
  return route.fulfill({
    contentType: types[path.extname(file)] ?? "application/octet-stream",
    body: await readFile(file),
  });
});
await page.goto("http://marina.local/");
await page.waitForFunction(() => window.loaded, null, { timeout: 60000 });

// --- Set up the scene in the page ------------------------------------------
await page.evaluate(({ width, height }) => {
  const {
    THREE,
    buildScene,
    makeCamera,
    makeRenderer,
    light,
    makeComposer,
    setDevice,
    DEVICES,
  } = window.S;
  const { scene, world } = buildScene();
  const camera = makeCamera();
  camera.layers.enableAll();
  const renderer = makeRenderer(width, height);
  light(scene, renderer);
  const composer = makeComposer(renderer, scene, camera, width, height);
  const plain = makeComposer(renderer, scene, camera, width, height, {
    ao: false,
  });
  const snap = () => renderer.domElement.toDataURL("image/png");
  const all = (on) => DEVICES.forEach((id) => setDevice(world, id, on));
  const white = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    toneMapped: false,
  });
  const black = new THREE.MeshBasicMaterial({
    color: 0x000000,
    toneMapped: false,
  });
  window.ctx = {
    THREE,
    scene,
    world,
    camera,
    renderer,
    composer,
    plain,
    snap,
    all,
    setDevice,
    white,
    black,
  };
  window.passes = {
    beauty(off = []) {
      all(true);
      off.forEach((id) => setDevice(world, id, false));
      composer.render();
      return snap();
    },
    // Where the model covers the backdrop.
    coverage() {
      const background = scene.background;
      scene.background = new THREE.Color(0x000000);
      scene.overrideMaterial = white;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      scene.background = background;
      return snap();
    },
    // Where the water surface is visible.
    waterMask() {
      const swapped = [];
      scene.traverse((item) => {
        if (!item.isMesh) return;
        swapped.push([item, item.material]);
        item.material = item === world.water ? white : black;
      });
      const background = scene.background;
      scene.background = new THREE.Color(0x000000);
      renderer.render(scene, camera);
      scene.background = background;
      swapped.forEach(([item, material]) => (item.material = material));
      return snap();
    },
    // The water surface alone (with the reflections of everything else).
    water(on = []) {
      all(true);
      Object.keys(world.devices)
        .filter((id) => id.startsWith("PIER_") && !on.includes(id))
        .forEach((id) => setDevice(world, id, false));
      // Only the water on camera, but every light still shining on it (the
      // renderer filters lights by camera layer too).
      const lights = [];
      scene.traverse((item) => item.isLight && lights.push(item));
      lights.forEach((item) => item.layers.enable(1));
      world.water.layers.set(1);
      camera.layers.set(1);
      plain.render();
      camera.layers.enableAll();
      world.water.layers.set(0);
      lights.forEach((item) => item.layers.disable(1));
      return snap();
    },
  };
}, RENDER);

const png = async (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");
const pass = async (name, ...args) =>
  png(await page.evaluate(([n, a]) => window.passes[n](...a), [name, args]));
const toOutput = (buffer, kernel = "lanczos3") =>
  sharp(buffer).resize(OUTPUT.width, OUTPUT.height, { kernel });

// Studio backdrop from the city photo, with the city's trees above the board
// replaced by the clean backdrop either side of them.
async function backdrop() {
  const { data, info } = await sharp(CITY_PHOTO)
    .resize(OUTPUT.width, OUTPUT.height, { kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const k = OUTPUT.width / SCENE.width;
  const at = (x, y) => (y * info.width + x) * 3;
  const left = Math.round(300 * k);
  const right = Math.round(1262 * k);
  const bottom = Math.round(112 * k);
  for (let y = 0; y < bottom; y++) {
    const average = (x0) => {
      const sum = [0, 0, 0];
      for (let x = x0; x < x0 + 12; x++)
        for (let c = 0; c < 3; c++) sum[c] += data[at(x, y) + c];
      return sum.map((v) => v / 12);
    };
    const a = average(left - 12);
    const b = average(right);
    for (let x = left; x < right; x++) {
      const t = (x - left) / (right - left);
      for (let c = 0; c < 3; c++)
        data[at(x, y) + c] =
          a[c] + (b[c] - a[c]) * t + (Math.random() - 0.5) * 1.2;
    }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 3 },
  })
    .png()
    .toBuffer();
}

async function composite(beauty, coverage) {
  // Pulled in by about a pixel: the tilt-shift blurs the model's silhouette
  // into the render's light background, which would show as a pale fringe.
  // The backdrop's own maquette has the same outline underneath.
  const alpha = await toOutput(coverage)
    .extractChannel(0)
    .blur(1)
    .linear(2, -255)
    .raw()
    .toBuffer();
  const rgb = await toOutput(beauty).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(OUTPUT.width * OUTPUT.height * 4);
  for (let i = 0; i < OUTPUT.width * OUTPUT.height; i++) {
    rgba[i * 4] = rgb[i * 3];
    rgba[i * 4 + 1] = rgb[i * 3 + 1];
    rgba[i * 4 + 2] = rgb[i * 3 + 2];
    rgba[i * 4 + 3] = alpha[i];
  }
  const model = await sharp(rgba, {
    raw: { width: OUTPUT.width, height: OUTPUT.height, channels: 4 },
  })
    .png()
    .toBuffer();
  return sharp(await backdrop()).composite([{ input: model }]);
}

await mkdir(path.join(OUT, "lights"), { recursive: true });
const t0 = Date.now();
const beauty = await pass("beauty");
const coverage = await pass("coverage");
console.log(`beauty + coverage in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
const main = await composite(beauty, coverage);
if (preview) {
  await main.webp({ quality: 90 }).toFile(path.join(OUT, "preview.webp"));
  await browser.close();
  console.log("Preview written.");
  process.exit(0);
}
await main
  .clone()
  .webp({ quality: 86, smartSubsample: true })
  .toFile(path.join(OUT, "maquette.webp"));
const mainRaw = await main.clone().removeAlpha().raw().toBuffer();

// --- Water: source image and visibility mask ---------------------------------
const waterMask = await toOutput(await pass("waterMask"))
  .extractChannel(0)
  .raw()
  .toBuffer();
const waterRgb = await toOutput(await pass("water"))
  .removeAlpha()
  .raw()
  .toBuffer();
{
  const rgba = Buffer.alloc(OUTPUT.width * OUTPUT.height * 4);
  for (let i = 0; i < OUTPUT.width * OUTPUT.height; i++) {
    rgba.set(
      [waterRgb[i * 3], waterRgb[i * 3 + 1], waterRgb[i * 3 + 2], waterMask[i]],
      i * 4,
    );
  }
  await sharp(rgba, {
    raw: { width: OUTPUT.width, height: OUTPUT.height, channels: 4 },
  })
    .webp({ quality: 85, alphaQuality: 90 })
    .toFile(path.join(OUT, "water.webp"));
}

// --- Geometry from the page: projections, hulls, occluders ------------------
const scenePoint = (p) => [
  Math.round(p[0] * 10) / 10,
  Math.round(p[1] * 10) / 10,
];
const info = await page.evaluate(
  ({ routes }) => {
    const { THREE, scene, world, camera } = window.ctx;
    const { projector, SENSORS } = window.S;
    const project = projector(camera);
    const v = new THREE.Vector3();
    const hull = (points) => {
      const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cross = (o, a, b) =>
        (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
      const lower = [];
      for (const q of p) {
        while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), q) <= 0)
          lower.pop();
        lower.push(q);
      }
      const upper = [];
      for (const q of p.reverse()) {
        while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), q) <= 0)
          upper.pop();
        upper.push(q);
      }
      return [...lower.slice(0, -1), ...upper.slice(0, -1)];
    };
    // Screen outline of each mesh of an object (convex per mesh).
    const meshHulls = (object) => {
      const hulls = [];
      object.updateMatrixWorld(true);
      object.traverse((item) => {
        if (!item.isMesh) return;
        const position = item.geometry.attributes.position;
        const step = Math.max(1, Math.floor(position.count / 600));
        const points = [];
        for (let i = 0; i < position.count; i += step) {
          v.fromBufferAttribute(position, i)
            .applyMatrix4(item.matrixWorld)
            .project(camera);
          points.push([((v.x + 1) / 2) * 1536, ((1 - v.y) / 2) * 1024]);
        }
        if (points.length >= 3) hulls.push(hull(points));
      });
      return hulls;
    };
    const inside = ([x, y], poly) => {
      let hit = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
          hit = !hit;
      }
      return hit;
    };
    // Drop outlines wholly inside a bigger outline of the same object.
    const simplify = (hulls) => {
      const area = (p) =>
        Math.abs(
          p.reduce(
            (s, [x, y], i) =>
              s + x * p[(i + 1) % p.length][1] - p[(i + 1) % p.length][0] * y,
            0,
          ) / 2,
        );
      const sorted = hulls
        .filter((h) => area(h) > 1.5)
        .sort((a, b) => area(b) - area(a));
      const kept = [];
      for (const h of sorted)
        if (!kept.some((k) => h.every((p) => inside(p, k)))) kept.push(h);
      return kept;
    };
    const occluders = world.occluders.map(({ object, kind }, index) => {
      const box = new THREE.Box3().setFromObject(object);
      return {
        id: `${kind}${index}`,
        kind,
        front: box.max.z,
        back: box.min.z,
        polys: simplify(meshHulls(object)),
      };
    });
    const devices = {};
    for (const [id, device] of Object.entries(world.devices)) {
      const points = device.meshes.flatMap((object) =>
        meshHulls(object).flat(),
      );
      const outline = hull(points);
      const top = Math.min(...outline.map((p) => p[1]));
      const cx = outline.reduce((s, p) => s + p[0], 0) / outline.length;
      devices[id] = {
        shape: outline,
        anchor: [cx, top + (id.startsWith("PIER") ? 4 : 12)],
      };
    }
    const sensors = Object.fromEntries(
      Object.entries(SENSORS).map(([key, point]) => [key, project(point)]),
    );
    // Routes: world points to scene pixels, with world samples for occlusion.
    const lanes = {};
    for (const [name, route] of Object.entries(routes)) {
      lanes[name] = {
        points: route.points.map(([x, y, offset]) => [
          ...project([x, y, route.z]),
          offset,
        ]),
        samples: route.points.map(([x, y]) => ({
          world: [x, y],
          screen: project([x, y, route.z]),
          top: project([x, y, route.z + route.height]),
        })),
      };
    }
    return {
      occluders,
      devices,
      sensors,
      lanes,
      berths: world.berths,
      parking: world.parking,
    };
  },
  { routes: ROUTES },
);

// Occluders of a lane: outlines of objects in front of the lane that cover
// the space its traffic occupies on screen.
const pointInPolygon = ([x, y], poly) => {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      hit = !hit;
  }
  return hit;
};
const occluderPaths = {};
const routes = {};
for (const [name, route] of Object.entries(ROUTES)) {
  const lane = info.lanes[name];
  // Dense samples between waypoints.
  const samples = [];
  for (let i = 0; i < lane.samples.length - 1; i++) {
    const a = lane.samples[i];
    const b = lane.samples[i + 1];
    const n = Math.max(
      1,
      Math.ceil(
        Math.hypot(b.screen[0] - a.screen[0], b.screen[1] - a.screen[1]) / 6,
      ),
    );
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      const mix = (p, q) => [
        p[0] + (q[0] - p[0]) * t,
        p[1] + (q[1] - p[1]) * t,
      ];
      samples.push({
        world: mix(a.world, b.world),
        screen: mix(a.screen, b.screen),
        top: mix(a.top, b.top),
      });
    }
  }
  const used = new Set();
  for (const occluder of info.occluders) {
    const hits = occluder.polys.filter((poly) =>
      samples.some(({ world, screen, top }) => {
        // Only what stands nearer the camera than the traffic can hide it.
        if (occluder.back <= world[1] + 1.5) return false;
        for (let k = 0; k <= 4; k++) {
          const y = screen[1] + (top[1] - screen[1]) * (k / 4);
          for (const dx of [-route.halfWidth, 0, route.halfWidth])
            if (pointInPolygon([screen[0] + dx, y], poly)) return true;
        }
        return false;
      }),
    );
    hits.forEach((poly, i) => {
      const id = `${occluder.id}-${occluder.polys.indexOf(poly)}`;
      occluderPaths[id] = poly
        .map(
          ([x, y]) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`,
        )
        .join(" ");
      used.add(id);
    });
  }
  routes[name] = {
    mode: route.mode,
    points: lane.points.map(([x, y, offset]) =>
      offset === undefined
        ? scenePoint([x, y])
        : [...scenePoint([x, y]), offset],
    ),
    occluders: [...used],
    ...(route.stops ? { stops: route.stops } : {}),
    ...(route.fade ? { fade: route.fade } : {}),
  };
}

// --- Devices: unlit patches from the difference to the lit image -------------
const allOn = await toOutput(beauty).removeAlpha().raw().toBuffer();
const geometry = {
  photo: OUTPUT,
  berths: info.berths,
  parking: info.parking,
  devices: {},
  points: Object.fromEntries(
    Object.entries(info.sensors).map(([key, p]) => [key, p.map(Math.round)]),
  ),
  glints: {},
  traffic: { routes, occluders: occluderPaths },
};
const k = OUTPUT.width / SCENE.width;
for (const id of Object.keys(info.devices)) {
  const off = await toOutput(await pass("beauty", [id]))
    .removeAlpha()
    .raw()
    .toBuffer();
  // Changed pixels, feathered, and never over the water (it moves).
  const mask = Buffer.alloc(OUTPUT.width * OUTPUT.height);
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (let i = 0; i < mask.length; i++) {
    const d = Math.max(
      Math.abs(allOn[i * 3] - off[i * 3]),
      Math.abs(allOn[i * 3 + 1] - off[i * 3 + 1]),
      Math.abs(allOn[i * 3 + 2] - off[i * 3 + 2]),
    );
    if (d > 5) {
      mask[i] = 255;
      const x = i % OUTPUT.width;
      const y = Math.floor(i / OUTPUT.width);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  const pad = 6;
  x0 = Math.max(0, x0 - pad);
  y0 = Math.max(0, y0 - pad);
  x1 = Math.min(OUTPUT.width - 1, x1 + pad);
  y1 = Math.min(OUTPUT.height - 1, y1 + pad);
  const width = x1 - x0 + 1;
  const height = y1 - y0 + 1;
  const soft = await sharp(mask, {
    raw: { width: OUTPUT.width, height: OUTPUT.height, channels: 1 },
  })
    .extract({ left: x0, top: y0, width, height })
    .dilate(3)
    .blur(2)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const patch = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = (y0 + y) * OUTPUT.width + x0 + x;
      const j = y * width + x;
      patch.set(
        [
          off[i * 3],
          off[i * 3 + 1],
          off[i * 3 + 2],
          Math.round(soft[j] * (1 - waterMask[i] / 255)),
        ],
        j * 4,
      );
    }
  await sharp(patch, { raw: { width, height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 90 })
    .toFile(path.join(OUT, "lights", `${id.toLowerCase()}-off.webp`));
  const { shape, anchor } = info.devices[id];
  geometry.devices[id] = {
    off: [x0 / k, y0 / k, width / k, height / k].map(
      (v) => Math.round(v * 10) / 10,
    ),
    shape: `M${shape.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}Z`,
    anchor: anchor.map(Math.round),
  };
  console.log("device", id, geometry.devices[id].off);
}

// --- Pier light reflections on the water -------------------------------------
const waterOff = waterRgb;
for (const id of Object.keys(info.devices).filter((d) =>
  d.startsWith("PIER_"),
)) {
  const on = await toOutput(await pass("water", [id]))
    .removeAlpha()
    .raw()
    .toBuffer();
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  const diff = Buffer.alloc(OUTPUT.width * OUTPUT.height * 3);
  for (let i = 0; i < OUTPUT.width * OUTPUT.height; i++) {
    let m = 0;
    for (let c = 0; c < 3; c++) {
      const d =
        Math.max(0, on[i * 3 + c] - waterOff[i * 3 + c]) * (waterMask[i] / 255);
      diff[i * 3 + c] = d;
      m = Math.max(m, d);
    }
    if (m > 4) {
      const x = i % OUTPUT.width;
      const y = Math.floor(i / OUTPUT.width);
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  if (x0 === Infinity) continue;
  x0 = Math.max(0, x0 - 4);
  y0 = Math.max(0, y0 - 4);
  const width = Math.min(OUTPUT.width - x0, x1 - x0 + 9);
  const height = Math.min(OUTPUT.height - y0, y1 - y0 + 9);
  // Additive light as colour over alpha.
  const glint = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = ((y0 + y) * OUTPUT.width + x0 + x) * 3;
      const a = Math.max(diff[i], diff[i + 1], diff[i + 2]);
      const j = (y * width + x) * 4;
      if (a)
        glint.set(
          [
            (diff[i] / a) * 255,
            (diff[i + 1] / a) * 255,
            (diff[i + 2] / a) * 255,
            a,
          ],
          j,
        );
    }
  await sharp(glint, { raw: { width, height, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(path.join(OUT, "lights", `${id.toLowerCase()}-glint.webp`));
  geometry.glints[id] = [x0 / k, y0 / k, width / k, height / k].map(
    (v) => Math.round(v * 10) / 10,
  );
}

await writeFile(GEOMETRY, `${JSON.stringify(geometry, null, 1)}\n`);
await browser.close();
console.log(
  `Rendered the marina maquette in ${((Date.now() - t0) / 1000).toFixed(0)} s.`,
);
