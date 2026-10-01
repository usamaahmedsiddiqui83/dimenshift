import { cn } from '../../lib/cn';

/**
 * Lightweight line drawing of the worm-gear reducer, seen square-on from the input (+Z) face.
 * Serves as the loading poster and as the permanent visual when WebGL is unavailable. Coordinates
 * mirror the 3D assembly at 100 px per scene unit (Y flipped).
 */
export function AssemblyPoster({ className }: { className?: string }) {
  const inputBolts: [number, number][] = [
    [23, 73],
    [-23, 73],
    [-23, 27],
    [23, 27],
  ];
  return (
    <svg
      viewBox="-200 -150 440 320"
      className={cn('h-full w-full text-steel-400', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      vectorEffect="non-scaling-stroke"
      preserveAspectRatio="xMidYMid meet"
    >
      <g opacity="0.75">
        {/* Base, feet and fins */}
        <rect x="-130" y="118" width="260" height="14" rx="1" />
        <rect x="-95" y="105" width="190" height="13" />
        {[-55, -20, 20, 55].map((x) => (
          <line key={x} x1={x} y1="80" x2={x} y2="105" />
        ))}
        {/* Housing body and top cover */}
        <rect x="-100" y="-95" width="200" height="200" rx="12" />
        <rect x="-70" y="-103" width="140" height="8" rx="2" />
        <line x1="0" y1="-103" x2="0" y2="-125" />
        <circle cx="0" cy="-128" r="5" />
        {/* Nameplate and oil sight glass */}
        <rect x="9" y="-67" width="46" height="24" rx="2" />
        <circle cx="-52" cy="-42" r="11" />
        <circle cx="-52" cy="-42" r="7" />
        {/* Input flange, seal and worm shaft */}
        <circle cx="0" cy="50" r="42" />
        <circle cx="0" cy="50" r="15" />
        <circle cx="0" cy="50" r="6.5" />
        {inputBolts.map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="4" />
        ))}
        {/* Output shaft leaving the +X face */}
        <rect x="100" y="-27" width="95" height="24" rx="2" />
        <line x1="100" y1="-15" x2="195" y2="-15" strokeDasharray="6 4" opacity="0.5" />
      </g>
    </svg>
  );
}
