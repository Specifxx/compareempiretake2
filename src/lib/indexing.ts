import type { Phone } from "./types";

/**
 * Which product pages search engines are asked to index, and when each last changed (DECISIONS.md,
 * 2026-11-05 "Thin pages out of the index"). Pure functions: the sitemap (lib/seo.ts), the product page's
 * robots tag (views/ProductView.tsx) and the brand page read them; tests/indexing.test.ts pins them.
 */

/** An outright offer a buyer can act on today. */
const live = (p: Phone) => p.variants.some((v) => v.offers.some((o) => o.inStock && o.kind !== "plan"));

/**
 * A product page is indexable when it compares something: two or more stores, at least one of them with it in
 * stock. A one-store page or an all-sold-out page stays live and linked (follow) but asks not to be indexed.
 */
export const productIndexable = (p: Phone) => p.retailerCount >= 2 && live(p);

/**
 * The sitemap lists only the strongest tier: three or more stores, in stock. The rest of the indexable pages
 * are reached through /browse and the category grids; the tier widens once Search Console shows this one indexed.
 */
export const SITEMAP_MIN_STORES = Math.max(2, Number(process.env.SITEMAP_MIN_STORES || 3));
export const productInSitemap = (p: Phone) => p.retailerCount >= SITEMAP_MIN_STORES && live(p);

/** A brand page is indexable when at least one of its products is. */
export const brandIndexable = (products: Phone[]) => products.some(productIndexable);

/**
 * When a product page last changed: the most recent day any variant's best price moved (from the price series,
 * `[date, price]` per variant), else the day the product was first seen. Never the build time: every URL with the
 * same timestamp teaches Google to ignore the field.
 */
export function productLastmod(p: Pick<Phone, "firstSeen">, series: Record<string, [string, number][]>): string | undefined {
  let last: string | undefined;
  for (const points of Object.values(series)) {
    let prev: number | undefined;
    for (const [day, price] of points) {
      if (prev !== undefined && price !== prev && (!last || day > last)) last = day;
      prev = price;
    }
  }
  return last ?? (p.firstSeen || undefined);
}

/** The latest of several lastmod dates (YYYY-MM-DD or ISO), for a page that lists several products. */
export const latest = (dates: (string | undefined)[]) => dates.filter((d): d is string => !!d).sort().at(-1);

/**
 * The slug a listing got when a store's title still carried HTML entities ("Bowers &amp; Wilkins" →
 * "bowers-amp-wilkins", "Weber&#174" → "weber-174"). The catalogue builder now decodes them, so these are the
 * clean slugs the same products have; an old URL is redirected when its clean form exists.
 */
const ENTITY_ARTEFACTS = /-(amp|quot|apos|nbsp|lt|gt|174|8482|169)(?=-|$)/g;
export function cleanedSlug(slug: string): string | undefined {
  const clean = slug.replace(ENTITY_ARTEFACTS, "").replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  return clean !== slug ? clean : undefined;
}

/**
 * The search result's title (Search Console, 2026-11-05: product pages at positions 4–9 drew 0.2% of their
 * impressions). It says the price, the store and how many stores were compared, longest form first, each kept
 * within 70 characters; a long product name falls back to the plain form.
 */
export function productTitle(d: { name: string; place: string; price: string; store: string; stores: number }): string {
  const n = d.stores;
  const at = d.store ? ` at ${d.store}` : "";
  const head = `${d.name} price in ${d.place}: `;
  return (
    [
      ...(n >= 2 ? [`${head}${d.price}${at}, ${n} stores compared`, `${head}${d.price}, ${n} stores compared`] : []),
      `${head}${d.price}${at}`,
      `${head}from ${d.price}`,
    ].find((t) => t.length <= 70) ?? `${d.name} price in ${d.place}`
  );
}
