// Guided scenarios for the showcase maquette: short stories told across the
// model and the Nexavia dashboard. Each step sets the scene through the
// direction API from twin.js; nothing here keeps its own device state. The
// scenario lists live with each twin (city.js, marina.js).
//
// A scenario is { id, title, intro?, setup(api), steps: [{ time, title, text,
// focus?, run(api, play) }] }; `play.count` animates a reading and
// `play.toast` shows a notification on the maquette.
//
// A step is replayable: jumping to step n replays the scenario's setup and
// steps 0..n-1 instantly, then plays step n, so every step can be reached
// with previous/next without drift. The maquette's clock follows each step's
// time. `onChange(scenario, step)` reports the open scenario and step (null
// when it closes), so the page can keep them in its address.

const STEP_MS = 6800;

const icons = {
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
  done: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20h4"/></svg>',
};

export function initScenarios(root, api, scenarios, { onChange } = {}) {
  const panel = root.querySelector(".twin-city-panel");
  const wrap = root.querySelector(".twin-scene-wrap");
  if (!panel || !wrap) return null;
  const { en } = api;
  const t = (sl, english) => (en ? english : sl);
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const format = (ms) => `${Math.floor(ms / 60000)}:${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}`;
  // Time between two "hh:mm" clock times, across midnight: "30 min",
  // "5 h 20 min", or "" for none.
  const elapsed = (from, to) => {
    const minutes = (text) => text.split(":").reduce((hours, part) => hours * 60 + Number(part), 0);
    const gap = (((minutes(to) - minutes(from)) % 1440) + 1440) % 1440;
    if (!gap) return "";
    const hours = Math.floor(gap / 60);
    const rest = gap % 60;
    return [hours && `${hours} h`, rest && `${rest} min`].filter(Boolean).join(" ");
  };

  // Launcher.
  const launcher = document.createElement("div");
  launcher.className = "twin-scenarios";
  launcher.setAttribute("role", "group");
  launcher.setAttribute("aria-label", t("Vodeni scenariji", "Guided scenarios"));
  // The introduction (`intro: true`) comes first, marked as the place to
  // start, ahead of the numbered scenarios.
  const label = `<span class="twin-scenarios-label">${t("Vodeni scenariji", "Guided scenarios")}</span>`;
  launcher.innerHTML = scenarios.some((scenario) => scenario.intro) ? "" : label;
  let number = 0;
  scenarios.forEach((scenario) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "twin-scenario-chip";
    button.dataset.scenario = scenario.id;
    button.disabled = true;
    button.setAttribute("aria-pressed", "false");
    const mark = scenario.intro ? icons.play : String(++number).padStart(2, "0");
    button.innerHTML = `<i>${mark}</i><b></b><small>${format(scenario.steps.length * STEP_MS)}</small>`;
    button.querySelector("b").textContent = scenario.title;
    button.addEventListener("click", () => (active === scenario ? stop() : start(scenario)));
    if (scenario.intro) {
      button.classList.add("is-intro");
      button.insertAdjacentHTML("afterbegin", `<span class="twin-scenario-start">${t("Začnite tukaj", "Start here")}</span>`);
      launcher.prepend(button);
      button.insertAdjacentHTML("afterend", label);
    } else launcher.append(button);
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
    <header><span class="scenario-kicker"></span><span class="scenario-tools"><button type="button" class="scenario-share" aria-label="${t("Kopiraj povezavo do tega koraka", "Copy a link to this step")}" title="${t("Kopiraj povezavo do tega koraka", "Copy a link to this step")}">${icons.link}</button><button type="button" class="scenario-close" aria-label="${t("Zapri scenarij", "Close scenario")}">${icons.close}</button></span></header>
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
    api.quiet(true);
    // The timeline holds this scenario's events up to this step.
    api.clearLog();
    active.setup(api);
    let focus = null;
    active.steps.forEach((step, i) => {
      if (step.focus) focus = step.focus;
      if (i < current) step.run(api, effects(true));
    });
    api.quiet(false);
    const step = active.steps[current];
    step.run(api, effects(false));
    api.setClock(step.time);
    // The scenario's clock is simulated: the time since the previous step
    // shows how much the story skipped.
    ui.time.textContent = step.time;
    const gap = current ? elapsed(active.steps[current - 1].time, step.time) : "";
    if (gap) ui.time.append(Object.assign(document.createElement("small"), { textContent: `+${gap}` }));
    ui.title.textContent = step.title;
    ui.text.textContent = step.text;
    ui.count.textContent = t(`Korak ${current + 1} / ${active.steps.length}`, `Step ${current + 1} of ${active.steps.length}`);
    api.narrate({ text: `${active.title} · ${step.title}` });
    renderProgress();
    setPlayButton();
    api.focus(focus);
    remaining = STEP_MS;
    schedule();
    onChange?.(active.id, current);
  }

  function start(scenario, index = 0, autoplay = true) {
    if (active) api.exit();
    active = scenario;
    launcher.querySelectorAll("[data-scenario]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.scenario === scenario.id)));
    api.enter();
    player.hidden = false;
    wrap.classList.add("has-scenario");
    ui.kicker.textContent = `${t("Scenarij", "Scenario")} · ${scenario.title}`;
    playing = autoplay;
    goTo(index);
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
    onChange?.(null);
    launcher.querySelector(`[data-scenario="${id}"]`)?.focus({ preventScroll: true });
  }

  // Copies the page's address, which names this scenario and step.
  const share = player.querySelector(".scenario-share");
  let shareTimer = 0;
  share.addEventListener("click", async () => {
    let copied = true;
    try {
      await navigator.clipboard.writeText(location.href);
    } catch {
      copied = false;
    }
    const label = copied ? t("Povezava kopirana", "Link copied") : t("Kopiranje ni uspelo", "Could not copy the link");
    share.innerHTML = copied ? icons.done : icons.link;
    share.dataset.status = label;
    share.setAttribute("aria-label", label);
    clearTimeout(shareTimer);
    shareTimer = setTimeout(() => {
      share.innerHTML = icons.link;
      delete share.dataset.status;
      share.setAttribute("aria-label", t("Kopiraj povezavo do tega koraka", "Copy a link to this step"));
    }, 2200);
  });

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
    // Opens a scenario from a link: from the start, or held on one step.
    open(id, step = 0, hold = false) {
      const scenario = scenarios.find((item) => item.id === id);
      if (!scenario) return false;
      start(scenario, step, !hold);
      return true;
    },
  };
}
