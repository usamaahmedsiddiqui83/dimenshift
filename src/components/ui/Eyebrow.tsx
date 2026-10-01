import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Reveal } from './Reveal';

interface Props {
  children: ReactNode;
  /** Section number such as "01"; a small brand square is shown when omitted. */
  index?: string;
  className?: string;
  delay?: number;
}

/**
 * The label above a page or section heading: a marker, then the label sliding in from the left.
 * Use it for every new heading so the motion stays consistent.
 */
export function Eyebrow({ children, index, className, delay = 0 }: Props) {
  return (
    <Reveal delay={delay} className={cn('tech-label flex items-center gap-3', className)}>
      {index ? (
        <span className="text-brand-400">{index}</span>
      ) : (
        <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 bg-brand-500" />
      )}
      <span>{children}</span>
    </Reveal>
  );
}
