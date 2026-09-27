// Guided scenarios for the showcase maquette: short stories told across the
// model and the Nexavia dashboard. Each step sets the scene through the
// direction API from index.js; nothing here keeps its own device state.
//
// A step is replayable: jumping to step n replays the scenario's setup and
// steps 0..n-1 instantly, then plays step n, so every step can be reached
// with previous/next without drift.

const LAMPS = ["LAMP_01", "LAMP_02", "LAMP_03", "LAMP_04"];
const ALL = ["HOUSE_01", "OFFICE_01", "FACTORY_01", ...LAMPS];
const STEP_MS = 6800;

const icons = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20h4"/></svg>',
};

// Scenario content. `t(sl, en)` picks the page language; `n(value, digits)`
// formats a number with the page's decimal separator.
function scenarioList(t, n) {
  return [
    {
      id: "water-leak",
      title: t("Nočno puščanje vode", "Water leak at night"),
      setup(api) {
        api.setLevel("HOUSE_01", 0);
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setReading("house-water", `${n(0, 2)} m³/h`);
        api.setAlarms([]);
        api.pin("house-water");
        api.narrate({ rule: t("Pravilo: nočni pretok > 0,1 m³/h dlje kot 30 min", "Rule: night flow > 0.1 m³/h for over 30 min") });
      },
      steps: [
        {
          time: "02:10",
          focus: { x: 470, y: 180, zoom: 1.55, radius: 0.24 },
          title: t("Noč v hiši z vrtom", "Night at the garden house"),
          text: t("Vsi spijo, luči so ugasnjene. Ponoči je pretok vode v hiši skoraj nič.", "Everyone is asleep and the lights are off. At night, water flow in the house is close to zero."),
          run(api) {
            api.spotlight(api.$meterRow("house-water"));
          },
        },
        {
          time: "02:14",
          title: t("Voda začne teči", "Water starts flowing"),
          text: t("Števec HOUSE_WATER_01 zazna stalen pretok, čeprav v hiši nihče ne porablja vode.", "Meter HOUSE_WATER_01 detects a steady flow although nobody in the house is using water."),
          run(api, play) {
            play.count("house-water", 0, 0.36, (v) => `${n(v, 2)} m³/h`);
            api.log(t("HOUSE_WATER_01 · Nočni pretok 0,36 m³/h", "HOUSE_WATER_01 · Night flow 0.36 m³/h"), "02:14");
          },
        },
        {
          time: "02:44",
          title: t("Pravilo sproži alarm", "The rule raises an alarm"),
          text: t("Po 30 minutah neprekinjenega pretoka Nexavia prepozna sum puščanja in odpre alarm.", "After 30 minutes of uninterrupted flow, Nexavia recognises a suspected leak and opens an alarm."),
          run(api) {
            api.setReading("house-water", `${n(0.36, 2)} m³/h`);
            api.setAlarms([["HOUSE_WATER_01", t("Sum puščanja · 30 min", "Suspected leak · 30 min")]]);
            api.spotlight(".twin-alerts");
            api.log(t("HOUSE_WATER_01 · Alarm: sum puščanja", "HOUSE_WATER_01 · Alarm: suspected leak"), "02:44");
          },
        },
        {
          time: "02:45",
          title: t("Obvestilo na telefon", "Notification sent"),
          text: t("Lastnik in vzdrževalec prejmeta SMS in e-pošto. Glavni ventil lahko zapreta na daljavo.", "The owner and the caretaker get an SMS and an email. They can close the main valve remotely."),
          run(api, play) {
            play.toast(t("Sum puščanja vode", "Suspected water leak"), t("Hiša z vrtom · 0,36 m³/h že 30 min", "Garden house · 0.36 m³/h for 30 min"), "02:45");
            api.log(t("Obvestilo poslano · SMS in e-pošta", "Notification sent · SMS and email"), "02:45");
          },
        },
        {
          time: "02:52",
          title: t("Puščanje ustavljeno", "Leak stopped"),
          text: t("Ventil je zaprt, pretok pade na nič in alarm se zapre. Škoda je preprečena ure pred jutranjim odčitkom.", "The valve is closed, flow drops to zero and the alarm closes. Damage is avoided hours before anyone would have noticed."),
          run(api, play) {
            play.count("house-water", 0.36, 0, (v) => `${n(v, 2)} m³/h`);
            api.setAlarms([]);
            api.spotlight(api.$meterRow("house-water"));
            api.log(t("HOUSE_WATER_01 · Ventil zaprt · alarm zaprt", "HOUSE_WATER_01 · Valve closed · alarm closed"), "02:52");
          },
        },
      ],
    },
    {
      id: "river",
      title: t("Narasla reka", "Rising river"),
      setup(api) {
        api.setReading("river", `${n(1.36, 2)} m`, t("Normalno območje", "Normal range"));
        api.setReading("vibration", `${n(0.42, 2)} mm/s`, t("Običajno", "Normal"));
        api.setLevel("LAMP_04", 0);
        api.setAlarms([]);
        api.pin("water");
        api.narrate({ rule: t("Pravilo: gladina reke > 1,80 m", "Rule: river level > 1.80 m") });
      },
      steps: [
        {
          time: "14:00",
          focus: { x: 1010, y: 560, zoom: 1.45, radius: 0.3 },
          title: t("Reka ob običajni gladini", "River at its normal level"),
          text: t("Senzor RIVER_LEVEL_01 meri gladino vsakih pet minut, senzor na mostu pa tresljaje konstrukcije.", "Sensor RIVER_LEVEL_01 measures the level every five minutes; the bridge sensor tracks vibration of the structure."),
          run(api) {
            api.spotlight(api.$sensorRow("river"));
          },
        },
        {
          time: "16:20",
          title: t("Močno deževje", "Heavy rain"),
          text: t("Po nalivu gladina hitro narašča – skoraj 30 cm v dveh urah.", "After a downpour the level climbs fast – almost 30 cm in two hours."),
          run(api, play) {
            play.count("river", 1.36, 1.64, (v) => `${n(v, 2)} m`, t("Narašča", "Rising"));
            api.log(t("RIVER_LEVEL_01 · Gladina 1,64 m · narašča", "RIVER_LEVEL_01 · Level 1.64 m · rising"), "16:20");
          },
        },
        {
          time: "17:05",
          title: t("Opozorilna gladina", "Warning level reached"),
          text: t("Gladina preseže 1,80 m. Nexavia odpre alarm, senzor na mostu hkrati zazna močnejše tresljaje.", "The level passes 1.80 m. Nexavia opens an alarm while the bridge sensor records stronger vibration."),
          run(api, play) {
            play.count("river", 1.64, 1.84, (v) => `${n(v, 2)} m`, t("Opozorilna gladina", "Warning level"));
            api.setReading("vibration", `${n(0.91, 2)} mm/s`, t("Povišano", "Elevated"));
            api.setAlarms([
              ["RIVER_LEVEL_01", t("Opozorilna gladina 1,84 m", "Warning level 1.84 m")],
              ["BRIDGE_VIB_01", t("Povišani tresljaji 0,91 mm/s", "Elevated vibration 0.91 mm/s")],
            ]);
            api.spotlight(".twin-alerts");
            api.log(t("RIVER_LEVEL_01 · Alarm: opozorilna gladina", "RIVER_LEVEL_01 · Alarm: warning level"), "17:05");
          },
        },
        {
          time: "17:06",
          focus: { x: 1130, y: 540, zoom: 1.55, radius: 0.24 },
          title: t("Samodejni ukrepi", "Automatic response"),
          text: t("Razsvetljava ob mostu se vklopi za boljšo vidnost, civilna zaščita prejme obvestilo.", "Lighting by the bridge switches on for visibility, and civil protection is notified."),
          run(api, play) {
            api.setLevel("LAMP_04", 1);
            api.spotlight(api.$row("LAMP_04"));
            play.toast(t("Opozorilo: gladina reke", "Warning: river level"), t("1,84 m · obveščena civilna zaščita", "1.84 m · civil protection notified"), "17:06");
            api.log(t("LAMP_04 · Varnostna razsvetljava mostu vklopljena", "LAMP_04 · Bridge safety lighting on"), "17:06");
          },
        },
        {
          time: "22:30",
          focus: { x: 1010, y: 560, zoom: 1.3, radius: 0.34 },
          title: t("Voda upada", "Water recedes"),
          text: t("Gladina pade pod mejo in alarm se samodejno zapre. Celoten dogodek ostane v zgodovini za analizo.", "The level drops below the limit and the alarm closes automatically. The whole event stays in the history for analysis."),
          run(api, play) {
            play.count("river", 1.84, 1.52, (v) => `${n(v, 2)} m`, t("Upada", "Falling"));
            api.setReading("vibration", `${n(0.44, 2)} mm/s`, t("Običajno", "Normal"));
            api.setLevel("LAMP_04", 0);
            api.setAlarms([]);
            api.spotlight(api.$sensorRow("river"));
            api.log(t("RIVER_LEVEL_01 · Gladina 1,52 m · alarm zaprt", "RIVER_LEVEL_01 · Level 1.52 m · alarm closed"), "22:30");
          },
        },
      ],
    },
    {
      id: "dimming",
      title: t("Pametno zatemnjevanje", "Smart dimming"),
      setup(api) {
        LAMPS.forEach((id) => api.setLevel(id, 1));
        api.setReading("cyclists", t("124 danes", "124 today"));
        api.setAlarms([]);
        api.pin(null);
        api.narrate({ rule: t("Pravilo: brez gibanja 30 min → zatemnitev na 50 %", "Rule: no movement for 30 min → dim to 50%") });
      },
      steps: [
        {
          time: "22:00",
          focus: { x: 760, y: 430, zoom: 1.2, radius: 0.46 },
          title: t("Polna razsvetljava", "Full lighting"),
          text: t("Po sončnem zahodu svetijo vse štiri ulične svetilke s polno močjo.", "After sunset all four street lights run at full power."),
          run(api) {
            api.spotlight("#twin-power");
          },
        },
        {
          time: "00:30",
          title: t("Ulice se izpraznijo", "Streets go quiet"),
          text: t("Senzorji pol ure ne zaznajo gibanja. Svetilke se zatemnijo na 50 % – poraba se prepolovi.", "Sensors see no movement for half an hour. The lights dim to 50% and consumption halves."),
          run(api) {
            LAMPS.forEach((id) => api.setLevel(id, 0.5));
            api.spotlight("#twin-power");
            api.log(t("LAMP_01–LAMP_04 · Zatemnitev na 50 %", "LAMP_01–LAMP_04 · Dimmed to 50%"), "00:30");
          },
        },
        {
          time: "01:12",
          focus: { x: 703, y: 440, zoom: 1.6, radius: 0.2 },
          title: t("Kolesar na poti", "A cyclist passes"),
          text: t("Senzor zazna kolesarja in svetilka LAMP_03 za dve minuti spet zasveti s polno močjo.", "A sensor detects a cyclist and LAMP_03 returns to full power for two minutes."),
          run(api) {
            api.setLevel("LAMP_03", 1);
            api.setReading("cyclists", t("125 danes", "125 today"));
            api.spotlight(api.$row("LAMP_03"));
            api.log(t("LAMP_03 · Gibanje zaznano · 100 %", "LAMP_03 · Movement detected · 100%"), "01:12");
          },
        },
        {
          time: "01:14",
          title: t("Nazaj na varčni način", "Back to saving mode"),
          text: t("Ko je ulica spet prazna, se svetilka ponovno zatemni.", "Once the street is empty again, the light dims back down."),
          run(api) {
            api.setLevel("LAMP_03", 0.5);
            api.log(t("LAMP_03 · Zatemnitev na 50 %", "LAMP_03 · Dimmed to 50%"), "01:14");
          },
        },
        {
          time: "06:40",
          focus: { x: 760, y: 430, zoom: 1.2, radius: 0.46 },
          title: t("Jutro", "Morning"),
          text: t("Ob zori se razsvetljava izklopi. Zatemnjevanje je to noč prihranilo 36 % energije ulične razsvetljave.", "At dawn the lights switch off. Dimming saved 36% of the street-lighting energy tonight."),
          run(api, play) {
            LAMPS.forEach((id) => api.setLevel(id, 0));
            play.toast(t("Prihranek noči", "Tonight's saving"), t("0,80 kWh · 36 % manj energije", "0.80 kWh · 36% less energy"), "06:40");
            api.log(t("Ulična razsvetljava izklopljena · prihranek 0,80 kWh", "Street lighting off · 0.80 kWh saved"), "06:40");
          },
        },
      ],
    },
    {
      id: "gateway",
      title: t("Izpad prehoda", "Gateway outage"),
      setup(api) {
        api.setOnline(ALL, true);
        api.setSync(true);
        api.setStale(false);
        api.setAlarms([]);
        api.pin(null);
        api.narrate({ rule: t("Pravilo: 3 zamujena javljanja → naprava nedosegljiva", "Rule: 3 missed reports → device unreachable") });
      },
      steps: [
        {
          time: "09:00",
          focus: { x: 768, y: 500, zoom: 1, radius: 0.6, spot: false },
          title: t("Vse naprave povezane", "All devices connected"),
          text: t("Vseh sedem naprav pošilja podatke prek prehoda GW_01 v Nexavio.", "All seven devices send their data to Nexavia through gateway GW_01."),
          run(api) {
            api.spotlight(".twin-sync");
          },
        },
        {
          time: "09:12",
          title: t("Prehod ne odgovarja", "The gateway stops responding"),
          text: t("Prehodu GW_01 zmanjka napajanja. Po treh zamujenih javljanjih Nexavia označi naprave kot nedosegljive.", "Gateway GW_01 loses power. After three missed reports Nexavia marks the devices as unreachable."),
          run(api) {
            api.setOnline(ALL, false);
            api.setSync(false);
            api.setAlarms([["GW_01", t("Prehod ne odgovarja · 3 min", "Gateway not responding · 3 min")]]);
            api.spotlight(".twin-table");
            api.log(t("GW_01 · Alarm: prehod ne odgovarja", "GW_01 · Alarm: gateway not responding"), "09:12");
          },
        },
        {
          time: "09:13",
          title: t("Zadnje znane vrednosti", "Last known values"),
          text: t("Nadzorna plošča prikaže zadnje znane meritve in jih označi kot zastarele. Naprave na terenu delujejo naprej samostojno.", "The dashboard keeps the last known readings and marks them as stale. Devices in the field carry on working on their own."),
          run(api) {
            api.setStale(true);
            api.spotlight(".twin-meter-readings");
          },
        },
        {
          time: "09:41",
          title: t("Serviser na terenu", "Technician on site"),
          text: t("Nexavia samodejno odpre servisni nalog. Serviser zamenja napajalnik prehoda.", "Nexavia opens a service ticket automatically. A technician replaces the gateway's power supply."),
          run(api, play) {
            play.toast(t("Servisni nalog #2481", "Service ticket #2481"), t("GW_01 · zamenjava napajalnika", "GW_01 · power supply replacement"), "09:41");
            api.log(t("Servisni nalog #2481 odprt · GW_01", "Service ticket #2481 opened · GW_01"), "09:41");
          },
        },
        {
          time: "09:42",
          title: t("Povezava obnovljena", "Connection restored"),
          text: t("Naprave se ponovno povežejo in pošljejo meritve, shranjene med izpadom. V podatkih ni vrzeli.", "The devices reconnect and upload the readings they stored during the outage. The data has no gaps."),
          run(api) {
            api.setOnline(ALL, true);
            api.setSync(true);
            api.setStale(false);
            api.setAlarms([]);
            api.spotlight(".twin-table");
            api.log(t("GW_01 · 7 naprav ponovno povezanih · 30 min podatkov prenesenih", "GW_01 · 7 devices reconnected · 30 min of data uploaded"), "09:42");
          },
        },
      ],
    },
  ];
}

export function initScenarios(root, api) {
  const panel = root.querySelector(".twin-city-panel");
  const wrap = root.querySelector(".twin-scene-wrap");
  if (!panel || !wrap) return null;
  const { en } = api;
  const t = (sl, english) => (en ? english : sl);
  const n = (value, digits) => value.toFixed(digits).replace(".", en ? "." : ",");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (selector) => root.querySelector(selector);
  // Dashboard rows the scenarios point at.
  api.$row = (id) => $(`[data-row="${id}"]`);
  api.$meterRow = (key) => $(`#meter-${key}`)?.parentElement;
  api.$sensorRow = (key) => $(key === "river" ? "#sensor-water-level" : `#sensor-${key}`)?.parentElement;
  const scenarios = scenarioList(t, n);
  const format = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}`;

  // Launcher.
  const launcher = document.createElement("div");
  launcher.className = "twin-scenarios";
  launcher.setAttribute("role", "group");
  launcher.setAttribute("aria-label", t("Vodeni scenariji", "Guided scenarios"));
  launcher.innerHTML = `<span class="twin-scenarios-label">${t("Vodeni scenariji", "Guided scenarios")}</span>`;
  scenarios.forEach((scenario, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "twin-scenario-chip";
    button.dataset.scenario = scenario.id;
    button.disabled = true;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<i>${String(i + 1).padStart(2, "0")}</i><b></b><small>${format(scenario.steps.length * STEP_MS)}</small>`;
    button.querySelector("b").textContent = scenario.title;
    button.addEventListener("click", () => (active === scenario ? stop() : start(scenario)));
    launcher.append(button);
  });
  panel.querySelector(".twin-panel-head")?.after(launcher);

  // Player: a lower-third card on the maquette.
  const player = document.createElement("section");
  player.className = "scenario-player";
  player.dataset.scenarioPlayer = "";
  player.hidden = true;
  player.tabIndex = -1;
  player.setAttribute("role", "region");
  player.setAttribute("aria-label", t("Vodeni scenarij", "Guided scenario"));
  player.innerHTML = `
    <header><span class="scenario-kicker"></span><button type="button" class="scenario-close" aria-label="${t("Zapri scenarij", "Close scenario")}">${icons.close}</button></header>
    <div class="scenario-body" aria-live="polite"><p class="scenario-time"></p><div><h3 class="scenario-title"></h3><p class="scenario-text"></p></div></div>
    <div class="scenario-progress" aria-hidden="true"></div>
    <footer>
      <button type="button" class="scenario-prev" aria-label="${t("Prejšnji korak", "Previous step")}">${icons.prev}</button>
      <button type="button" class="scenario-play"></button>
      <button type="button" class="scenario-next" aria-label="${t("Naslednji korak", "Next step")}">${icons.next}</button>
      <span class="scenario-count"></span>
    </footer>`;
  wrap.append(player);
  const toast = document.createElement("div");
  toast.className = "scenario-toast";
  toast.setAttribute("aria-hidden", "true");
  toast.innerHTML = `<span class="scenario-toast-icon">${icons.bell}</span><span><small></small><b></b><span></span></span>`;
  wrap.append(toast);
  const ui = {
    kicker: player.querySelector(".scenario-kicker"),
    time: player.querySelector(".scenario-time"),
    title: player.querySelector(".scenario-title"),
    text: player.querySelector(".scenario-text"),
    progress: player.querySelector(".scenario-progress"),
    count: player.querySelector(".scenario-count"),
    play: player.querySelector(".scenario-play"),
  };

  let active = null;
  let current = 0;
  let playing = false;
  let finished = false;
  let timer = 0;
  let remaining = STEP_MS;
  let startedAt = 0;
  let tweens = [];
  let toastTimer = 0;

  // Effects a step can play; in instant mode they jump to their end state.
  function effects(instant) {
    return {
      count(key, from, to, fmt, note) {
        if (instant || motion.matches) return api.setReading(key, fmt(to), note);
        const begin = performance.now();
        const duration = 1600;
        const tick = (now) => {
          const k = Math.min(1, (now - begin) / duration);
          const eased = 1 - (1 - k) ** 3;
          api.setReading(key, fmt(from + (to - from) * eased), note);
          if (k < 1) tweens.push(requestAnimationFrame(tick));
        };
        tweens.push(requestAnimationFrame(tick));
      },
      toast(title, text, time) {
        if (instant) return;
        toast.querySelector("small").textContent = `Nexavia · ${time}`;
        toast.querySelector("b").textContent = title;
        toast.querySelector("span > span").textContent = text;
        toast.classList.remove("is-visible");
        void toast.offsetWidth;
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 4600);
      },
    };
  }

  function setPlayButton() {
    const icon = finished ? icons.replay : playing ? icons.pause : icons.play;
    const label = finished ? t("Ponovi scenarij", "Replay scenario") : playing ? t("Premor", "Pause") : t("Nadaljuj", "Play");
    ui.play.innerHTML = icon;
    ui.play.setAttribute("aria-label", label);
    player.classList.toggle("is-paused", !playing);
  }

  function renderProgress() {
    ui.progress.replaceChildren(
      ...active.steps.map((_, i) => {
        const segment = document.createElement("i");
        segment.className = i < current || finished ? "is-done" : i === current ? "is-current" : "";
        segment.append(document.createElement("b"));
        return segment;
      }),
    );
    ui.progress.style.setProperty("--step-ms", `${STEP_MS}ms`);
  }

  function schedule() {
    clearTimeout(timer);
    if (!playing || finished) return;
    startedAt = performance.now();
    timer = setTimeout(advance, remaining);
  }

  function advance() {
    if (current < active.steps.length - 1) goTo(current + 1);
    else {
      finished = true;
      playing = false;
      renderProgress();
      setPlayButton();
      ui.count.textContent = t("Scenarij končan", "Scenario complete");
    }
  }

  // Replays the setup and earlier steps instantly, then plays this step.
  function goTo(index) {
    tweens.forEach(cancelAnimationFrame);
    tweens = [];
    current = Math.max(0, Math.min(active.steps.length - 1, index));
    finished = false;
    active.setup(api);
    let focus = null;
    active.steps.forEach((step, i) => {
      if (step.focus) focus = step.focus;
      if (i < current) step.run(api, effects(true));
    });
    const step = active.steps[current];
    step.run(api, effects(false));
    ui.time.textContent = step.time;
    ui.title.textContent = step.title;
    ui.text.textContent = step.text;
    ui.count.textContent = t(`Korak ${current + 1} / ${active.steps.length}`, `Step ${current + 1} of ${active.steps.length}`);
    api.narrate({ text: `${active.title} · ${step.title}` });
    renderProgress();
    setPlayButton();
    api.focus(focus);
    remaining = STEP_MS;
    schedule();
  }

  function start(scenario) {
    if (active) api.exit();
    active = scenario;
    launcher.querySelectorAll("[data-scenario]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scenario === scenario.id)));
    api.enter();
    player.hidden = false;
    wrap.classList.add("has-scenario");
    ui.kicker.textContent = `${t("Scenarij", "Scenario")} · ${scenario.title}`;
    playing = true;
    goTo(0);
    player.focus({ preventScroll: true });
  }

  function stop() {
    if (!active) return;
    const id = active.id;
    clearTimeout(timer);
    clearTimeout(toastTimer);
    tweens.forEach(cancelAnimationFrame);
    toast.classList.remove("is-visible");
    active = null;
    player.hidden = true;
    wrap.classList.remove("has-scenario");
    launcher.querySelectorAll("[data-scenario]").forEach((button) => button.setAttribute("aria-pressed", "false"));
    api.exit();
    launcher.querySelector(`[data-scenario="${id}"]`)?.focus({ preventScroll: true });
  }

  function togglePlay() {
    if (finished) {
      playing = true;
      return goTo(0);
    }
    if (playing) {
      remaining = Math.max(400, remaining - (performance.now() - startedAt));
      playing = false;
      clearTimeout(timer);
    } else {
      playing = true;
      schedule();
    }
    setPlayButton();
  }

  ui.play.addEventListener("click", togglePlay);
  player.querySelector(".scenario-prev").addEventListener("click", () => goTo(current - 1));
  player.querySelector(".scenario-next").addEventListener("click", () => (current < active.steps.length - 1 ? goTo(current + 1) : advance()));
  player.querySelector(".scenario-close").addEventListener("click", stop);
  player.addEventListener("keydown", (event) => {
    if (event.target.closest("button") && (event.key === " " || event.key === "Enter")) return;
    const actions = { Escape: stop, ArrowLeft: () => goTo(current - 1), ArrowRight: () => goTo(current + 1), " ": togglePlay };
    if (!actions[event.key]) return;
    event.preventDefault();
    actions[event.key]();
  });
  // Keep the camera framed when the layout changes mid-scenario.
  window.addEventListener("resize", () => {
    if (!active) return;
    let focus = null;
    active.steps.forEach((step, i) => i <= current && step.focus && (focus = step.focus));
    api.focus(focus);
  }, { passive: true });

  return {
    enable() {
      launcher.querySelectorAll("[data-scenario]").forEach((button) => (button.disabled = false));
    },
  };
}
