import Link from "next/link";
import type { CardItem } from "@/lib/browse";
import { categoryById } from "@/lib/categories";
import { CompareToggle } from "./CompareToggle";
import { SaveButton } from "./SaveButton";
import { money } from "@/lib/region";
import { Currency } from "./RegionTag";

/**
 * One product in a grid, drawn like a big comparison site's listing (owner, 2026-11-10): photo on white, name,
 * the lowest price and how many stores it was compared across. A click opens the product page (no quick view).
 */
export function PhoneCard({ p, priority, showCategory }: { p: CardItem; priority?: boolean; showCategory?: boolean }) {
  const pct = p.saving > 0 ? Math.round((p.saving / (p.bestPrice + p.saving)) * 100) : 0;
  return (
    <Link href={p.href} prefetch={false} className="card tile-hover group relative flex flex-col overflow-hidden">
      <div className="img-tile relative aspect-[4/3.4] border-b border-line/60">
        {p.image ? (
          <img src={p.image} alt={p.name} loading={priority ? "eager" : "lazy"} className="product-img absolute inset-0 h-full w-full object-contain p-5" />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-mute">No image</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {pct >= 5 && <span className="rounded bg-save px-1.5 py-0.5 text-[11px] font-bold text-bg-card">−{pct}%</span>}
          {p.atLowest && <span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-bg-card">Lowest price yet</span>}
        </div>
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
          <div className="mt-1.5 text-xs font-medium text-brand">
            Compare {p.retailerCount} {p.retailerCount === 1 ? "store" : "stores"}
          </div>
          {p.ebayPrice !== undefined && <div className={`mt-0.5 text-xs ${p.ebayPrice < p.bestPrice ? "font-semibold text-save" : "text-ink-mute"}`}>eBay from {money(p.ebayPrice, p.region)}</div>}
        </div>
        <div className="-mx-2 -mb-2 mt-1 flex justify-start">
          <CompareToggle slug={p.href} />
        </div>
      </div>
    </Link>
  );
}
