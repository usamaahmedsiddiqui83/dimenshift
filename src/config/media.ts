const poster = (name: string) => ({
  src: `/media/posters/${name}-1280.jpg`,
  srcSet: `/media/posters/${name}-640.jpg 640w, /media/posters/${name}-1280.jpg 1280w`,
});

/**
 * Hero background video. Keep it short, muted and loop-friendly. Its first frame is exported as a
 * light poster (public/media/posters) that shows instantly; the film loads after the page does.
 */
export const heroMedia = {
  video: '/media/hero-desktop.mp4',
  poster: poster('hero-desktop'),
} as const;

/** Background film behind the services page header. */
export const servicesMedia = {
  video: '/media/services-laser-cutting.mp4',
  poster: poster('services-laser'),
} as const;

/**
 * Scroll-driven assembly sequence below the hero: the client's 300-frame PNG export,
 * converted to 1280×720 JPEGs (quality 82) for the web. The frames' own navy backdrop is
 * replaced with the page background, so the section has no background of its own.
 */
export const assemblySequence = {
  path: '/media/sequence/frame-',
  ext: '.jpg',
  count: 300,
} as const;
