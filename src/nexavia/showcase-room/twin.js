import { initScenarios } from "./scenarios.js";
import {
  formatTime,
  initDaylight,
  luxAt,
  parseTime,
  sunTimes,
  wrap,
} from "./daylight.js";
import { initDataFlow } from "./dataflow.js";

// One showcase twin: a maquette and its Nexavia dashboard, driven by a
// config (city.js, marina.js):
//   devices(t)       switchable lighting [{ id, name, watts }]
//   group            { ids, subject, name(t) } for the dashboard's group switch
//   steps(t)         the automatic lighting program, one entry per event, each
//                    at a time of day: `at` is "day", "dawn" (the morning
//                    reading that ends the night), or "dusk" (the evening
//                    reading that trips the rule) plus minutes, "dusk+10";
//                    `log` is the step's timeline entries, [[kind, text]]
//   alarms(index)    ids of the standing alarms shown at a program step
//   tick(index, api) drifts the live readings for a program step
//   scenarios(t, n)  guided scenarios (see scenarios.js)
//   gateway          { id, at } the radio gateway on the model (dataflow.js)
//   effects          [init(root)] animations on the maquette

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Brings the maquette in. One scan line travels down the blueprint as the
// model loads, then turns into the reveal edge and travels back up while the
// model materialises from the base.
async function loadMaquette(root, en) {
  const art = root.querySelector("[data-city-art]");
  const photo = art?.querySelector(".city-photo");
  const loader = art?.querySelector("[data-city-loader]");
  if (!art || !photo) return;
  const stage = loader?.querySelector("[data-loader-stage]");
  const percent = loader?.querySelector("[data-loader-pct]");
  const quick = reducedMotion.matches;

  // Loading progress (0–1) from the real stages, and the value shown on
  // screen. The shown value only moves forward and never runs ahead of a
  // fixed minimum duration, so a fast or cached load always plays the same
  // single sweep while the blueprint finishes drawing; a slow load follows
  // the real download.
  const minDuration = quick ? 0 : 3000;
  let target = 0;
  let loaded = false;
  let indeterminate = false;
  let shown = 0;
  let finish;
  const swept = new Promise((resolve) => (finish = resolve));
  const start = performance.now();
  let last = start;
  // Stage text follows the shown progress, so it always matches the sweep.
  const stages = en
    ? [
        [0.86, "Loading the lighting"],
        [0.95, "Starting the simulation"],
      ]
    : [
        [0.86, "Nalaganje razsvetljave"],
        [0.95, "Zagon simulacije"],
      ];
  const render = (value) => {
    art.style.setProperty("--load", value.toFixed(4));
    if (percent) percent.textContent = String(Math.round(value * 100));
    const label = stages.findLast(([from]) => value >= from)?.[1];
    if (stage && label && stage.textContent !== label)
      stage.textContent = label;
  };
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const elapsed = now - start;
    let goal = target;
    // Without a known file size, creep forward on a slowing curve.
    if (indeterminate)
      goal = Math.max(goal, 0.86 * (1 - Math.exp(-elapsed / 4000)));
    goal = Math.min(goal, minDuration ? elapsed / minDuration : 1);
    shown = quick ? goal : shown + (goal - shown) * Math.min(1, dt * 5);
    if (loaded && goal >= 1 && shown > 0.996) {
      render(1);
      finish();
      return;
    }
    render(shown);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  const download = art.twinPhoto;
  let src = photo.dataset.src;
  if (download) {
    // A maquette on a tab opened later starts its download now.
    download.start?.();
    const onBytes = ({ loaded: bytes, total }) => {
      if (total) target = Math.max(target, Math.min(1, bytes / total) * 0.86);
    };
    download.listeners.add(onBytes);
    onBytes(download);
    indeterminate = !download.total;
    src = await download.ready;
    download.listeners.delete(onBytes);
    indeterminate = false;
  }
  photo.src = src;
  await photo.decode().catch(() => {});
  target = 0.86;
  await Promise.all(
    [...art.querySelectorAll(".city-light-off")].map(async (patch) => {
      const image = new Image();
      image.src = patch.getAttribute("href");
      await image.decode().catch(() => {});
    }),
  );
  target = 1;
  loaded = true;
  await swept;
  await wait(quick ? 0 : 160);
  art.classList.remove("is-loading");
  art.classList.add("is-revealing");
  await wait(quick ? 220 : 1250);
  art.classList.remove("is-revealing");
  art.classList.add("is-ready");
  art.removeAttribute("aria-busy");
  loader?.remove();
  art.querySelector(".city-loader-edge")?.remove();
}

export function initTwin(root, config) {
  config.effects?.forEach((init) => init(root));
  const en = document.documentElement.lang.startsWith("en");
  const t = (sl, english) => (en ? english : sl);
  const n = (value, digits) =>
    value.toFixed(digits).replace(".", en ? "." : ",");
  const cityWrap = root.querySelector(".twin-scene-wrap");
  const workspace = root.querySelector(".twin-workspace");
  const fullscreenButton = root.querySelector("[data-city-fullscreen]");
  const screenOverlay = root.querySelector(".xdr-display");
  const overlayDrag = root.querySelector("[data-overlay-drag]");
  const overlayOpacity = root.querySelector("[data-overlay-opacity]");
  const overlayToggle = root.querySelector("[data-overlay-toggle]");
  const overlayClose = root.querySelector("[data-overlay-close]");
  const resizeEdges = root.querySelectorAll("[data-overlay-resize]");
  const screenViewport = root.querySelector(".xdr-screen");
  const screenBezel = root.querySelector(".xdr-bezel");
  const centerSideResizeEdges = () => {
    if (!screenViewport || !screenBezel) return;
    const screenRect = screenViewport.getBoundingClientRect();
    const bezelRect = screenBezel.getBoundingClientRect();
    // The screen's upper content is tucked under the bezel lip; bias the grip
    // center slightly down so the visible marks align with the bezel midpoint.
    const center = screenRect.top - bezelRect.top + screenRect.height / 2 + 18;
    resizeEdges.forEach((edge) => {
      if (
        edge.dataset.overlayResize === "left" ||
        edge.dataset.overlayResize === "right"
      ) {
        edge.style.top = `${center}px`;
        edge.style.transform = "translateY(-50%)";
      } else if (edge.dataset.overlayResize === "bottom") {
        const lowerBezelGap = bezelRect.bottom - screenRect.bottom;
        const handleHeight = edge.getBoundingClientRect().height;
        // Center the visible stroke inside the display's lower frame lip.
        const handleCenter =
          bezelRect.height - Math.max(1, lowerBezelGap) / 2 - 2;
        edge.style.bottom = "auto";
        edge.style.top = `${handleCenter - handleHeight / 2}px`;
      }
    });
  };
  if (screenViewport && screenBezel) {
    if ("ResizeObserver" in window)
      new ResizeObserver(centerSideResizeEdges).observe(screenViewport);
    window.addEventListener("resize", centerSideResizeEdges, { passive: true });
    requestAnimationFrame(centerSideResizeEdges);
  }
  if (workspace && fullscreenButton) {
    const updateFullscreenButton = () => {
      const active = document.fullscreenElement === workspace;
      fullscreenButton.setAttribute("aria-pressed", String(active));
      fullscreenButton.textContent = active
        ? t("Zapri celozaslonski pogled", "Exit full screen")
        : t("Odpri celozaslonski pogled", "Open full screen");
    };
    fullscreenButton.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement === workspace)
          await document.exitFullscreen();
        else await workspace.requestFullscreen();
      } catch (error) {
        console.error("Unable to change fullscreen mode", error);
      }
    });
    document.addEventListener("fullscreenchange", updateFullscreenButton);
    updateFullscreenButton();
  }
  if (workspace && screenOverlay && overlayDrag) {
    const keepOverlayVisible = () => {
      if (screenOverlay.classList.contains("is-minimized")) return;
      const frame = workspace.getBoundingClientRect();
      const overlay = screenOverlay.getBoundingClientRect();
      if (!frame.width || !frame.height) return;
      const width = Math.min(overlay.width, Math.max(180, frame.width - 16));
      const height = Math.min(overlay.height, Math.max(160, frame.height - 16));
      const left = Math.max(
        0,
        Math.min(frame.width - width - 8, overlay.left - frame.left),
      );
      const top = Math.max(
        0,
        Math.min(frame.height - height - 8, overlay.top - frame.top),
      );
      if (width !== overlay.width) screenOverlay.style.width = `${width}px`;
      if (height !== overlay.height) screenOverlay.style.height = `${height}px`;
      screenOverlay.style.left = `${left}px`;
      screenOverlay.style.top = `${top}px`;
      screenOverlay.style.right = "auto";
    };
    const setOverlayMinimized = (minimized) => {
      screenOverlay.classList.toggle("is-minimized", minimized);
      if (overlayToggle) {
        overlayToggle.setAttribute("aria-pressed", String(!minimized));
        overlayToggle.textContent = minimized
          ? t("Prikaži nadzorno ploščo", "Show dashboard")
          : t("Skrij nadzorno ploščo", "Hide dashboard");
      }
      if (!minimized) requestAnimationFrame(keepOverlayVisible);
    };
    setOverlayMinimized(window.matchMedia("(max-width: 980px)").matches);
    overlayToggle?.addEventListener("click", () => {
      setOverlayMinimized(!screenOverlay.classList.contains("is-minimized"));
    });
    overlayClose?.addEventListener("click", () => {
      setOverlayMinimized(true);
      overlayToggle?.focus({ preventScroll: true });
    });
    requestAnimationFrame(keepOverlayVisible);
    window.addEventListener("resize", keepOverlayVisible, { passive: true });
    document.addEventListener("fullscreenchange", () =>
      requestAnimationFrame(keepOverlayVisible),
    );
    let overlayDragStart = null;
    overlayDrag.addEventListener("pointerdown", (event) => {
      if (event.target.closest("input, button")) return;
      screenOverlay.dataset.placed = "visitor";
      const frame = workspace.getBoundingClientRect();
      const overlay = screenOverlay.getBoundingClientRect();
      overlayDragStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: overlay.left - frame.left,
        top: overlay.top - frame.top,
      };
      overlayDrag.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    overlayDrag.addEventListener("pointermove", (event) => {
      if (!overlayDragStart || event.pointerId !== overlayDragStart.pointerId)
        return;
      const frame = workspace.getBoundingClientRect();
      const maxLeft = Math.max(0, frame.width - screenOverlay.offsetWidth);
      const maxTop = Math.max(0, frame.height - screenOverlay.offsetHeight - 8);
      const left = Math.max(
        0,
        Math.min(
          maxLeft,
          overlayDragStart.left + event.clientX - overlayDragStart.x,
        ),
      );
      const top = Math.max(
        0,
        Math.min(
          maxTop,
          overlayDragStart.top + event.clientY - overlayDragStart.y,
        ),
      );
      screenOverlay.style.left = `${left}px`;
      screenOverlay.style.top = `${top}px`;
      screenOverlay.style.right = "auto";
    });
    const finishOverlayDrag = () => {
      overlayDragStart = null;
    };
    overlayDrag.addEventListener("pointerup", finishOverlayDrag);
    overlayDrag.addEventListener("pointercancel", finishOverlayDrag);
    overlayOpacity?.addEventListener("input", () => {
      screenOverlay.style.setProperty(
        "--overlay-opacity",
        String(Number(overlayOpacity.value) / 100),
      );
    });
    resizeEdges.forEach((edge) =>
      edge.addEventListener("pointerdown", (event) => {
        screenOverlay.dataset.placed = "visitor";
        const frame = workspace.getBoundingClientRect();
        const overlay = screenOverlay.getBoundingClientRect();
        const direction = edge.dataset.overlayResize;
        const resizeWidth =
          direction === "left" ||
          direction === "right" ||
          direction === "width" ||
          direction.length === 2;
        const resizeHeight =
          direction === "bottom" ||
          direction === "height" ||
          direction.length === 2;
        const west =
          direction === "left" ||
          direction === "width" ||
          direction.includes("w");
        const north = direction.includes("n");
        const start = {
          x: event.clientX,
          y: event.clientY,
          width: overlay.width,
          height: overlay.height,
          left: overlay.left - frame.left,
          top: overlay.top - frame.top,
        };
        edge.setPointerCapture(event.pointerId);
        const resize = (moveEvent) => {
          if (moveEvent.pointerId !== event.pointerId) return;
          screenOverlay.classList.add("is-resized");
          let width = start.width;
          let height = start.height;
          let left = start.left;
          let top = start.top;
          if (resizeWidth) {
            const minWidth = Math.min(240, frame.width - 16);
            const maxWidth = Math.max(
              minWidth,
              Math.min(
                frame.width - 16,
                west
                  ? start.left + start.width - 8
                  : frame.width - start.left - 8,
              ),
            );
            const deltaX = moveEvent.clientX - start.x;
            width = Math.max(
              minWidth,
              Math.min(maxWidth, start.width + deltaX * (west ? -1 : 1)),
            );
            if (west) left = start.left + start.width - width;
          }
          if (resizeHeight) {
            const minHeight = Math.min(180, frame.height - 16);
            const maxHeight = Math.max(
              minHeight,
              Math.min(
                frame.height - 16,
                north
                  ? start.top + start.height - 8
                  : frame.height - start.top - 8,
              ),
            );
            const deltaY = moveEvent.clientY - start.y;
            height = Math.max(
              minHeight,
              Math.min(maxHeight, start.height + deltaY * (north ? -1 : 1)),
            );
            if (north) top = start.top + start.height - height;
          }
          screenOverlay.style.width = `${width}px`;
          screenOverlay.style.height = `${height}px`;
          screenOverlay.style.left = `${left}px`;
          screenOverlay.style.top = `${top}px`;
          screenOverlay.style.right = "auto";
          centerSideResizeEdges();
        };
        const finish = (endEvent) => {
          if (endEvent.pointerId !== event.pointerId) return;
          edge.removeEventListener("pointermove", resize);
          edge.removeEventListener("pointerup", finish);
          edge.removeEventListener("pointercancel", finish);
        };
        edge.addEventListener("pointermove", resize);
        edge.addEventListener("pointerup", finish);
        edge.addEventListener("pointercancel", finish);
        event.preventDefault();
      }),
    );
  }
  // The dashboard's light or dark theme, shared by every twin on the page.
  const themeToggle = root.querySelector("[data-screen-theme]");
  themeToggle?.addEventListener("click", () => {
    const dark = themeToggle.getAttribute("aria-pressed") !== "true";
    const page = root.closest("[data-twin-root]") ?? root;
    page
      .querySelectorAll("[data-screen-theme]")
      .forEach((toggle) => toggle.setAttribute("aria-pressed", String(dark)));
    page
      .querySelectorAll(".xdr-screen")
      .forEach((screen) => (screen.dataset.scheme = dark ? "carbon" : "white"));
  });
  // A press only becomes a drag once it moves past this many CSS pixels, so a
  // tap on a lamp or building stays a click and a drag never switches lights.
  const dragThreshold = { mouse: 5, pen: 8, touch: 10 };
  let lastPointerType = "mouse";
  let dragged = false;
  if (cityWrap) {
    let panX = 0;
    let panY = 0;
    let pointers = new Map();
    let dragStart = null;
    const renderPan = () => {
      const rect = cityWrap.getBoundingClientRect();
      const art = root.querySelector("[data-city-art]");
      const width = art?.offsetWidth || rect.width;
      const height = art?.offsetHeight || rect.height;
      const limitX = Math.max(0, (width - rect.width) / 2);
      const limitY = Math.max(0, (height - rect.height) / 2);
      panX = Math.max(-limitX, Math.min(limitX, panX));
      panY = Math.max(-limitY, Math.min(limitY, panY));
      if (art) art.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
    };
    cityWrap.addEventListener("pointerdown", (event) => {
      lastPointerType = event.pointerType;
      dragged = false;
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
      });
      if (pointers.size === 1)
        dragStart = {
          x: event.clientX,
          y: event.clientY,
          panX,
          panY,
        };
      else dragStart = null;
    });
    cityWrap.addEventListener("pointermove", (event) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!pointer.dragging) {
        const moved = Math.hypot(
          pointer.x - pointer.startX,
          pointer.y - pointer.startY,
        );
        if (moved < (dragThreshold[event.pointerType] ?? 6)) return;
        pointer.dragging = true;
        dragged = true;
        // Capture only once it is a drag, so short presses still click the
        // lamp, building or sensor under the pointer.
        cityWrap.setPointerCapture(event.pointerId);
      }
      if (pointers.size === 1 && dragStart) {
        panX = dragStart.panX + event.clientX - dragStart.x;
        panY = dragStart.panY + event.clientY - dragStart.y;
        renderPan();
      }
    });
    // Swallow the click that follows a drag.
    cityWrap.addEventListener(
      "click",
      (event) => {
        if (event.detail && dragged) {
          event.stopPropagation();
          event.preventDefault();
        }
      },
      true,
    );
    const releasePointer = (event) => {
      pointers.delete(event.pointerId);
      if (pointers.size === 1) {
        const [point] = pointers.values();
        dragStart = { x: point.x, y: point.y, panX, panY };
      } else dragStart = null;
    };
    cityWrap.addEventListener("pointerup", releasePointer);
    cityWrap.addEventListener("pointercancel", releasePointer);
    window.addEventListener("resize", renderPan, { passive: true });
    renderPan();
  }
  const devices = config.devices(t).map((device) => ({
    ...device,
    // The one state for each device, read by the maquette and the dashboard.
    // `mode` is "auto" while the simulated lighting rule drives the device,
    // and "manual" after a visitor's command, until control is handed back.
    state: 0,
    mode: "auto",
    // False while the device cannot reach Nexavia (e.g. gateway outage).
    online: true,
    // The level the maquette shows or has been sent (see showOnModel).
    sent: undefined,
  }));
  const deviceById = new Map(devices.map((device) => [device.id, device]));
  const steps = config.steps(t);
  const $ = (selector) => root.querySelector(selector);
  const ui = (name) => root.querySelector(`[data-ui="${name}"]`);
  // The app's sections: Overview shows every panel, the other views the
  // panels that name them (data-in). The heading takes the section's name.
  const dashboard = $(".twin-dashboard");
  const viewTabs = [...root.querySelectorAll("[data-view-tab]")];
  const viewTitle = ui("view-title");
  const overviewTitle = viewTitle?.textContent;
  function setView(view) {
    if (!dashboard || dashboard.dataset.view === view) return;
    dashboard.dataset.view = view;
    viewTabs.forEach((tab) => {
      const current = tab.dataset.viewTab === view;
      if (current) tab.setAttribute("aria-current", "page");
      else tab.removeAttribute("aria-current");
      if (current && viewTitle)
        viewTitle.textContent =
          view === "overview"
            ? overviewTitle
            : tab.querySelector("span").textContent;
    });
    if (screenViewport) screenViewport.scrollTop = 0;
  }
  viewTabs.forEach((tab) =>
    tab.addEventListener("click", () => setView(tab.dataset.viewTab)),
  );
  root
    .querySelectorAll("[data-view-jump]")
    .forEach((control) =>
      control.addEventListener("click", () =>
        setView(control.dataset.viewJump),
      ),
    );
  let index = 0;
  let paused = false;
  let visible = true;
  // The simulation starts once the maquette has been revealed.
  let ready = false;
  // True while a guided scenario directs the scene; the rule is suspended.
  let directed = false;
  // True while a scenario replays earlier steps: no packets, no delays.
  let quiet = false;
  let timer;

  // The lighting program runs on a day clock. The light sensor follows the
  // sun (daylight.js); each step fires at its time of day, and the clock
  // slows down around the steps so every event can be read.
  const maxLux = Math.max(...steps.map((step) => step.lux));
  const sun = sunTimes(
    maxLux,
    steps.find((step) => step.at === "dusk")?.lux ?? maxLux / 2,
    maxLux - 0.5,
  );
  const stepTimes = steps.map(({ at = "day" }) => {
    const [, base, offset = 0] = /^(day|dawn|dusk)([+-]\d+)?$/.exec(at);
    return wrap(
      { day: sun.dawn + 1, dawn: sun.dawn, dusk: sun.dusk }[base] +
        Number(offset) / 60,
    );
  });
  const hoursApart = (a, b) => Math.min(wrap(a - b), wrap(b - a));
  // The step in effect at an hour: the last one to have fired.
  const stepAt = (hours) =>
    stepTimes.reduce(
      (best, time, i) =>
        wrap(hours - time) < wrap(hours - stepTimes[best]) ? i : best,
      0,
    );
  // Simulated hours per second: an hour a second, three minutes a second
  // around each step (a full day takes about 40 s).
  const rate = (hours) => {
    const near = Math.min(...stepTimes.map((time) => hoursApart(hours, time)));
    const k = Math.min(1, Math.max(0, (near - 0.08) / 0.5));
    return 0.05 + 0.95 * k * k * (3 - 2 * k);
  };
  // The page opens in the late afternoon, shortly before the evening program.
  let clock = wrap(sun.dusk - 0.75);
  let clockFrame = 0;
  let lastFrame = 0;
  const sky = initDaylight(root, {
    t,
    onScrub(hours) {
      if (directed) return;
      if (!paused) setPaused(true);
      setClock(hours);
    },
  });
  sky?.setMarks([
    [
      stepTimes[steps.findIndex((step) => step.at === "dusk")],
      t("Pravilo prižge luči", "The rule switches the lights on"),
    ],
    [
      stepTimes[steps.findIndex((step) => step.at === "dawn")],
      t("Pravilo ugasne luči", "The rule switches the lights off"),
    ],
  ]);
  const flow = initDataFlow(root, { gateway: config.gateway });

  // Sets the time of day: the sky, the ambient light reading (the dashboard
  // tile and the light sensor's card) and, unless a scenario directs the
  // scene, the program step for that hour.
  const luxReadings = root.querySelectorAll('[data-reading="lux"]');
  function setClock(hours, ease = false) {
    clock = wrap(hours);
    sky?.setTime(clock, ease);
    const lux = `${luxAt(clock, maxLux)} lx`;
    luxReadings.forEach(
      (element) => element.textContent !== lux && (element.textContent = lux),
    );
    if (directed) return;
    const at = stepAt(clock);
    if (at === index) return;
    index = at;
    render(steps[index]);
  }
  function runClock(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000);
    lastFrame = now;
    setClock(clock + rate(clock) * dt);
    clockFrame = requestAnimationFrame(runClock);
  }
  // Between steps the meters and sensors keep reporting; the light sensor's
  // value follows the clock, so only its report is sent here.
  let reports = 0;
  const report = () => {
    config.tick(++reports, readingApi);
    flow?.uplink("lux");
    received.set("lux", performance.now());
  };

  // When each reading last reached Nexavia, for the sensor cards.
  const received = new Map();
  // Readings: every element showing a reading carries data-reading="key" —
  // the dashboard row and the sensor's card on the maquette. `card` is the
  // card's own text where it differs from the dashboard's.
  function setReading(key, text, note, card = text) {
    if (!quiet) {
      flow?.uplink(key);
      received.set(key, performance.now());
    }
    root.querySelectorAll(`[data-reading="${key}"]`).forEach((element) => {
      const onCard = element.closest(".city-sensor-popover");
      const value = onCard ? card : text;
      // Dashboard readings keep a <small> note after the value text.
      if (element.firstElementChild) {
        element.firstChild.textContent = value;
        if (note !== undefined)
          element.querySelector("small").textContent = note;
      } else element.textContent = value;
    });
  }
  const readingText = (key) => {
    const element = $(`.twin-dashboard [data-reading="${key}"]`);
    return element
      ? element.firstElementChild
        ? element.firstChild.textContent
        : element.textContent
      : "";
  };
  const readingNote = (key) =>
    $(`.twin-dashboard [data-reading="${key}"] small`)?.textContent ?? "";
  const readingApi = { setReading, en, t, n };

  function setDemoPill(count) {
    ui("alarm-count").textContent = String(count);
    $(".twin-demo-pill").innerHTML =
      `<i></i> ${count} ${en ? "ALARMS" : "ALARMI"}`;
    const badge = $("[data-alarm-badge]");
    if (badge) {
      badge.textContent = String(count);
      badge.hidden = !count;
    }
  }

  // `log: false` re-applies a step without adding it to the timeline again.
  function render(step, { log = true } = {}) {
    const standing = config.alarms(index);
    root
      .querySelectorAll("[data-alarm]")
      .forEach(
        (alarm) => (alarm.hidden = !standing.includes(alarm.dataset.alarm)),
      );
    setDemoPill(standing.length);
    config.tick(index, readingApi);
    if (!quiet && log) {
      // The light reading that moves the program on travels up first.
      if (step.log.some(([kind]) => kind === "reading")) {
        flow?.uplink("lux", { now: true });
        received.set("lux", performance.now());
      }
      step.log.forEach(([kind, text]) => logEvent(text, undefined, kind));
    }
    // A visitor's command stays the current status for a moment before the
    // simulation's next step replaces it.
    if (performance.now() >= commandShownUntil) {
      ui("rule-status").textContent = step.rule;
      ui("step").textContent = step.text;
    }
    // The lighting rule proposes states; devices under manual control keep
    // the visitor's choice.
    devices.forEach((device, i) => {
      if (device.mode === "auto") device.state = step.states[i];
    });
    renderDevices();
  }

  let commandShownUntil = 0;
  // The dashboard's timeline: the latest events, newest first, each typed so
  // a visitor can follow a reading to the decision and the command it led
  // to. An entry that names a sensor or device (by its id at the start of
  // the text, or `target`) points at it on the maquette.
  const timeline = ui("timeline");
  const TIMELINE_LENGTH = 7;
  const kinds = {
    reading: t("Meritev", "Reading"),
    decision: t("Odločitev", "Decision"),
    command: t("Ukaz", "Command"),
    alarm: t("Alarm", "Alarm"),
    notify: t("Obvestilo", "Notification"),
    manual: t("Ročno", "Manual"),
    system: "Nexavia",
  };
  const targets = new Map([
    ...[...root.querySelectorAll("[data-sensor-pin][data-sensor-id]")].map(
      (pin) => [pin.dataset.sensorId, `sensor:${pin.dataset.sensorPin}`],
    ),
    ...devices.map(({ id }) => [id, `device:${id}`]),
  ]);
  // `time` is the model's clock unless given, e.g. a guided scenario's own.
  function logEvent(
    text,
    time = formatTime(clock),
    kind = "system",
    target = targets.get(/^[A-Z][A-Z0-9_]*/.exec(text)?.[0]),
  ) {
    if (!timeline) return;
    const item = document.createElement("li");
    item.dataset.kind = kinds[kind] ? kind : "system";
    const entry = document.createElement(target ? "button" : "div");
    entry.className = "twin-timeline-entry";
    if (target) {
      entry.type = "button";
      entry.dataset.target = target;
      entry.title = t("Pokaži na maketi", "Show on the model");
    }
    const part = (tag, className, content) =>
      Object.assign(document.createElement(tag), {
        className,
        textContent: content,
      });
    entry.append(
      part("time", "", time),
      part("span", "twin-timeline-kind", kinds[item.dataset.kind]),
      part("span", "twin-timeline-text", text),
    );
    item.append(entry);
    timeline.querySelector(".is-empty")?.remove();
    timeline.prepend(item);
    while (timeline.children.length > TIMELINE_LENGTH)
      timeline.lastElementChild.remove();
  }

  // The maquette shows a device's light once its command arrives: at once,
  // or after the packet's trip while the data flow is shown.
  function showOnModel(device) {
    if (device.sent === device.state) return;
    device.sent = device.state;
    const wait = quiet ? 0 : (flow?.downlink(device.id, device.online) ?? 0);
    clearTimeout(device.paintTimer);
    if (wait) device.paintTimer = setTimeout(() => paintModel(device), wait);
    else paintModel(device);
  }
  function paintModel(device) {
    const level = device.sent;
    const on = level > 0;
    const patch = root.querySelector(`[data-light-off="${device.id}"]`);
    if (patch) {
      patch.classList.toggle("is-off", !on);
      // A dimmed light shows part of its unlit patch.
      patch.style.opacity = on && level < 1 ? String((1 - level) * 0.85) : "";
    }
    // A pier light's reflection dims with it.
    const glint = root.querySelector(`[data-light-glint="${device.id}"]`);
    if (glint) glint.style.opacity = on ? String(level) : "0";
    // At night its light falls through the dark.
    sky?.setLevel(device.id, level);
  }

  // Projects the device state onto everything that shows it: the maquette's
  // light patches and hotspots, the dashboard rows, and the KPI totals.
  function renderDevices(changed = []) {
    let power = 0;
    let active = 0;
    devices.forEach((device) => {
      const on = device.state > 0;
      const dimmed = on && device.state < 1;
      const watts = Math.round(device.watts * device.state);
      power += watts;
      if (on) active++;
      showOnModel(device);
      root
        .querySelector(`[data-device="${device.id}"]`)
        ?.setAttribute("aria-pressed", String(on));
      const row = root.querySelector(`[data-row="${device.id}"]`);
      if (!row) return;
      const state = row.querySelector(".twin-state");
      row.classList.toggle("is-offline", !device.online);
      if (!device.online) {
        state.textContent = t("Ni povezave", "Offline");
        state.dataset.state = "offline";
      } else {
        const percent = Math.round(device.state * 100);
        state.textContent = dimmed
          ? t(`Zatemnjeno ${percent} %`, `Dimmed ${percent}%`)
          : on
            ? t("Vklopljeno", "On")
            : t("Izklopljeno", "Off");
        state.dataset.state = on ? "on" : "off";
      }
      row.querySelector(".twin-watts").textContent = `${watts} W`;
      row
        .querySelector("[data-device-switch]")
        ?.setAttribute("aria-checked", String(on));
      const modeTag = row.querySelector("[data-mode-tag]");
      if (modeTag) modeTag.hidden = device.mode !== "manual";
      if (changed.includes(device.id)) {
        row.classList.remove("is-updated");
        void row.offsetWidth;
        row.classList.add("is-updated");
      }
    });
    ui("active").textContent = `${active} / ${devices.length}`;
    ui("power").textContent = `${power} W`;
    updateChip();
    const autoButton = $("[data-devices-auto]");
    if (autoButton)
      autoButton.hidden = !devices.some((device) => device.mode === "manual");
  }

  // Jumps the clock to the next step.
  function next() {
    setClock(stepTimes[(index + 1) % steps.length]);
  }
  function schedule() {
    clearInterval(timer);
    const running =
      ready && !directed && !paused && visible && !reducedMotion.matches;
    if (running) {
      timer = setInterval(report, 3200);
      if (!clockFrame) {
        lastFrame = performance.now();
        clockFrame = requestAnimationFrame(runClock);
      }
    } else if (clockFrame) {
      cancelAnimationFrame(clockFrame);
      clockFrame = 0;
    }
    root.classList.toggle(
      "is-paused",
      paused || !visible || reducedMotion.matches,
    );
  }
  // Pause state is shown in two places: the pause button and the status
  // pill (green while running, orange while stopped).
  function setPaused(value) {
    paused = value;
    ui("pause").textContent = paused
      ? t("Nadaljuj animacijo", "Resume animation")
      : t("Začasno ustavi", "Pause");
    ui("pause").setAttribute("aria-pressed", String(paused));
    const status = $(".twin-live");
    status.classList.toggle("is-stopped", paused);
    status.lastChild.textContent = paused
      ? t(" Simulacija ustavljena", " Simulation paused")
      : t(" Simulacija teče", " Simulation running");
    schedule();
  }
  ui("pause").addEventListener("click", () => setPaused(!paused));
  ui("next").addEventListener("click", next);
  // Opens one reading card on the maquette (or none) and marks its pin.
  function pinCard(name) {
    root
      .querySelectorAll(".city-sensor-popover[data-pinned='true']")
      .forEach((item) => (item.dataset.pinned = "false"));
    root
      .querySelectorAll("[data-sensor-pin]")
      .forEach((pin) =>
        pin.setAttribute(
          "aria-expanded",
          String(pin.dataset.sensorPin === name),
        ),
      );
    const popover =
      name && root.querySelector(`[data-sensor-popover="${name}"]`);
    if (popover) popover.dataset.pinned = "true";
  }
  const openCard = () =>
    root.querySelector("[data-sensor-pin][aria-expanded='true']");
  // Sends a sensor's current reading to Nexavia on request: a packet travels
  // to the gateway (shown even while the data flow is off) and the timeline
  // logs the reading once it arrives, or its loss while the gateway is down.
  function sendReading(key, { log = true } = {}) {
    if (quiet) return;
    const pin = $(`[data-sensor-pin="${key}"]`);
    const id = pin?.dataset.sensorId ?? key;
    const arrive = () => {
      received.set(key, performance.now());
      renderAge();
      if (!log) return;
      const note =
        pin?.hasAttribute("data-sensor-event-note") && readingNote(key);
      logEvent(
        `${id} · ${pin?.dataset.sensorEvent ?? key}: ${readingText(key)}${note ? `, ${note}` : ""}`,
        undefined,
        "reading",
      );
    };
    const lost = () =>
      log &&
      logEvent(
        `${id} · ${t("Meritev ni dostavljena – prehod brez povezave", "Reading not delivered – gateway offline")}`,
        undefined,
        "alarm",
      );
    if (!flow?.uplink(key, { now: true, trace: true, arrive, lost })) arrive();
  }
  // A click on a pin opens its card and sends the sensor's reading.
  root.querySelectorAll("[data-sensor-pin]").forEach((control) => {
    control.addEventListener("click", () => {
      // A second click on the open pin closes its card.
      if (control.getAttribute("aria-expanded") === "true") {
        pinCard(null);
        return;
      }
      const key = control.dataset.sensorPin;
      if (!directed) setPaused(true);
      pinCard(key);
      sendReading(key);
      renderAge();
      ui("step").textContent = control.dataset.sensorName;
      root
        .querySelectorAll("[data-device-hint]")
        .forEach((hint) => hint.classList.add("is-quiet"));
    });
  });
  root
    .querySelectorAll("[data-sensor-send]")
    .forEach((control) =>
      control.addEventListener("click", () =>
        sendReading(control.dataset.sensorSend),
      ),
    );
  // Each card names the gateway its readings travel through, and how long
  // ago the last one arrived.
  root
    .querySelectorAll("[data-card-gateway]")
    .forEach((element) => (element.textContent = config.gateway?.id ?? "–"));
  function renderAge() {
    const card = root.querySelector(".city-sensor-popover[data-pinned='true']");
    const age = card?.querySelector("[data-card-age]");
    if (!age) return;
    const at = received.get(card.dataset.sensorPopover);
    const seconds =
      at === undefined ? null : Math.round((performance.now() - at) / 1000);
    age.textContent =
      seconds === null
        ? "–"
        : seconds < 2
          ? t("pravkar", "just now")
          : seconds < 60
            ? t(`pred ${seconds} s`, `${seconds} s ago`)
            : t(
                `pred ${Math.floor(seconds / 60)} min`,
                `${Math.floor(seconds / 60)} min ago`,
              );
  }
  setInterval(renderAge, 1000);
  // A timeline entry points at its sensor or device on the maquette.
  timeline?.addEventListener("click", (event) => {
    const entry = event.target.closest("[data-target]");
    if (!entry) return;
    const [type, name] = entry.dataset.target.split(":");
    if (type === "sensor") {
      pinCard(name);
      renderAge();
    } else {
      const hotspot = $(`[data-device="${name}"]`);
      if (hotspot) showChip(hotspot, true);
    }
  });
  // A visitor's card closes on Escape or a click elsewhere; a guided
  // scenario keeps the card it opened.
  root.addEventListener("click", (event) => {
    if (directed || !openCard()) return;
    if (
      event.target.closest(
        "[data-sensor-pin], .city-sensor-popover, .twin-timeline [data-target]",
      )
    )
      return;
    pinCard(null);
  });
  root.addEventListener("keydown", (event) => {
    const pin = openCard();
    if (event.key !== "Escape" || directed || !pin) return;
    pinCard(null);
    pin.focus({ preventScroll: true });
  });
  const sensorsToggle = root.querySelector("[data-sensors-toggle]");
  sensorsToggle?.addEventListener("click", () => {
    const on = sensorsToggle.getAttribute("aria-pressed") !== "true";
    sensorsToggle.setAttribute("aria-pressed", String(on));
    sensorsToggle.closest("[data-city-art]").dataset.overlays = on
      ? "on"
      : "off";
    if (!on) pinCard(null);
  });
  // Live readings. Each card keeps a short history for its sparkline; its pin
  // pulses on every new reading, shows it in the hover label and turns to an
  // alarm at the sensor's threshold (data-alert).
  root.querySelectorAll("[data-sensor-popover]").forEach((card, i) => {
    const value = card.querySelector("[data-sensor-value]");
    if (!value) return;
    const pin = root.querySelector(
      `[data-sensor-pin="${card.dataset.sensorPopover}"]`,
    );
    const tag = pin?.querySelector("[data-sensor-tag]");
    const alert = Number(card.dataset.alert) || Infinity;
    const read = () => parseFloat(value.textContent.replace(",", "."));
    // Seed a plausible recent history so the sparkline is never empty;
    // counters only ever count up.
    const first = read() || 0;
    const counting = config.counters?.includes(card.dataset.sensorPopover);
    const history = Array.from({ length: 24 }, (_, j) =>
      counting
        ? Math.max(0, first - Math.round((23 - j) * 1.6))
        : first *
          (1 +
            0.05 * Math.sin(j * 0.7 + i) +
            0.025 * Math.sin(j * 1.9 + i * 2)),
    );
    history[history.length - 1] = first;
    const ns = "http://www.w3.org/2000/svg";
    const spark = document.createElementNS(ns, "svg");
    spark.setAttribute("class", "city-popover-spark");
    spark.setAttribute("viewBox", "0 0 100 28");
    spark.setAttribute("preserveAspectRatio", "none");
    spark.setAttribute("aria-hidden", "true");
    const area = spark.appendChild(document.createElementNS(ns, "path"));
    const line = spark.appendChild(document.createElementNS(ns, "path"));
    card.append(spark);
    const draw = () => {
      const low = Math.min(...history);
      const range = Math.max(...history) - low || Math.abs(low) * 0.1 || 1;
      const points = history.map(
        (v, j) =>
          `${((j / (history.length - 1)) * 100).toFixed(2)} ${(25 - ((v - low) / range) * 21).toFixed(2)}`,
      );
      line.setAttribute("d", `M${points.join("L")}`);
      area.setAttribute("d", `M${points.join("L")}L100 28L0 28Z`);
    };
    let lastPush = 0;
    const update = () => {
      const v = read();
      if (Number.isNaN(v)) return;
      // Animated readings change every frame; they fill one history slot.
      const now = performance.now();
      if (now - lastPush < 500) history[history.length - 1] = v;
      else {
        history.push(v);
        history.shift();
        lastPush = now;
      }
      draw();
      const state = v >= alert ? "alert" : "normal";
      card.dataset.state = state;
      if (!pin) return;
      pin.dataset.state = state;
      if (tag) tag.textContent = value.textContent;
      if (!pin.classList.contains("is-tick")) pin.classList.add("is-tick");
    };
    pin?.addEventListener("animationend", () =>
      pin.classList.remove("is-tick"),
    );
    new MutationObserver(update).observe(value, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    draw();
    if (tag) tag.textContent = value.textContent;
  });
  // Visitor commands, from the maquette, the dashboard rows or the group
  // switch. They change only this page's simulated devices.
  const group = { ...config.group, name: config.group.name(t) };
  const chip = $("[data-device-chip]");
  let chipTimer;
  function command(ids, on, subject = ids[0]) {
    ids.forEach((id) => {
      const device = deviceById.get(id);
      device.state = on ? 1 : 0;
      device.mode = "manual";
    });
    renderDevices(ids);
    logEvent(
      `${subject} · ${t("Ročni ukaz prek nadzorne plošče", "Command from the dashboard")}: ${on ? t("vklop", "on") : t("izklop", "off")}`,
      undefined,
      "manual",
    );
    const name = ids.length > 1 ? group.name : deviceById.get(ids[0]).name;
    const result = on ? t("vklopljeno", "on") : t("izklopljeno", "off");
    ui("step").textContent =
      `${name}: ${result} · ${t("ročni ukaz", "manual command")}`;
    ui("rule-status").textContent = t(
      "Ročno upravljanje · samodejno pravilo teh naprav ne preglasi",
      "Manual override · the lighting rule leaves these devices as set",
    );
    commandShownUntil = performance.now() + 6000;
    root
      .querySelectorAll("[data-device-hint]")
      .forEach((hint) => hint.classList.add("is-quiet"));
  }
  function updateChip() {
    const device = deviceById.get(chip?.dataset.id);
    if (!device) return;
    chip.querySelector("b").textContent = device.id;
    chip.querySelector("span").textContent = device.state
      ? t("Vklopljeno", "On")
      : t("Izklopljeno", "Off");
    chip.dataset.state = device.state ? "on" : "off";
  }
  function showChip(hotspot, linger) {
    if (!chip) return;
    const [x, y] = hotspot.dataset.anchor.split(" ").map(Number);
    chip.style.left = `${(x / 1536) * 100}%`;
    chip.style.top = `${(y / 1024) * 100}%`;
    chip.dataset.id = hotspot.dataset.device;
    updateChip();
    // Near the top edge of the maquette the chip drops below its anchor.
    const art = chip.offsetParent;
    chip.classList.toggle(
      "is-below",
      (y / 1024) * (art?.clientHeight ?? 0) < chip.offsetHeight + 22,
    );
    chip.classList.toggle("is-focus", hotspot.matches(":focus-visible"));
    chip.classList.add("is-visible");
    clearTimeout(chipTimer);
    if (linger) chipTimer = setTimeout(hideChip, 1600);
  }
  function hideChip() {
    clearTimeout(chipTimer);
    chip?.classList.remove("is-visible");
  }
  const hotspots = new Map();
  root.querySelectorAll("[data-device]").forEach((hotspot) => {
    const device = deviceById.get(hotspot.dataset.device);
    if (!device) return;
    const toggle = () => {
      command([device.id], !device.state);
      // Hover and keyboard focus keep the chip up; after a tap it fades out.
      const held =
        hotspot.matches(":focus-visible") ||
        (lastPointerType === "mouse" && hotspot.matches(":hover"));
      showChip(hotspot, !held);
    };
    hotspots.set(hotspot, toggle);
    hotspot.addEventListener("click", toggle);
    hotspot.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      if (!event.repeat) toggle();
    });
    hotspot.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") showChip(hotspot);
    });
    hotspot.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") hideChip();
    });
    hotspot.addEventListener("focus", () => {
      if (hotspot.matches(":focus-visible")) showChip(hotspot);
    });
    hotspot.addEventListener("blur", hideChip);
  });
  // Lamps are a few pixels wide on a phone. A tap that misses every target
  // goes to the nearest device within reach instead.
  cityWrap?.addEventListener("click", (event) => {
    if (lastPointerType === "mouse" || !event.detail) return;
    if (event.target.closest("[data-device], button, a, .city-sensor-popover"))
      return;
    let nearest;
    let reach = 24;
    for (const hotspot of hotspots.keys()) {
      const box = hotspot.getBoundingClientRect();
      const dx = Math.max(
        box.left - event.clientX,
        0,
        event.clientX - box.right,
      );
      const dy = Math.max(
        box.top - event.clientY,
        0,
        event.clientY - box.bottom,
      );
      const distance = Math.hypot(dx, dy);
      if (distance < reach) {
        reach = distance;
        nearest = hotspot;
      }
    }
    if (nearest) hotspots.get(nearest)();
  });
  root.querySelectorAll("[data-device-switch]").forEach((control) => {
    control.addEventListener("click", () => {
      const device = deviceById.get(control.dataset.deviceSwitch);
      command([device.id], !device.state);
    });
  });
  root.querySelectorAll("[data-lamp-group]").forEach((control) => {
    control.addEventListener("click", () => {
      command(group.ids, control.dataset.lampGroup === "1", group.subject);
    });
  });
  $("[data-devices-auto]")?.addEventListener("click", (event) => {
    const released = devices.filter((device) => device.mode === "manual");
    released.forEach((device) => {
      device.mode = "auto";
    });
    // Keep keyboard focus nearby once this control hides itself.
    if (document.activeElement === event.currentTarget) ui("next")?.focus();
    commandShownUntil = 0;
    render(steps[index], { log: false });
    renderDevices(released.map((device) => device.id));
    logEvent(
      en
        ? `Automatic control restored · ${released.length} ${released.length === 1 ? "device" : "devices"}`
        : `Samodejno upravljanje obnovljeno · naprav: ${released.length}`,
      undefined,
      "manual",
    );
    ui("rule-status").textContent = steps[index].rule;
    commandShownUntil = performance.now() + 4000;
  });
  // Hidden tabs report no intersection, so their programs pause too.
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  observer.observe(workspace);
  reducedMotion.addEventListener("change", schedule);
  // Scene direction for guided scenarios (scenarios.js). Scenarios drive the
  // same devices and dashboard as everything else; entering saves the scene
  // and leaving puts it back exactly as it was, manual overrides included.
  const art = root.querySelector("[data-city-art]");
  const focusLayer = art?.querySelector(".city-focus");
  const controls = [ui("pause"), ui("next"), $("[data-devices-auto]")];
  let saved = null;
  const direction = {
    en,
    devices: deviceById,
    enter() {
      saved = {
        paused,
        clock,
        devices: devices.map(({ state, mode, online }) => ({
          state,
          mode,
          online,
        })),
        readings: [...root.querySelectorAll("[data-reading]")].map(
          (element) => [element, element.innerHTML],
        ),
        timeline: timeline ? [...timeline.children] : [],
        flow: flow?.isOn() ?? false,
      };
      directed = true;
      schedule();
      sky?.setDisabled(true);
      controls.forEach((control) => control && (control.disabled = true));
      const status = $(".twin-live");
      status.classList.remove("is-stopped");
      status.classList.add("is-directed");
      status.lastChild.textContent = t(" Vodeni scenarij", " Guided scenario");
    },
    exit() {
      if (!saved) return;
      quiet = true;
      devices.forEach((device, i) => Object.assign(device, saved.devices[i]));
      // Readings and their notes go back to the values before the scenario.
      saved.readings.forEach(
        ([element, html]) =>
          element.innerHTML !== html && (element.innerHTML = html),
      );
      direction.setAlarms(null);
      direction.setSync(true);
      direction.setStale(false);
      direction.pin(null);
      direction.spotlight(null);
      direction.focus(null);
      direction.signal("reset");
      controls.forEach((control) => control && (control.disabled = false));
      sky?.setDisabled(false);
      $(".twin-live").classList.remove("is-directed");
      directed = false;
      commandShownUntil = 0;
      render(steps[index]);
      setClock(saved.clock, true);
      // The timeline and the data flow go back to how the visitor left them.
      timeline?.replaceChildren(...saved.timeline);
      if (flow && flow.isOn() !== saved.flow) flow.show(saved.flow);
      quiet = false;
      setPaused(saved.paused);
      saved = null;
    },
    // While quiet, changes land at once and send no packets (a scenario
    // replaying its earlier steps).
    quiet(value) {
      quiet = value;
    },
    // A scenario's time of day ("19:05"), glided to.
    setClock(time) {
      setClock(parseTime(time), true);
    },
    // Tells the maquette's effects about a scenario event (e.g. tide.js).
    signal(name, value) {
      root.dispatchEvent(
        new CustomEvent("twin:signal", { detail: { name, value } }),
      );
    },
    setLevel(id, level) {
      deviceById.get(id).state = level;
      renderDevices([id]);
    },
    setOnline(ids, online) {
      ids.forEach((id) => (deviceById.get(id).online = online));
      renderDevices(online ? ids : []);
    },
    setReading,
    // Sends a sensor's reading to Nexavia, as a visitor's click on its pin.
    send: (key) => sendReading(key, { log: false }),
    // Shows the data flow (restored when the scenario ends).
    showFlow(on) {
      if (flow && flow.isOn() !== on) flow.show(on);
    },
    // Empties the timeline; a scenario fills it with its own events.
    clearLog() {
      timeline?.replaceChildren();
    },
    // Opens one sensor popover on the maquette (or none).
    pin(name) {
      pinCard(name);
      renderAge();
    },
    // Replaces the alarm list with the scenario's alarms (null restores it).
    setAlarms(list) {
      const box = $(".twin-alerts");
      if (!box) return;
      box.querySelectorAll(".is-scenario").forEach((item) => item.remove());
      if (!list) return;
      box
        .querySelectorAll("[data-alarm]")
        .forEach((item) => (item.hidden = true));
      list.forEach(([id, text]) => {
        const item = document.createElement("p");
        item.className = "is-scenario";
        item.append(
          Object.assign(document.createElement("strong"), { textContent: id }),
          Object.assign(document.createElement("span"), { textContent: text }),
        );
        box.append(item);
      });
      setDemoPill(list.length);
    },
    setSync(ok) {
      flow?.setOnline(ok);
      const gateway = ui("gateway-state");
      if (gateway) {
        gateway.dataset.state = ok ? "on" : "offline";
        gateway.textContent = ok
          ? t("Povezan", "Online")
          : t("Brez povezave", "Offline");
      }
      const sync = $(".twin-sync");
      if (!sync) return;
      sync.classList.toggle("is-lost", !ok);
      sync.lastChild.textContent = ok
        ? t(" Sinhronizirano", " Synchronised")
        : t(" Povezava prekinjena", " Connection lost");
    },
    setStale(stale) {
      root
        .querySelectorAll(".twin-meter-readings, .twin-sensor-readings")
        .forEach((block) => block.classList.toggle("is-stale", stale));
    },
    // Draws attention to one part of the dashboard and scrolls it into view
    // inside the dashboard's own viewport (never the page).
    spotlight(target) {
      root
        .querySelectorAll(".is-spotlit")
        .forEach((item) => item.classList.remove("is-spotlit"));
      const element = typeof target === "string" ? $(target) : target;
      if (!element) return;
      // A panel the open section leaves out is shown on the overview.
      if (element.closest("[data-in]")?.offsetParent === null)
        setView("overview");
      element.classList.add("is-spotlit");
      const viewport = root.querySelector(".xdr-screen");
      if (!viewport || !viewport.clientHeight) return;
      const offset =
        element.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top;
      // The app's bars cover the top and bottom of the viewport.
      if (
        offset < 56 ||
        offset > viewport.clientHeight - element.offsetHeight - 72
      )
        viewport.scrollTo({
          top: viewport.scrollTop + offset - viewport.clientHeight / 3,
          behavior: reducedMotion.matches ? "auto" : "smooth",
        });
    },
    // Dashboard rows the scenarios point at.
    $row: (id) => $(`[data-row="${id}"]`),
    $reading: (key) =>
      $(`.twin-dashboard [data-reading="${key}"]`)?.parentElement,
    $ui: (name) => ui(name),
    // `kind` types the timeline entry: reading, decision, command, alarm,
    // notify, manual or system.
    log: (text, time, kind) => logEvent(text, time, kind),
    narrate({ rule, text }) {
      if (rule) ui("rule-status").textContent = rule;
      if (text) ui("step").textContent = text;
    },
    // Camera: zoom towards a point (scene px) and spotlight it, centring it in
    // the part of the maquette not covered by the dashboard or the player.
    focus(target) {
      if (!art) return;
      if (!target) {
        art.style.scale = art.style.translate = "";
        focusLayer?.classList.remove("is-active");
        return;
      }
      const { x, y, zoom = 1, radius = 0.3, spot = true } = target;
      const wrap = cityWrap.getBoundingClientRect();
      let right = wrap.right;
      let bottom = wrap.bottom;
      const screen = root.querySelector(".xdr-display:not(.is-minimized)");
      if (screen) {
        const box = screen.getBoundingClientRect();
        if (
          box.width &&
          box.left > wrap.left + wrap.width * 0.35 &&
          box.top < wrap.bottom
        )
          right = Math.min(right, box.left - 12);
      }
      const player = root.querySelector("[data-scenario-player]");
      if (
        player &&
        !player.hidden &&
        getComputedStyle(player).position === "absolute"
      )
        bottom = Math.min(bottom, player.getBoundingClientRect().top - 8);
      const artLeft = wrap.left + art.offsetLeft;
      const artTop = wrap.top + art.offsetTop;
      const centreX = ((wrap.left + right) / 2 - artLeft) / art.offsetWidth;
      const centreY = ((wrap.top + bottom) / 2 - artTop) / art.offsetHeight;
      const clamp = (value) => Math.min(0, Math.max(1 - zoom, value));
      const tx = clamp(centreX - (x / 1536) * zoom);
      const ty = clamp(centreY - (y / 1024) * zoom);
      art.style.scale = String(zoom);
      art.style.translate = `${(tx * 100).toFixed(3)}% ${(ty * 100).toFixed(3)}%`;
      if (focusLayer) {
        focusLayer.style.setProperty(
          "--focus-x",
          `${((x / 1536) * 100).toFixed(2)}%`,
        );
        focusLayer.style.setProperty(
          "--focus-y",
          `${((y / 1024) * 100).toFixed(2)}%`,
        );
        focusLayer.style.setProperty(
          "--focus-r",
          `${(radius * 100).toFixed(1)}%`,
        );
        focusLayer.classList.toggle("is-active", spot);
      }
    },
  };
  // The page keeps the open scenario and step in its address (index.js).
  const scenarios = initScenarios(root, direction, config.scenarios(t, n), {
    onChange(scenario, step) {
      root.dispatchEvent(
        new CustomEvent("twin:scenario", {
          bubbles: true,
          detail: { twin: root.dataset.twinTab, scenario, step },
        }),
      );
    },
  });
  // The floating dashboard starts below the scenario launcher so every
  // scenario stays reachable, until the visitor places it themselves.
  const launcher = root.querySelector(".twin-scenarios");
  const clearLauncher = () => {
    if (
      !screenOverlay ||
      !launcher ||
      !workspace ||
      screenOverlay.dataset.placed
    )
      return;
    if (
      screenOverlay.classList.contains("is-minimized") ||
      document.fullscreenElement
    )
      return;
    const frame = workspace.getBoundingClientRect();
    const below = launcher.getBoundingClientRect().bottom - frame.top + 10;
    if (screenOverlay.getBoundingClientRect().top - frame.top < below)
      screenOverlay.style.top = `${below}px`;
  };
  requestAnimationFrame(() => requestAnimationFrame(clearLauncher));
  window.addEventListener(
    "resize",
    () => requestAnimationFrame(clearLauncher),
    { passive: true },
  );
  overlayToggle?.addEventListener("click", () =>
    requestAnimationFrame(clearLauncher),
  );

  index = stepAt(clock);
  render(steps[index]);
  setClock(clock);
  schedule();
  const loaded = loadMaquette(root, en).then(() => {
    ready = true;
    schedule();
    scenarios?.enable();
    sky?.prepare();
  });
  return { ready: loaded, scenarios };
}
