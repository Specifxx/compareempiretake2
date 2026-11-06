import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PhoneBrowser } from "@/components/PhoneBrowser";
import { gridProps, gridSrc } from "@/lib/browse";
import { activeCategories, activeRetailers, categoryHref, getProducts, getSummaries, gridVersion, type PhoneSummary } from "@/lib/catalog";
import { CATEGORY_GUIDES } from "@/lib/category-guides";
import { GuideCard } from "@/components/GuideCard";
import { guidesForCategory } from "@/lib/guides";
import { SITE } from "@/lib/site";
import { HOME_PATH, money, withXDefault, REGION_IDS, REGIONS, withRegion, type RegionId } from "@/lib/region";
import { categoryById, CATEGORIES, DEPARTMENTS } from "@/lib/categories";
import type { CategoryId } from "@/lib/types";
import { ogImage } from "@/lib/og";
import { pickShareProduct, sharePhotos } from "@/lib/share-rows";
import { EbayStrip } from "@/components/EbayStrip";
import { AmazonPicks } from "@/components/AmazonPicks";

/** Top categories that get an Amazon picks section (high-intent, well stocked on Amazon AU). */
const AMAZON_PICK_CATEGORIES: CategoryId[] = ["phones", "tvs", "laptops", "headphones", "tablets", "smartwatches", "consoles", "robot-vacuums"];

export type CategoryParams = Promise<{ category: string }>;
export const categoryParams = (region: RegionId) => activeCategories(region).map((c) => ({ category: c.id }));
const inRegion = (region: RegionId) => ({ au: "Australia", us: "the US", uk: "the UK", ca: "Canada", sg: "Singapore" })[region];
/** Search Console (2026-10-29): category pages rank for "<category> price comparison" (US robot vacuums: 7,600
 *  impressions at position 6, no clicks) under a title that never said it. */
/** The three brands with the most products, in that order. */
function topBrands(brands: (string | undefined)[]): string[] {
  const n = new Map<string, number>();
  for (const b of brands) if (b) n.set(b, (n.get(b) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => b);
}

/** A search snippet that answers the click: how many, which brands, how many stores, the cheapest today. */
export function categoryDescription(d: { count: number; noun: string; brands: string[]; stores: number; adjective: string; from: string | null }): string {
  const brands = d.brands.length ? ` from ${d.brands.join(", ")} and more` : "";
  return `Compare ${d.count.toLocaleString("en-AU")} ${d.noun}${brands} across ${d.stores} ${d.adjective} stores${d.from ? `, from ${d.from} today` : ""}. See the cheapest store for each model, with prices checked daily and full price history.`;
}

const placeName = (region: RegionId) => ({ au: "Australia", us: "US", uk: "UK", ca: "Canada", sg: "Singapore" })[region];

export async function categoryMetadata(params: CategoryParams, region: RegionId): Promise<Metadata> {
  const c = categoryById((await params).category);
  if (!c) return {};
  const stores = activeRetailers(c.id as CategoryId, region);
  const R = REGIONS[region];
  const langs = withXDefault(Object.fromEntries(REGION_IDS.filter((r) => activeCategories(r).some((x) => x.id === c.id)).map((r) => [REGIONS[r].hreflang, categoryHref(c.id, r)])));
  const products = getSummaries(c.id as CategoryId, region).filter((p) => p.inStock && p.bestPrice > 0);
  const count = getProducts(c.id as CategoryId, region).length;
  const what = c.searchName ?? c.name;
  const place = placeName(region);
  // Search Console (25–31 Oct): 54K impressions at 0.1% CTR, "router price comparison" 2,286 impressions and
  // 1 click. The title says the query, the month (a dated title reads as current; pages rebuild daily) and the
  // store count; longest first, each kept under ~60 characters so Google shows the whole thing.
  const month = new Date().toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const title =
    [
      `${what} Price Comparison ${place} (${month}): ${stores.length} Stores`,
      `${what} Price Comparison ${place}: ${stores.length} Stores Compared`,
      `${what} Price Comparison ${place}: ${stores.length} Stores`,
      `${what} Price Comparison ${place}`,
    ].find((t) => t.length <= 60) ?? `${what} Price Comparison ${place}`;
  const low = products.length ? Math.min(...products.map((p) => p.bestPrice)) : 0;
  const description = categoryDescription({
    count,
    noun: c.name.toLowerCase(),
    brands: topBrands(getProducts(c.id as CategoryId, region).map((p) => p.brand)),
    stores: stores.length,
    adjective: R.adjective,
    from: low ? money(low, region) : null,
  });
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: categoryHref(c.id, region), ...(Object.keys(langs).length > 1 ? { languages: langs } : {}) },
    openGraph: { url: categoryHref(c.id, region), images: [{ url: categoryCard(c.id as CategoryId, c.name, stores.length, region), width: 1200, height: 630 }] },
  };
}

/** The category's share card: its name, store count and one real product's store prices (src/app/og/route.tsx). */
function categoryCard(id: CategoryId, name: string, stores: number, region: RegionId): string {
  const products = getProducts(id, region);
  const hero = pickShareProduct(products);
  const extra = sharePhotos(products, 4, new Set(hero ? [hero.p.slug] : [])).filter((u) => u !== hero?.p.image).slice(0, 3);
  return ogImage({ kind: "category", title: `Compare ${name.toLowerCase()} prices in ${inRegion(region)}`, category: name, stores, region, product: hero?.p.name, image: hero?.p.image, rows: hero?.rows, extra });
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
        <Link prefetch={false} href={HOME_PATH[region]} className="hover:text-ink">Home</Link> /{" "}
        <Link prefetch={false} href={region === "au" ? "/categories" : withRegion("/browse", region)} className="hover:text-ink">All categories</Link> / <span>{dept.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            <span className="mr-2">{c.emoji}</span>
            {c.searchName ?? c.name} <span className="text-ink-mute">price comparison</span>
          </h1>
          <p className="mt-2 max-w-2xl text-ink-mute">
            {products.length.toLocaleString()} products across {stores.length} {REGIONS[region].adjective} stores. {c.blurb}
          </p>
        </div>
        {siblings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Link prefetch={false} href={withRegion(`/deals/${c.id}`, region)} className="chip text-xs font-semibold text-hot">🔥 {c.name} deals</Link>
            {siblings.map((s) => (
              <Link prefetch={false} key={s.id} href={categoryHref(s.id, region)} className="chip text-xs">{s.emoji} {s.name}</Link>
            ))}
          </div>
        )}
      </div>
      <div className="mt-8">
        {/* The first page only; the full list is a static file the browser loads (lib/browse.ts). */}
        <PhoneBrowser key={`${region}/${id}`} {...gridProps(products, id, { brands: true, cats: false, src: gridSrc.category(region, id), version: gridVersion(region) })} category={id} />
      </div>
      <CategoryGuideSection id={id} name={c.name} region={region} products={products} />
      {region === "au" && <CategoryGuides id={id} name={c.name} />}
      {region === "au" && AMAZON_PICK_CATEGORIES.includes(id) && <AmazonPicks category={id} title={`Top ${c.name.toLowerCase()} picks on Amazon AU`} />}
      <EbayStrip query={c.noun} label={c.name.toLowerCase()} customid={`${region === "au" ? "" : `${region}-`}cat-${c.id}`} phones={c.id === "phones"} region={region} />
    </div>
  );
}

/** The guides written for this category, so every category page links its articles (and they get crawled). */
function CategoryGuides({ id, name }: { id: CategoryId; name: string }) {
  const list = guidesForCategory(id, 6);
  if (!list.length) return null;
  return (
    <section className="mt-16">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{name} guides</h2>
          <p className="mt-1 text-sm text-ink-mute">Best picks, comparisons and where to buy, with today&apos;s prices.</p>
        </div>
        <Link prefetch={false} href="/guides" className="hidden shrink-0 text-sm font-semibold text-brand hover:underline sm:inline">All guides →</Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((g) => <GuideCard key={g.slug} g={g} />)}
      </div>
    </section>
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
    { name: "Home", item: `${SITE}${HOME_PATH[region] === "/" ? "" : HOME_PATH[region]}` || SITE },
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
              <Link prefetch={false} key={b} href={`/brands/${b.toLowerCase().replace(/[^a-z0-9]+/g, "-")}?cat=${id}`} className="chip text-xs">{b} <span className="text-ink-mute">{n}</span></Link>
            ) : (
              <span key={b} className="chip text-xs">{b} <span className="text-ink-mute">{n}</span></span>
            ),
          )}
        </div>
        <p className="mt-6 text-sm text-ink-mute">
          See every {name.toLowerCase().replace(/s$/, "")} in one list: <Link prefetch={false} href={withRegion(`/browse/${id}`, region)} className="underline">all {name.toLowerCase()} A to Z</Link>.
        </p>
      </div>
    </section>
  );
}
