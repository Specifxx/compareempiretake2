// The ad tiles (components/InlineAds.tsx draws six of them in the page, PhoneDock.tsx the eBay ones; they were the side rails' tiles, owner, 2026-11-06: "the eBay ads … and instead of the TCGplayer
// ad, the Amazon ad banner that's scrollable", as on DexCompare and MTG Compare), computed once per region at build and served
// as one static file per region (/rails/<region>, force-static): no page carries them and a visit never runs a function.
//
//   • eBay: the daily eBay job's own matches (data/<region>/ebay.json, attached in lib/catalog.ts), the most-compared
//     products across the top categories first, live listings (photo, delivered price) first, then exact-name searches. customid ce-<region>-inline-ebay-<cat>.
//   • Amazon (after eBay in the block): the most-compared products as tagged links to Amazon's own page of the item when the import found its ASIN
//     (data/amazon/), else an exact product-name search (Associates: a specific product, never a category). NO price: the
//     Creators API refuses us until each account has 10 qualifying sales, and Amazon's licence forbids keeping a price, so a
//     file served for a day may not carry one. The photo is the store's own, as on our cards. No Amazon in Singapore.
//   • Never in the phone dock (an overlay: Associates' rule), never in an email, never counted as a store.
import fs from "node:fs";
import path from "node:path";
import { amazonLink, amazonStore } from "./amazon";
import { getSummaries, getProducts, type PhoneSummary } from "./catalog";
import { EBAY_SITES, ebayAffiliate, ebaySearch } from "./ebay";
import { money, type RegionId } from "./region";
import type { CategoryId } from "./types";

export const MAX_TILES = 10;
export const MIN_TILES = 2;

export interface RailTile {
  id: string;
  name: string;
  img: string;
  /** formatted, delivered (eBay only; Amazon tiles never carry a price) */
  price: string | null;
  href: string;
}

export interface Rails {
  region: RegionId;
  ebay: { label: string; more: string; tiles: RailTile[] };
  amazon: { label: string; tiles: RailTile[] } | null;
}

/** The categories the rails draw from, in turn, so a rail is not all phones (AmazonPicks' home list). */
const CATEGORIES: CategoryId[] = ["phones", "tvs", "laptops", "headphones", "tablets", "smartwatches", "consoles", "robot-vacuums", "speakers", "monitors"];

/** The most-compared products, one category after another (the first of each, then the second of each…). Pure over its input. */
export function inTurn(lists: PhoneSummary[][]): PhoneSummary[] {
  const ranked = lists.map((l) => l.filter((p) => p.image && p.inStock).sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation));
  const out: PhoneSummary[] = [];
  const most = Math.max(0, ...ranked.map((l) => l.length));
  for (let i = 0; i < most; i++) for (const l of ranked) if (i < l.length) out.push(l[i]);
  return out;
}

/** Each product's ASIN (any variant's) from the daily job's file, keyed "<category>/<slug>/<variant>" → { asin }. */
function productAsins(region: RegionId): Map<string, string> {
  const out = new Map<string, string>();
  try {
    const known = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "amazon", `asins-${region}.json`), "utf8")) as Record<string, { asin?: string | null }>;
    for (const [key, v] of Object.entries(known)) {
      const id = key.split("/").slice(0, 2).join("/");
      if (v?.asin && /^[A-Z0-9]{10}$/.test(v.asin) && !out.has(id)) out.set(id, v.asin);
    }
  } catch {
    /* no file yet: every tile is a name search */
  }
  return out;
}

const cache = new Map<RegionId, Rails>();

export function railsFor(region: RegionId): Rails {
  const hit = cache.get(region);
  if (hit) return hit;
  const popular = inTurn(CATEGORIES.map((c) => getSummaries(c, region)));
  const listing = new Map(getProducts(undefined, region).flatMap((p) => (p.ebay ? [[`${p.category}/${p.slug}`, p.ebay] as const] : [])));

  const ebayTiles: RailTile[] = [];
  for (const p of popular) {
    const e = listing.get(`${p.category}/${p.slug}`);
    if (!e) continue;
    const img = (e as { image?: string }).image ?? p.image;
    if (!img) continue;
    ebayTiles.push({
      id: `${p.category}/${p.slug}`,
      name: p.name,
      img,
      price: money(e.price + (e.shipping ?? 0), region),
      href: ebayAffiliate(e.url, `${region}-inline-ebay-${p.category}`, region),
    });
    if (ebayTiles.length >= MAX_TILES) break;
  }
  // Too few live listings (Canada and Singapore, which the eBay job does not search yet): the rest of the rail is tagged
  // eBay searches for the most-compared products, by exact name with the store's photo and no price, like Amazon's tiles.
  const have = new Set(ebayTiles.map((t) => t.id));
  for (const p of popular) {
    if (ebayTiles.length >= MAX_TILES) break;
    const id = `${p.category}/${p.slug}`;
    if (have.has(id) || !p.image) continue;
    ebayTiles.push({ id, name: p.name, img: p.image, price: null, href: ebaySearch(p.name, { condition: "new", customid: `${region}-inline-ebay-${p.category}`, region }) });
  }

  let amazon: Rails["amazon"] = null;
  const store = amazonStore(region);
  if (store) {
    const asins = productAsins(region);
    const seen = new Set(ebayTiles.map((t) => t.id));
    const order = [...popular.filter((p) => !seen.has(`${p.category}/${p.slug}`)), ...popular.filter((p) => seen.has(`${p.category}/${p.slug}`))];
    const tiles: RailTile[] = [];
    for (const p of order) {
      const id = `${p.category}/${p.slug}`;
      const href = amazonLink(region, asins.get(id) ?? p.name, `inline-amazon-${p.category}`);
      if (!href || !p.image) continue;
      tiles.push({ id, name: p.name, img: p.image, price: null, href });
      if (tiles.length >= MAX_TILES) break;
    }
    amazon = { label: store.name, tiles };
  }

  const site = EBAY_SITES[region];
  const rails: Rails = {
    region,
    ebay: {
      label: site.host.replace(/^www\./, ""),
      more: ebayAffiliate(`https://${site.host}/deals/tech`, `${region}-inline-ebay`, region),
      tiles: ebayTiles,
    },
    amazon,
  };
  cache.set(region, rails);
  return rails;
}
