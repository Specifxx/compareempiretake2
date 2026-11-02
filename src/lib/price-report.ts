// The self-updating monthly price report (DECISIONS.md, "Self-updating price report", 2026-11-02): the page outreach
// offers tech writers to quote, built with each deploy from that day's catalogue, so nobody writes it. Pure:
// tests/price-report.test.ts.
import type { Phone } from "./types";

export interface CategoryReport {
  /** Products with an in-stock outright price. */
  priced: number;
  /** Products (best variant) two or more stores sell in stock. */
  compared: number;
  /** Median gap between the cheapest and dearest store for the same variant (the one most stores sell), as a share of the dearest (0..1). */
  medianGap: number | null;
  /** Share of compared products where the cheapest store is 10%+ under the dearest. */
  gap10: number | null;
  stores: number;
}

export function medianOf(xs: number[]): number | null {
  if (!xs.length) return null;
  const v = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function categoryReport(products: Phone[]): CategoryReport {
  const stores = new Set<string>();
  const gaps: number[] = [];
  let priced = 0;
  for (const p of products) {
    let pick: { n: number; g: number } | null = null;
    let any = false;
    for (const v of p.variants) {
      const byStore = new Map<string, number>();
      for (const o of v.offers) {
        if (!o.inStock || o.price <= 0 || (o.kind && o.kind !== "outright")) continue;
        any = true;
        stores.add(o.retailer);
        byStore.set(o.retailer, Math.min(byStore.get(o.retailer) ?? Infinity, o.price));
      }
      if (byStore.size < 2) continue;
      const ps = [...byStore.values()];
      const hi = Math.max(...ps);
      const g = (hi - Math.min(...ps)) / hi;
      // One number per product: the variant the most stores sell (ties: the smaller gap, never the flattering one).
      if (!pick || byStore.size > pick.n || (byStore.size === pick.n && g < pick.g)) pick = { n: byStore.size, g };
    }
    if (any) priced++;
    if (pick) gaps.push(pick.g);
  }
  return { priced, compared: gaps.length, medianGap: medianOf(gaps), gap10: gaps.length ? gaps.filter((g) => g >= 0.1).length / gaps.length : null, stores: stores.size };
}

export const pctText = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)}%`);
