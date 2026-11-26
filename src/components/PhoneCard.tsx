import Link from "next/link";
import type { CardItem } from "@/lib/browse";
import { categoryById } from "@/lib/categories";
import { CompareToggle } from "./CompareToggle";
import { SaveButton } from "./SaveButton";
import { money } from "@/lib/region";
import { Currency } from "./RegionTag";
import { sized } from "@/lib/image-size";

/**
 * One product in a grid, drawn like a big comparison site's listing (owner, 2026-11-10): photo on white, name,
 * the lowest price and how many stores it was compared across. A click opens the product page (no quick view).
 */
export function PhoneCard({ p, priority, showCategory }: { p: CardItem; priority?: boolean; showCategory?: boolean }) {
  const pct = p.saving > 0 ? Math.round((p.saving / (p.bestPrice + p.saving)) * 100) : 0;
  return (
    <Link href={p.href} prefetch={false} className="card tile-hover group relative flex flex-col overflow-hidden">
      <div className="img-tile pc-plate relative aspect-[4/3.4] border-b border-line/60">
        {p.image ? (
          <img src={sized(p.image, 220)} alt={p.name} loading={priority ? "eager" : "lazy"} className="product-img absolute inset-0 h-full w-full object-contain p-5" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-ink-mute/50" aria-label="No photo yet">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></svg>
          </div>
        )}
        {/* One badge per photo (2026-11-27, the shared design standard): the saving, else "Lowest price yet". */}
        {(pct >= 5 || p.atLowest) && (
          <div className="absolute left-2.5 top-2.5">
            {pct >= 5 ? <span className="pc-badge rounded-[6px] bg-save px-1.5 py-0.5 text-[11px] font-bold text-bg-card">−{pct}%</span> : <span className="pc-badge rounded-[6px] bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg-card">Lowest price yet</span>}
          </div>
        )}
        <SaveButton slug={p.href} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-brand group-hover:underline">
          {p.brand && !p.model.toLowerCase().startsWith(p.brand.toLowerCase()) ? `${p.brand} ` : ""}{p.model}
        </h3>
        <div className="mt-0.5 line-clamp-1 text-xs text-ink-mute">
          {showCategory && <>{categoryById(p.category)?.name} · </>}
          {p.subtitle}
          {p.foldable && " · Foldable"}
          {p.network === "4G" && " · 4G"}
        </div>
        <div className="mt-auto pt-3">
          <div className="price whitespace-nowrap text-lg leading-none">
            <span className="mr-1 text-xs font-medium text-ink-mute">from</span>
            {money(p.bestPrice, p.region)}
            {p.region && <Currency region={p.region} />}
          </div>
          {/* Two quiet lines, one colour (2026-11-27): how many stores, and eBay's price labelled as eBay's. */}
          <div className="mt-1.5 text-xs text-ink-mute">
            {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"} compared
          </div>
          {p.ebayPrice !== undefined && (
            <div className="mt-0.5 flex items-baseline gap-1 text-xs text-ink-mute">
              <span className="font-semibold text-ink-soft">eBay</span> {money(p.ebayPrice, p.region)}
            </div>
          )}
        </div>
        <div className="-mx-2 -mb-2 mt-1 flex justify-start">
          <CompareToggle slug={p.href} />
        </div>
      </div>
    </Link>
  );
}
