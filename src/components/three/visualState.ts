/**
 * VisualState is the single contract between page sections and the 3D scene.
 * Sections describe *what the product should look like*; the scene damps toward it
 * every frame. All fields are numeric so any two states can be interpolated.
 */

export type CameraPresetKey = 'hero' | 'iso' | 'wide' | 'section' | 'front' | 'product';
export type DimensionSetKey = 'envelope' | 'engineer';
export type HighlightKey = string | null; // part id or group id

export interface VisualState {
  /** 0 assembled → 1 fully exploded (per-part delays applied in the scene). */
  explode: number;
  /** 0 shaded → 1 technical (solids ghosted, edges drawn). */
  wire: number;
  /** 0 CAD-default grey → 1 finished production materials. */
  finish: number;
  /** 0 no cut → 1 half-section along the assembly's XZ midplane. */
  section: number;
  /** 0 detailed parts → 1 concept envelope only. */
  concept: number;
  /** Envelope bounding-box edges (requirements stage). */
  envelopeWire: number;
  /** Drawing-sheet look: edges shift from datum cyan to drawing white. */
  drawing: number;
  /** Assembly axis centerlines. */
  axes: number;
  /** Ground contact shadow. */
  shadow: number;
  /** Idle turntable speed (rad/s). */
  turntable: number;
  /** Drive rotation speed of the gear train (rad/s at the output shaft). */
  drive: number;
  dims: Record<DimensionSetKey, number>;
  highlight: HighlightKey;
  camera: CameraPresetKey;
}

export const baseState: VisualState = {
  explode: 0,
  wire: 0,
  finish: 1,
  section: 0,
  concept: 0,
  envelopeWire: 0,
  drawing: 0,
  axes: 0,
  shadow: 1,
  turntable: 0,
  drive: 0.35,
  dims: { envelope: 0, engineer: 0 },
  highlight: null,
  camera: 'hero',
};

export function defineState(partial: Partial<VisualState>): VisualState {
  return {
    ...baseState,
    ...partial,
    dims: { ...baseState.dims, ...partial.dims },
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/**
 * Interpolates numeric fields. Discrete fields (camera, highlight) switch at the
 * midpoint; the scene separately blends camera presets using `cameraMix`.
 */
export function mixStates(a: VisualState, b: VisualState, t: number): MixedState {
  const k = clamp01(t);
  return {
    explode: lerp(a.explode, b.explode, k),
    wire: lerp(a.wire, b.wire, k),
    finish: lerp(a.finish, b.finish, k),
    section: lerp(a.section, b.section, k),
    concept: lerp(a.concept, b.concept, k),
    envelopeWire: lerp(a.envelopeWire, b.envelopeWire, k),
    drawing: lerp(a.drawing, b.drawing, k),
    axes: lerp(a.axes, b.axes, k),
    shadow: lerp(a.shadow, b.shadow, k),
    turntable: lerp(a.turntable, b.turntable, k),
    drive: lerp(a.drive, b.drive, k),
    dims: {
      envelope: lerp(a.dims.envelope, b.dims.envelope, k),
      engineer: lerp(a.dims.engineer, b.dims.engineer, k),
    },
    highlight: k < 0.5 ? a.highlight : b.highlight,
    highlightAmount: a.highlight === b.highlight ? 1 : Math.abs(k - 0.5) * 2,
    camera: a.camera,
    cameraTo: b.camera,
    cameraMix: k,
  };
}

export interface MixedState extends Omit<VisualState, 'camera'> {
  highlightAmount: number;
  camera: CameraPresetKey;
  cameraTo: CameraPresetKey;
  cameraMix: number;
}

export function toMixed(s: VisualState): MixedState {
  return mixStates(s, s, 0);
}

/** Vertical drag on the 3D viewer stops at a view straight down onto the top or up at the underside. */
export const PITCH_LIMIT = Math.PI / 2;
