// Gentle ripple on the maquette river. The photo's own water pixels are
// redrawn in thin horizontal strips, each nudged sideways by slow travelling
// waves, and blended back into the photo through a feathered mask.

// Photo coordinates (1536 × 1024) of the visible water, traced from the photo.
const RIVER = [
  // Upstream pool between the rocks, north of the bridge approach.
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
  // Under the arches and downstream to the front edge of the board.
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
    [1104, 645],
    [1095, 662],
    [1097, 690],
    [1089, 714],
    [1074, 738],
    [1056, 749],
    [1050, 760],
    [836, 760],
    [841, 747],
    [860, 734],
    [875, 705],
    [878, 685],
    [885, 665],
    [893, 640],
    [899, 620],
  ],
];
const AREA = { x: 820, y: 410, width: 380, height: 356 };
const PHOTO = { width: 1536, height: 1024 };
const FPS = 30;

export function initWater(root) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  if (!photo) return;

  const canvas = document.createElement("canvas");
  canvas.className = "city-water";
  canvas.setAttribute("aria-hidden", "true");
  photo.after(canvas);
  const context = canvas.getContext("2d");
  const mask = document.createElement("canvas");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let scale = 1;
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
    Object.assign(canvas.style, {
      left: `${left + AREA.x * photoScale}px`,
      top: `${top + AREA.y * photoScale}px`,
      width: `${AREA.width * photoScale}px`,
      height: `${AREA.height * photoScale}px`,
    });
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = mask.width = Math.round(AREA.width * photoScale * ratio);
    canvas.height = mask.height = Math.round(AREA.height * photoScale * ratio);
    scale = canvas.width / AREA.width;
    const shape = mask.getContext("2d");
    shape.filter = `blur(${2.5 * scale}px)`;
    shape.fillStyle = "#000";
    for (const polygon of RIVER) {
      shape.beginPath();
      for (const [x, y] of polygon)
        shape.lineTo((x - AREA.x) * scale, (y - AREA.y) * scale);
      shape.fill();
    }
    draw(performance.now());
  }

  function draw(time) {
    if (!photo.complete || !canvas.width) return;
    const t = time / 1000;
    const rows = canvas.height;
    context.globalCompositeOperation = "source-over";
    context.clearRect(0, 0, canvas.width, rows);
    for (let row = 0; row < rows; row += 2) {
      const y = AREA.y + row / scale;
      // Ripples shrink and tighten toward the back of the board.
      const depth = 0.6 + (y - 410) / 900;
      const shift =
        depth *
        (1.3 * Math.sin(y * (0.22 / depth) - t * 1.3) +
          0.65 * Math.sin(y * (0.08 / depth) + t * 0.8));
      context.drawImage(
        photo,
        AREA.x - shift,
        y,
        AREA.width,
        2 / scale,
        0,
        row,
        canvas.width,
        2,
      );
    }
    context.globalCompositeOperation = "destination-in";
    context.drawImage(mask, 0, 0);
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

  if (photo.complete) layout();
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
