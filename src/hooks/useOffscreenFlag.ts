import { useEffect, type RefObject } from 'react';

/**
 * Marks the element with `data-offscreen="true"` while it is out of view, so its CSS can pause
 * looping animations that would otherwise keep the GPU busy for something nobody can see.
 */
export function useOffscreenFlag(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      el.dataset.offscreen = String(!entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}
