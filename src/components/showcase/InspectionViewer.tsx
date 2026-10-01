import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
} from 'react';
import { media } from '../../config/motion';
import { useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';
import { SECTION_UNCUT, bom, bomQuantities, modelFacts, parts, type PartDef } from '../three/wormAssembly';
import { AssemblyPoster } from '../three/AssemblyPoster';
import { LazyMechanism } from '../three/LazyMechanism';
import type { DragState } from '../three/Mechanism';
import { PITCH_LIMIT, defineState, toMixed, type MixedState } from '../three/visualState';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';
import './inspection.css';

const MODES = [
  {
    id: 'shaded',
    label: 'Shaded',
    caption: 'The reducer as it leaves the bench: cast housing closed, both shafts turning under power.',
    state: defineState({ camera: 'iso', drive: 0.35 }),
  },
  {
    id: 'exploded',
    label: 'Exploded',
    caption: 'Every part drawn back along its assembly path, in the order a fitter would build it.',
    state: defineState({ explode: 1, axes: 1, drive: 0, camera: 'wide' }),
  },
  {
    id: 'wireframe',
    label: 'Wireframe',
    caption: 'Edges only, with the key dimensions called out — the gear train reads through the casing.',
    state: defineState({
      wire: 1,
      finish: 0,
      axes: 1,
      shadow: 0,
      drive: 0,
      dims: { envelope: 0, engineer: 1 },
      camera: 'iso',
    }),
  },
  {
    id: 'section',
    label: 'Section',
    caption: 'Cut on the centre plane. Shafts, gears and bearings are shown whole, as in a drafting section.',
    state: defineState({ section: 1, drive: 0.2, camera: 'section' }),
  },
] as const;

type ModeId = (typeof MODES)[number]['id'];

/** Parts sealed inside the closed housing: not visible in the shaded view. */
const INTERNAL = (p: PartDef) => p.group === 'bearings' || p.id === 'worm' || p.id === 'worm-wheel';

/** Whether a part can be seen in a view step. The section cut removes the +X half of cut parts. */
function visibleIn(mode: ModeId, p: PartDef) {
  if (mode === 'shaded') return !INTERNAL(p);
  if (mode === 'section') return SECTION_UNCUT.includes(p.group) || p.position[0] <= 0.02;
  return true;
}

/** Bill-of-materials lines for a view step, with the quantity of each part that is in view. */
function bomFor(mode: ModeId) {
  const counts: Record<string, number> = {};
  for (const p of parts) if (visibleIn(mode, p)) counts[p.bom] = (counts[p.bom] ?? 0) + 1;
  return bom
    .map((line, i) => ({
      ...line,
      item: i + 1,
      qty: Math.min(counts[line.id] ?? 0, bomQuantities[line.id]),
    }))
    .filter((line) => line.qty > 0);
}

export function InspectionViewer() {
  const reducedMotion = useReducedMotion();
  const finePointer = useMediaQuery(media.finePointer);
  const [mode, setMode] = useState<ModeId>('shaded');
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const highlight = hovered ?? selected;

  const stateRef = useRef<MixedState>(toMixed(MODES[0].state));
  useEffect(() => {
    const m = MODES.find((x) => x.id === mode)!;
    stateRef.current = toMixed({ ...m.state, highlight });
  }, [mode, highlight]);
  const getState = useCallback(() => stateRef.current, []);

  const drag = useRef<DragState>({
    angle: 0,
    velocity: 0,
    pitch: 0,
    pitchVelocity: 0,
    dragging: false,
  });
  const last = useRef({ x: 0, y: 0, t: 0 });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current.dragging = true;
    drag.current.velocity = 0;
    drag.current.pitchVelocity = 0;
    last.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.dragging) return;
    const now = performance.now();
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    const dt = Math.max(1, now - last.current.t) / 1000;
    d.angle += dx * 0.01;
    d.velocity = Math.max(-6, Math.min(6, (dx * 0.01) / dt));
    d.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, d.pitch + dy * 0.01));
    d.pitchVelocity = Math.max(-6, Math.min(6, (dy * 0.01) / dt));
    last.current = { x: e.clientX, y: e.clientY, t: now };
  };
  const endDrag = () => {
    drag.current.dragging = false;
  };

  const rotate = (dir: -1 | 1) => {
    if (reducedMotion) drag.current.angle += dir * (Math.PI / 4);
    else drag.current.velocity += dir * 2.6;
  };
  const reset = () => {
    drag.current.velocity = 0;
    drag.current.angle = Math.round(drag.current.angle / (Math.PI * 2)) * Math.PI * 2;
    drag.current.pitch = 0;
    drag.current.pitchVelocity = 0;
    setMode('shaded');
    setSelected(null);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = reducedMotion ? Math.PI / 4 : 0.28;
    const d = drag.current;
    switch (e.key) {
      case 'ArrowLeft':
        d.angle -= step;
        break;
      case 'ArrowRight':
        d.angle += step;
        break;
      case 'ArrowUp':
        d.pitch = Math.max(-PITCH_LIMIT, d.pitch - step);
        break;
      case 'ArrowDown':
        d.pitch = Math.min(PITCH_LIMIT, d.pitch + step);
        break;
      case 'Home':
        reset();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const lines = useMemo(() => bomFor(mode), [mode]);
  const pieces = lines.reduce((n, l) => n + l.qty, 0);
  const modeLabel = MODES.find((m) => m.id === mode)!.label;
  // A part selected in one step is released when the next step no longer shows it.
  useEffect(() => {
    if (selected && !lines.some((l) => l.id === selected)) setSelected(null);
  }, [lines, selected]);

  const activeMode = MODES.find((m) => m.id === mode)!;
  const detail = bom.find((b) => b.id === highlight);
  const detailQty = detail ? lines.find((l) => l.id === detail.id)?.qty : undefined;
  const highlightName = detail?.name;

  return (
    <section id="showcase" aria-labelledby="showcase-title" className="surface-mist section-y">
      <div className="container-x">
        <SectionHeader
          index="03"
          label="3D showcase"
          titleId="showcase-title"
          title="Inspect the assembly."
          lede="Every component of this worm-gear reducer is modeled individually. Switch views, turn the model, and select parts in the bill of materials to see where each one sits."
        />

        <div className="panel brackets mt-14 grid overflow-hidden lg:h-[min(78svh,760px)] lg:min-h-[580px] lg:grid-cols-[minmax(0,1fr)_minmax(290px,30%)]">
          <div
            tabIndex={0}
            role="group"
            aria-label="Gear reducer model. Use the arrow keys to turn it, Home to reset."
            onKeyDown={onKeyDown}
            className="cad-grid relative h-[58svh] max-h-[640px] min-h-[380px] cursor-grab overflow-hidden select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-datum-400 active:cursor-grabbing short:h-[72svh] short:min-h-[240px] lg:h-auto lg:max-h-none lg:min-h-0"
            style={{ touchAction: 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <LazyMechanism
              getState={getState}
              drag={drag}
              tone="light"
              poster={<AssemblyPoster className="p-12" />}
              label={`Interactive 3D model of the gear reducer in ${mode} view${highlightName ? `, with the ${highlightName} highlighted` : ''}.`}
              className="absolute inset-0"
            />

            <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-3">
              <div
                role="group"
                aria-label="View mode"
                className="grid max-w-full grid-cols-4 rounded-[2px] border border-[var(--line)] bg-ink-900/85 p-0.5"
              >
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={mode === m.id}
                    onClick={() => setMode(m.id)}
                    className={cn(
                      'h-9 min-w-0 truncate rounded-[2px] px-1 font-mono text-[0.6875rem] tracking-[0.02em] uppercase transition-colors min-[400px]:px-2.5 min-[400px]:tracking-[0.08em] sm:px-3',
                      mode === m.id ? 'bg-steel-50 text-ink-950' : 'text-steel-300 hover:text-steel-50',
                    )}
                  >
                    {m.id === 'wireframe' ? (
                      <>
                        <span className="min-[400px]:hidden">Wire</span>
                        <span className="hidden min-[400px]:inline">{m.label}</span>
                      </>
                    ) : (
                      m.label
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(
                  [
                    ['Rotate left', 'M9 3L4 8l5 5', () => rotate(-1)],
                    ['Rotate right', 'M7 3l5 5-5 5', () => rotate(1)],
                    ['Reset view', 'M3 8a5 5 0 1 0 1.5-3.5M3 2v3h3', reset],
                  ] as const
                ).map(([label, d, action]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={action}
                    aria-label={label}
                    title={label}
                    className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-[var(--line)] bg-ink-900/85 text-steel-200 hover:text-steel-50"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d={d} stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <p
              key={mode}
              className="view-caption pointer-events-none absolute inset-x-0 top-16 mx-auto w-fit max-w-[min(26rem,calc(100%-1.5rem))] rounded-[2px] border border-[var(--line)] bg-ink-850/85 px-3 py-1.5 text-center text-xs leading-relaxed text-steel-200 backdrop-blur-[2px] sm:top-[4.25rem] sm:px-3.5 sm:py-2 sm:text-sm"
              aria-live="polite"
            >
              {activeMode.caption}
            </p>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-3 sm:p-4">
              <span className="tech-label">
                {finePointer ? 'Drag or use arrow keys' : 'Swipe in any direction to rotate'}
              </span>
              <span className="tech-label text-right text-datum-300">
                {highlightName ? `Selected · ${highlightName}` : ''}
              </span>
            </div>
          </div>

          <aside
            aria-labelledby="bom-title"
            className="flex min-h-0 flex-col border-t border-[var(--line)] bg-ink-900/40 lg:border-t-0 lg:border-l"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
              <h3 id="bom-title" className="tech-label text-steel-100">
                Bill of materials
              </h3>
              <span className="tech-label text-right" aria-live="polite">
                {modeLabel} · {lines.length} lines · {pieces} pcs
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <table className="h-full w-full text-sm">
                <caption className="sr-only">
                  Parts visible in the {modeLabel.toLowerCase()} view. Select a part to highlight it in the model.
                </caption>
                <thead className="sticky top-0 z-10 h-px bg-ink-850">
                  <tr className="text-left">
                    <th scope="col" className="tech-label w-12 px-4 py-2 font-normal">
                      Item
                    </th>
                    <th scope="col" className="tech-label py-2 font-normal">
                      Part
                    </th>
                    <th scope="col" className="tech-label px-4 py-2 text-right font-normal">
                      Qty
                    </th>
                  </tr>
                </thead>
                <tbody key={mode}>
                  {lines.map((item, i) => {
                    const on = highlight === item.id;
                    return (
                      <tr
                        key={item.id}
                        style={{ animationDelay: `${i * 28}ms` }}
                        className={cn(
                          'bom-row border-t border-[var(--line)] transition-colors',
                          on && 'bg-datum-400/10',
                        )}
                      >
                        <td className="px-4 py-0">
                          <span
                            className={cn(
                              'inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[0.625rem]',
                              on ? 'border-datum-300 text-datum-200' : 'border-[var(--line-strong)] text-steel-400',
                            )}
                          >
                            {item.item}
                          </span>
                        </td>
                        <td className="py-0">
                          <button
                            type="button"
                            aria-pressed={selected === item.id}
                            onMouseEnter={() => setHovered(item.id)}
                            onMouseLeave={() => setHovered(null)}
                            onFocus={() => setHovered(item.id)}
                            onBlur={() => setHovered(null)}
                            onClick={() => setSelected((cur) => (cur === item.id ? null : item.id))}
                            className={cn(
                              'flex min-h-9 w-full items-center py-1.5 text-left leading-snug transition-colors pointer-fine:min-h-0',
                              on ? 'text-steel-50' : 'text-steel-200 hover:text-steel-50',
                            )}
                          >
                            {item.name}
                          </button>
                        </td>
                        <td className="px-4 py-0 text-right font-mono text-steel-300">{item.qty}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--line)] px-4 py-3" aria-live="polite">
              {detail ? (
                <div key={detail.id} className="part-detail">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium text-steel-50">{detail.name}</p>
                    <p className="tech-label text-datum-300">
                      {detail.material}
                      {detailQty ? ` · ×${detailQty}` : ''}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-steel-300">{detail.note}</p>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-steel-400">
                  Select a part to isolate it in the model and read what it does. Demonstration model built for this
                  site; dimensions are illustrative.
                </p>
              )}
            </div>
          </aside>
        </div>

        <Reveal delay={120}>
          <dl className="mt-px grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {modelFacts.map((fact) => (
              <div key={fact.label} className="bg-ink-850 px-5 py-4">
                <dt className="tech-label text-steel-400">{fact.label}</dt>
                <dd className="mt-1.5 font-display text-lg font-semibold text-steel-50">{fact.value}</dd>
                <dd className="mt-0.5 text-xs text-steel-400">{fact.note}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
