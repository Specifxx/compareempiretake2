"use client";
import Link from "next/link";
import type { BrandInfo } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";

/**
 * The /brands grid. A client component only so the page's RSC payload carries one small row per
 * brand instead of every card's element tree (it was 400 KB of the page's 670 KB); the server
 * still renders every card into the HTML.
 */
export function BrandList({ brands }: { brands: BrandInfo[] }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {brands.map((b) => (
        <Link key={b.slug} href={`/brands/${b.slug}`} className="card group flex items-center gap-4 p-4 transition hover:shadow-lift">
          <div className="img-tile grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl">
            {b.image && <img src={b.image} alt="" className="product-img h-14 w-14 object-contain" loading="lazy" />}
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold">{b.brand}</div>
            <div className="text-xs text-ink-mute">{b.count} {b.count === 1 ? "product" : "products"} · from ${b.from.toLocaleString("en-AU")}</div>
            <div className="mt-0.5 line-clamp-1 text-[11px] text-ink-mute/80">{b.categories.map((c) => categoryById(c)?.name).join(" · ")}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
