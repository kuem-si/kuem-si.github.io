// A playing fountain over the maquette photo: droplets leave the nozzle, rise
// in a central column and an outer crown, fall back under gravity and splash
// into the basin, spreading rings. Each droplet is drawn as a short streak
// (its path over the last instant, like a camera's motion blur), tinted by
// the basin's colour-changing lights (the same cycle as water.js).
//
// Droplets live on the board: a position on the ground plane around the
// nozzle plus a height. On screen the ground is foreshortened by `tilt`
// (basin ry / rx) and height rises straight up, in scene pixels.

const PHOTO = { width: 1536, height: 1024 };
const GRAVITY = 100;
const MAX = 900;
const BLUR = 0.035;

const random = (min, max) => min + Math.random() * (max - min);

export function initFountain(root, spec) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  if (!photo) return;
  const { nozzle, height, water, spread, basin } = spec;
  const [nx, ny] = nozzle;
  const tilt = basin.ry / basin.rx;
  const area = { x: nx - basin.rx - 8, y: ny - height - 10, width: 2 * (basin.rx + 8), height: height + 10 + basin.ry * 2 + 8 };
  const canvas = document.createElement("canvas");
  canvas.className = "city-water";
  canvas.setAttribute("aria-hidden", "true");
  (art.querySelector(".city-beacons") ?? art.querySelector(".city-traffic"))?.before(canvas);
  const context = canvas.getContext("2d");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scale = 1;

  // Launch speed for the column's apex; the jet breathes a little.
  const lift = Math.sqrt(2 * GRAVITY * height);
  const drops = [];
  const rings = [];
  let clock = 0;
  let owed = 0;

  function emit(t) {
    const crown = Math.random() < 0.5;
    const surge = 1 + 0.05 * Math.sin(t * 2.2) + 0.025 * Math.sin(t * 5.9);
    const angle = Math.random() * Math.PI * 2;
    // The column is nearly upright; the crown opens like an umbrella.
    const out = crown ? random(0.55, 1) * spread : random(0, 1) ** 2 * spread * 0.2;
    drops.push({
      x: 0,
      z: 0,
      h: 0,
      vx: Math.cos(angle) * out,
      vz: Math.sin(angle) * out,
      vh: lift * surge * (crown ? random(0.72, 0.9) : random(0.93, 1.02)),
      size: random(0.35, crown ? 0.7 : 0.85),
      glow: random(0.5, 1),
    });
  }

  function step(dt) {
    clock += dt;
    owed += dt * spec.rate;
    while (owed >= 1) {
      owed -= 1;
      if (drops.length < MAX) emit(clock);
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const drop = drops[i];
      drop.vh -= GRAVITY * dt;
      drop.x += drop.vx * dt;
      drop.z += drop.vz * dt;
      drop.h += drop.vh * dt;
      if (drop.h > water) continue;
      // Into the basin: a few drops make rings, a few bounce up as spray.
      drops.splice(i, 1);
      if (drop.bounced) continue;
      if (Math.random() < 0.12 && rings.length < 60) rings.push({ x: drop.x, z: drop.z, age: 0, size: random(2.5, 5) });
      if (Math.random() < 0.2 && drops.length < MAX)
        drops.push({ x: drop.x, z: drop.z, h: water, vx: random(-4, 4), vz: random(-4, 4), vh: random(6, 16), size: 0.25, glow: 0.5, bounced: true });
    }
    for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].age += dt) > 0.8) rings.splice(i, 1);
  }

  // Scene pixels of a point on or above the board around the nozzle.
  const sx = (x) => (nx + x - area.x) * scale;
  const sy = (z, h) => (ny + z * tilt - h - area.y) * scale;

  function draw(time) {
    const t = time / 1000;
    const hue = (40 + t * 6) % 360;
    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.globalCompositeOperation = "lighter";

    // Mist hanging around the column.
    const mist = context.createRadialGradient(sx(0), sy(0, height * 0.55), 0, sx(0), sy(0, height * 0.55), height * 0.9 * scale);
    mist.addColorStop(0, `hsl(${hue} 60% 75% / ${0.16 + 0.04 * Math.sin(t * 1.7)})`);
    mist.addColorStop(1, `hsl(${hue} 60% 70% / 0)`);
    context.fillStyle = mist;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Rings where drops fall in.
    context.lineWidth = 0.3 * scale;
    for (const ring of rings) {
      const u = ring.age / 0.8;
      context.strokeStyle = `hsl(${hue} 50% 85% / ${0.45 * (1 - u)})`;
      context.beginPath();
      const r = ring.size * (0.2 + u);
      context.ellipse(sx(ring.x), sy(ring.z, water), r * scale, r * tilt * scale, 0, 0, Math.PI * 2);
      context.stroke();
    }

    // Droplets as streaks along their motion: brighter and whiter in the
    // dense column, tinted where they thin out.
    context.lineCap = "round";
    for (const drop of drops) {
      const x0 = drop.x - drop.vx * BLUR;
      const z0 = drop.z - drop.vz * BLUR;
      const h0 = drop.h - (drop.vh + 0.5 * GRAVITY * BLUR) * BLUR;
      context.strokeStyle = `hsl(${hue} ${drop.bounced ? 30 : 55}% ${80 + 15 * drop.glow}% / ${0.35 + 0.4 * drop.glow})`;
      context.lineWidth = drop.size * scale;
      context.beginPath();
      context.moveTo(sx(x0), sy(z0, h0));
      context.lineTo(sx(drop.x), sy(drop.z, drop.h));
      context.stroke();
    }

    // The hot core where the jet leaves the nozzle.
    const core = context.createLinearGradient(0, sy(0, 0), 0, sy(0, height * 0.7));
    core.addColorStop(0, `hsl(${hue} 40% 95% / 0.45)`);
    core.addColorStop(1, `hsl(${hue} 60% 85% / 0)`);
    context.strokeStyle = core;
    context.lineWidth = 0.9 * scale;
    context.beginPath();
    context.moveTo(sx(0), sy(0, 0));
    context.lineTo(sx(0), sy(0, height * 0.7));
    context.stroke();
  }

  // Follows the photo's object-fit, as the water does.
  function layout() {
    const width = art.clientWidth;
    const heightPx = art.clientHeight;
    if (!width || !heightPx) return;
    const fit = getComputedStyle(photo).objectFit === "cover" ? Math.max : Math.min;
    const photoScale = fit(width / PHOTO.width, heightPx / PHOTO.height);
    const left = (width - PHOTO.width * photoScale) / 2;
    const top = (heightPx - PHOTO.height * photoScale) / 2;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    Object.assign(canvas.style, {
      left: `${left + area.x * photoScale}px`,
      top: `${top + area.y * photoScale}px`,
      width: `${area.width * photoScale}px`,
      height: `${area.height * photoScale}px`,
    });
    canvas.width = Math.round(area.width * photoScale * ratio);
    canvas.height = Math.round(area.height * photoScale * ratio);
    scale = canvas.width / area.width;
    draw(performance.now());
  }

  let inView = false;
  let frame = 0;
  let last = 0;
  function tick(time) {
    step(Math.min(0.05, (time - last) / 1000));
    last = time;
    draw(time);
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const run = inView && !document.hidden && !motion.matches;
    if (run && !frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  // Start already playing (and as a still under reduced motion).
  for (let i = 0; i < 120; i++) step(1 / 60);
  layout();
  new ResizeObserver(layout).observe(art);
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      sync();
    },
    { rootMargin: "200px" },
  ).observe(art);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
}
