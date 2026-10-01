import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { media } from '../../config/motion';
import { previewSources, services } from '../../config/services';
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';

const pad = (i: number) => String(i + 1).padStart(2, '0');

/** Distance between the cursor and the card (px), and the minimum gap to the viewport edge. */
const GAP = 36;
const EDGE = 16;
/** Image frame in CSS px; the thumbnails are generated at exactly this ratio. */
const FRAME_W = 300;
const FRAME_H = 169;
/** Below this tilt (degrees) the rotation is dropped entirely, so a resting card is never resampled. */
const MIN_TILT = 0.1;

interface Props {
  /** Index into `services` of the row being hovered; null hides the card. */
  index: number | null;
  /** Load the images (set once the list is near the viewport, so the first hover shows instantly). */
  primed: boolean;
}

/**
 * Floating image preview that follows the mouse over the services list. It trails the pointer with
 * eased motion and a slight velocity tilt, sits beside the cursor (flipping side near the screen edge
 * and staying fully in view), and cross-fades between services as the pointer moves down the list.
 * Mouse only and purely decorative: keyboard and touch users open rows as usual.
 */
export function ServiceHoverPreview({ index, primed }: Props) {
  const finePointer = useMediaQuery(media.finePointer);
  const reducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  // Keep showing the last image while the card fades out.
  const lastIndex = useRef(0);
  if (index !== null) lastIndex.current = index;
  const visible = index !== null;
  const shown = services[lastIndex.current];

  useEffect(() => {
    if (!finePointer) return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [finePointer]);

  // Follow the pointer while visible. Each appearance starts exactly beside the cursor.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !finePointer || !visible) return;

    let raf = 0;
    let last = performance.now();
    let x = 0;
    let y = 0;
    let rotation = 0;
    let started = false;
    let previousX = pointer.current.x;

    const targetFor = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const { x: px, y: py } = pointer.current;
      let tx = px + GAP;
      if (tx + w > window.innerWidth - EDGE) tx = px - GAP - w;
      const ty = Math.max(EDGE, Math.min(window.innerHeight - h - EDGE, py - h / 2));
      return [tx, ty];
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      const [tx, ty] = targetFor();
      if (!started) {
        x = tx;
        y = ty;
        started = true;
      }
      const follow = reducedMotion ? 1 : 1 - Math.exp(-dt * 12);
      x += (tx - x) * follow;
      y += (ty - y) * follow;

      const velocity = (pointer.current.x - previousX) / dt;
      previousX = pointer.current.x;
      const tilt = reducedMotion ? 0 : Math.max(-4, Math.min(4, velocity * 0.004));
      rotation += (tilt - rotation) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 8));

      // Whole-pixel positions and no residual rotation keep the card's image unresampled, i.e. sharp.
      const px = Math.round(x);
      const py = Math.round(y);
      el.style.transform =
        Math.abs(rotation) >= MIN_TILT
          ? `translate3d(${px}px, ${py}px, 0) rotate(${rotation.toFixed(2)}deg)`
          : `translate3d(${px}px, ${py}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, finePointer, reducedMotion]);

  if (!finePointer) return null;

  // Rendered at the document root so no transformed ancestor can offset the fixed positioning.
  return createPortal(
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[60]"
      style={{ width: FRAME_W }}
    >
      {/*
        No scale animations and no border inside the frame: both would resample the image. The
        outline is a ring (drawn outside the box) and the entrance is a fade with a short slide.
      */}
      <div
        className={cn(
          'overflow-hidden rounded-xl bg-[#050b1c] shadow-[0_40px_80px_-24px_rgb(5_11_28/0.55)] ring-1 ring-white/10 transition-[opacity,translate] duration-300 ease-[cubic-bezier(0.2,0.7,0.1,1)]',
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <div className="relative overflow-hidden" style={{ width: FRAME_W, height: FRAME_H }}>
          {primed &&
            services.map((s, i) => {
              if (!s.image) return null;
              const { src, srcSet } = previewSources(s.image);
              return (
                <img
                  key={s.id}
                  src={src}
                  srcSet={srcSet}
                  sizes={`${FRAME_W}px`}
                  width={FRAME_W}
                  height={FRAME_H}
                  alt=""
                  decoding="async"
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out',
                    i === lastIndex.current ? 'opacity-100' : 'opacity-0',
                  )}
                />
              );
            })}
          <span className="absolute top-3 left-3 h-4 w-4 border-t border-l border-white/60" />
          <span className="absolute top-3 right-3 h-4 w-4 border-t border-r border-white/60" />
          <span className="absolute bottom-3 left-3 h-4 w-4 border-b border-l border-white/60" />
          <span className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-white/60" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2.5">
          <span className="truncate font-mono text-[0.6875rem] tracking-[0.08em] text-[#9dbcff] uppercase">
            {pad(lastIndex.current)} · {shown.viewLabel}
          </span>
          <span className="shrink-0 text-xs font-medium text-white/70">Click to open</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
