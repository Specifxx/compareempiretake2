// The deals card's products (components/DealsPopup.tsx; owner, 2026-11-28: "for … Compare Empire … with Black Friday, can we
// have some eBay or Amazon pop-ups … with actual products"). Computed once per region at build and served as one static file
// per region (/deal-picks/<region>, force-static), like the ad block's tiles (lib/side-rails.ts):
//
//   • Amazon first: products of OUR catalogue (Amazon's exception for pop-ups promoting "Products closely associated with the
//     materials on your Site") whose Amazon item the build priced (lib/amazon-live.ts, under 24 hours old), with that price's
//     time; the browser drops it after 24 hours. A link to that item only (/dp/), never a deals or category page.
//   • eBay to fill: the daily eBay job's live listings (a photo and a delivered price), most-compared first.
//   • Nothing is invented: no "was" price, no saving of ours, no countdown. Server-only: reads data/ at build.
import { amazonLink } from "./amazon";
import { amazonFor } from "./amazon-live";
import { getProducts, getSummaries } from "./catalog";
import { ebayAffiliate } from "./ebay";
import { REGIONS, money, type RegionId } from "./region";
import { inTurn } from "./side-rails";
import type { CategoryId } from "./types";

export const MAX_PICKS = 4;
export const MIN_PICKS = 2;
const CATEGORIES: CategoryId[] = ["phones", "tvs", "laptops", "headphones", "tablets", "smartwatches", "consoles", "robot-vacuums", "speakers", "monitors"];

export interface DealPick {
  id: string;
  brand: "amazon" | "ebay";
  name: string;
  img: string;
  price: string;
  href: string;
  /** Amazon only: when the price was fetched (ISO) */
  at?: string;
  deal?: string;
  off?: number;
  until?: string;
}

export interface DealPicks {
  region: string;
  picks: DealPick[];
  clock: { timeZone: string; label: string } | null;
}

const CLOCK_LABEL: Record<RegionId, string> = { au: "Sydney time", us: "New York time", uk: "London time", ca: "Toronto time", sg: "Singapore time" };
const cache = new Map<RegionId, DealPicks>();

export function dealPicksFor(region: RegionId): DealPicks {
  const hit = cache.get(region);
  if (hit) return hit;
  const popular = inTurn(CATEGORIES.map((c) => getSummaries(c, region)));
  const products = new Map<string, ReturnType<typeof getProducts>[number]>(getProducts(undefined, region).map((p) => [`${p.category}/${p.slug}`, p] as const));
  const picks: DealPick[] = [];
  for (const s of popular) {
    if (picks.length >= 2) break;
    const p = products.get(`${s.category}/${s.slug}`);
    if (!p || !s.image) continue;
    const live = Object.values(amazonFor(p, region) ?? {}).find((a) => a.price != null && a.at);
    if (!live) continue;
    const href = amazonLink(region, live.asin, `deals-popup-amazon-${s.category}`);
    if (!href) continue;
    picks.push({ id: `${s.category}/${s.slug}`, brand: "amazon", name: s.name, img: s.image, price: money(live.price!, region), href, at: live.at });
  }
  for (const s of popular) {
    if (picks.length >= MAX_PICKS) break;
    const id = `${s.category}/${s.slug}`;
    if (picks.some((x) => x.id === id)) continue;
    const e = products.get(id)?.ebay;
    const img = (e as { image?: string } | undefined)?.image ?? s.image;
    if (!e || !img) continue;
    picks.push({ id, brand: "ebay", name: s.name, img, price: money(e.price + (e.shipping ?? 0), region), href: ebayAffiliate(e.url, `${region}-deals-popup-ebay-${s.category}`, region) });
  }
  const out: DealPicks = { region, picks: picks.length >= MIN_PICKS ? picks : [], clock: { timeZone: REGIONS[region].timeZone, label: CLOCK_LABEL[region] } };
  cache.set(region, out);
  return out;
}
