// Pure maths matching cobe's globe projection, so DOM labels/rings can sit exactly on markers.
export type LatLon = readonly [lat: number, lon: number];

const RAD = Math.PI / 180;
export const GLOBE_RADIUS = 0.8;

export function latLonToVec([lat, lon]: LatLon): [number, number, number] {
  const r = lat * RAD;
  const a = lon * RAD - Math.PI;
  const c = Math.cos(r);
  return [-c * Math.cos(a), Math.sin(r), c * Math.sin(a)];
}

export interface Projected {
  x: number; // 0..1 across the canvas
  y: number; // 0..1 down the canvas
  visible: boolean; // on the front hemisphere
  depth: number; // > 0 in front
}

/** Project a lat/lon onto the canvas for globe rotation phi/theta, canvas aspect w/h and scale. */
export function projectGlobe(
  loc: LatLon,
  phi: number,
  theta: number,
  aspect: number,
  scale = 1,
  elevation = 0,
  out: Projected = { x: 0, y: 0, visible: false, depth: 0 },
): Projected {
  const v = latLonToVec(loc);
  const k = GLOBE_RADIUS + elevation;
  const t0 = v[0] * k;
  const t1 = v[1] * k;
  const t2 = v[2] * k;
  const cr = Math.cos(theta);
  const ca = Math.cos(phi);
  const sr = Math.sin(theta);
  const sa = Math.sin(phi);
  const c = ca * t0 + sa * t2;
  const s = sa * sr * t0 + cr * t1 - ca * sr * t2;
  const z = -sa * cr * t0 + sr * t1 + ca * cr * t2;
  out.x = ((c / aspect) * scale + 1) / 2;
  out.y = (-s * scale + 1) / 2;
  out.depth = z;
  out.visible = z >= 0 || c * c + s * s >= 0.64;
  return out;
}

/** Rotation that puts a location dead centre, facing the viewer. phi in [0, 2π). */
export function focusAngles([lat, lon]: LatLon): { phi: number; theta: number } {
  const tau = Math.PI * 2;
  const phi = (((1.5 * Math.PI - lon * RAD) % tau) + tau) % tau;
  return { phi, theta: lat * RAD };
}
