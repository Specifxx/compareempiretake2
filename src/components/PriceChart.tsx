/** A compact best-price line for one variant. Server-rendered SVG, no chart library. */
export function PriceChart({ points }: { points: [string, number][] }) {
  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-line p-5 text-sm text-ink-mute">
        {points.length === 1 ? (
          <>We started tracking this price on <b className="text-ink">{fmtDate(points[0][0])}</b> at <b className="text-ink">${points[0][1].toLocaleString("en-AU")}</b>. The history chart fills in as we check it each day.</>
        ) : (
          "No price history yet."
        )}
      </div>
    );
  }
  const W = 600, H = 160, P = 8;
  const xs = points.map(([d]) => Date.parse(d));
  const ys = points.map(([, p]) => p);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = (hi - lo) * 0.15 || hi * 0.05;
  const [y0, y1] = [lo - pad, hi + pad];
  const X = (x: number) => P + ((x - x0) / (x1 - x0 || 1)) * (W - 2 * P);
  const Y = (y: number) => H - P - ((y - y0) / (y1 - y0 || 1)) * (H - 2 * P);
  // Step line: a price holds until the next check.
  let d = `M${X(xs[0])},${Y(ys[0])}`;
  for (let i = 1; i < xs.length; i++) d += ` H${X(xs[i])} V${Y(ys[i])}`;
  const area = `${d} V${H} H${X(xs[0])} Z`;
  const minI = ys.indexOf(lo);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full overflow-visible" role="img" aria-label={`Best price from ${fmtDate(points[0][0])} to ${fmtDate(points.at(-1)![0])}, lowest $${lo}`}>
        <defs>
          <linearGradient id="pc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--brand))" stopOpacity=".22" />
            <stop offset="1" stopColor="rgb(var(--brand))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#pc-fill)" />
        <path d={d} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={X(xs[minI])} cy={Y(lo)} r="4.5" fill="rgb(var(--save))" stroke="rgb(var(--card))" strokeWidth="2" />
        <circle cx={X(xs.at(-1)!)} cy={Y(ys.at(-1)!)} r="4.5" fill="rgb(var(--brand))" stroke="rgb(var(--card))" strokeWidth="2" />
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-ink-mute">
        <span>{fmtDate(points[0][0])}</span>
        <span>Lowest <b className="text-save">${lo.toLocaleString("en-AU")}</b> · Highest ${hi.toLocaleString("en-AU")}</span>
        <span>{fmtDate(points.at(-1)![0])}</span>
      </figcaption>
    </figure>
  );
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}
