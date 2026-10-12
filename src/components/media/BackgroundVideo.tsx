import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';

type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };

/** Data saver or a slow connection: the poster alone is the better experience. */
function prefersLightMedia() {
  if (typeof navigator === 'undefined') return false; // pre-rendering at build time
  const connection = (navigator as NavigatorWithConnection).connection;
  return connection?.saveData === true || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType ?? '');
}

/** Calls back once the page has finished loading and the main thread is idle. */
function afterPageSettles(callback: () => void) {
  let idle = 0;
  let timer = 0;
  const schedule = () => {
    // Safari has no requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(callback, { timeout: 2000 });
    else timer = setTimeout(callback, 300);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    if (idle) window.cancelIdleCallback?.(idle);
    clearTimeout(timer);
  };
}

export interface VideoPoster {
  src: string;
  srcSet: string;
}

interface Props {
  src: string;
  /** The film's first frame; shown at once and kept while the video loads. */
  poster: VideoPoster;
  /** Applied to both the poster and the video. */
  className?: string;
  /** Set for above-the-fold videos: the poster is then the page's main image. */
  priority?: boolean;
}

/**
 * Muted, looping background film that never delays the page. The first frame shows immediately as
 * a lightweight poster; the video itself is only requested after the page has loaded and the browser
 * is idle, then fades in over the poster. It plays only while on screen. Visitors with reduced
 * motion, data saver or a slow connection keep the poster and never download the video.
 */
export function BackgroundVideo({ src, poster, className, priority = false }: Props) {
  const reducedMotion = useReducedMotion();
  const [light] = useState(prefersLightMedia);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const wantsVideo = !light && !reducedMotion;

  useEffect(() => {
    if (!wantsVideo) return;
    return afterPageSettles(() => setLoad(true));
  }, [wantsVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    // A cached video can be ready before React attaches the loadeddata listener.
    if (video.readyState >= 2) setReady(true);
    let visible = true;
    const sync = () => {
      if (visible) video.play().catch(() => undefined);
      else video.pause();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(video);
    sync();
    return () => observer.disconnect();
  }, [load, wantsVideo]);

  return (
    <>
      <img
        src={poster.src}
        srcSet={poster.srcSet}
        sizes="100vw"
        alt=""
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
      />
      {wantsVideo && load && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          onLoadedData={() => setReady(true)}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            ready ? 'opacity-100' : 'opacity-0',
            className,
          )}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </>
  );
}
