import { brand } from '../../config/site';
import { cn } from '../../lib/cn';

/**
 * The DIMENSHIFT logo supplied by the client, in `public/brand`.
 *
 * Two lockups are cut from the same artwork: the compact one (mark + wordmark) for the header,
 * where the printed tagline would be too small to read, and the full one (with the tagline) for
 * the footer. Each has a reversed version — the dark ink turned white, the brand blue untouched —
 * because every surface the logo sits on is navy.
 */
export const LOGO_BLUE = '#1868e8';

const LOCKUPS = {
  compact: { src: '/brand/logo-compact-reversed.png', width: 378, height: 80 },
  full: { src: '/brand/logo-full-reversed.png', width: 527, height: 112 },
} as const;

export function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/logo-mark-reversed.png"
      alt=""
      aria-hidden="true"
      width={135}
      height={128}
      className={cn('w-auto shrink-0', className)}
    />
  );
}

interface LogoProps {
  className?: string;
  /** Use the full lockup, the one that carries the tagline (footer). */
  showTagline?: boolean;
}

export function Logo({ className, showTagline = false }: LogoProps) {
  const lockup = showTagline ? LOCKUPS.full : LOCKUPS.compact;
  return (
    <img
      src={lockup.src}
      alt={brand.name}
      width={lockup.width}
      height={lockup.height}
      // Sized by height; max-w-none keeps a narrow parent from squashing the lockup.
      className={cn('w-auto max-w-none', showTagline ? 'h-12 sm:h-14' : 'h-8 sm:h-9', className)}
    />
  );
}
