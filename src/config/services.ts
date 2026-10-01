export type ServiceVisualKey =
  | 'product-design'
  | 'cad-modeling'
  | 'drawings'
  | 'dfm'
  | 'product-development'
  | 'reverse-engineering'
  | 'optimization';

/** Image shown for a service in the home page accordion and on the services page. */
export interface ServiceImageAsset {
  src: string;
  alt: string;
  /** Short subject line shown over the image. */
  caption: string;
}

const previewBase = (image: ServiceImageAsset) =>
  image.src.replace('/media/services/', '/media/services/previews/').replace(/\.jpg$/, '');

/**
 * Responsive sources for the full, uncropped image: an 800px copy (`<name>-800w.jpg` in previews/)
 * for phones and small panels, the original (1376px wide) for large and dense screens.
 */
export function imageSources(image: ServiceImageAsset) {
  return { src: image.src, srcSet: `${previewBase(image)}-800w.jpg 800w, ${image.src} 1376w` };
}

/**
 * Hover-preview thumbnails for a service image: 300, 450 and 600px wide in the preview card's exact
 * 300:169 frame, built by tools/make-service-previews.ps1 (re-run it after adding or replacing an image).
 */
export function previewSources(image: ServiceImageAsset) {
  const base = previewBase(image);
  return {
    src: `${base}-600.jpg`,
    srcSet: `${base}-300.jpg 300w, ${base}-450.jpg 450w, ${base}-600.jpg 600w`,
  };
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  description: string;
  deliverables: string[];
  useCase: string;
  visual: ServiceVisualKey;
  /** Label shown in the viewport header, mimicking a CAD view readout. */
  viewLabel: string;
  /** Service image; the CAD drawing (`visual`) is shown until one is set. */
  image?: ServiceImageAsset;
  /** Further images shown after `image` in the services page gallery. */
  gallery?: ServiceImageAsset[];
}

/** Every image of a service, in gallery order. */
export function serviceImages(service: Service): ServiceImageAsset[] {
  return service.image ? [service.image, ...(service.gallery ?? [])] : [];
}

/**
 * CLIENT: confirm every service below is offered. Remove any entry that is not —
 * the brief lists CAD Conversion / Reverse Engineering as "where actually offered".
 */
export const services: Service[] = [
  {
    id: 'mechanical-product-design',
    title: 'Mechanical Product Design',
    summary: 'Product architecture that works before detail begins.',
    description:
      'Turn a requirement into a mechanism: part layout, motion, load paths and assembly strategy are defined before detailed CAD, so the design is built on decisions rather than guesses.',
    deliverables: [
      'Concept layouts and design options',
      'Mechanism and part architecture',
      'Material and process direction',
      'Design review notes',
    ],
    useCase: 'You have a validated need or a rough sketch and need an engineered product architecture.',
    visual: 'product-design',
    viewLabel: 'CONCEPT · MECHANISM',
    image: {
      src: '/media/services/mechanical-product-design-photo.jpg',
      alt: 'An engineering desk where a product takes shape: a gripper mechanism prototype and an early 3D-printed layout, concept sketches on a legal pad, and monitors showing the mechanism in CAD beside a project timeline.',
      caption: 'Concept sketches, a working mechanism and its CAD architecture',
    },
    gallery: [
      {
        src: '/media/services/mechanical-product-design-photo-2.jpg',
        alt: 'A design desk in a machine shop: an exploded gearbox assembly in CAD on the monitor, machined parts laid out on the desk and a printed layout drawing marked up in red during review.',
        caption: 'Design review: exploded assembly, real parts and marked-up layout',
      },
    ],
  },
  {
    id: '3d-cad-modeling',
    title: '3D CAD Modeling',
    summary: 'Parametric parts and assemblies with clear design intent.',
    description:
      'Part and assembly models built with controlled relationships, so a change to a key dimension updates the design cleanly instead of breaking it.',
    deliverables: [
      'Parametric part models',
      'Structured assemblies',
      'Neutral exports (STEP, IGES, STL)',
      'Rendered review views',
    ],
    useCase: 'You have drawings, sketches or a prototype and need a clean, editable 3D model.',
    visual: 'cad-modeling',
    viewLabel: 'MODEL · PARAMETRIC',
    image: {
      src: '/media/services/3d-cad-modeling-photo.jpg',
      alt: 'An engineer editing a dimension on a robotic arm assembly in CAD, with the feature tree of parts, sketches and mates open beside the model.',
      caption: 'Driving a parametric assembly from its feature tree',
    },
    gallery: [
      {
        src: '/media/services/3d-cad-modeling-photo-2.jpg',
        alt: 'An engineer shaping a detailed actuator assembly in CAD with a 3D mouse, while a 3D-printed prototype of a housing sits on a scale beside the monitor.',
        caption: 'Detailed assembly model and a 3D-printed prototype from it',
      },
    ],
  },
  {
    id: 'engineering-drawings',
    title: 'Engineering Drawings',
    summary: 'Documentation a supplier can quote and build from.',
    description:
      'Part and assembly drawings that define dimensions, tolerances, materials and notes, so manufacturing partners can quote accurately and produce consistently.',
    deliverables: [
      'Part and assembly drawings',
      'Dimensions, tolerances and notes',
      'Section and detail views',
      'Bill of materials',
    ],
    useCase: 'Your design exists in CAD but cannot go to suppliers without complete documentation.',
    visual: 'drawings',
    viewLabel: 'SHEET · SECTION A–A',
    image: {
      src: '/media/services/engineering-drawings-photo.jpg',
      alt: 'A production drawing of a housing laid on a drafting table, with dimensioned views, section A–A, geometric tolerance frames and a title block, next to the machined part and a caliper.',
      caption: 'Housing drawing with sections, GD&T and title block',
    },
    gallery: [
      {
        src: '/media/services/engineering-drawings-photo-2.jpg',
        alt: 'A drawing of a planetary gear set on screen with its section views A–A and B–B and a title block, with the gear set itself, a caliper and a micrometer on the bench.',
        caption: 'Gear set drawing with section views, checked against the part',
      },
    ],
  },
  {
    id: 'design-for-manufacturing',
    title: 'Design for Manufacturing (DFM)',
    summary: 'Parts shaped for the process that will make them.',
    description:
      'Review and refine geometry for the intended manufacturing route — wall thickness, draft, radii, tool access and part count — before tooling or machining costs are committed.',
    deliverables: [
      'Manufacturability review',
      'Geometry corrections',
      'Part consolidation options',
      'Revised CAD and drawings',
    ],
    useCase: 'Your prototype works, but quotes are high or suppliers keep flagging problems.',
    visual: 'dfm',
    viewLabel: 'SHOP FLOOR · CNC',
    image: {
      src: '/media/services/design-for-manufacturing-photo.jpg',
      alt: 'A machined housing on a shop-floor bench next to its drawing, a height gauge and a laptop showing the part in CAD, while a machinist runs a CNC mill in the background.',
      caption: 'Design checked against the machining route on the shop floor',
    },
    gallery: [
      {
        src: '/media/services/design-for-manufacturing-photo-2.jpg',
        alt: 'An engineer in a workshop reviewing a casting design on a pen display, with the cast housing marked up for changes beside precision measuring tools and a 3D printer.',
        caption: 'Casting reviewed and marked up for manufacture',
      },
    ],
  },
  {
    id: 'product-development',
    title: 'Product Development',
    summary: 'One structured path from idea to release package.',
    description:
      'A staged development process with defined reviews and deliverables at each gate, carrying a product from first concept through to a manufacturing-ready design package.',
    deliverables: [
      'Staged development plan',
      'Iterative CAD revisions',
      'Prototype-ready files',
      'Release documentation package',
    ],
    useCase: 'You are a startup or product team that needs one engineering partner for the whole journey.',
    visual: 'product-development',
    viewLabel: 'STAGE GATES · R&D',
    image: {
      src: '/media/services/product-development-photo.jpg',
      alt: 'An R&D lab where a product moves through a stage-gate process shown on screen, concept, design, validation and release, with sketches, a test rig, prototype headphones and the finished product on the bench.',
      caption: 'Concept to release through reviewed development gates',
    },
    gallery: [
      {
        src: '/media/services/product-development-photo-2.jpg',
        alt: 'A product team reviewing R&D milestones on a gate-process board, with early models, a working prototype and the packaged product laid out along the bench.',
        caption: 'From early models to packaged product, milestone by milestone',
      },
    ],
  },
  {
    id: 'cad-conversion-reverse-engineering',
    title: 'CAD Conversion & Reverse Engineering',
    summary: 'Legacy parts and drawings rebuilt as editable CAD.',
    description:
      'Rebuild paper drawings, 2D files, legacy formats or supplied measurement data as accurate, editable 3D models with updated documentation.',
    deliverables: [
      '2D-to-3D conversion',
      'Legacy file rebuild',
      'Models from supplied measurements or scan data',
      'Updated drawings',
    ],
    useCase: 'A part is still in use but has no usable CAD — only a drawing, an old file or the part itself.',
    visual: 'reverse-engineering',
    viewLabel: 'CONVERT · PART → CAD',
    image: {
      src: '/media/services/cad-conversion-reverse-engineering-photo.jpg',
      alt: 'A worn cast flange beside its aged paper drawing, measured with a portable inspection arm and rebuilt as a clean, editable 3D model on the monitor.',
      caption: 'Legacy drawing and worn part rebuilt as editable CAD',
    },
    gallery: [
      {
        src: '/media/services/cad-conversion-reverse-engineering-photo-2.jpg',
        alt: 'A worn cast bracket being captured with a handheld 3D scanner beside its old drawing, and the rebuilt bracket as reverse-engineered CAD on a monitor.',
        caption: 'Worn bracket 3D-scanned and rebuilt as CAD',
      },
    ],
  },
  {
    id: 'design-optimization',
    title: 'Design Optimization',
    summary: 'Lighter, simpler, faster to build — function intact.',
    description:
      'Refine an existing design to reduce mass, part count, assembly effort or production cost while protecting the functions and interfaces that matter.',
    deliverables: [
      'Opportunity review',
      'Geometry and assembly refinements',
      'Before / after comparison',
      'Updated CAD package',
    ],
    useCase: 'Your product is in use, and the next revision needs to be lighter, simpler or cheaper to build.',
    visual: 'optimization',
    viewLabel: 'REVISION · A / B',
    image: {
      src: '/media/services/design-optimization-photo.jpg',
      alt: 'A traditional machined bracket and a lighter, organically shaped optimized bracket mounted side by side, with the monitor comparing the two designs and their masses.',
      caption: 'Original and optimized bracket compared side by side',
    },
    gallery: [
      {
        src: '/media/services/design-optimization-photo-2.jpg',
        alt: 'A traditional aluminium bracket and a lighter topology-optimized bracket on a workbench, with a screen comparing their stress results and mass before and after.',
        caption: 'Topology optimization: stress and mass before and after',
      },
    ],
  },
];
