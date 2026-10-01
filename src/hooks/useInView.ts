import { useEffect, useState, type RefObject } from 'react';

interface Options {
  rootMargin?: string;
  threshold?: number;
  /** Stay true after the first intersection. */
  once?: boolean;
}

/**
 * Backstop for IntersectionObserver. Browsers deliver its callbacks lazily, and can skip them while
 * a tab is throttled or a client-side navigation is scrolling the page, which would leave a section
 * rendered but invisible until a reload. These checkers measure the element directly at the moments
 * where that happens, so anything on screen always shows.
 */
const checkers = new Set<() => void>();
let scheduled = false;
let listening = false;

function runCheckers() {
  scheduled = false;
  for (const check of [...checkers]) check();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  // A hidden tab freezes requestAnimationFrame, and that is exactly when callbacks go missing.
  if (document.hidden) window.setTimeout(runCheckers, 0);
  else window.requestAnimationFrame(runCheckers);
}

function listen() {
  if (listening) return;
  listening = true;
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', schedule);
}

/** Parses a rootMargin string into pixels, resolving percentages against the viewport. */
function margins(rootMargin: string) {
  const parts = rootMargin.trim().split(/\s+/);
  const [top, right = top, bottom = top, left = right] = parts;
  const px = (value: string, size: number) =>
    value.endsWith('%') ? (parseFloat(value) / 100) * size : parseFloat(value) || 0;
  return {
    top: px(top, window.innerHeight),
    right: px(right, window.innerWidth),
    bottom: px(bottom, window.innerHeight),
    left: px(left, window.innerWidth),
  };
}

function intersects(el: Element, rootMargin: string) {
  const r = el.getBoundingClientRect();
  const m = margins(rootMargin);
  return (
    r.bottom > -m.top &&
    r.top < window.innerHeight + m.bottom &&
    r.right > -m.left &&
    r.left < window.innerWidth + m.right
  );
}

export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', threshold = 0, once = false }: Options = {},
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    let checker: (() => void) | null = null;
    const stopChecking = () => {
      if (checker) checkers.delete(checker);
      checker = null;
    };

    const settle = (visible: boolean) => {
      setInView((current) => (once ? current || visible : visible));
      if (visible && once) {
        observer.disconnect();
        stopChecking();
      }
    };

    const observer = new IntersectionObserver(([entry]) => settle(entry.isIntersecting), { rootMargin, threshold });
    observer.observe(el);

    // A threshold asks for a fraction of the element; only the plain case can be measured this way.
    if (threshold > 0) {
      return () => observer.disconnect();
    }

    checker = () => settle(intersects(el, rootMargin));
    checkers.add(checker);
    listen();
    checker();
    // Sections above can still change height (fonts, images, the 3D canvas) without a scroll.
    const timers = [120, 400, 1200, 2500].map((delay) => window.setTimeout(() => checker?.(), delay));

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      stopChecking();
    };
  }, [ref, rootMargin, threshold, once]);

  return inView;
}
