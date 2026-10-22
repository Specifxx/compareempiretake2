/** Tiny step chart of a price over time. Pure SVG; renders anywhere. */
export function Sparkline({ points, className = "h-12 w-full", tone = "brand" }: { points: [string, number][]; className?: string; tone?: "brand" | "save" | "hot" }) {
  const color = `rgb(var(--${tone}))`;
  if (points.length < 2) {
    return (
      <svg viewBox="0 0 100 30" className={className} preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="15" x2="100" y2="15" stroke={color} strokeWidth="2" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        <circle cx="100" cy="15" r="3" fill={color} />
      </svg>
    );
  }
  const W = 100, H = 30, P = 3;
  const xs = points.map(([d]) => Date.parse(d));
  const ys = points.map(([, p]) => p);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const X = (x: number) => ((x - x0) / (x1 - x0 || 1)) * W;
  const Y = (y: number) => (hi === lo ? H / 2 : H - P - ((y - lo) / (hi - lo)) * (H - 2 * P));
  let d = `M${X(xs[0])},${Y(ys[0])}`;
  for (let i = 1; i < xs.length; i++) d += ` H${X(xs[i])} V${Y(ys[i])}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`${className} overflow-visible`} preserveAspectRatio="none" aria-hidden>
      <path d={`${d} V${H} H0 Z`} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={X(xs.at(-1)!)} cy={Y(ys.at(-1)!)} r="2.5" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
