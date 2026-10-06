// The datacenter's racks: three levels of ten, each with a temperature and
// humidity sensor. Shared by the page (the cards' first readings) and the twin
// (the readings' drift), so both start from the same climate.

export const LEVELS = [1, 2, 3];
export const RACKS = 10;

const two = (value) => String(value).padStart(2, "0");
// A rack's reading key ("r207" is level 2, rack 07) and its number as shown
// ("2.07").
export const rackKey = (level, rack) => `r${level}${two(rack)}`;
export const rackNumber = (level, rack) => `${level}.${two(rack)}`;

// Inlet air temperature (°C) and humidity (%) of a rack at a step of the
// simulation: a slow drift around the climate it starts from at step 0.
export function rackAt(level, rack, step = 0) {
  const phase = step * 0.9 + rack * 1.7 + level * 2.3;
  const drift = step ? 0.4 * Math.sin(phase) + 0.2 * Math.sin(phase * 2.3) : 0;
  return {
    temp: 22.6 + level * 0.5 + ((rack * 7 + level * 3) % 9) * 0.25 + drift,
    rh: 41 + ((rack * 5 + level * 2) % 8) + Math.round(drift * 3),
  };
}

// The warmest rack of a level at a step.
export function warmest(level, step = 0) {
  let best = { rack: 1, temp: rackAt(level, 1, step).temp };
  for (let rack = 2; rack <= RACKS; rack++) {
    const { temp } = rackAt(level, rack, step);
    if (temp > best.temp) best = { rack, temp };
  }
  return best;
}
