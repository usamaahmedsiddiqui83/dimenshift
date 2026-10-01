import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onFrame` (at most once per animation frame) while the page scrolls or
 * resizes. The callback receives the element's rect; keep it cheap and avoid
 * setting React state on every call.
 */
export function useScrollFrame(
  ref: RefObject<HTMLElement | null>,
  onFrame: (rect: DOMRect, viewportHeight: number) => void,
  enabled = true,
) {
  const callback = useRef(onFrame);
  callback.current = onFrame;

  useEffect(() => {
    if (!enabled) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (el) callback.current(el.getBoundingClientRect(), window.innerHeight);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
}
