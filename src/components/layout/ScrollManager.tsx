import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Re-alignment checkpoints (ms) after arriving on a page with a hash. Sections above the
 * target (CAD visuals, background film, web fonts) can change height as they render, which
 * would otherwise leave the visitor short of the section they asked for.
 */
const CHECKPOINTS = [0, 60, 150, 300, 600, 1000, 1600];

/** Scrolls to hash targets (including after cross-page navigation) and resets scroll on page change. */
export function ScrollManager() {
  const { pathname, hash, key } = useLocation();
  const previousPath = useRef(pathname);

  useEffect(() => {
    const pageChanged = previousPath.current !== pathname;
    previousPath.current = pathname;

    if (!hash) {
      if (pageChanged) {
        window.scrollTo(0, 0);
        document.getElementById('main')?.focus({ preventScroll: true });
      }
      return;
    }

    const id = decodeURIComponent(hash.slice(1));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    let lastTop = Number.NaN;
    let done = false;

    // Once the visitor scrolls themselves, stop moving the page under them.
    const release = () => {
      done = true;
    };

    const align = (checkpoint: number) => {
      if (done) return;
      const target = document.getElementById(id);
      if (!target) return;
      const top = Math.round(target.getBoundingClientRect().top);
      // Already in place and stable: nothing left to correct.
      if (checkpoint > 0 && top === lastTop) {
        done = true;
        return;
      }
      lastTop = top;
      target.scrollIntoView({
        behavior: reduced || pageChanged ? 'auto' : 'smooth',
        block: 'start',
      });
      // Tell the in-view checkers the page moved, so the section we landed on shows its content
      // even if the browser is slow to report the jump itself.
      window.dispatchEvent(new Event('scroll'));
      // A same-page jump happens on a settled layout, so one scroll is enough.
      if (!pageChanged) done = true;
    };

    for (const delay of CHECKPOINTS) {
      timers.push(window.setTimeout(() => align(delay), delay));
    }

    window.addEventListener('wheel', release, { passive: true });
    window.addEventListener('touchstart', release, { passive: true });
    window.addEventListener('keydown', release);

    return () => {
      done = true;
      timers.forEach(clearTimeout);
      window.removeEventListener('wheel', release);
      window.removeEventListener('touchstart', release);
      window.removeEventListener('keydown', release);
    };
  }, [pathname, hash, key]);

  return null;
}
