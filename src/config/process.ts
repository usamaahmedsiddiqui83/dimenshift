export type ProcessStageId =
  | 'understand'
  | 'concept'
  | 'engineer'
  | 'develop'
  | 'validate'
  | 'document'
  | 'manufacture'
  | 'deliver';

export interface ProcessStage {
  id: ProcessStageId;
  number: string;
  name: string;
  headline: string;
  body: string;
  outputs: string[];
  /** What the stage image shows; used as its text alternative. */
  visual: string;
  /** Short line shown over the stage image. */
  caption: string;
}

/**
 * Stage photo at the size that suits the viewer. Every stage follows the same parallel-shaft gear
 * reducer, so the images read as one continuous story. Each is 16:9, saved 1376, 800 and 320px wide.
 */
export function stageImage(id: ProcessStageId) {
  const base = `/media/process/stage-${id}`;
  return { src: `${base}-1376.jpg`, srcSet: `${base}-800.jpg 800w, ${base}-1376.jpg 1376w` };
}

/** Small copy for the stage filmstrip. */
export function stageThumb(id: ProcessStageId) {
  return `/media/process/stage-${id}-320.jpg`;
}

export const processStages: ProcessStage[] = [
  {
    id: 'understand',
    number: '01',
    name: 'Understand',
    headline: 'Define the problem before drawing the part.',
    body: 'Requirements, operating conditions, constraints, target cost and production volume are captured first. What the product must do sets the design envelope.',
    outputs: ['Requirements brief', 'Design envelope', 'Constraints list'],
    visual:
      'A monitor showing the gear reducer’s design envelope in CAD, a translucent box of 320 by 210 by 180 millimetres around the concept, above a printed requirement sheet listing input torque, power and ratio.',
    caption: 'Design envelope in CAD, drawn from the requirement sheet',
  },
  {
    id: 'concept',
    number: '02',
    name: 'Concept',
    headline: 'Explore form and architecture.',
    body: 'Quick forms and layouts test how the product could work, where the major parts sit and how it will go together — fast, before detail slows iteration down.',
    outputs: ['Concept options', 'Layout sketches', 'Direction review'],
    visual:
      'Three hand-sketched concept options for the gearbox laid out on a workbench, inline, parallel and coaxial, with the parallel layout marked as preferred and two of the layouts modelled on the monitors behind.',
    caption: 'Three sketched options, parallel layout preferred',
  },
  {
    id: 'engineer',
    number: '03',
    name: 'Engineer',
    headline: 'Build intent into the geometry.',
    body: 'The chosen concept becomes parametric CAD. Construction geometry, key dimensions and relationships are defined so the design responds predictably to change.',
    outputs: ['Parametric model', 'Key dimensions', 'Design intent'],
    visual:
      'The chosen gear reducer as a parametric CAD model on screen, its gears and shafts shown in wireframe inside the housing with driving dimensions and the feature tree beside it.',
    caption: 'Parametric model driven by key dimensions',
  },
  {
    id: 'develop',
    number: '04',
    name: 'Develop',
    headline: 'Detail every component, then assemble.',
    body: 'Housing, shafts, gears, bearings, seals and fasteners are each modeled to be made, then structured into an assembly that reflects how the product is built.',
    outputs: ['Detailed parts', 'Assembly structure', 'Standard components'],
    visual:
      'Two monitors showing the gear reducer’s assembly and its exploded view with every part, while the machined housing, gears, shafts and bearings lie on the desk in front.',
    caption: 'Exploded assembly beside the real parts',
  },
  {
    id: 'validate',
    number: '05',
    name: 'Validate',
    headline: 'Check the fit before the first cut.',
    body: 'Section views, clearance checks and interference detection in the CAD assembly catch fit problems while they cost minutes to fix — not tooling.',
    outputs: ['Section reviews', 'Clearance checks', 'Interference checks'],
    visual:
      'A section view through the gear reducer in CAD with red markers on the gear mesh and bearing seats where clearances and interferences are being checked.',
    caption: 'Section view with clearance and interference checks',
  },
  {
    id: 'document',
    number: '06',
    name: 'Document',
    headline: 'Communicate it without ambiguity.',
    body: 'Drawings define dimensions, tolerances, materials and notes, so manufacturing partners can quote accurately and make parts consistently.',
    outputs: ['Part drawings', 'Assembly drawing', 'Bill of materials'],
    visual:
      'The gear reducer’s drawing sheet on screen, with dimensioned views, section A–A and a title block, and the printed drawing set and a caliper on the desk.',
    caption: 'Drawing set with sections, dimensions and title block',
  },
  {
    id: 'manufacture',
    number: '07',
    name: 'Manufacture',
    headline: 'Prepare for the real process.',
    body: 'Models and drawings are prepared for the intended manufacturing route, with manufacturability feedback resolved before anything is released.',
    outputs: ['Manufacturing files', 'DFM revisions', 'Supplier handoff'],
    visual:
      'CAM toolpaths for the gearbox housing on a monitor while a CNC machining centre cuts it in the shop behind, with the machined aluminium housing and its drawing on the bench.',
    caption: 'CAM toolpaths and the housing machined on CNC',
  },
  {
    id: 'deliver',
    number: '08',
    name: 'Deliver',
    headline: 'Release a complete product package.',
    body: 'You receive a manufacturing-ready design package: editable CAD, neutral formats, drawings, bill of materials and a clear revision record.',
    outputs: ['Release package', 'Neutral CAD formats', 'Revision record'],
    visual:
      'The finished gear reducer on a workbench beside a laptop showing the stage 8 design release package with its CAD, drawing and documentation files.',
    caption: 'Finished reducer and its design release package',
  },
];
