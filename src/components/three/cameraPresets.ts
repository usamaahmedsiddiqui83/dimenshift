import type { CameraPresetKey } from './visualState';
import type { Vec3 } from './wormAssembly';

export interface CameraPreset {
  position: Vec3;
  target: Vec3;
  fov: number;
}

/** Restrained, engineering-review camera positions. Transitions are damped, never cut. */
export const cameraPresets: Record<CameraPresetKey, CameraPreset> = {
  hero: { position: [5.4, 3.0, 6.6], target: [0, -0.25, 0.15], fov: 30 },
  iso: { position: [5.8, 3.5, 6.4], target: [0, -0.25, 0], fov: 30 },
  // Exploded view: the same close-up angle as iso, lifted to frame the parts as they separate.
  wide: { position: [6.5, 4.6, 7.1], target: [0.2, 0.55, 0.2], fov: 30 },
  section: { position: [7.4, 1.9, 3.1], target: [0, -0.3, 0.05], fov: 30 },
  front: { position: [0, -0.2, 13], target: [0, -0.2, 0], fov: 22 },
  product: { position: [6.6, 2.0, 8.2], target: [0, -0.3, 0], fov: 28 },
};

/** Pulls the camera back on narrow/portrait viewports so the assembly always fits. */
export function aspectFit(aspect: number) {
  const reference = 1.15;
  return aspect >= reference ? 1 : Math.pow(reference / aspect, 0.85);
}
