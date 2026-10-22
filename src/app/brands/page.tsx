import type { Metadata } from "next";
import Link from "next/link";
import { getBrands } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Phone brands",
  description: "Compare phone prices by brand: Apple iPhone, Samsung Galaxy, Google Pixel, OPPO, Motorola and more across Australian retailers.",
  alternates: { canonical: "/brands" },
};

export default function BrandsPage() {
  const brands = getBrands();
  return (
    <div className="container-x pt-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Brands</h1>
      <p className="mt-2 text-ink-mute">{brands.length} phone brands sold new in Australia.</p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <Link key={b.slug} href={`/brands/${b.slug}`} className="card group flex items-center gap-4 p-4 transition hover:shadow-lift">
            <div className="img-tile grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl">
              {b.image && <img src={b.image} alt="" className="product-img h-14 w-14 object-contain" loading="lazy" />}
            </div>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold">{b.brand}</div>
              <div className="text-xs text-ink-mute">{b.count} {b.count === 1 ? "phone" : "phones"} · from ${b.from.toLocaleString("en-AU")}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
