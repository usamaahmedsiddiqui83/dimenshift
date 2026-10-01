import { useEffect, type RefObject } from 'react';

/**
 * Loads a section's lazy images as soon as the section itself is in view.
 *
 * `loading="lazy"` leaves the decision to the browser, which defers it while a tab is throttled and
 * can miss images that a client-side navigation scrolls into place, leaving a section visibly empty
 * until a reload. Once we know the section is on screen the images are wanted, so ask for them
 * directly, at low priority so they never compete with what is already rendering.
 */
export function useEagerImages(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;
    const nudge = () => {
      for (const img of el.querySelectorAll<HTMLImageElement>('img[loading="lazy"]')) {
        if (img.complete && img.naturalWidth > 0) continue;
        img.fetchPriority = 'low';
        img.loading = 'eager';
      }
    };
    nudge();
    // Slides added or swapped just after the section appears get the same treatment.
    const timer = window.setTimeout(nudge, 700);
    return () => clearTimeout(timer);
  }, [ref, active]);
}
