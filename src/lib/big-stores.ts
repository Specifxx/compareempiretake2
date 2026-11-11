/**
 * "Also check these big stores" (owner, 2026-11-11: shoppers will not use the site without Harvey Norman, Walmart,
 * Currys and the like, and these chains block every server read, so we cannot show their price).
 *
 * The honest substitute: a plain link to the store's own search for this product, no price, no claim. A chain is listed
 * here only while we read NONE of its prices (a store that gets a feed or a reader leaves this list, so a product never
 * shows the same store twice). Links go through `storeLink`, so a chain that accepts us on Awin or Impact becomes a
 * tracked, labelled paid link by itself; until then it is a plain nofollow link that earns nothing and says so.
 * Never a price, never ranked, counted as a store, in a deal, an alert or a cart.
 */
import type { RegionId } from "./region";

export interface BigStore {
  name: string;
  /** The store's own site search for a query. */
  search: (q: string) => string;
  /** Category ids it sells; omitted = every electronics category. */
  only?: string[];
}
const e = encodeURIComponent;

export const BIG_STORES: Partial<Record<RegionId, BigStore[]>> = {
  au: [
    { name: "Harvey Norman", search: (q) => `https://www.harveynorman.com.au/catalogsearch/result/?q=${e(q)}` },
    { name: "Big W", search: (q) => `https://www.bigw.com.au/search?q=${e(q)}` },
    { name: "Kmart", search: (q) => `https://www.kmart.com.au/search/?searchTerm=${e(q)}` },
    { name: "Kogan", search: (q) => `https://www.kogan.com/au/shop/?q=${e(q)}` },
  ],
  us: [
    { name: "Walmart", search: (q) => `https://www.walmart.com/search?q=${e(q)}` },
    { name: "Best Buy", search: (q) => `https://www.bestbuy.com/site/searchpage.jsp?st=${e(q)}` },
    { name: "Target", search: (q) => `https://www.target.com/s?searchTerm=${e(q)}` },
    { name: "Newegg", search: (q) => `https://www.newegg.com/p/pl?d=${e(q)}`, only: ["laptops", "desktops", "monitors", "graphics-cards", "cpus", "routers", "headphones", "tablets", "phones", "tvs", "speakers", "soundbars", "consoles", "cameras", "smartwatches", "drones"] },
    { name: "B&H Photo", search: (q) => `https://www.bhphotovideo.com/c/search?q=${e(q)}`, only: ["cameras", "drones", "headphones", "laptops", "monitors", "tvs", "speakers", "soundbars", "tablets", "graphics-cards", "cpus", "desktops", "smartwatches", "consoles"] },
  ],
  uk: [
    { name: "Currys", search: (q) => `https://www.currys.co.uk/search?q=${e(q)}` },
    { name: "Argos", search: (q) => `https://www.argos.co.uk/search/${e(q)}/` },
    { name: "John Lewis", search: (q) => `https://www.johnlewis.com/search?search-term=${e(q)}` },
  ],
};

/** The chains to link for a product in this category, region and query (empty when none applies). */
export function bigStoresFor(region: RegionId, category: string, query: string): { name: string; url: string }[] {
  const q = query.trim().slice(0, 120);
  if (!q) return [];
  return (BIG_STORES[region] ?? [])
    .filter((s) => !s.only || s.only.includes(category))
    .map((s) => ({ name: s.name, url: s.search(q) }));
}
