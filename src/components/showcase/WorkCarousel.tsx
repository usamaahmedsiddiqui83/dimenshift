import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';

/** Seconds each card takes to drift past while the strip runs on its own. */
const SECONDS_PER_CARD = 14;
/** Fewer items than this cannot fill a looping strip; they sit in a still row that can be browsed. */
const MIN_LOOP = 3;
/** Cards per looping set: enough to span the widest strip, so the loop never shows a gap. */
const SET_SIZE = 6;
/** Pointer travel before a press becomes a drag (so taps still open cards). */
const DRAG_THRESHOLD = 6;

export interface CarouselItem {
  id: string;
  title: string;
  short: string;
}

interface Props<T extends CarouselItem> {
  items: T[];
  renderCard: (item: T) => ReactNode;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

function Arrow({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d={dir === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * The Work section's carousel. On its own it drifts slowly, one card after another, in a seamless
 * loop. The moment a visitor wants something else they are in control: the numbered index jumps
 * straight to any work, the arrows (or ←/→ keys) step one card, and the strip can be dragged or
 * swiped. Once they take over, the drift stays stopped until they leave the section, so it never
 * pulls a card away mid-read. It also waits while a card is hovered or focused, stays still for
 * visitors who prefer reduced motion, and sleeps while off screen.
 */
export function WorkCarousel<T extends CarouselItem>({ items, renderCard, label }: Props<T>) {
  const reducedMotion = useReducedMotion();
  const n = items.length;
  const looping = n >= MIN_LOOP;
  const loop = looping ? Array.from({ length: Math.ceil(SET_SIZE / n) }, () => items).flat() : items;
  const copies = looping ? 2 : 1;

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);
  const [announcement, setAnnouncement] = useState('');

  // Animation state lives in a ref: it changes every frame and must not re-render React.
  const s = useRef({
    offset: 0,
    target: null as number | null,
    step: 0,
    span: 0, // looping: width of one set; still row: furthest offset
    hover: false,
    focus: false,
    visible: false,
    userControl: false,
    drag: null as null | { id: number; x: number; y: number; start: number; moved: boolean; lastX: number; lastT: number; v: number },
    suppressClick: false,
    raf: 0,
    last: 0,
    active: 0,
  });

  const measure = useCallback(() => {
    const st = s.current;
    const track = trackRef.current;
    const viewport = viewportRef.current;
    const first = track?.querySelector<HTMLElement>('[data-slide]');
    if (!track || !viewport || !first) return;
    const oldStep = st.step;
    st.step = first.offsetWidth;
    st.span = looping ? st.step * loop.length : Math.max(0, track.scrollWidth - viewport.clientWidth);
    if (oldStep && oldStep !== st.step) {
      // Keep the same card in place across a resize.
      st.offset = Math.round(st.offset / oldStep) * st.step;
      st.target = null;
    }
  }, [looping, loop.length]);

  const normalise = useCallback(() => {
    const st = s.current;
    if (looping) {
      if (!st.span) return;
      while (st.offset >= st.span) {
        st.offset -= st.span;
        if (st.target !== null) st.target -= st.span;
      }
      while (st.offset < 0) {
        st.offset += st.span;
        if (st.target !== null) st.target += st.span;
      }
    } else {
      st.offset = Math.min(st.span, Math.max(0, st.offset));
      if (st.target !== null) st.target = Math.min(st.span, Math.max(0, st.target));
    }
  }, [looping]);

  const render = useCallback(() => {
    const st = s.current;
    if (trackRef.current) trackRef.current.style.transform = `translate3d(${-st.offset}px, 0, 0)`;
    if (!st.step) return;
    const raw = Math.round(st.offset / st.step);
    const index = looping ? ((raw % n) + n) % n : Math.min(n - 1, raw);
    if (index !== st.active) {
      st.active = index;
      setActive(index);
    }
  }, [looping, n]);

  const autoplay = useCallback(() => {
    const st = s.current;
    return looping && !reducedMotion && st.visible && !st.hover && !st.focus && !st.userControl && !st.drag?.moved && !document.hidden;
  }, [looping, reducedMotion]);

  // Frame loop: glide towards a chosen card, or drift on its own. It stops whenever there is nothing
  // to animate and is restarted by `wake()`.
  const tick = useCallback(
    (now: number) => {
      const st = s.current;
      const dt = Math.min(0.05, (now - st.last) / 1000);
      st.last = now;
      let busy = false;
      if (st.step && !st.drag?.moved) {
        if (st.target !== null) {
          const ease = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
          st.offset += (st.target - st.offset) * ease;
          if (Math.abs(st.target - st.offset) < 0.5) {
            st.offset = st.target;
            st.target = null;
          }
          busy = true;
        } else if (autoplay()) {
          st.offset += (st.step / SECONDS_PER_CARD) * dt;
          busy = true;
        }
      }
      normalise();
      render();
      st.raf = busy ? requestAnimationFrame(tick) : 0;
    },
    [autoplay, normalise, render, reducedMotion],
  );

  const wake = useCallback(() => {
    const st = s.current;
    if (st.raf) return;
    st.last = performance.now();
    st.raf = requestAnimationFrame(tick);
  }, [tick]);

  // Measure now and on every resize; watch visibility so the loop sleeps off screen.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const st = s.current;
    measure();
    render();
    const resize = new ResizeObserver(() => {
      measure();
      normalise();
      render();
      wake();
    });
    resize.observe(viewport);
    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting;
      // Leaving the section hands the strip back to the drift for the next visit.
      if (!entry.isIntersecting) st.userControl = false;
      wake();
    });
    io.observe(viewport);
    const onVisibility = () => wake();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      resize.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(st.raf);
      st.raf = 0;
    };
  }, [measure, normalise, render, wake]);

  const takeControl = (index: number) => {
    s.current.userControl = true;
    setAnnouncement(`Work ${index + 1} of ${n}: ${items[index].title}`);
  };

  /** Glide to the work at `index`, by the shortest way round the loop. */
  const goTo = (index: number, { announce = true } = {}) => {
    const st = s.current;
    if (!st.step) return;
    const base = Math.round((st.target ?? st.offset) / st.step);
    if (looping) {
      const current = ((base % n) + n) % n;
      let delta = index - current;
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      st.target = (base + delta) * st.step;
    } else {
      st.target = index * st.step;
    }
    normalise();
    if (announce) takeControl(index);
    else st.userControl = true;
    wake();
  };

  const step = (dir: 1 | -1) => {
    const st = s.current;
    if (!st.step) return;
    const base = Math.round((st.target ?? st.offset) / st.step) + dir;
    st.target = base * st.step;
    normalise();
    const index = looping ? ((base % n) + n) % n : Math.min(n - 1, Math.max(0, base));
    takeControl(index);
    wake();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(n - 1);
    else return;
    e.preventDefault();
  };

  /* ------------------------------------------------------------- dragging */

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const now = performance.now();
    s.current.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, start: s.current.offset, moved: false, lastX: e.clientX, lastT: now, v: 0 };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const st = s.current;
    const d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) < Math.abs(e.clientY - d.y)) return;
      d.moved = true;
      st.target = null;
      try {
        viewportRef.current?.setPointerCapture(e.pointerId);
      } catch {
        // The pointer is already gone (e.g. released mid-gesture); the drag still works without capture.
      }
      viewportRef.current?.classList.add('is-dragging');
    }
    const now = performance.now();
    const dtMs = Math.max(1, now - d.lastT);
    d.v = 0.8 * ((e.clientX - d.lastX) / dtMs) + 0.2 * d.v;
    d.lastX = e.clientX;
    d.lastT = now;
    st.offset = d.start - dx;
    normalise();
    render();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const st = s.current;
    const d = st.drag;
    if (!d || d.id !== e.pointerId) return;
    st.drag = null;
    viewportRef.current?.classList.remove('is-dragging');
    if (!d.moved) return;
    if (!cancelled) st.suppressClick = true;
    // Settle on a card, carrying a little of the flick's momentum.
    const projected = st.offset - d.v * 220;
    const base = Math.round(projected / st.step);
    st.target = base * st.step;
    normalise();
    takeControl(looping ? ((base % n) + n) % n : Math.min(n - 1, Math.max(0, base)));
    wake();
  };

  /* ------------------------------------------------------------ rendering */

  // Keep the active entry of the index visible when the index itself scrolls (phones).
  useEffect(() => {
    const list = indexRef.current;
    const chip = list?.children[active] as HTMLElement | undefined;
    if (!list || !chip || list.scrollWidth <= list.clientWidth) return;
    const left = chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2;
    list.scrollTo({ left, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [active, reducedMotion]);

  return (
    <div onKeyDown={onKeyDown}>
      {/* Navigation: jump to any work, or step through them. */}
      <div className="mt-12 flex items-center gap-4">
        <ol
          ref={indexRef}
          aria-label="Jump to a work"
          className="work-carousel__index -my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible"
        >
          {items.map((item, i) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === active ? 'true' : undefined}
                aria-label={`Show work ${i + 1}: ${item.title}`}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap transition-colors',
                  i === active
                    ? 'border-brand-400 bg-brand-500/15 text-steel-50'
                    : 'border-[var(--line)] text-steel-300 hover:border-steel-300 hover:text-steel-50',
                )}
              >
                <span className={cn('font-mono text-[0.6875rem] tracking-[0.08em]', i === active ? 'text-brand-300' : 'text-steel-400')}>
                  {pad(i + 1)}
                </span>
                {item.short}
              </button>
            </li>
          ))}
        </ol>

        <div className="flex shrink-0 items-center gap-3">
          <p className="hidden font-mono text-xs tracking-[0.08em] text-steel-300 sm:block" aria-hidden="true">
            <span className="text-steel-50">{pad(active + 1)}</span> / {pad(n)}
          </p>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous work"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-steel-100 transition-colors hover:border-brand-400 hover:bg-brand-500 hover:text-white"
          >
            <Arrow dir="prev" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next work"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-strong)] text-steel-100 transition-colors hover:border-brand-400 hover:bg-brand-500 hover:text-white"
          >
            <Arrow dir="next" />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        className="work-carousel -mx-[var(--gutter)] mt-8"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(e) => endDrag(e, false)}
        onPointerCancel={(e) => endDrag(e, true)}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') s.current.hover = true;
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return;
          s.current.hover = false;
          wake();
        }}
        onClickCapture={(e) => {
          if (!s.current.suppressClick) return;
          s.current.suppressClick = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        onFocus={(e) => {
          s.current.focus = true;
          const slide = (e.target as HTMLElement).closest<HTMLElement>('[data-index]');
          if (slide && e.target !== viewportRef.current) goTo(Number(slide.dataset.index), { announce: false });
        }}
        onBlur={(e) => {
          if (viewportRef.current?.contains(e.relatedTarget as Node)) return;
          s.current.focus = false;
          wake();
        }}
      >
        <div
          ref={trackRef}
          className="work-carousel__track flex w-max"
          style={{ paddingLeft: 'max(0px, calc(var(--gutter) - var(--card-gap)))' } as CSSProperties}
        >
          {Array.from({ length: copies }, (_, copy) =>
            loop.map((item, i) => {
              const primary = copy === 0 && i < n;
              return (
                <div
                  key={`${copy}-${item.id}-${i}`}
                  data-slide
                  data-index={primary ? i : undefined}
                  role={primary ? 'group' : undefined}
                  aria-roledescription={primary ? 'slide' : undefined}
                  aria-label={primary ? `${i + 1} of ${n}: ${item.title}` : undefined}
                  // Repeats exist only to make the loop seamless.
                  aria-hidden={primary ? undefined : true}
                  inert={primary ? undefined : true}
                  className="w-[min(84vw,26rem)] shrink-0 pl-[var(--card-gap)]"
                >
                  {renderCard(item)}
                </div>
              );
            }),
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
