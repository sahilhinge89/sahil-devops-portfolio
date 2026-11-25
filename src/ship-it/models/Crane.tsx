// Ship-to-shore gantry crane: gantry rides the rails (x), trolley rides the boom (z),
// the hoist moves the spreader vertically. The stepper drives the three groups.
import { B, Cyl, useKit } from "./kit";
import { Strut } from "./Strut";
import type { Registry } from "../scene/registry";
import { CONTAINER, CRANE, GROUND_Y } from "../timeline/layout";

const BOOM_LEN = CRANE.boomMaxZ - CRANE.boomMinZ;
const BOOM_CZ = (CRANE.boomMaxZ + CRANE.boomMinZ) / 2;

export function Crane({ reg }: { reg: Registry }) {
  const kit = useKit();
  const legTop = CRANE.boomY - 0.3;
  const legH = legTop - GROUND_Y;
  const [zl, zw] = CRANE.railZ;
  const L = CONTAINER.L;
  const W = CONTAINER.W;
  return (
    <group
      ref={(o) => {
        if (o) reg.gantry = o;
      }}
    >
      {/* legs + bogies */}
      {[-CRANE.legDX, CRANE.legDX].map((x) =>
        [zl, zw].map((z) => (
          <group key={`${x}${z}`}>
            <B p={[x, GROUND_Y + 0.6 + legH / 2, z]} s={[0.42, legH - 0.6, 0.42]} m={kit.m.slate} />
            <B p={[x, GROUND_Y + 0.38, z]} s={[1.3, 0.36, 0.5]} m={kit.m.slateDark} />
            {[-0.38, 0.38].map((dx) => (
              <Cyl key={dx} p={[x + dx, GROUND_Y + 0.16, z]} rad={0.16} h={0.36} r={[Math.PI / 2, 0, 0]} m={kit.m.ink} low />
            ))}
          </group>
        )),
      )}
      {/* lattice lacing on every leg's outer faces (inside the leg footprint, never in the lane) */}
      {kit.detail === "high" &&
        [-CRANE.legDX, CRANE.legDX].map((x) =>
          [zl, zw].map((z) => {
            const ox = x + Math.sign(x) * 0.225;
            const n = 6;
            const y0 = GROUND_Y + 1.5;
            const dy = (legTop - 0.7 - y0) / n;
            return (
              <group key={`lt${x}${z}`}>
                {Array.from({ length: n }, (_, k) => (
                  <Strut
                    key={k}
                    a={[ox, y0 + k * dy, z + (k % 2 ? 0.17 : -0.17)]}
                    b={[ox, y0 + (k + 1) * dy, z + (k % 2 ? -0.17 : 0.17)]}
                    t={0.045}
                    m={kit.m.slateDark}
                  />
                ))}
                {Array.from({ length: n + 1 }, (_, k) => (
                  <B key={`h${k}`} p={[ox, y0 + k * dy, z]} s={[0.04, 0.05, 0.4]} m={kit.m.slateDark} shadow={false} />
                ))}
              </group>
            );
          }),
        )}
      {/* sill beams along each rail (never cross the lane) */}
      {[zl, zw].map((z) => (
        <B key={z} p={[0, GROUND_Y + 1.25, z]} s={[2 * CRANE.legDX, 0.32, 0.34]} m={kit.m.slate} />
      ))}
      {/* portal beams across, high above traffic */}
      {[-CRANE.legDX, CRANE.legDX].map((x) => (
        <group key={x}>
          <B p={[x, legTop - 0.3, (zl + zw) / 2]} s={[0.42, 0.6, zl - zw + 0.42]} m={kit.m.slate} />
          <Strut a={[x, GROUND_Y + 4.5, zl]} b={[x, legTop - 0.6, zw]} t={0.14} m={kit.m.slate} />
        </group>
      ))}
      {/* cross girders under the boom */}
      {[zl, zw].map((z) => (
        <B key={`cg${z}`} p={[0, legTop + 0.05, z]} s={[2 * CRANE.legDX + 0.42, 0.42, 0.42]} m={kit.m.slate} />
      ))}
      {/* boom girders */}
      {[-0.75, 0.75].map((x) => (
        <B key={x} p={[x, CRANE.boomY + 0.3, BOOM_CZ]} s={[0.3, 0.6, BOOM_LEN]} m={kit.m.white} />
      ))}
      {[-13.6, -10, -6.5, -3.5, 0, 2.2].map((z) => (
        <B key={z} p={[0, CRANE.boomY + 0.62, z]} s={[1.8, 0.1, 0.18]} m={kit.m.white} />
      ))}
      {/* lattice: zig-zag diagonals on the outer face of each boom girder */}
      {kit.detail === "high" &&
        [-0.92, 0.92].map((x) =>
          Array.from({ length: 16 }, (_, k) => {
            const z0 = CRANE.boomMinZ + 0.2 + k * ((BOOM_LEN - 0.4) / 16);
            const z1 = z0 + (BOOM_LEN - 0.4) / 16;
            return (
              <Strut
                key={`bl${x}${k}`}
                a={[x, CRANE.boomY + (k % 2 ? 0.55 : 0.05), z0]}
                b={[x, CRANE.boomY + (k % 2 ? 0.05 : 0.55), z1]}
                t={0.04}
                m={kit.m.slate}
              />
            );
          }),
        )}
      {/* A-frame + stays */}
      {[-0.75, 0.75].map((x) => (
        <group key={`a${x}`}>
          <Strut a={[x, CRANE.boomY + 0.6, zl]} b={[x, CRANE.boomY + 4.4, (zl + zw) / 2]} t={0.2} m={kit.m.slate} />
          <Strut a={[x, CRANE.boomY + 0.6, zw]} b={[x, CRANE.boomY + 4.4, (zl + zw) / 2]} t={0.2} m={kit.m.slate} />
          <Strut a={[x, CRANE.boomY + 4.4, (zl + zw) / 2]} b={[x, CRANE.boomY + 0.6, CRANE.boomMinZ + 0.6]} t={0.08} m={kit.m.slateDark} />
          <Strut a={[x, CRANE.boomY + 4.4, (zl + zw) / 2]} b={[x, CRANE.boomY + 0.6, -9]} t={0.07} m={kit.m.slateDark} />
          <Strut a={[x, CRANE.boomY + 4.4, (zl + zw) / 2]} b={[x, CRANE.boomY + 0.6, CRANE.boomMaxZ - 0.3]} t={0.08} m={kit.m.slateDark} />
        </group>
      ))}
      {/* machinery house + operator cab */}
      <B p={[0, CRANE.boomY + 1.35, CRANE.boomMaxZ - 1.1]} s={[2.2, 1.3, 2]} m={kit.m.white} />
      <B p={[0, CRANE.boomY + 1.35, CRANE.boomMaxZ - 0.08]} s={[1.6, 0.18, 0.06]} m={kit.m.teal} />

      {/* trolley (moves along z) */}
      <group
        ref={(o) => {
          if (o) reg.trolley = o;
        }}
      >
        <B p={[0, CRANE.boomY + 0.3, 0]} s={[1.18, 0.62, 1.4]} m={kit.m.offwhite} />
        <B p={[0, CRANE.boomY + 0.64, 0]} s={[1.0, 0.08, 1.2]} m={kit.m.teal} />
        <B p={[0, CRANE.boomY - 0.04, 0]} s={[0.9, 0.1, 0.9]} m={kit.m.slateDark} />
      </group>

      {/* hoist cables: 4 taut lines from trolley to headblock (scaled by stepper) */}
      {([
        [-0.32, -0.26],
        [0.32, -0.26],
        [-0.32, 0.26],
        [0.32, 0.26],
      ] as [number, number][]).map(([x, z], i) => (
        <mesh
          key={i}
          ref={(o) => {
            if (o) reg.cables[i] = o;
          }}
          geometry={kit.g.cyl8}
          material={kit.m.ink}
          position={[x, 8, z]}
          scale={[0.035, 1, 0.035]}
          userData={{ dx: x, dz: z }}
        />
      ))}

      {/* spreader: origin at its bottom face, centred over the container */}
      <group
        ref={(o) => {
          if (o) reg.spreader = o;
        }}
      >
        <B p={[0, 0.11, 0]} s={[L, 0.22, 0.2]} m={kit.m.yellow} />
        {[-W / 2 + 0.08, W / 2 - 0.08].map((z) => (
          <B key={z} p={[0, 0.11, z]} s={[L, 0.18, 0.12]} m={kit.m.yellow} />
        ))}
        {[-L / 2 + 0.08, L / 2 - 0.08].map((x) => (
          <B key={x} p={[x, 0.11, 0]} s={[0.16, 0.2, W]} m={kit.m.yellow} />
        ))}
        <B p={[0, 0.4, 0]} s={[0.9, 0.36, 0.64]} m={kit.m.slateDark} />
        {/* lock indicator lamps: red open → green locked */}
        {[-L / 2 + 0.3, L / 2 - 0.3].map((x) =>
          [-1, 1].map((sd) => (
            <mesh key={`ll${x}${sd}`} geometry={kit.g.sphere} material={kit.lockLamp} position={[x, 0.27, sd * (W / 2 - 0.08)]} scale={0.1} />
          )),
        )}
        {/* twist-locks at the four corner castings */}
        {([
          [-L / 2 + 0.12, -W / 2 + 0.12],
          [L / 2 - 0.12, -W / 2 + 0.12],
          [-L / 2 + 0.12, W / 2 - 0.12],
          [L / 2 - 0.12, W / 2 - 0.12],
        ] as [number, number][]).map(([x, z], i) => (
          <group key={i} position={[x, 0.24, z]}>
            <mesh
              ref={(o) => {
                if (o) reg.locks[i] = o;
              }}
              geometry={kit.g.box}
              material={kit.lockMat}
              scale={[0.26, 0.08, 0.1]}
              position={[0, 0.04, 0]}
              castShadow
            />
          </group>
        ))}
      </group>
    </group>
  );
}
