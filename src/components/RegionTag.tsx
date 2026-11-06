import { Flag } from "./Flag";
import { REGIONS, type RegionId } from "@/lib/region";

/**
 * The country and currency a list of prices is in, beside search results and prices (owner, 2026-11-06: the UK and
 * US editions leave prices unconverted, and AUD and USD both print as "$"). Flag, then "Australian stores · prices in
 * AUD" (or the region's tax note when `tax` is set).
 */
export function RegionTag({ region, tax, className = "" }: { region: RegionId; tax?: boolean; className?: string }) {
  const R = REGIONS[region];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-ink-mute ${className}`}>
      <Flag code={region} />
      <span>
        {R.adjective} stores · {tax ? R.taxNote.replace(/^Prices/, "prices") : `prices in ${R.currency}`}
      </span>
    </span>
  );
}

/** A price with its ISO currency code after it: "$1,299 AUD". The code is what tells AUD from USD. */
export function Currency({ region, className = "" }: { region: RegionId; className?: string }) {
  return <span className={`ml-1 text-[0.6em] font-semibold tracking-wide text-ink-mute ${className}`}>{REGIONS[region].currency}</span>;
}
