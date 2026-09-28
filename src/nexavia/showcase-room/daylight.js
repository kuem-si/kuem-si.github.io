// Time of day on the maquette, and the clock a visitor scrubs to set it.
//
// The photo is an evening render with every light on. Four layers over it, in
// scene pixels, turn it into any hour:
//   day    windows and lamps no device controls fade back to unlit glass
//   dusk   a warm wash over the board around sunrise and sunset
//   night  a moonlit multiply over the board, with holes where light falls
//   glow   a soft bloom around the same lights
// The lights are keyed from the photo: warm, bright pixels are lamps and lit
// windows, and a device's light is the difference between the photo and its
// unlit patch, so it glows only while the device is on.

const W = 1536;
const H = 1024;
// Sunrise and sunset ramps (hours), and the ambient light at night (lx).
const RISE = [5.5, 7];
const SET = [19, 20.5];
const FLOOR = 3;
// The showroom around the board dims a little at night too.
const ROOM = 0.3;
const WARM = "#ffcf8a";
const COLORS = { day: "#6f7b8c", dusk: "#ff9c5c", night: "#16244a" };
const STRENGTH = { day: 0.85, dusk: 0.38, night: 0.8, glow: 0.7 };

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smooth = (from, to, x) => {
  const u = clamp01((x - from) / (to - from));
  return u * u * (3 - 2 * u);
};
export const wrap = (hours) => ((hours % 24) + 24) % 24;
export const daylight = (hours) => smooth(RISE[0], RISE[1], hours) * (1 - smooth(SET[0], SET[1], hours));
// Warm light around sunrise and sunset.
const twilight = (hours) => Math.max(0, 1 - ((hours - 6.1) / 1.1) ** 2, 1 - ((hours - 19.9) / 1.1) ** 2);
export const luxAt = (hours, max) => Math.round(FLOOR + (max - FLOOR) * daylight(wrap(hours)));
export const parseTime = (text) => {
  const [hours, minutes] = text.split(":").map(Number);
  return hours + minutes / 60;
};
export const formatTime = (hours) => {
  const minutes = Math.round(wrap(hours) * 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};

// When daylight crosses `level` inside a ramp (bisection; each ramp is monotonic).
function cross([from, to], level) {
  const rising = daylight(to) > daylight(from);
  let a = from;
  let b = to;
  for (let i = 0; i < 30; i++) {
    const middle = (a + b) / 2;
    if ((daylight(middle) < level) === rising) a = middle;
    else b = middle;
  }
  return (a + b) / 2;
}

// The evening time the light sensor reads `onLux` and the morning time it
// reads `offLux`, for a sensor that reads `max` in full daylight.
export function sunTimes(max, onLux, offLux) {
  return {
    dusk: cross(SET, (onLux - FLOOR) / (max - FLOOR)),
    dawn: cross(RISE, (offLux - FLOOR) / (max - FLOOR)),
  };
}

const icons = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1z"/></svg>',
};

const canvas = (width, height) => Object.assign(document.createElement("canvas"), { width, height });
const luminance = (data, i) => 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
const idle = () => new Promise((resolve) => (window.requestIdleCallback ?? setTimeout)(resolve));
const rgb = (hex) => [0, 1, 2].map((i) => parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16));
const mix = (a, b, k) => a.map((value, i) => value + (b[i] - value) * k);

// `onScrub(hours)` runs when the visitor moves the clock.
export function initDaylight(root, { t, onScrub }) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  const wrapper = root.querySelector(".twin-scene-wrap");
  if (!art || !photo || !wrapper) return null;

  const sky = document.createElement("div");
  sky.className = "city-sky";
  sky.setAttribute("aria-hidden", "true");
  const layers = Object.fromEntries(
    ["day", "dusk", "night", "glow"].map((name) => {
      const layer = canvas(W, H);
      layer.className = `city-sky-${name}`;
      sky.append(layer);
      return [name, layer];
    }),
  );
  // Over the water and the traffic, under the device hotspots and pins.
  (art.querySelector(".city-traffic") ?? photo).after(sky);

  // Registered to the photo as the water is: contain on the page, cover in
  // full screen.
  function layout() {
    const width = art.clientWidth;
    const height = art.clientHeight;
    if (!width || !height) return;
    const fit = getComputedStyle(photo).objectFit === "cover" ? Math.max : Math.min;
    const scale = fit(width / W, height / H);
    Object.assign(sky.style, {
      left: `${(width - W * scale) / 2}px`,
      top: `${(height - H * scale) / 2}px`,
      width: `${W * scale}px`,
      height: `${H * scale}px`,
    });
  }
  new ResizeObserver(layout).observe(art);
  layout();

  // The clock: the time, the part of the day, and a 24-hour track.
  const clock = document.createElement("div");
  clock.className = "twin-clock";
  clock.innerHTML = `
    <span class="twin-clock-icon"></span>
    <span class="twin-clock-read"><b></b><small></small></span>
    <span class="twin-clock-track"><input type="range" min="0" max="1435" step="5" aria-label="${t("Ura na maketi", "Time of day on the model")}"></span>`;
  wrapper.append(clock);
  const input = clock.querySelector("input");
  const read = { time: clock.querySelector("b"), phase: clock.querySelector("small"), icon: clock.querySelector(".twin-clock-icon") };
  // A drag on the clock must not pan the maquette behind it, nor a tap
  // switch the nearest light.
  clock.addEventListener("pointerdown", (event) => event.stopPropagation());
  clock.addEventListener("click", (event) => event.stopPropagation());
  input.addEventListener("input", () => onScrub?.(Number(input.value) / 60));
  // The track shows the sky over the day: night, a warm dawn, day, a warm dusk.
  const stops = Array.from({ length: 49 }, (_, i) => {
    const hours = i / 2;
    const color = mix(mix(rgb("#1b2547"), rgb("#8ecbe6"), daylight(hours)), rgb("#f39a5b"), 0.8 * twilight(hours));
    return `rgb(${color.map(Math.round).join(" ")}) ${((hours / 24) * 100).toFixed(2)}%`;
  });
  clock.querySelector(".twin-clock-track").style.setProperty("--sky-track", `linear-gradient(90deg,${stops.join(",")})`);

  const phases = { night: t("Noč", "Night"), dawn: t("Zora", "Dawn"), day: t("Dan", "Day"), dusk: t("Mrak", "Dusk") };
  const phaseOf = (hours) => {
    const light = daylight(hours);
    if (light < 0.03) return "night";
    if (light > 0.97) return "day";
    return hours < 12 ? "dawn" : "dusk";
  };

  let hours = 12;
  let shown = "";
  let easing = 0;
  let masks = null;
  const levels = new Map();

  function apply() {
    const light = daylight(hours);
    const opacity = { day: STRENGTH.day * light, dusk: STRENGTH.dusk * twilight(hours), night: STRENGTH.night * (1 - light), glow: STRENGTH.glow * (1 - light) };
    for (const [name, layer] of Object.entries(layers)) layer.style.opacity = opacity[name].toFixed(3);
    const time = formatTime(hours);
    if (time === shown) return;
    shown = time;
    const phase = phaseOf(hours);
    read.time.textContent = time;
    read.phase.textContent = phases[phase];
    if (clock.dataset.phase !== phase) {
      clock.dataset.phase = phase;
      read.icon.innerHTML = phase === "day" || phase === "dawn" ? icons.sun : icons.moon;
    }
    if (document.activeElement !== input) input.value = String(Math.round((wrap(hours) * 60) / 5) * 5 % 1440);
    input.setAttribute("aria-valuetext", `${time} · ${phases[phase]}`);
  }

  // The lights' key and the board mask, computed once from the photo and the
  // unlit patches. Spread over idle time so the reveal stays smooth.
  async function prepare() {
    const load = (src) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = src;
      });
    await photo.decode().catch(() => {});
    if (!photo.naturalWidth) return;
    await idle();
    const source = canvas(W, H).getContext("2d", { willReadFrequently: true });
    source.drawImage(photo, 0, 0, W, H);
    const pixels = source.getImageData(0, 0, W, H).data;

    // The board: everything the pale, grey showroom around it does not reach,
    // flood-filled in from the edges at a quarter of the size.
    const qw = W / 4;
    const qh = H / 4;
    const small = canvas(qw, qh).getContext("2d", { willReadFrequently: true });
    small.drawImage(photo, 0, 0, qw, qh);
    const room = small.getImageData(0, 0, qw, qh);
    const q = room.data;
    const inRoom = new Uint8Array(qw * qh);
    const pale = (i) => Math.max(q[i * 4], q[i * 4 + 1], q[i * 4 + 2]) - Math.min(q[i * 4], q[i * 4 + 1], q[i * 4 + 2]) < 24 && q[i * 4] + q[i * 4 + 1] + q[i * 4 + 2] > 420;
    const stack = [];
    for (let x = 0; x < qw; x++) stack.push(x, (qh - 1) * qw + x);
    for (let y = 0; y < qh; y++) stack.push(y * qw, y * qw + qw - 1);
    while (stack.length) {
      const i = stack.pop();
      if (inRoom[i] || !pale(i)) continue;
      inRoom[i] = 1;
      const x = i % qw;
      if (x > 0) stack.push(i - 1);
      if (x < qw - 1) stack.push(i + 1);
      if (i >= qw) stack.push(i - qw);
      if (i < qw * (qh - 1)) stack.push(i + qw);
    }
    for (let i = 0; i < inRoom.length; i++) q[i * 4 + 3] = inRoom[i] ? 255 * ROOM : 255;
    small.putImageData(room, 0, 0);
    const board = canvas(W, H);
    const boardContext = board.getContext("2d");
    boardContext.imageSmoothingQuality = "high";
    boardContext.drawImage(small.canvas, 0, 0, W, H);

    // Lights nobody switches: warm and bright in the photo.
    const key = canvas(W, H);
    const keyContext = key.getContext("2d");
    const keyData = keyContext.createImageData(W, H);
    const k = keyData.data;
    for (let row = 0; row < H; row += 128) {
      for (let i = row * W * 4, end = Math.min(H, row + 128) * W * 4; i < end; i += 4) {
        const warmth = Math.min(pixels[i], pixels[i + 1]) - pixels[i + 2];
        k[i] = 255;
        k[i + 1] = 207;
        k[i + 2] = 138;
        k[i + 3] = 255 * smooth(28, 72, warmth) * smooth(150, 215, luminance(pixels, i));
      }
      await idle();
    }
    keyContext.putImageData(keyData, 0, 0);

    // Each device's own light, cut out of the static key: the photo minus the
    // unlit patch (and a pier light's reflection on the water).
    const devices = [];
    const own = async (element, measure) => {
      const [x, y, width, height] = ["x", "y", "width", "height"].map((name) => Number(element.getAttribute(name)));
      const image = await load(element.getAttribute("href"));
      if (!image) return;
      const x0 = Math.max(0, Math.floor(x));
      const y0 = Math.max(0, Math.floor(y));
      const w = Math.min(W, Math.ceil(x + width)) - x0;
      const h = Math.min(H, Math.ceil(y + height)) - y0;
      const layer = canvas(w, h).getContext("2d", { willReadFrequently: true });
      layer.drawImage(image, x - x0, y - y0, width, height);
      const patch = layer.getImageData(0, 0, w, h);
      const lit = source.getImageData(x0, y0, w, h).data;
      const p = patch.data;
      for (let i = 0; i < p.length; i += 4) {
        const alpha = 255 * measure(lit, p, i) * (p[i + 3] / 255);
        p[i] = 255;
        p[i + 1] = 207;
        p[i + 2] = 138;
        p[i + 3] = alpha;
      }
      layer.putImageData(patch, 0, 0);
      keyContext.clearRect(x0, y0, w, h);
      return { canvas: layer.canvas, x: x0, y: y0 };
    };
    for (const element of art.querySelectorAll("[data-light-off]")) {
      const light = await own(element, (lit, off, i) => smooth(6, 48, luminance(lit, i) - luminance(off, i)));
      if (light) devices.push({ id: element.dataset.lightOff, ...light });
    }
    for (const element of art.querySelectorAll("[data-light-glint]")) {
      const light = await own(element, (_, glint, i) => smooth(30, 140, luminance(glint, i)));
      if (light) devices.push({ id: element.dataset.lightGlint, ...light });
    }

    masks = { board, key, devices };
    // The fixed layers: dimmed glass by day and the warm wash at dusk.
    const fill = (layer, mask, color) => {
      const context = layer.getContext("2d");
      context.clearRect(0, 0, W, H);
      context.globalCompositeOperation = "source-over";
      context.drawImage(mask, 0, 0);
      context.globalCompositeOperation = "source-in";
      context.fillStyle = color;
      context.fillRect(0, 0, W, H);
    };
    fill(layers.day, key, COLORS.day);
    fill(layers.dusk, board, COLORS.dusk);
    paint();
    apply();
    sky.classList.add("is-ready");
  }

  // Night and glow follow the devices' light levels.
  let pending = 0;
  function paint() {
    pending = 0;
    if (!masks) return;
    const night = layers.night.getContext("2d");
    night.globalAlpha = 1;
    night.globalCompositeOperation = "source-over";
    night.clearRect(0, 0, W, H);
    night.drawImage(masks.board, 0, 0);
    night.globalCompositeOperation = "destination-out";
    night.drawImage(masks.key, 0, 0);
    const glow = layers.glow.getContext("2d");
    glow.globalAlpha = 1;
    glow.clearRect(0, 0, W, H);
    glow.drawImage(masks.key, 0, 0);
    for (const light of masks.devices) {
      const level = levels.get(light.id) ?? 0;
      if (!level) continue;
      night.globalAlpha = glow.globalAlpha = level;
      night.drawImage(light.canvas, light.x, light.y);
      glow.drawImage(light.canvas, light.x, light.y);
    }
    night.globalAlpha = glow.globalAlpha = 1;
    night.globalCompositeOperation = "source-in";
    night.fillStyle = COLORS.night;
    night.fillRect(0, 0, W, H);
  }

  apply();
  return {
    prepare,
    // `ease` glides to the new hour (a scenario's jump in time).
    setTime(value, ease = false) {
      hours = wrap(value);
      if (ease && !reducedMotion.matches) {
        sky.classList.add("is-easing");
        clearTimeout(easing);
        easing = setTimeout(() => sky.classList.remove("is-easing"), 1400);
      }
      apply();
    },
    setLevel(id, level) {
      if (levels.get(id) === level) return;
      levels.set(id, level);
      if (!pending) pending = requestAnimationFrame(paint);
    },
    setMarks(marks) {
      const track = clock.querySelector(".twin-clock-track");
      track.querySelectorAll(".twin-clock-mark").forEach((mark) => mark.remove());
      for (const [at, label] of marks) {
        const mark = document.createElement("i");
        mark.className = "twin-clock-mark";
        mark.title = `${label} · ${formatTime(at)}`;
        mark.style.left = `${((wrap(at) / 24) * 100).toFixed(2)}%`;
        track.prepend(mark);
      }
    },
    setDisabled(disabled) {
      input.disabled = disabled;
    },
  };
}
