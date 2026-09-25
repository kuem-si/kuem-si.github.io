// Geometry and speeds use the photograph's 1536 × 1024 SVG viewBox.
const routes = {
  bridge: {
    occlusion: [
      { x: 741, y: 552, rx: 30, ry: 48 },
      { x: 827, y: 545, rx: 43, ry: 41 },
    ],
    bend: [0.16, 0.35],
  },
  central: {
    occlusion: [{ x: 1047, y: 418, rx: 38, ry: 33 }],
    bend: [0.39, 0.61],
    crossesJunction: true,
    countsCyclists: true,
  },
  westbound: {
    vehicleInset: 5,
    occlusion: [{ x: 366, y: 340, rx: 37, ry: 40 }],
    crossesJunction: true,
  },
  residential: {
    vehicleInset: 7,
    occlusion: [{ x: 366, y: 340, rx: 37, ry: 40 }],
    bend: [0.7, 0.9],
    crossesJunction: true,
  },
};

// Fixed offsets keep the scene repeatable without synchronized arrivals.
const trafficSettings = [
  {
    type: "cyclist",
    route: "bridge",
    progress: 0.1,
    cruiseSpeed: 18,
    respawnDelay: 8.3,
    phase: 0.4,
    visualIndex: 0,
  },
  {
    type: "cyclist",
    route: "central",
    progress: 0.24,
    cruiseSpeed: 21,
    respawnDelay: 11.7,
    phase: 2.1,
    visualIndex: 1,
  },
  {
    type: "cyclist",
    route: "westbound",
    entryDelay: 7.8,
    cruiseSpeed: 25,
    respawnDelay: 9.1,
    phase: 4.2,
    visualIndex: 2,
  },
  {
    type: "cyclist",
    route: "residential",
    progress: 0.32,
    cruiseSpeed: 23,
    respawnDelay: 13.4,
    phase: 1.3,
    visualIndex: 3,
  },
  {
    type: "cyclist",
    route: "central",
    progress: 0.48,
    cruiseSpeed: 20,
    respawnDelay: 14.6,
    phase: 3.8,
    visualIndex: 4,
  },
  {
    type: "vehicle",
    route: "central",
    progress: 0.39,
    cruiseSpeed: 57,
    respawnDelay: 8.4,
    phase: 3.2,
    visualIndex: 0,
    halfLength: 18,
    mayOvertake: true,
  },
  {
    type: "vehicle",
    route: "bridge",
    entryDelay: 3.1,
    cruiseSpeed: 51,
    respawnDelay: 10.8,
    phase: 1.7,
    visualIndex: 1,
    halfLength: 17,
  },
  {
    type: "vehicle",
    route: "residential",
    progress: 0.07,
    cruiseSpeed: 47,
    respawnDelay: 12.2,
    phase: 5.3,
    visualIndex: 2,
    halfLength: 18,
  },
  {
    type: "vehicle",
    route: "westbound",
    entryDelay: 6.8,
    cruiseSpeed: 54,
    respawnDelay: 9.8,
    phase: 2.8,
    visualIndex: 3,
    halfLength: 16,
  },
  {
    type: "vehicle",
    route: "westbound",
    entryDelay: 12.7,
    cruiseSpeed: 44,
    respawnDelay: 15.3,
    phase: 0.9,
    visualIndex: 4,
    halfLength: 25,
  },
  {
    type: "vehicle",
    route: "bridge",
    progress: 0.62,
    cruiseSpeed: 46,
    respawnDelay: 13.7,
    phase: 4.8,
    visualIndex: 5,
    halfLength: 25,
  },
];

const inJunction = (point) =>
  point.x >= 700 && point.x <= 815 && point.y >= 312 && point.y <= 405;
const clamp01 = (value) => Math.max(0, Math.min(1, value));
const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export function initTraffic(root) {
  const scene = root.querySelector("[data-city-art]");
  if (!scene) return;

  for (const [name, route] of Object.entries(routes)) {
    route.path = scene.querySelector(`[data-cyclist-route="${name}"]`);
    if (!route.path) return;
    route.length = route.path.getTotalLength();
    route.vehiclePath = scene.querySelector(`[data-vehicle-route="${name}"]`);
    route.vehicleLength = route.vehiclePath?.getTotalLength() ?? route.length;
    if (route.crossesJunction || route.countsCyclists) {
      for (let distance = 0; distance <= route.length; distance += 2) {
        const point = route.path.getPointAtLength(distance);
        if (route.crossesJunction && inJunction(point)) {
          route.entry ??= distance;
          route.exit = distance;
        }
        // The counter stands beside the southbound cycle track.
        if (
          route.countsCyclists &&
          route.counter === undefined &&
          point.y >= 315
        ) {
          route.counter = distance;
        }
      }
    }
  }

  const traffic = trafficSettings.map((settings) => {
    const route = routes[settings.route];
    return {
      ...settings,
      route,
      distance:
        settings.progress === undefined
          ? -settings.entryDelay * settings.cruiseSpeed
          : settings.progress * route.length,
      currentSpeed: settings.cruiseSpeed,
      halfLength: settings.halfLength ?? 8,
      element: scene.querySelector(
        `[data-${settings.type}="${settings.visualIndex}"]`,
      ),
    };
  });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const counterPanel = root.querySelector("#sensor-cyclists");
  const counterPopover = root.querySelector("#city-popover-cyclists-value");
  const en = document.documentElement.lang.startsWith("en");
  let cyclistCount = 124;
  let counterPulse = 0;
  let junctionOwner = null;
  let inView = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;

  function countCyclist() {
    cyclistCount += 1;
    if (counterPanel) {
      counterPanel.textContent = `${cyclistCount} ${en ? "today" : "danes"}`;
      counterPanel.classList.remove("is-counted");
      // Reflow only on the infrequent sensor event so each pass can pulse.
      void counterPanel.offsetWidth;
      counterPanel.classList.add("is-counted");
    }
    if (counterPopover) counterPopover.textContent = String(cyclistCount);
    clearTimeout(counterPulse);
    counterPulse = setTimeout(
      () => counterPanel?.classList.remove("is-counted"),
      650,
    );
  }

  function draw() {
    for (const vehicle of traffic) {
      if (vehicle.distance < 0 || vehicle.distance > vehicle.route.length) {
        vehicle.element.style.visibility = "hidden";
        continue;
      }
      const path =
        vehicle.type === "vehicle"
          ? (vehicle.route.vehiclePath ?? vehicle.route.path)
          : vehicle.route.path;
      const length =
        vehicle.type === "vehicle"
          ? vehicle.route.vehicleLength
          : vehicle.route.length;
      const distance = (vehicle.distance / vehicle.route.length) * length;
      const point = path.getPointAtLength(distance);
      const before = path.getPointAtLength(Math.max(0, distance - 2));
      const after = path.getPointAtLength(Math.min(length, distance + 2));
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const tangentLength = Math.hypot(dx, dy) || 1;
      let inset =
        vehicle.type === "vehicle" ? (vehicle.route.vehicleInset ?? 0) : 0;
      if (vehicle.passStart !== undefined) {
        const entering = smoothstep(
          (vehicle.distance - vehicle.passStart) / 35,
        );
        const leaving =
          vehicle.passExit === undefined
            ? 1
            : 1 - smoothstep((vehicle.distance - vehicle.passExit) / 42);
        inset += 12 * Math.min(entering, leaving);
      }
      const x = point.x + (dy / tangentLength) * inset;
      const y = point.y - (dx / tangentLength) * inset;
      const alongX = Math.abs(dx / tangentLength);
      const alongY = Math.abs(dy / tangentLength);
      const halfWidth =
        vehicle.type === "vehicle" ? (vehicle.visualIndex >= 4 ? 16 : 13) : 4;
      let opacity = 1;
      for (const zone of vehicle.route.occlusion) {
        // Footprint-aware canopy matte hides the complete model behind foliage.
        const zoneX =
          (x - zone.x) /
          (zone.rx + alongX * vehicle.halfLength + alongY * halfWidth);
        const zoneY =
          (y - zone.y) /
          (zone.ry + alongY * vehicle.halfLength + alongX * halfWidth);
        const edge = clamp01((Math.hypot(zoneX, zoneY) - 0.78) / 0.2);
        opacity = Math.min(opacity, edge * edge * (3 - 2 * edge));
      }
      vehicle.element.style.visibility = opacity === 0 ? "hidden" : "visible";
      vehicle.element.style.opacity = String(opacity);
      vehicle.element.setAttribute(
        "transform",
        `translate(${x} ${y}) rotate(${(Math.atan2(dy, dx) * 180) / Math.PI})`,
      );
    }
  }

  function reserveJunction() {
    if (
      junctionOwner &&
      (junctionOwner.distance >
        junctionOwner.route.exit + junctionOwner.halfLength + 8 ||
        junctionOwner.distance < 0)
    ) {
      junctionOwner = null;
    }
    if (junctionOwner) return;
    let nearest = Infinity;
    for (const vehicle of traffic) {
      const entry = vehicle.route.entry;
      if (
        entry === undefined ||
        vehicle.distance < 0 ||
        vehicle.distance > vehicle.route.exit + vehicle.halfLength
      )
        continue;
      const remaining = entry - vehicle.distance;
      if (remaining <= 75 && remaining < nearest) {
        nearest = remaining;
        junctionOwner = vehicle;
      }
    }
  }

  function opposingLaneClear(startX) {
    const corridorEnd = startX + 245;
    const passingTime = 5.5;
    for (const other of traffic) {
      if (
        other.route !== routes.westbound ||
        other.distance > other.route.length
      )
        continue;
      const path = other.route.path;
      const currentX =
        other.distance < 0
          ? path.getPointAtLength(0).x
          : path.getPointAtLength(other.distance).x;
      if (currentX < startX - 55) continue;
      const futureDistance = other.distance + other.cruiseSpeed * passingTime;
      const futureX =
        futureDistance < 0
          ? currentX
          : path.getPointAtLength(Math.min(other.route.length, futureDistance))
              .x;
      if (futureX <= corridorEnd + 55) return false;
    }
    return true;
  }

  function tryOvertake(vehicle) {
    if (!vehicle.mayOvertake || vehicle.passUsed || vehicle.distance < 0)
      return;
    const point = vehicle.route.vehiclePath.getPointAtLength(
      (vehicle.distance / vehicle.route.length) * vehicle.route.vehicleLength,
    );
    if (point.x < 825 || point.x > 870) return;
    for (const cyclist of traffic) {
      if (cyclist.type !== "cyclist" || cyclist.route !== vehicle.route)
        continue;
      const gap = cyclist.distance - vehicle.distance;
      if (gap >= 55 && gap <= 95 && opposingLaneClear(point.x)) {
        vehicle.passTarget = cyclist;
        vehicle.passStart = vehicle.distance;
        vehicle.passUsed = true;
        return;
      }
    }
  }

  function tick(time) {
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    elapsed += delta;
    reserveJunction();
    for (const vehicle of traffic) {
      tryOvertake(vehicle);
      const oldDistance = vehicle.distance;
      const progress = clamp01(vehicle.distance / vehicle.route.length);
      let targetSpeed =
        vehicle.cruiseSpeed *
        (1 + 0.025 * Math.sin(elapsed * 0.45 + vehicle.phase));
      const bend = vehicle.route.bend;
      if (bend && progress > bend[0] && progress < bend[1]) {
        const bendProgress = (progress - bend[0]) / (bend[1] - bend[0]);
        targetSpeed *=
          1 -
          (vehicle.type === "vehicle" ? 0.13 : 0.05) *
            Math.sin(Math.PI * bendProgress) ** 2;
      }
      let maxTravel = Infinity;
      if (vehicle.distance >= 0) {
        for (const ahead of traffic) {
          if (
            ahead === vehicle ||
            ahead.route !== vehicle.route ||
            ahead === vehicle.passTarget ||
            ahead.distance < 0 ||
            ahead.distance > ahead.route.length
          )
            continue;
          const gap = ahead.distance - vehicle.distance;
          if (gap <= 0) continue;
          const safeGap =
            vehicle.halfLength +
            ahead.halfLength +
            (vehicle.type === "vehicle" ? 18 : 9);
          targetSpeed = Math.min(
            targetSpeed,
            ahead.currentSpeed + Math.max(0, gap - safeGap) * 0.55,
          );
          maxTravel = Math.min(
            maxTravel,
            Math.max(0, gap - safeGap + ahead.currentSpeed * delta),
          );
        }
      }
      const entry = vehicle.route.entry;
      if (
        entry !== undefined &&
        vehicle !== junctionOwner &&
        vehicle.distance >= 0 &&
        vehicle.distance < entry
      ) {
        const remaining = entry - vehicle.halfLength - 10 - vehicle.distance;
        targetSpeed = Math.min(
          targetSpeed,
          Math.sqrt(120 * Math.max(0, remaining)),
        );
        maxTravel = Math.min(maxTravel, Math.max(0, remaining));
      }
      const response = targetSpeed < vehicle.currentSpeed ? 4.5 : 1.5;
      vehicle.currentSpeed +=
        (targetSpeed - vehicle.currentSpeed) *
        (1 - Math.exp(-response * delta));
      vehicle.distance += Math.min(vehicle.currentSpeed * delta, maxTravel);
      if (
        vehicle.passTarget &&
        vehicle.passExit === undefined &&
        vehicle.distance - vehicle.passTarget.distance >
          vehicle.halfLength + vehicle.passTarget.halfLength + 16
      ) {
        vehicle.passExit = vehicle.distance;
      }
      if (
        vehicle.passExit !== undefined &&
        vehicle.distance - vehicle.passExit >= 42
      ) {
        vehicle.passStart = undefined;
        vehicle.passExit = undefined;
        vehicle.passTarget = undefined;
      }
      if (
        vehicle.type === "cyclist" &&
        vehicle.route.counter !== undefined &&
        oldDistance < vehicle.route.counter &&
        vehicle.distance >= vehicle.route.counter
      ) {
        countCyclist();
      }
      if (vehicle.distance > vehicle.route.length + vehicle.halfLength) {
        vehicle.distance = -vehicle.cruiseSpeed * vehicle.respawnDelay;
        vehicle.currentSpeed = vehicle.cruiseSpeed;
        vehicle.passStart = undefined;
        vehicle.passExit = undefined;
        vehicle.passTarget = undefined;
        vehicle.passUsed = false;
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
      for (const vehicle of traffic)
        vehicle.element.style.visibility = "hidden";
    } else if (!shouldRun) {
      draw();
    }
  }

  draw();
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      sync();
    },
    { rootMargin: "150px" },
  ).observe(scene);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
}
