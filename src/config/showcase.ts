export type ProjectVisualKey = 'gear-reducer' | 'enclosure-dfm' | 'bracket-rebuild';

export type ProjectMedia =
  | { type: 'visual'; key: ProjectVisualKey }
  | {
      type: 'image';
      src: string;
      /** Optional responsive candidates, e.g. "a-800.jpg 800w, a-1376.jpg 1376w". */
      srcSet?: string;
      alt: string;
      /** Short line shown under the image when it is enlarged. */
      caption?: string;
      width: number;
      height: number;
    }
  | { type: 'video'; src: string; poster: string; label: string };

export interface ProjectCategory {
  id: string;
  label: string;
}

export interface Project {
  id: string;
  title: string;
  /** Compact name for the work index. */
  short: string;
  /**
   * 'study'  — illustrative work created to demonstrate a capability (always labeled as such).
   * 'client' — real client work; only add with the client's permission.
   */
  kind: 'study' | 'client';
  categories: string[];
  summary: string;
  scope: string[];
  media: ProjectMedia;
}

export const projectCategories: ProjectCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'cad', label: '3D CAD' },
  { id: 'drawings', label: 'Drawings' },
  { id: 'dfm', label: 'DFM' },
  { id: 'reverse', label: 'Reverse engineering' },
];

const workImage = (name: string) => ({
  src: `/media/work/${name}-1376.webp`,
  srcSet: `/media/work/${name}-800.webp 800w, /media/work/${name}-1376.webp 1376w`,
  width: 1376,
  height: 768,
});

/**
 * Shown in the Work section's carousel, in this order.
 * CLIENT: replace or extend with real projects. Real work can use 'image' or 'video'
 * media without any component changes.
 */
export const projects: Project[] = [
  {
    id: 'parallel-shaft-reducer',
    short: 'Gear reducer',
    title: 'Parallel-shaft gear reducer',
    kind: 'study',
    categories: ['cad', 'drawings'],
    summary:
      'The assembly featured on this site: a single-stage reducer modeled part-by-part, with an exploded view, section review and drawing set.',
    scope: ['Part & assembly CAD', 'Exploded view', 'Section review', 'Assembly drawing'],
    media: {
      type: 'image',
      ...workImage('reducer-workbench'),
      alt: 'An engineering desk with a parallel-shaft gear reducer housing open on a mat, its gears exposed, beside two monitors: one showing the reducer in CAD, the other its multi-view drawing with section A–A and a parts list.',
      caption: 'Physical reducer, its CAD assembly and the section drawing side by side',
    },
  },
  {
    id: 'sheet-metal-enclosure',
    short: 'Sheet-metal enclosure',
    title: 'Sheet-metal enclosure',
    kind: 'study',
    categories: ['dfm', 'cad'],
    summary:
      'An enclosure concept reviewed for bend relief, hole-to-edge distance and flat-pattern layout before release.',
    scope: ['DFM review', 'Flat pattern', 'Revised CAD'],
    media: {
      type: 'image',
      ...workImage('enclosure-workbench'),
      alt: 'A workshop bench with a formed sheet-metal enclosure, fastener trays and marked-up drawings, in front of two monitors: one showing the flat pattern, the other the 3D enclosure with color-coded DFM review callouts.',
      caption: 'Formed enclosure, flat pattern and DFM-annotated 3D model',
    },
  },
  {
    id: 'legacy-bracket',
    short: 'Legacy bracket',
    title: 'Legacy mounting bracket',
    kind: 'study',
    categories: ['reverse', 'drawings'],
    summary:
      'A bracket that existed only as a scanned paper drawing, rebuilt as a parametric model with an updated drawing.',
    scope: ['2D → 3D conversion', 'Parametric rebuild', 'Updated drawing'],
    media: {
      type: 'image',
      ...workImage('bracket-workbench'),
      alt: 'An engineer measuring a worn cast mounting bracket with a digital micrometer, with the original paper drawing on the bench and the rebuilt 3D model and section view on the monitor.',
      caption: 'Measuring the worn original and rebuilding it as a CAD model with a new drawing',
    },
  },
  {
    id: 'linear-actuator',
    short: 'Linear actuator',
    title: 'Ball-screw linear actuator',
    kind: 'study',
    categories: ['cad'],
    summary:
      'A motor-driven linear module: extruded body, preloaded guide carriage and ball screw, modeled as a complete, configurable assembly.',
    scope: ['Assembly CAD', 'Motion layout', 'Standard parts'],
    media: {
      type: 'image',
      ...workImage('actuator-workbench'),
      alt: 'A ball-screw linear actuator on an engineering desk in front of two monitors: one showing its 3D CAD model with stroke, screw and carriage callouts, the other its bill of materials and drawing views.',
      caption: 'The physical actuator beside its CAD assembly, BOM and drawing',
    },
  },
  {
    id: 'molded-enclosure',
    short: 'Molded enclosure',
    title: 'Injection-molded enclosure',
    kind: 'study',
    categories: ['dfm', 'cad'],
    summary:
      'A two-part plastic housing reviewed for molding: draft on every wall, uniform wall thickness, ribbed screw bosses and a straight-pull tool.',
    scope: ['DFM review', 'Draft analysis', 'Boss & rib design'],
    media: {
      type: 'image',
      ...workImage('molded-workbench'),
      alt: 'A black injection-molded enclosure, lid and base, on a workbench in front of two monitors: one showing a color-coded draft analysis of the part, the other a section view of its bosses and ribs, with DFM notes in a sketchbook.',
      caption: 'Molded housing with its draft analysis and boss section',
    },
  },
  {
    id: 'welded-frame',
    short: 'Machine frame',
    title: 'Welded machine frame',
    kind: 'study',
    categories: ['drawings'],
    summary:
      'A square-tube machine base documented as a weldment: balloons tied to a cut list with profiles, lengths and quantities for the fabricator.',
    scope: ['Weldment model', 'Cut list', 'Fabrication drawing'],
    media: {
      type: 'image',
      ...workImage('frame-workbench'),
      alt: 'A fabrication shop desk with a welded square-tube joint and a weldment drawing, a monitor showing the ballooned frame model and its cut list, and a welder working in the background.',
      caption: 'Weldment model, cut list and drawing in the fabrication shop',
    },
  },
  {
    id: 'impeller-scan',
    short: 'Impeller scan',
    title: 'Impeller rebuilt from a 3D scan',
    kind: 'study',
    categories: ['reverse', 'cad'],
    summary:
      'A worn pump impeller scanned and rebuilt as parametric CAD, then checked against the scan with a colour deviation map.',
    scope: ['3D scan to CAD', 'Parametric rebuild', 'Deviation check'],
    media: {
      type: 'image',
      ...workImage('impeller-workbench'),
      alt: 'A worn cast pump impeller on a workbench beside a handheld 3D scanner and scan targets, with monitors showing the scanned mesh and a color deviation map of the rebuilt CAD model.',
      caption: 'Scanning a worn impeller and checking the rebuilt CAD against the scan',
    },
  },
];
