import { useEffect, useRef, useState } from 'react';
import { motion } from '../../config/motion';
import { processStages, stageThumb } from '../../config/process';
import { useIsSplit, useReducedMotion } from '../../hooks/useMediaQuery';
import { useEagerImages } from '../../hooks/useEagerImages';
import { useInView } from '../../hooks/useInView';
import { useOffscreenFlag } from '../../hooks/useOffscreenFlag';
import { useScrollFrame } from '../../hooks/useScrollProgress';
import { cn } from '../../lib/cn';
import { SectionHeader } from '../ui/SectionHeader';
import { ProcessStageViewer } from './ProcessStageViewer';
import './process.css';

const LAST = processStages.length - 1;

export function ProcessSection() {
  const reducedMotion = useReducedMotion();
  const split = useIsSplit();
  const listRef = useRef<HTMLOListElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const segmentsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [stickyTop, setStickyTop] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  useOffscreenFlag(sectionRef);
  useEagerImages(
    sectionRef,
    useInView(sectionRef, {
      rootMargin: motion.canvasPreloadMargin,
      once: true,
    }),
  );

  // Side by side, the viewer and its filmstrip sit centred in the space below the header while the
  // stages scroll past; stacked (phones), they stay pinned right under the header.
  useEffect(() => {
    const panel = viewportRef.current;
    if (!split || !panel) {
      setStickyTop(null);
      return;
    }
    const update = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      const free = window.innerHeight - header;
      setStickyTop(Math.round(header + Math.max(16, (free - panel.offsetHeight) / 2)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panel);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [split]);

  // Reading line: viewport centre on desktop; centre of the space below the sticky viewer on mobile.
  const readingLine = (vh: number) => {
    if (split) return vh / 2;
    const viewerBottom = Math.min(viewportRef.current?.getBoundingClientRect().bottom ?? 0, vh);
    return (viewerBottom + vh) / 2;
  };

  useScrollFrame(listRef, (_rect, vh) => {
    const line = readingLine(vh);
    const centers = stepRefs.current.map((el) => {
      const r = el?.getBoundingClientRect();
      return r ? r.top + r.height / 2 : 0;
    });
    let s = 0;
    if (line >= centers[LAST]) s = LAST;
    else if (line > centers[0]) {
      for (let i = 0; i < LAST; i++) {
        if (line >= centers[i] && line < centers[i + 1]) {
          s = i + (line - centers[i]) / (centers[i + 1] - centers[i]);
          break;
        }
      }
    }
    const index = Math.round(s);
    setActive((cur) => (cur === index ? cur : index));
    // Segment i is full once stage i is reached and fills while scrolling towards it.
    segmentsRef.current.forEach((el, i) => {
      if (el) el.style.transform = `scaleX(${Math.min(1, Math.max(0, s - i + 1))})`;
    });
  });

  const goTo = (index: number) => {
    const step = stepRefs.current[index];
    if (!step) return;
    const r = step.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + r.top + r.height / 2 - readingLine(window.innerHeight),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-title"
      className="surface-navy process-radiant section-y relative isolate"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="process-radiant__stage">
          <div className="process-radiant__layer process-radiant__dark" />
          <div className="process-radiant__layer process-radiant__glow" />
        </div>
      </div>

      <div className="container-x">
        <SectionHeader
          index="02"
          label="Process"
          titleId="process-title"
          title="An engineering workflow you can watch."
          lede="Eight stages take a product from requirement to release package. Scroll through them and follow one gear reducer from its first design envelope to a released product."
        />

        <div className="mt-12 split:mt-20 split:grid split:grid-cols-12 split:gap-x-12">
          {/* Sticky stage viewer and filmstrip */}
          <div
            ref={viewportRef}
            style={stickyTop !== null ? { top: stickyTop } : undefined}
            className="sticky top-[var(--header-h)] z-20 -mx-[var(--gutter)] bg-ink-900 px-[var(--gutter)] pt-2 pb-3 split:col-span-7 split:col-start-6 split:row-start-1 split:mx-0 split:self-start split:bg-transparent split:p-0"
          >
            <ProcessStageViewer active={active} />

            {/* Filmstrip: every stage at a glance; each fills as you scroll towards it and jumps there. */}
            <ol className="mt-3 grid grid-cols-8 gap-1.5 split:mt-4 split:gap-2 short:mt-2" aria-label="Jump to stage">
              {processStages.map((s, i) => {
                const current = i === active;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      aria-current={current ? 'step' : undefined}
                      aria-label={`Stage ${s.number}: ${s.name}`}
                      className="group block w-full rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                    >
                      <span
                        className={cn(
                          'process-strip__thumb relative hidden aspect-video overflow-hidden rounded-[5px] ring-1 sm:block short:hidden',
                          current
                            ? 'opacity-100 ring-[#8db5ff] shadow-[0_0_0_3px_rgb(141_181_255/0.18)]'
                            : 'opacity-50 ring-white/10 group-hover:opacity-85',
                        )}
                      >
                        <img
                          src={stageThumb(s.id)}
                          alt=""
                          width={320}
                          height={179}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span
                        className={cn(
                          'flex h-9 items-center justify-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.08em] transition-colors sm:mt-1 sm:h-6 sm:justify-start',
                          current ? 'text-brand-300' : 'text-steel-400 group-hover:text-steel-100',
                        )}
                      >
                        {s.number}
                        <span className="hidden truncate uppercase xl:inline">{s.name}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="relative block h-[2px] overflow-hidden rounded-full bg-white/15"
                      >
                        <span
                          ref={(el) => {
                            segmentsRef.current[i] = el;
                          }}
                          className="absolute inset-0 origin-left scale-x-0 rounded-full bg-[#8db5ff]"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Stage copy — the text equivalent of every stage image */}
          <ol ref={listRef} className="split:col-span-5 split:col-start-1 split:row-start-1">
            {processStages.map((s, i) => (
              <li
                key={s.id}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className="flex min-h-[62svh] flex-col justify-center py-10 split:min-h-[88svh]"
              >
                <article
                  aria-labelledby={`stage-${s.id}`}
                  className={cn('transition-opacity duration-500', i === active ? 'opacity-100' : 'split:opacity-45')}
                >
                  <p className="tech-label flex items-center gap-3">
                    <span className="text-brand-400">{s.number}</span>
                    {s.name}
                  </p>
                  <h3 id={`stage-${s.id}`} className="display-md mt-5">
                    {s.headline}
                  </h3>
                  <p className="mt-4 max-w-[34rem] text-steel-300">{s.body}</p>
                  <ul className="mt-6 flex flex-wrap gap-2" aria-label={`${s.name} outputs`}>
                    {s.outputs.map((o) => (
                      <li
                        key={o}
                        className="rounded-[2px] border border-[var(--line)] px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.06em] text-steel-200 uppercase"
                      >
                        {o}
                      </li>
                    ))}
                  </ul>
                  <p className="sr-only">Stage image: {s.visual}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
