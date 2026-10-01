import { cta } from '../../config/site';
import { ButtonLink } from '../ui/ButtonLink';
import { Eyebrow } from '../ui/Eyebrow';
import { LineDraw } from '../ui/LineDraw';
import { Reveal } from '../ui/Reveal';
import { RevealText } from '../ui/RevealText';

/** What happens after a request arrives — the same three steps the contact page sets out. */
const steps = [
  { title: 'Review', text: 'Your description and files are read against the engineering work involved.' },
  { title: 'Clarify', text: 'Questions come back to confirm requirements, constraints and priorities.' },
  { title: 'Propose', text: 'You receive a recommended scope with deliverables and a quote.' },
];

/** Accepted formats, as listed on the contact page. */
const sendables = [
  { label: 'Drawings', formats: ['PDF', 'DWG', 'DXF'] },
  { label: 'Models', formats: ['STEP', 'IGES', 'STL'] },
  { label: 'Photos & sketches', formats: ['PNG', 'JPG', 'WEBP'] },
  { label: 'Archives', formats: ['ZIP'] },
];

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="surface-brand cta-surface section-y">
      <div className="container-x">
        <div className="panel brackets cad-grid relative overflow-hidden border-[var(--line-strong)] bg-[rgb(6_14_38/0.66)] shadow-[0_30px_80px_-40px_rgb(3_8_20/0.9)]">
          {/* A sheen from the top right, picking up the light on the section behind. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_62%_82%_at_92%_10%,rgb(107_152_255/0.22),transparent_68%)]"
          />

          <div className="relative grid lg:grid-cols-12">
            <div className="px-6 py-14 sm:px-12 lg:col-span-7 lg:py-20 lg:pr-14 lg:pl-16">
              <Eyebrow>Start a project</Eyebrow>
              <h2 id="cta-title" className="display-lg mt-5">
                <RevealText delay={60}>Have a product that needs to be built?</RevealText>
              </h2>
              <Reveal delay={160}>
                <p className="lede mt-6 max-w-xl">
                  Send whatever you have today. We review it, ask the questions that matter, and outline the engineering
                  needed to take it to manufacturing.
                </p>
              </Reveal>

              <Reveal delay={220}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <ButtonLink to={cta.primary.to}>{cta.primary.label}</ButtonLink>
                  <ButtonLink to={cta.secondary.to} variant="secondary">
                    {cta.secondary.label}
                  </ButtonLink>
                </div>
              </Reveal>
              <Reveal delay={280}>
                <p className="mt-4 text-sm text-steel-300">
                  Nothing drawn yet? A sketch or a photo is enough to start.
                </p>
              </Reveal>

              {/* What happens next: three steps on one drawn line, left to right. */}
              <Reveal delay={320} className="mt-12">
                <h3 className="tech-label text-steel-100">What happens next</h3>
                <LineDraw delay={380} tone="line" className="mt-3 block h-px w-full" />
                <ol className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-8">
                  {steps.map((step, i) => (
                    <li key={step.title}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-datum-400/60 font-mono text-xs text-datum-300">
                          {i + 1}
                        </span>
                        <p className="font-medium text-steel-50">{step.title}</p>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-steel-300">{step.text}</p>
                    </li>
                  ))}
                </ol>
              </Reveal>
            </div>

            {/* File panel: the drawing-sheet side of the composition. */}
            <Reveal
              delay={200}
              className="border-t border-[var(--line)] bg-[rgb(255_255_255/0.045)] px-6 py-12 sm:px-12 lg:col-span-5 lg:border-t-0 lg:border-l lg:px-10 lg:py-20"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="tech-label text-steel-100">What you can send</h3>
                <span className="tech-label text-steel-400">{sendables.length} groups</span>
              </div>

              <dl className="mt-6 border-t border-[var(--line)]">
                {sendables.map((group) => (
                  <div
                    key={group.label}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--line)] py-4"
                  >
                    <dt className="text-sm text-steel-200">{group.label}</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {group.formats.map((format) => (
                        <span
                          key={format}
                          className="rounded-[2px] border border-[var(--line-strong)] px-2 py-1 font-mono text-[0.6875rem] tracking-[0.08em] text-steel-300 uppercase"
                        >
                          {format}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-6 text-sm leading-relaxed text-steel-300">
                Rough information is fine — the first step is understanding the problem.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
