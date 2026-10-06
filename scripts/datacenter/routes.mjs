// People on the datacenter maquette, in board millimetres (see scene.js). The
// model has no roads, so there is no traffic: only scripted people, each on a
// short stroll walked back and forth with a pose held at each end (see ACTORS
// in src/nexavia/showcase-room/traffic.js). They are drawn larger than on the
// other maquettes, to the model's scale.

// Each level's raised floor and where the level opens (LAYOUT in scene.js).
const LEVELS = [
  { floor: 10, open: 380 },
  { floor: 50, open: 290 },
  { floor: 90, open: 200 },
];

export const ROUTES = {};

const NORTH = -Math.PI / 2;
const EAST = 0;
const SIZE = 2.2;

// A stroll along x on a level's raised floor; y is measured from where the
// level opens.
const actor = (level, y, xs, stops) => {
  const { floor, open } = LEVELS[level];
  return {
    z: floor,
    size: SIZE,
    path: xs.map((x) => [x, open + y]),
    stops,
  };
};
const work = (face, time = [3, 7]) => ({ pose: "work", face, time });

export const ACTORS = [
  // Technicians at the racks.
  actor(0, 57, [136, 160, 190], [work(NORTH), work(NORTH, [4, 8])]),
  actor(1, 57, [220, 250, 284], [work(NORTH, [4, 8]), work(NORTH)]),
  actor(2, 57, [116, 150, 178], [work(NORTH), work(NORTH, [2, 5])]),
  // The plant operator at the pumps.
  actor(0, 58, [420, 440, 462], [work(EAST), work(NORTH, [2, 5])]),
  // The electrician at the power supplies.
  actor(1, 56, [392, 412, 436], [work(NORTH, [4, 8]), work(NORTH)]),
  // The operator in the control room.
  actor(2, 68, [400, 424, 450], [work(NORTH, [5, 9]), work(NORTH, [3, 6])]),
];
