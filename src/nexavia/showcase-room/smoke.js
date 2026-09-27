// Smoke from the factory chimney on the maquette photo. Puffs are emitted at a
// wandering rate with the odd denser burst, drift on a slowly gusting wind,
// rise fast out of the stack and slow as they cool, then spread and thin out.
// Geometry is in photo pixels (1536 × 1024).

const PHOTO = { width: 1536, height: 1024 };
// Mouth of the chimney and the area the plume may occupy.
const MOUTH = { x: 307.5, y: 351, radius: 7 };
const AREA = { x: 200, y: 150, width: 380, height: 218 };
const FPS = 30;
const MAX_PUFFS = 90;

// Smooth random value: a slow random walk between targets.
function wander(min, max, speed) {
  let value = min + Math.random() * (max - min);
  let target = value;
  return (dt) => {
    if (Math.abs(target - value) < (max - min) * 0.02) target = min + Math.random() * (max - min);
    value += (target - value) * Math.min(1, dt * speed);
    return value;
  };
}

// Soft, lumpy puff textures, each built from a cluster of blurred blobs so no
// two puffs share an outline.
function makeSprites(count, tone) {
  return Array.from({ length: count }, () => {
    const size = 64;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = size;
    const context = sprite.getContext("2d");
    for (let i = 0; i < 7; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * size * 0.2;
      const x = size / 2 + Math.cos(angle) * distance;
      const y = size / 2 + Math.sin(angle) * distance;
      const radius = size * (0.14 + Math.random() * 0.16);
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${tone}, ${0.3 + Math.random() * 0.18})`);
      gradient.addColorStop(0.55, `rgba(${tone}, ${0.12 + Math.random() * 0.06})`);
      gradient.addColorStop(1, `rgba(${tone}, 0)`);
      context.fillStyle = gradient;
      context.fillRect(0, 0, size, size);
    }
    return sprite;
  });
}

export function initSmoke(root) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  if (!art || !photo) return;

  const canvas = document.createElement("canvas");
  canvas.className = "city-smoke";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    left: `${(AREA.x / PHOTO.width) * 100}%`,
    top: `${(AREA.y / PHOTO.height) * 100}%`,
    width: `${(AREA.width / PHOTO.width) * 100}%`,
    height: `${(AREA.height / PHOTO.height) * 100}%`,
  });
  photo.after(canvas);
  const context = canvas.getContext("2d");
  // Warm where the lit factory catches it, cool blue-grey higher in the dusk.
  const warm = makeSprites(6, "226, 214, 198");
  const cool = makeSprites(6, "150, 160, 170");

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const rate = wander(4, 9, 0.25);
  const wind = wander(10, 34, 0.12);
  const lift = wander(0.85, 1.2, 0.3);
  let burst = 0;
  let nextBurst = 4 + Math.random() * 8;
  let spawnDebt = 0;
  let clock = 0;
  const puffs = [];

  function spawn(heavy) {
    if (puffs.length >= MAX_PUFFS) return;
    puffs.push({
      x: MOUTH.x + (Math.random() - 0.5) * MOUTH.radius,
      y: MOUTH.y - Math.random() * 2,
      rise: (26 + Math.random() * 14) * (heavy ? 1.2 : 1),
      radius: 3.5 + Math.random() * 2.5,
      growth: 13 + Math.random() * 9,
      life: 3 + Math.random() * 2.6,
      age: 0,
      alpha: (heavy ? 0.8 : 0.52) + Math.random() * 0.25,
      sprite: Math.floor(Math.random() * warm.length),
      spin: (Math.random() - 0.5) * 0.5,
      angle: Math.random() * Math.PI * 2,
      seed: Math.random() * 100,
    });
  }

  function step(dt) {
    clock += dt;
    const breeze = wind(dt);
    const buoyancy = lift(dt);
    nextBurst -= dt;
    if (nextBurst <= 0) {
      burst = 0.8 + Math.random() * 1.4;
      nextBurst = 6 + Math.random() * 10;
    }
    const heavy = burst > 0;
    if (heavy) burst -= dt;
    spawnDebt += dt * rate(dt) * (heavy ? 2.2 : 1);
    while (spawnDebt >= 1) {
      spawn(heavy);
      spawnDebt -= 1;
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const puff = puffs[i];
      puff.age += dt;
      const t = puff.age / puff.life;
      if (t >= 1) {
        puffs.splice(i, 1);
        continue;
      }
      // Hot smoke leaves the stack fast and slows as it cools; the wind
      // takes over once it is clear of the chimney.
      const turbulence = Math.sin(clock * 1.3 + puff.seed) * 3 + Math.sin(clock * 0.47 + puff.seed * 2) * 2;
      puff.y -= puff.rise * buoyancy * (1 - t * 0.8) * dt;
      puff.x += (breeze * Math.min(1, t * 3) + turbulence) * dt;
      puff.radius += puff.growth * (1 - t * 0.5) * dt;
      puff.angle += puff.spin * dt;
    }
  }

  let scale = 1;
  function layout() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(canvas.clientWidth * ratio);
    const height = Math.round(canvas.clientHeight * ratio);
    if (!width || !height) return;
    canvas.width = width;
    canvas.height = height;
    scale = width / AREA.width;
  }

  function draw() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (const puff of puffs) {
      const t = puff.age / puff.life;
      // Quick fade in, long fade out.
      const alpha = puff.alpha * Math.min(1, puff.age / 0.35) * (1 - t) ** 1.6;
      if (alpha <= 0.01) continue;
      const size = puff.radius * 2.6 * scale;
      const x = (puff.x - AREA.x) * scale;
      const y = (puff.y - AREA.y) * scale;
      context.setTransform(Math.cos(puff.angle), Math.sin(puff.angle), -Math.sin(puff.angle), Math.cos(puff.angle), x, y);
      const warmth = Math.max(0, 1 - t * 1.8);
      context.globalAlpha = alpha * warmth;
      if (warmth > 0) context.drawImage(warm[puff.sprite], -size / 2, -size / 2, size, size);
      context.globalAlpha = alpha * (1 - warmth);
      context.drawImage(cool[puff.sprite], -size / 2, -size / 2, size, size);
    }
    context.globalAlpha = 1;
  }

  // Establish the plume before anyone sees it.
  for (let i = 0; i < 7 * FPS; i++) step(1 / FPS);

  let frame = 0;
  let last = 0;
  let inView = false;
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if (time - last < 1000 / FPS - 2) return;
    step(Math.min(0.1, last ? (time - last) / 1000 : 1 / FPS));
    last = time;
    draw();
  }
  function sync() {
    const run = inView && !document.hidden && !motion.matches;
    if (run && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    // Reduced motion keeps a still plume.
    if (!run) draw();
  }

  new ResizeObserver(() => {
    layout();
    draw();
  }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }, { rootMargin: "200px" }).observe(art);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
}
