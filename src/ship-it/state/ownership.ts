// Cargo ownership — the single source of truth for who holds each item.
// Pure TS (no React / three.js). Every change goes through `transfer`, which checks a
// table of legal transitions and, in development, logs invalid moves and duplicate owners.

export type ItemId = "crate" | "c1" | "c2" | "c3";
export type OwnerKind = "ground" | "forklift" | "truck" | "container" | "crane" | "ship";

export type OwnerRef =
  | { kind: "ground" }
  | { kind: "forklift" }
  | { kind: "truck" }
  | { kind: "container"; id: "c1" | "c2" | "c3" }
  | { kind: "crane" }
  | { kind: "ship"; slot: 0 | 1 | 2 };

/** Pose relative to the owner's anchor: position of the item's bottom-centre + yaw. */
export interface Pose {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface Holding {
  owner: OwnerRef;
  local: Pose;
}

export type CargoState = Record<ItemId, Holding>;

/** Legal ownership transitions. ground → forklift → truck/container → crane → ship. */
export const LEGAL: Record<OwnerKind, readonly OwnerKind[]> = {
  ground: ["forklift", "crane"],
  forklift: ["container", "truck", "ground"],
  truck: ["crane", "forklift"],
  container: ["forklift"],
  crane: ["ship", "truck", "ground"],
  ship: ["crane"],
};

/** Owners that can hold only one item at a time. */
const EXCLUSIVE: readonly OwnerKind[] = ["forklift", "truck", "crane", "ship", "container"];

export const isDev = () => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

export function ownerKey(o: OwnerRef): string {
  if (o.kind === "ship") return `ship:${o.slot}`;
  if (o.kind === "container") return `container:${o.id}`;
  return o.kind;
}

export function poseIsFinite(p: Pose) {
  return Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z) && Number.isFinite(p.yaw);
}

export interface TransferResult {
  ok: boolean;
  reason?: string;
}

/**
 * Move `item` to `to`. `worldItem` is the item's current world pose and `worldAnchor`
 * the new owner's anchor pose, both at the same instant, so the item keeps its world
 * position and rotation across the hand-over.
 */
export function transfer(
  state: CargoState,
  item: ItemId,
  to: OwnerRef,
  worldItem: Pose,
  worldAnchor: Pose,
  log: (msg: string) => void = defaultLog,
): TransferResult {
  const from = state[item].owner;
  if (!LEGAL[from.kind].includes(to.kind)) {
    const reason = `invalid transition ${item}: ${ownerKey(from)} → ${ownerKey(to)}`;
    log(reason);
    return { ok: false, reason };
  }
  if (to.kind === "container" && to.id === item) {
    const reason = `${item} cannot own itself`;
    log(reason);
    return { ok: false, reason };
  }
  if (EXCLUSIVE.includes(to.kind)) {
    const key = ownerKey(to);
    for (const other of Object.keys(state) as ItemId[]) {
      if (other !== item && ownerKey(state[other].owner) === key) {
        const reason = `duplicate owner ${key}: already holds ${other}, refused ${item}`;
        log(reason);
        return { ok: false, reason };
      }
    }
  }
  const local = relativePose(worldAnchor, worldItem);
  if (!poseIsFinite(local)) {
    const reason = `NaN pose for ${item} on transfer to ${ownerKey(to)}`;
    log(reason);
    return { ok: false, reason };
  }
  state[item] = { owner: to, local };
  return { ok: true };
}

function defaultLog(msg: string) {
  if (isDev()) console.warn(`[ship-it/cargo] ${msg}`);
}

// ── 2.5D pose maths (yaw only — the ship never rolls while loading) ──────────
export function composePose(a: Pose, b: Pose, out: Pose = { x: 0, y: 0, z: 0, yaw: 0 }): Pose {
  const c = Math.cos(a.yaw);
  const s = Math.sin(a.yaw);
  // rotation about +y: x' = x c + z s, z' = -x s + z c
  const x = a.x + b.x * c + b.z * s;
  const z = a.z - b.x * s + b.z * c;
  out.x = x;
  out.y = a.y + b.y;
  out.z = z;
  out.yaw = a.yaw + b.yaw;
  return out;
}

export function relativePose(anchor: Pose, world: Pose): Pose {
  const dx = world.x - anchor.x;
  const dz = world.z - anchor.z;
  const c = Math.cos(anchor.yaw);
  const s = Math.sin(anchor.yaw);
  return {
    x: dx * c - dz * s,
    y: world.y - anchor.y,
    z: dx * s + dz * c,
    yaw: world.yaw - anchor.yaw,
  };
}
