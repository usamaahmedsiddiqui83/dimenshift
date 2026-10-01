import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { services, type Service } from '../../config/services';
import { cn } from '../../lib/cn';
import { ButtonLink } from '../ui/ButtonLink';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';
import { useInView } from '../../hooks/useInView';
import { ServiceHoverPreview } from './ServiceHoverPreview';
import { ServiceImage } from './ServiceImage';
import { ServiceLightbox } from './ServiceLightbox';
import { ServiceVisual } from './ServiceVisual';

const pad = (i: number) => String(i + 1).padStart(2, '0');

/** CAD drawing shown for a service until it has an image; remounting on open replays the line-draw. */
function Viewport({ service, active }: { service: Service; active: boolean }) {
  return (
    <div className="panel brackets overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-2.5">
        <span className="tech-label">Viewport</span>
        <span className="tech-label text-datum-300">{service.viewLabel}</span>
      </div>
      <div className="cad-grid aspect-[4/3] bg-ink-900 p-2 sm:p-4">
        <ServiceVisual key={active ? 'open' : 'closed'} kind={service.visual} />
      </div>
    </div>
  );
}

function ServiceDetails({ service }: { service: Service }) {
  return (
    <div>
      <p className="text-lg leading-relaxed text-steel-200">{service.description}</p>
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <div>
          <h4 className="tech-label mb-3">Deliverables</h4>
          <ul className="grid gap-2 text-sm text-steel-100">
            {service.deliverables.map((d) => (
              <li key={d} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-datum-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="tech-label mb-3">Typical use case</h4>
          <p className="text-sm leading-relaxed text-steel-200">{service.useCase}</p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to={`/services#${service.id}`}>View full details</ButtonLink>
        <ButtonLink to={`/contact?service=${service.id}`} variant="secondary">
          Discuss this service
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * One service open at a time. Each body sets the details on the left, aligned under the title,
 * and the service drawing on the right; on small screens the drawing follows the text.
 */
function ServiceAccordion({ onExpand }: { onExpand: (index: number) => void }) {
  const uid = useId();
  const [openId, setOpenId] = useState<string | null>(services[0].id);
  const [hovered, setHovered] = useState<number | null>(null);
  const headerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  // Load preview images shortly before the list reaches the viewport.
  const nearView = useInView(listRef, { rootMargin: '400px 0px', once: true });

  const toggle = (id: string) => setOpenId((current) => (current === id ? null : id));

  // Arrow keys, Home and End move between row headers, as in the WAI-ARIA accordion pattern.
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = services.length - 1;
    const keyMap: Record<string, number> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    if (!(e.key in keyMap)) return;
    e.preventDefault();
    headerRefs.current[keyMap[e.key]]?.focus();
  };

  return (
    <div ref={listRef} className="mt-14 border-t border-[var(--line)] lg:mt-16">
      <ServiceHoverPreview index={hovered} primed={nearView} />
      {services.map((s, i) => {
        const open = openId === s.id;
        const btnId = `${uid}-btn-${s.id}`;
        const panelId = `${uid}-panel-${s.id}`;
        return (
          <Reveal
            key={s.id}
            delay={i * 60}
            className={cn(
              'relative border-b border-[var(--line)] transition-colors duration-500',
              open && 'bg-ink-850',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-0 bottom-0 left-0 w-0.5 origin-top bg-brand-500 transition-transform duration-500',
                open ? 'scale-y-100' : 'scale-y-0',
              )}
            />
            <h3>
              <button
                ref={(el) => {
                  headerRefs.current[i] = el;
                }}
                id={btnId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => {
                  toggle(s.id);
                  // An opening row shows its image below, so the preview steps aside; a closing row brings it back.
                  setHovered(open && s.image ? i : null);
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse' && !open && s.image) setHovered(i);
                }}
                onPointerLeave={() => setHovered((current) => (current === i ? null : current))}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group grid w-full grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-4 px-4 py-6 text-left sm:px-6 lg:grid-cols-[4rem_minmax(0,1.15fr)_minmax(0,1fr)_auto] lg:gap-x-8 lg:px-8 lg:py-8"
              >
                <span
                  className={cn('tech-label transition-colors duration-300', open ? 'text-brand-400' : 'text-steel-400')}
                >
                  {pad(i)}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-xl leading-tight font-semibold text-steel-50 transition-transform duration-300 group-hover:translate-x-1 sm:text-2xl lg:text-[1.75rem]">
                    {s.title}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-steel-400 lg:hidden">{s.summary}</span>
                </span>
                <span className="hidden text-sm leading-relaxed text-steel-400 lg:block">{s.summary}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[rotate,background-color,border-color,color] duration-300',
                    open
                      ? 'rotate-45 border-brand-500 bg-brand-500 text-white'
                      : 'border-[var(--line-strong)] text-steel-50 group-hover:border-brand-500',
                  )}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </button>
            </h3>

            {/* Height animates from 0fr to 1fr; `inert` keeps closed panels out of the tab order and accessibility tree. */}
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              inert={!open}
              className={cn(
                'grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.2,0.7,0.1,1)]',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cn(
                    'grid items-center gap-10 px-4 pb-10 transition-[opacity,translate] duration-500 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:pr-8 lg:pb-12 lg:pl-32',
                    open ? 'translate-x-0 opacity-100 delay-150' : '-translate-x-3 opacity-0 delay-0',
                  )}
                >
                  <div className="lg:col-span-5">
                    <ServiceDetails service={s} />
                  </div>
                  <div className="lg:col-span-7">
                    {s.image ? (
                      <ServiceImage service={s} image={s.image} index={i} active={open} onExpand={() => onExpand(i)} />
                    ) : (
                      <Viewport service={s} active={open} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

export function ServicesSection() {
  const [enlarged, setEnlarged] = useState<number | null>(null);
  return (
    <section id="services" aria-labelledby="services-title" className="surface-light section-y">
      <div className="container-x">
        <SectionHeader
          index="01"
          label="Services"
          titleId="services-title"
          title="Engineering services, from first sketch to release."
          lede="Each service can stand alone or connect into a complete development program. Open a service to see what it involves and what you receive."
        />
        <div className="mt-8">
          <ButtonLink to="/services" variant="secondary">
            See all services in detail
          </ButtonLink>
        </div>
        <ServiceAccordion onExpand={setEnlarged} />
      </div>
      <ServiceLightbox index={enlarged} onNavigate={setEnlarged} onClose={() => setEnlarged(null)} />
    </section>
  );
}
