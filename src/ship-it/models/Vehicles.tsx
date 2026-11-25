// Truck (tractor + skeletal chassis) and forklift. Origins: truck at the container
// centre on the road; forklift at the mast face. Heights are absolute (ground = 1).
import { B, Cyl, useKit } from "./kit";
import type { Registry } from "../scene/registry";
import { DECK_Y, FORKLIFT, GROUND_Y, TRUCK } from "../timeline/layout";

const TREADS = [0, 1, 2, 3, 4, 5, 6, 7];

function Wheel({ x, y, z, r, w, reg, list, treads = false }: { x: number; y: number; z: number; r: number; w: number; reg: Registry; list: "truckWheels" | "forkWheels"; treads?: boolean }) {
  const kit = useKit();
  const side = z > 0 ? 1 : -1;
  const showTreads = treads && kit.detail === "high";
  return (
    <group
      position={[x, y, z]}
      ref={(o) => {
        if (o && !reg[list].includes(o)) reg[list].push(o);
      }}
    >
      <mesh geometry={kit.g.cyl} material={kit.m.ink} rotation={[Math.PI / 2, 0, 0]} scale={[r * 2, w, r * 2]} castShadow />
      <mesh geometry={kit.g.cyl8} material={kit.m.offwhite} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * (w / 2 + 0.005)]} scale={[r * 1.1, 0.02, r * 1.1]} />
      <mesh geometry={kit.g.box} material={kit.m.slateDark} position={[0, r * 0.3, side * (w / 2 + 0.02)]} scale={[r * 0.22, r * 0.5, 0.02]} />
      {/* hub cap */}
      <mesh geometry={kit.g.cyl8} material={kit.fx.chrome} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * (w / 2 + 0.02)]} scale={[r * 0.45, 0.03, r * 0.45]} />
      {/* tread blocks (rotate with the wheel, so rolling reads clearly) */}
      {showTreads &&
        TREADS.map((k) => {
          const a = (k / TREADS.length) * Math.PI * 2;
          return (
            <mesh
              key={k}
              geometry={kit.g.box}
              material={kit.m.slateDark}
              position={[Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97, 0]}
              rotation={[0, 0, a]}
              scale={[0.05, r * 0.32, w * 0.92]}
            />
          );
        })}
    </group>
  );
}

export function Truck({ reg }: { reg: Registry }) {
  const kit = useKit();
  const r = TRUCK.wheelR;
  const wy = GROUND_Y + r;
  return (
    <group
      ref={(o) => {
        if (o) reg.truck = o;
      }}
    >
      {/* chassis: deck top exactly at DECK_Y */}
      <B p={[0, DECK_Y - 0.09, 0]} s={[3.3, 0.18, 1.12]} m={kit.m.slateDark} />
      {[-0.42, 0.42].map((z) => (
        <B key={z} p={[0.3, DECK_Y - 0.3, z]} s={[3.9, 0.24, 0.14]} m={kit.m.ink} />
      ))}
      <B p={[-1.62, DECK_Y - 0.36, 0]} s={[0.08, 0.3, 1.2]} m={kit.m.ink} />
      {/* tractor */}
      <B p={[2.2, GROUND_Y + 0.62, 0]} s={[1.9, 0.26, 1.15]} m={kit.m.ink} />
      <B p={[2.42, GROUND_Y + 1.42, 0]} s={[1.28, 1.38, 1.3]} m={kit.m.cab} />
      <B p={[2.42, GROUND_Y + 2.16, 0]} s={[1.18, 0.12, 1.22]} m={kit.m.white} />
      <B p={[3.07, GROUND_Y + 1.7, 0]} s={[0.04, 0.6, 1.12]} m={kit.m.glass} />
      {[-0.66, 0.66].map((z) => (
        <B key={z} p={[2.65, GROUND_Y + 1.72, z]} s={[0.55, 0.42, 0.02]} m={kit.m.glass} />
      ))}
      <B p={[2.42, GROUND_Y + 1.15, 0.655]} s={[1.2, 0.08, 0.01]} m={kit.m.teal} />
      <B p={[2.42, GROUND_Y + 1.15, -0.655]} s={[1.2, 0.08, 0.01]} m={kit.m.teal} />
      <B p={[3.12, GROUND_Y + 0.72, 0]} s={[0.1, 0.24, 1.2]} m={kit.m.offwhite} />
      {/* grille + glowing headlights */}
      <B p={[3.09, GROUND_Y + 1.02, 0]} s={[0.04, 0.34, 0.5]} m={kit.m.slateDark} />
      {[0.92, 1.02, 1.12].map((y) => (
        <B key={`gr${y}`} p={[3.115, GROUND_Y + y, 0]} s={[0.012, 0.03, 0.46]} m={kit.fx.chrome} shadow={false} />
      ))}
      {[-0.42, 0.42].map((z) => (
        <B key={`hl${z}`} p={[3.15, GROUND_Y + 0.98, z]} s={[0.04, 0.12, 0.22]} m={kit.fx.headlight} shadow={false} />
      ))}
      {/* wipers on the windscreen */}
      {[-0.28, 0.24].map((z) => (
        <B key={`wp${z}`} p={[3.095, GROUND_Y + 1.5, z]} r={[0.95, 0, 0]} s={[0.015, 0.44, 0.022]} m={kit.m.ink} shadow={false} />
      ))}
      {/* side mirrors on arms */}
      {[-1, 1].map((sd) => (
        <group key={`mr${sd}`}>
          <B p={[2.98, GROUND_Y + 1.78, sd * 0.74]} s={[0.22, 0.03, 0.03]} m={kit.m.ink} shadow={false} />
          <B p={[3.08, GROUND_Y + 1.66, sd * 0.84]} s={[0.05, 0.3, 0.12]} m={kit.m.ink} />
        </group>
      ))}
      {/* cab step + fuel tank */}
      {[-1, 1].map((sd) => (
        <B key={`st${sd}`} p={[2.6, GROUND_Y + 0.44, sd * 0.66]} s={[0.42, 0.05, 0.16]} m={kit.m.slate} shadow={false} />
      ))}
      <Cyl p={[1.78, GROUND_Y + 0.4, 0.66]} rad={0.17} h={0.6} r={[0, 0, Math.PI / 2]} m={kit.fx.chrome} />
      {/* exhaust stack with chrome cap */}
      <Cyl p={[1.72, GROUND_Y + 2.0, 0.5]} rad={0.05} h={1.2} m={kit.m.slate} low />
      <Cyl p={[1.72, GROUND_Y + 2.62, 0.5]} rad={0.065} h={0.06} m={kit.fx.chrome} low />
      {/* license plates (plain text) */}
      <mesh geometry={kit.g.plane} material={kit.lm.plate} position={[3.18, GROUND_Y + 0.72, 0]} rotation={[0, Math.PI / 2, 0]} scale={[0.44, 0.12, 1]} />
      <mesh geometry={kit.g.plane} material={kit.lm.plate} position={[-1.67, DECK_Y - 0.36, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[0.44, 0.12, 1]} />
      {/* tail lights on the rear bar */}
      {[-0.46, 0.46].map((z) => (
        <B key={`tl${z}`} p={[-1.67, DECK_Y - 0.33, z]} s={[0.025, 0.1, 0.16]} m={kit.fx.taillight} shadow={false} />
      ))}
      {/* reflective strips along the chassis */}
      {[-1, 1].map((sd) =>
        [0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
          <B
            key={`rf${sd}${k}`}
            p={[-1.45 + k * 0.4 + 0.1, DECK_Y - 0.1, sd * 0.565]}
            s={[0.2, 0.05, 0.008]}
            m={k % 2 ? kit.fx.reflect : kit.fx.reflectRed}
            shadow={false}
          />
        )),
      )}
      {/* corner twist-lock pins (the container's castings sit on these) */}
      {[-1.45, 1.45].map((x) =>
        [-1, 1].map((sd) => (
          <B key={`tp${x}${sd}`} p={[x, DECK_Y - 0.06, sd * 0.57]} s={[0.09, 0.09, 0.03]} m={kit.m.yellow} shadow={false} />
        )),
      )}
      {/* mudflaps behind the rear tandem */}
      {[-0.5, 0.5].map((z) => (
        <B key={`mf${z}`} p={[-1.45, GROUND_Y + 0.28, z]} s={[0.03, 0.42, 0.26]} m={kit.m.ink} shadow={false} />
      ))}
      {/* wheels: rear tandem + steer axle */}
      {[-1.05, -0.35, 2.55].map((x) =>
        [-0.5, 0.5].map((z) => <Wheel key={`${x}${z}`} x={x} y={wy} z={z} r={r} w={0.24} reg={reg} list="truckWheels" treads />),
      )}
    </group>
  );
}

export function Forklift({ reg }: { reg: Registry }) {
  const kit = useKit();
  const g = GROUND_Y;
  return (
    <group
      ref={(o) => {
        if (o) reg.forklift = o;
      }}
    >
      {/* body + counterweight */}
      <B p={[-0.8, g + 0.5, 0]} s={[1.2, 0.56, 0.96]} m={kit.m.yellow} />
      <B p={[-1.32, g + 0.62, 0]} s={[0.3, 0.7, 0.98]} m={kit.m.slateDark} />
      {/* overhead guard */}
      {([
        [-0.32, -0.42],
        [-0.32, 0.42],
        [-1.15, -0.42],
        [-1.15, 0.42],
      ] as [number, number][]).map(([x, z], i) => (
        <B key={i} p={[x, g + 1.3, z]} s={[0.06, 1.05, 0.06]} m={kit.m.ink} />
      ))}
      <B p={[-0.74, g + 1.84, 0]} s={[0.95, 0.05, 0.92]} m={kit.m.ink} />
      {/* amber beacon + work lights on the guard */}
      <mesh geometry={kit.g.sphere} material={kit.fx.amber} position={[-0.74, g + 1.93, 0]} scale={0.13} />
      {[-0.42, 0.42].map((z) => (
        <B key={`wl${z}`} p={[-0.27, g + 1.72, z]} s={[0.05, 0.08, 0.1]} m={kit.fx.headlight} shadow={false} />
      ))}
      {/* seat + backrest, steering column + wheel */}
      <B p={[-0.85, g + 0.86, 0]} s={[0.3, 0.16, 0.36]} m={kit.m.ink} />
      <B p={[-1.02, g + 1.06, 0]} s={[0.07, 0.36, 0.36]} m={kit.m.ink} />
      <Cyl p={[-0.5, g + 0.95, 0]} rad={0.025} h={0.36} r={[0, 0, 0.5]} m={kit.m.ink} low />
      <mesh geometry={kit.g.torus} material={kit.m.ink} position={[-0.58, g + 1.12, 0]} rotation={[Math.PI / 2, 0.5, 0]} scale={0.24} />
      <mesh geometry={kit.g.capsule} material={kit.m.navy} position={[-0.82, g + 1.12, 0]} scale={[0.22, 0.17, 0.22]} castShadow />
      <mesh geometry={kit.g.sphere} material={kit.m.skin} position={[-0.8, g + 1.45, 0]} scale={0.18} castShadow />
      {/* mast (outside the container at all times) */}
      {[-0.32, 0.32].map((z) => (
        <B key={z} p={[-0.1, g + 1.25, z]} s={[0.09, 2.3, 0.09]} m={kit.m.slateDark} />
      ))}
      <B p={[-0.1, g + 2.35, 0]} s={[0.09, 0.08, 0.72]} m={kit.m.slateDark} />
      {/* carriage + forks: origin at fork top = crate bottom */}
      <group
        ref={(o) => {
          if (o) reg.forkCarriage = o;
        }}
      >
        <B p={[-0.02, 0.3, 0]} s={[0.06, 0.55, 0.74]} m={kit.m.ink} />
        {[-0.2, 0.2].map((z) => (
          <B key={z} p={[FORKLIFT.forkLen / 2, 0.06, z]} s={[FORKLIFT.forkLen, 0.045, 0.11]} m={kit.m.ink} />
        ))}
      </group>
      {/* wheels */}
      {[-0.42, 0.42].map((z) => (
        <Wheel key={`f${z}`} x={-0.38} y={g + 0.22} z={z * 1.05} r={0.22} w={0.18} reg={reg} list="forkWheels" />
      ))}
      {[-0.4, 0.4].map((z) => (
        <Wheel key={`r${z}`} x={-1.18} y={g + 0.17} z={z * 1.05} r={0.17} w={0.16} reg={reg} list="forkWheels" />
      ))}
    </group>
  );
}
