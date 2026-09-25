// All coordinates match the 1536 × 1024 maquette image and SVG viewBox.
const routes = {
  bridge: {
    // Trees on the near bank obscure the right-hand approach to the bridge.
    occlusion: [{ x: 741, y: 547, rx: 29, ry: 56 }, { x: 827, y: 545, rx: 45, ry: 47 }],
  },
  central: {
    // The riverside tree hangs over the south lane of the middle road.
    occlusion: [{ x: 1047, y: 418, rx: 43, ry: 39 }],
  },
  westbound: {
    occlusion: [{ x: 366, y: 353, rx: 40, ry: 47 }],
  },
  residential: {
    occlusion: [{ x: 366, y: 353, rx: 40, ry: 47 }],
  },
};

// Speeds are maquette-image pixels per second, so differing route lengths do
// not accidentally make the riders look equally fast.
const cyclistSettings = [
  { route: "bridge", progress: 0.06, speed: 12, respawnDelay: 6 },
  { route: "central", progress: 0.32, speed: 19, respawnDelay: 9 },
  { route: "westbound", progress: 0.59, speed: 29, respawnDelay: 7 },
  { route: "residential", progress: 0.16, speed: 23, respawnDelay: 11 },
];

export function initCyclists(root) {
  const scene = root.querySelector("[data-city-art]");
  if (!scene) return;

  for (const [name, route] of Object.entries(routes)) {
    route.path = scene.querySelector(`[data-cyclist-route="${name}"]`);
    if (!route.path) return;
    route.length = route.path.getTotalLength();
  }
  const riders = cyclistSettings.map((settings, index) => ({
    ...settings,
    element: scene.querySelector(`[data-cyclist="${index}"]`),
    path: routes[settings.route].path,
    length: routes[settings.route].length,
    occlusion: routes[settings.route].occlusion,
  }));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = false;
  let frame = 0;
  let lastTime = 0;

  function draw() {
    for (const rider of riders) {
      if (rider.progress < 0 || rider.progress > 1) {
        rider.element.style.visibility = "hidden";
        continue;
      }
      const distance = rider.progress * rider.length;
      const point = rider.path.getPointAtLength(distance);
      let opacity = 1;
      for (const zone of rider.occlusion) {
        const dx = (point.x - zone.x) / zone.rx;
        const dy = (point.y - zone.y) / zone.ry;
        // Feather only the canopy fringe; the rider is fully hidden deeper in.
        const edge = Math.min(1, Math.max(0, (Math.hypot(dx, dy) - 0.72) / 0.38));
        opacity = Math.min(opacity, edge * edge * (3 - 2 * edge));
      }
      rider.element.style.visibility = opacity === 0 ? "hidden" : "visible";
      rider.element.style.opacity = String(opacity);
      const next = rider.path.getPointAtLength(Math.min(rider.length, distance + 2));
      const previous = distance + 2 > rider.length ? rider.path.getPointAtLength(distance - 2) : point;
      const angle = Math.atan2(next.y - previous.y, next.x - previous.x) * 180 / Math.PI;
      rider.element.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${angle})`);
    }
  }

  function tick(time) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    for (const rider of riders) {
      rider.progress += rider.speed * delta / rider.length;
      if (rider.progress > 1) rider.progress = -rider.speed * rider.respawnDelay / rider.length;
    }
    draw();
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
    if (motion.matches) {
      for (const rider of riders) rider.element.style.visibility = "hidden";
    }
  }

  draw();
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { rootMargin: "150px" }).observe(scene);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
}
