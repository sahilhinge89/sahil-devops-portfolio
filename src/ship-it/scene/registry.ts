// Refs the single stepper writes to each frame. Models fill these in on mount.
import type * as THREE from "three";
import type { ItemId } from "../state/ownership";

export interface Registry {
  land?: THREE.Group;
  shipRoot?: THREE.Group;
  forklift?: THREE.Group;
  forkCarriage?: THREE.Group;
  forkWheels: THREE.Object3D[];
  truck?: THREE.Group;
  truckWheels: THREE.Object3D[];
  gantry?: THREE.Group;
  trolley?: THREE.Group;
  spreader?: THREE.Group;
  locks: THREE.Object3D[];
  cables: THREE.Object3D[];
  doors: [THREE.Object3D | null, THREE.Object3D | null];
  items: Partial<Record<ItemId, THREE.Group>>;
  helm?: THREE.Group;
  arms?: THREE.Group;
  beaconLight?: THREE.PointLight;
  beaconGlow?: THREE.Sprite;
  wake?: THREE.InstancedMesh;
  grid?: THREE.Mesh;
  radar?: THREE.Object3D;
  ropes?: THREE.Group;
}

export function createRegistry(): Registry {
  return {
    forkWheels: [],
    truckWheels: [],
    locks: [],
    cables: [],
    doors: [null, null],
    items: {},
  };
}
