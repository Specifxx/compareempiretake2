import Link from "next/link";
import type { HotLaunch, StorePreorder } from "@/lib/launches";
import { GTA6_REGIONS } from "@/lib/gta6";
import { money, REGIONS, withRegion, type RegionId } from "@/lib/region";

// The homepage's "Hot right now" row (owner, 2026-11-03): the year's big launches straight under the hero, each with the
// region's cheapest store price today and how many stores have it. Every price is a store's; the dates are the maker's.
const day = (iso: string, region: RegionId) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(REGIONS[region].locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function HotLaunches({ items, preorders = [], region }: { items: HotLaunch[]; preorders?: StorePreorder[]; region: RegionId }) {
  if (!items.length && !preorders.length) return null;
  return (
    <section className="container-x" aria-labelledby="hot-launches">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow">Just launched</div>
          <h2 id="hot-launches" className="font-display text-xl font-bold tracking-tight sm:text-2xl">Hot right now</h2>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-x-4 gap-y-1">
          {GTA6_REGIONS.includes(region) && <Link prefetch={false} href={withRegion("/gta-6", region)} className="chip text-sm font-semibold text-hot">GTA 6 out 19 Nov: console prices →</Link>}
          <Link prefetch={false} href={withRegion("/launches", region)} className="text-sm font-semibold text-brand hover:underline">All launches →</Link>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ launch, product, status }, i) => {
          const when = status === "pre-order" ? `Pre-order · out ${day(launch.releaseDate, region)}` : `Out ${day(launch.releaseDate, region)}`;
          const body = (
            <>
              <div className="img-tile relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg sm:h-28 sm:w-28">
                {product?.image && <img src={product.image} alt={product.name} loading={i < 2 ? "eager" : "lazy"} className="product-img h-full w-full object-contain p-2" />}
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-hot px-2 py-0.5 text-[10px] font-bold text-white">New</span>}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-ink-mute">{launch.brand}</div>
                <h3 className="font-display text-lg font-bold leading-tight">{launch.name}</h3>
                <div className="line-clamp-1 text-xs text-ink-soft">{launch.tagline}</div>
                <div className={`mt-1 text-xs font-semibold ${status === "pre-order" ? "text-brand" : "text-save"}`}>{when}</div>
                {product ? (
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="price text-xl">{money(product.bestPrice, region)}</span>
                    <span className="text-xs text-ink-mute">
                      at {product.retailerCount} {product.retailerCount === 1 ? "store" : "stores"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-ink-mute">No store price yet</div>
                )}
              </div>
            </>
          );
          return product ? (
            <Link key={launch.key} prefetch={false} href={product.href} className="card flex items-center gap-4 p-3 transition hover:shadow-lift">
              {body}
            </Link>
          ) : (
            <div key={launch.key} className="card flex items-center gap-4 p-3">
              {body}
            </div>
          );
        })}
        {/* Store pre-orders found in the import (lib/preorders.ts): the stores' own words, no maker date to show. */}
        {preorders.map(({ product, stores }) => (
          <Link key={`pre-${product.category}-${product.slug}`} prefetch={false} href={product.href} className="card flex items-center gap-4 p-3 transition hover:shadow-lift">
            <div className="img-tile relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-lg sm:h-28 sm:w-28">
              {product.image && <img src={product.image} alt={product.name} loading="lazy" className="product-img h-full w-full object-contain p-2" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-ink-mute">{product.brand}</div>
              <h3 className="font-display text-lg font-bold leading-tight">{product.name}</h3>
              <div className="line-clamp-1 text-xs text-ink-soft">{product.subtitle}</div>
              <div className="mt-1 text-xs font-semibold text-brand">Pre-order open at {stores} {stores === 1 ? "store" : "stores"}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="price text-xl">{money(product.bestPrice, region)}</span>
                <span className="text-xs text-ink-mute">at {product.retailerCount} {product.retailerCount === 1 ? "store" : "stores"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
