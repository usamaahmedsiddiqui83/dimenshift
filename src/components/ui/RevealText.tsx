import { Fragment, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from '../../config/motion';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  /** Delay before the first word moves (ms). */
  delay?: number;
  /** Gap between consecutive words (ms). */
  stagger?: number;
}

/**
 * Rises a heading into place word by word as its section scrolls in.
 * Plain text is staggered; anything else fades up in one piece.
 * Disabled under reduced motion via CSS.
 */
export function RevealText({ children, className, delay = 0, stagger = 45 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { rootMargin: motion.revealRootMargin, once: true });
  const words = typeof children === 'string' ? children.split(' ') : null;

  if (!words) {
    return (
      <span ref={ref} className={cn('reveal', inView && 'is-in', className)}>
        {children}
      </span>
    );
  }

  return (
    <span ref={ref} className={cn('reveal-text', inView && 'is-in', className)}>
      {words.map((word, i) => (
        <Fragment key={`${word}-${i}`}>
          <span className="reveal-word" style={{ '--reveal-delay': `${delay + i * stagger}ms` } as CSSProperties}>
            {word}
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}
