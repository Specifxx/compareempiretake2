// The home page's ranking input and how a product reads into it (lib/home-rank.ts; DECISIONS.md "Home pages rank items by
// demand", 2026-11-18). data/demand.json is written into the daily data commit by refresh-prices.yml (scripts/pull-demand.sh,
// from RiftCompare's /api/demand/ce: product page views in every region, last 28 and 7 days) and read at build: imported,
// no request-time read.
import raw from "../../data/demand.json";
import type { Deal, PhoneSummary } from "./catalog";
import { rankItems, type DemandFile } from "./home-rank";

// Through unknown: JSON imports type each pair as number[], not [number, number], so the first non-empty file
// fails the typecheck, and with it the next release's build (MTG and Dex, 2026-11-18).
export const HOME_DEMAND = raw as unknown as DemandFile;

/** Products, most likely to earn first: their page's views (any region), stores selling them, price, pre-orders. */
export function rankSummaries(list: readonly PhoneSummary[]): PhoneSummary[] {
  return rankItems(
    list,
    (p) => ({
      pathSuffix: `/${p.category}/${p.slug}`,
      clickKey: p.slug,
      priceCents: Math.round(p.bestPrice * 100),
      inStock: p.inStock ? p.retailerCount : 0,
      preorder: p.preorderStores > 0,
    }),
    HOME_DEMAND,
  );
}

/** Deals, the same way, with the saving counted as a drop. */
export function rankDeals(list: readonly Deal[]): Deal[] {
  return rankItems(
    list,
    (d) => ({
      pathSuffix: `/${d.phone.category}/${d.phone.slug}`,
      clickKey: d.phone.slug,
      priceCents: Math.round(d.offer.price * 100),
      inStock: d.offer.inStock ? 1 : 0,
      dropPct: d.percent / 100,
    }),
    HOME_DEMAND,
  );
}
