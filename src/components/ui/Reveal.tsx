import { useRef, type CSSProperties, type ReactNode } from 'react';
import { motion } from '../../config/motion';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Direction the content arrives from. Horizontal is the site standard. */
  from?: 'left' | 'below';
}

/** Slides content in once as it enters the viewport. Disabled under reduced motion via CSS. */
export function Reveal({ children, className, delay = 0, from = 'left' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { rootMargin: motion.revealRootMargin, once: true });
  return (
    <div
      ref={ref}
      className={cn('reveal', from === 'below' && 'reveal--below', inView && 'is-in', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
