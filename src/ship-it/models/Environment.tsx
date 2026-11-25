// Ocean, blueprint grid, quay, road, rails, gates, warehouse and yard dressing.
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { B, Cyl, DEVOPS_LABELS, PAL, useKit } from "./kit";
import type { Registry } from "../scene/registry";
import { GATES_X, GROUND_Y, QUAY, ROAD_Z, WAREHOUSE, CRANE } from "../timeline/layout";

export function Ocean({ reg }: { reg: Registry }) {
  const kit = useKit();
  const seg = kit.detail === "high" ? 140 : 70;
  const geo = useMemo(() => new THREE.PlaneGeometry(420, 320, seg, seg).rotateX(-Math.PI / 2), [seg]);
  useLayoutEffect(() => () => geo.dispose(), [geo]);
  const grid = useMemo(() => new THREE.PlaneGeometry(110, 70).rotateX(-Math.PI / 2), []);
  useLayoutEffect(() => () => grid.dispose(), [grid]);
  return (
    <group>
      <mesh geometry={geo} material={kit.water} position={[0, 0, -40]} receiveShadow />
      <mesh
        ref={(o) => {
          if (o) reg.grid = o;
        }}
        geometry={grid}
        material={kit.grid}
        position={[-8, 1.03, -4]}
        renderOrder={2}
      />
      {/* distant islands for depth, softened by fog */}
      {([
        [-70, -95, 26, 9],
        [-20, -120, 34, 12],
        [55, -105, 30, 10],
        [95, -70, 18, 7],
      ] as [number, number, number, number][]).map(([x, z, r, h], i) => (
        <mesh
          key={i}
          geometry={kit.g.sphere}
          material={kit.m.tree}
          position={[x, -h * 0.25, z]}
          scale={[r, h, r * 0.6]}
        />
      ))}
    </group>
  );
}

function Gate({ i }: { i: number }) {
  const kit = useKit();
  const x = GATES_X[i]!;
  const label = [kit.lm.lint, kit.lm.test, kit.lm.scan][i]!;
  const top = GROUND_Y + 3.4;
  return (
    <group position={[x, 0, ROAD_Z]}>
      {[-1.5, 1.5].map((z) => (
        <B key={z} p={[0, GROUND_Y + 1.7, z]} s={[0.26, 3.4, 0.26]} m={kit.m.white} />
      ))}
      {[-1.5, 1.5].map((z) => (
        <B key={`f${z}`} p={[0, GROUND_Y + 0.08, z]} s={[0.5, 0.16, 0.5]} m={kit.m.slate} />
      ))}
      <B p={[0, top, 0]} s={[0.34, 0.34, 3.26]} m={kit.gateLights[i]!} />
      <B p={[0, top + 0.47, 0]} s={[0.08, 0.6, 1.7]} m={kit.m.slateDark} />
      <mesh geometry={kit.g.plane} material={label} position={[-0.05, top + 0.47, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[1.5, 0.5, 1]} />
      <mesh geometry={kit.g.plane} material={label} position={[0.05, top + 0.47, 0]} rotation={[0, Math.PI / 2, 0]} scale={[1.5, 0.5, 1]} />
    </group>
  );
}

function Warehouse() {
  const kit = useKit();
  const { frontX, backX, minZ, maxZ, height } = WAREHOUSE;
  const len = frontX - backX;
  const cx = (frontX + backX) / 2;
  const cz = (minZ + maxZ) / 2;
  const depth = maxZ - minZ;
  const y0 = GROUND_Y;
  const doorZ0 = ROAD_Z - 1.6;
  const doorZ1 = ROAD_Z + 1.6;
  const doorH = 3.3;
  const t = 0.3;
  return (
    <group>
      {/* front wall around the door */}
      <B p={[frontX - t / 2, y0 + height / 2, (minZ + doorZ0) / 2]} s={[t, height, doorZ0 - minZ]} m={kit.m.offwhite} />
      <B p={[frontX - t / 2, y0 + height / 2, (doorZ1 + maxZ) / 2]} s={[t, height, maxZ - doorZ1]} m={kit.m.offwhite} />
      <B p={[frontX - t / 2, y0 + doorH + (height - doorH) / 2, ROAD_Z]} s={[t, height - doorH, doorZ1 - doorZ0]} m={kit.m.offwhite} />
      {/* door frame */}
      <B p={[frontX + 0.02, y0 + doorH + 0.08, ROAD_Z]} s={[0.12, 0.16, 3.4]} m={kit.m.slate} />
      {[doorZ0 - 0.06, doorZ1 + 0.06].map((z) => (
        <B key={z} p={[frontX + 0.02, y0 + doorH / 2, z]} s={[0.12, doorH, 0.12]} m={kit.m.slate} />
      ))}
      {/* other walls */}
      <B p={[backX + t / 2, y0 + height / 2, cz]} s={[t, height, depth]} m={kit.m.offwhite} />
      <B p={[cx, y0 + height / 2, minZ + t / 2]} s={[len, height, t]} m={kit.m.offwhite} />
      <B p={[cx, y0 + height / 2, maxZ - t / 2]} s={[len, height, t]} m={kit.m.offwhite} />
      {/* teal band + sign */}
      <B p={[frontX + 0.01, y0 + height - 0.55, cz]} s={[0.06, 0.22, depth]} m={kit.m.teal} />
      <mesh geometry={kit.g.plane} material={kit.lm.warehouse} position={[frontX + 0.05, y0 + doorH + 1.3, ROAD_Z]} rotation={[0, Math.PI / 2, 0]} scale={[2.6, 0.65, 1]} />
      {/* pitched roof, ridge along x */}
      {[-1, 1].map((s) => (
        <B
          key={s}
          p={[cx, y0 + height + 0.55, cz + (s * depth) / 4]}
          s={[len + 0.6, 0.18, depth / 2 + 0.5]}
          r={[s * 0.16, 0, 0]}
          m={kit.m.sandDark}
        />
      ))}
      {/* interior dressing: racks with boxes */}
      {[-8.5, 1.2].map((z) =>
        [-44, -41, -38].map((x) => (
          <group key={`${x}${z}`}>
            <B p={[x, y0 + 1.2, z]} s={[2.2, 0.08, 0.9]} m={kit.m.slate} />
            <B p={[x, y0 + 2.4, z]} s={[2.2, 0.08, 0.9]} m={kit.m.slate} />
            <B p={[x - 0.4, y0 + 1.55, z]} s={[0.7, 0.6, 0.7]} m={kit.m.sand} />
            <B p={[x + 0.5, y0 + 2.75, z]} s={[0.7, 0.6, 0.7]} m={kit.m.sand} />
          </group>
        )),
      )}
      <B p={[cx, y0 + 0.012, ROAD_Z]} s={[len - 0.6, 0.02, 3.2]} m={kit.m.interior} shadow={false} />
    </group>
  );
}

/** Instanced yard stacks: decorative containers for scale (static). */
function Yard() {
  const kit = useKit();
  const ref = useRef<THREE.InstancedMesh>(null);
  const items = useMemo(() => {
    const out: { x: number; y: number; z: number; c: string }[] = [];
    const colors = [PAL.blue, PAL.sand, PAL.coral, PAL.mint, PAL.offwhite, PAL.blue, PAL.sand];
    let k = 0;
    const rows = kit.detail === "high" ? [4.5, 6.2, 9.5, 11.2] : [4.5, 6.2, 9.5];
    for (const z of rows) {
      for (let i = 0; i < 4; i++) {
        const x = 11 + i * 3.4;
        const h = 1 + ((k * 7 + i * 3) % 3);
        for (let j = 0; j < h; j++) out.push({ x, y: GROUND_Y + j * 1.3, z, c: colors[(k + j * 2 + i) % colors.length]! });
        k++;
      }
    }
    // a short row behind the warehouse road
    for (let i = 0; i < 3; i++) out.push({ x: -28 + i * 3.4, y: GROUND_Y, z: 13, c: colors[i + 2]! });
    return out;
  }, [kit.detail]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    items.forEach((it, i) => {
      m.makeScale(3, 1.3, 1.25).setPosition(it.x, it.y + 0.65, it.z);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  const labelGroups = useMemo(() => {
    const groups: { x: number; y: number; z: number }[][] = Array.from({ length: DEVOPS_LABELS.length }, () => []);
    items.forEach((it, i) => {
      groups[i % DEVOPS_LABELS.length]!.push(it);
    });
    return groups;
  }, [items]);
  const labelRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    const r = new THREE.Matrix4().makeRotationY(Math.PI);
    labelGroups.forEach((group, gIdx) => {
      const mesh = labelRefs.current[gIdx];
      if (!mesh) return;
      group.forEach((it, i) => {
        m.makeScale(2.2, 0.55, 1).setPosition(it.x, it.y + 0.75, it.z + 0.635);
        mesh.setMatrixAt(i * 2, m);
        m.makeScale(2.2, 0.55, 1).premultiply(r).setPosition(it.x, it.y + 0.75, it.z - 0.635);
        mesh.setMatrixAt(i * 2 + 1, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [labelGroups]);
  return (
    <>
      <instancedMesh ref={ref} args={[kit.g.box, kit.m.instanced, items.length]} castShadow receiveShadow />
      {labelGroups.map((group, gIdx) =>
        group.length > 0 ? (
          <instancedMesh
            key={gIdx}
            ref={(el) => {
              labelRefs.current[gIdx] = el;
            }}
            args={[kit.g.plane, kit.lm.devopsDark[gIdx]!, group.length * 2]}
          />
        ) : null,
      )}
    </>
  );
}

/** Wooden pallets with boxes outside the warehouse (static props, clear of the forklift lane). */
function Pallets() {
  const kit = useKit();
  const spots: [number, number, number][] = [
    [-31.6, 0.9, 1],
    [-30.4, 1.0, 2],
    [-31.0, -0.6, 1],
  ];
  return (
    <group>
      {spots.map(([x, z, n], i) => (
        <group key={i} position={[x, GROUND_Y, z]}>
          {Array.from({ length: n }, (_, k) => (
            <group key={k} position={[0, k * 0.62, 0]}>
              <B p={[0, 0.06, 0]} s={[0.9, 0.12, 0.9]} m={kit.m.sandDark} />
              <B p={[0, 0.36, 0]} s={[0.74, 0.48, 0.74]} m={kit.m.sand} />
              <B p={[0, 0.36, 0.371]} s={[0.74, 0.06, 0.005]} m={kit.m.offwhite} shadow={false} />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Free-standing sign board facing the viewer (+z). */
function Sign({ x, z, h, w, mat }: { x: number; z: number; h: number; w: number; mat: THREE.Material }) {
  const kit = useKit();
  return (
    <group position={[x, GROUND_Y, z]}>
      {[-w / 2 + 0.1, w / 2 - 0.1].map((dx) => (
        <B key={dx} p={[dx, h / 2, 0]} s={[0.07, h, 0.07]} m={kit.m.slate} />
      ))}
      <B p={[0, h + 0.2, -0.03]} s={[w + 0.1, 0.6, 0.04]} m={kit.m.slateDark} />
      <mesh geometry={kit.g.plane} material={mat} position={[0, h + 0.2, 0]} scale={[w, (w * 72) / 256, 1]} />
    </group>
  );
}

function Bollards() {
  const kit = useKit();
  const ref = useRef<THREE.InstancedMesh>(null);
  const xs = useMemo(() => Array.from({ length: 12 }, (_, i) => -16 + i * 3.6), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    xs.forEach((x, i) => {
      m.makeScale(0.28, 0.32, 0.28).setPosition(x, GROUND_Y + 0.16, QUAY.minZ + 0.35);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [xs]);
  return <instancedMesh ref={ref} args={[kit.g.cyl8, kit.m.slateDark, xs.length]} castShadow />;
}

function Trees() {
  const kit = useKit();
  const ref = useRef<THREE.InstancedMesh>(null);
  const pts = useMemo<[number, number][]>(
    () => [
      [-30, 18],
      [-26, 19.5],
      [-20, 18.4],
      [-12, 19.6],
      [-6, 18.2],
      [2, 19.4],
      [8, 18.6],
      [16, 19.8],
      [22, 18.2],
      [-44, 10],
      [-48, 14],
      [-19, 11],
    ],
    [],
  );
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    pts.forEach(([x, z], i) => {
      const s = 1.3 + ((i * 37) % 10) / 12;
      m.makeScale(s * 1.6, s * 2.4, s * 1.6).setPosition(x, GROUND_Y + s * 1.2, z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [pts]);
  return <instancedMesh ref={ref} args={[kit.g.cone, kit.m.tree, pts.length]} castShadow />;
}

export function Land({ reg }: { reg: Registry }) {
  const kit = useKit();
  const qw = QUAY.maxX - QUAY.minX;
  const qd = QUAY.maxZ - QUAY.minZ;
  const roadStart = WAREHOUSE.frontX;
  const roadEnd = QUAY.maxX;
  return (
    <group
      ref={(o) => {
        if (o) reg.land = o;
      }}
    >
      {/* quay block */}
      <B p={[(QUAY.minX + QUAY.maxX) / 2, (QUAY.bottom + GROUND_Y) / 2, (QUAY.minZ + QUAY.maxZ) / 2]} s={[qw, GROUND_Y - QUAY.bottom, qd]} m={kit.m.quay} />
      <B p={[(QUAY.minX + QUAY.maxX) / 2, GROUND_Y + 0.06, QUAY.minZ + 0.12]} s={[qw, 0.12, 0.24]} m={kit.m.white} />
      <B p={[(QUAY.minX + QUAY.maxX) / 2, 0.4, QUAY.minZ - 0.05]} s={[qw, 1.2, 0.1]} m={kit.m.quaySide} shadow={false} />
      {/* fenders */}
      {Array.from({ length: 9 }, (_, i) => (
        <B key={i} p={[-12 + i * 4.2, 0.55, QUAY.minZ - 0.16]} s={[0.7, 0.7, 0.22]} m={kit.m.ink} shadow={false} />
      ))}
      {/* grass strip at the back */}
      <B p={[(QUAY.minX + QUAY.maxX) / 2, GROUND_Y + 0.02, 19]} s={[qw, 0.04, 5.5]} m={kit.m.grass} shadow={false} />
      {/* road */}
      <B p={[(roadStart + roadEnd) / 2, GROUND_Y + 0.012, ROAD_Z]} s={[roadEnd - roadStart, 0.024, 2.8]} m={kit.m.road} shadow={false} />
      {/* crane rails */}
      {CRANE.railZ.map((z) => (
        <B key={z} p={[5, GROUND_Y + 0.03, z]} s={[34, 0.06, 0.16]} m={kit.m.slateDark} shadow={false} />
      ))}
      {GATES_X.map((_, i) => (
        <Gate key={i} i={i} />
      ))}
      <Warehouse />
      <Yard />
      <Pallets />
      <Sign x={-14.5} z={-5.25} h={1.3} w={1.9} mat={kit.lm.berth} />
      <Sign x={-24.6} z={-0.9} h={1.5} w={1.9} mat={kit.lm.gates} />
      {/* foam line where the water meets the quay wall */}
      <mesh geometry={kit.g.plane} material={kit.m.foam} position={[(QUAY.minX + QUAY.maxX) / 2, 0.05, QUAY.minZ - 0.35]} rotation={[-Math.PI / 2, 0, 0]} scale={[QUAY.maxX - QUAY.minX, 0.5, 1]} renderOrder={3} />
      <Bollards />
      <Trees />
      {/* lamp posts along the road */}
      {[12, 22].map((x) => (
        <group key={x}>
          <Cyl p={[x, GROUND_Y + 2.2, ROAD_Z + 2.2]} rad={0.06} h={4.4} m={kit.m.slate} low />
          <B p={[x + 0.35, GROUND_Y + 4.35, ROAD_Z + 2.2]} s={[0.8, 0.1, 0.22]} m={kit.m.slate} />
          <B p={[x + 0.6, GROUND_Y + 4.28, ROAD_Z + 2.2]} s={[0.3, 0.04, 0.16]} m={kit.fx.lamp} shadow={false} />
        </group>
      ))}
    </group>
  );
}
