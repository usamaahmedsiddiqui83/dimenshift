import { useEffect, useState } from 'react';
import { BackgroundVideo } from '../components/media/BackgroundVideo';
import { ImageLightbox, type LightboxItem } from '../components/media/ImageLightbox';
import { ServiceGallery } from '../components/services/ServiceGallery';
import { ServicesSubnav } from '../components/services/ServicesSubnav';
import { ServiceVisual } from '../components/services/ServiceVisual';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Eyebrow } from '../components/ui/Eyebrow';
import { LineDraw } from '../components/ui/LineDraw';
import { Reveal } from '../components/ui/Reveal';
import { RevealText } from '../components/ui/RevealText';
import { servicesMedia } from '../config/media';
import { serviceImages, services } from '../config/services';
import { cta, seo } from '../config/site';
import { servicesJsonLd } from '../config/structuredData';
import { useSeo } from '../hooks/useSeo';
import { cn } from '../lib/cn';

const pad = (i: number) => String(i + 1).padStart(2, '0');

/** Every image of every service, in page order, so the enlarged view can browse them all. */
const lightboxEntries = services.flatMap((service, serviceIndex) =>
  serviceImages(service).map((image, imageIndex, all) => ({
    serviceIndex,
    imageIndex,
    item: {
      id: image.src,
      eyebrow: `${pad(serviceIndex)} · ${service.viewLabel}${all.length > 1 ? ` · ${imageIndex + 1} / ${all.length}` : ''}`,
      title: service.title,
      src: image.src,
      alt: image.alt,
      caption: image.caption,
    } satisfies LightboxItem,
  })),
);
const lightboxItems = lightboxEntries.map((entry) => entry.item);

export default function ServicesPage() {
  useSeo(seo.services, servicesJsonLd);
  const [enlarged, setEnlarged] = useState<number | null>(null);

  // Section jumps land below both the header and the sticky service bar.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    root.style.scrollPaddingTop = 'calc(var(--header-h) + 76px)';
    return () => {
      root.style.scrollPaddingTop = previous;
    };
  }, []);

  return (
    <>
      <section
        id="services-hero"
        aria-labelledby="services-page-title"
        className="surface-navy relative isolate overflow-hidden"
      >
        {/* Background film, graded and scrimmed so the text stays readable over it. */}
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <BackgroundVideo
            src={servicesMedia.video}
            poster={servicesMedia.poster}
            priority
            className="[filter:saturate(0.82)_contrast(1.12)_brightness(0.7)]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgb(8_18_48/0.95)_0%,rgb(8_18_48/0.78)_48%,rgb(8_18_48/0.55)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_25%_40%,transparent_35%,rgb(5_11_28/0.72)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,var(--color-ink-950),transparent)]" />
        </div>
        <div className="container-x pt-[calc(var(--header-h)+2.5rem)] pb-12 lg:pt-[calc(var(--header-h)+3.5rem)] lg:pb-14">
          <div className="max-w-3xl">
            <Eyebrow>Services</Eyebrow>
            <h1 id="services-page-title" className="display-xl mt-5">
              <RevealText delay={60}>{`${services.length} services. One engineering workflow.`}</RevealText>
            </h1>
            <Reveal delay={200}>
              <p className="lede mt-5 max-w-xl">
                From first concept to a manufacturing-ready release. Choose a single service, or connect them into one
                development program.
              </p>
            </Reveal>
            <Reveal delay={320} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink to={cta.primary.to}>{cta.primary.label}</ButtonLink>
              <ButtonLink to={`#${services[0].id}`} variant="secondary">
                Explore services
              </ButtonLink>
            </Reveal>
          </div>

          {/* Compact jump links: service names only — each section below carries the detail. */}
          <nav aria-label="Services on this page" className="mt-10 lg:mt-12">
            <div className="flex items-center gap-4">
              <span className="tech-label shrink-0">Jump to a service</span>
              <LineDraw tone="line" delay={400} className="flex-1" />
            </div>
            <ul className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
              {services.map((service, i) => (
                <li key={service.id} className="shrink-0">
                  <Reveal delay={450 + i * 60}>
                    <a
                      href={`#${service.id}`}
                      className="inline-flex items-center gap-2.5 rounded-full border border-[var(--line-strong)] bg-white/[0.04] px-4 py-2 text-sm whitespace-nowrap text-steel-100 backdrop-blur-sm transition-colors duration-200 hover:border-brand-400 hover:bg-white/10 hover:text-steel-50"
                    >
                      <span className="font-mono text-xs text-brand-400">{pad(i)}</span>
                      {service.title}
                    </a>
                  </Reveal>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <ServicesSubnav heroId="services-hero" />

      {services.map((service, i) => (
        <section
          key={service.id}
          id={service.id}
          aria-labelledby={`${service.id}-title`}
          className={cn('section-y', i % 2 === 0 ? 'surface-light' : 'surface-mist')}
        >
          <div className="container-x grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className={cn('lg:col-span-6', i % 2 === 1 && 'lg:order-2')}>
              <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
                {service.image ? (
                  <ServiceGallery
                    service={service}
                    images={serviceImages(service)}
                    onExpand={(imageIndex) =>
                      setEnlarged(lightboxEntries.findIndex((e) => e.serviceIndex === i && e.imageIndex === imageIndex))
                    }
                  />
                ) : (
                  <div className="panel brackets overflow-hidden">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-2.5">
                      <span className="tech-label">Viewport</span>
                      <span className="tech-label text-datum-300">{service.viewLabel}</span>
                    </div>
                    <div className="cad-grid aspect-[4/3] bg-ink-900 p-2 sm:p-4">
                      <ServiceVisual kind={service.visual} />
                    </div>
                  </div>
                )}
              </div>
            </Reveal>

            <div className="lg:col-span-6">
              <Eyebrow index={pad(i)}>Service</Eyebrow>
              <h2 id={`${service.id}-title`} className="display-md mt-4">
                <RevealText delay={60}>{service.title}</RevealText>
              </h2>
              <Reveal delay={120}>
                <p className="lede mt-4">{service.summary}</p>
                <p className="mt-6 text-steel-300">{service.description}</p>

                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  <div>
                    <h3 className="tech-label mb-3">What you receive</h3>
                    <ul className="grid gap-2 text-sm text-steel-100">
                      {service.deliverables.map((deliverable) => (
                        <li key={deliverable} className="flex gap-3">
                          <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-datum-400" />
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="tech-label mb-3">When this applies</h3>
                    <p className="text-sm text-steel-200">{service.useCase}</p>
                  </div>
                </div>

                <ButtonLink to={`/contact?service=${service.id}`} variant="secondary" className="mt-10">
                  Discuss this service
                </ButtonLink>
              </Reveal>
            </div>
          </div>
        </section>
      ))}

      <section aria-labelledby="services-cta-title" className="surface-brand section-y">
        <div className="container-x">
          <h2 id="services-cta-title" className="display-lg max-w-3xl">
            <RevealText>Not sure which service you need?</RevealText>
          </h2>
          <Reveal delay={120}>
            <p className="lede mt-6 max-w-2xl">
              Describe the product and share whatever exists — a sketch, a drawing, a prototype or a CAD file. The scope
              comes back with the engineering work set out clearly.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <ButtonLink to={cta.primary.to}>{cta.primary.label}</ButtonLink>
              <ButtonLink to={cta.secondary.to} variant="secondary">
                {cta.secondary.label}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <ImageLightbox items={lightboxItems} index={enlarged} onNavigate={setEnlarged} onClose={() => setEnlarged(null)} />
    </>
  );
}
