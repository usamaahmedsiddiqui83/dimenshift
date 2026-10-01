import { differentiators } from '../../config/content';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

export function Differentiators() {
  return (
    <section id="about" aria-labelledby="about-title" className="surface-light section-y">
      <div className="container-x">
        <SectionHeader
          index="05"
          label="About · Approach"
          titleId="about-title"
          title="An engineering partner for products that have to be built."
          lede="We work with founders, startups, manufacturers and product teams who need engineering that holds up in production — not just a convincing render."
        />
        <ul className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius-panel)] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {differentiators.map((d, i) => (
            <li key={d.index} className="bg-ink-850">
              <Reveal delay={i * 80} className="flex h-full flex-col p-6 lg:p-8">
                {/* Drawing-style balloon callout */}
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-datum-400/60 font-mono text-sm text-datum-300"
                >
                  {d.index}
                </span>
                <h3 className="mt-8 font-display text-xl leading-tight font-semibold">
                  {d.title}
                </h3>
                <p className="mt-3 text-steel-300">{d.text}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
