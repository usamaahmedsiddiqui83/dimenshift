import { useRef, useState } from 'react';
import { projectCategories, projects, type Project } from '../../config/showcase';
import { motion } from '../../config/motion';
import { useEagerImages } from '../../hooks/useEagerImages';
import { useInView } from '../../hooks/useInView';
import { cn } from '../../lib/cn';
import { ImageLightbox, type LightboxItem } from '../media/ImageLightbox';
import { Reveal } from '../ui/Reveal';
import { SectionHeader } from '../ui/SectionHeader';
import { ProjectVisual } from './ProjectVisual';
import { WorkCarousel } from './WorkCarousel';
import './work.css';

function ProjectMediaView({ project, onExpand, sizes }: { project: Project; onExpand: () => void; sizes: string }) {
  const media = project.media;
  if (media.type === 'image') {
    return (
      <button
        type="button"
        onClick={onExpand}
        className="group/media absolute inset-0 block h-full w-full overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-400"
      >
        <span className="sr-only">Enlarge image: </span>
        <img
          src={media.src}
          srcSet={media.srcSet}
          sizes={sizes}
          alt={media.alt}
          width={media.width}
          height={media.height}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-full w-full object-cover"
        />
        {/* Hover veil and expand hint; opacity/translate only, so the image itself never resamples. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(to_top,rgb(5_11_28/0.7),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover/media:opacity-100 group-focus-visible/media:opacity-100"
        />
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 flex translate-y-1.5 items-center gap-2 rounded-full border border-white/20 bg-[#050b1c]/85 px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.08em] text-white uppercase opacity-0 backdrop-blur-md transition-[opacity,translate] duration-300 group-hover/media:translate-y-0 group-hover/media:opacity-100 group-focus-visible/media:translate-y-0 group-focus-visible/media:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7 1h4v4M5 11H1V7M11 1L7 5M1 11l4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          View full size
        </span>
      </button>
    );
  }
  if (media.type === 'video') {
    return (
      <video
        src={media.src}
        poster={media.poster}
        aria-label={media.label}
        muted
        playsInline
        controls
        preload="none"
        className="h-full w-full object-cover"
      />
    );
  }
  return <ProjectVisual kind={media.key} />;
}

const labelFor = (id: string) => projectCategories.find((c) => c.id === id)?.label ?? id;

function ProjectCard({ project: p, onExpand, sizes }: { project: Project; onExpand: () => void; sizes: string }) {
  return (
    <article className="panel group flex h-full flex-col overflow-hidden transition-colors hover:border-[var(--line-strong)]">
      <div
        className={cn(
          'relative border-b border-[var(--line)] bg-ink-900',
          // Images keep their own proportions so no part of the drawing is cropped.
          p.media.type === 'image' ? 'aspect-[1376/768]' : 'cad-grid aspect-[48/34]',
        )}
      >
        <div
          className={cn(
            'absolute inset-0',
            p.media.type !== 'image' &&
              'transition-transform duration-500 ease-[var(--ease-precise)] group-hover:scale-[1.03]',
          )}
        >
          <ProjectMediaView project={p} onExpand={onExpand} sizes={sizes} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="tech-label text-datum-300">{p.categories.map(labelFor).join(' · ')}</p>
        <h3 className="mt-3 font-display text-xl font-semibold">{p.title}</h3>
        <p className="mt-3 text-steel-300">{p.summary}</p>
        <ul className="mt-auto flex flex-wrap gap-2 pt-6" aria-label="Scope">
          {p.scope.map((s) => (
            <li
              key={s}
              className="rounded-[2px] border border-[var(--line)] px-2 py-1 font-mono text-[0.6875rem] tracking-[0.06em] text-steel-300 uppercase"
            >
              {s}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/** Every project image across all disciplines, so the lightbox can browse beyond the current filter. */
const gallery: LightboxItem[] = projects.flatMap((p) =>
  p.media.type === 'image'
    ? [
        {
          id: p.id,
          eyebrow: `${p.kind === 'study' ? 'Illustrative study' : 'Client project'} · ${p.categories.map(labelFor).join(' · ')}`,
          title: p.title,
          src: p.media.src,
          alt: p.media.alt,
          caption: p.media.caption ?? p.summary,
        },
      ]
    : [],
);

export function WorkShowcase() {
  const [enlarged, setEnlarged] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const near = useInView(sectionRef, {
    rootMargin: motion.canvasPreloadMargin,
    once: true,
  });
  useEagerImages(sectionRef, near);

  const expand = (projectId: string) => setEnlarged(gallery.findIndex((g) => g.id === projectId));

  return (
    <section ref={sectionRef} id="work" aria-labelledby="work-title" className="surface-navy section-y overflow-hidden">
      <div className="container-x">
        <SectionHeader
          index="07"
          label="Selected work"
          titleId="work-title"
          title="Selected work and studies."
          lede="Illustrative studies show how typical engineering problems are approached. Client projects are added here as they can be shared."
        />

        <Reveal>
          <WorkCarousel
            items={projects}
            label="Selected work"
            renderCard={(p) => (
              <ProjectCard project={p} onExpand={() => expand(p.id)} sizes="(min-width: 640px) 26rem, 84vw" />
            )}
          />
        </Reveal>
      </div>

      <ImageLightbox items={gallery} index={enlarged} onNavigate={setEnlarged} onClose={() => setEnlarged(null)} />
    </section>
  );
}
