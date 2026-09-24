const root = document.querySelector("[data-twin-root]");

if (root) {
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
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      cityWrap.setPointerCapture(event.pointerId);
      if (pointers.size === 1) dragStart = {
        x: event.clientX, y: event.clientY, panX, panY,
      };
      else dragStart = null;
    });
    cityWrap.addEventListener("pointermove", (event) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1 && dragStart) {
        panX = dragStart.panX + event.clientX - dragStart.x;
        panY = dragStart.panY + event.clientY - dragStart.y;
        renderPan();
      }
    });
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
    {
      id: "STADIUM_01",
      name: en ? "City stadium" : "Mestni stadion",
      watts: 420,
    },
    { id: "TOWER_01", name: en ? "Skyscraper" : "Nebotičnik", watts: 186 },
    { id: "OFFICE_01", name: en ? "Office building" : "Poslovna stavba", watts: 120 },
    { id: "FACTORY_01", name: en ? "Factory" : "Tovarna", watts: 210 },
    { id: "LAMP_01", name: en ? "Street light 1" : "Ulična svetilka 1", watts: 65 },
    { id: "LAMP_02", name: en ? "Street light 2" : "Ulična svetilka 2", watts: 62 },
    { id: "LAMP_03", name: en ? "Street light 3" : "Ulična svetilka 3", watts: 68 },
    { id: "LAMP_04", name: en ? "Street light 4" : "Ulična svetilka 4", watts: 64 },
  ];
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
          states: [1, 0, 0, 0, 0, 0, 0, 0, 0],
          rule: "Active · automatic lighting control",
          event: "HOUSE_01: lighting switched on.",
        },
        {
          text: "The stadium floodlights switch on",
          lux: 18,
          states: [1, 1, 0, 0, 0, 0, 0, 0, 0],
          rule: "Active · automatic lighting control",
          event: "STADIUM_01: floodlights switched on.",
        },
        {
          text: "The skyscraper facade lights come on",
          lux: 18,
          states: [1, 1, 1, 0, 0, 0, 0, 0, 0],
          rule: "Active · brightness adjustment",
          event: "TOWER_01: facade lighting switched on.",
        },
        {
          text: "Street light responds to falling daylight",
          lux: 18,
          states: [1, 1, 1, 0, 0, 1, 1, 1, 1],
          rule: "Automatic lighting active",
          event: "LAMP_01: street light switched on.",
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
          states: [1, 0, 0, 0, 0, 0, 0, 0, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "HOUSE_01: luči so vključene.",
        },
        {
          text: "Prižgejo se reflektorji na stadionu",
          lux: 18,
          states: [1, 1, 0, 0, 0, 0, 0, 0, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "STADIUM_01: reflektorji so vključeni.",
        },
        {
          text: "Zasveti fasadna osvetlitev nebotičnika",
          lux: 18,
          states: [1, 1, 1, 0, 0, 0, 0, 0, 0],
          rule: "Aktivno · prilagoditev svetlosti",
          event: "TOWER_01: fasadna osvetlitev je vključena.",
        },
        {
          text: "Ulična svetilka zazna padec dnevne svetlobe",
          lux: 18,
          states: [1, 1, 1, 0, 0, 1, 1, 1, 1],
          rule: "Samodejna razsvetljava je aktivna",
          event: "LAMP_01: ulična svetilka je vključena.",
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
  let cyclistCount = 124;
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
    const power = devices.reduce(
      (total, device, i) => total + device.watts * step.states[i],
      0,
    );
    $("#twin-active").textContent =
      `${step.states.filter(Boolean).length} / ${devices.length}`;
    $("#twin-power").textContent = `${Math.round(power)} W`;
    $("#twin-lux").textContent = `${step.lux} lx`;
    const meterDrift = [0, 0.02, 0.01, 0.04, 0.03, 0.06, 0.02][index % 7];
    const decimals = en ? "." : ",";
    const houseWaterReading = `${(0.84 + meterDrift).toFixed(2).replace(".", decimals)} m³/d`;
    const officeWaterReading = `${(12.6 + meterDrift * 10).toFixed(1).replace(".", decimals)} m³/d`;
    const factoryGasReading = `${(34.2 + meterDrift * 10).toFixed(1).replace(".", decimals)} m³/h`;
    $("#meter-house-water").textContent = houseWaterReading;
    $("#city-popover-house-water-value").textContent = houseWaterReading;
    $("#meter-office-water").textContent = officeWaterReading;
    $("#city-popover-office-water-value").textContent = officeWaterReading;
    $("#meter-factory-gas").textContent = factoryGasReading;
    $("#city-popover-factory-gas-value").textContent = factoryGasReading;
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
    $("#sensor-cyclists").textContent = en ? `${cyclistCount} today` : `${cyclistCount} danes`;
    $("#city-popover-cyclists-value").textContent = String(cyclistCount);
    $("#twin-rule-status").textContent = step.rule;
    $("#twin-event").textContent = step.event;
    $("#twin-step").textContent = step.text;
    devices.forEach((device, i) => {
      const level = step.states[i];
      const building = root.querySelector(`[data-building="${device.id}"]`);
      const row = root.querySelector(`[data-row="${device.id}"]`);
      building.style.setProperty("--light-level", level);
      building.classList.toggle("is-lit", level > 0);
      if (!alertAssets.includes(device.id)) building.setAttribute(
        "aria-label",
        `${device.name}: ${level === 1 ? (en ? "on" : "vključeno") : level ? (en ? "dimmed to 50%" : "zatemnjeno na 50 %") : en ? "off" : "izklopljeno"}. ${en ? "Change lighting." : "Spremeni osvetlitev."}`,
      );
      row.querySelector(".twin-state").textContent =
        level === 1
          ? en
            ? "On"
            : "Vključeno"
          : level
            ? en
              ? "Dimmed 50%"
              : "Zatemnjeno 50 %"
            : en
              ? "Off"
              : "Izklopljeno";
      row.querySelector(".twin-state").dataset.state = level ? "on" : "off";
      row.querySelector(".twin-watts").textContent =
        `${Math.round(device.watts * level)} W`;
    });
  }

  function next() {
    index = (index + 1) % steps.length;
    render(steps[index]);
  }
  function schedule() {
    clearInterval(timer);
    if (
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
  $("#twin-pause").addEventListener("click", () => {
    paused = !paused;
    $("#twin-pause").textContent = paused
      ? en
        ? "Resume animation"
        : "Nadaljuj animacijo"
      : en
        ? "Pause"
        : "Začasno ustavi";
    $("#twin-pause").setAttribute("aria-pressed", String(paused));
    $(".twin-live").lastChild.textContent = paused
      ? en
        ? " Manual control"
        : " Ročno upravljanje"
      : en
        ? " Simulation running"
        : " Simulacija teče";
    schedule();
  });
  $("#twin-next").addEventListener("click", next);
  root.querySelectorAll(".city-cyclist-motion").forEach((cyclist) => {
      cyclist.addEventListener("animationiteration", () => {
        cyclistCount += 1;
        $("#sensor-cyclists").textContent = en
          ? `${cyclistCount} today`
          : `${cyclistCount} danes`;
        $("#city-popover-cyclists-value").textContent = String(cyclistCount);
      });
  });
  devices.forEach((device, i) => {
    const building = root.querySelector(`[data-building="${device.id}"]`);
    const toggle = () => {
      paused = true;
      $("#twin-pause").textContent = en
        ? "Resume animation"
        : "Nadaljuj animacijo";
      $("#twin-pause").setAttribute("aria-pressed", "true");
      const states = [...steps[index].states];
      states[i] = states[i] ? 0 : 1;
      const value = states[i]
        ? en
          ? "on"
          : "vključena"
        : en
          ? "off"
          : "izklopljena";
      render({
        ...steps[index],
        states,
        text: `${device.name}: ${en ? "manual change" : "ročna sprememba"}`,
        rule: en
          ? "Manual demonstration change"
          : "Ročna demonstracijska sprememba",
        event: `${device.id}: ${en ? "lighting" : "razsvetljava"} ${value}.`,
      });
      steps[index] = { ...steps[index], states };
      schedule();
    };
    building.addEventListener("click", toggle);
    building.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  observer.observe(root.querySelector(".twin-workspace"));
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", schedule);
  render(steps[index]);
  schedule();
}
