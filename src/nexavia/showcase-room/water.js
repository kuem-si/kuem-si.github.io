// Moving water on the maquette photo: the river ripples and the fountain
// plays. Each patch redraws the photo's own pixels in thin horizontal strips,
// displaced per strip, and blends them back through a feathered mask.

const PHOTO = { width: 1536, height: 1024 };
const FPS = 30;

// Filled by each patch's `row()` for the strip being drawn: where in the
// photo the strip is sampled from, in photo pixels.
export const sample = { x: 0, y: 0, width: 0 };

// A jet's outline from its tip down: [y, half width] rows, mirrored about x.
const jetOutline = (x, rows) => [
  ...rows.map(([y, half]) => [x + half, y]),
  ...rows
    .filter(([, half]) => half)
    .reverse()
    .map(([y, half]) => [x - half, y]),
];

// A lit fountain: the jet rising from `base` to `top` over a round basin
// (centred at basinY). `jet` and `lightJet` trace the plume and its bright
// core as [y, half width] rows below the tip.
export function fountain({
  x,
  top,
  base,
  basinY,
  basinRx,
  basinRy,
  jet,
  lightJet,
}) {
  const reach = basinRx + 2;
  return {
    area: {
      x: x - basinRx - 7,
      y: top - 4,
      width: 2 * (basinRx + 7),
      height: basinY + 22 - top,
    },
    inset: 0,
    feather: 1.2,
    polygons: [jetOutline(x, [[top, 0], ...jet])],
    ellipses: [[x, basinY, basinRx, basinRy]],
    // Lighting stays on the basin water and the jet core, not the plaza
    // behind the plume.
    lighting: {
      feather: 1.5,
      polygons: [jetOutline(x, lightJet)],
      ellipses: [[x, basinY, basinRx - 1.5, basinRy - 1]],
    },
    // Underwater lights drift slowly through colours (a full cycle takes about
    // a minute) and breathe in brightness. The "color" blend keeps the
    // brightest spots white-hot while the halos, water and jet take the tint.
    light(context, t, scale, area) {
      const hue = (40 + t * 6) % 360;
      const strength = 0.4 + 0.12 * Math.sin(t * 0.37);
      const glow = context.createRadialGradient(
        (x - area.x) * scale,
        (basinY - area.y) * scale,
        0,
        (x - area.x) * scale,
        (basinY - area.y) * scale,
        reach * scale,
      );
      const pulse =
        0.2 + 0.07 * Math.sin(t * 1.6) + 0.04 * Math.sin(t * 4.1 + 1.3);
      glow.addColorStop(0, `hsla(${hue} 80% 70% / ${pulse})`);
      glow.addColorStop(1, `hsla(${hue} 80% 60% / 0)`);
      return [
        ["color", `hsla(${hue} 65% 55% / ${strength})`],
        ["screen", glow],
      ];
    },
    row(y, t, area) {
      if (y < base) {
        // Jet: height breathes, water streams upward and the plume sways
        // more toward its top.
        const height = Math.min(1, (base - y) / (base - top - 2));
        const pulse = 1 + 0.06 * Math.sin(t * 2.2) + 0.025 * Math.sin(t * 5.9);
        sample.y =
          base - (base - y) / pulse + 0.7 * height * Math.sin(y * 1.1 + t * 16);
        sample.x =
          area.x -
          height *
            (0.7 * Math.sin(t * 4.7 + y * 0.3) +
              0.35 * Math.sin(t * 7.3 + y * 0.8));
        sample.width = area.width;
      } else {
        // Basin: rings spreading out from the jet.
        const radius = (y - basinY) / basinRy;
        const ring = Math.sin(Math.abs(radius) * 5 - t * 3.4);
        const zoom = 1 + 0.03 * ring;
        sample.x = x - (x - area.x) / zoom;
        sample.y = y - 0.8 * Math.sign(radius) * ring;
        sample.width = area.width / zoom;
      }
    },
  };
}

const PATCHES = [
  {
    // River: upstream pool, under the arches and downstream to the board edge.
    area: { x: 820, y: 410, width: 380, height: 356 },
    // The outline is pulled in from the banks and widely feathered, so the
    // displacement fades out before it reaches rocks and reeds.
    inset: 4.5,
    feather: 5,
    polygons: [
      [
        [1093, 419],
        [1180, 417],
        [1186, 440],
        [1182, 470],
        [1189, 500],
        [1184, 521],
        [1150, 516],
        [1100, 505],
        [1050, 497],
        [1022, 493],
        [1026, 488],
        [1048, 486],
        [1070, 481],
        [1082, 468],
        [1087, 450],
        [1090, 433],
      ],
      [
        [903, 600],
        [912, 590],
        [935, 581],
        [960, 579],
        [985, 583],
        [996, 596],
        [998, 614],
        [1027, 615],
        [1031, 602],
        [1050, 593],
        [1080, 591],
        [1110, 597],
        [1131, 611],
        [1136, 625],
        [1120, 639],
        [1097, 647],
        [1080, 663],
        [1084, 690],
        [1089, 714],
        [1074, 738],
        [1056, 749],
        [1050, 760],
        [836, 760],
        [841, 747],
        [860, 734],
        [875, 705],
        [890, 686],
        [895, 665],
        [893, 640],
        [899, 620],
      ],
    ],
    row(y, t, area) {
      // Ripples shrink and tighten toward the back of the board. Sideways
      // sway plus a slow vertical swell that stretches the reflections.
      const depth = 0.6 + (y - 410) / 900;
      const shift =
        depth *
        (3 * Math.sin(y * (0.2 / depth) - t * 1.3) +
          1.5 * Math.sin(y * (0.07 / depth) + t * 0.8));
      sample.x = area.x - shift;
      sample.y = y + depth * 1.7 * Math.sin(y * (0.13 / depth) - t * 1.6);
      sample.width = area.width;
    },
  },
  // Plaza fountain.
  fountain({
    x: 1020,
    top: 234,
    base: 272,
    basinY: 282,
    basinRx: 38,
    basinRy: 12.3,
    jet: [
      [240, 4.5],
      [252, 7.5],
      [262, 10.5],
      [272, 15],
    ],
    lightJet: [
      [237, 0],
      [245, 2.5],
      [255, 4.5],
      [265, 7],
      [273, 9.5],
    ],
  }),
];

// Fills a mask canvas with the given shapes, optionally pulled in from the
// edges (inset) and softened (feather), all in photo pixels.
function paintMask(
  target,
  { polygons = [], ellipses = [], inset = 0, feather },
  scale,
  area,
) {
  const outline = document.createElement("canvas");
  outline.width = target.width;
  outline.height = target.height;
  const shape = outline.getContext("2d");
  shape.lineJoin = "round";
  shape.lineWidth = 2 * inset * scale;
  const fill = (trace) => {
    shape.beginPath();
    trace();
    shape.closePath();
    shape.globalCompositeOperation = "source-over";
    shape.fill();
    if (!inset) return;
    shape.globalCompositeOperation = "destination-out";
    shape.stroke();
  };
  for (const polygon of polygons)
    fill(() => {
      for (const [x, y] of polygon)
        shape.lineTo((x - area.x) * scale, (y - area.y) * scale);
    });
  for (const [cx, cy, rx, ry] of ellipses)
    fill(() =>
      shape.ellipse(
        (cx - area.x) * scale,
        (cy - area.y) * scale,
        rx * scale,
        ry * scale,
        0,
        0,
        Math.PI * 2,
      ),
    );
  const context = target.getContext("2d");
  context.clearRect(0, 0, target.width, target.height);
  context.filter = `blur(${feather * scale}px)`;
  context.drawImage(outline, 0, 0);
}

// `patches` default to the city's river and fountain; the marina passes its
// own. A patch with a `source` image redraws that image instead of the photo,
// masked by the image's own alpha (e.g. the water surface rendered alone);
// its `lift` (scene pixels) raises the water over the edges around it.
export function initWater(root, patches = PATCHES) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  if (!photo) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const layers = patches.map((patch) => {
    const canvas = document.createElement("canvas");
    canvas.className = "city-water";
    canvas.setAttribute("aria-hidden", "true");
    photo.after(canvas);
    let image = null;
    if (patch.source) {
      image = new Image();
      image.decoding = "async";
      image.src = patch.source;
      image.addEventListener("load", () => layout(), { once: true });
    }
    return {
      patch,
      image,
      canvas,
      context: canvas.getContext("2d"),
      mask: document.createElement("canvas"),
      lightMask: document.createElement("canvas"),
      scratch: document.createElement("canvas"),
      scale: 1,
    };
  });
  let inView = false;
  let frame = 0;
  let lastDraw = 0;

  // Matches the photo's object-fit so the water stays registered in both the
  // page layout (contain) and full screen (cover).
  function layout() {
    const width = art.clientWidth;
    const height = art.clientHeight;
    if (!width || !height) return;
    const fit =
      getComputedStyle(photo).objectFit === "cover" ? Math.max : Math.min;
    const photoScale = fit(width / PHOTO.width, height / PHOTO.height);
    const left = (width - PHOTO.width * photoScale) / 2;
    const top = (height - PHOTO.height * photoScale) / 2;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    for (const layer of layers) {
      const { canvas, mask, patch } = layer;
      const { area } = patch;
      Object.assign(canvas.style, {
        left: `${left + area.x * photoScale}px`,
        top: `${top + area.y * photoScale}px`,
        width: `${area.width * photoScale}px`,
        height: `${area.height * photoScale}px`,
      });
      canvas.width = mask.width = Math.round(area.width * photoScale * ratio);
      canvas.height = mask.height = Math.round(
        area.height * photoScale * ratio,
      );
      const scale = (layer.scale = canvas.width / area.width);
      if (layer.image) sourceMask(layer);
      else paintMask(mask, patch, scale, area);
      if (patch.light) {
        layer.lightMask.width = layer.scratch.width = canvas.width;
        layer.lightMask.height = layer.scratch.height = canvas.height;
        paintMask(layer.lightMask, patch.lighting, scale, area);
      }
    }
    draw(performance.now());
  }

  // The source's alpha is the mask, raised with the water (`patch.lift`).
  function sourceMask(layer) {
    const { image, mask, patch } = layer;
    const { area } = patch;
    const context = mask.getContext("2d");
    context.clearRect(0, 0, mask.width, mask.height);
    layer.lift = patch.lift ?? 0;
    if (!image.naturalWidth) return;
    const k = image.naturalWidth / PHOTO.width;
    context.drawImage(
      image,
      area.x * k,
      (area.y + layer.lift) * k,
      area.width * k,
      area.height * k,
      0,
      0,
      mask.width,
      mask.height,
    );
  }

  function draw(time) {
    // An <img> without a src yet also reports complete, so check its size too.
    if (!photo.complete || !photo.naturalWidth) return;
    const t = time / 1000;
    for (const layer of layers) {
      const { patch, canvas, context, mask, scale } = layer;
      const source = layer.image ?? photo;
      if (!canvas.width || !source.naturalWidth) continue;
      // Patches are in scene pixels; the source may be rendered larger.
      const k = source.naturalWidth / PHOTO.width;
      const rows = canvas.height;
      // Raised water is the same surface drawn higher, over its own edges.
      const lift = patch.lift ?? 0;
      if (layer.image && lift !== layer.lift) sourceMask(layer);
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, canvas.width, rows);
      for (let row = 0; row < rows; row += 2) {
        patch.row(patch.area.y + row / scale, t, patch.area);
        sample.y += lift;
        context.drawImage(
          source,
          sample.x * k,
          sample.y * k,
          sample.width * k,
          (2 / scale) * k,
          0,
          row,
          canvas.width,
          2,
        );
      }
      if (patch.light) {
        // Each light pass is painted through its own feathered mask first.
        const paint = layer.scratch.getContext("2d");
        for (const [blend, style] of patch.light(paint, t, scale, patch.area)) {
          paint.globalCompositeOperation = "source-over";
          paint.clearRect(0, 0, canvas.width, rows);
          paint.fillStyle = style;
          paint.fillRect(0, 0, canvas.width, rows);
          paint.globalCompositeOperation = "destination-in";
          paint.drawImage(layer.lightMask, 0, 0);
          context.globalCompositeOperation = blend;
          context.drawImage(layer.scratch, 0, 0);
        }
      }
      context.globalCompositeOperation = "destination-in";
      context.drawImage(mask, 0, 0);
    }
  }

  function tick(time) {
    if (time - lastDraw >= 1000 / FPS - 2) {
      lastDraw = time;
      draw(time);
    }
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const shouldRun = inView && !document.hidden && !motion.matches;
    if (shouldRun && !frame) frame = requestAnimationFrame(tick);
    else if (!shouldRun && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  }

  if (photo.complete && photo.naturalWidth) layout();
  else photo.addEventListener("load", layout, { once: true });
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
  // Redraws a still frame, e.g. when the water rises while motion is reduced.
  return { redraw: () => draw(performance.now()) };
}
