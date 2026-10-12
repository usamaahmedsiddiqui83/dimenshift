import { useSearchParams } from 'react-router-dom';
import { ProjectIntakeForm } from '../components/forms/ProjectIntakeForm';
import { Eyebrow } from '../components/ui/Eyebrow';
import { EmailLink } from '../components/ui/EmailLink';
import { Reveal } from '../components/ui/Reveal';
import { RevealText } from '../components/ui/RevealText';
import { services } from '../config/services';
import { contactDetails, seo } from '../config/site';
import { contactJsonLd } from '../config/structuredData';
import { useHydrated } from '../hooks/useHydrated';
import { useSeo } from '../hooks/useSeo';

const headings = {
  quote: { title: 'Request a quote.', eyebrow: 'Get a quote' },
  discuss: { title: 'Discuss your project.', eyebrow: 'Project conversation' },
  default: { title: 'Start your project.', eyebrow: 'Project intake' },
};

/** The formats the intake form screens for, grouped the way people think about them. */
const acceptedFiles = [
  { label: 'Drawings', formats: ['PDF', 'DWG', 'DXF'] },
  { label: 'Models', formats: ['STEP', 'IGES', 'STL'] },
  { label: 'Photos & sketches', formats: ['PNG', 'JPG', 'WEBP'] },
  { label: 'Archives', formats: ['ZIP'] },
];

const nextSteps = [
  { title: 'Review', text: 'Your description and files are reviewed against the engineering work involved.' },
  { title: 'Clarify', text: 'We follow up with questions to confirm requirements, constraints and priorities.' },
  { title: 'Propose', text: 'You receive a recommended scope with deliverables and a quote.' },
];

export default function ContactPage() {
  useSeo(seo.contact, contactJsonLd);
  const [params] = useSearchParams();
  // The pre-rendered page has no query string; read it only once the browser has taken over.
  const hydrated = useHydrated();
  const intent = hydrated ? params.get('intent') : null;
  const heading = intent === 'quote' || intent === 'discuss' ? headings[intent] : headings.default;
  const serviceParam = hydrated ? params.get('service') : null;
  const initialService = services.some((s) => s.id === serviceParam) ? serviceParam! : undefined;

  const hasContact = contactDetails.email;

  return (
    <>
      <section aria-labelledby="contact-title" className="surface-navy cad-grid">
        <div className="container-x pt-[calc(var(--header-h)+4rem)] pb-14 lg:pt-[calc(var(--header-h)+6rem)] lg:pb-20">
          <Eyebrow>{heading.eyebrow}</Eyebrow>
          <h1 id="contact-title" className="display-xl mt-5 max-w-4xl">
            <RevealText delay={60}>{heading.title}</RevealText>
          </h1>
          <Reveal delay={160}>
            <p className="lede mt-6 max-w-2xl">
              Tell us about the product and share any sketches, drawings or CAD you have. Rough information is fine —
              the first step is understanding the problem.
            </p>
          </Reveal>
          {contactDetails.email && (
            <Reveal delay={220}>
              <p className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-steel-300">
                <span className="tech-label">Prefer email?</span>
                <EmailLink
                  email={contactDetails.email}
                  className="inline-flex min-h-10 items-center gap-2 rounded-[2px] border border-[var(--line-strong)] px-3 text-steel-50 transition-colors hover:border-brand-400 hover:text-brand-300"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <rect x="1.5" y="3.5" width="13" height="9" stroke="currentColor" strokeWidth="1.3" />
                    <path d="m2 4 6 4.5L14 4" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                  {contactDetails.email}
                </EmailLink>
              </p>
            </Reveal>
          )}
        </div>
      </section>

      <div className="surface-light">
        <div className="container-x section-y grid gap-14 !pt-14 lg:grid-cols-12 lg:gap-16 lg:!pt-20">
          <div className="order-2 lg:order-none lg:col-span-8">
            <ProjectIntakeForm initialService={initialService} />
          </div>

          <aside className="order-1 lg:order-none lg:col-span-4" aria-label="About the process">
            <div className="grid gap-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              {hasContact && (
                <div className="panel border-brand-500/40 bg-brand-500/5 p-6">
                  <h2 className="tech-label text-steel-100">Direct contact</h2>
                  <address className="mt-4 grid gap-2 text-sm not-italic">
                    {contactDetails.email && (
                      <EmailLink
                        email={contactDetails.email}
                        className="inline-flex min-h-10 items-center font-medium text-steel-50 underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-brand-500"
                      >
                        {contactDetails.email}
                      </EmailLink>
                    )}
                    {contactDetails.hours && <span className="text-steel-400">{contactDetails.hours}</span>}
                  </address>
                  <p className="mt-3 text-sm text-steel-300">
                    The form below reaches the same place, and keeps your files with your description.
                  </p>
                </div>
              )}

              <div className="panel p-6">
                <h2 className="tech-label text-steel-100">What happens next</h2>
                <ol className="mt-5 grid gap-5">
                  {nextSteps.map((step, i) => (
                    <li key={step.title} className="grid grid-cols-[2rem_1fr] gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-datum-400/60 font-mono text-xs text-datum-300">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-medium text-steel-50">{step.title}</p>
                        <p className="mt-1 text-sm text-steel-300">{step.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="panel p-6">
                <h2 className="tech-label text-steel-100">Accepted files</h2>
                <dl className="mt-4 grid gap-3 text-sm">
                  {acceptedFiles.map((group) => (
                    <div key={group.label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <dt className="text-steel-200">{group.label}</dt>
                      <dd className="font-mono text-xs tracking-[0.08em] text-steel-400 uppercase">
                        {group.formats.join(' · ')}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
