import type { Phone } from "./types";

/**
 * Sentences only one product page can carry (DECISIONS.md, 2026-11-06 "Every comparable US and UK product in the
 * sitemap"): where its price sits among the same region's products in its category, and how its best price has
 * moved in our own history. Pure, from today's catalogue and the price series; tests/product-facts.test.ts pins it.
 */

export interface CategoryPosition {
  /** Products in the category, in this region, with a live price (the product itself included). */
  peers: number;
  /** Share of those peers that cost more, 0–100, rounded. */
  cheaperThanPct: number;
  /** The middle best price of the category. */
  median: number;
  /** 1 = the cheapest in the category. */
  rank: number;
}

/** Where a product's best price sits in its category. Undefined below five priced peers: a rank among three says nothing. */
export function categoryPosition(p: Pick<Phone, "slug" | "bestPrice">, peers: Pick<Phone, "slug" | "bestPrice">[]): CategoryPosition | undefined {
  const prices = peers.filter((q) => q.bestPrice > 0).map((q) => q.bestPrice).sort((a, b) => a - b);
  if (prices.length < 5 || !(p.bestPrice > 0)) return undefined;
  const dearer = prices.filter((x) => x > p.bestPrice).length;
  const mid = prices.length >> 1;
  const median = prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  return { peers: prices.length, cheaperThanPct: Math.round((dearer / prices.length) * 100), median, rank: prices.filter((x) => x < p.bestPrice).length + 1 };
}

export interface PriceMove {
  /** Days between the first point used and today's. */
  days: number;
  from: number;
  to: number;
}

/**
 * How the product's cheapest option moved: today's best against the best about 30 days ago (or the oldest point we
 * have, when that is at least 7 days back). Undefined when we hold under a week of history, which on a site that
 * started recording on 2026-11-01 is most pages for now.
 */
export function priceMove(series: Record<string, [string, number][]>): PriceMove | undefined {
  const byDay = new Map<string, number>();
  for (const points of Object.values(series))
    for (const [day, price] of points) if (price > 0) byDay.set(day, Math.min(byDay.get(day) ?? Infinity, price));
  const days = [...byDay.keys()].sort();
  if (days.length < 2) return undefined;
  const last = days.at(-1)!;
  const span = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400e3);
  const target = new Date(Date.parse(last) - 30 * 86400e3).toISOString().slice(0, 10);
  const start = days.find((d) => d >= target) ?? days[0];
  if (span(start, last) < 7) return undefined;
  return { days: span(start, last), from: byDay.get(start)!, to: byDay.get(last)! };
}
