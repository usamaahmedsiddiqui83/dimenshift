import { useId } from 'react';
import type { ServiceVisualKey } from '../../config/services';
import { useDrawOnChange } from '../../hooks/useDrawOnChange';
import { cn } from '../../lib/cn';
import { CenterMark, DimH, DimV, DrawPath, ink, Label } from '../ui/svgPrimitives';

/* Iso projection for the CAD visual (x → right-down, y → left-down, z → up). */
const iso = (x: number, y: number, z: number): [number, number] => [257 + 0.866 * (x - y), 155 + 0.5 * (x + y) - z];
const pts = (...p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function ProductDesign() {
  return (
    <>
      <g stroke={ink.faint} strokeDasharray="4 4">
        <line x1="70" y1="249.5" x2="420" y2="120.5" />
        <line x1="90" y1="220" x2="215" y2="220" />
        <line x1="150" y1="150" x2="150" y2="300" />
        <line x1="340" y1="84" x2="340" y2="210" />
      </g>
      <g stroke={ink.part} strokeWidth="1.5" fill={ink.fill}>
        <DrawPath d="M166.6 265 L350.4 178.1 A30 30 0 0 0 329.6 121.9 L133.4 175 A48 48 0 0 0 166.6 265 Z" />
        <DrawPath d="M168 220a18 18 0 1 0-36 0a18 18 0 1 0 36 0" delay={200} />
        <DrawPath d="M351 150a11 11 0 1 0-22 0a11 11 0 1 0 22 0" delay={260} />
      </g>
      <CenterMark x={150} y={220} />
      <CenterMark x={340} y={150} />
      <g stroke={ink.faint} strokeDasharray="2 3">
        <line x1="150" y1="165" x2="150" y2="62" />
        <line x1="340" y1="115" x2="340" y2="62" />
      </g>
      <DimH x1={150} x2={340} y={66} label="190" />
      <g stroke={ink.datum}>
        <line x1="116" y1="254" x2="80" y2="300" />
        <line x1="80" y1="300" x2="54" y2="300" />
      </g>
      <Label x={54} y={316} color={ink.datum}>
        R48
      </Label>
      <Label x={420} y={320} anchor="end">
        LINK · CONCEPT A
      </Label>
    </>
  );
}

function CadModeling() {
  const A = iso(0, 0, 80);
  const B = iso(150, 0, 80);
  const C = iso(150, 110, 80);
  const D = iso(0, 110, 80);
  const A0 = iso(0, 0, 0);
  const B0 = iso(150, 0, 0);
  const C0 = iso(150, 110, 0);
  const D0 = iso(0, 110, 0);
  const [bx, by] = iso(75, 55, 80);
  return (
    <>
      <g stroke={ink.faint} strokeDasharray="4 3">
        <line x1={A[0]} y1={A[1]} x2={A0[0]} y2={A0[1]} />
        <line x1={A0[0]} y1={A0[1]} x2={B0[0]} y2={B0[1]} />
        <line x1={A0[0]} y1={A0[1]} x2={D0[0]} y2={D0[1]} />
      </g>
      <g stroke={ink.part} strokeWidth="1.5" strokeLinejoin="round">
        <polygon points={pts(A, B, C, D)} fill="rgb(130 178 255 / 0.06)" />
        <polygon points={pts(B, C, C0, B0)} fill="rgb(198 214 245 / 0.05)" />
        <polygon points={pts(D, C, C0, D0)} fill="rgb(198 214 245 / 0.09)" />
      </g>
      <g stroke={ink.accent} strokeWidth="1.5" fill="none">
        <ellipse cx={bx} cy={by} rx="36.7" ry="21.2" />
        <ellipse cx={bx} cy={by + 3} rx="30" ry="17.3" />
      </g>
      <g stroke={ink.datum} strokeWidth="1">
        <DrawPath d="M70 300 L96 315" />
        <DrawPath d="M70 300 L44 315" delay={120} />
        <DrawPath d="M70 300 L70 272" delay={240} />
      </g>
      <Label x={100} y={322} color={ink.datum}>
        X
      </Label>
      <Label x={32} y={322} color={ink.datum}>
        Y
      </Label>
      <Label x={66} y={266} color={ink.datum}>
        Z
      </Label>
      <g stroke={ink.datum}>
        <line x1={bx + 30} y1={by - 12} x2="380" y2="88" />
        <line x1="380" y1="88" x2="420" y2="88" />
      </g>
      <Label x={420} y={80} anchor="end" color={ink.datum}>
        HOLE · Ø60 · C2
      </Label>
      <Label x={420} y={320} anchor="end">
        FEATURE TREE · 6 FEATURES
      </Label>
    </>
  );
}

function Drawings() {
  return (
    <>
      <g stroke={ink.faint}>
        <rect x="20" y="20" width="440" height="320" fill="none" />
        <rect x="30" y="30" width="420" height="300" fill="none" />
        {[135, 240, 345].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="30" />
        ))}
        <rect x="300" y="276" width="150" height="54" fill="none" />
        <line x1="300" y1="294" x2="450" y2="294" />
        <line x1="300" y1="312" x2="450" y2="312" />
        <line x1="380" y1="276" x2="380" y2="330" />
      </g>
      <Label x={306} y={289}>
        PART
      </Label>
      <Label x={386} y={289}>
        REV A
      </Label>
      <Label x={306} y={307}>
        SCALE 1:2
      </Label>
      <Label x={386} y={307}>
        SHEET 1/1
      </Label>
      <Label x={306} y={325}>
        MATERIAL
      </Label>
      <g stroke={ink.part} strokeWidth="1.5" fill={ink.fill}>
        <DrawPath d="M70 90 H200 V190 H70 Z" />
        <DrawPath d="M240 90 H280 V190 H240 Z" delay={180} />
        <circle cx="135" cy="140" r="22" fill="none" />
        <circle cx="95" cy="112" r="7" fill="none" />
        <circle cx="175" cy="112" r="7" fill="none" />
      </g>
      <g stroke={ink.faint} strokeDasharray="4 3">
        <line x1="240" y1="118" x2="280" y2="118" />
        <line x1="240" y1="162" x2="280" y2="162" />
        <line x1="100" y1="140" x2="170" y2="140" strokeDasharray="12 3 2 3" />
        <line x1="135" y1="105" x2="135" y2="175" strokeDasharray="12 3 2 3" />
      </g>
      <DimH x1={70} x2={200} y={215} label="130" />
      <DimH x1={240} x2={280} y={215} label="40" />
      <DimV x={50} y1={90} y2={190} label="100" />
      <g stroke={ink.datum}>
        <line x1="151" y1="124" x2="196" y2="60" />
        <line x1="196" y1="60" x2="240" y2="60" />
      </g>
      <Label x={200} y={54} color={ink.datum}>
        Ø44 THRU
      </Label>
    </>
  );
}

function Dfm() {
  return (
    <>
      <g stroke={ink.part} strokeWidth="1.5" strokeLinejoin="round">
        <DrawPath
          d="M80 110 L100 270 L380 270 L400 110 L368 110 L352 244 L128 244 L112 110 Z"
          fill="rgb(198 214 245 / 0.08)"
        />
      </g>
      <rect x="170" y="160" width="44" height="84" fill="rgb(31 91 216 / 0.3)" stroke={ink.accent} strokeWidth="1.5" />
      <g stroke={ink.datum} strokeWidth="1.5" fill="rgb(130 178 255 / 0.08)">
        <path d="M270 244 V160 H284 V230 H300 V160 H314 V244" />
      </g>
      <g stroke={ink.faint} strokeDasharray="3 3">
        <line x1="400" y1="90" x2="400" y2="280" />
      </g>
      <g stroke={ink.accent}>
        <line x1="192" y1="172" x2="150" y2="72" />
        <line x1="150" y1="72" x2="70" y2="72" />
      </g>
      <Label x={70} y={64} color={ink.accent}>
        THICK SECTION · SINK RISK
      </Label>
      <g stroke={ink.datum}>
        <line x1="300" y1="172" x2="330" y2="72" />
        <line x1="330" y1="72" x2="420" y2="72" />
      </g>
      <Label x={420} y={64} anchor="end" color={ink.datum}>
        CORED BOSS
      </Label>
      <DimV x={440} y1={244} y2={270} label="t" />
      <Label x={396} y={300} anchor="end">
        UNIFORM WALL · DRAFT ON ALL VERTICAL FACES
      </Label>
    </>
  );
}

function ProductDevelopment() {
  const xs = [60, 150, 240, 330, 420];
  const names = ['CONCEPT', 'DESIGN', 'PROTOTYPE', 'VALIDATE', 'RELEASE'];
  return (
    <>
      <line x1="40" y1="230" x2="440" y2="230" stroke={ink.faint} />
      <g stroke={ink.accent} strokeWidth="2">
        <DrawPath d="M60 230 H420" />
      </g>
      {xs.map((x, i) => (
        <g key={x}>
          <rect
            x={x - 7}
            y={223}
            width="14"
            height="14"
            transform={`rotate(45 ${x} 230)`}
            fill={i === xs.length - 1 ? ink.accent : 'var(--color-ink-900)'}
            stroke={i === xs.length - 1 ? ink.accent : ink.part}
          />
          <Label x={x} y={262} anchor="middle">
            {names[i]}
          </Label>
          {i > 0 && (
            <Label x={x} y={212} anchor="middle" color={ink.datum}>
              {`REV ${String.fromCharCode(64 + i)}`}
            </Label>
          )}
        </g>
      ))}
      <g stroke={ink.part} strokeWidth="1.5" fill="none">
        <circle cx="60" cy="150" r="22" strokeDasharray="4 4" />
        <rect x="128" y="128" width="44" height="44" rx="12" />
        <rect x="218" y="128" width="44" height="44" rx="4" />
        <circle cx="240" cy="150" r="10" />
        <rect x="308" y="128" width="44" height="44" rx="4" />
        <circle cx="330" cy="150" r="10" />
        <rect x="398" y="128" width="44" height="44" rx="4" stroke={ink.accent} />
        <circle cx="420" cy="150" r="10" stroke={ink.accent} />
      </g>
      <g stroke={ink.datum}>
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={310 + k * 10} y1="170" x2={320 + k * 10} y2="160" />
        ))}
      </g>
      <g fill={ink.accent}>
        {[
          [405, 135],
          [435, 135],
          [405, 165],
          [435, 165],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="2.5" />
        ))}
      </g>
      <Label x={40} y={316}>
        GATE REVIEW AT EVERY STAGE
      </Label>
    </>
  );
}

/** Deterministic pseudo-random jitter so the point cloud is stable between renders. */
const jitter = (n: number) => Math.sin(n * 12.9898) * 43758.5453 - Math.floor(Math.sin(n * 12.9898) * 43758.5453) - 0.5;

function ReverseEngineering() {
  const outline: [number, number][] = [
    [50, 90],
    [200, 90],
    [200, 130],
    [100, 130],
    [100, 280],
    [50, 280],
    [50, 90],
  ];
  const dots: [number, number][] = [];
  let seed = 1;
  for (let i = 0; i < outline.length - 1; i++) {
    const [x1, y1] = outline[i];
    const [x2, y2] = outline[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.floor(len / 7);
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      dots.push([x1 + (x2 - x1) * t + jitter(seed++) * 5, y1 + (y2 - y1) * t + jitter(seed++) * 5]);
    }
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    dots.push([75 + 12 * Math.cos(a) + jitter(seed++) * 3, 230 + 12 * Math.sin(a) + jitter(seed++) * 3]);
  }
  return (
    <>
      <g fill="var(--color-steel-300)">
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="1.4" />
        ))}
      </g>
      <Label x={50} y={316}>
        SUPPLIED DATA
      </Label>
      <g stroke={ink.accent} strokeWidth="1.5">
        <DrawPath d="M222 185 H258" />
        <path d="M252 179 L258 185 L252 191" fill="none" />
      </g>
      <g stroke={ink.part} strokeWidth="1.5" fill={ink.fill}>
        <DrawPath d="M280 90 H430 V130 H330 V280 H280 Z" delay={200} />
        <circle cx="305" cy="230" r="12" fill="none" />
      </g>
      <CenterMark x={305} y={230} size={18} color={ink.faint} />
      <DimH x1={280} x2={430} y={70} label="150" />
      <DimV x={456} y1={90} y2={130} label="40" />
      <DimV x={262} y1={90} y2={280} label="190" />
      <Label x={430} y={316} anchor="end" color={ink.datum}>
        PARAMETRIC MODEL
      </Label>
    </>
  );
}

function Optimization({ hatchId }: { hatchId: string }) {
  return (
    <>
      <defs>
        <pattern id={hatchId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={ink.accent} strokeWidth="1" />
        </pattern>
      </defs>
      <g stroke={ink.part} strokeWidth="1.5" fill={ink.fill}>
        <rect x="50" y="80" width="160" height="200" rx="6" />
        <DrawPath d="M276 80 H430 A6 6 0 0 1 436 86 V274 A6 6 0 0 1 430 280 H276 A6 6 0 0 1 270 274 V86 A6 6 0 0 1 276 80 Z" />
      </g>
      <g stroke={ink.accent} strokeWidth="1.2" fill={`url(#${hatchId})`} opacity="0.9">
        <polygon points="292,112 400,112 292,220" />
        <polygon points="414,140 414,250 304,250" />
      </g>
      {[
        [70, 100],
        [190, 100],
        [70, 260],
        [190, 260],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="7" fill="none" stroke={ink.part} />
          <circle cx={x + 220} cy={y} r="7" fill="none" stroke={ink.part} />
          <circle cx={x + 220} cy={y} r="13" fill="none" stroke={ink.datum} strokeDasharray="3 3" />
        </g>
      ))}
      <Label x={50} y={306}>
        REV A
      </Label>
      <Label x={270} y={306}>
        REV B
      </Label>
      <Label x={436} y={66} anchor="end" color={ink.accent}>
        MATERIAL REMOVED
      </Label>
      <Label x={436} y={326} anchor="end" color={ink.datum}>
        INTERFACES UNCHANGED
      </Label>
    </>
  );
}

export function ServiceVisual({ kind, className }: { kind: ServiceVisualKey; className?: string }) {
  const drawn = useDrawOnChange(kind);
  const hatchId = useId();
  return (
    <svg
      viewBox="0 0 480 360"
      className={cn('h-full w-full', drawn && 'is-drawn', className)}
      fill="none"
      aria-hidden="true"
    >
      {kind === 'product-design' && <ProductDesign />}
      {kind === 'cad-modeling' && <CadModeling />}
      {kind === 'drawings' && <Drawings />}
      {kind === 'dfm' && <Dfm />}
      {kind === 'product-development' && <ProductDevelopment />}
      {kind === 'reverse-engineering' && <ReverseEngineering />}
      {kind === 'optimization' && <Optimization hatchId={hatchId.replace(/:/g, '')} />}
    </svg>
  );
}
