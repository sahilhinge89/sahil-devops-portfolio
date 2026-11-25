// Feeder ship. Origin: hull centre at the waterline, bow towards +x. The deck slot
// pads (cluster nodes) sit at SHIP.slotX with their top at SHIP.deckTop.
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { B, Cyl, useKit } from "./kit";
import type { Registry } from "../scene/registry";
import { Strut } from "./Strut";
import { CONTAINER, GROUND_Y, QUAY, SHIP } from "../timeline/layout";

function hullShape(inset = 0) {
  const hl = SHIP.length / 2 - inset;
  const hb = SHIP.beam / 2 - inset;
  const s = new THREE.Shape();
  s.moveTo(-hl, -hb);
  s.lineTo(hl - 3, -hb);
  s.quadraticCurveTo(hl - 0.6, -hb * 0.85, hl, 0);
  s.quadraticCurveTo(hl - 0.6, hb * 0.85, hl - 3, hb);
  s.lineTo(-hl, hb);
  s.lineTo(-hl, -hb);
  return s;
}

function extruded(shape: THREE.Shape, depth: number, y0: number) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  g.rotateX(-Math.PI / 2); // shape xy → xz, extrusion → +y
  g.translate(0, y0, 0);
  return g;
}

/** Mooring lines from the ship's bitts to quay bollards, with a slight sag (world space, ship moored). */
export function MooringRopes({ reg }: { reg: Registry }) {
  const kit = useKit();
  const bollZ = QUAY.minZ + 0.35;
  const lines: [V3, V3][] = [
    [[SHIP.x - 7.8, 2.15, SHIP.z + 2.1], [-12.4, GROUND_Y + 0.3, bollZ]],
    [[SHIP.x + 7.2, 2.15, SHIP.z + 1.55], [12.8, GROUND_Y + 0.3, bollZ]],
  ];
  return (
    <group
      ref={(o) => {
        if (o) reg.ropes = o;
      }}
      visible={false}
    >
      {lines.map(([a, b], i) => {
        const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.22, (a[2] + b[2]) / 2];
        return (
          <group key={i}>
            <Strut a={a} b={mid} t={0.045} m={kit.fx.rope} />
            <Strut a={mid} b={b} t={0.045} m={kit.fx.rope} />
          </group>
        );
      })}
    </group>
  );
}

type V3 = [number, number, number];

export function Ship({ reg }: { reg: Registry }) {
  const kit = useKit();
  const geo = useMemo(() => {
    const hull = extruded(hullShape(), 2.25, -0.65);
    const stripe = extruded(hullShape(-0.02), 0.16, 1.18);
    const deck = extruded(hullShape(0.12), 0.05, 1.55);
    const waterline = extruded(hullShape(-0.015), 0.24, -0.1);
    return { hull, stripe, deck, waterline };
  }, []);
  useLayoutEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const bx = SHIP.bridgeX;
  const topY = 4.45; // flying-bridge floor
  const L = CONTAINER.L;
  const W = CONTAINER.W;

  return (
    <group
      ref={(o) => {
        if (o) {
          reg.shipRoot = o;
          o.rotation.order = "YXZ";
        }
      }}
    >
      <mesh geometry={geo.hull} material={kit.m.slateDark} castShadow receiveShadow />
      <mesh geometry={geo.stripe} material={kit.m.white} />
      <mesh geometry={geo.deck} material={kit.m.deck} receiveShadow />
      {/* waterline stripe + bulbous bow */}
      <mesh geometry={geo.waterline} material={kit.fx.antifoul} />
      <mesh geometry={kit.g.sphere} material={kit.m.slateDark} position={[SHIP.length / 2 - 0.15, -0.38, 0]} scale={[1.9, 0.62, 0.86]} />
      {/* bow foam (fades in with speed) */}
      {[-1, 1].map((sd) => (
        <mesh
          key={`bf${sd}`}
          geometry={kit.g.disc}
          material={kit.fx.bowFoam}
          position={[SHIP.length / 2 - 0.9, 0.06, sd * 1.0]}
          rotation={[0, sd * 0.55, 0]}
          scale={[2.4, 1, 0.55]}
          renderOrder={3}
        />
      ))}
      {/* name on the hull (both sides) + stern */}
      <mesh geometry={kit.g.plane} material={kit.lm.shipName} position={[bx - 0.6, 0.32, SHIP.beam / 2 + 0.01]} scale={[2.6, 0.4, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.shipName} position={[bx - 0.6, 0.32, -SHIP.beam / 2 - 0.01]} rotation={[0, Math.PI, 0]} scale={[2.6, 0.4, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.shipName} position={[-SHIP.length / 2 - 0.01, 1.0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[3.0, 0.46, 1]} />
      {/* anchor + hawse pipe (starboard bow) */}
      <mesh geometry={kit.g.cyl8} material={kit.m.ink} position={[5.85, 1.42, SHIP.beam / 2 + 0.01]} rotation={[Math.PI / 2, 0, 0]} scale={[0.2, 0.04, 0.2]} />
      <B p={[5.85, 1.12, SHIP.beam / 2 + 0.03]} s={[0.06, 0.5, 0.04]} m={kit.m.ink} shadow={false} />
      <B p={[5.85, 0.88, SHIP.beam / 2 + 0.03]} s={[0.34, 0.06, 0.04]} m={kit.m.ink} shadow={false} />
      {/* mooring bitts (ropes run from these to the quay bollards) */}
      {([
        [-7.8, 2.1],
        [7.2, 1.55],
      ] as [number, number][]).map(([x, z]) => (
        <Cyl key={`bt${x}`} p={[x, 1.9, z]} rad={0.09} h={0.5} m={kit.m.ink} low />
      ))}
      {/* deck railing: stanchions + top rail on both sides */}
      {[-1, 1].map((sd) => (
        <group key={`rl${sd}`}>
          <B p={[-1.5, 2.2, sd * (SHIP.beam / 2 - 0.08)]} s={[15, 0.04, 0.04]} m={kit.m.slate} shadow={false} />
          {kit.detail === "high" &&
            Array.from({ length: 11 }, (_, k) => (
              <B key={k} p={[-8.8 + k * 1.45, 2.05, sd * (SHIP.beam / 2 - 0.08)]} s={[0.035, 0.3, 0.035]} m={kit.m.slate} shadow={false} />
            ))}
        </group>
      ))}
      {/* bulwarks */}
      {[-1, 1].map((s) => (
        <B key={s} p={[-1.5, 1.75, s * (SHIP.beam / 2 - 0.08)]} s={[15, 0.3, 0.08]} m={kit.m.white} />
      ))}
      {/* painted hull labels on the quay side: cluster nodes + name */}
      {SHIP.slotX.map((x, i) => (
        <group key={i}>
          <mesh geometry={kit.g.plane} material={kit.lm.node[i]!} position={[x, 0.72, SHIP.beam / 2 + 0.01]} scale={[2.0, 0.5, 1]} />
          <mesh geometry={kit.g.plane} material={kit.lm.node[i]!} position={[x, 0.72, -SHIP.beam / 2 - 0.01]} rotation={[0, Math.PI, 0]} scale={[2.0, 0.5, 1]} />
        </group>
      ))}
      <mesh geometry={kit.g.plane} material={kit.lm.ship} position={[bx - 0.6, 0.72, SHIP.beam / 2 + 0.01]} scale={[2.3, 0.46, 1]} />

      {/* slot pads (nodes) with cell guides */}
      {SHIP.slotX.map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <B p={[0, SHIP.deckTop - 0.025, 0]} s={[L + 0.46, 0.05, W + 0.5]} m={kit.slotPads[i]!} shadow={false} />
          {([
            [-1, -1],
            [1, -1],
            [-1, 1],
            [1, 1],
          ] as [number, number][]).map(([sx, sz], k) => (
            <B key={k} p={[sx * (L / 2 + 0.1), SHIP.deckTop + 0.22, sz * (W / 2 + 0.1)]} s={[0.07, 0.44, 0.07]} m={kit.m.slate} />
          ))}
        </group>
      ))}

      {/* superstructure (aft) */}
      <B p={[bx, 1.6 + 1.42, 0]} s={[2.4, 2.84, 3.8]} m={kit.m.white} />
      <B p={[bx + 1.21, 3.55, 0]} s={[0.04, 0.5, 3.4]} m={kit.m.glass} />
      {[-1, 1].map((s) => (
        <B key={s} p={[bx, 3.55, s * 1.91]} s={[2.0, 0.5, 0.04]} m={kit.m.glass} />
      ))}
      {[-1.35, -0.68, 0, 0.68, 1.35].map((z) => (
        <B key={`mu${z}`} p={[bx + 1.235, 3.55, z]} s={[0.03, 0.52, 0.05]} m={kit.m.white} shadow={false} />
      ))}
      {[2.2, 2.75].map((y) =>
        [-1, 1].map((sd) =>
          [-0.7, 0, 0.7].map((x) => (
            <B key={`aw${y}${sd}${x}`} p={[bx + x, y, sd * 1.905]} s={[0.36, 0.22, 0.03]} m={kit.m.glass} shadow={false} />
          )),
        ),
      )}
      <B p={[bx, topY - 0.07, 0]} s={[2.8, 0.14, 4.6]} m={kit.m.offwhite} />
      {/* navigation lights on the bridge wings: red to port (-z), green to starboard (+z) */}
      <mesh geometry={kit.g.sphere} material={kit.fx.navRed} position={[bx + 1.0, topY + 0.1, -2.25]} scale={0.14} />
      <mesh geometry={kit.g.sphere} material={kit.fx.navGreen} position={[bx + 1.0, topY + 0.1, 2.25]} scale={0.14} />
      {/* flying-bridge railings */}
      {[-1, 1].map((s) => (
        <B key={`r${s}`} p={[bx, topY + 0.32, s * 2.28]} s={[2.8, 0.05, 0.05]} m={kit.m.slate} />
      ))}
      <B p={[bx + 1.38, topY + 0.32, 0]} s={[0.05, 0.05, 4.6]} m={kit.m.slate} />
      {/* funnel */}
      <Cyl p={[bx - 1.6, 3.9, 0]} rad={0.5} h={2.2} m={kit.m.white} />
      <Cyl p={[bx - 1.6, 4.55, 0]} rad={0.52} h={0.3} m={kit.m.teal} />
      {/* mast + beacon (monitoring) */}
      <Cyl p={[bx + 0.7, topY + 1.7, -1.2]} rad={0.06} h={3.4} m={kit.m.slate} low />
      <B p={[bx + 0.7, topY + 2.6, -1.2]} s={[0.06, 0.06, 1.1]} m={kit.m.slate} />
      {/* radar scanner on the yard-arm end */}
      <Cyl p={[bx + 0.7, topY + 2.72, -1.72]} rad={0.04} h={0.2} m={kit.m.slateDark} low />
      <group
        position={[bx + 0.7, topY + 2.85, -1.72]}
        ref={(o) => {
          if (o) reg.radar = o;
        }}
      >
        <B p={[0, 0, 0]} s={[0.75, 0.07, 0.1]} m={kit.m.white} />
      </group>
      <mesh geometry={kit.g.sphere} material={kit.beacon} position={[bx + 0.7, topY + 3.5, -1.2]} scale={0.3} />
      <sprite
        ref={(o) => {
          if (o) reg.beaconGlow = o;
        }}
        material={kit.m.glow}
        position={[bx + 0.7, topY + 3.5, -1.2]}
        scale={2.2}
      />
      <pointLight
        ref={(o) => {
          if (o) reg.beaconLight = o;
        }}
        position={[bx + 0.7, topY + 3.5, -1.2]}
        color="#7fe0d2"
        intensity={0}
        distance={9}
        decay={1.6}
      />
      <Captain reg={reg} x={bx - 0.35} y={topY} />
    </group>
  );
}

function Captain({ reg, x, y }: { reg: Registry; x: number; y: number }) {
  const kit = useKit();
  const wheelX = x + 0.55;
  const wheelY = y + 0.62;
  return (
    <group>
      {/* helm pedestal + wheel (generic ship's wheel, axle along x) */}
      <B p={[wheelX + 0.08, y + 0.3, 0]} s={[0.12, 0.6, 0.14]} m={kit.m.slateDark} />
      <group
        position={[wheelX, wheelY, 0]}
        ref={(o) => {
          if (o) reg.helm = o;
        }}
      >
        <mesh geometry={kit.g.torus} material={kit.m.sandDark} rotation={[0, Math.PI / 2, 0]} scale={0.46} castShadow />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[(k * Math.PI) / 4, 0, 0]}>
            <B p={[0, 0, 0]} s={[0.03, 0.62, 0.03]} m={kit.m.sandDark} />
          </group>
        ))}
        <Cyl p={[0, 0, 0]} rad={0.05} h={0.08} r={[0, 0, Math.PI / 2]} m={kit.m.slateDark} low />
      </group>
      {/* captain */}
      {[-0.09, 0.09].map((z) => (
        <mesh key={z} geometry={kit.g.capsule} material={kit.m.navy} position={[x, y + 0.2, z]} scale={[0.1, 0.17, 0.1]} castShadow />
      ))}
      <mesh geometry={kit.g.capsule} material={kit.m.white} position={[x, y + 0.56, 0]} scale={[0.27, 0.16, 0.3]} castShadow />
      <mesh geometry={kit.g.sphere} material={kit.m.skin} position={[x + 0.02, y + 0.86, 0]} scale={0.2} castShadow />
      <Cyl p={[x + 0.02, y + 0.95, 0]} rad={0.11} h={0.07} m={kit.m.navy} low />
      <B p={[x + 0.11, y + 0.925, 0]} s={[0.1, 0.02, 0.16]} m={kit.m.ink} />
      <group
        position={[x, y + 0.66, 0]}
        ref={(o) => {
          if (o) reg.arms = o;
        }}
      >
        {[-0.17, 0.17].map((z) => (
          <mesh
            key={z}
            geometry={kit.g.capsule}
            material={kit.m.white}
            position={[0.24, -0.02, z]}
            rotation={[0, 0, Math.PI / 2 - 0.15]}
            scale={[0.07, 0.22, 0.07]}
            castShadow
          />
        ))}
        {[-0.17, 0.17].map((z) => (
          <mesh key={`h${z}`} geometry={kit.g.sphere} material={kit.m.skin} position={[0.47, -0.05, z]} scale={0.085} />
        ))}
      </group>
    </group>
  );
}
