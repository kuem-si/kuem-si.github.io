import { initTraffic } from "./traffic.js";
import { initWater } from "./water.js";
import { initSmoke } from "./smoke.js";
import { initScenarios } from "./scenarios.js";

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
    ? [[0.86, "Loading the lighting"], [0.95, "Starting the simulation"]]
    : [[0.86, "Nalaganje razsvetljave"], [0.95, "Zagon simulacije"]];
  const render = (value) => {
    art.style.setProperty("--load", value.toFixed(4));
    if (percent) percent.textContent = String(Math.round(value * 100));
    const label = stages.findLast(([from]) => value >= from)?.[1];
    if (stage && label && stage.textContent !== label) stage.textContent = label;
  };
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const elapsed = now - start;
    let goal = target;
    // Without a known file size, creep forward on a slowing curve.
    if (indeterminate) goal = Math.max(goal, 0.86 * (1 - Math.exp(-elapsed / 4000)));
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

function initCityTwin(root) {
  initTraffic(root);
  initWater(root);
  initSmoke(root);
  const en = document.documentElement.lang.startsWith("en");
  const cityWrap = root.querySelector(".twin-scene-wrap");
  const workspace = root.querySelector(".twin-workspace");
  const fullscreenButton = root.querySelector("[data-city-fullscreen]");
  const screenOverlay = root.querySelector(".xdr-display");
  const overlayDrag = root.querySelector("[data-overlay-drag]");
  const overlayOpacity = root.querySelector("[data-overlay-opacity]");
  const overlayToggle = root.querySelector("[data-overlay-toggle]");
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
      if (edge.dataset.overlayResize === "left" || edge.dataset.overlayResize === "right") {
        edge.style.top = `${center}px`;
        edge.style.transform = "translateY(-50%)";
      } else if (edge.dataset.overlayResize === "bottom") {
        const lowerBezelGap = bezelRect.bottom - screenRect.bottom;
        const handleHeight = edge.getBoundingClientRect().height;
        // Center the visible stroke inside the display's lower frame lip.
        const handleCenter = bezelRect.height - Math.max(1, lowerBezelGap) / 2 - 2;
        edge.style.bottom = "auto";
        edge.style.top = `${handleCenter - handleHeight / 2}px`;
      }
    });
  };
  if (screenViewport && screenBezel) {
    if ("ResizeObserver" in window) new ResizeObserver(centerSideResizeEdges).observe(screenViewport);
    window.addEventListener("resize", centerSideResizeEdges, { passive: true });
    requestAnimationFrame(centerSideResizeEdges);
  }
  if (workspace && fullscreenButton) {
    const updateFullscreenButton = () => {
      const active = document.fullscreenElement === workspace;
      fullscreenButton.setAttribute("aria-pressed", String(active));
      fullscreenButton.textContent = active
        ? (en ? "Exit full screen" : "Zapri celozaslonski pogled")
        : (en ? "Open full screen" : "Odpri celozaslonski pogled");
    };
    fullscreenButton.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement === workspace) await document.exitFullscreen();
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
      const left = Math.max(0, Math.min(frame.width - width - 8, overlay.left - frame.left));
      const top = Math.max(0, Math.min(frame.height - height - 8, overlay.top - frame.top));
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
          ? (en ? "Show dashboard" : "Prikaži nadzorno ploščo")
          : (en ? "Hide dashboard" : "Skrij nadzorno ploščo");
      }
      if (!minimized) requestAnimationFrame(keepOverlayVisible);
    };
    setOverlayMinimized(window.matchMedia("(max-width: 980px)").matches);
    overlayToggle?.addEventListener("click", () => {
      setOverlayMinimized(!screenOverlay.classList.contains("is-minimized"));
    });
    requestAnimationFrame(keepOverlayVisible);
    window.addEventListener("resize", keepOverlayVisible, { passive: true });
    document.addEventListener("fullscreenchange", () => requestAnimationFrame(keepOverlayVisible));
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
      if (!overlayDragStart || event.pointerId !== overlayDragStart.pointerId) return;
      const frame = workspace.getBoundingClientRect();
      const maxLeft = Math.max(0, frame.width - screenOverlay.offsetWidth);
      const maxTop = Math.max(0, frame.height - screenOverlay.offsetHeight - 8);
      const left = Math.max(0, Math.min(maxLeft, overlayDragStart.left + event.clientX - overlayDragStart.x));
      const top = Math.max(0, Math.min(maxTop, overlayDragStart.top + event.clientY - overlayDragStart.y));
      screenOverlay.style.left = `${left}px`;
      screenOverlay.style.top = `${top}px`;
      screenOverlay.style.right = "auto";
    });
    const finishOverlayDrag = () => { overlayDragStart = null; };
    overlayDrag.addEventListener("pointerup", finishOverlayDrag);
    overlayDrag.addEventListener("pointercancel", finishOverlayDrag);
    overlayOpacity?.addEventListener("input", () => {
      screenOverlay.style.setProperty("--overlay-opacity", String(Number(overlayOpacity.value) / 100));
    });
    resizeEdges.forEach((edge) => edge.addEventListener("pointerdown", (event) => {
      screenOverlay.dataset.placed = "visitor";
      const frame = workspace.getBoundingClientRect();
      const overlay = screenOverlay.getBoundingClientRect();
      const direction = edge.dataset.overlayResize;
      const resizeWidth = direction === "left" || direction === "right" || direction === "width" || direction.length === 2;
      const resizeHeight = direction === "bottom" || direction === "height" || direction.length === 2;
      const west = direction === "left" || direction === "width" || direction.includes("w");
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
          const minWidth = Math.min(300, frame.width - 16);
          const maxWidth = Math.max(minWidth, Math.min(frame.width - 16, west ? start.left + start.width - 8 : frame.width - start.left - 8));
          const deltaX = moveEvent.clientX - start.x;
          width = Math.max(minWidth, Math.min(maxWidth, start.width + deltaX * (west ? -1 : 1)));
          if (west) left = start.left + start.width - width;
        }
        if (resizeHeight) {
          const minHeight = Math.min(180, frame.height - 16);
          const maxHeight = Math.max(minHeight, Math.min(frame.height - 16, north ? start.top + start.height - 8 : frame.height - start.top - 8));
          const deltaY = moveEvent.clientY - start.y;
          height = Math.max(minHeight, Math.min(maxHeight, start.height + deltaY * (north ? -1 : 1)));
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
    }));
  }
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
      if (pointers.size === 1) dragStart = {
        x: event.clientX, y: event.clientY, panX, panY,
      };
      else dragStart = null;
    });
    cityWrap.addEventListener("pointermove", (event) => {
      const pointer = pointers.get(event.pointerId);
      if (!pointer) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      if (!pointer.dragging) {
        const moved = Math.hypot(pointer.x - pointer.startX, pointer.y - pointer.startY);
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
    cityWrap.addEventListener("click", (event) => {
      if (event.detail && dragged) {
        event.stopPropagation();
        event.preventDefault();
      }
    }, true);
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
  const devices = [
    { id: "HOUSE_01", name: en ? "Garden house" : "Hiša z vrtom", watts: 28 },
    { id: "OFFICE_01", name: en ? "Office building" : "Poslovna stavba", watts: 120 },
    { id: "FACTORY_01", name: en ? "Factory" : "Tovarna", watts: 210 },
    { id: "LAMP_01", name: en ? "Street light 1" : "Ulična svetilka 1", watts: 65 },
    { id: "LAMP_02", name: en ? "Street light 2" : "Ulična svetilka 2", watts: 62 },
    { id: "LAMP_03", name: en ? "Street light 3" : "Ulična svetilka 3", watts: 68 },
    { id: "LAMP_04", name: en ? "Street light 4" : "Ulična svetilka 4", watts: 64 },
  ].map((device) => ({
    ...device,
    // The one state for each device, read by the maquette and the dashboard.
    // `mode` is "auto" while the simulated lighting rule drives the device,
    // and "manual" after a visitor's command, until control is handed back.
    state: 0,
    mode: "auto",
    // False while the device cannot reach Nexavia (e.g. gateway outage).
    online: true,
  }));
  const deviceById = new Map(devices.map((device) => [device.id, device]));
  const alertAssets = ["OFFICE_01", "FACTORY_01"];
  const steps = en
    ? [
        {
          text: "Sensor LIGHT_01: 46 lx · enough daylight",
          lux: 46,
          states: Array(devices.length).fill(0),
          rule: "Condition not met · lighting is off",
          event: "Light sensor measured 46 lx.",
        },
        {
          text: "Sensor LIGHT_01: 18 lx · light level drops",
          lux: 18,
          states: Array(devices.length).fill(0),
          rule: "Condition met · command sent via GW_01",
          event: "Gateway GW_01 relayed a reading of 18 lx.",
        },
        {
          text: "The garden house lights switch on",
          lux: 18,
          states: [1, 0, 0, 0, 0, 0, 0],
          rule: "Active · automatic lighting control",
          event: "HOUSE_01: lighting switched on.",
        },
        {
          text: "The office building lights switch on",
          lux: 18,
          states: [1, 1, 0, 0, 0, 0, 0],
          rule: "Active · automatic lighting control",
          event: "OFFICE_01: lighting switched on.",
        },
        {
          text: "The factory lights come on",
          lux: 18,
          states: [1, 1, 1, 0, 0, 0, 0],
          rule: "Active · brightness adjustment",
          event: "FACTORY_01: lighting switched on.",
        },
        {
          text: "Street lights respond to falling daylight",
          lux: 18,
          states: [1, 1, 1, 1, 1, 1, 1],
          rule: "Automatic lighting active",
          event: "LAMP_01–LAMP_04: street lights switched on.",
        },
        {
          text: "Daylight returns · system switches lights off",
          lux: 46,
          states: Array(devices.length).fill(0),
          rule: "Condition no longer met · lights switched off",
          event: "Sensor measured 46 lx. All lights are off.",
        },
      ]
    : [
        {
          text: "Senzor LIGHT_01: 46 lx · dovolj dnevne svetlobe",
          lux: 46,
          states: Array(devices.length).fill(0),
          rule: "Pogoj ni izpolnjen · razsvetljava izklopljena",
          event: "Senzor svetlobe je izmeril 46 lx.",
        },
        {
          text: "Senzor LIGHT_01: 18 lx · padec svetlobe",
          lux: 18,
          states: Array(devices.length).fill(0),
          rule: "Pogoj izpolnjen · ukaz se pošilja prek GW_01",
          event: "Prehod GW_01 je posredoval meritev 18 lx.",
        },
        {
          text: "V hiši z vrtom se prižgejo luči",
          lux: 18,
          states: [1, 0, 0, 0, 0, 0, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "HOUSE_01: luči so vključene.",
        },
        {
          text: "V poslovni stavbi se prižgejo luči",
          lux: 18,
          states: [1, 1, 0, 0, 0, 0, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "OFFICE_01: razsvetljava je vključena.",
        },
        {
          text: "Tovarna vklopi razsvetljavo",
          lux: 18,
          states: [1, 1, 1, 0, 0, 0, 0],
          rule: "Aktivno · prilagoditev svetlosti",
          event: "FACTORY_01: razsvetljava je vključena.",
        },
        {
          text: "Ulične svetilke zaznajo padec dnevne svetlobe",
          lux: 18,
          states: [1, 1, 1, 1, 1, 1, 1],
          rule: "Samodejna razsvetljava je aktivna",
          event: "LAMP_01–LAMP_04: ulične svetilke so vključene.",
        },
        {
          text: "Svetloba se vrne · sistem ugasne luči",
          lux: 46,
          states: Array(devices.length).fill(0),
          rule: "Pogoj ni več izpolnjen · luči izklopljene",
          event: "Senzor je izmeril 46 lx. Vse luči so izklopljene.",
        },
      ];
  const $ = (selector) => root.querySelector(selector);
  let index = 0;
  let paused = false;
  let visible = true;
  // The simulation starts once the maquette has been revealed.
  let ready = false;
  // True while a guided scenario directs the scene; the rule is suspended.
  let directed = false;
  let timer;

  function render(step) {
    const alarmText = en
      ? {
          OFFICE_01: "Sensor not responding · 12 min",
          FACTORY_01: "Gateway signal weak · 4 min",
        }
      : {
          OFFICE_01: "Senzor se ne odziva · 12 min",
          FACTORY_01: "Šibek signal prehoda · 4 min",
        };
    const downSensors = index === 3 || index === 4 ? ["OFFICE_01"] : alertAssets;
    alertAssets.forEach((id) => {
      const alarm = root.querySelector(`[data-alarm="${id}"]`);
      if (alarm) {
        alarm.hidden = !downSensors.includes(id);
        alarm.querySelector("span").textContent = alarmText[id];
      }
      const building = root.querySelector(`[data-building="${id}"]`);
      building?.classList.toggle("has-alert", downSensors.includes(id));
      if (building) {
        const device = devices.find((item) => item.id === id);
        building.setAttribute(
          "aria-label",
          `${device.name}: ${downSensors.includes(id) ? (en ? "sensor not responding" : "senzor se ne odziva") : en ? "sensor online" : "senzor deluje"}. ${en ? "Change lighting." : "Spremeni osvetlitev."}`,
        );
      }
    });
    const alarmCount = $("#twin-alarm-count");
    if (alarmCount) alarmCount.textContent = String(downSensors.length);
    $(".twin-demo-pill").innerHTML = `<i></i> ${downSensors.length} ${en ? "ALARMS" : "ALARMI"}`;
    $("#twin-lux").textContent = `${step.lux} lx`;
    const meterDrift = [0, 0.02, 0.01, 0.04, 0.03, 0.06, 0.02][index % 7];
    const decimals = en ? "." : ",";
    const houseWaterReading = `${(0.84 + meterDrift).toFixed(2).replace(".", decimals)} m³/d`;
    const officeWaterReading = `${(12.6 + meterDrift * 10).toFixed(1).replace(".", decimals)} m³/d`;
    const factoryGasReading = `${(34.2 + meterDrift * 10).toFixed(1).replace(".", decimals)} m³/h`;
    const electricityReading = `${(18.6 + meterDrift * 4).toFixed(1).replace(".", decimals)} kWh`;
    $("#meter-house-water").textContent = houseWaterReading;
    $("#city-popover-house-water-value").textContent = houseWaterReading;
    $("#meter-office-water").textContent = officeWaterReading;
    $("#city-popover-office-water-value").textContent = officeWaterReading;
    $("#meter-factory-gas").textContent = factoryGasReading;
    $("#city-popover-factory-gas-value").textContent = factoryGasReading;
    $("#meter-electricity").textContent = electricityReading;
    $("#city-popover-electricity-value").textContent = electricityReading;
    const sensorDrift = [0, 0.02, -0.01, 0.03, 0.01, -0.02, 0][index % 7];
    const vibrationReading = `${(0.42 + sensorDrift).toFixed(2).replace(".", decimals)} mm/s`;
    const riverReading = `${(1.36 + sensorDrift).toFixed(2).replace(".", decimals)} m`;
    const airPm10 = 18 + (index % 3);
    const airTemperature = (18.7 + sensorDrift * 10).toFixed(1).replace(".", decimals);
    const airHumidity = 56 - (index % 3);
    $("#sensor-vibration").firstChild.textContent = vibrationReading;
    $("#city-popover-vibration-value").textContent = vibrationReading;
    $("#sensor-water-level").firstChild.textContent = riverReading;
    $("#city-popover-water-value").textContent = riverReading;
    $("#sensor-air-pm10").firstChild.textContent = `${airPm10} µg/m³`;
    $("#city-popover-air-pm10").textContent = `${airPm10} µg/m³`;
    $("#sensor-air-climate").textContent = `${airTemperature} °C · ${airHumidity}${en ? "% RH" : " % RH"}`;
    $("#city-popover-air-temp").textContent = `${airTemperature} °C`;
    $("#city-popover-air-humidity").textContent = `${airHumidity}${en ? "%" : " %"}`;
    // A visitor's command stays the latest event for a moment before the
    // simulation's next entry replaces it.
    if (performance.now() >= commandShownUntil) {
      $("#twin-rule-status").textContent = step.rule;
      logEvent(step.event);
      $("#twin-step").textContent = step.text;
    }
    // The lighting rule proposes states; devices under manual control keep
    // the visitor's choice.
    devices.forEach((device, i) => {
      if (device.mode === "auto") device.state = step.states[i];
    });
    renderDevices();
  }

  const timeFormat = new Intl.DateTimeFormat(en ? "en-GB" : "sl-SI", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let commandShownUntil = 0;
  // `time` overrides the real clock, e.g. a guided scenario's own clock.
  function logEvent(text, time = timeFormat.format(new Date())) {
    $("#twin-event").textContent = `${time} · ${text}`;
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
      const patch = root.querySelector(`[data-light-off="${device.id}"]`);
      if (patch) {
        patch.classList.toggle("is-off", !on);
        // A dimmed light shows part of its unlit patch.
        patch.style.opacity = dimmed ? String((1 - device.state) * 0.85) : "";
      }
      root.querySelector(`[data-device="${device.id}"]`)?.setAttribute("aria-pressed", String(on));
      const row = root.querySelector(`[data-row="${device.id}"]`);
      if (!row) return;
      const state = row.querySelector(".twin-state");
      row.classList.toggle("is-offline", !device.online);
      if (!device.online) {
        state.textContent = en ? "Offline" : "Ni povezave";
        state.dataset.state = "offline";
      } else {
        const percent = Math.round(device.state * 100);
        state.textContent = dimmed
          ? en ? `Dimmed ${percent}%` : `Zatemnjeno ${percent} %`
          : on ? (en ? "On" : "Vklopljeno") : en ? "Off" : "Izklopljeno";
        state.dataset.state = on ? "on" : "off";
      }
      row.querySelector(".twin-watts").textContent = `${watts} W`;
      row.querySelector("[data-device-switch]")?.setAttribute("aria-checked", String(on));
      const modeTag = row.querySelector("[data-mode-tag]");
      if (modeTag) modeTag.hidden = device.mode !== "manual";
      if (changed.includes(device.id)) {
        row.classList.remove("is-updated");
        void row.offsetWidth;
        row.classList.add("is-updated");
      }
    });
    $("#twin-active").textContent = `${active} / ${devices.length}`;
    $("#twin-power").textContent = `${power} W`;
    updateChip();
    const autoButton = $("[data-devices-auto]");
    if (autoButton) autoButton.hidden = !devices.some((device) => device.mode === "manual");
  }

  function next() {
    index = (index + 1) % steps.length;
    render(steps[index]);
  }
  function schedule() {
    clearInterval(timer);
    if (
      ready &&
      !directed &&
      !paused &&
      visible &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      timer = setInterval(next, 3200);
    root.classList.toggle(
      "is-paused",
      paused ||
        !visible ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }
  // Pause state is shown in two places: the pause button and the status
  // pill (green while running, orange while stopped).
  function setPaused(value) {
    paused = value;
    $("#twin-pause").textContent = paused
      ? en
        ? "Resume animation"
        : "Nadaljuj animacijo"
      : en
        ? "Pause"
        : "Začasno ustavi";
    $("#twin-pause").setAttribute("aria-pressed", String(paused));
    const status = $(".twin-live");
    status.classList.toggle("is-stopped", paused);
    status.lastChild.textContent = paused
      ? en
        ? " Simulation paused"
        : " Simulacija ustavljena"
      : en
        ? " Simulation running"
        : " Simulacija teče";
    schedule();
  }
  $("#twin-pause").addEventListener("click", () => setPaused(!paused));
  $("#twin-next").addEventListener("click", next);
  const sensorTriggers = {
    "water-level": {
      panel: "water",
      name: en ? "River level sensor" : "Senzor gladine reke",
      event: () => `${en ? "River level" : "Gladina reke"}: ${$("#sensor-water-level").firstChild.textContent}.`,
    },
    air: {
      panel: "air",
      name: en ? "Air quality sensor" : "Senzor kakovosti zraka",
      event: () => `${en ? "Air quality" : "Kakovost zraka"}: PM10 ${$("#sensor-air-pm10").firstChild.textContent}, ${$("#sensor-air-climate").textContent}.`,
    },
    "water-meter": {
      panel: "house-water",
      name: en ? "House water meter" : "Vodomer hiše",
      event: () => `${en ? "House water meter" : "Vodomer hiše"}: ${$("#meter-house-water").textContent}.`,
    },
    "gas-meter": {
      panel: "factory-gas",
      name: en ? "Factory gas meter" : "Plinomer tovarne",
      event: () => `${en ? "Factory gas meter" : "Plinomer tovarne"}: ${$("#meter-factory-gas").textContent}.`,
    },
    electricity: {
      panel: "electricity",
      name: en ? "Factory electricity meter" : "Električni števec tovarne",
      event: () => `${en ? "Factory electricity meter" : "Električni števec tovarne"}: ${$("#meter-electricity").textContent}.`,
    },
    "office-water": {
      panel: "office-water",
      name: en ? "Office water meter" : "Vodomer pisarne",
      event: () => `${en ? "Office water meter" : "Vodomer pisarne"}: ${$("#meter-office-water").textContent}.`,
    },
    vibration: {
      panel: "vibration",
      name: en ? "Bridge vibration sensor" : "Senzor tresljajev mostu",
      event: () => `${en ? "Bridge vibration" : "Tresljaji mostu"}: ${$("#sensor-vibration").firstChild.textContent}.`,
    },
    cyclists: {
      panel: "cyclists",
      name: en ? "Cyclist counter" : "Števec kolesarjev",
      event: () => `${en ? "Cyclist counter" : "Števec kolesarjev"}: ${$("#sensor-cyclists").textContent}.`,
    },
  };
  // Opens one reading card on the maquette (or none) and marks its pin.
  function pinCard(name) {
    root.querySelectorAll(".city-sensor-popover[data-pinned='true']").forEach((item) => (item.dataset.pinned = "false"));
    root.querySelectorAll("[data-sensor-pin]").forEach((pin) => pin.setAttribute("aria-expanded", String(pin.dataset.sensorPin === name)));
    const popover = name && root.querySelector(`[data-sensor-popover="${name}"]`);
    if (popover) popover.dataset.pinned = "true";
  }
  const openCard = () => root.querySelector("[data-sensor-pin][aria-expanded='true']");
  root.querySelectorAll("[data-scene-sensor]").forEach((control) => {
    control.addEventListener("click", () => {
      const sensor = sensorTriggers[control.dataset.sceneSensor];
      if (!sensor) return;
      // A second click on the open pin closes its card.
      if (control.getAttribute("aria-expanded") === "true") {
        pinCard(null);
        return;
      }
      setPaused(true);
      pinCard(sensor.panel);
      logEvent(sensor.event());
      $("#twin-step").textContent = sensor.name;
      $("#twin-rule-status").textContent = en ? "Manual sensor trigger · dashboard updated" : "Ročni prožilnik senzorja · nadzorna plošča posodobljena";
    });
  });
  // A visitor's card closes on Escape or a click elsewhere; a guided
  // scenario keeps the card it opened.
  root.addEventListener("click", (event) => {
    if (directed || !openCard()) return;
    if (event.target.closest("[data-sensor-pin], .city-sensor-popover")) return;
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
    sensorsToggle.closest("[data-city-art]").dataset.overlays = on ? "on" : "off";
    if (!on) pinCard(null);
  });
  // Live readings. Each card keeps a short history for its sparkline; its pin
  // pulses on every new reading, shows it in the hover label and turns to an
  // alarm at the sensor's threshold (data-alert).
  root.querySelectorAll("[data-sensor-popover]").forEach((card, n) => {
    const value = card.querySelector("[data-sensor-value]");
    if (!value) return;
    const pin = root.querySelector(`[data-sensor-pin="${card.dataset.sensorPopover}"]`);
    const tag = pin?.querySelector("[data-sensor-tag]");
    const alert = Number(card.dataset.alert) || Infinity;
    const read = () => parseFloat(value.textContent.replace(",", "."));
    // Seed a plausible recent history so the sparkline is never empty; the
    // cyclist counter only ever counts up.
    const first = read() || 0;
    const counting = card.dataset.sensorPopover === "cyclists";
    const history = Array.from({ length: 24 }, (_, i) =>
      counting
        ? Math.max(0, first - Math.round((23 - i) * 1.6))
        : first * (1 + 0.05 * Math.sin(i * 0.7 + n) + 0.025 * Math.sin(i * 1.9 + n * 2)),
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
      const points = history.map((v, i) => `${((i / (history.length - 1)) * 100).toFixed(2)} ${(25 - ((v - low) / range) * 21).toFixed(2)}`);
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
    pin?.addEventListener("animationend", () => pin.classList.remove("is-tick"));
    new MutationObserver(update).observe(value, { childList: true, characterData: true, subtree: true });
    draw();
    if (tag) tag.textContent = value.textContent;
  });
  // Visitor commands, from the maquette, the dashboard rows or the street
  // lighting group. They change only this page's simulated devices.
  const lamps = devices.filter((device) => device.id.startsWith("LAMP_")).map((device) => device.id);
  const chip = $("[data-device-chip]");
  let chipTimer;
  function command(ids, on, subject = ids[0]) {
    ids.forEach((id) => {
      const device = deviceById.get(id);
      device.state = on ? 1 : 0;
      device.mode = "manual";
    });
    renderDevices(ids);
    const verb = en ? (on ? "on" : "off") : on ? "vklop" : "izklop";
    logEvent(`${subject} · ${en ? "Manual command" : "Ročni ukaz"}: ${verb}`);
    const name = ids.length > 1
      ? (en ? "Street lights" : "Ulične svetilke")
      : deviceById.get(ids[0]).name;
    const result = en ? (on ? "on" : "off") : on ? "vklopljeno" : "izklopljeno";
    $("#twin-step").textContent = `${name}: ${result} · ${en ? "manual command" : "ročni ukaz"}`;
    $("#twin-rule-status").textContent = en
      ? "Manual override · the lighting rule leaves these devices as set"
      : "Ročno upravljanje · samodejno pravilo teh naprav ne preglasi";
    commandShownUntil = performance.now() + 6000;
    root.querySelectorAll("[data-device-hint]").forEach((hint) => hint.classList.add("is-quiet"));
  }
  function updateChip() {
    const device = deviceById.get(chip?.dataset.id);
    if (!device) return;
    chip.querySelector("b").textContent = device.id;
    chip.querySelector("span").textContent = device.state
      ? (en ? "On" : "Vklopljeno")
      : en ? "Off" : "Izklopljeno";
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
    chip.classList.toggle("is-below", (y / 1024) * (art?.clientHeight ?? 0) < chip.offsetHeight + 22);
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
      const held = hotspot.matches(":focus-visible") || (lastPointerType === "mouse" && hotspot.matches(":hover"));
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
    if (event.target.closest("[data-device], button, a, .city-sensor-popover")) return;
    let nearest;
    let reach = 24;
    for (const hotspot of hotspots.keys()) {
      const box = hotspot.getBoundingClientRect();
      const dx = Math.max(box.left - event.clientX, 0, event.clientX - box.right);
      const dy = Math.max(box.top - event.clientY, 0, event.clientY - box.bottom);
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
      command(lamps, control.dataset.lampGroup === "1", "LAMP_01–LAMP_04");
    });
  });
  $("[data-devices-auto]")?.addEventListener("click", (event) => {
    const released = devices.filter((device) => device.mode === "manual");
    released.forEach((device) => {
      device.mode = "auto";
    });
    // Keep keyboard focus nearby once this control hides itself.
    if (document.activeElement === event.currentTarget) $("#twin-next")?.focus();
    commandShownUntil = 0;
    render(steps[index]);
    renderDevices(released.map((device) => device.id));
    logEvent(en
      ? `Automatic control restored · ${released.length} ${released.length === 1 ? "device" : "devices"}`
      : `Samodejno upravljanje obnovljeno · naprav: ${released.length}`);
    $("#twin-rule-status").textContent = steps[index].rule;
    commandShownUntil = performance.now() + 4000;
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  observer.observe(root.querySelector(".twin-workspace"));
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", schedule);
  // Scene direction for guided scenarios (scenarios.js). Scenarios drive the
  // same devices and dashboard as everything else; entering saves the scene
  // and leaving puts it back exactly as it was, manual overrides included.
  const art = root.querySelector("[data-city-art]");
  const focusLayer = art?.querySelector(".city-focus");
  const readings = {
    "house-water": ["#meter-house-water", "#city-popover-house-water-value"],
    river: ["#sensor-water-level", "#city-popover-water-value"],
    vibration: ["#sensor-vibration", "#city-popover-vibration-value"],
    cyclists: ["#sensor-cyclists", "#city-popover-cyclists-value"],
  };
  const controls = ["#twin-pause", "#twin-next", "[data-devices-auto]"];
  let saved = null;
  const direction = {
    en,
    devices: deviceById,
    enter() {
      saved = { paused, devices: devices.map(({ state, mode, online }) => ({ state, mode, online })) };
      directed = true;
      schedule();
      controls.forEach((selector) => $(selector) && ($(selector).disabled = true));
      const status = $(".twin-live");
      status.classList.remove("is-stopped");
      status.classList.add("is-directed");
      status.lastChild.textContent = en ? " Guided scenario" : " Vodeni scenarij";
    },
    exit() {
      if (!saved) return;
      devices.forEach((device, i) => Object.assign(device, saved.devices[i]));
      direction.setAlarms(null);
      direction.setSync(true);
      direction.setStale(false);
      direction.pin(null);
      direction.spotlight(null);
      direction.focus(null);
      controls.forEach((selector) => $(selector) && ($(selector).disabled = false));
      $(".twin-live").classList.remove("is-directed");
      directed = false;
      commandShownUntil = 0;
      render(steps[index]);
      setPaused(saved.paused);
      saved = null;
    },
    setLevel(id, level) {
      deviceById.get(id).state = level;
      renderDevices([id]);
    },
    setOnline(ids, online) {
      ids.forEach((id) => (deviceById.get(id).online = online));
      renderDevices(online ? ids : []);
    },
    setReading(key, text, note) {
      const [panelSelector, popoverSelector] = readings[key];
      const panel = $(panelSelector);
      if (panel) {
        // Sensor readings keep a <small> note after the value text.
        if (panel.firstElementChild) panel.firstChild.textContent = text;
        else panel.textContent = text;
        if (note !== undefined && panel.querySelector("small")) panel.querySelector("small").textContent = note;
      }
      const popover = $(popoverSelector);
      if (popover) popover.textContent = text;
    },
    // Opens one sensor popover on the maquette (or none).
    pin: pinCard,
    // Replaces the alarm list with the scenario's alarms (null restores it).
    setAlarms(list) {
      const box = $(".twin-alerts");
      if (!box) return;
      box.querySelectorAll(".is-scenario").forEach((item) => item.remove());
      if (!list) return;
      box.querySelectorAll("[data-alarm]").forEach((item) => (item.hidden = true));
      list.forEach(([id, text]) => {
        const item = document.createElement("p");
        item.className = "is-scenario";
        item.append(Object.assign(document.createElement("strong"), { textContent: id }), Object.assign(document.createElement("span"), { textContent: text }));
        box.append(item);
      });
      $("#twin-alarm-count").textContent = String(list.length);
      $(".twin-demo-pill").innerHTML = `<i></i> ${list.length} ${en ? "ALARMS" : "ALARMI"}`;
    },
    setSync(ok) {
      const sync = $(".twin-sync");
      if (!sync) return;
      sync.classList.toggle("is-lost", !ok);
      sync.lastChild.textContent = ok ? (en ? " Synchronised" : " Sinhronizirano") : en ? " Connection lost" : " Povezava prekinjena";
    },
    setStale(stale) {
      root.querySelectorAll(".twin-meter-readings, .twin-sensor-readings").forEach((block) => block.classList.toggle("is-stale", stale));
    },
    // Draws attention to one part of the dashboard and scrolls it into view
    // inside the dashboard's own viewport (never the page).
    spotlight(target) {
      root.querySelectorAll(".is-spotlit").forEach((item) => item.classList.remove("is-spotlit"));
      const element = typeof target === "string" ? $(target) : target;
      if (!element) return;
      element.classList.add("is-spotlit");
      const viewport = root.querySelector(".xdr-screen");
      if (!viewport || !viewport.clientHeight) return;
      const offset = element.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
      if (offset < 0 || offset > viewport.clientHeight - element.offsetHeight - 16)
        viewport.scrollTo({ top: viewport.scrollTop + offset - viewport.clientHeight / 3, behavior: reducedMotion.matches ? "auto" : "smooth" });
    },
    log: (text, time) => logEvent(text, time),
    narrate({ rule, text }) {
      if (rule) $("#twin-rule-status").textContent = rule;
      if (text) $("#twin-step").textContent = text;
    },
    // Camera: zoom towards a point (photo px) and spotlight it, centring it in
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
        if (box.width && box.left > wrap.left + wrap.width * 0.35 && box.top < wrap.bottom) right = Math.min(right, box.left - 12);
      }
      const player = root.querySelector("[data-scenario-player]");
      if (player && !player.hidden && getComputedStyle(player).position === "absolute")
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
        focusLayer.style.setProperty("--focus-x", `${((x / 1536) * 100).toFixed(2)}%`);
        focusLayer.style.setProperty("--focus-y", `${((y / 1024) * 100).toFixed(2)}%`);
        focusLayer.style.setProperty("--focus-r", `${(radius * 100).toFixed(1)}%`);
        focusLayer.classList.toggle("is-active", spot);
      }
    },
  };
  const scenarios = initScenarios(root, direction);
  // The floating dashboard starts below the scenario launcher so every
  // scenario stays reachable, until the visitor places it themselves.
  const launcher = root.querySelector(".twin-scenarios");
  const clearLauncher = () => {
    if (!screenOverlay || !launcher || !workspace || screenOverlay.dataset.placed) return;
    if (screenOverlay.classList.contains("is-minimized") || document.fullscreenElement) return;
    const frame = workspace.getBoundingClientRect();
    const below = launcher.getBoundingClientRect().bottom - frame.top + 10;
    if (screenOverlay.getBoundingClientRect().top - frame.top < below) screenOverlay.style.top = `${below}px`;
  };
  requestAnimationFrame(() => requestAnimationFrame(clearLauncher));
  window.addEventListener("resize", () => requestAnimationFrame(clearLauncher), { passive: true });
  overlayToggle?.addEventListener("click", () => requestAnimationFrame(clearLauncher));

  render(steps[index]);
  schedule();
  loadMaquette(root, en).then(() => {
    ready = true;
    schedule();
    scenarios?.enable();
  });
}

// One initialiser per tab, keyed by the panel's data-twin-tab.
const tabInitializers = { city: initCityTwin };

function initTwinTabs(page) {
  const tabs = [...page.querySelectorAll("[data-twin-tab-trigger]")];
  const started = new Set();
  const panelOf = (tab) => page.querySelector(`#${tab.getAttribute("aria-controls")}`);
  function select(tab, focus) {
    tabs.forEach((other) => {
      const active = other === tab;
      other.setAttribute("aria-selected", String(active));
      other.tabIndex = active ? 0 : -1;
      const panel = panelOf(other);
      if (panel) panel.hidden = !active;
    });
    if (focus) tab.focus();
    // Each twin starts the first time its tab is shown; hidden tabs pause
    // themselves through their own visibility observers.
    const panel = panelOf(tab);
    const id = panel?.dataset.twinTab;
    if (id && !started.has(id)) {
      started.add(id);
      tabInitializers[id]?.(panel);
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const target = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      select(tabs[(target + tabs.length) % tabs.length], true);
    });
  });
  // The first tab is always the one started on page load.
  if (tabs.length) select(tabs[0]);
  else page.querySelectorAll("[data-twin-tab]").forEach((panel) => tabInitializers[panel.dataset.twinTab]?.(panel));
}

const page = document.querySelector("[data-twin-root]");
if (page) initTwinTabs(page);
