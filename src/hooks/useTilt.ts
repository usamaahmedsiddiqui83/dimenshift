import { useEffect, type RefObject } from 'react';
import { media } from '../config/motion';
import { useMediaQuery, useReducedMotion } from './useMediaQuery';

/**
 * Tilts an element toward the mouse and exposes the pointer position for a glare highlight,
 * through the CSS variables --tilt-x, --tilt-y, --glare-x and --glare-y (see `.tilt-card`).
 * Mouse only; skipped for touch devices and for visitors who prefer reduced motion.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, maxDegrees = 4) {
  const finePointer = useMediaQuery(media.finePointer);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer || reducedMotion) return;

    let raf = 0;
    let rx = 0;
    let ry = 0;
    let gx = 50;
    let gy = 50;

    const apply = () => {
      raf = 0;
      el.style.setProperty('--tilt-x', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--tilt-y', `${ry.toFixed(2)}deg`);
      el.style.setProperty('--glare-x', `${gx}%`);
      el.style.setProperty('--glare-y', `${gy}%`);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') el.dataset.tilting = 'true';
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * 2 * maxDegrees;
      rx = (0.5 - py) * 2 * maxDegrees;
      gx = Math.round(px * 100);
      gy = Math.round(py * 100);
      schedule();
    };
    const onLeave = () => {
      el.dataset.tilting = 'false';
      rx = 0;
      ry = 0;
      schedule();
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      for (const name of ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y']) el.style.removeProperty(name);
      delete el.dataset.tilting;
    };
  }, [ref, finePointer, reducedMotion, maxDegrees]);
}
