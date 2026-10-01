import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { brand, cta, navigation, type NavItem } from '../../config/site';
import { cn } from '../../lib/cn';
import { Logo } from '../brand/Logo';
import { ButtonLink } from '../ui/ButtonLink';

const SECTION_IDS = ['services', 'process', 'work', 'about'];

/** Tracks which home section crosses the middle of the viewport. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) {
      setActive(null);
      return;
    }
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
          else setActive((cur) => (cur === entry.target.id ? null : cur));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

export function Header() {
  const location = useLocation();
  const onHome = location.pathname === '/';
  const activeSection = useActiveSection(onHome);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (item: NavItem) => {
    const [path, hash] = item.to.split('#');
    if (hash) return onHome && activeSection === hash;
    if (path === '/') return onHome && !activeSection;
    return location.pathname === path;
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-[background-color,border-color] duration-300',
        scrolled || open ? 'border-b border-[var(--line)] bg-ink-900/92' : 'border-b border-transparent',
      )}
    >
      <div className="container-x flex h-full items-center justify-between gap-6">
        <Link to="/" className="shrink-0 rounded-[2px]" aria-label={`${brand.name} home`}>
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {navigation.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? (item.to.includes('#') ? 'location' : 'page') : undefined}
                    className={cn(
                      'relative inline-flex h-10 items-center px-3 text-sm transition-colors',
                      active ? 'text-steel-50' : 'text-steel-300 hover:text-steel-50',
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute inset-x-3 bottom-1 h-px origin-left bg-brand-500 transition-transform duration-300',
                        active ? 'scale-x-100' : 'scale-x-0',
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <ButtonLink to={cta.primary.to} className="hidden min-h-10 px-4 text-sm sm:inline-flex">
            {cta.primary.label}
          </ButtonLink>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[2px] border border-[var(--line-strong)] text-steel-50 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
              <path
                d={open ? 'M3 1l12 10M3 11L15 1' : 'M0 1h18M0 6h18M0 11h18'}
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={menuRef}
          className="fixed inset-x-0 top-[var(--header-h)] bottom-0 overflow-y-auto bg-ink-900 lg:hidden"
        >
          <nav aria-label="Primary" className="container-x flex min-h-full flex-col py-8 short:py-4">
            <ul className="border-t border-[var(--line)] short:grid short:grid-cols-2 short:gap-x-8">
              {navigation.map((item, i) => (
                <li key={item.to} className="border-b border-[var(--line)]">
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item) ? 'page' : undefined}
                    className="flex items-baseline gap-4 py-4 font-display text-3xl font-semibold text-steel-50 short:py-2.5 short:text-2xl"
                  >
                    <span className="tech-label w-6 text-brand-400">{String(i + 1).padStart(2, '0')}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-auto grid gap-3 pt-10 sm:grid-cols-2 short:pt-5">
              <ButtonLink to={cta.primary.to}>{cta.primary.label}</ButtonLink>
              <ButtonLink to={cta.secondary.to} variant="secondary">
                {cta.secondary.label}
              </ButtonLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
