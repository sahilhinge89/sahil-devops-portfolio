import { useMemo } from "react";
import * as THREE from "three";
import { useKit } from "./kit";

type V3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);

/** A square beam between two points (static). */
export function Strut({ a, b, t = 0.16, m }: { a: V3; b: V3; t?: number; m: THREE.Material }) {
  const { g } = useKit();
  const { pos, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const q = new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize());
    return { pos: va.add(vb).multiplyScalar(0.5), quat: q, len: d.length() };
  }, [a, b]);
  return <mesh geometry={g.box} material={m} position={pos} quaternion={quat} scale={[t, len, t]} castShadow />;
}
