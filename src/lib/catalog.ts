import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { dataVersion } from "./browse";
import { CATEGORIES } from "./categories";
import { storageLabel } from "./normalize";
import { priceCheck, wasCheck, type PriceCheck, type WasCheck } from "./price-check";
import { RETAILERS } from "./retailers";
import { ebayAffiliate } from "./ebay";
import { dataPath, money, REGION_IDS, REGIONS, withRegion, type RegionId } from "./region";
import type { Catalog, CategoryId, Offer, Phone, Retailer, RetailerId, StoreSeries, Variant } from "./types";

/**
 * Every live category's data/<id>/*.json (data/<region>/<id> outside Australia), read once per
 * server process: at build time for prerendered pages, and on the first request for product pages,
 * which render on demand. Each product carries its region, so product-level helpers (href, series,
 * price check) need no extra argument.
 */
type Series = Record<string, Record<string, [string, number][]>>;
interface Loaded { catalog: Catalog; series: Series; stores: StoreSeries }
interface RegionData { loaded: Map<CategoryId, Loaded>; all: Phone[]; bySlug: Map<string, Phone>; updated: string }
const read = <T,>(file: string, fallback: T): T => (existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : fallback);
const regions = new Map<RegionId, RegionData>();
function data(region: RegionId): RegionData {
  let d = regions.get(region);
  if (d) return d;
  const loaded = new Map<CategoryId, Loaded>();
  for (const c of CATEGORIES) {
    const dir = path.join(process.cwd(), dataPath(region, c.id));
    if (!c.live || !existsSync(path.join(dir, "catalog.json"))) continue;
    const catalog = read<Catalog>(path.join(dir, "catalog.json"), { category: c.id as CategoryId, updatedAt: "", retailers: [], phones: [] });
    for (const p of catalog.phones) {
      p.category ??= c.id as CategoryId;
      p.region = region;
    }
    loaded.set(c.id as CategoryId, { catalog, series: read(path.join(dir, "series.json"), {}), stores: read(path.join(dir, "store-series.json"), {}) });
  }
  // eBay listings from the daily Browse API job (scripts/ebay-prices.ts), keyed "<category>/<slug>".
  const ebay = read<{ listings: Record<string, NonNullable<Phone["ebay"]>> }>(path.join(process.cwd(), dataPath(region), "ebay.json"), { listings: {} }).listings;
  // Re-tagged here so a listing stored under an older campaign or customid still earns on today's (ce-…).
  for (const l of loaded.values())
    for (const p of l.catalog.phones) {
      const e = ebay[`${p.category}/${p.slug}`];
      // A listing whose postage eBay did not state is not shown (visitor feedback, 2026-10-31: postage the row hides is a
      // wasted click). Rows stored before then age out of the file within 5 days anyway.
      p.ebay = e && e.shipping !== undefined ? { ...e, url: ebayAffiliate(e.url, `p-${p.category}-${p.slug}-listing`, region) } : undefined;
    }
  const all = [...loaded.values()].flatMap((l) => l.catalog.phones);
  d = { loaded, all, bySlug: new Map(all.map((p) => [`${p.category}/${p.slug}`, p])), updated: [...loaded.values()].map((l) => l.catalog.updatedAt).sort().at(-1) ?? new Date().toISOString() };
  regions.set(region, d);
  return d;
}
const regionOfProduct = (p: Phone): RegionId => p.region ?? "au";

/** When the region's prices were last imported: the same value as getCatalog(undefined, region).updatedAt, without scanning every offer. */
export const regionUpdatedAt = (region: RegionId = "au") => data(region).updated;

/**
 * Stamps a grid list's URL (gridProps in lib/browse.ts): the region's import time and the deploy's
 * commit, so a browser never reuses a cached list across a data or a code change.
 */
export const gridVersion = (region: RegionId = "au") => [dataVersion(data(region).updated), process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)].filter(Boolean).join(".");

/** Categories that actually have products today. */
export const activeCategories = (region: RegionId = "au") => CATEGORIES.filter((c) => (data(region).loaded.get(c.id as CategoryId)?.catalog.phones.length ?? 0) > 0);

/** Regions with at least one product. */
export const liveRegions = (): RegionId[] => REGION_IDS.filter((r) => data(r).all.length > 0);

/** Retailers with at least one listing in any category. */
export function activeRetailers(category?: CategoryId, region: RegionId = "au"): Retailer[] {
  const ids = new Set(getProducts(category, region).flatMap((p) => p.variants.flatMap((v) => v.offers.map((o) => o.retailer))));
  return Object.values(RETAILERS).filter((r) => ids.has(r.id));
}

/** The combined catalogue (all categories), or one category's. */
export function getCatalog(category?: CategoryId, region: RegionId = "au"): Catalog {
  const d = data(region);
  return category
    ? d.loaded.get(category)?.catalog ?? { category, updatedAt: d.updated, retailers: [], phones: [] }
    : { category: "phones", updatedAt: d.updated, retailers: activeRetailers(undefined, region), phones: d.all };
}
export const getProducts = (category?: CategoryId, region: RegionId = "au") => (category ? data(region).loaded.get(category)?.catalog.phones ?? [] : data(region).all);
export const getProduct = (category: CategoryId, slug: string, region: RegionId = "au") => data(region).bySlug.get(`${category}/${slug}`);
export const getPhones = (region: RegionId = "au") => getProducts("phones", region);
export const getPhone = (slug: string) => getProduct("phones", slug);
export const getSeries = (p: Phone) => data(regionOfProduct(p)).loaded.get(p.category)?.series[p.slug] ?? {};
export const getStoreSeries = (p: Phone) => data(regionOfProduct(p)).loaded.get(p.category)?.stores[p.slug] ?? {};
export const productHref = (p: { category: CategoryId; slug: string; region?: RegionId }) => withRegion(`/${p.category}/${p.slug}`, p.region ?? "au");
/** Category page link in a region: "/tvs", "/us/tvs". */
export const categoryHref = (category: string, region: RegionId = "au") => withRegion(`/${category}`, region);

/** Today's date in the region, from the last import (not the build clock). */
export const catalogDay = (region: RegionId = "au") => new Date(data(region).updated).toLocaleDateString("en-CA", { timeZone: REGIONS[region].timeZone });

export function checkVariant(p: Phone, v: Variant): { check: PriceCheck; was: Partial<Record<RetailerId, WasCheck>> } {
  const outright = v.offers.filter((o) => o.kind !== "plan");
  const cheapest = (outright.find((o) => o.inStock && o.price === v.bestPrice) ?? outright[0])?.retailer;
  const stores = getStoreSeries(p)[v.id] ?? {};
  const check = priceCheck({ price: v.bestPrice, best: getSeries(p)[v.id] ?? [], stores, cheapest, storeName: (r) => RETAILERS[r].name, today: catalogDay(regionOfProduct(p)) });
  const was: Partial<Record<RetailerId, WasCheck>> = {};
  for (const o of outright) {
    const w = wasCheck(o, stores[o.retailer], RETAILERS[o.retailer].name, catalogDay(regionOfProduct(p)));
    if (w && (!was[o.retailer] || o.price < (outright.find((x) => x.retailer === o.retailer && x.wasPrice === was[o.retailer]!.was)?.price ?? Infinity))) was[o.retailer] = w;
  }
  return { check, was };
}

/** What the browser needs to list, filter and search phones. */
export interface PhoneSummary {
  slug: string;
  category: CategoryId;
  href: string;
  /** Card subtitle: "128GB – 512GB", '65" · 4K UHD · OLED', "RTX 5070 Ti · 16GB". */
  subtitle: string;
  /** Category specs for filters, e.g. { GPU: "RTX 5070 Ti", "Screen size": '65"' }. */
  facets: Record<string, string>;
  name: string;
  brand: string;
  model: string;
  image?: string;
  bestPrice: number;
  topPrice: number;
  storages: number[];
  retailerCount: number;
  offerCount: number;
  network?: "5G" | "4G";
  foldable?: boolean;
  generation: number;
  /** Biggest saving on any variant vs the dearest retailer or the RRP. */
  saving: number;
  inStock: boolean;
  atLowest: boolean;
  region?: RegionId;
  /** Today's cheapest new eBay listing, when the daily eBay job found one. */
  ebayPrice?: number;
}

export function summarise(p: Phone): PhoneSummary {
  const deals = p.variants.map(variantDeal);
  const facets = Object.fromEntries(p.specs.extra ?? []);
  const subtitle =
    p.category === "phones" || p.category === "tablets"
      ? storageRange(p) + (p.category === "tablets" && p.variants.some((v) => v.id.endsWith("cellular")) ? " · Cellular option" : "")
      : (p.specs.extra ?? []).filter(([k]) => ["Screen size", "Resolution", "Panel", "GPU", "Memory", "Processor", "Storage", "Refresh rate"].includes(k)).slice(0, 3).map(([, v]) => v).join(" · ");
  return {
    slug: p.slug,
    category: p.category,
    href: productHref(p),
    subtitle,
    facets,
    name: p.name,
    brand: p.brand,
    model: p.model,
    image: p.image,
    bestPrice: p.bestPrice,
    topPrice: Math.max(...p.variants.map((v) => v.bestPrice)),
    storages: p.variants.map((v) => v.storageGb),
    retailerCount: p.retailerCount,
    offerCount: p.offerCount,
    network: p.specs.network,
    foldable: p.specs.foldable,
    generation: p.generation,
    saving: Math.max(0, ...deals.map((d) => d.saving)),
    inStock: p.variants.some((v) => v.offers.some((o) => o.inStock)),
    region: p.region,
    ebayPrice: p.ebay?.price,
    atLowest: p.variants.some((v) => v.previousBest !== undefined && v.bestPrice <= (v.lowestEver ?? Infinity) && v.bestPrice < v.previousBest),
  };
}

export const getSummaries = (category?: CategoryId, region: RegionId = "au") => getProducts(category, region).map(summarise);

export interface Deal {
  phone: Phone;
  variant: Variant;
  offer: Offer;
  /** Dollars below the reference price. */
  saving: number;
  percent: number;
  reference: number;
  kind: "drop" | "rrp" | "spread";
  label: string;
}

/** Best real saving on a variant: a price drop, a retailer's own sale, or the gap to the dearest shop. */
export function variantDeal(v: Variant): { saving: number; reference: number; kind: Deal["kind"]; offer: Offer } {
  const outright = v.offers.filter((o) => o.kind !== "plan");
  const live = outright.filter((o) => o.inStock);
  const pool = live.length ? live : outright.length ? outright : v.offers;
  const offer = pool[0];
  let best = { saving: 0, reference: offer.price, kind: "spread" as Deal["kind"], offer };
  if (v.previousBest && v.previousBest > offer.price) {
    best = { saving: v.previousBest - offer.price, reference: v.previousBest, kind: "drop", offer };
  }
  // A "was" price only counts as far as another store backs it up — today's
  // price elsewhere or that store's own "was" — so one inflated RRP can't headline.
  for (const o of pool) {
    if (!o.wasPrice) continue;
    const others = outright.filter((x) => x.retailer !== o.retailer);
    if (!others.length) continue;
    const backed = Math.min(o.wasPrice, Math.max(...others.map((x) => Math.max(x.price, x.wasPrice ?? 0))));
    if (backed - o.price > best.saving && o.price <= offer.price * 1.02) {
      best = { saving: backed - o.price, reference: backed, kind: "rrp", offer: o };
    }
  }
  // Store gap: against what the other stores typically charge, not the single
  // dearest one (a stale listing would make every gap look huge).
  const perStore = new Map<string, number>();
  for (const o of pool) if (o.retailer !== offer.retailer) perStore.set(o.retailer, Math.min(perStore.get(o.retailer) ?? Infinity, o.price));
  if (perStore.size >= 2) {
    const typical = Math.round(median([...perStore.values()]));
    if (typical - offer.price > best.saving) best = { saving: typical - offer.price, reference: typical, kind: "spread", offer };
  }
  return best;
}

export function getDeals(limit = 60, category?: CategoryId, region: RegionId = "au"): Deal[] {
  const out: Deal[] = [];
  const $ = (n: number) => money(n, region);
  for (const phone of getProducts(category, region)) {
    // A single store's "RRP" on an old phone is not a deal anyone can check.
    if (phone.retailerCount < 2) continue;
    for (const variant of phone.variants) {
      const d = variantDeal(variant);
      if (d.saving < 20) continue;
      const percent = Math.round((d.saving / d.reference) * 100);
      if (percent < 4) continue;
      const label =
        d.kind === "drop"
          ? `Down ${$(d.saving)} this week`
          : d.kind === "rrp"
            ? `${$(d.saving)} off RRP`
            : `${$(d.saving)} below the typical store price`;
      out.push({ phone, variant, offer: d.offer, saving: d.saving, percent, reference: d.reference, kind: d.kind, label });
    }
  }
  // One deal per phone: its best variant.
  const byPhone = new Map<string, Deal>();
  for (const d of out.sort((a, b) => score(b) - score(a))) if (!byPhone.has(productHref(d.phone))) byPhone.set(productHref(d.phone), d);
  return [...byPhone.values()].slice(0, limit);
}

/** Percent matters more than dollars, but a $400 saving on a flagship should still rank. */
function score(d: Deal) {
  return d.percent * 2 + Math.sqrt(d.saving) * 3 + (d.kind === "drop" ? 15 : 0) + d.phone.retailerCount * 2;
}

export interface BrandInfo { brand: string; slug: string; count: number; from: number; image?: string; categories: CategoryId[] }
export function getBrands(category?: CategoryId, region: RegionId = "au"): BrandInfo[] {
  const m = new Map<string, Phone[]>();
  for (const p of getProducts(category, region)) m.set(p.brand, [...(m.get(p.brand) ?? []), p]);
  return [...m]
    .map(([brand, ps]) => ({
      brand,
      slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: ps.length,
      from: Math.min(...ps.map((p) => p.bestPrice)),
      image: ps.find((p) => p.image)?.image,
      categories: [...new Set(ps.map((p) => p.category))],
    }))
    .sort((a, b) => b.count - a.count);
}

export function similarPhones(p: Phone, n = 4): Phone[] {
  return getProducts(p.category, regionOfProduct(p))
    .filter((q) => q.slug !== p.slug && q.image)
    .map((q) => ({ q, d: Math.abs(Math.log(q.bestPrice / p.bestPrice)) - (q.brand === p.brand ? 0.15 : 0) - q.retailerCount * 0.02 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.q);
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function fmt(n: number): string {
  return n.toLocaleString("en-AU", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 });
}

export function storageRange(p: { storages: number[] } | Phone): string {
  const s = "variants" in p ? p.variants.map((v) => v.storageGb) : p.storages;
  return s.length > 1 ? `${storageLabel(s[0])} – ${storageLabel(s[s.length - 1])}` : storageLabel(s[0]);
}

export const retailerIds = (region: RegionId = "au"): RetailerId[] => activeRetailers(undefined, region).map((r) => r.id);

/**
 * Head-to-head pages worth having: each well-stocked phone against its two
 * closest rivals by price from other brands and its nearest sibling. Slugs are
 * ordered alphabetically so each pair has one URL. Computed once per process (the data only changes
 * with a deploy); callers only filter, find, map or slice the result, never mutate it.
 */
let vsPairs: ReturnType<typeof computeVsPairs> | undefined;
export const getVsPairs = () => (vsPairs ??= computeVsPairs());
function computeVsPairs(): { slug: string; a: Phone; b: Phone }[] {
  // Phones only for now: other categories' head-to-heads need richer specs to say anything useful.
  const pool = getPhones().filter((p) => p.retailerCount >= 3 && p.image);
  const pairs = new Map<string, { slug: string; a: Phone; b: Phone }>();
  const add = (x: Phone, y: Phone) => {
    const [a, b] = [x, y].sort((m, n) => m.slug.localeCompare(n.slug));
    const slug = `${a.slug}-vs-${b.slug}`;
    if (!pairs.has(slug)) pairs.set(slug, { slug, a, b });
  };
  for (const p of pool) {
    const near = (q: Phone) => Math.abs(Math.log(q.bestPrice / p.bestPrice));
    const others = pool.filter((q) => q.slug !== p.slug);
    others.filter((q) => q.brand !== p.brand).sort((a, b) => near(a) - near(b)).slice(0, 2).forEach((q) => add(p, q));
    const sib = others.filter((q) => q.brand === p.brand).sort((a, b) => near(a) - near(b))[0];
    if (sib) add(p, sib);
  }
  return [...pairs.values()];
}
