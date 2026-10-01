import { useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from '../../config/motion';
import { imageSources, previewSources, type Service, type ServiceImageAsset } from '../../config/services';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { useEagerImages } from '../../hooks/useEagerImages';
import { useInView } from '../../hooks/useInView';
import { useOffscreenFlag } from '../../hooks/useOffscreenFlag';
import { useTilt } from '../../hooks/useTilt';
import { cn } from '../../lib/cn';
import './services.css';

/** Horizontal travel that turns a press on the image into a swipe. */
const SWIPE = 40;

interface Props {
  service: Service;
  images: ServiceImageAsset[];
  /** Opens the enlarged view at the given image. */
  onExpand: (imageIndex: number) => void;
}

function Corner({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={cn('pointer-events-none absolute z-[4] h-4 w-4 border-white/60', className)} />
  );
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8.5 1.5h4v4M12.5 1.5l-4.5 4.5M5.5 12.5h-4v-4M1.5 12.5L6 8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * The services page gallery: a service's images in one 16:9 frame. Each change wipes the next image
 * across with a thin scan line (a clip-path reveal, so the pictures are never scaled and stay
 * sharp). It advances on its own; the progress line under the current thumbnail shows when, and it
 * waits while the gallery is hovered, focused or off screen. Visitors can pick an image from the
 * thumbnails, swipe the frame or use the ←/→ keys — after which it stays where they put it.
 * Clicking the frame opens the enlarged view. With reduced motion, images change instantly and
 * never on their own.
 */
export function ServiceGallery({ service, images, onExpand }: Props) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  useTilt(ref);
  useOffscreenFlag(ref);
  useEagerImages(ref, useInView(ref, { rootMargin: motion.canvasPreloadMargin, once: true }));
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [userControl, setUserControl] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const swipe = useRef<{
    id: number;
    x: number;
    y: number;
    done: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  const count = images.length;
  const multiple = count > 1;
  const autoplay = multiple && !reducedMotion && !userControl;
  const pad = (n: number) => String(n).padStart(2, '0');

  const show = (index: number, dir: 1 | -1, byUser: boolean) => {
    const next = (index + count) % count;
    if (next === active) return;
    setPrevious(active);
    setDirection(dir);
    setActive(next);
    if (byUser) {
      setUserControl(true);
      setAnnouncement(`Image ${next + 1} of ${count}: ${images[next].caption}`);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!multiple) return;
    if (e.key === 'ArrowRight') show(active + 1, 1, true);
    else if (e.key === 'ArrowLeft') show(active - 1, -1, true);
    else return;
    e.preventDefault();
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (multiple && e.button === 0)
      swipe.current = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        done: false,
      };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const s = swipe.current;
    if (!s || s.done || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
    s.done = true;
    suppressClick.current = true;
    if (dx < 0) show(active + 1, 1, true);
    else show(active - 1, -1, true);
  };
  const endSwipe = () => {
    swipe.current = null;
  };

  const current = images[active];

  return (
    <figure
      ref={ref}
      onKeyDown={onKeyDown}
      data-autoplay={autoplay || undefined}
      className="svc-gallery group/image tilt-card overflow-hidden rounded-lg bg-[#050b1c] shadow-[0_30px_60px_-30px_rgb(8_18_48/0.45)] ring-1 ring-white/5"
    >
      <button
        type="button"
        onClick={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.preventDefault();
            return;
          }
          onExpand(active);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endSwipe}
        onPointerCancel={endSwipe}
        aria-haspopup="dialog"
        className="svc-gallery__stage relative block aspect-video w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#8db5ff]"
      >
        <span className="sr-only">Enlarge image: </span>
        {images.map((image, i) => {
          const isActive = i === active;
          const isPrevious = i === previous;
          return (
            <img
              key={image.src}
              {...imageSources(image)}
              sizes="(min-width: 1024px) 45vw, 100vw"
              alt={isActive ? image.alt : ''}
              aria-hidden={isActive ? undefined : true}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={cn(
                'absolute inset-0 h-full w-full object-cover',
                isActive ? 'z-[2]' : isPrevious ? 'z-[1]' : 'z-0 opacity-0',
                // Only a change of image animates; the first image simply appears.
                isActive &&
                  previous !== null &&
                  !reducedMotion &&
                  (direction === 1 ? 'svc-gallery__in-next' : 'svc-gallery__in-prev'),
              )}
            />
          );
        })}
        {previous !== null && !reducedMotion && (
          <span
            key={`${active}-${direction}`}
            aria-hidden="true"
            className={cn(
              'svc-gallery__scan pointer-events-none absolute inset-0 z-[3]',
              direction === 1 ? 'is-next' : 'is-prev',
            )}
          />
        )}
        <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0 z-[3]" />
        <Corner className="top-3 left-3 border-t border-l" />
        <Corner className="top-3 right-3 border-t border-r" />
        <Corner className="bottom-3 left-3 border-b border-l" />
        <Corner className="right-3 bottom-3 border-r border-b" />
        {multiple && (
          <span
            aria-hidden="true"
            className="absolute top-4 left-4 z-[4] rounded-full border border-white/20 bg-[#050b1c]/75 px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.08em] text-white backdrop-blur-md"
          >
            {pad(active + 1)} / {pad(count)}
          </span>
        )}
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 z-[4] inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#050b1c]/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover/image:opacity-100 group-focus-within/image:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <ExpandIcon />
          Expand
        </span>
      </button>

      <figcaption className="flex flex-col items-start gap-3 border-t border-white/10 px-4 py-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between min-[420px]:gap-4 sm:px-5">
        <span className="min-w-0">
          <span className="block font-mono text-[0.6875rem] tracking-[0.08em] text-[#9dbcff] uppercase">
            {service.viewLabel}
          </span>
          <span
            key={active}
            className="svc-gallery__caption mt-1 block font-display text-sm leading-snug font-semibold text-white sm:text-base"
          >
            {current.caption}
          </span>
        </span>

        {multiple && (
          <span role="group" aria-label={`${service.title} images`} className="flex shrink-0 gap-2">
            {images.map((image, i) => {
              const thumb = previewSources(image);
              const isActive = i === active;
              return (
                <button
                  key={image.src}
                  type="button"
                  onClick={() => show(i, i > active ? 1 : -1, true)}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={`Show image ${i + 1} of ${count}: ${image.caption}`}
                  className={cn(
                    'relative block h-9 w-16 overflow-hidden rounded-[4px] ring-1 transition-[opacity,box-shadow] duration-300 sm:h-10 sm:w-[4.5rem]',
                    isActive ? 'opacity-100 ring-[#8db5ff]' : 'opacity-55 ring-white/15 hover:opacity-90',
                  )}
                >
                  <img
                    src={thumb.src}
                    srcSet={thumb.srcSet}
                    sizes="72px"
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-full w-full object-cover"
                  />
                  {isActive && autoplay && (
                    // The line fills while the image is on show; when it finishes, the next image comes in.
                    <span
                      key={active}
                      aria-hidden="true"
                      className="svc-gallery__progress absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[#8db5ff]"
                      onAnimationEnd={() => show(active + 1, 1, false)}
                    />
                  )}
                </button>
              );
            })}
          </span>
        )}
      </figcaption>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </figure>
  );
}
