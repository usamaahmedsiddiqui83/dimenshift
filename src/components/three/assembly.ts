/**
 * Parallel-shaft gear reducer — component data.
 *
 * Scene units: 1 unit = 100 mm. Shaft axes run along Z; the output shaft exits the
 * front (+Z), the input shaft exits the rear (−Z). Explosion offsets follow each
 * part's real assembly axis: cover-side parts along Z, mounting parts along Y.
 *
 * To swap in a production GLB later, keep these ids and map GLB node names to them;
 * the animation system only depends on the transforms below.
 */

export type Vec3 = [number, number, number];

export type PartGroup = 'housing' | 'covers' | 'drivetrain' | 'bearings' | 'seals' | 'fasteners' | 'mounting';

export type GeometryKey =
  | 'housing'
  | 'coverFront'
  | 'coverRear'
  | 'gasket'
  | 'gearOutput'
  | 'pinion'
  | 'shaftOutput'
  | 'shaftInput'
  | 'bearingOutput'
  | 'bearingInput'
  | 'spacerOutput'
  | 'spacerInput'
  | 'sealOutput'
  | 'sealInput'
  | 'bolt'
  | 'basePlate'
  | 'key';

export type MaterialKey =
  | 'housing'
  | 'cover'
  | 'shaft'
  | 'gear'
  | 'bearing'
  | 'fastener'
  | 'seal'
  | 'gasket'
  | 'spacer'
  | 'plate';

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
}

/* ---- Key dimensions shared with geometry builders ---- */
export const DIM = {
  housingHalfWidth: 1.1,
  housingTop: 1.1,
  housingBottom: -1.45,
  housingWall: 0.18,
  housingDepth: 1.1,
  outputShaftY: -0.53,
  inputShaftY: 0.42,
  gearModule: 0.05,
  gearTeeth: 26,
  pinionTeeth: 12,
} as const;

export const COVER_BOLTS: [number, number][] = [
  [-0.98, 0.98],
  [0.98, 0.98],
  [0.98, -1.33],
  [-0.98, -1.33],
];

export const FOOT_BOLTS: [number, number][] = [
  [-1.3, -0.3],
  [-1.3, 0.3],
  [1.3, -0.3],
  [1.3, 0.3],
];

const RATIO = -DIM.gearTeeth / DIM.pinionTeeth;
const OUT: Vec3 = [0, DIM.outputShaftY, 0];
const IN: Vec3 = [0, DIM.inputShaftY, 0];
const at = (base: Vec3, z: number): Vec3 => [base[0], base[1], z];
const UNSCREW: Vec3 = [0, 0, -Math.PI * 6];

export const bom: BomItem[] = [
  { id: 'housing', name: 'Gearbox housing', group: 'housing' },
  { id: 'cover-front', name: 'Front cover', group: 'covers' },
  { id: 'cover-rear', name: 'Rear cover', group: 'covers' },
  { id: 'gasket', name: 'Cover gasket', group: 'seals' },
  { id: 'gear-output', name: 'Output gear, 26T', group: 'drivetrain' },
  { id: 'pinion', name: 'Input pinion, 12T', group: 'drivetrain' },
  { id: 'shaft-output', name: 'Output shaft', group: 'drivetrain' },
  { id: 'shaft-input', name: 'Input shaft', group: 'drivetrain' },
  { id: 'key', name: 'Parallel key', group: 'drivetrain' },
  { id: 'bearing', name: 'Deep-groove ball bearing', group: 'bearings' },
  { id: 'spacer', name: 'Bearing spacer', group: 'bearings' },
  { id: 'seal', name: 'Radial shaft seal', group: 'seals' },
  { id: 'bolt-cover', name: 'Cover bolt', group: 'fasteners' },
  { id: 'base-plate', name: 'Mounting base plate', group: 'mounting' },
  { id: 'bolt-foot', name: 'Foot bolt', group: 'fasteners' },
];

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

  /* ---- Front (output) side, removal order: bolts → seal → cover → gasket → bearings → spacers → gear ---- */
  ...COVER_BOLTS.map(
    ([x, y], i): PartDef => ({
      id: `bolt-front-${i + 1}`,
      bom: 'bolt-cover',
      group: 'fasteners',
      geometry: 'bolt',
      material: 'fastener',
      position: [x, y, 0.67],
      explode: { offset: [0, 0, 2.6], rotation: UNSCREW, delay: i * 0.02, duration: 0.38 },
    }),
  ),
  {
    id: 'seal-output',
    bom: 'seal',
    group: 'seals',
    geometry: 'sealOutput',
    material: 'seal',
    position: at(OUT, 0.7),
    explode: { offset: [0, 0, 2.2], delay: 0.08, duration: 0.42 },
  },
  {
    id: 'cover-front',
    bom: 'cover-front',
    group: 'covers',
    geometry: 'coverFront',
    material: 'cover',
    position: [0, 0, 0.62],
    explode: { offset: [0, 0, 1.85], delay: 0.12, duration: 0.42 },
  },
  {
    id: 'gasket-front',
    bom: 'gasket',
    group: 'seals',
    geometry: 'gasket',
    material: 'gasket',
    position: [0, 0, 0.56],
    explode: { offset: [0, 0, 1.45], delay: 0.22, duration: 0.42 },
  },
  {
    id: 'bearing-output-front',
    bom: 'bearing',
    group: 'bearings',
    geometry: 'bearingOutput',
    material: 'bearing',
    position: at(OUT, 0.5),
    explode: { offset: [0, 0, 1.1], delay: 0.3, duration: 0.42 },
  },
  {
    id: 'bearing-input-front',
    bom: 'bearing',
    group: 'bearings',
    geometry: 'bearingInput',
    material: 'bearing',
    position: at(IN, 0.5),
    explode: { offset: [0, 0, 1.1], delay: 0.3, duration: 0.42 },
  },
  {
    id: 'spacer-output-front',
    bom: 'spacer',
    group: 'bearings',
    geometry: 'spacerOutput',
    material: 'spacer',
    position: at(OUT, 0.295),
    explode: { offset: [0, 0, 0.8], delay: 0.38, duration: 0.42 },
    spin: 1,
  },
  {
    id: 'spacer-input-front',
    bom: 'spacer',
    group: 'bearings',
    geometry: 'spacerInput',
    material: 'spacer',
    position: at(IN, 0.305),
    explode: { offset: [0, 0, 0.8], delay: 0.38, duration: 0.42 },
    spin: RATIO,
  },
  {
    id: 'gear-output',
    bom: 'gear-output',
    group: 'drivetrain',
    geometry: 'gearOutput',
    material: 'gear',
    position: OUT,
    explode: { offset: [0, 0, 0.6], delay: 0.45, duration: 0.45 },
    spin: 1,
  },
  {
    id: 'key',
    bom: 'key',
    group: 'drivetrain',
    geometry: 'key',
    material: 'shaft',
    position: OUT,
    explode: { offset: [0, 0.55, 0.6], delay: 0.55, duration: 0.45 },
  },

  /* ---- Shafts define the axes and stay on datum ---- */
  {
    id: 'shaft-output',
    bom: 'shaft-output',
    group: 'drivetrain',
    geometry: 'shaftOutput',
    material: 'shaft',
    position: OUT,
    explode: { offset: [0, 0, 0], delay: 0, duration: 1 },
    spin: 1,
  },
  {
    id: 'shaft-input',
    bom: 'shaft-input',
    group: 'drivetrain',
    geometry: 'shaftInput',
    material: 'shaft',
    position: IN,
    explode: { offset: [0, 0, 0], delay: 0, duration: 1 },
    spin: RATIO,
  },

  /* ---- Rear (input) side ---- */
  ...COVER_BOLTS.map(
    ([x, y], i): PartDef => ({
      id: `bolt-rear-${i + 1}`,
      bom: 'bolt-cover',
      group: 'fasteners',
      geometry: 'bolt',
      material: 'fastener',
      position: [x, y, -0.67],
      rotation: [0, Math.PI, 0],
      explode: { offset: [0, 0, -2.6], rotation: UNSCREW, delay: 0.02 + i * 0.02, duration: 0.38 },
    }),
  ),
  {
    id: 'seal-input',
    bom: 'seal',
    group: 'seals',
    geometry: 'sealInput',
    material: 'seal',
    position: at(IN, -0.7),
    explode: { offset: [0, 0, -2.2], delay: 0.08, duration: 0.42 },
  },
  {
    id: 'cover-rear',
    bom: 'cover-rear',
    group: 'covers',
    geometry: 'coverRear',
    material: 'cover',
    position: [0, 0, -0.62],
    rotation: [0, Math.PI, 0],
    explode: { offset: [0, 0, -1.85], delay: 0.12, duration: 0.42 },
  },
  {
    id: 'gasket-rear',
    bom: 'gasket',
    group: 'seals',
    geometry: 'gasket',
    material: 'gasket',
    position: [0, 0, -0.56],
    explode: { offset: [0, 0, -1.45], delay: 0.22, duration: 0.42 },
  },
  {
    id: 'bearing-output-rear',
    bom: 'bearing',
    group: 'bearings',
    geometry: 'bearingOutput',
    material: 'bearing',
    position: at(OUT, -0.5),
    explode: { offset: [0, 0, -1.1], delay: 0.3, duration: 0.42 },
  },
  {
    id: 'bearing-input-rear',
    bom: 'bearing',
    group: 'bearings',
    geometry: 'bearingInput',
    material: 'bearing',
    position: at(IN, -0.5),
    explode: { offset: [0, 0, -1.1], delay: 0.3, duration: 0.42 },
  },
  {
    id: 'spacer-output-rear',
    bom: 'spacer',
    group: 'bearings',
    geometry: 'spacerOutput',
    material: 'spacer',
    position: at(OUT, -0.295),
    explode: { offset: [0, 0, -0.8], delay: 0.38, duration: 0.42 },
    spin: 1,
  },
  {
    id: 'spacer-input-rear',
    bom: 'spacer',
    group: 'bearings',
    geometry: 'spacerInput',
    material: 'spacer',
    position: at(IN, -0.305),
    explode: { offset: [0, 0, -0.8], delay: 0.38, duration: 0.42 },
    spin: RATIO,
  },
  {
    id: 'pinion',
    bom: 'pinion',
    group: 'drivetrain',
    geometry: 'pinion',
    material: 'gear',
    position: IN,
    explode: { offset: [0, 0, -0.6], delay: 0.45, duration: 0.45 },
    spin: RATIO,
  },

  /* ---- Mounting: separates along Y ---- */
  {
    id: 'base-plate',
    bom: 'base-plate',
    group: 'mounting',
    geometry: 'basePlate',
    material: 'plate',
    position: [0, -1.5, 0],
    explode: { offset: [0, -0.8, 0], delay: 0.1, duration: 0.45 },
  },
  ...FOOT_BOLTS.map(
    ([x, z], i): PartDef => ({
      id: `bolt-foot-${i + 1}`,
      bom: 'bolt-foot',
      group: 'fasteners',
      geometry: 'bolt',
      material: 'fastener',
      position: [x, -1.3, z],
      rotation: [-Math.PI / 2, 0, 0],
      explode: { offset: [0, 1.4, 0], rotation: UNSCREW, delay: i * 0.015, duration: 0.38 },
    }),
  ),
];

export const bomQuantities: Record<string, number> = parts.reduce<Record<string, number>>((acc, p) => {
  acc[p.bom] = (acc[p.bom] ?? 0) + 1;
  return acc;
}, {});

/* ---- Dimension annotations (values in mm, derived from DIM) ---- */
export interface DimensionSpec {
  from: Vec3;
  to: Vec3;
  /** Offset of the dimension line from the measured points. */
  offset: Vec3;
  label: string;
}

const ENV = { x: 1.65, bottom: -1.55, top: 1.15, z: 0.8 };

export const dimensionSets: Record<'envelope' | 'engineer', DimensionSpec[]> = {
  envelope: [
    { from: [-ENV.x, ENV.bottom, ENV.z], to: [ENV.x, ENV.bottom, ENV.z], offset: [0, -0.32, 0], label: '330' },
    { from: [ENV.x, ENV.bottom, ENV.z], to: [ENV.x, ENV.top, ENV.z], offset: [0.32, 0, 0], label: '270' },
    { from: [ENV.x, ENV.bottom, -ENV.z], to: [ENV.x, ENV.bottom, ENV.z], offset: [0.32, 0, 0], label: '160' },
  ],
  engineer: [
    {
      from: [-DIM.housingHalfWidth, DIM.inputShaftY, 0.7],
      to: [-DIM.housingHalfWidth, DIM.outputShaftY, 0.7],
      offset: [-0.42, 0, 0],
      label: String(Math.round((DIM.inputShaftY - DIM.outputShaftY) * 100)),
    },
    {
      from: [-DIM.housingHalfWidth, DIM.housingTop, 0.55],
      to: [DIM.housingHalfWidth, DIM.housingTop, 0.55],
      offset: [0, 0.34, 0],
      label: String(Math.round(DIM.housingHalfWidth * 200)),
    },
    {
      from: [-0.1, DIM.outputShaftY, 1.3],
      to: [0.1, DIM.outputShaftY, 1.3],
      offset: [0, -0.4, 0],
      label: 'Ø20',
    },
  ],
};

export const ENVELOPE_BOX = ENV;
