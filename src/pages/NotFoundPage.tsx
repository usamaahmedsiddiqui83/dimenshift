import { ButtonLink } from '../components/ui/ButtonLink';
import { Eyebrow } from '../components/ui/Eyebrow';
import { Reveal } from '../components/ui/Reveal';
import { RevealText } from '../components/ui/RevealText';
import { cta, seo } from '../config/site';
import { useSeo } from '../hooks/useSeo';

export default function NotFoundPage() {
  useSeo(seo.notFound, undefined, true);
  return (
    <section aria-labelledby="nf-title" className="cad-grid flex min-h-[80svh] items-center">
      <div className="container-x pt-[var(--header-h)]">
        <Eyebrow className="text-brand-400">Error 404 · Part not found</Eyebrow>
        <h1 id="nf-title" className="display-xl mt-5 max-w-3xl">
          <RevealText delay={60}>This page isn’t in the assembly.</RevealText>
        </h1>
        <Reveal delay={160}>
          <p className="lede mt-6 max-w-xl">The link may be outdated, or the page may have moved.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/">Back to home</ButtonLink>
            <ButtonLink to={cta.primary.to} variant="secondary">
              {cta.primary.label}
            </ButtonLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
