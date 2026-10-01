/**
 * Site-wide business configuration.
 *
 * Every value marked CLIENT is missing from the brief and must be supplied by the
 * client. Nothing here may be invented: fields left `null` are simply not rendered.
 */

export const brand = {
  /** Business name as shown on the brand board. Used in titles, footer, structured data. */
  name: 'DIMENSHIFT',
  tagline: 'From Dimension to Reality.',
  /** Short descriptor used alongside the name in page titles. */
  descriptor: 'Mechanical Product Design & 3D CAD Engineering',
  /**
   * Client artwork in public/brand, cut into two lockups (see components/brand/Logo.tsx).
   * Reversed versions are used on the site's navy surfaces; the original-colour files are there
   * for light backgrounds and print.
   */
  logo: {
    src: '/brand/logo-compact-reversed.png' as string | null,
    width: 378,
    height: 80,
  },
} as const;

/** CLIENT: set VITE_SITE_URL at build time (e.g. https://www.example.com) for canonical/OG URLs and the sitemap. */
export const siteUrl: string = (import.meta.env.VITE_SITE_URL ?? '').replace(/\/$/, '');

/** CLIENT: real contact details. Null values are not rendered anywhere. */
export const contactDetails = {
  email: 'contact@dimenshift.com' as string | null,
  address: null as string | null,
  hours: null as string | null,
};

/** CLIENT: social/profile links, e.g. { label: 'LinkedIn', href: 'https://…' }. */
export const socialLinks: { label: string; href: string }[] = [];

export interface NavItem {
  label: string;
  to: string;
}

export const navigation: NavItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Services', to: '/services' },
  { label: 'Process', to: '/#process' },
  { label: 'Work', to: '/#work' },
  { label: 'About', to: '/#about' },
  { label: 'Contact', to: '/contact' },
];

export const cta = {
  primary: { label: 'Get a Quote', to: '/contact?intent=quote' },
  secondary: { label: 'Discuss Your Project', to: '/contact?intent=discuss' },
  submit: 'Submit Project Request',
} as const;

export interface PageSeo {
  title: string;
  description: string;
  path: string;
}

export const seo = {
  home: {
    title: `${brand.descriptor} | ${brand.name}`,
    description:
      'Mechanical product design and 3D CAD engineering from concept to manufacturing-ready product: CAD modeling, engineering drawings, design for manufacturing and product development.',
    path: '/',
  },
  services: {
    title: `Engineering Services in Detail | ${brand.name}`,
    description:
      'Mechanical product design, 3D CAD modeling, engineering drawings, design for manufacturing, product development, CAD conversion and reverse engineering, and design optimization — what each service involves and what you receive.',
    path: '/services',
  },
  contact: {
    title: `Start a Project — Request a Quote | ${brand.name}`,
    description:
      'Send your product idea, sketches or CAD files for a mechanical design and 3D CAD engineering quote. Accepts STEP, IGES, DWG, DXF, STL, PDF and images.',
    path: '/contact',
  },
  privacy: {
    title: `Privacy Policy | ${brand.name}`,
    description: `How ${brand.name} collects, uses and protects personal information and project files shared through this website.`,
    path: '/privacy-policy',
  },
  terms: {
    title: `Terms & Conditions | ${brand.name}`,
    description: `The terms that apply to using the ${brand.name} website and sending a project request.`,
    path: '/terms-and-conditions',
  },
  notFound: {
    title: `Page Not Found | ${brand.name}`,
    description: 'The page you were looking for could not be found.',
    path: '/404',
  },
} satisfies Record<string, PageSeo>;
