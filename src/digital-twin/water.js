// Moving water on the maquette photo: the river ripples and the fountain
// plays. Each patch redraws the photo's own pixels in thin horizontal strips,
// displaced per strip, and blends them back through a feathered mask.

const PHOTO = { width: 1536, height: 1024 };
const FPS = 30;
const FOUNTAIN = { x: 1020, base: 272, basinY: 282, basinRy: 12.3 };

// Filled by each patch's `row()` for the strip being drawn: where in the
// photo the strip is sampled from, in photo pixels.
const sample = { x: 0, y: 0, width: 0 };

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
  {
    // Plaza fountain: the jet and the water in its round basin.
    area: { x: 975, y: 230, width: 90, height: 70 },
    inset: 0,
    feather: 1.2,
    polygons: [
      [
        [1020, 234],
        [1024.5, 240],
        [1027.5, 252],
        [1030.5, 262],
        [1035, 272],
        [1005, 272],
        [1009.5, 262],
        [1012.5, 252],
        [1015.5, 240],
      ],
    ],
    ellipses: [[FOUNTAIN.x, FOUNTAIN.basinY, 38, FOUNTAIN.basinRy]],
    // Lighting stays on the basin water and the jet core, not the plaza
    // behind the plume.
    lighting: {
      feather: 1.5,
      polygons: [
        [
          [1020, 237],
          [1022.5, 245],
          [1024.5, 255],
          [1027, 265],
          [1029.5, 273],
          [1010.5, 273],
          [1013, 265],
          [1015.5, 255],
          [1017.5, 245],
        ],
      ],
      ellipses: [[FOUNTAIN.x, FOUNTAIN.basinY, 36.5, FOUNTAIN.basinRy - 1]],
    },
    // Underwater lights drift slowly through colours (a full cycle takes about
    // a minute) and breathe in brightness. The "color" blend keeps the
    // brightest spots white-hot while the halos, water and jet take the tint.
    light(context, t, scale, area) {
      const hue = (40 + t * 6) % 360;
      const strength = 0.4 + 0.12 * Math.sin(t * 0.37);
      const glow = context.createRadialGradient(
        (FOUNTAIN.x - area.x) * scale,
        (FOUNTAIN.basinY - area.y) * scale,
        0,
        (FOUNTAIN.x - area.x) * scale,
        (FOUNTAIN.basinY - area.y) * scale,
        40 * scale,
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
      const { x, base, basinY, basinRy } = FOUNTAIN;
      if (y < base) {
        // Jet: height breathes, water streams upward and the plume sways
        // more toward its top.
        const height = Math.min(1, (base - y) / 36);
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
  },
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

export function initWater(root) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  if (!photo) return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const layers = PATCHES.map((patch) => {
    const canvas = document.createElement("canvas");
    canvas.className = "city-water";
    canvas.setAttribute("aria-hidden", "true");
    photo.after(canvas);
    return {
      patch,
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
      paintMask(mask, patch, scale, area);
      if (patch.light) {
        layer.lightMask.width = layer.scratch.width = canvas.width;
        layer.lightMask.height = layer.scratch.height = canvas.height;
        paintMask(layer.lightMask, patch.lighting, scale, area);
      }
    }
    draw(performance.now());
  }

  function draw(time) {
    // An <img> without a src yet also reports complete, so check its size too.
    if (!photo.complete || !photo.naturalWidth) return;
    const t = time / 1000;
    for (const layer of layers) {
      const { patch, canvas, context, mask, scale } = layer;
      if (!canvas.width) continue;
      const rows = canvas.height;
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, canvas.width, rows);
      for (let row = 0; row < rows; row += 2) {
        patch.row(patch.area.y + row / scale, t, patch.area);
        context.drawImage(
          photo,
          sample.x,
          sample.y,
          sample.width,
          2 / scale,
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
}
