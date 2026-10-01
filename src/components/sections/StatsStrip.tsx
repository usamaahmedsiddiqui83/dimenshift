import { capabilityGroups, credentials, type Stat } from '../../config/content';
import { processStages } from '../../config/process';
import { services } from '../../config/services';
import { cn } from '../../lib/cn';
import { LineDraw } from '../ui/LineDraw';
import { Reveal } from '../ui/Reveal';

/** Gap between consecutive items sliding in (ms), long enough to read each one. */
const STAGGER = 180;

const fileFormats = (capabilityGroups.find((g) => g.title === 'File formats exchanged')?.items ?? []).map(
  (format) => format.split(' / ')[0],
);

/** Counted from the site's own content, so these stay true as services, stages or formats change. */
const stats: Stat[] = [
  { value: String(services.length), unit: 'services', label: 'Concept design to CAD conversion' },
  { value: String(processStages.length), unit: 'stages', label: 'Structured concept-to-release process' },
  { value: '2D → 3D', label: 'Legacy drawings rebuilt as editable CAD' },
  { value: String(fileFormats.length), unit: 'formats', label: fileFormats.join(' · ') },
];

function StatRow({ items, baseDelay = 0 }: { items: Stat[]; baseDelay?: number }) {
  return (
    <dl className="grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((stat, i) => (
        <Reveal
          key={stat.label}
          from="left"
          delay={baseDelay + i * STAGGER}
          // Label first for screen readers; shown beneath the figure.
          className={cn(
            'flex flex-col-reverse pl-4 sm:pl-5',
            i === 0 ? 'border-l-2 border-brand-500' : 'border-l border-[var(--line-strong)]',
          )}
        >
          <dt className="tech-label mt-2">{stat.label}</dt>
          <dd className="font-mono text-3xl leading-none font-bold tracking-tight text-steel-50 lg:text-[2rem]">
            {stat.value}
            {stat.unit && <span className="ml-1 text-sm font-medium tracking-normal text-brand-400">{stat.unit}</span>}
          </dd>
        </Reveal>
      ))}
    </dl>
  );
}

export function StatsStrip() {
  return (
    <section aria-label="At a glance" className="surface-mist border-y border-[var(--line)]">
      <div className="container-x py-10 lg:py-12">
        <StatRow items={stats} />
        <LineDraw tone="line" delay={(stats.length - 1) * STAGGER} className="my-8 lg:my-10" />
        {/* The second row follows once the first has finished arriving. */}
        <StatRow items={credentials} baseDelay={stats.length * STAGGER} />
      </div>
    </section>
  );
}
