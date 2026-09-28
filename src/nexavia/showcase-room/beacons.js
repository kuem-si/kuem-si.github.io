// Harbour entrance lights: each lantern flashes its colour (Fl R 4s and
// Fl G 4s, out of step), with a halo, a lens streak and light spilling down
// the tower, and its reflection glitters on the water. Between flashes the
// lamp and its reflection in the photo are dimmed. Drawn in scene pixels over
// the moving water and under the traffic.

const SVG_NS = "http://www.w3.org/2000/svg";
const FPS = 30;
const GLINTS = 14;

const svg = (tag, attributes, parent) => {
  const element = document.createElementNS(SVG_NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent?.appendChild(element);
  return element;
};

function gradient(defs, id, stops) {
  const fill = svg("radialGradient", { id }, defs);
  for (const [offset, color, opacity] of stops) svg("stop", { offset, "stop-color": color, "stop-opacity": opacity }, fill);
  return `url(#${id})`;
}

// Brightness through one period: a quick rise, a hold and a short afterglow
// as the filament cools.
function flash(t, { period, phase, on }) {
  const u = (((t + phase) % period) + period) % period;
  if (u > on) return 0;
  return Math.min(1, u / 0.08) * Math.min(1, (on - u) / 0.35);
}

export function initBeacons(root, beacons, water = "#0e3942") {
  const art = root.querySelector("[data-city-art]");
  const traffic = art?.querySelector(".city-traffic");
  if (!art || !traffic) return;
  const host = svg("svg", { class: "city-beacons", viewBox: "0 0 1536 1024", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true", focusable: "false" });
  traffic.before(host);
  const defs = svg("defs", {}, host);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const parts = beacons.map((beacon, index) => {
    const id = `beacon-${index}`;
    const { lamp, reflection, color, dark } = beacon;
    const [x, y] = lamp;
    const [rx, ry] = reflection;
    // Dimming: the photo's own lamp and its glitter, when the light is out.
    const waterCover = svg("ellipse", { cx: rx, cy: ry, rx: 26, ry: 34, fill: gradient(defs, `${id}-water`, [[0, water, 0.95], [0.6, water, 0.8], [1, water, 0]]) }, host);
    const lampCover = svg("ellipse", { cx: x, cy: y + 8, rx: 11, ry: 17, fill: gradient(defs, `${id}-dark`, [[0, dark, 0.8], [0.6, dark, 0.55], [1, dark, 0]]) }, host);
    const glow = svg("g", { style: "mix-blend-mode:screen" }, host);
    // Reflection: a soft column with glints dancing on the ripples.
    const column = svg("ellipse", { cx: rx, cy: ry + 2, rx: 10, ry: 26, fill: gradient(defs, `${id}-column`, [[0, color, 0.55], [1, color, 0]]) }, glow);
    const glints = Array.from({ length: GLINTS }, () => ({
      node: svg("ellipse", { rx: (0.8 + Math.random() * 1.6).toFixed(2), ry: 0.5, fill: Math.random() < 0.3 ? beacon.glint : color }, glow),
      x: rx + (Math.random() - 0.5) * 22,
      y: ry - 18 + Math.random() * 40,
      speed: 2 + Math.random() * 5,
      phase: Math.random() * 10,
    }));
    // The lamp: halo, light down the tower, hot core and a lens streak.
    const halo = svg("circle", { cx: x, cy: y, r: 36, fill: gradient(defs, `${id}-halo`, [[0, color, 0.75], [0.25, color, 0.35], [1, color, 0]]) }, glow);
    const tower = svg("ellipse", { cx: x, cy: y + 16, rx: 9, ry: 16, fill: gradient(defs, `${id}-tower`, [[0, color, 0.5], [1, color, 0]]) }, glow);
    const core = svg("ellipse", { cx: x, cy: y, rx: 6, ry: 4, fill: gradient(defs, `${id}-core`, [[0, "#fff", 1], [0.45, beacon.glint, 0.9], [1, color, 0]]) }, glow);
    const streak = svg("ellipse", { cx: x, cy: y, rx: 34, ry: 1.1, fill: gradient(defs, `${id}-streak`, [[0, beacon.glint, 0.9], [1, color, 0]]) }, glow);
    return { beacon, waterCover, lampCover, column, glints, halo, tower, core, streak };
  });

  function draw(time) {
    const t = time / 1000;
    for (const part of parts) {
      const light = motion.matches ? 1 : flash(t, part.beacon);
      const out = (1 - light).toFixed(3);
      part.waterCover.setAttribute("opacity", out);
      part.lampCover.setAttribute("opacity", out);
      part.halo.setAttribute("opacity", light.toFixed(3));
      part.halo.setAttribute("r", (30 + 8 * light).toFixed(2));
      part.tower.setAttribute("opacity", (0.8 * light).toFixed(3));
      part.core.setAttribute("opacity", light.toFixed(3));
      part.streak.setAttribute("opacity", (0.7 * light).toFixed(3));
      part.column.setAttribute("opacity", (0.6 * light).toFixed(3));
      for (const glint of part.glints) {
        const sparkle = Math.max(0, Math.sin(t * glint.speed + glint.phase));
        glint.node.setAttribute("cx", (glint.x + 2.5 * Math.sin(t * 1.3 + glint.y * 0.4)).toFixed(2));
        glint.node.setAttribute("cy", glint.y.toFixed(2));
        glint.node.setAttribute("opacity", (light * sparkle ** 2).toFixed(3));
      }
    }
  }

  let inView = false;
  let frame = 0;
  let last = 0;
  function tick(time) {
    if (time - last >= 1000 / FPS - 2) {
      last = time;
      draw(time);
    }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    const run = inView && !document.hidden && !motion.matches;
    if (run && !frame) frame = requestAnimationFrame(tick);
    else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }
  // Reduced motion keeps the lights steadily on.
  draw(performance.now());
  new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      sync();
    },
    { rootMargin: "200px" },
  ).observe(art);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", () => {
    draw(performance.now());
    sync();
  });
}
