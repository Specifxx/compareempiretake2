import { activeRetailers, getProducts } from "@/lib/catalog";
import { REGIONS, type RegionId } from "@/lib/region";
import { RetailerDot } from "@/components/RetailerChip";

/** Every store we check in a region, with how many listings each has today. */
export function StoresView({ region }: { region: RegionId }) {
  const R = REGIONS[region];
  const counts = new Map<string, number>();
  for (const p of getProducts(undefined, region)) for (const v of p.variants) for (const o of v.offers) counts.set(o.retailer, (counts.get(o.retailer) ?? 0) + 1);
  const stores = activeRetailers(undefined, region).sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  return (
    <div className="container-x max-w-3xl pt-12 pb-16">
      <div className="eyebrow">{R.flag} {R.name}</div>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight">The {stores.length} {R.adjective} stores we check</h1>
      <p className="mt-4 text-ink-soft">Every price comes from the store&apos;s own website, checked daily. {R.taxNote}. No store pays to rank higher.</p>
      <ul className="card mt-8 divide-y divide-line">
        {stores.map((r) => (
          <li key={r.id}>
            <a href={`https://www.${r.site.replace(/^www\./, "")}`} target="_blank" rel="noopener nofollow" className="flex items-center justify-between px-5 py-3.5 text-sm hover:bg-bg-sunk">
              <span className="inline-flex items-center gap-2 font-medium"><RetailerDot id={r.id} /> {r.name}</span>
              <span className="text-ink-mute">{(counts.get(r.id) ?? 0).toLocaleString()} listings</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
