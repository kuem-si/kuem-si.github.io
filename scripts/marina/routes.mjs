// Traffic routes on the marina maquette, in board millimetres (see scene.js).
// The generator projects them to scene pixels and finds, for each route, the
// scenery standing in front of it (occluders).
//
//   mode       "road" (cars, cyclists), "walk" (people, both directions) or
//              "water" (boats)
//   z          surface height; height is how tall its traffic stands
//   halfWidth  half the traffic's length on screen, for occlusion tests (px)
//   points     [x, y, kerb offset?]; routes start and end off the board or at
//              a door
//   stops      [{ point, time }]: wait at a waypoint (s), e.g. at a landing
//   fade       [start, end]: walkers fade in or out there (a door, a pier tip)

const road = { mode: "road", z: 0, height: 20, halfWidth: 16 };
const walk = { mode: "walk", z: 1, height: 12, halfWidth: 4 };
const water = { mode: "water", z: -5, height: 30, halfWidth: 26 };

export const ROUTES = {
  coastEast: { ...road, points: [[-70, 187, 6], [300, 187, 6], [670, 187, 6]] },
  coastWest: { ...road, points: [[670, 173, 6], [300, 173, 6], [-70, 173, 6]] },
  // Car parks: in along one aisle, round the end of the parked rows, out
  // along the other.
  westLot: {
    ...road,
    points: [[-60, 366], [60, 366], [118, 366], [140, 372], [150, 392], [150, 414], [140, 434], [118, 440], [60, 440], [-60, 440]],
  },
  eastLot: {
    ...road,
    points: [[660, 416], [560, 416], [480, 416], [462, 422], [456, 432], [462, 442], [480, 448], [560, 448], [660, 448]],
  },
  promenade: { ...walk, points: [[-40, 214], [300, 215], [640, 214]] },
  townPavement: { ...walk, points: [[-40, 159], [300, 159], [640, 159]] },
  // From the hotel entrance along the quay and out along the middle west pier.
  hotelPier: { ...walk, points: [[87, 306], [120, 322], [164, 330], [167, 360], [180, 372], [256, 372]], fade: [true, true] },
  // From the restaurant terrace to the first east pier.
  terracePier: { ...walk, points: [[498, 331], [470, 334], [436, 320], [432, 298], [420, 292], [344, 292]], fade: [true, true] },
  seaEast: { ...water, height: 60, points: [[-90, 566], [300, 568], [690, 565]] },
  seaWest: { ...water, height: 60, points: [[690, 586], [300, 584], [-90, 587]] },
  // A harbour tour: in through the entrance, up the fairway to the landing on
  // the promenade, round and back out to sea.
  harbourTour: {
    ...water,
    points: [[-90, 590], [120, 586], [230, 574], [284, 556], [300, 534], [310, 492], [312, 400], [312, 318], [311, 282], [300, 262], [289, 282], [288, 318], [289, 400], [291, 492], [300, 534], [322, 556], [420, 574], [690, 580]],
    stops: [{ point: 9, time: 6 }],
  },
  // A call at the fuel dock on the east quay.
  fuelCall: {
    ...water,
    points: [[690, 578], [470, 572], [370, 558], [326, 540], [330, 522], [372, 520], [398, 520], [402, 508], [396, 499], [376, 500], [338, 510], [316, 532], [296, 552], [210, 572], [-90, 580]],
    stops: [{ point: 7, time: 7 }],
  },
};
