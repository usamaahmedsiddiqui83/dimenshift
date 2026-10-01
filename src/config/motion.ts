/** Breakpoints mirror Tailwind's defaults (px). */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const media = {
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  /** Mirrors the `short` CSS variant: phones held sideways. */
  short: '(orientation: landscape) and (max-height: 540px)',
  /** Mirrors the `split` CSS variant: side-by-side layouts. */
  split: `(min-width: ${breakpoints.lg}px), (min-width: ${breakpoints.sm}px) and (orientation: landscape) and (max-height: 540px)`,
  reducedMotion: '(prefers-reduced-motion: reduce)',
  finePointer: '(hover: hover) and (pointer: fine)',
} as const;

export const motion = {
  /** Frame-rate independent damping (higher = snappier) used by the 3D scene. */
  sceneDamping: 3.2,
  cameraDamping: 2.4,
  pointerParallax: 0.06,
  revealRootMargin: '0px 0px -12% 0px',
  /** Distance before a lazy 3D canvas starts loading. */
  canvasPreloadMargin: '75% 0px',
} as const;
