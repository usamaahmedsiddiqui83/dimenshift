import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DIM, ENVELOPE_BOX, INPUT_BOLTS, OUTPUT_BOLTS, TOP_BOLTS, type GeometryKey } from './wormAssembly';

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
  if (rIn > 0) s.holes.push(circle(cx, cy, rIn));
  return extrude(s, depth, bevel, res);
}

const box = (w: number, h: number, d: number, x: number, y: number, z: number) =>
  new THREE.BoxGeometry(w, h, d).toNonIndexed().translate(x, y, z);

function merge(geoms: THREE.BufferGeometry[]) {
  const prepared = geoms.map((g) => {
    const flat = g.index ? g.toNonIndexed() : g;
    // Every piece carries the same attributes so they can merge.
    if (!flat.getAttribute('uv')) flat.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((flat.getAttribute('position').count) * 2), 2));
    return flat;
  });
  const merged = mergeGeometries(prepared, false);
  if (!merged) throw new Error('Geometry merge failed: attribute mismatch');
  geoms.forEach((g) => g.dispose());
  return merged;
}

/* ------------------------------------------------------------------ housing */

/**
 * Cast housing: five walls around a hollow gear chamber (open at the top for the inspection cover),
 * bored for the output shaft on ±X and the worm shaft on ±Z, with bearing bosses, cooling fins on
 * the lower flanks, corner ribs and mounting feet.
 */
function housing(res: Res) {
  const H = DIM.half;
  const t = DIM.wall;
  const top = DIM.bodyTop;
  const bot = DIM.bodyBottom;
  const h = top - bot;
  const cy = (top + bot) / 2;
  const pieces: THREE.BufferGeometry[] = [];

  // ±X walls (in the ZY plane), bored for the output shaft.
  for (const side of [-1, 1]) {
    const s = roundedRect(new THREE.Shape(), 0, cy, H * 2, h, 0.12);
    s.holes.push(circle(0, DIM.outputShaftY, 0.36));
    const g = extrude(s, t, 0.02, res);
    g.rotateY(Math.PI / 2).translate(side * (H - t / 2), 0, 0);
    pieces.push(g);
    // Bearing boss around the bore
    const boss = ring(0.56, 0.36, 0.1, 0.015, res);
    boss.rotateY(Math.PI / 2).translate(side * (H + 0.049), DIM.outputShaftY, 0);
    pieces.push(boss);
  }
  // ±Z walls (between the X walls), bored for the worm shaft.
  for (const side of [-1, 1]) {
    const s = roundedRect(new THREE.Shape(), 0, cy, (H - t) * 2 + 0.02, h, 0.06);
    s.holes.push(circle(0, DIM.inputShaftY, 0.26));
    const g = extrude(s, t, 0.02, res);
    g.translate(0, 0, side * (H - t / 2));
    pieces.push(g);
    const boss = ring(0.42, 0.26, 0.1, 0.015, res);
    boss.translate(0, DIM.inputShaftY, side * (H + 0.049));
    pieces.push(boss);
  }
  // Top frame around the inspection opening, and the floor.
  {
    const s = roundedRect(new THREE.Shape(), 0, 0, (H - t) * 2 + 0.02, (H - t) * 2 + 0.02, 0.04);
    s.holes.push(roundedRect(new THREE.Path(), 0, 0, 1.12, 1.12, 0.1));
    const g = extrude(s, t, 0.015, res);
    g.rotateX(-Math.PI / 2).translate(0, top - t / 2 - 0.003, 0);
    pieces.push(g);
  }
  // Raised seat for the inspection cover
  {
    const s = roundedRect(new THREE.Shape(), 0, 0, 1.4, 1.4, 0.14);
    s.holes.push(roundedRect(new THREE.Path(), 0, 0, 1.12, 1.12, 0.1));
    const g = extrude(s, 0.04, 0, res);
    g.rotateX(-Math.PI / 2).translate(0, top + 0.022, 0);
    pieces.push(g);
  }
  // Base with mounting feet
  const baseTop = DIM.housingBottom + 0.14;
  pieces.push(box(H * 2 + 0.3, 0.14, H * 2 - 0.2, 0, DIM.housingBottom + 0.07, 0));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pieces.push(box(0.36, 0.2, 0.36, sx * (H + 0.05), DIM.housingBottom + 0.103, sz * (H - 0.3)));
    }
  }
  // Cooling fins below the bearing bosses, and a plinth joining body to base
  pieces.push(box(H * 2 - 0.1, bot + 0.004 - baseTop - 0.003, H * 2 - 0.3, 0, (bot + 0.004 + baseTop + 0.003) / 2, 0));
  for (const side of [-1, 1]) {
    for (const z of [-0.6, -0.3, 0, 0.3, 0.6]) {
      pieces.push(box(0.14, 0.42, 0.05, side * (H + 0.03), bot + 0.02, z));
    }
    for (const x of [-0.55, -0.2, 0.2, 0.55]) {
      pieces.push(box(0.05, 0.3, 0.12, x, bot + 0.05, side * (H + 0.02)));
    }
  }
  return merge(pieces);
}

/* ----------------------------------------------------------------- covers */

/** Inspection cover: modeled in XY, extruded along Z; placed with +Z pointing up. */
function topCover(res: Res) {
  const s = roundedRect(new THREE.Shape(), 0, 0, 1.38, 1.38, 0.14);
  for (const [x, z] of TOP_BOLTS) s.holes.push(circle(x, z, 0.045));
  s.holes.push(circle(0, 0, 0.06));
  const plate = extrude(s, 0.06, 0.012, res);
  const rib = ring(0.14, 0.06, 0.05, 0.008, res).translate(0, 0, 0.05);
  return merge([plate, rib]);
}

/** Round bearing flange: plate with bolt circle, spigot and a central boss around the bore. */
function flange(r: number, bore: number, boltPts: [number, number][], boltR: number, blind: boolean, res: Res) {
  const s = new THREE.Shape().absarc(0, 0, r, 0, TAU, false);
  if (!blind) s.holes.push(circle(0, 0, bore));
  for (const [x, y] of boltPts) s.holes.push(circle(x, y, boltR));
  const plate = extrude(s, 0.08, 0.012, res);
  const spigot = ring(r * 0.62, blind ? 0 : bore, 0.08, 0, res).translate(0, 0, -0.07);
  const boss = blind
    ? new THREE.CylinderGeometry(r * 0.46, r * 0.5, 0.07, res.radial).rotateX(Math.PI / 2).translate(0, 0, 0.07)
    : ring(bore + 0.08, bore, 0.08, 0.01, res).translate(0, 0, 0.07);
  return merge([plate, spigot, boss]);
}

/* ------------------------------------------------------------- drivetrain */

/** Worm wheel: throated rim with helical-looking teeth, web and hub; axis along Z. */
function wormWheel(res: Res) {
  const teeth = DIM.wheelTeeth;
  const m = DIM.wheelModule;
  const rp = (teeth * m) / 2;
  const ra = rp + m;
  const rf = rp - 1.25 * m;
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
  shape.holes.push(circle(0, 0, rf - 0.06));
  // Teeth are swept with a slight twist so they read as a worm wheel's helical flanks.
  const rim = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    steps: 6,
    curveSegments: res.curve,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
    bevelSegments: 1,
  });
  rim.translate(0, 0, -0.12);
  const pos = rim.getAttribute('position');
  for (let i = 0; i < pos.count; i++) {
    const z = pos.getZ(i);
    const a = z * 0.9;
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setXY(i, x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a));
  }
  rim.computeVertexNormals();
  const web = ring(rf - 0.05, 0.16, 0.1, 0.01, res);
  // Lightening holes in the web
  const holes: THREE.BufferGeometry[] = [];
  const webShape = new THREE.Shape().absarc(0, 0, rf - 0.05, 0, TAU, false);
  webShape.holes.push(circle(0, 0, 0.16));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    webShape.holes.push(circle(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0.06));
  }
  const webWithHoles = extrude(webShape, 0.1, 0.01, res);
  web.dispose();
  const hub = ring(0.2, 0.13, 0.3, 0.012, res);
  return merge([rim, webWithHoles, hub, ...holes]);
}

/** Single-start worm: core cylinder with a helical thread, along Z. */
function worm(res: Res) {
  const r = DIM.wormRadius;
  const len = 0.62;
  const core = new THREE.CylinderGeometry(r * 0.78, r * 0.78, len, res.radial).rotateX(Math.PI / 2);
  const pitch = Math.PI * DIM.wheelModule;
  const turns = len / pitch;
  const pts: THREE.Vector3[] = [];
  const n = Math.round(turns * 28);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * TAU;
    pts.push(new THREE.Vector3(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, -len / 2 + t * len));
  }
  const thread = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r * 0.2, Math.max(6, res.radial / 4), false);
  const collars = [-1, 1].map((sd) =>
    new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.05, res.radial).rotateX(Math.PI / 2).translate(0, 0, sd * (len / 2 + 0.025)),
  );
  return merge([core, thread, ...collars]);
}

/** Turned shaft from a (radius, z) profile, axis along Z. */
function shaft(profile: [number, number][], res: Res) {
  const g = new THREE.LatheGeometry(
    profile.map(([r, z]) => new THREE.Vector2(r, z)),
    res.radial,
  );
  g.rotateX(Math.PI / 2);
  return g;
}

function ballBearing(R: number, width: number, bore: number, res: Res) {
  const pieces: THREE.BufferGeometry[] = [ring(R, R * 0.8, width, 0.008, res), ring(R * 0.6, bore, width, 0.008, res)];
  const balls = 10;
  for (let k = 0; k < balls; k++) {
    const a = (k / balls) * TAU;
    pieces.push(
      new THREE.SphereGeometry(R * 0.1, res.sphere, Math.max(6, res.sphere - 2)).translate(R * 0.7 * Math.cos(a), R * 0.7 * Math.sin(a), 0),
    );
  }
  return merge(pieces);
}

/** Tapered roller bearing: cup, cone and a ring of tilted rollers. */
function rollerBearing(R: number, width: number, bore: number, res: Res) {
  const pieces: THREE.BufferGeometry[] = [ring(R, R * 0.82, width, 0.008, res), ring(R * 0.58, bore, width * 1.15, 0.008, res)];
  const rollers = 12;
  for (let k = 0; k < rollers; k++) {
    const a = (k / rollers) * TAU;
    const roller = new THREE.CylinderGeometry(R * 0.085, R * 0.11, width * 0.9, Math.max(8, res.radial / 3))
      .rotateX(Math.PI / 2)
      .rotateY(0.25)
      .translate(R * 0.7, 0, 0)
      .rotateZ(a);
    pieces.push(roller);
  }
  return merge(pieces);
}

function bolt(size: number, res: Res) {
  const head = new THREE.CylinderGeometry(size, size, size * 1.05, 6).rotateX(Math.PI / 2).translate(0, 0, size * 0.72);
  const washer = new THREE.CylinderGeometry(size * 1.25, size * 1.25, size * 0.18, res.radial)
    .rotateX(Math.PI / 2)
    .translate(0, 0, size * 0.09);
  const shank = new THREE.CylinderGeometry(size * 0.52, size * 0.52, size * 4.4, Math.max(8, res.radial / 2))
    .rotateX(Math.PI / 2)
    .translate(0, 0, -size * 2.2);
  return merge([head, washer, shank]);
}

function breather(res: Res) {
  const hex = new THREE.CylinderGeometry(0.075, 0.075, 0.06, 6).rotateX(Math.PI / 2).translate(0, 0, 0.03);
  const stem = new THREE.CylinderGeometry(0.035, 0.035, 0.14, res.radial / 2).rotateX(Math.PI / 2).translate(0, 0, 0.12);
  const cap = new THREE.SphereGeometry(0.055, res.sphere, res.sphere).translate(0, 0, 0.21);
  return merge([hex, stem, cap]);
}

function sightGlass(res: Res) {
  const bezel = ring(0.11, 0.07, 0.05, 0.008, res);
  const lens = new THREE.CylinderGeometry(0.07, 0.07, 0.03, res.radial).rotateX(Math.PI / 2).translate(0, 0, 0.005);
  return merge([bezel, lens]);
}

export function buildGeometries(detail: Detail): Record<GeometryKey, THREE.BufferGeometry> {
  const res: Res = detail === 'high' ? { curve: 20, radial: 36, sphere: 10 } : { curve: 10, radial: 20, sphere: 7 };
  return {
    housing: housing(res),
    topCover: topCover(res),
    outputFlange: flange(0.6, 0.16, OUTPUT_BOLTS, 0.045, false, res),
    outputCap: flange(0.6, 0, OUTPUT_BOLTS, 0.045, true, res),
    inputFlange: flange(0.42, 0.1, INPUT_BOLTS, 0.04, false, res),
    inputCap: flange(0.42, 0, INPUT_BOLTS, 0.04, true, res),
    wormWheel: wormWheel(res),
    worm: worm(res),
    // Output shaft: along local Z, exits +Z (world +X) by ~0.95 with a keyed end.
    shaftOutput: shaft(
      [
        [0, -0.98],
        [0.11, -0.98],
        [0.13, -0.96],
        [0.13, 0.98],
        [0.12, 1.0],
        [0.12, 1.93],
        [0.105, 1.95],
        [0, 1.95],
      ],
      res,
    ),
    // Input (worm) shaft: along Z, exits +Z by ~0.85.
    shaftInput: shaft(
      [
        [0, -1.0],
        [0.06, -1.0],
        [0.07, -0.99],
        [0.07, 0.99],
        [0.065, 1.0],
        [0.065, 1.83],
        [0.055, 1.85],
        [0, 1.85],
      ],
      res,
    ),
    bearingOutput: ballBearing(0.3, 0.12, 0.13, res),
    bearingInput: rollerBearing(0.22, 0.12, 0.07, res),
    sealOutput: ring(0.2, 0.12, 0.06, 0.014, res),
    sealInput: ring(0.15, 0.065, 0.06, 0.014, res),
    bolt: bolt(0.055, res),
    boltSmall: bolt(0.045, res),
    breather: breather(res),
    sightGlass: sightGlass(res),
    nameplate: new THREE.BoxGeometry(0.46, 0.24, 0.012),
    keyOutput: new THREE.BoxGeometry(0.06, 0.05, 0.5).translate(0, 0.125, 1.55),
    keyInput: new THREE.BoxGeometry(0.04, 0.035, 0.4).translate(0, 0.07, 1.5),
  };
}

/** Crease angle (degrees) for technical edge extraction; round parts need a higher value to avoid facet noise. */
export const edgeThreshold: Partial<Record<GeometryKey, number>> = {
  housing: 35,
  bearingOutput: 60,
  bearingInput: 60,
  worm: 80,
  wormWheel: 40,
  bolt: 60,
  boltSmall: 60,
  breather: 60,
  sightGlass: 50,
  outputFlange: 35,
  outputCap: 35,
  inputFlange: 35,
  inputCap: 35,
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
