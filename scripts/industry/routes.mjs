// Traffic on the industry maquette, in board millimetres (see scene.js). The
// generator projects it to scene pixels and finds, for each route, the scenery
// standing in front of it (occluders). Routes are as on the marina
// (scripts/marina/routes.mjs), and also:
//
//   oneWay     a walk followed in one direction only (a shopper's round)
//   stops      may name a pose to hold while waiting, the heading to turn to
//              ("face", radians: 0 east, π/2 towards the viewer) and whether
//              the walker leaves carrying a box ("carry")

const road = { mode: "road", z: 1, height: 20, halfWidth: 16 };
const walk = { mode: "walk", z: 2.2, height: 12, halfWidth: 4 };

const NORTH = -Math.PI / 2;
const EAST = 0;
const WEST = Math.PI;

// A shopper's round: [x, y] waypoints, some with what happens there.
function round(steps) {
  const stops = [];
  const points = steps.map(([x, y, stop], index) => {
    if (stop) stops.push({ point: index, ...stop });
    return [x, y];
  });
  return { ...walk, oneWay: true, fade: [true, true], points, stops };
}
const reach = (face, time = 4) => ({ pose: "load", face, time, carry: true });
const pay = { pose: "work", face: WEST, time: 5 };

export const ROUTES = {
  roadEast: {
    ...road,
    points: [
      [-70, 568, 6],
      [300, 568, 6],
      [670, 568, 6],
    ],
  },
  roadWest: {
    ...road,
    points: [
      [670, 550, 6],
      [300, 550, 6],
      [-70, 550, 6],
    ],
  },
  // Car park: in along one aisle, round the end of the parked rows, out along
  // the other.
  carPark: {
    ...road,
    points: [
      [660, 425],
      [560, 425],
      [352, 425],
      [336, 431],
      [330, 464],
      [336, 497],
      [352, 503],
      [560, 503],
      [660, 503],
    ],
  },
  roadPavement: {
    ...walk,
    z: 2,
    points: [
      [-40, 590],
      [300, 590],
      [640, 590],
    ],
  },

  // Shoppers: from the car, in at the entrance, along the aisles to the
  // shelves and fridges, through a checkout and back to the car.
  dairyRound: round([
    [475, 438],
    [462, 426],
    [446, 420],
    [441.5, 408],
    [441.5, 382],
    [400, 365],
    [348, 362],
    [338, 352],
    [336, 320],
    [333, 262],
    [332.5, 240],
    [332.5, 200, reach(WEST)],
    [332.5, 80],
    [340, 63],
    [365, 61, reach(NORTH, 5)],
    [412, 62],
    [424, 74],
    [424, 160],
    [424, 250],
    [432, 268],
    [440, 282],
    [440, 300, pay],
    [440, 318],
    [500, 334],
    [544, 344],
    [546, 356],
    [500, 367],
    [452, 374],
    [441.5, 384],
    [441.5, 408],
    [452, 422],
    [470, 428],
    [475, 438],
  ]),
  freezerRound: round([
    [640, 363],
    [400, 363],
    [348, 361],
    [338, 352],
    [338, 300],
    [346, 268],
    [400, 262],
    [500, 262],
    [522, 248],
    [522, 215, { pose: "lift", face: EAST, time: 4, carry: true }],
    [522, 110],
    [532, 97],
    [552, 96],
    [563, 106],
    [564, 150, reach(EAST)],
    [563, 250],
    [540, 266],
    [512, 272],
    [504, 284],
    [504, 300, pay],
    [504, 318],
    [528, 336],
    [545, 346],
    [548, 356],
    [580, 364],
    [640, 364],
  ]),
  quickRound: round([
    [416, 414],
    [430, 420],
    [441.5, 408],
    [441.5, 382],
    [400, 365],
    [348, 362],
    [338, 352],
    [338, 300],
    [350, 270],
    [360, 250],
    [360, 205, reach(EAST)],
    [360, 168],
    [368, 160],
    [384, 160],
    [392, 168],
    [392, 250],
    [402, 270],
    [408, 284],
    [408, 300, pay],
    [408, 318],
    [480, 336],
    [544, 344],
    [546, 356],
    [500, 367],
    [452, 374],
    [441.5, 384],
    [441.5, 408],
    [428, 420],
    [416, 414],
  ]),

  // Plant staff: in from the street and up the main aisle to the changing
  // rooms; the office to the machining centres; the docks round the racking.
  mainAisle: {
    ...walk,
    points: [
      [-40, 364],
      [150, 364],
      [186, 362],
      [193, 352],
      [193, 300],
      [193, 165],
      [193, 100],
      [193, 52],
    ],
    fade: [false, true],
  },
  shopFloor: {
    ...walk,
    points: [
      [103, 308],
      [130, 300],
      [168, 290],
      [184, 276],
      [150, 269],
      [60, 269],
      [32, 264],
      [28, 240],
      [28, 176],
      [40, 165],
      [120, 165],
      [182, 165],
      [193, 150],
      [193, 102],
      [182, 88],
      [100, 88],
      [28, 88],
    ],
    fade: [true, true],
  },
  warehouse: {
    ...walk,
    points: [
      [227, 346],
      [224, 300],
      [222, 200],
      [222, 64],
      [228, 55],
      [256, 55],
      [262, 64],
      [262, 200],
      [262, 300],
      [263, 346],
    ],
    fade: [true, true],
  },
};

// People with something to do: a short stroll walked back and forth, with a
// pose held at each end (see ACTORS in src/nexavia/showcase-room/traffic.js).
const actor = (path, stops) => ({ z: walk.z, path, stops });
const work = (face, time = [3, 7]) => ({ pose: "work", face, time });

export const ACTORS = [
  // Machining centres.
  actor(
    [
      [52, 79],
      [70, 79],
      [92, 79],
    ],
    [work(NORTH), work(NORTH)],
  ),
  // Assembly line.
  actor(
    [
      [56, 136],
      [80, 136],
      [104, 136],
    ],
    [work(NORTH), work(NORTH)],
  ),
  actor(
    [
      [124, 136],
      [146, 136],
      [166, 136],
    ],
    [work(NORTH, [4, 8]), work(NORTH, [2, 5])],
  ),
  // Packing: boxes from the table to the pallet.
  actor(
    [
      [124, 238],
      [140, 240],
      [154, 239],
    ],
    [
      { pose: "load", face: NORTH, time: [1.5, 2.4], carry: true },
      { pose: "lift", face: EAST, time: [1.6, 2.4], carry: false },
    ],
  ),
  // Warehouse: picking from the racking.
  actor(
    [
      [220, 186],
      [220, 150],
      [220, 112],
    ],
    [
      { pose: "load", face: WEST, time: [2, 4], carry: true },
      { pose: "lift", face: WEST, time: [2, 3], carry: false },
    ],
  ),
  // Office.
  actor(
    [
      [34, 311],
      [52, 312],
      [78, 311],
    ],
    [work(NORTH, [5, 9]), { pose: "talk", face: 1.2, time: [3, 6] }],
  ),
  // Cashiers.
  actor(
    [
      [399, 296],
      [399, 301],
    ],
    [work(WEST, [4, 8]), work(WEST, [4, 8])],
  ),
  actor(
    [
      [431, 296],
      [431, 301],
    ],
    [work(WEST, [4, 8]), work(WEST, [4, 8])],
  ),
  actor(
    [
      [495, 296],
      [495, 301],
    ],
    [work(WEST, [4, 8]), work(WEST, [4, 8])],
  ),
  // Filling the shelves.
  actor(
    [
      [456, 100],
      [456, 118],
      [456, 138],
    ],
    [
      { pose: "load", face: EAST, time: [3, 5] },
      { pose: "load", face: WEST, time: [3, 5] },
    ],
  ),
];
