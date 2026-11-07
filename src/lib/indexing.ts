import type { RegionId } from "./region";
import type { Phone } from "./types";

/**
 * Which product pages search engines are asked to index, and when each last changed (DECISIONS.md,
 * 2026-11-05 "Thin pages out of the index"). Pure functions: the sitemap (lib/seo.ts), the product page's
 * robots tag (views/ProductView.tsx) and the brand page read them; tests/indexing.test.ts pins them.
 */

/** An outright offer a buyer can act on today. */
const live = (p: Phone) => p.variants.some((v) => v.offers.some((o) => o.inStock && o.kind !== "plan"));

/**
 * Stores a product needs in a region before its page there is indexable. Two in Australia, the US and the UK, where a
 * two-store page is a real comparison among dozens of stores. Three in Canada and Singapore (SEO audit, 2026-11-07):
 * with few stores there, most products have one or two, and those copies of a product Google already sees in the
 * bigger regions read as thin. DECISIONS.md, 2026-11-07 "Small regions index three-store pages only".
 */
export const MIN_INDEX_STORES: Record<RegionId, number> = { au: 2, us: 2, uk: 2, ca: 3, sg: 3 };
const indexFloor = (region: RegionId) => MIN_INDEX_STORES[region] ?? 2;

/**
 * A product page is indexable when it compares something: MIN_INDEX_STORES stores, at least one of them with it in
 * stock. A thinner page or an all-sold-out page stays live and linked (follow) but asks not to be indexed, and is left
 * out of the sitemap and of every other page's hreflang.
 */
export const productIndexable = (p: Phone) => p.retailerCount >= indexFloor(p.region ?? "au") && live(p);

/**
 * Which indexable product pages the sitemap lists. Australia lists only the strongest tier (three or more stores, in
 * stock; `SITEMAP_MIN_STORES` in Vercel can widen it to 2). The US, UK, Canada and Singapore list every indexable page,
 * two or more stores (owner, 2026-11-06: the US sitemap held 245 of ~970 comparable US products, so Google could not
 * find most of them; DECISIONS.md "Every comparable US and UK product in the sitemap"). One-store pages stay out
 * everywhere: they are noindex (`productIndexable`).
 */
export const SITEMAP_MIN_STORES = Math.max(2, Number(process.env.SITEMAP_MIN_STORES || 3));
const sitemapFloor = (region: RegionId) => Math.max(indexFloor(region), region === "au" ? SITEMAP_MIN_STORES : 2);
export const productInSitemap = (p: Phone) => p.retailerCount >= sitemapFloor(p.region ?? "au") && live(p);

/**
 * IndexNow (scripts/indexnow.ts) keeps the three-store tier in every region: each URL it sends is fetched by four
 * engines minutes after a deploy, when the CDN is empty (DECISIONS.md, 2026-11-06 Vercel cost). The sitemap is read
 * at Google's own pace, so widening it does not bring that burst.
 */
export const productInIndexNow = (p: Phone) => p.retailerCount >= 3 && live(p);

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

/**
 * The search snippet under a product title (Search Console 90 days to 2026-11-04, the owner's audit of 11-07: the
 * top product pages drew 0.6–1.3% CTR, and their queries name stores — "iphone 16e good guys", "airpods 4 harvey
 * norman", "dji mini 5 pro harvey norman"). It names the cheapest store and the next stores by price, then what the
 * page has, longest form first, kept within 160 characters so Google shows all of it.
 */
export function productDescription(d: { name: string; price: string; store: string; others: string[]; stores: number; adjective: string; variants: string[] }): string {
  const lead = `${d.name} from ${d.price}${d.store ? ` at ${d.store}` : ""}.`;
  const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const storeWord = d.stores === 1 ? "store" : "stores";
  const sizes = d.variants.length > 1 ? ` in ${list(d.variants)}` : "";
  const tails = [" Price history and whether today's price is a good one.", " With price history.", ""];
  const candidates: string[] = [];
  for (let k = Math.min(3, d.others.length); k >= 0; k--) {
    const also = k ? ` Also at ${list(d.others.slice(0, k))}:` : "";
    const compare = `${also} compare ${d.stores} ${d.adjective} ${storeWord}`.replace(/^ c/, " C");
    for (const sz of sizes ? [sizes, ""] : [""]) for (const t of tails) candidates.push(`${lead}${compare}${sz}.${t}`);
  }
  return candidates.find((t) => t.length <= 160) ?? lead;
}
