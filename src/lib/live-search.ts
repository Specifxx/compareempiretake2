/**
 * Search everything (owner, 2026-11-10, plan B; DECISIONS.md 2026-11-10): one query answered from Compare Empire's
 * own catalogue and every sister's products (lib/family-search.ts), plus a tagged eBay search. Read by
 * /api/search (CDN-cached six hours per query) and /api/mcp (the MCP server for AI assistants). Reads only committed
 * files that ship with the deploy: no request fetches a store, a sister or an API.
 *
 * Rules carried over: prices are never converted (each region shows its own stores, in its own currency); results
 * are ordered by match, then price, never by commission; eBay is a labelled search link, never a price or a "best".
 * No Amazon search link for typed words (Amazon's Operating Agreement, DECISIONS.md 2026-11-02).
 */
import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { cheapestStore, getProduct, getProducts, getSeries, summarise, type PhoneSummary } from "./catalog";
import { categoryById } from "./categories";
import { ebaySearch } from "./ebay";
import { FAMILY_SEARCH_FILE, searchFamily, validIndex, type FamilyHit, type FamilySearchIndex, type FamilySearchRegion } from "./family-search";
import { parseHref } from "./product-refs";
import { REGION_IDS, REGIONS, type RegionId } from "./region";
import { RETAILERS } from "./retailers";
import { search } from "./search";
import { SITE } from "./site";
import { storeLink } from "./store-links";

export const QUERY_MIN = 2;
export const QUERY_MAX = 80;
export const RESULT_LIMIT = 20;

/** The query as the CDN keys it: trimmed, single-spaced, lower case. The page asks with exactly this. */
export const normaliseQuery = (q: string | null | undefined) => (q ?? "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, QUERY_MAX);
export const isRegion = (r: unknown): r is RegionId => typeof r === "string" && (REGION_IDS as string[]).includes(r);

export interface OwnHit {
  name: string;
  category?: string;
  /** Absolute product page on compareempire.com. */
  url: string;
  path: string;
  image?: string;
  /** From price, whole currency units (the catalogue's own unit). */
  price: number;
  currency: string;
  stores: number;
  inStock: boolean;
}
export interface SearchAnswer {
  query: string;
  region: RegionId;
  currency: string;
  /** Compare Empire's own products (tech and appliances). */
  products: OwnHit[];
  /** The sisters' products (cards, sealed, figures, wargames…), each a link to its own site. */
  family: (Omit<FamilyHit, "cents"> & { price: number })[];
  /** A tagged eBay search for the words typed (a link, never a price). */
  ebay: { url: string; label: string };
  /** Where the sister data comes from and how old it is. */
  generatedAt: string | null;
}

let family: FamilySearchIndex | null | undefined;
/** The committed index; null when it is missing or unreadable (results then come from our own catalogue only). */
export function familyIndex(): FamilySearchIndex | null {
  if (family !== undefined) return family;
  const f = path.join(process.cwd(), "data", "family", FAMILY_SEARCH_FILE);
  try {
    family = existsSync(f) ? validIndex(JSON.parse(readFileSync(f, "utf8"))) : null;
  } catch {
    family = null;
  }
  return family;
}

const summaries = new Map<RegionId, PhoneSummary[]>();
function ownSummaries(region: RegionId): PhoneSummary[] {
  let s = summaries.get(region);
  if (!s) {
    // Popular first, so equal matches keep the order the search box uses.
    s = getProducts(undefined, region).map(summarise).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation);
    summaries.set(region, s);
  }
  return s;
}

/** False when the deploy carries no catalogue for the region: answer with an error the CDN never keeps, not an empty list. */
export const hasCatalogue = (region: RegionId) => getProducts(undefined, region).length > 0;

export function searchEverything(rawQuery: string, region: RegionId, opts: { limit?: number; placement?: string; now?: number } = {}): SearchAnswer {
  const query = normaliseQuery(rawQuery);
  const limit = Math.min(opts.limit ?? RESULT_LIMIT, RESULT_LIMIT);
  const placement = opts.placement ?? "search";
  const currency = REGIONS[region].currency;
  const products: OwnHit[] = search(ownSummaries(region), query, limit).map((p) => ({
    name: p.name,
    category: categoryById(p.category)?.name,
    url: `${SITE}${p.href}`,
    path: p.href,
    image: p.image,
    price: p.bestPrice,
    currency,
    stores: p.retailerCount,
    inStock: p.inStock,
  }));
  const idx = familyIndex();
  const fam = searchFamily(idx, query, region.toUpperCase() as FamilySearchRegion, limit, opts.now).map(({ cents, ...h }) => ({ ...h, price: cents / 100 }));
  return {
    query,
    region,
    currency,
    products,
    family: fam,
    ebay: { url: ebaySearch(query, { condition: "new", customid: `${placement}-${region}`, region }), label: `eBay listings for “${query}”` },
    generatedAt: idx?.generatedAt ?? null,
  };
}

/** Every store's price for one Compare Empire product, cheapest in stock first (the MCP compare_prices tool). */
export function comparePrices(productPath: string, placement = "mcp") {
  const ref = parseHref(productPath.replace(/^https?:\/\/(www\.)?compareempire\.com/, "").replace(/[?#].*$/, ""));
  const p = ref && getProduct(ref.category, ref.slug, ref.region);
  if (!ref || !p) return null;
  const currency = REGIONS[ref.region].currency;
  return {
    name: p.name,
    url: `${SITE}${ref.href}`,
    region: ref.region,
    currency,
    cheapestStore: cheapestStore(p) ?? null,
    variants: p.variants.map((v) => ({
      variant: v.label,
      offers: v.offers
        .filter((o) => o.kind !== "plan")
        .sort((a, b) => Number(b.inStock) - Number(a.inStock) || a.price - b.price)
        .map((o) => ({
          store: RETAILERS[o.retailer]?.name ?? o.retailer,
          price: o.price,
          inStock: o.inStock,
          preorder: !!o.preorder,
          url: storeLink(o.url, placement).href,
        })),
    })),
    ebay: p.ebay ? { cheapestNewListing: p.ebay.price, checkedAt: p.ebay.checkedAt, url: ebaySearch(p.name, { condition: "new", customid: `${placement}-${ref.region}`, region: ref.region }) } : null,
    note: "Prices are each store's own, in the region's currency, never converted. eBay is a listing price, not a store.",
  };
}

/** Each variant's daily best price (the product page's chart), the last `days` days. */
export function priceHistory(productPath: string, days = 90) {
  const ref = parseHref(productPath.replace(/^https?:\/\/(www\.)?compareempire\.com/, "").replace(/[?#].*$/, ""));
  const p = ref && getProduct(ref.category, ref.slug, ref.region);
  if (!ref || !p) return null;
  const series = getSeries(p);
  return {
    name: p.name,
    url: `${SITE}${ref.href}`,
    currency: REGIONS[ref.region].currency,
    variants: p.variants.map((v) => ({ variant: v.label, days: (series[v.id] ?? []).slice(-Math.max(1, Math.min(days, 365))).map(([date, price]) => ({ date, price })) })),
  };
}
