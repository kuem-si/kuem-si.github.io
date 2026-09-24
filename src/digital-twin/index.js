const root = document.querySelector('[data-twin-root]');

if (root) {
  const devices = [
    { id: 'BLDG_01', name: 'Mestna hiša', watts: 34 },
    { id: 'BLDG_02', name: 'Poslovna stavba', watts: 52 },
    { id: 'BLDG_03', name: 'Stanovanjski blok', watts: 41 },
  ];
  const steps = [
    { text: 'Senzor LIGHT_01: 46 lx · dovolj dnevne svetlobe', lux: 46, states: [0, 0, 0], rule: 'Pogoj ni izpolnjen · razsvetljava izklopljena', event: 'Senzor svetlobe je izmeril 46 lx.' },
    { text: 'Senzor LIGHT_01: 18 lx · padec svetlobe', lux: 18, states: [0, 0, 0], rule: 'Pogoj izpolnjen · ukaz se pošilja prek GW_01', event: 'Prehod GW_01 je posredoval meritev 18 lx.' },
    { text: 'Pravilo v Nexavii vklopi mestno hišo', lux: 18, states: [1, 0, 0], rule: 'Aktivno · samodejni vklop razsvetljave', event: 'BLDG_01: razsvetljava vključena.' },
    { text: 'Vključi se razsvetljava poslovne stavbe', lux: 18, states: [1, 1, 0], rule: 'Aktivno · samodejni vklop razsvetljave', event: 'BLDG_02: razsvetljava vključena.' },
    { text: 'Stanovanjski blok se zatemni na 50 %', lux: 18, states: [1, 1, .5], rule: 'Aktivno · prilagoditev svetlosti', event: 'BLDG_03: svetlost nastavljena na 50 %.' },
    { text: 'Svetloba se vrne · sistem ugasne luči', lux: 46, states: [0, 0, 0], rule: 'Pogoj ni več izpolnjen · luči izklopljene', event: 'Senzor je izmeril 46 lx. Vse luči so izklopljene.' },
  ];
  const $ = (selector) => root.querySelector(selector);
  let index = 0;
  let paused = false;
  let visible = true;
  let timer;

  function render(step) {
    const power = devices.reduce((total, device, i) => total + device.watts * step.states[i], 0);
    $('#twin-active').textContent = `${step.states.filter(Boolean).length} / 3`;
    $('#twin-power').textContent = `${Math.round(power)} W`;
    $('#twin-lux').textContent = `${step.lux} lx`;
    $('#twin-rule-status').textContent = step.rule;
    $('#twin-event').textContent = step.event;
    $('#twin-step').textContent = step.text;
    devices.forEach((device, i) => {
      const level = step.states[i];
      const building = root.querySelector(`[data-building="${device.id}"]`);
      const row = root.querySelector(`[data-row="${device.id}"]`);
      building.style.setProperty('--light-level', level);
      building.classList.toggle('is-lit', level > 0);
      building.setAttribute('aria-label', `${device.name}: ${level === 1 ? 'vključeno' : level ? 'zatemnjeno na 50 %' : 'izklopljeno'}. Spremeni osvetlitev.`);
      row.querySelector('.twin-state').textContent = level === 1 ? 'Vključeno' : level ? 'Zatemnjeno 50 %' : 'Izklopljeno';
      row.querySelector('.twin-state').dataset.state = level ? 'on' : 'off';
      row.querySelector('.twin-watts').textContent = `${Math.round(device.watts * level)} W`;
    });
  }

  function next() {
    index = (index + 1) % steps.length;
    render(steps[index]);
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(next, 3200);
    root.classList.toggle('is-paused', paused || !visible || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  $('#twin-pause').addEventListener('click', () => {
    paused = !paused;
    $('#twin-pause').textContent = paused ? 'Nadaljuj animacijo' : 'Začasno ustavi';
    $('#twin-pause').setAttribute('aria-pressed', String(paused));
    $('.twin-live').lastChild.textContent = paused ? ' Ročno upravljanje' : ' Simulacija teče';
    schedule();
  });
  $('#twin-next').addEventListener('click', next);
  devices.forEach((device, i) => {
    const building = root.querySelector(`[data-building="${device.id}"]`);
    const toggle = () => {
      paused = true;
      $('#twin-pause').textContent = 'Nadaljuj animacijo';
      $('#twin-pause').setAttribute('aria-pressed', 'true');
      const states = [...steps[index].states];
      states[i] = states[i] ? 0 : 1;
      const value = states[i] ? 'vključena' : 'izklopljena';
      render({ ...steps[index], states, text: `${device.name}: ročna sprememba`, rule: 'Ročna demonstracijska sprememba', event: `${device.id}: razsvetljava ${value}.` });
      steps[index] = { ...steps[index], states };
      schedule();
    };
    building.addEventListener('click', toggle);
    building.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
  });
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); });
  observer.observe(root.querySelector('.twin-workspace'));
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', schedule);
  render(steps[index]);
  schedule();
}
