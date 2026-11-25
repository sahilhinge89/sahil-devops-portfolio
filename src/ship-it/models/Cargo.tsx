// Containers and the app crate. Each item group's origin is its bottom-centre; the
// stepper sets its world matrix from the ownership state every frame.
import * as THREE from "three";
import { B, useKit } from "./kit";
import type { Registry } from "../scene/registry";
import { CONTAINER, CRATE } from "../timeline/layout";
import type { ItemId } from "../state/ownership";

const { L, W, H } = CONTAINER;
const wt = 0.05;

function frameRails(m: THREE.Material) {
  return (
    <>
      {[0.03, H - 0.03].map((y) =>
        [-W / 2, W / 2].map((z) => <B key={`${y}${z}`} p={[0, y, z]} s={[L + 0.02, 0.06, 0.06]} m={m} />),
      )}
      {[-L / 2, L / 2].map((x) =>
        [-W / 2, W / 2].map((z) => <B key={`p${x}${z}`} p={[x, H / 2, z]} s={[0.07, H, 0.07]} m={m} />),
      )}
    </>
  );
}

type V3 = [number, number, number];
const CC = 0.13; // corner casting size

/** ISO corner castings. `skipRear` leaves the door end clear for the hinged doors. */
function castings(m: THREE.Material, skipRear = false) {
  const out: V3[] = [];
  for (const x of skipRear ? [L / 2 - CC / 2 + 0.03] : [-L / 2 + CC / 2 - 0.03, L / 2 - CC / 2 + 0.03])
    for (const y of [CC / 2, H - CC / 2]) for (const z of [-W / 2 + CC / 2 - 0.03, W / 2 - CC / 2 + 0.03]) out.push([x, y, z]);
  return out.map((p, i) => <B key={`cc${i}`} p={p} s={[CC, CC, CC]} m={m} />);
}

/** Side + top DevOps tool labels and a small tag, assigned deterministically by container index. */
function ContainerLabels({ dark, front = true, index = 0 }: { dark: boolean; front?: boolean; index?: number }) {
  const kit = useKit();
  const idx = index % kit.lm.devopsLight.length;
  const mat = dark ? kit.lm.devopsDark[idx]! : kit.lm.devopsLight[idx]!;
  const o = 0.012;
  return (
    <>
      {front && <mesh geometry={kit.g.plane} material={mat} position={[0, H * 0.6, W / 2 + o]} scale={[2.3, 0.58, 1]} />}
      {front && <mesh geometry={kit.g.plane} material={kit.lm.smallTag} position={[0.75, H * 0.27, W / 2 + o]} scale={[0.9, 0.22, 1]} />}
      <mesh geometry={kit.g.plane} material={mat} position={[0, H * 0.6, -W / 2 - o]} rotation={[0, Math.PI, 0]} scale={[2.3, 0.58, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.smallTag} position={[-0.75, H * 0.27, -W / 2 - o]} rotation={[0, Math.PI, 0]} scale={[0.9, 0.22, 1]} />
      <mesh geometry={kit.g.plane} material={mat} position={[0, H + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.3, 0.58, 1]} />
    </>
  );
}

function bind(reg: Registry, id: ItemId) {
  return (o: THREE.Group | null) => {
    if (o) {
      o.matrixAutoUpdate = false;
      reg.items[id] = o;
    }
  };
}

/** The hero container: real walls, a floor, and hinged rear doors. */
export function HeroContainer({ reg }: { reg: Registry }) {
  const kit = useKit();
  const m = kit.m.containerTeal;
  const leaf = W / 2 - 0.01;
  return (
    <group ref={bind(reg, "c1")}>
      <B p={[0, CONTAINER.floor / 2, 0]} s={[L, CONTAINER.floor, W]} m={kit.m.slateDark} />
      <B p={[0, H - wt / 2, 0]} s={[L, wt, W]} m={m} />
      <B p={[0, H / 2, W / 2 - wt / 2]} s={[L, H, wt]} m={m} />
      <B p={[0, H / 2, -W / 2 + wt / 2]} s={[L, H, wt]} m={m} />
      <B p={[L / 2 - wt / 2, H / 2, 0]} s={[wt, H, W]} m={m} />
      <B p={[L / 2 - wt - 0.01, H / 2, 0]} s={[0.01, H - 0.1, W - 0.12]} m={kit.m.interior} shadow={false} />
      {frameRails(kit.m.slateDark)}
      {/* rear doors, hinged at the side posts */}
      {[1, -1].map((side, i) => (
        <group
          key={side}
          position={[-L / 2 - 0.03, 0, side * (W / 2 + 0.035)]}
          ref={(o) => {
            reg.doors[i] = o;
          }}
        >
          <B p={[0, H / 2, -side * (leaf / 2)]} s={[0.04, H - 0.08, leaf]} m={m} />
          <B p={[-0.03, H / 2, -side * (leaf - 0.12)]} s={[0.02, H - 0.25, 0.03]} m={kit.m.offwhite} />
        </group>
      ))}
      {castings(kit.m.slateDark, true)}
      <ContainerLabels dark={false} front={false} index={0} />
      {/* quay-facing side: DOCKER + the build tag that appears after docker build + registry stamp */}
      <mesh geometry={kit.g.plane} material={kit.lm.devopsLight[0]!} position={[0, H * 0.74, W / 2 + 0.012]} scale={[2.1, 0.5, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.tag} position={[-0.45, H * 0.36, W / 2 + 0.012]} scale={[1.3, 0.32, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.stamp} position={[0.85, H * 0.36, W / 2 + 0.012]} scale={[1.05, 0.26, 1]} />
    </group>
  );
}

export function PlainContainer({ reg, id, color }: { reg: Registry; id: ItemId; color: "blue" | "sand" }) {
  const kit = useKit();
  const m = color === "blue" ? kit.m.containerBlue : kit.m.containerSand;
  const labelIndex = id === "c2" ? 1 : id === "c3" ? 2 : 0;
  return (
    <group ref={bind(reg, id)}>
      <B p={[0, H / 2, 0]} s={[L - 0.02, H - 0.02, W - 0.02]} m={m} />
      {frameRails(kit.m.slateDark)}
      {castings(kit.m.slateDark)}
      {/* door end: seam + locking bars */}
      <B p={[-L / 2 - 0.004, H / 2, 0]} s={[0.008, H - 0.16, 0.02]} m={kit.m.slateDark} />
      {[-0.42, -0.15, 0.15, 0.42].map((z) => (
        <B key={z} p={[-L / 2 - 0.012, H / 2, z]} s={[0.02, H - 0.2, 0.03]} m={kit.m.offwhite} />
      ))}
      <ContainerLabels dark={color === "sand"} index={labelIndex} />
    </group>
  );
}

export function Crate({ reg }: { reg: Registry }) {
  const kit = useKit();
  const s = CRATE.size;
  return (
    <group ref={bind(reg, "crate")}>
      {/* pallet: bottom slats + blocks + top deck; fork opening between y 0.03 and 0.10 */}
      {[-0.28, 0, 0.28].map((z) => (
        <B key={`b${z}`} p={[0, 0.015, z]} s={[s, 0.03, 0.1]} m={kit.m.sandDark} />
      ))}
      {[-0.28, 0, 0.28].map((x) =>
        [-0.28, 0.28].map((z) => <B key={`k${x}${z}`} p={[x, 0.065, z]} s={[0.1, 0.07, 0.1]} m={kit.m.sandDark} />),
      )}
      {[-0.28, 0.28].map((x) => (
        <B key={`kx${x}`} p={[x, 0.065, 0]} s={[0.1, 0.07, 0.1]} m={kit.m.sandDark} />
      ))}
      <B p={[0, 0.115, 0]} s={[s, 0.03, s]} m={kit.m.sand} />
      <B p={[0, 0.13 + (s - 0.13) / 2, 0]} s={[s - 0.06, s - 0.13, s - 0.06]} m={kit.m.crate} />
    </group>
  );
}

export function Wake({ reg, count }: { reg: Registry; count: number }) {
  const kit = useKit();
  return (
    <instancedMesh
      ref={(o) => {
        if (o) {
          reg.wake = o;
          o.frustumCulled = false;
        }
      }}
      args={[kit.g.disc, kit.m.foam, count]}
      renderOrder={3}
    />
  );
}
