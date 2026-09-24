const root = document.querySelector("[data-twin-root]");

if (root) {
  const en = document.documentElement.lang.startsWith("en");
  const devices = [
    { id: "BLDG_01", name: en ? "City hall" : "Mestna hiša", watts: 34 },
    {
      id: "BLDG_02",
      name: en ? "Office building" : "Poslovna stavba",
      watts: 52,
    },
    {
      id: "BLDG_03",
      name: en ? "Apartment building" : "Stanovanjski blok",
      watts: 41,
    },
  ];
  const steps = en
    ? [
        {
          text: "Sensor LIGHT_01: 46 lx · enough daylight",
          lux: 46,
          states: [0, 0, 0],
          rule: "Condition not met · lighting is off",
          event: "Light sensor measured 46 lx.",
        },
        {
          text: "Sensor LIGHT_01: 18 lx · light level drops",
          lux: 18,
          states: [0, 0, 0],
          rule: "Condition met · command sent via GW_01",
          event: "Gateway GW_01 relayed a reading of 18 lx.",
        },
        {
          text: "Nexavia rule switches on city hall lighting",
          lux: 18,
          states: [1, 0, 0],
          rule: "Active · automatic lighting control",
          event: "BLDG_01: lighting switched on.",
        },
        {
          text: "Office building lighting switches on",
          lux: 18,
          states: [1, 1, 0],
          rule: "Active · automatic lighting control",
          event: "BLDG_02: lighting switched on.",
        },
        {
          text: "Apartment building dims to 50%",
          lux: 18,
          states: [1, 1, 0.5],
          rule: "Active · brightness adjustment",
          event: "BLDG_03: brightness set to 50%.",
        },
        {
          text: "Daylight returns · system switches lights off",
          lux: 46,
          states: [0, 0, 0],
          rule: "Condition no longer met · lights switched off",
          event: "Sensor measured 46 lx. All lights are off.",
        },
      ]
    : [
        {
          text: "Senzor LIGHT_01: 46 lx · dovolj dnevne svetlobe",
          lux: 46,
          states: [0, 0, 0],
          rule: "Pogoj ni izpolnjen · razsvetljava izklopljena",
          event: "Senzor svetlobe je izmeril 46 lx.",
        },
        {
          text: "Senzor LIGHT_01: 18 lx · padec svetlobe",
          lux: 18,
          states: [0, 0, 0],
          rule: "Pogoj izpolnjen · ukaz se pošilja prek GW_01",
          event: "Prehod GW_01 je posredoval meritev 18 lx.",
        },
        {
          text: "Pravilo v Nexavii vklopi mestno hišo",
          lux: 18,
          states: [1, 0, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "BLDG_01: razsvetljava vključena.",
        },
        {
          text: "Vključi se razsvetljava poslovne stavbe",
          lux: 18,
          states: [1, 1, 0],
          rule: "Aktivno · samodejni vklop razsvetljave",
          event: "BLDG_02: razsvetljava vključena.",
        },
        {
          text: "Stanovanjski blok se zatemni na 50 %",
          lux: 18,
          states: [1, 1, 0.5],
          rule: "Aktivno · prilagoditev svetlosti",
          event: "BLDG_03: svetlost nastavljena na 50 %.",
        },
        {
          text: "Svetloba se vrne · sistem ugasne luči",
          lux: 46,
          states: [0, 0, 0],
          rule: "Pogoj ni več izpolnjen · luči izklopljene",
          event: "Senzor je izmeril 46 lx. Vse luči so izklopljene.",
        },
      ];
  const $ = (selector) => root.querySelector(selector);
  let index = 0;
  let paused = false;
  let visible = true;
  let timer;

  function render(step) {
    const power = devices.reduce(
      (total, device, i) => total + device.watts * step.states[i],
      0,
    );
    $("#twin-active").textContent = `${step.states.filter(Boolean).length} / 3`;
    $("#twin-power").textContent = `${Math.round(power)} W`;
    $("#twin-lux").textContent = `${step.lux} lx`;
    $("#twin-rule-status").textContent = step.rule;
    $("#twin-event").textContent = step.event;
    $("#twin-step").textContent = step.text;
    devices.forEach((device, i) => {
      const level = step.states[i];
      const building = root.querySelector(`[data-building="${device.id}"]`);
      const row = root.querySelector(`[data-row="${device.id}"]`);
      building.style.setProperty("--light-level", level);
      building.classList.toggle("is-lit", level > 0);
      building.setAttribute(
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
