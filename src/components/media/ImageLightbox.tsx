import { useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import './lightbox.css';

const ZOOM = 2.2;

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-[#8db5ff] hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#050b1c]/80 text-white backdrop-blur-md transition-colors hover:border-[#8db5ff] hover:bg-[#1f5bd8]',
        side === 'left' ? 'left-3 sm:left-5' : 'right-3 sm:right-5',
      )}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d={side === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </button>
  );
}

export interface LightboxItem {
  /** Unique per item, e.g. the image path. */
  id: string;
  /** Small label above the title, e.g. "01 · Exploded view". */
  eyebrow: string;
  title: string;
  src: string;
  alt: string;
  caption: string;
}

interface Props {
  items: LightboxItem[];
  /** Position in `items` of the image to show; null keeps the dialog closed. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/**
 * Enlarged image view: a modal dialog with click-to-zoom (the zoomed image follows
 * the mouse), previous/next browsing with the arrow keys, and Esc or a backdrop click to close.
 * Focus returns to whatever opened it.
 */
export function ImageLightbox({ items, index, onNavigate, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const current = index !== null ? (items[index] ?? null) : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (current && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!current && dialog.open) {
      dialog.close();
    }
  }, [current]);

  // Each image starts unzoomed.
  useEffect(() => {
    setZoomed(false);
    setOrigin('50% 50%');
  }, [index]);

  useEffect(
    () => () => {
      document.documentElement.style.overflow = '';
    },
    [],
  );

  const handleClose = () => {
    document.documentElement.style.overflow = '';
    returnFocusRef.current?.focus({ preventScroll: true });
    onClose();
  };

  const go = (step: number) => {
    if (index === null) return;
    onNavigate((index + step + items.length) % items.length);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  };

  // A click on the dialog element itself (not its content) is a click on the backdrop.
  const onDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) dialogRef.current?.close();
  };

  const originFrom = (e: MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`;
  };

  const onStageClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Keyboard activation has no pointer position, so zoom into the centre.
    setOrigin(e.detail === 0 ? '50% 50%' : originFrom(e));
    setZoomed((z) => !z);
  };

  const onStageMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (zoomed) setOrigin(originFrom(e));
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="image-lightbox"
      onClose={handleClose}
      onKeyDown={onKeyDown}
      onClick={onDialogClick}
    >
      {current && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <p className="font-mono text-[0.6875rem] tracking-[0.08em] text-[#9dbcff] uppercase">
                {current.eyebrow}
              </p>
              <h2 id={titleId} className="mt-1 truncate font-display text-lg font-semibold text-white sm:text-xl">
                {current.title}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="mr-2 hidden font-mono text-xs text-white/60 sm:inline" aria-live="polite">
                {(index ?? 0) + 1} / {items.length}
              </span>
              <IconButton label={zoomed ? 'Zoom out' : 'Zoom in'} onClick={() => setZoomed((z) => !z)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" />
                  <path d={zoomed ? 'M4.5 7h5M11 11l3.5 3.5' : 'M4.5 7h5M7 4.5v5M11 11l3.5 3.5'} stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </IconButton>
              <IconButton label="Close" onClick={() => dialogRef.current?.close()}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" />
                </svg>
              </IconButton>
            </div>
          </header>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#030712]">
            <button
              type="button"
              className="lightbox-stage absolute inset-0 flex items-center justify-center overflow-hidden p-3 sm:p-6"
              data-zoomed={zoomed}
              aria-label={`${zoomed ? 'Zoom out' : 'Zoom in'}: ${current.alt}`}
              onClick={onStageClick}
              onMouseMove={onStageMove}
            >
              <img
                key={current.src}
                src={current.src}
                alt=""
                className="max-h-full max-w-full rounded-md object-contain transition-transform duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)]"
                style={{ transform: `scale(${zoomed ? ZOOM : 1})`, transformOrigin: origin }}
              />
            </button>
            {items.length > 1 && (
              <>
                <NavButton side="left" onClick={() => go(-1)} />
                <NavButton side="right" onClick={() => go(1)} />
              </>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 sm:px-6">
            <p className="font-display text-sm font-semibold text-white sm:text-base">{current.caption}</p>
            <p className="hidden font-mono text-xs text-white/50 sm:block">← → browse · click to zoom · Esc to close</p>
          </footer>
        </div>
      )}
    </dialog>
  );
}
