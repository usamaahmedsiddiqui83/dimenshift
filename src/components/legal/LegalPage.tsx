import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { legalEntity, type LegalBlock, type LegalDocument } from '../../config/legal';
import { useActiveSection } from '../../hooks/useActiveSection';
import { cn } from '../../lib/cn';
import { Eyebrow } from '../ui/Eyebrow';
import { EmailLink } from '../ui/EmailLink';
import { Reveal } from '../ui/Reveal';
import { RevealText } from '../ui/RevealText';
import './legal.css';

const pad = (i: number) => String(i + 1).padStart(2, '0');

const inlineLink =
  'text-steel-50 underline decoration-[var(--line-strong)] underline-offset-4 transition-colors hover:decoration-brand-500';

function ContactDetails() {
  return (
    <p>
      {legalEntity.email ? (
        <>
          Email{' '}
          <EmailLink email={legalEntity.email} className={inlineLink}>
            {legalEntity.email}
          </EmailLink>
        </>
      ) : (
        <>
          Contact us through our{' '}
          <Link to="/contact" className={inlineLink}>
            project intake form
          </Link>
        </>
      )}
      {legalEntity.address && <>, or write to {legalEntity.address}</>}.
    </p>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (typeof block === 'string') return <p>{block}</p>;
  if ('list' in block) {
    return (
      <ul className="grid gap-2.5">
        {block.list.map((item) => (
          <li key={item} className="flex gap-3">
            <span aria-hidden="true" className="mt-[0.8em] h-px w-3 shrink-0 bg-datum-400" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <ContactDetails />;
}

interface Props {
  document: LegalDocument;
  /** The companion legal page, linked at the end. */
  related: { label: string; to: string };
}

/** Shared layout for legal pages: page header, a contents list on desktop, and numbered sections. */
export function LegalPage({ document, related }: Props) {
  const ids = useMemo(() => document.sections.map((section) => section.id), [document]);
  const active = useActiveSection(ids);

  return (
    <>
      <section aria-labelledby="legal-title" className="legal-chrome surface-navy cad-grid">
        <div className="container-x pt-[calc(var(--header-h)+3rem)] pb-12 lg:pt-[calc(var(--header-h)+4rem)] lg:pb-16">
          <Eyebrow>Legal</Eyebrow>
          <h1 id="legal-title" className="display-xl mt-5 max-w-4xl">
            <RevealText delay={60}>{document.title}</RevealText>
          </h1>
          <Reveal delay={200}>
            <p className="lede mt-5 max-w-2xl">{document.intro}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <p className="tech-label">
                Last updated · <time dateTime={document.lastUpdatedIso}>{document.lastUpdated}</time>
              </p>
              <p className="tech-label text-steel-400">{document.sections.length} sections</p>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="surface-light">
        <div className="container-x section-y grid gap-12 lg:grid-cols-12 lg:gap-16">
          <aside className="lg:col-span-4">
            {/* Phones: the list folds away so it never buries the document itself. */}
            <details className="legal-contents-mobile panel p-5 lg:hidden">
              <summary className="tech-label flex min-h-10 cursor-pointer items-center text-steel-100 marker:text-brand-400">
                On this page
              </summary>
              <ol className="mt-4 border-t border-[var(--line)] text-sm">
                {document.sections.map((section, i) => (
                  <li key={section.id} className="border-b border-[var(--line)]">
                    <a
                      href={`#${section.id}`}
                      className="grid grid-cols-[2rem_1fr] items-baseline gap-2 py-3 text-steel-200"
                    >
                      <span className="font-mono text-xs text-brand-400">{pad(i)}</span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </details>

            <nav aria-label="On this page" className="sticky top-[calc(var(--header-h)+2rem)] hidden lg:block">
              <p className="tech-label mb-4">On this page</p>
              <ol className="border-t border-[var(--line)] text-sm">
                {document.sections.map((section, i) => {
                  const current = section.id === active;
                  return (
                    <li key={section.id} className="border-b border-[var(--line)]">
                      <a
                        href={`#${section.id}`}
                        aria-current={current ? 'true' : undefined}
                        className={cn(
                          'grid grid-cols-[0.125rem_2rem_1fr] items-baseline gap-2 py-2.5 transition-colors duration-200 hover:text-steel-50',
                          current ? 'text-steel-50' : 'text-steel-300',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'h-[1.1em] w-0.5 self-center transition-colors duration-200',
                            current ? 'bg-brand-500' : 'bg-transparent',
                          )}
                        />
                        <span className={cn('font-mono text-xs', current ? 'text-brand-400' : 'text-steel-400')}>
                          {pad(i)}
                        </span>
                        <span>{section.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          <article className="legal-doc lg:col-span-8">
            {document.sections.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-title`}
                className="border-t border-[var(--line)] py-10 first:border-t-0 first:pt-0"
              >
                <Reveal>
                  <p className="tech-label flex items-center gap-3">
                    <span className="text-brand-400">{pad(i)}</span>
                  </p>
                  <h2
                    id={`${section.id}-title`}
                    className="legal-heading mt-3 flex items-baseline gap-2 font-display text-2xl font-bold text-steel-50"
                  >
                    {section.title}
                    <a
                      href={`#${section.id}`}
                      aria-label={`Link to this section: ${section.title}`}
                      className="legal-anchor inline-flex min-h-8 min-w-8 items-center justify-center font-mono text-base font-normal text-brand-400 hover:text-brand-500"
                    >
                      #
                    </a>
                  </h2>
                  <div className="mt-4 grid max-w-[68ch] gap-4 leading-relaxed text-steel-300">
                    {section.blocks.map((block, bi) => (
                      <Block key={bi} block={block} />
                    ))}
                  </div>
                </Reveal>
              </section>
            ))}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-8 text-sm text-steel-300">
              <p>
                See also our{' '}
                <Link to={related.to} className={inlineLink}>
                  {related.label}
                </Link>
                , or{' '}
                <Link to="/contact" className={inlineLink}>
                  send us a project request
                </Link>
                .
              </p>
              <a
                href="#legal-title"
                className="legal-back tech-label inline-flex min-h-10 items-center gap-2 hover:text-steel-50"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
                Back to top
              </a>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
