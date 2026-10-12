import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { assemblySequence as seq } from '../../config/media';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { useScrollFrame } from '../../hooks/useScrollProgress';
import { cn } from '../../lib/cn';
import { Eyebrow } from '../ui/Eyebrow';
import { RevealText } from '../ui/RevealText';

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };

const beats = [
  { label: 'Assembled', title: 'One manufacturing-ready product.' },
  { label: 'Separation', title: 'Taken apart in precise order.' },
  { label: 'Exploded view', title: 'Every component, engineered on its own.' },
];

const frameUrl = (frame: number) => `${seq.path}${String(frame + 1).padStart(3, '0')}${seq.ext}`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Where the product sits in the source frames (fractions of frame width/height), sampled every 15
 * frames. The frame backdrop matches the page, so on small or short screens only this box has to fit
 * between the heading and the caption — the product can be drawn larger on phones and never runs
 * under the text on landscape screens.
 */
const PRODUCT_BOX: [x0: number, x1: number, y0: number, y1: number][] = [
  [0.028, 0.968, 0.271, 0.683], [0.016, 0.98, 0.275, 0.683], [0.007, 0.991, 0.271, 0.683], [0.009, 0.996, 0.271, 0.683],
  [0.021, 0.991, 0.267, 0.688], [0.033, 0.991, 0.267, 0.692], [0.042, 0.989, 0.263, 0.692], [0.052, 0.989, 0.258, 0.696],
  [0.061, 0.989, 0.25, 0.704], [0.08, 0.98, 0.246, 0.708], [0.105, 0.968, 0.238, 0.717], [0.131, 0.947, 0.225, 0.725],
  [0.164, 0.921, 0.221, 0.729], [0.176, 0.881, 0.213, 0.733], [0.192, 0.841, 0.208, 0.738], [0.188, 0.813, 0.204, 0.742],
  [0.185, 0.804, 0.204, 0.746], [0.185, 0.773, 0.204, 0.746], [0.185, 0.771, 0.2, 0.746], [0.183, 0.769, 0.2, 0.746],
];
const BOX_STEP = 15;

function productBox(frame: number) {
  const t = frame / BOX_STEP;
  const i = Math.min(PRODUCT_BOX.length - 1, Math.floor(t));
  const j = Math.min(PRODUCT_BOX.length - 1, i + 1);
  const f = Math.min(1, t - i);
  return PRODUCT_BOX[i].map((v, k) => v + (PRODUCT_BOX[j][k] - v) * f) as [number, number, number, number];
}

/** Large screens keep the original full-stage framing. */
const FULL_STAGE_QUERY = '(min-width: 1024px) and (min-height: 640px)';

/** Coarse-to-fine loading order so scrubbing looks right long before every frame has arrived. */
function loadOrder(length: number, skip: number) {
  const order: number[] = [];
  const seen = new Set<number>([skip]);
  for (const step of [24, 8, 2, 1]) {
    for (let p = 0; p < length; p += step) {
      if (!seen.has(p)) {
        seen.add(p);
        order.push(p);
      }
    }
  }
  return order;
}

export function AssemblySequence() {
  const reducedMotion = useReducedMotion();
  const [saveData] = useState(
    () => typeof navigator !== 'undefined' && (navigator as NavigatorWithConnection).connection?.saveData === true,
  );
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);
  const position = useRef(0);
  const drawn = useRef(-1);
  const pendingDraw = useRef(0);
  const [beat, setBeat] = useState(reducedMotion ? beats.length - 1 : 0);

  // Source frames to use: all of them on larger screens, every 2nd on phones (the motion is just as
  // smooth at that size and it halves the download), every 4th with data saver on.
  const [compact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );
  const frames = useMemo(() => {
    const step = saveData ? 4 : compact ? 2 : 1;
    const list: number[] = [];
    for (let f = 0; f < seq.count; f += step) list.push(f);
    if (list[list.length - 1] !== seq.count - 1) list.push(seq.count - 1);
    return list;
  }, [saveData, compact]);

  /** Draws the frame at `pos`, or the nearest one already loaded. */
  const draw = useCallback(
    (pos: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      let chosen = -1;
      for (let d = 0; d < frames.length && chosen === -1; d++) {
        if (images.current[pos - d]) chosen = pos - d;
        else if (images.current[pos + d]) chosen = pos + d;
      }
      if (chosen === -1 || chosen === drawn.current) return;
      drawn.current = chosen;
      const img = images.current[chosen]!;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const heading = headingRef.current?.getBoundingClientRect();
      const caption = captionRef.current?.getBoundingClientRect();
      if (window.matchMedia(FULL_STAGE_QUERY).matches || !heading || !caption) {
        const scale = Math.min(canvas.width / iw, canvas.height / ih);
        ctx.drawImage(img, (canvas.width - iw * scale) / 2, (canvas.height - ih * scale) / 2, iw * scale, ih * scale);
        return;
      }

      // Fit the product box into the clear band between the heading and the caption.
      const c = canvas.getBoundingClientRect();
      const k = canvas.width / c.width;
      const gap = 16 * k;
      const bandTop = (heading.bottom - c.top) * k + gap;
      const bandBottom = (caption.top - c.top) * k - gap;
      const bandLeft = 16 * k;
      // Phones use the full width; wider screens leave the product some air.
      const bandW = (canvas.width - bandLeft * 2) * (c.width < 640 ? 1 : 0.88);
      const bandH = Math.max(40 * k, bandBottom - bandTop);
      const [x0, x1, y0, y1] = productBox(frames[chosen]);
      const boxW = (x1 - x0) * iw;
      const boxH = (y1 - y0) * ih;
      // Never enlarge past 1.6x the source, which keeps the frames sharp.
      const scale = Math.min(bandW / boxW, bandH / boxH, 1.6 * k);
      const dx = (canvas.width - boxW * scale) / 2 - x0 * iw * scale;
      const dy = bandTop + (bandH - boxH * scale) / 2 - y0 * ih * scale;
      ctx.drawImage(img, dx, dy, iw * scale, ih * scale);
    },
    [frames],
  );

  const scheduleDraw = useCallback(() => {
    if (pendingDraw.current) return;
    pendingDraw.current = requestAnimationFrame(() => {
      pendingDraw.current = 0;
      draw(position.current);
    });
  }, [draw]);

  // Keep the canvas backing store matched to its size and pixel density.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      drawn.current = -1;
      draw(position.current);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    // The heading and caption bound the product on small screens, so reflowing text redraws too.
    if (headingRef.current) observer.observe(headingRef.current);
    if (captionRef.current) observer.observe(captionRef.current);
    resize();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(pendingDraw.current);
      pendingDraw.current = 0;
    };
  }, [draw]);

  // Load the starting frame at once; stream the rest as the section approaches.
  useEffect(() => {
    let cancelled = false;
    images.current = new Array(frames.length).fill(null);
    drawn.current = -1;
    // The sequence runs in reverse, so the assembled product (the last frame) is what shows first.
    const first = frames.length - 1;
    position.current = first;

    const loadOne = (pos: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        // Frames never compete with what is on screen now.
        img.fetchPriority = pos === first ? 'high' : 'low';
        img.onload = () => {
          if (!cancelled) {
            images.current[pos] = img;
            scheduleDraw();
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameUrl(frames[pos]);
      });

    const section = sectionRef.current;
    if (!section) return;
    // Nothing loads with the page itself: the first frame, then the rest, start as the section nears.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void loadOne(first).then(() => {
          if (reducedMotion) return;
          const queue = loadOrder(frames.length, first);
          const worker = async () => {
            while (!cancelled && queue.length) await loadOne(queue.shift()!);
          };
          for (let k = 0; k < 4; k++) void worker();
        });
      },
      { rootMargin: '150% 0px' },
    );
    observer.observe(section);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [frames, reducedMotion, scheduleDraw]);

  // Scroll position → frame, progress bar and caption.
  useScrollFrame(
    sectionRef,
    (rect, vh) => {
      const travel = rect.height - vh;
      const progress = travel > 0 ? clamp01(-rect.top / travel) : 1;
      // Played backwards: the section opens on the finished product and scrolling takes it apart.
      position.current = Math.round((1 - progress) * (frames.length - 1));
      draw(position.current);
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      if (percentRef.current) percentRef.current.textContent = `${String(Math.round(progress * 100)).padStart(3, '0')}%`;
      const next = Math.min(beats.length - 1, Math.floor(progress * beats.length));
      setBeat((cur) => (cur === next ? cur : next));
    },
    !reducedMotion,
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="sequence-title"
      className={cn('relative', reducedMotion ? 'h-auto' : 'h-[280vh] lg:h-[400vh]')}
    >
      <div className="sticky top-0 h-[100svh] min-h-[320px] overflow-hidden">
        {/* The animation fills the whole stage. Frames keep the product between 20% and 75% of their
            height, so the heading and captions are kept compact enough to sit in the clear space above
            and below it. */}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A planetary gearbox that starts as a finished unit and separates into its individual components as you scroll."
          className="absolute inset-0 h-full w-full"
        />

        <div ref={headingRef} className="container-x relative pt-[calc(var(--header-h)+1rem)]">
          <Eyebrow className="text-steel-200">Assembly sequence</Eyebrow>
          <h2
            id="sequence-title"
            className="display-md mt-2 max-w-xl text-[clamp(1.375rem,1.9vw,1.75rem)] lg:max-w-none"
          >
            <RevealText delay={60}>From individual components to a complete assembly.</RevealText>
          </h2>
        </div>

        <div ref={captionRef} className="container-x absolute inset-x-0 bottom-0 pb-5 sm:pb-6">
          <div className="relative min-h-[4.25rem] sm:min-h-[3.5rem]">
            {beats.map((b, i) => (
              <div
                key={b.label}
                aria-hidden={i !== beat}
                className={cn(
                  'absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-500',
                  i === beat ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
                )}
              >
                <p className="tech-label text-brand-400">
                  {String(i + 1).padStart(2, '0')} · {b.label}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-steel-50 sm:text-2xl">{b.title}</p>
              </div>
            ))}
          </div>
          {!reducedMotion && (
            <div className="mt-4 flex items-center gap-4" aria-hidden="true">
              <div className="relative h-px flex-1 bg-[var(--line)]">
                <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-brand-500" />
              </div>
              <span ref={percentRef} className="tech-label w-12 text-right text-steel-200">
                000%
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
