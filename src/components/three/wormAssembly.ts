/**
 * Right-angle worm-gear speed reducer — component data.
 *
 * Scene units: 1 unit = 100 mm. The input (worm) shaft runs along Z and exits the +Z face; the output
 * (worm-wheel) shaft runs along X and exits the +X face, 65 mm above the worm. Explosion offsets
 * follow each part's real assembly direction: input-side parts along Z, output-side parts along X,
 * the inspection cover and worm wheel lift out through the top.
 *
 * To swap in a production GLB later, keep these ids and map GLB node names to them; the animation
 * system only depends on the transforms below.
 */

export type Vec3 = [number, number, number];

export type PartGroup = 'housing' | 'covers' | 'drivetrain' | 'bearings' | 'seals' | 'fasteners' | 'fittings';

export type GeometryKey =
  | 'housing'
  | 'topCover'
  | 'outputFlange'
  | 'outputCap'
  | 'inputFlange'
  | 'inputCap'
  | 'wormWheel'
  | 'worm'
  | 'shaftOutput'
  | 'shaftInput'
  | 'bearingOutput'
  | 'bearingInput'
  | 'sealOutput'
  | 'sealInput'
  | 'bolt'
  | 'boltSmall'
  | 'breather'
  | 'sightGlass'
  | 'nameplate'
  | 'keyOutput'
  | 'keyInput';

export type MaterialKey =
  | 'housing'
  | 'cover'
  | 'shaft'
  | 'gear'
  | 'bronze'
  | 'bearing'
  | 'fastener'
  | 'seal'
  | 'gasket'
  | 'spacer'
  | 'plate'
  | 'glass';

export interface ExplodeSpec {
  /** World-space displacement at full explosion. */
  offset: Vec3;
  /** Additional local rotation at full explosion (e.g. bolts unscrewing). */
  rotation?: Vec3;
  /** Normalized start within the 0–1 explosion timeline. */
  delay: number;
  /** Normalized duration within the explosion timeline. */
  duration: number;
}

export interface PartDef {
  id: string;
  /** Bill-of-materials line this part belongs to. */
  bom: string;
  group: PartGroup;
  geometry: GeometryKey;
  material: MaterialKey;
  position: Vec3;
  rotation?: Vec3;
  scale?: number;
  explode: ExplodeSpec;
  /** Rotation about local Z relative to output-shaft drive speed (gear ratio, sign = direction). */
  spin?: number;
}

export interface BomItem {
  id: string;
  name: string;
  group: PartGroup;
  /** The material this part is modeled as. */
  material: string;
  /** What the part does in this mechanism. */
  note: string;
}

/* ---- Key dimensions shared with geometry builders ---- */
export const DIM = {
  /** Half size of the housing body in X and Z. */
  half: 1.0,
  bodyTop: 0.95,
  bodyBottom: -1.05,
  housingBottom: -1.3,
  wall: 0.14,
  /** Output (worm-wheel) axis height, along X. */
  outputShaftY: 0.15,
  /** Input (worm) axis height, along Z. */
  inputShaftY: -0.5,
  wheelTeeth: 32,
  wheelModule: 0.034,
  wormRadius: 0.1,
  /** Visual worm speed relative to the wheel (a true 32:1 reads as a blur). */
  wormSpin: -8,
} as const;

/** Bolt circles: output flange / cap (on ±X faces) and input flange / cap (on ±Z faces). */
const circlePoints = (n: number, r: number, start = Math.PI / n): [number, number][] =>
  Array.from({ length: n }, (_, i) => {
    const a = start + (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  });
export const OUTPUT_BOLTS = circlePoints(6, 0.5);
export const INPUT_BOLTS = circlePoints(4, 0.33, Math.PI / 4);
export const TOP_BOLTS: [number, number][] = [
  [-0.45, -0.45],
  [0.45, -0.45],
  [0.45, 0.45],
  [-0.45, 0.45],
];

const OUT_Y = DIM.outputShaftY;
const IN_Y = DIM.inputShaftY;
const UNSCREW: Vec3 = [0, 0, -Math.PI * 6];
/** Local +Z mapped to each world direction (parts are modeled along +Z). */
const FACE = {
  px: [0, Math.PI / 2, 0] as Vec3,
  nx: [0, -Math.PI / 2, 0] as Vec3,
  pz: [0, 0, 0] as Vec3,
  nz: [0, Math.PI, 0] as Vec3,
  py: [-Math.PI / 2, 0, 0] as Vec3,
};

export const bom: BomItem[] = [
  {
    id: 'housing',
    name: 'Gearbox housing',
    group: 'housing',
    material: 'Cast iron',
    note: 'Carries both shaft axes at right angles, holds the oil, and puts the cooling fins and mounting feet where the heat and the load are.',
  },
  {
    id: 'top-cover',
    name: 'Inspection cover',
    group: 'covers',
    material: 'Cast iron',
    note: 'Closes the chamber the wheel is fitted through, and carries the breather that lets the housing exhale as it warms.',
  },
  {
    id: 'worm',
    name: 'Worm, single start',
    group: 'drivetrain',
    material: 'Hardened steel',
    note: 'A single-start thread cut into the input shaft: one turn of the worm advances the wheel by exactly one tooth.',
  },
  {
    id: 'worm-wheel',
    name: 'Worm wheel, 32T bronze',
    group: 'drivetrain',
    material: 'Phosphor bronze',
    note: 'Thirty-two throated teeth wrap the worm so several are in contact at once. Bronze is used because it beds in against hardened steel instead of scoring it.',
  },
  {
    id: 'shaft-input',
    name: 'Input shaft',
    group: 'drivetrain',
    material: 'Hardened steel',
    note: 'Takes the drive in along Z and carries the worm between its two bearings.',
  },
  {
    id: 'shaft-output',
    name: 'Output shaft',
    group: 'drivetrain',
    material: 'Steel',
    note: 'Leaves the housing along X at right angles to the input — the turn that makes this a right-angle reducer.',
  },
  {
    id: 'key',
    name: 'Parallel key',
    group: 'drivetrain',
    material: 'Steel',
    note: 'Sits in a keyway so torque passes through a flat face rather than through friction alone.',
  },
  {
    id: 'bearing-input',
    name: 'Tapered roller bearing',
    group: 'bearings',
    material: 'Bearing steel',
    note: 'Takes the thrust a worm generates along its own axis, which a plain ball bearing could not hold.',
  },
  {
    id: 'bearing-output',
    name: 'Deep-groove ball bearing',
    group: 'bearings',
    material: 'Bearing steel',
    note: 'Locates the output shaft against the radial load from the wheel.',
  },
  {
    id: 'seal',
    name: 'Radial shaft seal',
    group: 'seals',
    material: 'Nitrile rubber',
    note: 'Runs on the turning shaft to keep oil in and dust out where the shaft leaves the housing.',
  },
  {
    id: 'flange',
    name: 'Bearing flange cover',
    group: 'covers',
    material: 'Cast iron',
    note: 'Closes the bore, holds the bearing outer race in place and carries the seal.',
  },
  {
    id: 'cap',
    name: 'Blind end cap',
    group: 'covers',
    material: 'Cast iron',
    note: 'Closes the far end of each bore, where no shaft comes through.',
  },
  {
    id: 'bolt',
    name: 'Cover bolt',
    group: 'fasteners',
    material: 'Steel, black oxide',
    note: 'Bolt circles clamp each cover and flange down onto its joint face.',
  },
  {
    id: 'fittings',
    name: 'Breather & sight glass',
    group: 'fittings',
    material: 'Steel & glass',
    note: 'The breather vents pressure as the oil warms; the sight glass shows the level without opening anything.',
  },
];

/** Facts about this model, read from the geometry it is built from. */
export const modelFacts = [
  { label: 'Reduction', value: '32:1', note: 'single-start worm, 32-tooth wheel' },
  { label: 'Centre distance', value: '65 mm', note: 'worm axis to wheel axis' },
  { label: 'Envelope', value: '260 × 240 × 260 mm', note: 'over feet and flanges' },
  { label: 'Output shaft', value: 'Ø24 mm', note: 'keyed, at right angles to the input' },
];

const bolts = (
  prefix: string,
  points: [number, number][],
  place: (u: number, v: number) => Vec3,
  rotation: Vec3,
  offset: Vec3,
  delay: number,
  geometry: GeometryKey = 'bolt',
): PartDef[] =>
  points.map(([u, v], i) => ({
    id: `${prefix}-${i + 1}`,
    bom: 'bolt',
    group: 'fasteners',
    geometry,
    material: 'fastener',
    position: place(u, v),
    rotation,
    explode: { offset, rotation: UNSCREW, delay: delay + i * 0.012, duration: 0.36 },
  }));

export const parts: PartDef[] = [
  {
    id: 'housing',
    bom: 'housing',
    group: 'housing',
    geometry: 'housing',
    material: 'housing',
    position: [0, 0, 0],
    explode: { offset: [0, 0, 0], delay: 0, duration: 1 },
  },
  {
    id: 'nameplate',
    bom: 'housing',
    group: 'housing',
    geometry: 'nameplate',
    material: 'cover',
    position: [0.32, 0.55, DIM.half + 0.005],
    explode: { offset: [0, 0, 0], delay: 0, duration: 1 },
  },

  /* ---- Top: inspection cover, its bolts and the breather lift off; then the worm wheel ---- */
  ...bolts('bolt-top', TOP_BOLTS, (x, z) => [x, DIM.bodyTop + 0.105, z], FACE.py, [0, 2.2, 0], 0),
  {
    id: 'breather',
    bom: 'fittings',
    group: 'fittings',
    geometry: 'breather',
    material: 'fastener',
    position: [0, DIM.bodyTop + 0.105, 0],
    rotation: FACE.py,
    explode: { offset: [0, 2.6, 0], delay: 0.02, duration: 0.38 },
  },
  {
    id: 'top-cover',
    bom: 'top-cover',
    group: 'covers',
    geometry: 'topCover',
    material: 'cover',
    position: [0, DIM.bodyTop + 0.075, 0],
    rotation: FACE.py,
    explode: { offset: [0, 1.75, 0], delay: 0.1, duration: 0.42 },
  },
  {
    id: 'worm-wheel',
    bom: 'worm-wheel',
    group: 'drivetrain',
    geometry: 'wormWheel',
    material: 'bronze',
    position: [0, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [0, 1.25, 0], delay: 0.46, duration: 0.46 },
    spin: 1,
  },

  /* ---- Output side (+X): bolts → seal → flange → bearing; blind cap and bearing on −X ---- */
  ...bolts('bolt-output', OUTPUT_BOLTS, (z, y) => [DIM.half + 0.1, OUT_Y + y, z], FACE.px, [2.4, 0, 0], 0.02),
  {
    id: 'seal-output',
    bom: 'seal',
    group: 'seals',
    geometry: 'sealOutput',
    material: 'seal',
    position: [DIM.half + 0.13, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [2.05, 0, 0], delay: 0.08, duration: 0.4 },
  },
  {
    id: 'flange-output',
    bom: 'flange',
    group: 'covers',
    geometry: 'outputFlange',
    material: 'cover',
    position: [DIM.half + 0.05, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [1.7, 0, 0], delay: 0.14, duration: 0.42 },
  },
  {
    id: 'bearing-output-front',
    bom: 'bearing-output',
    group: 'bearings',
    geometry: 'bearingOutput',
    material: 'bearing',
    position: [DIM.half - 0.21, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [1.2, 0, 0], delay: 0.3, duration: 0.42 },
  },
  ...bolts('bolt-cap-output', OUTPUT_BOLTS, (z, y) => [-DIM.half - 0.08, OUT_Y + y, z], FACE.nx, [-2.2, 0, 0], 0.04),
  {
    id: 'cap-output',
    bom: 'cap',
    group: 'covers',
    geometry: 'outputCap',
    material: 'cover',
    position: [-DIM.half - 0.04, OUT_Y, 0],
    rotation: FACE.nx,
    explode: { offset: [-1.6, 0, 0], delay: 0.16, duration: 0.42 },
  },
  {
    id: 'bearing-output-rear',
    bom: 'bearing-output',
    group: 'bearings',
    geometry: 'bearingOutput',
    material: 'bearing',
    position: [-DIM.half + 0.21, OUT_Y, 0],
    rotation: FACE.nx,
    explode: { offset: [-1.1, 0, 0], delay: 0.32, duration: 0.42 },
  },
  {
    id: 'shaft-output',
    bom: 'shaft-output',
    group: 'drivetrain',
    geometry: 'shaftOutput',
    material: 'shaft',
    position: [0, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [0.7, 0, 0], delay: 0.56, duration: 0.42 },
    spin: 1,
  },
  {
    id: 'key-output',
    bom: 'key',
    group: 'drivetrain',
    geometry: 'keyOutput',
    material: 'shaft',
    position: [0, OUT_Y, 0],
    rotation: FACE.px,
    explode: { offset: [0.7, 0.5, 0], delay: 0.62, duration: 0.36 },
    spin: 1,
  },

  /* ---- Input side (+Z): bolts → seal → flange → bearing; blind cap and bearing on −Z ---- */
  ...bolts('bolt-input', INPUT_BOLTS, (x, y) => [x, IN_Y + y, DIM.half + 0.1], FACE.pz, [0, 0, 2.3], 0.03, 'boltSmall'),
  {
    id: 'seal-input',
    bom: 'seal',
    group: 'seals',
    geometry: 'sealInput',
    material: 'seal',
    position: [0, IN_Y, DIM.half + 0.13],
    explode: { offset: [0, 0, 1.95], delay: 0.08, duration: 0.4 },
  },
  {
    id: 'flange-input',
    bom: 'flange',
    group: 'covers',
    geometry: 'inputFlange',
    material: 'cover',
    position: [0, IN_Y, DIM.half + 0.05],
    explode: { offset: [0, 0, 1.6], delay: 0.14, duration: 0.42 },
  },
  {
    id: 'bearing-input-front',
    bom: 'bearing-input',
    group: 'bearings',
    geometry: 'bearingInput',
    material: 'bearing',
    position: [0, IN_Y, DIM.half - 0.21],
    explode: { offset: [0, 0, 1.15], delay: 0.3, duration: 0.42 },
  },
  ...bolts(
    'bolt-cap-input',
    INPUT_BOLTS,
    (x, y) => [x, IN_Y + y, -DIM.half - 0.08],
    FACE.nz,
    [0, 0, -2.1],
    0.05,
    'boltSmall',
  ),
  {
    id: 'cap-input',
    bom: 'cap',
    group: 'covers',
    geometry: 'inputCap',
    material: 'cover',
    position: [0, IN_Y, -DIM.half - 0.04],
    rotation: FACE.nz,
    explode: { offset: [0, 0, -1.5], delay: 0.16, duration: 0.42 },
  },
  {
    id: 'bearing-input-rear',
    bom: 'bearing-input',
    group: 'bearings',
    geometry: 'bearingInput',
    material: 'bearing',
    position: [0, IN_Y, -DIM.half + 0.21],
    rotation: FACE.nz,
    explode: { offset: [0, 0, -1.05], delay: 0.32, duration: 0.42 },
  },
  {
    id: 'worm',
    bom: 'worm',
    group: 'drivetrain',
    geometry: 'worm',
    material: 'gear',
    position: [0, IN_Y, 0],
    explode: { offset: [0, -0.35, 0.55], delay: 0.58, duration: 0.4 },
    spin: DIM.wormSpin,
  },
  {
    id: 'shaft-input',
    bom: 'shaft-input',
    group: 'drivetrain',
    geometry: 'shaftInput',
    material: 'shaft',
    position: [0, IN_Y, 0],
    explode: { offset: [0, 0, 1.0], delay: 0.5, duration: 0.42 },
    spin: DIM.wormSpin,
  },
  {
    id: 'key-input',
    bom: 'key',
    group: 'drivetrain',
    geometry: 'keyInput',
    material: 'shaft',
    position: [0, IN_Y, 0],
    explode: { offset: [0, 0.4, 1.0], delay: 0.6, duration: 0.36 },
    spin: DIM.wormSpin,
  },

  /* ---- Oil sight glass on the input face ---- */
  {
    id: 'sight-glass',
    bom: 'fittings',
    group: 'fittings',
    geometry: 'sightGlass',
    material: 'glass',
    position: [-0.52, 0.42, DIM.half + 0.02],
    explode: { offset: [0, 0, 0.8], delay: 0.06, duration: 0.36 },
  },
];

/**
 * Exploded view spread. Parts separate along the same paths but stay close, so the exploded
 * assembly fills the same close-up frame as the assembled one instead of pulling the camera back.
 */
const EXPLODE_SPREAD = 0.55;
for (const p of parts) p.explode.offset = p.explode.offset.map((v) => v * EXPLODE_SPREAD) as Vec3;

export const bomQuantities: Record<string, number> = parts.reduce<Record<string, number>>((acc, p) => {
  acc[p.bom] = (acc[p.bom] ?? 0) + 1;
  return acc;
}, {});
// The nameplate is fixed to the housing: one housing line, not two.
bomQuantities.housing = 1;

/** Edge strength per group in the wireframe view: the gear train reads first, the casing recedes. */
export const WIRE_EDGE_WEIGHT: Partial<Record<PartGroup, number>> = {
  drivetrain: 1,
  bearings: 0.7,
  seals: 0.45,
  covers: 0.35,
  housing: 0.3,
  fittings: 0.25,
  fasteners: 0.15,
};

/** Solid fill kept in the wireframe view so the worm, wheel and shafts stay legible. */
export const WIRE_SOLID_BOOST: Partial<Record<PartGroup, number>> = {
  drivetrain: 0.32,
  bearings: 0.14,
};

/**
 * Groups drawn whole in the section view, as in a drafting section: shafts, gears and bearings
 * are not cut, so the worm and wheel show complete inside the cut housing.
 */
export const SECTION_UNCUT: PartGroup[] = ['drivetrain', 'bearings'];

/** Shaft centrelines shown in technical views. */
export const AXES: { from: Vec3; to: Vec3 }[] = [
  { from: [-2.6, OUT_Y, 0], to: [2.9, OUT_Y, 0] },
  { from: [0, IN_Y, -2.6], to: [0, IN_Y, 2.9] },
];

/* ---- Dimension annotations (values in mm, derived from DIM) ---- */
export interface DimensionSpec {
  from: Vec3;
  to: Vec3;
  /** Offset of the dimension line from the measured points. */
  offset: Vec3;
  label: string;
}

const ENV = { x: 1.3, bottom: -1.35, top: 1.05, z: 1.3 };

export const dimensionSets: Record<'envelope' | 'engineer', DimensionSpec[]> = {
  envelope: [
    { from: [-ENV.x, ENV.bottom, ENV.z], to: [ENV.x, ENV.bottom, ENV.z], offset: [0, -0.32, 0], label: '260' },
    { from: [ENV.x, ENV.bottom, ENV.z], to: [ENV.x, ENV.top, ENV.z], offset: [0.32, 0, 0], label: '240' },
    { from: [ENV.x, ENV.bottom, -ENV.z], to: [ENV.x, ENV.bottom, ENV.z], offset: [0.32, 0, 0], label: '260' },
  ],
  engineer: [
    {
      // Worm-to-wheel centre distance
      from: [-DIM.half, OUT_Y, DIM.half + 0.1],
      to: [-DIM.half, IN_Y, DIM.half + 0.1],
      offset: [-0.42, 0, 0],
      label: `a ${Math.round((OUT_Y - IN_Y) * 100)}`,
    },
    {
      from: [-DIM.half, DIM.bodyTop, DIM.half],
      to: [DIM.half, DIM.bodyTop, DIM.half],
      offset: [0, 0.4, 0],
      label: String(Math.round(DIM.half * 200)),
    },
    {
      from: [1.75, OUT_Y + 0.12, 0],
      to: [1.75, OUT_Y - 0.12, 0],
      offset: [0, 0, 0.45],
      label: 'Ø24',
    },
  ],
};

export const ENVELOPE_BOX = ENV;
