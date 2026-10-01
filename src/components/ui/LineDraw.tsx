import { useRef, type CSSProperties } from 'react';
import { motion } from '../../config/motion';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';

const tones = {
  brand: 'bg-brand-500',
  line: 'bg-[var(--line-strong)]',
} as const;

interface Props {
  /** Width comes from the caller (e.g. `w-12`); without one it spans its container. */
  className?: string;
  delay?: number;
  tone?: keyof typeof tones;
}

/** A hairline that draws from left to right once it scrolls into view. Decorative only. */
export function LineDraw({ className, delay = 0, tone = 'brand' }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { rootMargin: motion.revealRootMargin, once: true });
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn('line-draw', tones[tone], inView && 'is-in', className)}
      style={{ '--line-delay': `${delay}ms` } as CSSProperties}
    />
  );
}
