import { useEffect, useState } from 'react';

/**
 * The section a reader is currently in: the last one whose start has passed a line near the top of
 * the viewport. Used to mark the place in a long document's contents list.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(() => ids[0] ?? '');

  useEffect(() => {
    if (ids.length === 0) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.3;
      let current = ids[0];
      for (const id of ids) {
        const el = window.document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // The last section can be shorter than the band, so the foot of the page always marks it.
      const atBottom = window.innerHeight + window.scrollY >= window.document.body.scrollHeight - 12;
      setActive(atBottom ? ids[ids.length - 1] : current);
    };

    const schedule = () => {
      if (frame) return;
      // A hidden or throttled tab freezes animation frames, so fall back to a timer there.
      frame = document.hidden ? window.setTimeout(measure, 0) : window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(frame);
      }
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ids]);

  return active;
}
