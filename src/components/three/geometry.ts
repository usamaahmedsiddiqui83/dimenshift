import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { COVER_BOLTS, DIM, ENVELOPE_BOX, FOOT_BOLTS, type GeometryKey } from './assembly';

/** 'low' is used on small screens and low-power devices: fewer curve and radial segments. */
export type Detail = 'high' | 'low';

interface Res {
  curve: number;
  radial: number;
  sphere: number;
}

const TAU = Math.PI * 2;

function roundedRect<T extends THREE.Path>(p: T, cx: number, cy: number, w: number, h: number, r: number): T {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x1 - r, y0);
  p.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x1, y1 - r);
  p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  p.lineTo(x0 + r, y1);
  p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x0, y0 + r);
  p.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}

const circle = (cx: number, cy: number, r: number) => new THREE.Path().absarc(cx, cy, r, 0, TAU, true);

/** Extrudes along Z, centered on z = 0, with an optional machined chamfer that keeps the outline dimension. */
function extrude(shape: THREE.Shape, depth: number, bevel: number, res: Res, bevelSegments = 1) {
  const core = Math.max(0.002, depth - bevel * 2);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: core,
    curveSegments: res.curve,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.8,
    bevelOffset: -bevel * 0.8,
    bevelSegments,
  });
  g.translate(0, 0, -core / 2);
  return g;
}

function ring(rOut: number, rIn: number, depth: number, bevel: number, res: Res, cx = 0, cy = 0) {
  const s = new THREE.Shape().absarc(cx, cy, rOut, 0, TAU, false);
  s.holes.push(circle(cx, cy, rIn));
  return extrude(s, depth, bevel, res);
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number) =>
  new THREE.BoxGeometry(w, h, d).toNonIndexed().translate(x, y, z);

function merge(geoms: THREE.BufferGeometry[]) {
  const prepared = geoms.map((g) => (g.index ? g.toNonIndexed() : g));
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error('Geometry merge failed: attribute mismatch');
  geoms.forEach((g) => g.dispose());
  return merged;
}

const housingOutline = () => {
  const w = DIM.housingHalfWidth * 2;
  const h = DIM.housingTop - DIM.housingBottom;
  const cy = (DIM.housingTop + DIM.housingBottom) / 2;
  return { w, h, cy };
};

function housing(res: Res) {
  const { w, h, cy } = housingOutline();
  const shape = roundedRect(new THREE.Shape(), 0, cy, w, h, 0.16);
  shape.holes.push(roundedRect(new THREE.Path(), 0, cy, w - DIM.housingWall * 2, h - DIM.housingWall * 2, 0.08));
  const pieces: THREE.BufferGeometry[] = [extrude(shape, DIM.housingDepth, 0.02, res)];
  for (const side of [-1, 1]) {
    // Cooling ribs
    for (const y of [0.55, 0.2, -0.15, -0.5, -0.85]) {
      pieces.push(box(0.08, 0.05, 0.9, side * (DIM.housingHalfWidth + 0.04), y, 0));
    }
    // Mounting feet
    pieces.push(box(0.45, 0.15, 0.9, side * 1.225, DIM.housingBottom + 0.075, 0));
  }
  // Breather boss
  pieces.push(
    new THREE.CylinderGeometry(0.11, 0.13, 0.08, res.radial).translate(0, DIM.housingTop + 0.04, 0),
  );
  return merge(pieces);
}

function cover(boreY: number, boreR: number, bossOut: number, res: Res) {
  const { w, h, cy } = housingOutline();
  const shape = roundedRect(new THREE.Shape(), 0, cy, w, h, 0.16);
  shape.holes.push(circle(0, boreY, boreR));
  for (const [x, y] of COVER_BOLTS) shape.holes.push(circle(x, y, 0.05));
  const plate = extrude(shape, 0.1, 0.012, res);
  const boss = ring(bossOut, boreR, 0.08, 0.01, res, 0, boreY).translate(0, 0, 0.09);
  return merge([plate, boss]);
}

function gasket(res: Res) {
  const { w, h, cy } = housingOutline();
  const shape = roundedRect(new THREE.Shape(), 0, cy, w, h, 0.16);
  shape.holes.push(roundedRect(new THREE.Path(), 0, cy, w - DIM.housingWall * 2, h - DIM.housingWall * 2, 0.08));
  for (const [x, y] of COVER_BOLTS) shape.holes.push(circle(x, y, 0.05));
  return extrude(shape, 0.02, 0, res);
}

/** Spur gear with approximated involute flanks. Tooth centers start at angle 0 so gear pairs mesh. */
function gear(teeth: number, module: number, thickness: number, bore: number, lighteningHoles: number, res: Res) {
  const rp = (teeth * module) / 2;
  const ra = rp + module;
  const rf = rp - 1.25 * module;
  const step = TAU / teeth;
  const hw = Math.PI / (2 * teeth);
  const shape = new THREE.Shape();
  const pt = (r: number, a: number, first = false) =>
    first ? shape.moveTo(r * Math.cos(a), r * Math.sin(a)) : shape.lineTo(r * Math.cos(a), r * Math.sin(a));

  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    pt(rf, a - 1.3 * hw, i === 0);
    pt(rp, a - hw);
    pt(ra, a - 0.55 * hw);
    pt(ra, a + 0.55 * hw);
    pt(rp, a + hw);
    pt(rf, a + 1.3 * hw);
    pt(rf, a + step / 2);
  }
  shape.holes.push(circle(0, 0, bore));
  if (lighteningHoles > 0) {
    const r = (rf + bore) / 2;
    const hole = (rf - bore) * 0.22;
    for (let k = 0; k < lighteningHoles; k++) {
      const a = (k / lighteningHoles) * TAU + step / 2;
      shape.holes.push(circle(r * Math.cos(a), r * Math.sin(a), hole));
    }
  }
  return extrude(shape, thickness, 0.012, res);
}

/** Turned shaft from a (radius, z) profile. */
function shaft(profile: [number, number][], res: Res) {
  const g = new THREE.LatheGeometry(
    profile.map(([r, z]) => new THREE.Vector2(r, z)),
    res.radial,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

function bearing(R: number, width: number, bore: number, res: Res) {
  const pieces: THREE.BufferGeometry[] = [
    ring(R, R * 0.8, width, 0.008, res),
    ring(R * 0.6, bore, width, 0.008, res),
  ];
  const balls = 9;
  const ballR = R * 0.095;
  for (let k = 0; k < balls; k++) {
    const a = (k / balls) * TAU;
    pieces.push(
      new THREE.SphereGeometry(ballR, res.sphere, Math.max(6, res.sphere - 2)).translate(
        R * 0.7 * Math.cos(a),
        R * 0.7 * Math.sin(a),
        0,
      ),
    );
  }
  return merge(pieces);
}

function bolt(res: Res) {
  const head = new THREE.CylinderGeometry(0.065, 0.065, 0.07, 6).rotateX(Math.PI / 2).translate(0, 0, 0.047);
  const washer = new THREE.CylinderGeometry(0.08, 0.08, 0.012, res.radial).rotateX(Math.PI / 2).translate(0, 0, 0.006);
  const shank = new THREE.CylinderGeometry(0.034, 0.034, 0.32, Math.max(8, res.radial / 2))
    .rotateX(Math.PI / 2)
    .translate(0, 0, -0.16);
  return merge([head, washer, shank]);
}

function basePlate(res: Res) {
  const shape = roundedRect(new THREE.Shape(), 0, 0, 3.3, 1.3, 0.08);
  // FOOT_BOLTS are (x, z); shape Y maps to world −Z after rotation, symmetric here.
  for (const [x, z] of FOOT_BOLTS) shape.holes.push(circle(x, z, 0.05));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      shape.holes.push(roundedRect(new THREE.Path(), sx * 1.5, sz * 0.47, 0.2, 0.08, 0.039));
    }
  }
  const g = extrude(shape, 0.1, 0.012, res);
  g.rotateX(-Math.PI / 2);
  return g;
}

export function buildGeometries(detail: Detail): Record<GeometryKey, THREE.BufferGeometry> {
  const res: Res = detail === 'high' ? { curve: 20, radial: 36, sphere: 10 } : { curve: 10, radial: 20, sphere: 7 };
  const m = DIM.gearModule;
  return {
    housing: housing(res),
    coverFront: cover(DIM.outputShaftY, 0.2, 0.3, res),
    coverRear: cover(DIM.inputShaftY, 0.16, 0.25, res),
    gasket: gasket(res),
    gearOutput: gear(DIM.gearTeeth, m, 0.28, 0.12, 5, res),
    pinion: gear(DIM.pinionTeeth, m, 0.32, 0.09, 0, res),
    shaftOutput: shaft(
      [
        [0, -0.56],
        [0.105, -0.56],
        [0.12, -0.545],
        [0.12, 0.6],
        [0.1, 0.62],
        [0.1, 1.285],
        [0.085, 1.3],
        [0, 1.3],
      ],
      res,
    ),
    shaftInput: shaft(
      [
        [0, -1.15],
        [0.062, -1.15],
        [0.075, -1.137],
        [0.075, -0.6],
        [0.09, -0.585],
        [0.09, 0.545],
        [0.078, 0.56],
        [0, 0.56],
      ],
      res,
    ),
    bearingOutput: bearing(0.24, 0.1, 0.12, res),
    bearingInput: bearing(0.18, 0.1, 0.09, res),
    spacerOutput: ring(0.17, 0.12, 0.31, 0.006, res),
    spacerInput: ring(0.13, 0.09, 0.29, 0.006, res),
    sealOutput: ring(0.19, 0.1, 0.06, 0.014, res),
    sealInput: ring(0.15, 0.075, 0.06, 0.014, res),
    bolt: bolt(res),
    basePlate: basePlate(res),
    key: new THREE.BoxGeometry(0.05, 0.04, 0.24).translate(0, 0.13, 0),
  };
}

/** Crease angle (degrees) for technical edge extraction; spheres need a higher value to avoid facet noise. */
export const edgeThreshold: Partial<Record<GeometryKey, number>> = {
  bearingOutput: 40,
  bearingInput: 40,
};

export function buildEnvelope(detail: Detail) {
  const res: Res = detail === 'high' ? { curve: 16, radial: 24, sphere: 8 } : { curve: 8, radial: 16, sphere: 6 };
  const { x, bottom, top, z } = ENVELOPE_BOX;
  const w = x * 2 - 0.5;
  const h = top - bottom - 0.15;
  const shape = roundedRect(new THREE.Shape(), 0, (top + bottom) / 2, w, h, 0.35);
  const solid = extrude(shape, z * 2 - 0.1, 0.14, res, detail === 'high' ? 5 : 2);
  const outline = new THREE.EdgesGeometry(
    new THREE.BoxGeometry(x * 2, top - bottom, z * 2).translate(0, (top + bottom) / 2, 0),
  );
  return { solid, outline };
}
