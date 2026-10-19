import { Fragment, useRef, type CSSProperties } from 'react';
import { heroMedia } from '../../config/media';
import { brand, cta } from '../../config/site';
import { useOffscreenFlag } from '../../hooks/useOffscreenFlag';
import { BackgroundVideo } from '../media/BackgroundVideo';
import { ButtonLink } from '../ui/ButtonLink';
import './hero.css';

const mediaFrameClass =
  'hero-cine__video absolute inset-0 h-full w-full lg:left-auto lg:w-[82%] lg:[mask-image:linear-gradient(90deg,transparent_0%,black_26%)]';

/** Split so the headline can rise word by word; it stays one sentence for screen readers. */
const heroTitle = 'From Concept to Manufacturing-Ready Product.'.split(' ');

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  useOffscreenFlag(sectionRef);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="hero-cine relative isolate flex min-h-[clamp(640px,100svh,var(--stage-max))] items-end short:min-h-[100svh] overflow-hidden bg-ink-950 lg:items-center"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        {/* Poster and film share one frame, so the slow push-in stays continuous when the film fades in. */}
        <div className={mediaFrameClass}>
          <BackgroundVideo src={heroMedia.video} poster={heroMedia.poster} priority />
        </div>
        <div className="hero-cine__tone absolute inset-0" />
        <div className="hero-cine__grade absolute inset-0" />
        <div className="hero-cine__glow absolute inset-0" />
        <div className="hero-cine__vignette absolute inset-0" />
        <div className="hero-cine__read absolute inset-0" />
        <div className="hero-cine__grain absolute" />
      </div>

      <div className="hero-cine__content container-x w-full pt-[calc(var(--header-h)+2rem)] pb-16 sm:pb-24 lg:pt-[calc(var(--header-h)+3rem)] lg:pb-28 short:pt-[calc(var(--header-h)+1.5rem)] short:pb-10">
        <div className="hero-cine__reveal max-w-[40rem] lg:max-w-[44rem] 2xl:max-w-[50rem]">
          {/* The label is part of the heading: it names what the business does, which search engines weigh. */}
          <h1 id="hero-title">
            <span className="tech-label flex items-center gap-3 text-steel-200">
              <span aria-hidden="true" className="inline-block h-1.5 w-1.5 shrink-0 bg-brand-500" />
              Mechanical product design · 3D CAD engineering
            </span>{' '}
            <span className="display-xl mt-5 block sm:mt-6 short:mt-4">
              {heroTitle.map((word, i) => (
                <Fragment key={`${word}-${i}`}>
                  <span className="hero-cine__word" style={{ '--word-index': i } as CSSProperties}>
                    {word}
                  </span>
                  {i < heroTitle.length - 1 ? ' ' : null}
                </Fragment>
              ))}
            </span>
          </h1>
          <p className="lede mt-5 max-w-[34rem] text-steel-100 sm:mt-6">
            {brand.name} delivers precision-driven mechanical product design and 3D CAD engineering that transforms
            ideas into accurate, functional, production-ready solutions.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap short:mt-6">
            <ButtonLink to={cta.primary.to}>{cta.primary.label}</ButtonLink>
            <ButtonLink to={cta.secondary.to} variant="secondary">
              {cta.secondary.label}
            </ButtonLink>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex"
      >
        <span className="tech-label text-steel-300">Scroll</span>
        <span className="hero-cine__cue block h-10 w-px" />
      </div>
    </section>
  );
}
