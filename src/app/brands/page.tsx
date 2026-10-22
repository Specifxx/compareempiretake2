import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/catalog";
import { categoryById } from "@/lib/categories";
import { MARKETPLACES } from "@/lib/marketplaces";

/** Brands Australians search for that no store we check sells new and local-warranty. */
const NOT_STOCKED = [
  ["Huawei", "Huawei stopped selling phones through Australian retailers; its phones also lack Google apps."],
  ["OnePlus", "No official Australian distribution; sold as grey imports."],
  ["vivo", "Left the Australian market; grey imports only."],
  ["Meizu", "Never officially sold in Australia."],
  ["Sony Xperia", "Sony stopped selling Xperia phones in Australia."],
  ["ASUS ROG / Zenfone", "Occasional grey imports only."],
] as const;

export const metadata: Metadata = {
  title: "Phone brands",
  description: "Compare prices by brand — Apple, Samsung, LG, Sony, ASUS, Dell and more — across phones, TVs, laptops, monitors and graphics cards.",
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  const brands = getBrands();
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Brands</h1>
      <p className="mt-2 text-ink-mute">{brands.length} brands sold new in Australia.</p>
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

      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Can&apos;t find a phone brand?</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-mute">
          These brands aren&apos;t sold new with an Australian warranty by any store we check, so there&apos;s nothing for us to compare yet. You can still find them as grey imports on the marketplaces — check the seller, warranty and 4G/5G bands for Australian networks. If a local store starts stocking one, it shows up here automatically.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NOT_STOCKED.map(([brand, why]) => (
            <div key={brand} className="card p-4">
              <div className="font-semibold">{brand}</div>
              <p className="mt-1 text-xs text-ink-mute">{why}</p>
              <div className="mt-3 flex gap-2">
                {MARKETPLACES.map((m) => (
                  <a key={m.id} href={m.url(`${brand} phone`)} target="_blank" rel="noopener nofollow sponsored" className="chip text-xs">Search {m.name}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
