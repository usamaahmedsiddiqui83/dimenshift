import * as THREE from 'three';
import type { MaterialKey } from './wormAssembly';

/** 3D palette — mirrors the CSS tokens in styles/index.css. */
export const scenePalette = {
  datum: '#82b2ff',
  drawing: '#e6ebf0',
  // Cut faces in the section view: machined steel, so the cut reads without hiding the parts.
  cap: '#c3c9d1',
  clay: '#bdb7ae',
  ghost: '#0b1738',
  axis: '#8a97ad',
} as const;

/** Annotation palette for canvases placed on light surfaces. */
export const scenePaletteLight = {
  ...scenePalette,
  datum: '#1f5bd8',
  drawing: '#0b1b3f',
  ghost: '#edf2fa',
  axis: '#6b7794',
} as const;

interface Finish {
  color: string;
  metalness: number;
  roughness: number;
}

/**
 * Material language: the CAD state is a neutral, low-contrast grey (how parts look
 * in modeling software); the finished state reads as real manufactured materials.
 * Blue anodized spacers carry the brand accent; the worm wheel is bronze, as in a real reducer.
 */
export const materialSpecs: Record<MaterialKey, { cad: string; finished: Finish }> = {
  // Cast-iron housing and covers, like the worm-gear reducer this models.
  housing: { cad: '#8f969e', finished: { color: '#5b6066', metalness: 0.62, roughness: 0.58 } },
  cover: { cad: '#a7adb4', finished: { color: '#6f757c', metalness: 0.7, roughness: 0.48 } },
  bronze: { cad: '#b3b9c0', finished: { color: '#b07a45', metalness: 1, roughness: 0.32 } },
  glass: { cad: '#9aa1a9', finished: { color: '#9fc3e6', metalness: 0.2, roughness: 0.08 } },
  shaft: { cad: '#b3b9c0', finished: { color: '#cfd4da', metalness: 1, roughness: 0.2 } },
  gear: { cad: '#b3b9c0', finished: { color: '#8d949c', metalness: 1, roughness: 0.3 } },
  bearing: { cad: '#b3b9c0', finished: { color: '#dde1e6', metalness: 1, roughness: 0.14 } },
  fastener: { cad: '#9aa1a9', finished: { color: '#1b1c1f', metalness: 0.75, roughness: 0.45 } },
  seal: { cad: '#9aa1a9', finished: { color: '#151618', metalness: 0, roughness: 0.78 } },
  gasket: { cad: '#9aa1a9', finished: { color: '#343a48', metalness: 0, roughness: 0.9 } },
  spacer: { cad: '#b3b9c0', finished: { color: '#2a62dc', metalness: 1, roughness: 0.32 } },
  plate: { cad: '#8f969e', finished: { color: '#27304d', metalness: 0.45, roughness: 0.55 } },
};

const CAD_METALNESS = 0.08;
const CAD_ROUGHNESS = 0.62;

export interface PartMaterialData {
  cad: THREE.Color;
  finished: THREE.Color;
  metalness: number;
  roughness: number;
  cap: { value: number };
}

/**
 * Standard material with a "section cap": when a clipping plane cuts the part, its
 * back faces are shaded as a flat cap color so the cut reads as solid material. Outside the
 * section view back faces are discarded, so overlapping faces never flicker.
 */
export function createPartMaterial(key: MaterialKey, clippingPlanes: THREE.Plane[]) {
  const spec = materialSpecs[key];
  const material = new THREE.MeshStandardMaterial({
    color: spec.finished.color,
    metalness: spec.finished.metalness,
    roughness: spec.finished.roughness,
    side: THREE.DoubleSide,
    clippingPlanes,
  });
  const data: PartMaterialData = {
    cad: new THREE.Color(spec.cad),
    finished: new THREE.Color(spec.finished.color),
    metalness: spec.finished.metalness,
    roughness: spec.finished.roughness,
    cap: { value: 0 },
  };
  const capColor = new THREE.Color(scenePalette.cap);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCap = data.cap;
    shader.uniforms.uCapColor = { value: capColor };
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uCap;\nuniform vec3 uCapColor;\nvoid main() {')
      .replace(
        '#include <dithering_fragment>',
        '#include <dithering_fragment>\n if (!gl_FrontFacing) { if (uCap < 0.5) discard; gl_FragColor.rgb = uCapColor; }',
      );
  };
  // All part materials share one shader variant.
  material.customProgramCacheKey = () => 'part-cap';
  return { material, data };
}

export { CAD_METALNESS, CAD_ROUGHNESS };
