// Routes, sprites and occlusion all use the maquette's 1536 × 1024 coordinates.
const routes = {
  bridge: { occlusion: [{ x: 741, y: 547, rx: 29, ry: 56 }, { x: 827, y: 545, rx: 45, ry: 47 }] },
  central: { vehicleInset: 0, occlusion: [{ x: 1047, y: 418, rx: 43, ry: 39 }], crossesJunction: true },
  westbound: { vehicleInset: -9, occlusion: [{ x: 366, y: 353, rx: 40, ry: 47 }], crossesJunction: true },
  residential: { vehicleInset: 7, occlusion: [{ x: 366, y: 353, rx: 40, ry: 47 }], crossesJunction: true },
};

// Speeds are image pixels per second. Cars remain faster than every cyclist.
const trafficSettings = [
  { type: "cyclist", route: "bridge", progress: 0.06, cruiseSpeed: 12, respawnDelay: 6, visualIndex: 0 },
  { type: "cyclist", route: "central", progress: 0.25, cruiseSpeed: 19, respawnDelay: 9, visualIndex: 1 },
  { type: "cyclist", route: "westbound", progress: 0.46, cruiseSpeed: 29, respawnDelay: 7, visualIndex: 2 },
  { type: "cyclist", route: "residential", progress: 0.18, cruiseSpeed: 23, respawnDelay: 11, visualIndex: 3 },
  { type: "vehicle", route: "central", progress: 0.16, cruiseSpeed: 65, respawnDelay: 8, visualIndex: 0, halfLength: 22, mayOvertake: true },
  { type: "vehicle", route: "bridge", progress: -0.03, cruiseSpeed: 49, respawnDelay: 8, visualIndex: 1, halfLength: 20 },
  { type: "vehicle", route: "residential", progress: 0.06, cruiseSpeed: 46, respawnDelay: 9, visualIndex: 2, halfLength: 22 },
  { type: "vehicle", route: "westbound", progress: 0.09, cruiseSpeed: 56, respawnDelay: 10, visualIndex: 3, halfLength: 19 },
  { type: "vehicle", route: "westbound", progress: 0.72, cruiseSpeed: 38, respawnDelay: 12, visualIndex: 4, halfLength: 32 },
  { type: "vehicle", route: "bridge", progress: 0.58, cruiseSpeed: 42, respawnDelay: 11, visualIndex: 5, halfLength: 31 },
];

const inJunction = (point) => point.x >= 710 && point.x <= 805 && point.y >= 325 && point.y <= 397;

export function initTraffic(root) {
  const scene = root.querySelector("[data-city-art]");
  if (!scene) return;

  for (const [name, route] of Object.entries(routes)) {
    route.path = scene.querySelector(`[data-cyclist-route="${name}"]`);
    if (!route.path) return;
    route.length = route.path.getTotalLength();
    route.vehiclePath = scene.querySelector(`[data-vehicle-route="${name}"]`);
    if (route.vehiclePath) route.vehicleLength = route.vehiclePath.getTotalLength();
    if (route.crossesJunction) {
      // Locate the crossing on the actual path, rather than guessing timing.
      for (let distance = 0; distance <= route.length; distance += 3) {
        if (inJunction(route.path.getPointAtLength(distance))) {
          route.entry ??= distance;
          route.exit = distance;
        }
      }
    }
  }

  const traffic = trafficSettings.map((settings) => {
    const route = routes[settings.route];
    return {
      ...settings,
      route,
      distance: settings.progress * route.length,
      currentSpeed: settings.cruiseSpeed,
      halfLength: settings.halfLength ?? 8,
      element: scene.querySelector(`[data-${settings.type}="${settings.visualIndex}"]`),
    };
  });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let junctionOwner = null;
  let inView = false;
  let frame = 0;
  let lastTime = 0;

  function draw() {
    for (const vehicle of traffic) {
      if (vehicle.distance < 0 || vehicle.distance > vehicle.route.length) {
        vehicle.element.style.visibility = "hidden";
        continue;
      }
      const path = vehicle.type === "vehicle" && vehicle.route.vehiclePath ? vehicle.route.vehiclePath : vehicle.route.path;
      const length = path === vehicle.route.path ? vehicle.route.length : vehicle.route.vehicleLength;
      const distance = vehicle.distance / vehicle.route.length * length;
      const point = path.getPointAtLength(distance);
      const next = path.getPointAtLength(Math.min(length, distance + 2));
      const previous = distance + 2 > length
        ? path.getPointAtLength(Math.max(0, distance - 2)) : point;
      const dx = next.x - previous.x;
      const dy = next.y - previous.y;
      const tangentLength = Math.hypot(dx, dy) || 1;
      // The cyclist path hugs the right edge. Cars sit farther into that lane.
      let inset = vehicle.type === "vehicle" ? vehicle.route.vehicleInset ?? 0 : 0;
      if (vehicle.overtakeStart !== undefined) {
        const entered = Math.min(1, Math.max(0, (vehicle.distance - vehicle.overtakeStart) / 38));
        const exited = vehicle.overtakeExit === undefined ? 1 : 1 - Math.min(1, Math.max(0, (vehicle.distance - vehicle.overtakeExit) / 42));
        const blend = Math.min(entered, exited);
        inset += 29 * blend * blend * (3 - 2 * blend);
      }
      const x = point.x + dy / tangentLength * inset;
      const y = point.y - dx / tangentLength * inset;
      let opacity = 1;
      const alongX = Math.abs(dx / tangentLength);
      const alongY = Math.abs(dy / tangentLength);
      const halfWidth = vehicle.type === "vehicle" ? (vehicle.visualIndex >= 4 ? 17 : 15) : 5;
      for (const zone of vehicle.route.occlusion) {
        // Expand the canopy by the complete sprite footprint, including buses and trucks.
        const zoneX = (x - zone.x) / (zone.rx + alongX * vehicle.halfLength + alongY * halfWidth);
        const zoneY = (y - zone.y) / (zone.ry + alongY * vehicle.halfLength + alongX * halfWidth);
        // A short canopy fringe softens the transition; the core fully hides it.
        const edge = Math.min(1, Math.max(0, (Math.hypot(zoneX, zoneY) - 0.72) / 0.38));
        opacity = Math.min(opacity, edge * edge * (3 - 2 * edge));
      }
      vehicle.element.style.visibility = opacity === 0 ? "hidden" : "visible";
      vehicle.element.style.opacity = String(opacity);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      vehicle.element.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
    }
  }

  function reserveJunction() {
    if (junctionOwner && (junctionOwner.distance > junctionOwner.route.exit + junctionOwner.halfLength || junctionOwner.distance < junctionOwner.route.entry - 50)) {
      junctionOwner = null;
    }
    if (junctionOwner) return;
    let nearest = Infinity;
    for (const vehicle of traffic) {
      const entry = vehicle.route.entry;
      if (entry === undefined) continue;
      const remaining = entry - vehicle.distance;
      if (remaining <= 45 && vehicle.distance <= vehicle.route.exit + vehicle.halfLength && remaining < nearest) {
        nearest = remaining;
        junctionOwner = vehicle;
      }
    }
  }

  function opposingLaneClear(x) {
    for (const other of traffic) {
      if (other.route !== routes.westbound || other.distance < 0 || other.distance > other.route.length) continue;
      const point = other.route.path.getPointAtLength(other.distance);
      const approachingX = point.x - other.cruiseSpeed * 5;
      if (point.x > x - 90 && approachingX < x + 275) return false;
    }
    return true;
  }

  function tick(time) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    reserveJunction();
    for (const vehicle of traffic) {
      if (vehicle.mayOvertake && !vehicle.overtakeUsed) {
        const point = vehicle.route.path.getPointAtLength(Math.max(0, Math.min(vehicle.route.length, vehicle.distance)));
        const cyclist = traffic[1];
        const gap = cyclist.distance - vehicle.distance;
        if (point.x >= 815 && point.x <= 1030 && gap >= 38 && gap <= 85 && opposingLaneClear(point.x)) {
          vehicle.overtakeStart = vehicle.distance;
          vehicle.overtakeTarget = cyclist;
          vehicle.overtakeUsed = true;
        }
      }
      let targetSpeed = vehicle.cruiseSpeed;
      let maxTravel = Infinity;
      for (const ahead of traffic) {
        if (ahead === vehicle || ahead.route !== vehicle.route || ahead === vehicle.overtakeTarget) continue;
        const gap = ahead.distance - vehicle.distance;
        if (gap <= 0) continue;
        const safeGap = vehicle.halfLength + ahead.halfLength + 8;
        targetSpeed = Math.min(targetSpeed, ahead.currentSpeed + Math.max(0, gap - safeGap) * 0.5);
        maxTravel = Math.min(maxTravel, Math.max(0, gap - safeGap + ahead.currentSpeed * delta));
      }
      const entry = vehicle.route.entry;
      if (entry !== undefined && vehicle !== junctionOwner && vehicle.distance < entry) {
        const remaining = entry - 17 - vehicle.distance;
        targetSpeed = Math.min(targetSpeed, Math.sqrt(110 * Math.max(0, remaining)));
        maxTravel = Math.min(maxTravel, Math.max(0, remaining));
      }
      const response = targetSpeed < vehicle.currentSpeed ? 5 : 1.3;
      vehicle.currentSpeed += (targetSpeed - vehicle.currentSpeed) * (1 - Math.exp(-response * delta));
      vehicle.distance += Math.min(vehicle.currentSpeed * delta, maxTravel);
      if (vehicle.overtakeTarget && vehicle.overtakeExit === undefined && vehicle.distance - vehicle.overtakeTarget.distance > vehicle.halfLength + vehicle.overtakeTarget.halfLength + 20) {
        vehicle.overtakeExit = vehicle.distance;
      }
      if (vehicle.overtakeExit !== undefined && vehicle.distance - vehicle.overtakeExit >= 42) {
        vehicle.overtakeStart = undefined;
        vehicle.overtakeExit = undefined;
        vehicle.overtakeTarget = undefined;
      }
      if (vehicle.distance > vehicle.route.length) {
        vehicle.distance = -vehicle.cruiseSpeed * vehicle.respawnDelay;
        vehicle.currentSpeed = vehicle.cruiseSpeed;
        vehicle.overtakeStart = undefined;
        vehicle.overtakeExit = undefined;
        vehicle.overtakeTarget = undefined;
        vehicle.overtakeUsed = false;
      }
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
      for (const vehicle of traffic) vehicle.element.style.visibility = "hidden";
    }
  }

  draw();
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { rootMargin: "150px" }).observe(scene);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
}
