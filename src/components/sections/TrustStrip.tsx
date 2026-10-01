import { trustPoints } from '../../config/content';
import { Reveal } from '../ui/Reveal';

export function TrustStrip() {
  return (
    <section aria-label="Working principles" className="surface-brand trust-strip relative z-10">
      <div className="container-x">
        {/* 1px gaps over a line-colored ground draw clean dividers at every column count. */}
        <ul className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {trustPoints.map((point, i) => (
            <li key={point.label} className="trust-cell px-5 py-8 sm:px-7 lg:py-10">
              <Reveal delay={i * 70}>
                <p className="tech-label text-datum-300">{String(i + 1).padStart(2, '0')}</p>
                {/* The principle leads; the sentence under it explains. */}
                <p className="mt-4 font-display text-lg leading-snug font-semibold text-steel-50">{point.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-steel-300">{point.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
