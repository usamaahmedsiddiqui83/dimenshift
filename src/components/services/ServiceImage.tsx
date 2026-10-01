import { useRef, type ReactNode } from 'react';
import { motion } from '../../config/motion';
import { imageSources, type Service, type ServiceImageAsset } from '../../config/services';
import { useInView } from '../../hooks/useInView';
import { useTilt } from '../../hooks/useTilt';
import { cn } from '../../lib/cn';
import './services.css';

interface Props {
  service: Service;
  image: ServiceImageAsset;
  index: number;
  /**
   * Drives the settle-in animation, e.g. while an accordion row is open.
   * Omit it and the card animates once when it scrolls into view.
   */
  active?: boolean;
  /** Show the service name in the caption; turn off where the heading already sits beside the image. */
  showTitle?: boolean;
  /** Opens the enlarged view. Without it the image is not interactive. */
  onExpand?: () => void;
}

function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn('absolute h-4 w-4 border-white/60', className)} />;
}

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M8.5 1.5h4v4M12.5 1.5l-4.5 4.5M5.5 12.5h-4v-4M1.5 12.5L6 8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/**
 * A service image card. The picture is shown whole in a 16:9 frame — detailed diagrams keep their
 * own titles uncovered — with the labels in a caption bar beneath. On desktop it tilts toward the
 * mouse; with `onExpand` it opens the enlarged, zoomable view.
 */
export function ServiceImage({ service, image, index, active, showTitle = true, onExpand }: Props) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { rootMargin: motion.revealRootMargin, once: true });
  const isActive = active ?? inView;
  useTilt(ref);

  const media: ReactNode = (
    <>
      {onExpand && <span className="sr-only">Enlarge image: </span>}
      <img
        {...imageSources(image)}
        sizes="(min-width: 1024px) 45vw, 100vw"
        alt={image.alt}
        loading="lazy"
        decoding="async"
        className={cn(
          'absolute inset-0 h-full w-full object-cover transition-[scale] duration-[1600ms] ease-[cubic-bezier(0.2,0.7,0.1,1)]',
          isActive ? 'scale-100' : 'scale-[1.06]',
        )}
      />
      <span aria-hidden="true" className="tilt-glare pointer-events-none absolute inset-0" />
      <Corner className="top-3 left-3 border-t border-l" />
      <Corner className="top-3 right-3 border-t border-r" />
      <Corner className="bottom-3 left-3 border-b border-l" />
      <Corner className="right-3 bottom-3 border-r border-b" />
      {onExpand && (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#050b1c]/75 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover/image:opacity-100 group-focus-within/image:opacity-100 [@media(hover:none)]:opacity-100"
        >
          <ExpandIcon />
          Expand
        </span>
      )}
    </>
  );

  return (
    <figure
      ref={ref}
      className="group/image tilt-card overflow-hidden rounded-lg bg-[#050b1c] shadow-[0_30px_60px_-30px_rgb(8_18_48/0.45)] ring-1 ring-white/5"
    >
      {onExpand ? (
        <button
          type="button"
          onClick={onExpand}
          aria-haspopup="dialog"
          className="relative block aspect-video w-full overflow-hidden text-left focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#8db5ff]"
        >
          {media}
        </button>
      ) : (
        <div className="relative aspect-video overflow-hidden">{media}</div>
      )}

      <figcaption className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-3 sm:px-5">
        <span className="min-w-0">
          <span className="block font-mono text-[0.6875rem] tracking-[0.08em] text-[#9dbcff] uppercase">
            {showTitle ? `${String(index + 1).padStart(2, '0')} · ${service.title}` : service.viewLabel}
          </span>
          <span className="mt-1 block font-display text-sm leading-snug font-semibold text-white sm:text-base">
            {image.caption}
          </span>
        </span>
        {showTitle && (
          <span className="hidden shrink-0 font-mono text-[0.6875rem] tracking-[0.08em] text-white/50 uppercase sm:block">
            {service.viewLabel}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
