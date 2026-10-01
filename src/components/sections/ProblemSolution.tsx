import { problems } from '../../config/content';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';

export function ProblemSolution() {
  return (
    <section aria-labelledby="problems-title" className="surface-deep section-y">
      <div className="container-x">
        <SectionHeader
          index="04"
          label="Problem → Solution"
          titleId="problems-title"
          title="Where product development breaks — and how engineering prevents it."
        />
        <ol className="mt-14 border-t border-[var(--line)]">
          {problems.map((item, i) => (
            <li key={item.problem} className="border-b border-[var(--line)]">
              <Reveal className="grid gap-4 py-8 md:grid-cols-[3rem_1fr_4rem_1fr] md:items-start md:gap-6 lg:py-10">
                <span className="tech-label pt-1 text-brand-400">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="tech-label mb-2">Problem</p>
                  <p className="text-lg text-steel-300">{item.problem}</p>
                </div>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 12"
                  className="hidden h-3 w-16 self-center text-steel-500 md:block"
                  fill="none"
                >
                  <path d="M0 6h60M55 1l5 5-5 5" stroke="currentColor" strokeWidth="1.25" />
                </svg>
                <div>
                  <p className="tech-label mb-2 text-datum-300">Engineering response</p>
                  <p className="text-lg text-steel-50">{item.response}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
