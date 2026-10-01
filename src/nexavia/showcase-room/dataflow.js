// Data flow on the maquette: every reading travels from its sensor over the
// radio link to the gateway and up to Nexavia, where its dashboard row
// lights up; every command comes down from Nexavia through the gateway to its
// device. Links, packets and the gateway are drawn in scene pixels over the
// model, while the visitor has "Data flow" switched on.

const NS = "http://www.w3.org/2000/svg";
const UPLINK_GAP = 1500;
// One packet trip takes one pass of the data marker (2.4 s).
const TRIP = 2400;
const BEAM = 300;
const COMMAND = "#f06432";
const FAILED = "#fe5c58";

// The point a fraction s of the way along a polyline.
function along(points, s) {
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let left = s * lengths.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (left <= lengths[i] || i === lengths.length - 1) {
      const k = lengths[i] ? Math.min(1, left / lengths[i]) : 1;
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k];
    }
    left -= lengths[i];
  }
  return points[points.length - 1];
}
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const svg = (tag, attributes, parent) => {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes))
    element.setAttribute(name, value);
  parent?.appendChild(element);
  return element;
};
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
// Restarts a one-shot CSS animation.
const replay = (element, name) => {
  element.classList.remove(name);
  void element.getBoundingClientRect();
  element.classList.add(name);
};

// `gateway` is { id, at: [x, y] } in scene pixels.
export function initDataFlow(root, { gateway }) {
  const art = root.querySelector("[data-city-art]");
  const toggle = root.querySelector("[data-flow-toggle]");
  if (!art || !gateway) return null;
  const [gx, gy] = gateway.at;
  const host = svg("svg", {
    class: "city-flow",
    viewBox: "0 0 1536 1024",
    preserveAspectRatio: "xMidYMid slice",
    "aria-hidden": "true",
    focusable: "false",
  });
  art.querySelector(".city-device-chip")?.before(host);
  const links = svg("g", {}, host);
  const beams = svg("g", {}, host);
  const packets = svg("g", {}, host);
  // The gateway: a mast sending rings out, with its id underneath.
  const station = svg(
    "g",
    { class: "flow-gateway", transform: `translate(${gx} ${gy})` },
    host,
  );
  svg("circle", { class: "flow-ring", r: 12 }, station);
  svg("circle", { class: "flow-ring flow-ring--late", r: 12 }, station);
  svg(
    "path",
    {
      class: "flow-mast",
      d: "M0 0V-13M-6 -17a8.5 8.5 0 0 1 12 0M-10.5 -21.5a15 15 0 0 1 21 0",
    },
    station,
  );
  svg("circle", { class: "flow-core", r: 4.5 }, station);
  const label = svg(
    "g",
    { class: "flow-label", transform: "translate(0 10)" },
    station,
  );
  svg("rect", { x: -31, y: 0, width: 62, height: 18, rx: 4 }, label);
  svg("text", { x: 0, y: 12.6 }, label).textContent = gateway.id;

  // Every sensor pin and device, each with its radio link: a square route
  // that rises from the device, runs level and drops into the gateway.
  const ends = new Map();
  const addEnd = (name, [x, y], extra = {}) => {
    const top = Math.min(y, gy) - Math.hypot(x - gx, y - gy) * 0.22;
    const route = [
      [x, y],
      [x, top],
      [gx, top],
      [gx, gy],
    ];
    const link = svg(
      "path",
      {
        class: "flow-link",
        d: `M${x} ${y}V${top}H${gx}V${gy}`,
      },
      links,
    );
    ends.set(name, { route, link, busy: 0, ...extra });
  };
  root
    .querySelectorAll("[data-sensor-pin][data-at]")
    .forEach((pin) =>
      addEnd(
        `sensor:${pin.dataset.sensorPin}`,
        pin.dataset.at.split(" ").map(Number),
        { pin },
      ),
    );
  root
    .querySelectorAll("[data-device][data-anchor]")
    .forEach((device) =>
      addEnd(
        `device:${device.dataset.device}`,
        device.dataset.anchor.split(" ").map(Number),
      ),
    );

  let on = false;
  let online = true;
  const live = new Set();
  let frame = 0;
  // Traced packets in flight (see send).
  let tracing = 0;
  let traceTimer = 0;

  function tick(now) {
    for (const packet of live) {
      const k = (now - packet.start) / packet.duration;
      if (k < 0) continue;
      packet.node.style.visibility = "visible";
      const u = ease(Math.min(1, packet.fail ? Math.min(k, 0.55) : k));
      const s = packet.reverse ? 1 - u : u;
      const [x, y] = along(packet.end.route, s);
      packet.node.setAttribute(
        "transform",
        `translate(${x.toFixed(1)} ${y.toFixed(1)})`,
      );
      // A command that cannot get through stops halfway, turns red and fades.
      if (packet.fail && k > 0.55) {
        packet.node.style.color = FAILED;
        packet.node.style.opacity = String(Math.max(0, 1 - (k - 0.55) / 0.45));
      }
      if (k >= 1) finish(packet, true);
    }
    frame = live.size ? requestAnimationFrame(tick) : 0;
  }

  function finish(packet, arrived) {
    live.delete(packet);
    packet.node.remove();
    if (--packet.end.busy <= 0) packet.end.link.classList.remove("is-active");
    if (arrived) (packet.fail ? packet.lost : packet.arrive)?.();
    if (packet.trace && --tracing <= 0) {
      // Keep the traced link up while the beam to Nexavia plays out.
      clearTimeout(traceTimer);
      traceTimer = setTimeout(
        () => tracing <= 0 && host.classList.remove("is-tracing"),
        BEAM + 500,
      );
    }
  }

  // One packet along an end's link, from the device to the gateway (or back
  // with `reverse`). A traced packet shows its own link while the data flow
  // is switched off.
  function send(
    end,
    {
      color,
      delay = 0,
      reverse = false,
      fail = false,
      trace = false,
      arrive,
      lost,
    },
  ) {
    const node = svg(
      "g",
      { class: "flow-packet", style: `color:${color};visibility:hidden` },
      packets,
    );
    svg("circle", { class: "flow-packet-halo", r: 11 }, node);
    svg("circle", { class: "flow-packet-core", r: 4.6 }, node);
    svg("circle", { class: "flow-packet-spark", r: 1.8 }, node);
    end.busy++;
    end.link.classList.add("is-active");
    if (trace) {
      tracing++;
      clearTimeout(traceTimer);
      host.classList.add("is-tracing");
    }
    live.add({
      node,
      end,
      reverse,
      fail,
      trace,
      arrive,
      lost,
      start: performance.now() + delay,
      duration: TRIP,
    });
    if (!frame) frame = requestAnimationFrame(tick);
  }

  // A short beam between the gateway and Nexavia, above the model.
  function beam(direction, color) {
    const top = Math.max(6, gy - 150);
    const path = svg(
      "path",
      {
        class: `flow-beam flow-beam--${direction}`,
        style: `color:${color}`,
        d:
          direction === "up"
            ? `M${gx} ${gy - 24}V${top}`
            : `M${gx} ${top}V${gy - 24}`,
      },
      beams,
    );
    path.addEventListener("animationend", () => path.remove(), { once: true });
  }

  const lastUplink = new Map();
  // A reading from a sensor. Readings are spaced out per sensor unless `now`;
  // `trace` sends one even while the data flow is switched off (a visitor
  // asked for it). `arrive` runs once the reading reaches Nexavia, `lost` if
  // the gateway cannot pass it on. Returns whether a packet was sent, so the
  // caller knows `arrive` or `lost` will follow.
  function uplink(key, { now = false, trace = false, arrive, lost } = {}) {
    if (!(on || trace) || reducedMotion.matches) return false;
    if (!online && !trace) return false;
    const end = ends.get(`sensor:${key}`);
    if (!end) return false;
    const time = performance.now();
    if (!now && time - (lastUplink.get(key) ?? -Infinity) < UPLINK_GAP)
      return false;
    lastUplink.set(key, time);
    const color =
      getComputedStyle(end.pin).getPropertyValue("--tone").trim() || "#4fa3ad";
    // Readings that change together leave their sensors a moment apart.
    send(end, {
      color,
      delay: now ? 0 : Math.random() * 600,
      fail: !online,
      trace: !on,
      lost,
      arrive() {
        replay(station, "is-hit");
        beam("up", color);
        const row = root.querySelector(
          `.twin-dashboard [data-reading="${key}"]`,
        )?.parentElement;
        if (row) replay(row, "is-received");
        arrive?.();
      },
    });
    return true;
  }

  // A command for a device. Returns how long it takes to arrive, so the
  // maquette can show the light switching as it does.
  function downlink(id, deviceOnline = true) {
    if (!on || reducedMotion.matches) return 0;
    const end = ends.get(`device:${id}`);
    if (!end) return 0;
    beam("down", COMMAND);
    const fail = !online || !deviceOnline;
    setTimeout(() => {
      replay(station, "is-hit");
      send(end, { color: COMMAND, reverse: true, fail });
    }, BEAM);
    return fail ? 0 : BEAM + TRIP;
  }

  function set(value) {
    on = value;
    host.classList.toggle("is-on", on);
    toggle?.setAttribute("aria-pressed", String(on));
    if (!on) [...live].forEach((packet) => finish(packet, false));
  }
  toggle?.addEventListener("click", () => set(!on));

  return {
    uplink,
    downlink,
    // Shows or hides the data flow, as the visitor's toggle does.
    show: set,
    isOn: () => on,
    // The gateway loses and regains its connection to Nexavia.
    setOnline(value) {
      online = value;
      station.classList.toggle("is-offline", !online);
    },
  };
}
