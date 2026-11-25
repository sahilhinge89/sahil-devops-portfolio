// World layout for "Ship it." — every distance in scene units (1 unit ≈ 2 m).
// Pure data: no React, no three.js. Axes: +x east (towards open sea), +z towards
// the viewer, -z out over the water, +y up. Water surface is y = 0.

export const WATER_Y = 0;
export const GROUND_Y = 1; // quay deck top

export const QUAY = { minX: -50, maxX: 30, minZ: -6, maxZ: 22, bottom: -3 } as const;
export const QUAY_EDGE_Z = QUAY.minZ;

export const ROAD_Z = -3.5;

export const CONTAINER = { L: 3.0, W: 1.25, H: 1.3, floor: 0.08 } as const;
export const CRATE = { size: 0.7 } as const;

export const TRUCK = {
  deckH: 0.9, // deck above ground
  wheelR: 0.32,
  x0: -26.6, // loading position (container centre)
  xPick: -3.2, // under the crane, aligned with node-1
  xExit: 26,
} as const;
export const DECK_Y = GROUND_Y + TRUCK.deckH;

export const WAREHOUSE = { frontX: -33, backX: -46, minZ: -10, maxZ: 3, height: 6.5 } as const;

export const FORKLIFT = {
  start: -33.05,
  inserted: -32.35, // forks under the crate (crate waits on the apron outside the door)
  atContainer: -28.15, // mast just outside the open container doors
  parked: -32.7,
  crateOnFork: 0.75, // crate centre ahead of the mast
  forkLen: 1.15,
  carryH: 1.06, // crate bottom 2.06 > container floor 1.98
  releaseH: 0.98, // crate bottom on the container floor
  clearH: 0.95,
} as const;

export const GATES_X = [-22, -16, -10] as const;

// Ship (moored). Ship-local frame: bow at +x, deck slot pads at slotX.
export const SHIP = {
  x: 0,
  z: -10,
  length: 18,
  beam: 5,
  deckTop: 1.65, // slot pad top in ship frame (ship y = 0 at rest)
  bridgeX: -6.5,
  slotX: [-3.2, 0.4, 4.0] as const,
} as const;

// Crane (ship-to-shore gantry). Rails along x, trolley along z, hoist along y.
export const CRANE = {
  railZ: [-1.5, -5.5] as const,
  legDX: 3,
  boomY: 10.6, // underside of the boom / trolley
  boomMinZ: -14,
  boomMaxZ: 2.5,
  highH: 7.5,
  carryH: 6.3,
  restTz: -1.0,
} as const;

export const STAGED = [
  { x: SHIP.slotX[1], z: 0.8 },
  { x: SHIP.slotX[2], z: 0.8 },
] as const;

// Heights the spreader bottom reaches when its twist-locks meet a container top.
export const H_TRUCK_TOP = DECK_Y + CONTAINER.H; // 3.2
export const H_GROUND_TOP = GROUND_Y + CONTAINER.H; // 2.3
export const H_SLOT_TOP = SHIP.deckTop + CONTAINER.H; // 2.95

// Departure path (cubic Bézier in xz) for the ship centre.
export const SHIP_PATH = [
  { x: 0, z: -10 },
  { x: 8, z: -10 },
  { x: 16, z: -13 },
  { x: 24, z: -18 },
] as const;

export const T_END = 10;
export const T_HERO = 9.4;
export const T_STILL = 7.6; // composed still frame for reduced motion
