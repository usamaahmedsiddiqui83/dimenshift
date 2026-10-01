import { services } from '../../config/services';
import { ImageLightbox, type LightboxItem } from '../media/ImageLightbox';

const pad = (i: number) => String(i + 1).padStart(2, '0');

/** Every service that has an image, keeping its position in the full services list. */
const gallery = services.flatMap((service, index) => (service.image ? [{ service, image: service.image, index }] : []));

const items: LightboxItem[] = gallery.map(({ service, image, index }) => ({
  id: image.src,
  eyebrow: `${pad(index)} · ${service.viewLabel}`,
  title: service.title,
  src: image.src,
  alt: image.alt,
  caption: image.caption,
}));

interface Props {
  /** Index into `services` of the image to show; null keeps the dialog closed. */
  index: number | null;
  onNavigate: (index: number) => void;
  onClose: () => void;
}

/** The service images in the shared lightbox, addressed by service index. */
export function ServiceLightbox({ index, onNavigate, onClose }: Props) {
  const position = gallery.findIndex((item) => item.index === index);
  return (
    <ImageLightbox
      items={items}
      index={position >= 0 ? position : null}
      onNavigate={(p) => onNavigate(gallery[p].index)}
      onClose={onClose}
    />
  );
}
