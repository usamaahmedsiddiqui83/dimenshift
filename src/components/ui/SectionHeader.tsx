import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Eyebrow } from './Eyebrow';
import { Reveal } from './Reveal';
import { RevealText } from './RevealText';

interface Props {
  index: string;
  label: string;
  title: ReactNode;
  titleId: string;
  lede?: ReactNode;
  className?: string;
}

/** Section opener: drawing-sheet style index, a large title and an optional lede aligned to the baseline grid. */
export function SectionHeader({ index, label, title, titleId, lede, className }: Props) {
  return (
    <header className={cn('grid gap-6 lg:grid-cols-12 lg:gap-x-10', className)}>
      <Eyebrow index={index} className="lg:col-span-12">
        {label}
      </Eyebrow>
      <h2 id={titleId} className="display-lg lg:col-span-7">
        <RevealText delay={60}>{title}</RevealText>
      </h2>
      {lede && (
        <Reveal className="lg:col-span-5 lg:self-end" delay={120}>
          <p className="lede">{lede}</p>
        </Reveal>
      )}
    </header>
  );
}
