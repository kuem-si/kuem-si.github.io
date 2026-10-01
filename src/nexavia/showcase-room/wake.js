// Boat wakes, drawn on a canvas under the traffic layer. A boat leaves its
// wake in the water, not on its hull: every few ground units the stern drops
// a sample, and each sample ages where it was left. Churned white water
// behind the transom breaks up and spreads, a pale aerated streak lingers
// longest, and the two arms of the Kelvin wake open at about 19.5° from the
// bow, with faint transverse crests between them. Positions are in scene
// pixels; sizes in ground units, laid on the water with the same
// foreshortening as the boats.

const SCENE = { width: 1536, height: 1024 };
// Seconds a sample lasts, and ground units travelled between samples.
const LIFE = 9;
const STEP = 2.5;
// tan(19.47°): how fast the Kelvin arms open per unit travelled.
const KELVIN = 0.354;
const FOAM = "226 238 236";
const SPRITES = 8;

const random = (min, max) => min + Math.random() * (max - min);

// A clump of foam: soft bubbles packed toward the middle, then holes punched
// through so it reads as lace rather than a blob.
function foamSprite() {
  const size = 64;
  const r = size / 2;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const bubble = (x, y, radius, alpha) => {
    const fill = context.createRadialGradient(x, y, 0, x, y, radius);
    fill.addColorStop(0, `rgb(255 255 255 / ${alpha})`);
    fill.addColorStop(1, "rgb(255 255 255 / 0)");
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  };
  // A few streaks give the clump a grain, as foam is torn into lines.
  const grain = random(0, Math.PI);
  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = r * 0.85 * Math.pow(Math.random(), 0.8);
    const stretch = 1 + 0.6 * Math.abs(Math.cos(angle - grain));
    const x = r + Math.cos(angle) * distance * stretch * 0.8;
    const y = r + Math.sin(angle) * distance;
    const fade = Math.max(0, 1 - distance / r);
    bubble(
      x,
      y,
      1.5 + Math.random() ** 2 * 5,
      (0.3 + Math.random() * 0.5) * Math.sqrt(fade),
    );
  }
  context.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 90; i++)
    bubble(
      random(6, size - 6),
      random(6, size - 6),
      random(1.5, 5),
      random(0.6, 1),
    );
  return canvas;
}

// Aerated water: lighter and greener than the sea around it.
function glowSprite() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const fill = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  fill.addColorStop(0, "rgb(120 190 190 / 1)");
  fill.addColorStop(0.6, "rgb(110 180 182 / 0.6)");
  fill.addColorStop(1, "rgb(100 170 175 / 0)");
  context.fillStyle = fill;
  context.fillRect(0, 0, size, size);
  return canvas;
}

export function createWakes(host, board) {
  const scene = host.parentElement;
  const canvas = document.createElement("canvas");
  canvas.className = "city-traffic-wake";
  canvas.setAttribute("aria-hidden", "true");
  host.before(canvas);
  const context = canvas.getContext("2d");
  const foam = Array.from({ length: SPRITES }, foamSprite);
  const glow = glowSprite();
  const boardPath = new Path2D(board);
  const frame = `M-20 -20H${SCENE.width + 20}V${SCENE.height + 20}H-20Z`;
  const wakes = [];
  const current = new Map();
  let unit = 1;
  let left = 0;
  let top = 0;

  // The traffic SVG slices the scene to fill the board; so does the canvas.
  function layout() {
    const width = scene.clientWidth;
    const height = scene.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const scale = Math.max(width / SCENE.width, height / SCENE.height);
    unit = scale * ratio;
    left = ((width - SCENE.width * scale) / 2) * ratio;
    top = ((height - SCENE.height * scale) / 2) * ratio;
  }
  layout();
  new ResizeObserver(layout).observe(scene);

  // Lays a sprite flat on the water at (x, y), turned to `angle`.
  function stamp(image, x, y, s, k, angle, size, alpha) {
    if (alpha < 0.004) return;
    const cos = Math.cos(angle) * s * unit;
    const sin = Math.sin(angle) * s * unit;
    context.setTransform(
      cos,
      k * sin,
      -sin,
      k * cos,
      x * unit + left,
      y * unit + top,
    );
    context.globalAlpha = Math.min(1, alpha);
    context.drawImage(image, -size / 2, -size / 2, size, size);
  }

  // A point `along` the heading and `across` it from (x, y), in scene pixels.
  const place = (p, along, across) => [
    p.x + p.s * (p.cos * along - p.sin * across),
    p.y + p.s * p.k * (p.sin * along + p.cos * across),
  ];

  function drawWake(wake, clock) {
    const { samples, half, beam } = wake;
    context.save();
    context.setTransform(unit, 0, 0, unit, left, top);
    context.clip(boardPath);
    for (const path of wake.occluders) context.clip(path, "evenodd");

    // Aerated streak, widening as it ages.
    for (const p of samples) {
      const age = clock - p.t;
      const life = 1 - age / LIFE;
      const [x, y] = place(p, -half, 0);
      stamp(
        glow,
        x,
        y,
        p.s,
        p.k,
        p.heading,
        beam * (0.9 + 0.3 * age),
        0.06 * p.strength * life * Math.exp(-age / 5),
      );
    }

    // Kelvin arms: a dark trough outside a lit crest, broken along its length.
    context.setTransform(unit, 0, 0, unit, left, top);
    context.lineCap = "butt";
    context.globalAlpha = 1;
    for (const side of [-1, 1]) {
      let previous = null;
      for (let i = samples.length - 1; i >= 0; i--) {
        const p = samples[i];
        const age = clock - p.t;
        const spread = beam * 0.45 + KELVIN * p.speed * age;
        const crest = place(p, half * 0.8, side * spread);
        const trough = place(p, half * 0.8, side * (spread + 1.6 + 0.25 * age));
        if (previous) {
          const fade = p.strength * Math.exp(-age / 3.5) * (1 - age / LIFE);
          const broken = 0.7 + 0.3 * Math.sin(i * 0.45 + p.seed);
          context.lineWidth = p.s * (1.1 + 0.35 * age);
          context.strokeStyle = `rgb(4 22 30 / ${0.18 * fade})`;
          context.beginPath();
          context.moveTo(...previous.trough);
          context.lineTo(...trough);
          context.stroke();
          context.lineWidth = p.s * (0.9 + 0.35 * age);
          context.strokeStyle = `rgb(${FOAM} / ${0.55 * fade * broken})`;
          context.beginPath();
          context.moveTo(...previous.crest);
          context.lineTo(...crest);
          context.stroke();
        }
        previous = { crest, trough };
      }
      // Foam riding the young part of each arm.
      for (let i = samples.length - 1; i >= 0; i -= 2) {
        const p = samples[i];
        const age = clock - p.t;
        if (age > 3.5) break;
        const [x, y] = place(
          p,
          half * 0.8,
          side * (beam * 0.45 + KELVIN * p.speed * age),
        );
        stamp(
          foam[(p.sprite + 3) % SPRITES],
          x,
          y,
          p.s,
          p.k,
          p.spin,
          5 + 2.5 * age,
          0.5 * p.strength * Math.exp(-age / 1.4),
        );
      }
    }

    // Transverse crests: arcs across the wake, travelling with the boat.
    const live = wake.live;
    if (live && live.speed > 2) {
      const wavelength = Math.max(14, half * 1.1);
      context.globalAlpha = 1;
      context.setTransform(unit, 0, 0, unit, left, top);
      for (let n = 1; n <= 4; n++) {
        const p =
          samples[samples.length - 1 - Math.round((n * wavelength) / STEP)];
        if (!p) break;
        const age = clock - p.t;
        const spread = beam * 0.45 + KELVIN * p.speed * age;
        const a = place(p, half * 0.8, -spread * 0.92);
        const b = place(p, half * 0.8, spread * 0.92);
        const c = place(p, half * 0.8 + spread * 0.5, 0);
        const fade = p.strength * 0.16 * Math.exp(-n / 2.2);
        context.lineWidth = p.s * 1.2;
        context.strokeStyle = `rgb(${FOAM} / ${fade})`;
        context.beginPath();
        context.moveTo(...a);
        context.quadraticCurveTo(...c, ...b);
        context.stroke();
      }
    }

    // Churned white water off the transom, spreading and breaking up; thin
    // strands of it linger along the track long after.
    for (const p of samples) {
      const age = clock - p.t;
      const [sx, sy] = place(
        p,
        -half - 1,
        (p.seed - 0.5) * beam * 0.3 * (1 + age * 0.4),
      );
      stamp(
        foam[(p.sprite + 1) % SPRITES],
        sx,
        sy,
        p.s,
        p.k * 0.7,
        p.heading,
        beam * (0.6 + 0.2 * age),
        0.3 * p.strength * Math.exp(-age / 4) * (1 - age / LIFE),
      );
      if (age > 5) continue;
      const drift = (p.seed - 0.5) * beam * 0.4 * (1 + age * 0.4);
      const [x, y] = place(p, -half - 1, drift);
      stamp(
        foam[p.sprite],
        x,
        y,
        p.s,
        p.k,
        p.spin + age * 0.15,
        beam * (0.5 + 0.18 * age),
        0.85 * p.strength * Math.exp(-age / 1.6),
      );
    }

    // Live foam at the boat itself: the bow wave peeling off both sides and
    // the prop wash boiling right behind the transom.
    if (live && live.speed > 0.5) {
      const strength = Math.min(1, live.speed / 14);
      for (const side of [-1, 1]) {
        const bow = place(live, half - 0.5, 0);
        const bend = place(live, half * 0.45, side * beam * 0.62);
        const end = place(live, -half * 0.25, side * beam * 0.78);
        // Broken foam along the same curve, flickering as it curls over.
        for (let i = 1; i <= 16; i++) {
          const u = i / 16;
          const x =
            (1 - u) ** 2 * bow[0] + 2 * u * (1 - u) * bend[0] + u * u * end[0];
          const y =
            (1 - u) ** 2 * bow[1] + 2 * u * (1 - u) * bend[1] + u * u * end[1];
          stamp(
            foam[(wake.sprite + i) % SPRITES],
            x,
            y,
            live.s,
            live.k,
            clock * 2 + i * 1.7 + side,
            beam * (0.2 + 0.2 * u),
            0.4 * strength * (1 - 0.5 * u),
          );
        }
      }
      const [x, y] = place(live, -half - 1.5, 0);
      // The first frame's clock can dip just below zero.
      stamp(
        foam[Math.floor(Math.abs(clock) * 6) % SPRITES],
        x,
        y,
        live.s,
        live.k,
        live.heading + clock * 1.3,
        beam * 0.9,
        0.7 * strength,
      );
    }
    context.restore();
  }

  return {
    // A boat sets off: its new wake is clipped like its lane.
    start(entity, occluders, beam) {
      this.stop(entity);
      const wake = {
        samples: [],
        half: entity.half,
        beam,
        mark: -Infinity,
        live: null,
        sprite: Math.floor(Math.random() * SPRITES),
        occluders: occluders.map((d) => new Path2D(`${frame}M${d}Z`)),
      };
      current.set(entity, wake);
      wakes.push(wake);
    },
    // The boat has left; its wake stays in the water until it fades.
    stop(entity) {
      const wake = current.get(entity);
      if (wake) wake.live = null;
      current.delete(entity);
    },
    track(entity, x, y, s, k, clock) {
      const wake = current.get(entity);
      if (!wake) return;
      const p = {
        x,
        y,
        s,
        k,
        cos: Math.cos(entity.heading),
        sin: Math.sin(entity.heading),
        heading: entity.heading,
        speed: entity.speed,
      };
      wake.live = p;
      if (entity.distance - wake.mark < STEP) return;
      wake.mark = entity.distance;
      wake.samples.push({
        ...p,
        t: clock,
        strength: Math.min(1, entity.speed / 14),
        seed: Math.random(),
        sprite: Math.floor(Math.random() * SPRITES),
        spin: Math.random() * Math.PI * 2,
      });
    },
    draw(clock) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = wakes.length - 1; i >= 0; i--) {
        const wake = wakes[i];
        while (wake.samples.length && clock - wake.samples[0].t > LIFE)
          wake.samples.shift();
        if (
          !wake.samples.length &&
          !wake.live &&
          ![...current.values()].includes(wake)
        ) {
          wakes.splice(i, 1);
          continue;
        }
        drawWake(wake, clock);
      }
      context.globalAlpha = 1;
    },
  };
}
