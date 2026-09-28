// High water in the marina. The sea-level reading lifts the moving water a
// few pixels up the quay walls and over the pontoon edges, and the safety
// cut-off marks the service pedestals it switched off (the "pedestals"
// signal from a scenario).

const NS = "http://www.w3.org/2000/svg";

const svg = (tag, attributes, parent) => {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  parent?.appendChild(element);
  return element;
};

// `water` redraws the moving water and `patch` is its surface. The water
// rises `perMetre` scene pixels per metre above `base`, at most `max`.
// `pedestals` are [x, y] in scene pixels; `label` names them when cut off.
export function initTide(root, { water, patch, base, perMetre, max, pedestals, label }) {
  const art = root.querySelector("[data-city-art]");
  const reading = root.querySelector('.twin-dashboard [data-reading="sea-level"]');
  if (!art || !reading) return;

  const update = () => {
    const text = reading.firstElementChild ? reading.firstChild.textContent : reading.textContent;
    const level = parseFloat(text.replace(",", "."));
    if (Number.isNaN(level)) return;
    const lift = Math.min(max, Math.max(0, (level - base) * perMetre));
    if (Math.abs(lift - (patch.lift ?? 0)) < 0.05) return;
    patch.lift = lift;
    water?.redraw();
  };
  new MutationObserver(update).observe(reading, { childList: true, characterData: true, subtree: true });
  update();

  // The switched-off pedestals: a red marker on each, one label over the row.
  const host = svg("svg", { class: "city-tide", viewBox: "0 0 1536 1024", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true", focusable: "false" });
  art.querySelector(".city-focus")?.before(host);
  pedestals.forEach(([x, y], i) => {
    const marker = svg("g", { class: "tide-pedestal", transform: `translate(${x} ${y})`, style: `--i:${i}` }, host);
    svg("circle", { class: "tide-pedestal-ring", r: 7 }, marker);
    svg("circle", { class: "tide-pedestal-dot", r: 5.5 }, marker);
    svg("path", { class: "tide-pedestal-bolt", d: "M0.8 -3.4 -1.6 0.4H0.6L-0.8 3.4 1.8 -0.6H-0.4Z" }, marker);
  });
  const xs = pedestals.map(([x]) => x);
  const top = Math.min(...pedestals.map(([, y]) => y));
  const tag = svg("g", { class: "tide-label", transform: `translate(${(Math.min(...xs) + Math.max(...xs)) / 2} ${top - 22})` }, host);
  svg("rect", { x: -62, y: -11, width: 124, height: 20, rx: 10 }, tag);
  svg("text", { x: 0, y: 3.4 }, tag).textContent = label;

  const show = (cut) => host.classList.toggle("is-cut", cut);
  root.addEventListener("twin:signal", ({ detail }) => {
    if (detail.name === "pedestals") show(detail.value);
    if (detail.name === "reset") show(false);
  });
}
