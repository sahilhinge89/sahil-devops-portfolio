// Shared geometries, materials and textures for the whole scene. Created once per
// canvas, reused by every model, and disposed when the canvas unmounts.
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";

export const DEVOPS_LABELS = [
  "DOCKER",
  "KUBERNETES",
  "TERRAFORM",
  "ANSIBLE",
  "AWS",
  "ARGOCD",
  "LINUX",
  "GITHUB",
  "JENKINS",
  "NGINX",
  "GRAFANA",
  "PROMETHEUS",
] as const;

export const PAL = {
  sky: "#cfe3ee",
  water: "#5fa8bf",
  quay: "#e9dcc4",
  quaySide: "#bfae90",
  road: "#b9c3ca",
  line: "#f7f5ef",
  white: "#f6f5f0",
  offwhite: "#ece9e1",
  sand: "#e5d2ae",
  sandDark: "#c9b086",
  slate: "#56708a",
  slateDark: "#344b63",
  ink: "#2a3846",
  glass: "#5a7387",
  teal: "#2a9d8f",
  green: "#6cc58f",
  blue: "#9db8d2",
  coral: "#e6b3a1",
  mint: "#b8dccb",
  yellow: "#e4c072",
  cab: "#87a8c4",
  deck: "#d6c9ae",
  navy: "#34495e",
  skin: "#e0b38e",
  grass: "#c9dcc0",
  tree: "#8fb58c",
} as const;

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/** Deterministic pseudo-random for textures (no Math.random → stable across reloads). */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function labelTexture(
  text: string,
  opts: { w?: number; h?: number; fg?: string; bg?: string; size?: number; weight?: number; radius?: number } = {},
) {
  const { w = 256, h = 64, fg = PAL.ink, bg = "rgba(0,0,0,0)", size = 34, weight = 600, radius = 10 } = opts;
  return canvasTex(w, h, (g) => {
    if (bg !== "rgba(0,0,0,0)") {
      g.fillStyle = bg;
      g.beginPath();
      g.roundRect(2, 2, w - 4, h - 4, radius);
      g.fill();
    }
    g.fillStyle = fg;
    g.font = `${weight} ${size}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 1);
  });
}

function std(color: string, extra: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0, ...extra });
}

export function createKit(detail: "high" | "low") {
  const box = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, detail === "high" ? 20 : 12);
  const cyl8 = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
  const sphere = new THREE.SphereGeometry(0.5, detail === "high" ? 20 : 12, detail === "high" ? 14 : 8);
  const cone = new THREE.ConeGeometry(0.5, 1, 4);
  const torus = new THREE.TorusGeometry(0.5, 0.06, 8, 28);
  const plane = new THREE.PlaneGeometry(1, 1);
  const disc = new THREE.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2);
  const capsule = new THREE.CapsuleGeometry(0.5, 1, 4, 10);

  const corrugation = canvasTex(256, 32, (g) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 256, 32);
    for (let i = 0; i < 32; i++) {
      g.fillStyle = i % 2 ? "#e4e4e4" : "#f7f7f7";
      g.fillRect(i * 8, 0, 4, 32);
    }
    g.fillStyle = "#cfcfcf";
    g.fillRect(0, 0, 256, 2);
    g.fillRect(0, 30, 256, 2);
  });
  const concrete = canvasTex(256, 256, (g) => {
    const r = rng(7);
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) {
      const v = 228 + Math.floor(r() * 27);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1 + r() * 2);
    }
    g.strokeStyle = "rgba(0,0,0,0.07)";
    g.lineWidth = 2;
    g.strokeRect(0, 0, 256, 256);
  });
  concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping;
  concrete.repeat.set(18, 6);
  const roadTex = canvasTex(256, 64, (g) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#b9bfc2";
    g.fillRect(0, 30, 120, 4);
    g.fillStyle = "#eef0f0";
    g.fillRect(0, 2, 256, 3);
    g.fillRect(0, 59, 256, 3);
  });
  roadTex.wrapS = THREE.RepeatWrapping;
  roadTex.repeat.set(26, 1);
  const deckTex = canvasTex(128, 128, (g) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#eae6dc";
    for (let i = 0; i < 8; i++) g.fillRect(0, i * 16, 128, 1);
  });
  deckTex.wrapS = deckTex.wrapT = THREE.RepeatWrapping;
  deckTex.repeat.set(6, 2);
  const glow = canvasTex(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  });

  const m = {
    quay: std(PAL.quay, { map: concrete }),
    quaySide: std(PAL.quaySide),
    road: std(PAL.road, { map: roadTex }),
    line: std(PAL.line),
    white: std(PAL.white),
    offwhite: std(PAL.offwhite),
    sand: std(PAL.sand),
    sandDark: std(PAL.sandDark),
    slate: std(PAL.slate, { roughness: 0.6 }),
    slateDark: std(PAL.slateDark, { roughness: 0.6 }),
    ink: std(PAL.ink, { roughness: 0.7 }),
    glass: std(PAL.glass, { roughness: 0.25, metalness: 0.2 }),
    yellow: std(PAL.yellow),
    cab: std(PAL.cab, { roughness: 0.55 }),
    deck: std(PAL.deck, { map: deckTex }),
    navy: std(PAL.navy),
    skin: std(PAL.skin),
    grass: std(PAL.grass),
    tree: std(PAL.tree, { flatShading: true }),
    teal: std(PAL.teal, { roughness: 0.5 }),
    interior: std("#4a5562", { roughness: 1 }),
    containerTeal: std(PAL.teal, { map: corrugation, roughness: 0.6 }),
    containerBlue: std(PAL.blue, { map: corrugation, roughness: 0.65 }),
    containerSand: std(PAL.sand, { map: corrugation, roughness: 0.65 }),
    containerCoral: std(PAL.coral, { map: corrugation, roughness: 0.7 }),
    containerMint: std(PAL.mint, { map: corrugation, roughness: 0.7 }),
    containerWhite: std(PAL.offwhite, { map: corrugation, roughness: 0.7 }),
    instanced: std("#ffffff", { map: corrugation, roughness: 0.7 }),
    crate: std("#8fe3d6", { emissive: new THREE.Color("#3cc2b0"), emissiveIntensity: 0.9, roughness: 0.35 }),
    foam: new THREE.MeshBasicMaterial({ color: "#f4fbfc", transparent: true, opacity: 0.38, depthWrite: false }),
    glow: new THREE.SpriteMaterial({
      map: glow,
      color: "#7fe0d2",
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }),
  };

  // Per-object materials whose colour animates independently.
  type M3 = [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  const gateLights = [0, 1, 2].map(() =>
    std(PAL.white, { emissive: new THREE.Color(PAL.green), emissiveIntensity: 0 }),
  ) as M3;
  const slotPads = [0, 1, 2].map(() =>
    std("#cfd8d6", { emissive: new THREE.Color(PAL.teal), emissiveIntensity: 0, roughness: 0.5 }),
  ) as M3;
  const lockMat = std(PAL.yellow, { emissive: new THREE.Color(PAL.teal), emissiveIntensity: 0 });
  // Spreader indicator lamps: colour driven red → green by the lock state (see details.ts).
  const lockLamp = std("#f2d6d0", { emissive: new THREE.Color("#e2574c"), emissiveIntensity: 0.9, roughness: 0.5 });
  // Small glowing / accent parts shared by every vehicle and the ship.
  const fx = {
    headlight: std("#fffaf0", { emissive: new THREE.Color("#fff1cf"), emissiveIntensity: 1.1, roughness: 0.3 }),
    taillight: std("#e9867a", { emissive: new THREE.Color("#ff5a4a"), emissiveIntensity: 0.9, roughness: 0.4 }),
    amber: std("#f3cf8e", { emissive: new THREE.Color("#ffb648"), emissiveIntensity: 0, roughness: 0.4 }),
    navRed: std("#f0b4ab", { emissive: new THREE.Color("#ff4b3e"), emissiveIntensity: 1.6 }),
    navGreen: std("#bfe8cf", { emissive: new THREE.Color("#33d17a"), emissiveIntensity: 1.6 }),
    lamp: std("#fffaf0", { emissive: new THREE.Color("#fff3d6"), emissiveIntensity: 0.6 }),
    chrome: std("#dfe5ea", { roughness: 0.28, metalness: 0.65 }),
    reflect: std("#f7f2e6", { emissive: new THREE.Color("#fff3d6"), emissiveIntensity: 0.12, roughness: 0.3 }),
    reflectRed: std("#e3907f", { emissive: new THREE.Color("#e3907f"), emissiveIntensity: 0.15, roughness: 0.3 }),
    antifoul: std("#c97a68", { roughness: 0.7 }),
    rope: std("#cdb894", { roughness: 0.95, transparent: true, opacity: 0 }),
    bowFoam: new THREE.MeshBasicMaterial({ color: "#f6fcfd", transparent: true, opacity: 0, depthWrite: false }),
  };
  const beacon = std("#e8f6f3", { emissive: new THREE.Color("#5fd6c6"), emissiveIntensity: 0 });

  const labels = {
    lint: labelTexture("lint", { bg: PAL.white, w: 192, h: 64 }),
    test: labelTexture("test", { bg: PAL.white, w: 192, h: 64 }),
    scan: labelTexture("scan", { bg: PAL.white, w: 192, h: 64 }),
    node: [0, 1, 2].map((i) => labelTexture(`node-${i + 1}`, { fg: "#ffffff", size: 36, w: 256, h: 64 })),
    tag: labelTexture("myapp:1.0", { fg: "#ffffff", bg: "rgba(20,60,64,0.55)", size: 30, w: 256, h: 64 }),
    stamp: labelTexture("✓ registry", { fg: PAL.teal, bg: "#f6f5f0", size: 28, w: 256, h: 64 }),
    warehouse: labelTexture("BUILD", { fg: PAL.slateDark, size: 44, weight: 700, w: 256, h: 64 }),
    ship: labelTexture("PRODUCTION", { fg: "#ffffff", size: 30, weight: 700, w: 320, h: 64 }),
    // Rotating DevOps tool textures for containers (tinted per material), plain text only.
    devops: DEVOPS_LABELS.map((name) =>
      labelTexture(name, {
        fg: "#ffffff",
        size: name.length > 8 ? 64 : name.length > 6 ? 76 : 90,
        weight: 800,
        w: 512,
        h: 128,
      }),
    ),
    smallTag: labelTexture("myapp:1.0", { fg: "#ffffff", bg: "rgba(30,48,62,0.55)", size: 30, w: 256, h: 64 }),
    shipName: labelTexture("MV HELMSMAN", { fg: "#ffffff", size: 44, weight: 700, w: 512, h: 80 }),
    berth: labelTexture("BERTH 1", { fg: "#ffffff", bg: PAL.slateDark, size: 40, weight: 700, w: 256, h: 72 }),
    gates: labelTexture("CI GATES →", { fg: "#ffffff", bg: PAL.teal, size: 34, weight: 700, w: 256, h: 72 }),
    plate: labelTexture("SHIP IT 01", { fg: PAL.ink, bg: "#f6f5f0", size: 34, weight: 700, w: 256, h: 72, radius: 6 }),
  };
  const labelMat = (map: THREE.Texture, opacity = 1) =>
    new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false, toneMapped: false });
  const devopsLight = labels.devops.map((tex) => labelMat(tex, 0.95));
  const devopsDark = labels.devops.map((tex) => {
    const mm = labelMat(tex, 0.85);
    mm.color.set(PAL.slateDark);
    return mm;
  });
  const lm = {
    lint: labelMat(labels.lint),
    test: labelMat(labels.test),
    scan: labelMat(labels.scan),
    node: labels.node.map((t) => labelMat(t, 0.55)) as [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial, THREE.MeshBasicMaterial],
    tag: labelMat(labels.tag, 0),
    stamp: labelMat(labels.stamp, 0),
    warehouse: labelMat(labels.warehouse),
    ship: labelMat(labels.ship, 0.9),
    devopsLight,
    devopsDark,
    smallTag: labelMat(labels.smallTag),
    shipName: labelMat(labels.shipName, 0.95),
    berth: labelMat(labels.berth),
    gates: labelMat(labels.gates),
    plate: labelMat(labels.plate),
  };

  const water = std(PAL.water, { roughness: 0.32, metalness: 0.05 });
  const waterUniforms = { uTime: { value: 0 } };
  water.onBeforeCompile = (shader) => {
    shader.uniforms['uTime'] = waterUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         varying float vH;
         varying vec2 vP;
         float wv(vec2 p){ return 0.05*sin(0.42*p.x+1.2*uTime) + 0.04*sin(0.5*p.y-0.9*uTime+0.21*p.x) + 0.018*sin(1.3*p.x+1.7*p.y+2.1*uTime); }
         vec2 wd(vec2 p){
           float dx = 0.05*0.42*cos(0.42*p.x+1.2*uTime) + 0.04*0.21*cos(0.5*p.y-0.9*uTime+0.21*p.x) + 0.018*1.3*cos(1.3*p.x+1.7*p.y+2.1*uTime);
           float dz = 0.04*0.5*cos(0.5*p.y-0.9*uTime+0.21*p.x) + 0.018*1.7*cos(1.3*p.x+1.7*p.y+2.1*uTime);
           return vec2(dx, dz);
         }`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `vec2 dd = wd(position.xz);
         vec3 objectNormal = normalize(vec3(-dd.x, 1.0, -dd.y));
         #ifdef USE_TANGENT
           vec3 objectTangent = vec3( tangent.xyz );
         #endif`,
      )
      .replace("#include <begin_vertex>", `vec3 transformed = vec3(position); vH = wv(position.xz); vP = position.xz; transformed.y += vH;`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         varying float vH;
         varying vec2 vP;`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
         float crest = smoothstep(0.045, 0.1, vH);
         float gl = pow(max(0.0, sin(vP.x * 0.9 + uTime * 1.3) * sin(vP.y * 0.75 - uTime * 0.8)), 24.0);
         diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.97, 0.98), crest * 0.22 + gl * 0.35);`,
      );
  };

  const gridUniforms = { uOpacity: { value: 0 }, uColor: { value: new THREE.Color("#3fa7c9") } };
  const grid = new THREE.ShaderMaterial({
    uniforms: gridUniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uOpacity; uniform vec3 uColor; varying vec3 vW;
      float line(float v, float w){ float f = abs(fract(v)-0.5); return smoothstep(0.5-w, 0.5, f); }
      void main(){
        float g = max(line(vW.x/2.0, 0.03), line(vW.z/2.0, 0.03));
        float G = max(line(vW.x/10.0, 0.012), line(vW.z/10.0, 0.012));
        float fade = 1.0 - smoothstep(18.0, 46.0, length(vW.xz - vec2(-8.0,-4.0)));
        gl_FragColor = vec4(uColor, (g*0.45 + G*0.8) * uOpacity * fade);
      }`,
  });

  const geoms = { box, cyl, cyl8, sphere, cone, torus, plane, disc, capsule };
  const textures = [corrugation, concrete, roadTex, deckTex, glow, ...Object.values(labels).flat()];
  const allMats: THREE.Material[] = [
    ...Object.values(m),
    ...gateLights,
    ...slotPads,
    lockMat,
    lockLamp,
    ...Object.values(fx),
    beacon,
    lm.lint,
    lm.test,
    lm.scan,
    ...lm.node,
    lm.tag,
    lm.stamp,
    lm.warehouse,
    lm.ship,
    ...lm.devopsLight,
    ...lm.devopsDark,
    lm.smallTag,
    lm.shipName,
    lm.berth,
    lm.gates,
    lm.plate,
    water,
    grid,
  ];

  return {
    g: geoms,
    m,
    gateLights,
    slotPads,
    lockMat,
    lockLamp,
    fx,
    beacon,
    lm,
    water,
    waterUniforms,
    grid,
    gridUniforms,
    detail,
    dispose() {
      Object.values(geoms).forEach((x) => x.dispose());
      allMats.forEach((x) => x.dispose());
      textures.forEach((x) => (x as THREE.Texture).dispose());
    },
  };
}

export type Kit = ReturnType<typeof createKit>;

const KitCtx = createContext<Kit | null>(null);

export function KitProvider({ detail, children }: { detail: "high" | "low"; children: ReactNode }) {
  const kit = useMemo(() => createKit(detail), [detail]);
  useEffect(() => () => kit.dispose(), [kit]);
  return <KitCtx.Provider value={kit}>{children}</KitCtx.Provider>;
}

export function useKit() {
  const k = useContext(KitCtx);
  if (!k) throw new Error("useKit outside KitProvider");
  return k;
}

type V3 = [number, number, number];

/** Unit-box mesh scaled to `s`. */
export function B({
  p,
  s,
  m,
  r,
  shadow = true,
  name,
}: {
  p: V3;
  s: V3;
  m: THREE.Material;
  r?: V3;
  shadow?: boolean;
  name?: string;
}) {
  const { g } = useKit();
  return (
    <mesh
      {...(name ? { name } : {})}
      {...(r ? { rotation: r } : {})}
      geometry={g.box}
      material={m}
      position={p}
      scale={s}
      castShadow={shadow}
      receiveShadow
    />
  );
}

/** Unit-cylinder (axis y) mesh: radius r, height h. */
export function Cyl({
  p,
  rad,
  h,
  m,
  r,
  shadow = true,
  low,
}: {
  p: V3;
  rad: number;
  h: number;
  m: THREE.Material;
  r?: V3;
  shadow?: boolean;
  low?: boolean;
}) {
  const { g } = useKit();
  return (
    <mesh
      geometry={low ? g.cyl8 : g.cyl}
      material={m}
      position={p}
      scale={[rad * 2, h, rad * 2]}
      {...(r ? { rotation: r } : {})}
      castShadow={shadow}
      receiveShadow
    />
  );
}
