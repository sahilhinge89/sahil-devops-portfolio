// The lazily-loaded 3D canvas for "Ship it.". Owns the Director (clock + cargo state),
// the scene, OrbitControls hand-over, and exposes skip/replay through `api`.
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Director } from "../state/director";
import { createRegistry, type Registry } from "./registry";
import { KitProvider, PAL, useKit } from "../models/kit";
import { Land, Ocean } from "../models/Environment";
import { Crane } from "../models/Crane";
import { Forklift, Truck } from "../models/Vehicles";
import { MooringRopes, Ship } from "../models/Ship";
import { Crate, HeroContainer, PlainContainer, Wake } from "../models/Cargo";
import { Stepper, WAKE_COUNT, type StepperControl } from "./Stepper";
import { cameraAt, finalCamera } from "../timeline/camera";
import { T_STILL } from "../timeline/layout";
import { T_STORY, T_TOTAL, storyTime, wallAtStory } from "../timeline/opening";
import type { MasterClock } from "../state/clock";

export type CanvasMode = "play" | "idle" | "still";

export interface ShipItApi {
  skip: () => void;
  replay: () => void;
}

interface Props {
  mode: CanvasMode;
  /** false while the globe chapter covers the scene: render on demand only. */
  active: boolean;
  clock: MasterClock;
  api: { current: ShipItApi | null };
  onReady: () => void;
  lowDetail: boolean;
  coarse: boolean;
}

export default function ShipItCanvas(props: Props) {
  const { lowDetail } = props;
  const wrap = useRef<HTMLDivElement>(null);
  return (
    <div ref={wrap} className="absolute inset-0" data-scene-root>
      <Canvas
        shadows="percentage"
        dpr={lowDetail ? [1, 1.5] : [1, 2]}
        frameloop={props.mode === "still" || !props.active ? "demand" : "always"}
        camera={{ fov: 38, near: 0.5, far: 420, position: [18, 26, 40] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 0.95;
        }}
      >
        <color attach="background" args={[PAL.sky]} />
        <fog attach="fog" args={[PAL.sky, 90, 260]} />
        <KitProvider detail={lowDetail ? "low" : "high"}>
          <Scene {...props} wrap={wrap} />
        </KitProvider>
      </Canvas>
    </div>
  );
}

function Scene({
  mode,
  clock,
  api,
  onReady,
  lowDetail,
  coarse,
  wrap,
}: Props & { wrap: React.RefObject<HTMLDivElement | null> }) {
  const kit = useKit();
  const reg: Registry = useMemo(() => createRegistry(), []);
  const director = useMemo(() => new Director(), []);
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size, gl, invalidate } = useThree();
  const cbs = useRef({ onReady });
  cbs.current = { onReady };

  const ctl: StepperControl = useMemo(
    () => ({
      scripted: true,
      camTarget: new THREE.Vector3(-9, 1, -5),
      wakeCount: WAKE_COUNT,
    }),
    [],
  );

  // Place the camera on a composed final shot and hand it to the user.
  const toFinalCamera = () => {
    const pose = finalCamera(director.frame, size.width / Math.max(1, size.height), {
      px: 0,
      py: 0,
      pz: 0,
      tx: 0,
      ty: 0,
      tz: 0,
    });
    camera.position.set(pose.px, pose.py, pose.pz);
    ctl.camTarget.set(pose.tx, pose.ty, pose.tz);
    camera.lookAt(ctl.camTarget);
    handOver();
  };

  const handOver = () => {
    ctl.scripted = false;
    const c = controls.current;
    if (c) {
      c.target.copy(ctl.camTarget);
      c.enabled = true;
      c.update();
    }
    invalidate();
  };

  // Mode setup (play / idle / still) + skip & replay API. The stage owns the clock.
  useEffect(() => {
    const c = controls.current;
    if (mode === "play") {
      ctl.scripted = true;
      if (c) c.enabled = false;
      director.seek(Math.max(0, storyTime(clock.T)));
      const pose = cameraAt(storyTime(clock.T), director.frame, size.width / Math.max(1, size.height), {
        px: 0,
        py: 0,
        pz: 0,
        tx: 0,
        ty: 0,
        tz: 0,
      });
      camera.position.set(pose.px, pose.py, pose.pz);
      camera.lookAt(pose.tx, pose.ty, pose.tz);
    } else {
      director.seek(storyTime(clock.T));
      toFinalCamera();
    }
    invalidate();
    api.current = {
      skip: () => {
        director.seek(storyTime(Math.max(clock.T, T_TOTAL)));
        toFinalCamera();
      },
      replay: () => {
        director.reset();
        ctl.scripted = true;
        if (controls.current) controls.current.enabled = false;
        invalidate();
      },
    };
    return () => {
      api.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ANY mouse / touch / keyboard input cancels the camera script immediately.
  useEffect(() => {
    const cancel = () => {
      // Only once the port is on screen; input during the globe chapter is ignored here.
      if (ctl.scripted && clock.T >= T_STORY) handOver();
    };
    const opts = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", cancel, opts);
    window.addEventListener("wheel", cancel, opts);
    window.addEventListener("touchstart", cancel, opts);
    window.addEventListener("keydown", cancel, opts);
    return () => {
      window.removeEventListener("pointerdown", cancel, opts);
      window.removeEventListener("wheel", cancel, opts);
      window.removeEventListener("touchstart", cancel, opts);
      window.removeEventListener("keydown", cancel, opts);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Zoom only after the user engages the scene, so page scrolling keeps working.
  useEffect(() => {
    const el = wrap.current;
    const c = controls.current;
    if (!el || !c) return;
    c.enableZoom = false;
    if (coarse) {
      c.touches = { ONE: -1 as unknown as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE };
      gl.domElement.style.touchAction = "pan-y";
    }
    const engage = () => (c.enableZoom = true);
    const release = () => (c.enableZoom = false);
    el.addEventListener("pointerdown", engage);
    el.addEventListener("pointerleave", release);
    return () => {
      el.removeEventListener("pointerdown", engage);
      el.removeEventListener("pointerleave", release);
    };
  }, [coarse, gl, wrap]);

  // Ready signal after the first real frame.
  useEffect(() => {
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        wrap.current?.setAttribute("data-scene-ready", "true");
        cbs.current.onReady();
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [wrap]);

  // Dev-only hooks for checking the script frame by frame (times are script seconds).
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __shipit?: unknown };
    w.__shipit = {
      director,
      clock,
      seek: (t: number) => {
        clock.playing = false;
        clock.seek(wallAtStory(t));
        invalidate();
      },
      seekWall: (T: number) => {
        clock.playing = false;
        clock.seek(T);
        invalidate();
      },
      play: () => (clock.playing = true),
      ctl,
      look: (px: number, py: number, pz: number, tx: number, ty: number, tz: number) => {
        ctl.scripted = false;
        camera.position.set(px, py, pz);
        camera.lookAt(tx, ty, tz);
        invalidate();
      },
    };
    const q = new URLSearchParams(window.location.search).get("shipit");
    if (q !== null && !Number.isNaN(Number(q))) {
      clock.playing = false;
      clock.seek(wallAtStory(Number(q)));
    }
    return () => {
      delete w.__shipit;
    };
  }, [director, ctl, invalidate, camera, clock]);

  return (
    <>
      <hemisphereLight args={["#eaf3f9", "#e7d9bf", 1.15]} />
      <directionalLight
        castShadow
        position={[38, 34, 26]}
        intensity={2.3}
        color="#ffe7cf"
        shadow-mapSize={lowDetail ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-48}
        shadow-camera-right={48}
        shadow-camera-top={34}
        shadow-camera-bottom={-34}
        shadow-camera-near={1}
        shadow-camera-far={150}
      />
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={1.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
        <Lightformer intensity={0.8} color="#ffe2c4" position={[10, 2, 0]} rotation-y={-Math.PI / 2} scale={[20, 3, 1]} />
        <Lightformer intensity={0.6} color="#bfe0ee" position={[-10, 2, 0]} rotation-y={Math.PI / 2} scale={[20, 3, 1]} />
      </Environment>

      <Ocean reg={reg} />
      <Land reg={reg} />
      <Crane reg={reg} />
      <Truck reg={reg} />
      <Forklift reg={reg} />
      <Ship reg={reg} />
      <MooringRopes reg={reg} />
      <HeroContainer reg={reg} />
      <PlainContainer reg={reg} id="c2" color="blue" />
      <PlainContainer reg={reg} id="c3" color="sand" />
      <Crate reg={reg} />
      <Wake reg={reg} count={WAKE_COUNT} />

      <OrbitControls
        ref={controls}
        makeDefault
        enabled={false}
        enableDamping
        dampingFactor={0.08}
        zoomToCursor
        minDistance={6}
        maxDistance={80}
        maxPolarAngle={1.42}
        onChange={() => {
          const c = controls.current;
          if (!c) return;
          c.target.x = THREE.MathUtils.clamp(c.target.x, -40, 30);
          c.target.y = THREE.MathUtils.clamp(c.target.y, 0, 10);
          c.target.z = THREE.MathUtils.clamp(c.target.z, -32, 16);
        }}
      />
      <Stepper director={director} clock={clock} reg={reg} kit={kit} ctl={ctl} />
    </>
  );
}
