import type { ReactNode, SVGProps } from 'react';

/** Shared stroke roles for technical illustrations. */
export const ink = {
  part: 'var(--color-steel-200)',
  faint: 'var(--color-steel-500)',
  datum: 'var(--color-datum-400)',
  accent: 'var(--color-brand-500)',
  fill: 'rgb(198 214 245 / 0.04)',
} as const;

export function Label({ x, y, children, anchor = 'start', color }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; color?: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color ?? 'var(--color-steel-400)'}
      stroke="none"
      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}
    >
      {children}
    </text>
  );
}

/** Horizontal dimension with oblique ticks. */
export function DimH({ x1, x2, y, label, color = ink.datum }: { x1: number; x2: number; y: number; label: string; color?: string }) {
  return (
    <g stroke={color} strokeWidth={1}>
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <line x1={x1 - 4} y1={y + 4} x2={x1 + 4} y2={y - 4} />
      <line x1={x2 - 4} y1={y + 4} x2={x2 + 4} y2={y - 4} />
      <Label x={(x1 + x2) / 2} y={y - 6} anchor="middle" color={color}>
        {label}
      </Label>
    </g>
  );
}

export function DimV({ x, y1, y2, label, color = ink.datum }: { x: number; y1: number; y2: number; label: string; color?: string }) {
  return (
    <g stroke={color} strokeWidth={1}>
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <line x1={x - 4} y1={y1 + 4} x2={x + 4} y2={y1 - 4} />
      <line x1={x - 4} y1={y2 + 4} x2={x + 4} y2={y2 - 4} />
      <g transform={`translate(${x - 7} ${(y1 + y2) / 2}) rotate(-90)`}>
        <Label x={0} y={0} anchor="middle" color={color}>
          {label}
        </Label>
      </g>
    </g>
  );
}

/** Stroke that draws itself when its parent SVG has the `is-drawn` class. */
export function DrawPath({ delay = 0, style, ...props }: SVGProps<SVGPathElement> & { delay?: number }) {
  return <path pathLength={1} className="draw-line" style={{ ...style, ['--draw-delay' as string]: `${delay}ms` }} {...props} />;
}

export function CenterMark({ x, y, size = 8, color = ink.accent }: { x: number; y: number; size?: number; color?: string }) {
  return (
    <g stroke={color} strokeWidth={1}>
      <line x1={x - size} y1={y} x2={x + size} y2={y} />
      <line x1={x} y1={y - size} x2={x} y2={y + size} />
    </g>
  );
}
