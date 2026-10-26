import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { gridProps, gridSrc } from "@/lib/browse";
import { activeCategories, activeRetailers, categoryHref, getSummaries, gridVersion, type PhoneSummary } from "@/lib/catalog";
import { CATEGORY_GUIDES } from "@/lib/category-guides";
import { SITE } from "@/lib/site";
import { money, REGION_IDS, REGIONS, withRegion, type RegionId } from "@/lib/region";
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
    openGraph: { url: categoryHref(c.id, region), images: [{ url: ogImage({ title: `Compare ${c.name.toLowerCase()} prices in ${inRegion(region)}`, stores: stores.length, category: c.name, region }), width: 1200, height: 630 }] },
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
        <Link href={REGIONS[region].prefix || "/"} className="hover:text-ink">Home</Link> /{" "}
        <Link href={region === "au" ? "/categories" : withRegion("/browse", region)} className="hover:text-ink">All categories</Link> / <span>{dept.name}</span>
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
        {/* The first page only; the full list is a static file the browser loads (lib/browse.ts). */}
        <PhoneBrowser key={`${region}/${id}`} {...gridProps(products, id, { brands: true, cats: false, src: gridSrc.category(region, id), version: gridVersion(region) })} category={id} />
      </div>
      <CategoryGuideSection id={id} name={c.name} region={region} products={products} />
      {region === "au" && AMAZON_PICK_CATEGORIES.includes(id) && <AmazonPicks category={id} title={`Top ${c.name.toLowerCase()} picks on Amazon AU`} />}
      <EbayStrip query={c.noun} label={c.name.toLowerCase()} customid={`${region === "au" ? "" : `${region}-`}cat-${c.id}`} phones={c.id === "phones"} region={region} />
    </div>
  );
}

/** Buying guide, price range, top brands and FAQ under the grid: real content, not just a price table. */
function CategoryGuideSection({ id, name, region, products }: { id: CategoryId; name: string; region: RegionId; products: PhoneSummary[] }) {
  const guide = CATEGORY_GUIDES[id];
  const priced = products.filter((p) => p.bestPrice > 0).map((p) => p.bestPrice).sort((a, b) => a - b);
  if (!priced.length) return null;
  const $ = (n: number) => money(n, region);
  const median = priced[Math.floor(priced.length / 2)];
  const multi = products.filter((p) => p.retailerCount >= 2).length;
  const brands = [...products.reduce((m, p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const faq: [string, string][] = [
    [`How much do ${name.toLowerCase()} cost?`, `Across the ${products.length.toLocaleString()} ${name.toLowerCase()} we compare, today's lowest prices run from ${$(priced[0])} to ${$(priced[priced.length - 1])}; the middle of the range is about ${$(median)}.`],
    ...(guide?.faq ?? []),
  ];
  const crumbs = [
    { name: "Home", item: `${SITE}${REGIONS[region].prefix}` || SITE },
    { name, item: `${SITE}${categoryHref(id, region)}` },
  ];
  const ld = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, ...c })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  return (
    <section className="mt-16 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div>
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">How to choose {name.toLowerCase()}</h2>
        {guide && (
          <ul className="card mb-6 space-y-3 p-5 text-sm leading-relaxed text-ink-soft">
            {guide.tips.map((t) => <li key={t} className="flex gap-2"><span className="text-brand">✓</span><span>{t}</span></li>)}
          </ul>
        )}
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{name} FAQ</h2>
        <div className="card divide-y divide-line">
          {faq.map(([q, a]) => (
            <details key={q} className="px-5 py-4" open>
              <summary className="cursor-pointer list-none font-semibold">{q}</summary>
              <p className="mt-2 text-sm text-ink-soft">{a}</p>
            </details>
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight">{name} at a glance</h2>
        <dl className="card divide-y divide-line text-sm">
          {([
            ["Products compared", products.length.toLocaleString()],
            ["Sold by 2+ stores", multi.toLocaleString()],
            ["Cheapest today", $(priced[0])],
            ["Typical price", $(median)],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 px-5 py-3"><dt className="text-ink-mute">{k}</dt><dd className="font-medium">{v}</dd></div>
          ))}
        </dl>
        <h3 className="mb-3 mt-6 font-semibold">Top brands</h3>
        <div className="flex flex-wrap gap-2">
          {brands.map(([b, n]) =>
            region === "au" ? (
              <Link key={b} href={`/brands/${b.toLowerCase().replace(/[^a-z0-9]+/g, "-")}?cat=${id}`} className="chip text-xs">{b} <span className="text-ink-mute">{n}</span></Link>
            ) : (
              <span key={b} className="chip text-xs">{b} <span className="text-ink-mute">{n}</span></span>
            ),
          )}
        </div>
        <p className="mt-6 text-sm text-ink-mute">
          See every {name.toLowerCase().replace(/s$/, "")} in one list: <Link href={withRegion(`/browse/${id}`, region)} className="underline">all {name.toLowerCase()} A to Z</Link>.
        </p>
      </div>
    </section>
  );
}
