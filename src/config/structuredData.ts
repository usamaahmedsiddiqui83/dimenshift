/**
 * Schema.org JSON-LD for the pages that carry it. Written into the pre-rendered HTML at build time
 * (scripts/prerender.mjs) and kept in sync by useSeo on client-side navigation.
 */
import { services } from './services';
import { brand, contactDetails, seo, siteUrl, socialLinks } from './site';

const orgId = `${siteUrl}/#organization`;
const websiteId = `${siteUrl}/#website`;

/** Logo for Google's knowledge panel: original colours, readable on white, at least 112 px tall. */
const logo = {
  '@type': 'ImageObject',
  url: `${siteUrl}/brand/logo-full.png`,
  width: 527,
  height: 112,
};

const organization = {
  '@type': 'Organization',
  '@id': orgId,
  name: brand.name,
  alternateName: ['DIMENSHIFT', 'DimenShift'],
  url: `${siteUrl}/`,
  logo,
  image: logo,
  slogan: brand.tagline,
  description: seo.home.description,
  ...(contactDetails.email && {
    email: contactDetails.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      email: contactDetails.email,
      url: `${siteUrl}${seo.contact.path}`,
    },
  }),
  ...(socialLinks.length > 0 && { sameAs: socialLinks.map((link) => link.href) }),
  knowsAbout: [
    'Mechanical engineering',
    'Mechanical product design',
    '3D CAD modeling',
    'Engineering drawings',
    'Design for manufacturing',
    'Reverse engineering',
    'CAD conversion',
  ],
  makesOffer: services.map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: s.title, description: s.summary, url: `${siteUrl}${seo.services.path}#${s.id}` },
  })),
};

/**
 * WebSite tells Google the site's name, shown above the URL in results instead of the bare domain.
 * alternateName must never include the domain itself, or Google may show that instead.
 */
const website = {
  '@type': 'WebSite',
  '@id': websiteId,
  url: `${siteUrl}/`,
  name: brand.name,
  alternateName: ['DIMENSHIFT', 'DimenShift'],
  description: seo.home.description,
  publisher: { '@id': orgId },
  inLanguage: 'en',
};

export const homeJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@graph': [website, organization],
};

/** Each service as an offering of the business, in page order. */
export const servicesJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ItemList',
      name: `${brand.name} engineering services`,
      itemListElement: services.map((service, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          name: service.title,
          serviceType: service.title,
          description: service.description,
          provider: { '@id': orgId },
          url: `${siteUrl}${seo.services.path}#${service.id}`,
        },
      })),
    },
    breadcrumbs('Services', seo.services.path),
  ],
};

export const contactJsonLd: Record<string, unknown> = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ContactPage',
      name: seo.contact.title,
      url: `${siteUrl}${seo.contact.path}`,
      about: { '@id': orgId },
    },
    breadcrumbs('Contact', seo.contact.path),
  ],
};

function breadcrumbs(name: string, path: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name, item: `${siteUrl}${path}` },
    ],
  };
}
