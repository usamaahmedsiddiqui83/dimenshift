/**
 * Home page supporting content. Most statements describe working method; the
 * credentials below are supplied by the client (see the note on `credentials`).
 */

export interface Stat {
  value: string;
  unit?: string;
  label: string;
}

/**
 * CLIENT-SUPPLIED credentials shown in the home page figures strip.
 * Publish only what the business can substantiate: an ISO 9001:2015 claim requires a
 * current certificate from an accredited registrar, and tolerance and turnaround figures
 * are commitments clients will rely on. Remove or correct any entry that is not accurate.
 */
export const credentials: Stat[] = [
  { value: '± 0.005', unit: 'mm', label: 'Tolerance compliance' },
  // Edition year left out on purpose: a certificate names one edition (2015 until the
  // organisation is audited to the 2026 edition), so the label stays accurate either way.
  { value: 'ISO 9001', label: 'Certified quality management' },
  { value: '48', unit: 'h', label: 'Fast-track DFM turnaround' },
  { value: '100%', label: 'Production-ready CAD / CAM' },
];

export const trustPoints = [
  { label: 'Concept → production', text: 'One workflow from first idea to release package.' },
  { label: 'Built to be made', text: 'Manufacturing constraints designed in, not patched in.' },
  { label: 'Documented intent', text: 'Models and drawings that explain themselves.' },
  { label: 'Clear deliverables', text: 'Defined outputs at every stage of the work.' },
];

export const problems = [
  {
    problem: 'The prototype works, but it cannot be manufactured economically.',
    response:
      'Design for manufacturing runs through development, so cost and process constraints shape the part before quotes come back.',
  },
  {
    problem: 'Parts arrive and do not fit together.',
    response:
      'Clearances, tolerances and interferences are checked in the CAD assembly before a single part is ordered.',
  },
  {
    problem: 'Suppliers cannot quote from the files you have.',
    response:
      'Complete drawings, bills of materials and neutral CAD formats give suppliers what they need to quote and build.',
  },
  {
    problem: 'Every design change breaks the model.',
    response:
      'Parametric models with documented design intent make revisions predictable instead of a rebuild.',
  },
];

export const differentiators = [
  {
    index: 'A',
    title: 'Mechanism first',
    text: 'Form follows function. Every surface has a reason to exist and a way to be made.',
  },
  {
    index: 'B',
    title: 'Manufacturing in view from day one',
    text: 'Process, tooling and assembly are considered while the design is still cheap to change.',
  },
  {
    index: 'C',
    title: 'Traceable design intent',
    text: 'Key dimensions and relationships are controlled, so the model survives the next revision.',
  },
  {
    index: 'D',
    title: 'Decisions in plain language',
    text: 'Technical trade-offs are explained clearly, so founders and product owners can decide with confidence.',
  },
];

export const capabilityGroups = [
  {
    title: 'Engineering disciplines',
    items: [
      'Mechanical product design',
      'Parametric 3D CAD',
      'Assembly modeling',
      'Technical documentation',
      'Design for manufacturing',
      'Design optimization',
    ],
  },
  {
    title: 'Deliverables',
    items: [
      'Part and assembly models',
      '2D engineering drawings',
      'Bills of materials',
      'Exploded and section views',
      'Rendered review visuals',
      'Release documentation packages',
    ],
  },
  {
    title: 'File formats exchanged',
    items: ['STEP / STP', 'IGES / IGS', 'DWG', 'DXF', 'STL', 'PDF'],
  },
];

/**
 * CLIENT: CAD platforms and tools actually used (e.g. names of CAD packages).
 * Rendered as its own group only when non-empty.
 */
export const toolStack: string[] = [];

/** CLIENT: manufacturing processes the team actually designs for. Rendered only when non-empty. */
export const manufacturingProcesses: string[] = [];
