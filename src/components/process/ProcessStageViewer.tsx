import { useRef } from 'react';
import { processStages, stageImage } from '../../config/process';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';

const total = String(processStages.length).padStart(2, '0');

function Corner({ className }: { className: string }) {
  return <span aria-hidden="true" className={cn('pointer-events-none absolute z-[3] h-4 w-4 border-white/55', className)} />;
}

interface Props {
  /** Index of the stage whose photo is shown. */
  active: number;
  className?: string;
}

/**
 * The Process section's stage viewer: every stage photo stacked in one 16:9 frame and cross-faded
 * to the active one (opacity only, so the photos stay pixel-sharp), with a stage readout along the
 * top and the photo's caption along the bottom.
 */
export function ProcessStageViewer({ active, className }: Props) {
  const stage = processStages[active];
  const ref = useRef<HTMLDivElement>(null);
  // Photos load a screen or so ahead of the section (native lazy loading misjudges this sticky panel).
  const near = useInView(ref, { rootMargin: '100% 0px', once: true });

  return (
    <div
      ref={ref}
      className={cn(
        'relative aspect-video overflow-hidden rounded-xl bg-[#050b1c] shadow-[0_40px_80px_-30px_rgb(3_7_18/0.7)] ring-1 ring-white/10',
        className,
      )}
    >
      <div role="img" aria-label={`Stage ${stage.number}, ${stage.name}: ${stage.visual}`} className="absolute inset-0">
        {processStages.map((s, i) => {
          const { src, srcSet } = stageImage(s.id);
          return (
            <img
              key={s.id}
              src={near ? src : undefined}
              srcSet={near ? srcSet : undefined}
              sizes="(min-width: 1024px) 56vw, 100vw"
              width={1376}
              height={768}
              alt=""
              decoding="async"
              className={cn(
                'process-viewer__photo absolute inset-0 h-full w-full object-cover',
                i === active ? 'is-active' : '',
              )}
            />
          );
        })}
      </div>

      <Corner className="top-3 left-3 border-t border-l" />
      <Corner className="top-3 right-3 border-t border-r" />
      <Corner className="bottom-3 left-3 border-b border-l" />
      <Corner className="right-3 bottom-3 border-r border-b" />

      {/* Stage readout */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-20 bg-[linear-gradient(to_bottom,rgb(5_11_28/0.8),transparent)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 z-[3] flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6 sm:py-4">
        <p className="flex items-center gap-2.5 font-mono text-[0.6875rem] tracking-[0.1em] text-white/70 uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8db5ff] opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8db5ff]" />
          </span>
          Stage <span className="text-white">{stage.number}</span> / {total}
        </p>
        <p className="font-mono text-[0.6875rem] tracking-[0.1em] text-white uppercase">{stage.name}</p>
      </div>

      {/* Caption: what this photo shows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-[linear-gradient(to_top,rgb(5_11_28/0.85),transparent)]"
      />
      <p
        key={stage.id}
        aria-hidden="true"
        className="process-viewer__caption absolute inset-x-0 bottom-0 z-[3] px-5 pb-4 font-display text-sm font-semibold text-white sm:px-6 sm:pb-5 sm:text-base"
      >
        {stage.caption}
      </p>
    </div>
  );
}
