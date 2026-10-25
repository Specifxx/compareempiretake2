import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { activeCategories, activeRetailers, categoryHref, getSummaries } from "@/lib/catalog";
import { REGION_IDS, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { categoryById, CATEGORIES, DEPARTMENTS } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { ogImage } from "@/lib/og";
import { EbayStrip } from "@/components/EbayStrip";
import { AmazonPicks } from "@/components/AmazonPicks";

/** Top categories that get an Amazon picks section (high-intent, well stocked on Amazon AU). */
const AMAZON_PICK_CATEGORIES: CategoryId[] = ["phones", "tvs", "laptops", "headphones", "tablets", "smartwatches", "consoles", "robot-vacuums"];

export type CategoryParams = Promise<{ category: string }>;
export const categoryParams = (region: RegionId) => activeCategories(region).map((c) => ({ category: c.id }));
const inRegion = (region: RegionId) => (region === "au" ? "Australia" : region === "us" ? "the US" : "the UK");

export async function categoryMetadata(params: CategoryParams, region: RegionId): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  const stores = activeRetailers(c.id as CategoryId, region);
  const R = REGIONS[region];
  const langs = Object.fromEntries(REGION_IDS.filter((r) => activeCategories(r).some((x) => x.id === c.id)).map((r) => [REGIONS[r].hreflang, categoryHref(c.id, r)]));
  return {
    title: `${c.name} — compare prices in ${inRegion(region)}`,
    description: `Compare ${c.noun} prices across ${stores.length} ${R.adjective} stores including ${stores.slice(0, 4).map((r) => r.name).join(", ")}. ${c.blurb} Price history on every product.`,
    alternates: { canonical: categoryHref(c.id, region), ...(Object.keys(langs).length > 1 ? { languages: langs } : {}) },
    openGraph: { images: [{ url: ogImage({ title: `Compare ${c.name.toLowerCase()} prices in ${inRegion(region)}`, stores: stores.length, category: c.name, region }), width: 1200, height: 630 }] },
  };
}

export async function CategoryView({ params, region }: { params: CategoryParams; region: RegionId }) {
  const c = categoryById((await params).category);
  if (!c) notFound();
  const id = c.id as CategoryId;
  const products = getSummaries(id, region);
  const stores = activeRetailers(id, region);
  const dept = DEPARTMENTS.find((d) => d.id === c.department)!;
  const live = new Set(activeCategories(region).map((x) => x.id));
  const siblings = CATEGORIES.filter((x) => x.department === c.department && live.has(x.id) && x.id !== c.id);
  return (
    <div className="container-x pt-8">
      <nav className="mb-4 text-sm text-ink-mute" aria-label="Breadcrumb">
        <Link href="/categories" className="hover:text-ink">All categories</Link> / <span>{dept.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="mr-2">{c.emoji}</span>
            {c.name}
          </h1>
          <p className="mt-2 max-w-2xl text-ink-mute">
            {products.length.toLocaleString()} products across {stores.length} {REGIONS[region].adjective} stores. {c.blurb}
          </p>
        </div>
        {siblings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link href={withRegion(`/deals/${c.id}`, region)} className="chip text-xs font-semibold text-hot">🔥 {c.name} deals</Link>
            {siblings.map((s) => (
              <Link key={s.id} href={categoryHref(s.id, region)} className="chip text-xs">{s.emoji} {s.name}</Link>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Suspense>
          <PhoneBrowser phones={products} category={id} />
        </Suspense>
      </div>
      {region === "au" && AMAZON_PICK_CATEGORIES.includes(id) && <AmazonPicks category={id} title={`Top ${c.name.toLowerCase()} picks on Amazon AU`} />}
      <EbayStrip query={c.noun} label={c.name.toLowerCase()} customid={`${region === "au" ? "" : `${region}-`}cat-${c.id}`} phones={c.id === "phones"} region={region} />
    </div>
  );
}
