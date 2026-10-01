import type { ProjectVisualKey } from '../../config/showcase';
import { CenterMark, DimH, ink, Label } from '../ui/svgPrimitives';

function GearReducer() {
  // Front-view outlines compressed horizontally read as parts seen obliquely along one axis.
  const parts = [
    { x: 70, y: 232, w: 12, h: 30, kind: 'bolt' },
    { x: 125, y: 210, w: 110, h: 140, kind: 'cover' },
    { x: 180, y: 196, w: 110, h: 140, kind: 'gasket' },
    { x: 245, y: 180, w: 120, h: 150, kind: 'housing' },
    { x: 310, y: 164, w: 100, h: 100, kind: 'gear' },
    { x: 360, y: 150, w: 50, h: 50, kind: 'bearing' },
    { x: 415, y: 135, w: 110, h: 140, kind: 'cover' },
  ] as const;
  return (
    <>
      <line x1="30" y1="255" x2="460" y2="115" stroke={ink.faint} strokeDasharray="14 3 2 3" />
      {parts.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y}) scale(0.38 1)`} strokeWidth="2.6" vectorEffect="non-scaling-stroke">
          {p.kind === 'gear' || p.kind === 'bearing' ? (
            <>
              <circle r={p.w / 2} fill="rgb(198 214 245 / 0.06)" stroke={p.kind === 'gear' ? ink.part : ink.datum} />
              <circle r={p.w / 4} fill="none" stroke={ink.part} />
              {p.kind === 'gear' && <circle r={p.w / 2 - 8} fill="none" stroke={ink.faint} strokeDasharray="6 4" />}
            </>
          ) : p.kind === 'bolt' ? (
            <rect x={-p.w / 2} y={-p.h / 2} width={p.w} height={p.h} fill="none" stroke={ink.part} />
          ) : (
            <rect
              x={-p.w / 2}
              y={-p.h / 2}
              width={p.w}
              height={p.h}
              rx="10"
              fill={p.kind === 'housing' ? 'rgb(198 214 245 / 0.08)' : 'none'}
              stroke={p.kind === 'gasket' ? ink.accent : ink.part}
            />
          )}
        </g>
      ))}
      <Label x={30} y={320}>
        EXPLODED VIEW · 31 COMPONENTS
      </Label>
    </>
  );
}

function EnclosureDfm() {
  return (
    <>
      <g stroke={ink.part} strokeWidth="1.5" fill="rgb(198 214 245 / 0.05)" strokeLinejoin="round">
        <path d="M170 90 H310 V60 H170 Z" />
        <path d="M170 230 H310 V260 H170 Z" />
        <path d="M130 100 V220 H170 V100 Z" />
        <path d="M310 100 V220 H350 V100 Z" />
        <rect x="170" y="90" width="140" height="140" />
      </g>
      <g stroke={ink.accent} strokeWidth="1.5" fill="none">
        {[
          [164, 84],
          [310, 84],
          [164, 230],
          [310, 230],
        ].map(([x, y]) => (
          <rect key={`${x}${y}`} x={x} y={y} width="6" height="6" />
        ))}
      </g>
      <g stroke={ink.datum} strokeDasharray="5 4">
        <line x1="170" y1="90" x2="310" y2="90" />
        <line x1="170" y1="230" x2="310" y2="230" />
        <line x1="170" y1="100" x2="170" y2="220" />
        <line x1="310" y1="100" x2="310" y2="220" />
      </g>
      <g stroke={ink.part} fill="none">
        {[205, 240, 275].map((x) => (
          <circle key={x} cx={x} cy="160" r="6" />
        ))}
      </g>
      <g stroke={ink.accent}>
        <line x1="316" y1="84" x2="380" y2="46" />
        <line x1="380" y1="46" x2="440" y2="46" />
      </g>
      <Label x={440} y={38} anchor="end" color={ink.accent}>
        BEND RELIEF
      </Label>
      <g stroke={ink.datum}>
        <line x1="310" y1="160" x2="390" y2="200" />
        <line x1="390" y1="200" x2="440" y2="200" />
      </g>
      <Label x={440} y={192} anchor="end" color={ink.datum}>
        BEND LINE
      </Label>
      <Label x={40} y={320}>
        FLAT PATTERN · DFM REVIEW
      </Label>
    </>
  );
}

function BracketRebuild() {
  return (
    <>
      <g transform="rotate(-4 120 180)">
        <rect x="40" y="70" width="170" height="220" fill="rgb(198 214 245 / 0.05)" stroke={ink.faint} />
        <g stroke="var(--color-steel-400)" strokeWidth="1.3" fill="none" strokeDasharray="9 2 4 2">
          <path d="M70 110 H180 V140 H105 V250 H70 Z" />
          <circle cx="88" cy="215" r="10" />
        </g>
        <g stroke={ink.faint}>
          <line x1="60" y1="270" x2="190" y2="270" />
          <line x1="140" y1="200" x2="190" y2="200" />
          <line x1="140" y1="212" x2="175" y2="212" />
        </g>
      </g>
      <g stroke={ink.accent} strokeWidth="1.5" fill="none">
        <path d="M225 180 H258" />
        <path d="M252 174 L258 180 L252 186" />
      </g>
      <g stroke={ink.part} strokeWidth="1.5" fill="rgb(198 214 245 / 0.06)">
        <path d="M285 110 H430 V145 H325 V260 H285 Z" />
        <circle cx="305" cy="222" r="11" fill="none" />
      </g>
      <CenterMark x={305} y={222} size={16} color={ink.faint} />
      <DimH x1={285} x2={430} y={90} label="145" />
      <Label x={40} y={320}>
        SCANNED DRAWING
      </Label>
      <Label x={440} y={320} anchor="end" color={ink.datum}>
        PARAMETRIC REBUILD
      </Label>
    </>
  );
}

export function ProjectVisual({ kind }: { kind: ProjectVisualKey }) {
  return (
    <svg viewBox="0 0 480 340" className="h-full w-full" fill="none" aria-hidden="true">
      {kind === 'gear-reducer' && <GearReducer />}
      {kind === 'enclosure-dfm' && <EnclosureDfm />}
      {kind === 'bracket-rebuild' && <BracketRebuild />}
    </svg>
  );
}
