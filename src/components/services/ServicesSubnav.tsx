import { useEffect, useRef, useState } from 'react';
import { services } from '../../config/services';
import { cn } from '../../lib/cn';

const pad = (i: number) => String(i + 1).padStart(2, '0');

/**
 * Services page navigation that slides in under the header once the page hero has scrolled away.
 * It highlights the service currently in view and keeps that chip centred on narrow screens.
 */
export function ServicesSubnav({ heroId }: { heroId: string }) {
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(services[0].id);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: '-64px 0px 0px 0px',
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [heroId]);

  useEffect(() => {
    const sections = services.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  // Scroll only the chip strip (never the page) to keep the active chip in view.
  useEffect(() => {
    const list = listRef.current;
    const chip = list?.querySelector<HTMLElement>(`[data-service="${active}"]`);
    if (!list || !chip) return;
    list.scrollTo({ left: chip.offsetLeft - list.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' });
  }, [active]);

  return (
    <nav
      aria-label="Service sections"
      aria-hidden={!visible}
      inert={!visible}
      className={cn(
        'fixed inset-x-0 top-[var(--header-h)] z-40 border-b border-white/10 bg-[#081230]/92 backdrop-blur-md transition-[opacity,translate] duration-300',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
      )}
    >
      <div className="container-x">
        <ul ref={listRef} className="relative flex gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.map((s, i) => {
            const isActive = s.id === active;
            return (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  data-service={s.id}
                  aria-current={isActive ? 'true' : undefined}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition-colors duration-200',
                    isActive
                      ? 'border-[#1f5bd8] bg-[#1f5bd8] text-white'
                      : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white',
                  )}
                >
                  <span className={cn('font-mono text-xs', isActive ? 'text-white/80' : 'text-[#9dbcff]')}>{pad(i)}</span>
                  {s.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
