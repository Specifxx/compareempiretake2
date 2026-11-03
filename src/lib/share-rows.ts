import "server-only";
import { RETAILERS } from "./retailers";
import type { ShareRow } from "./og";
import type { Phone, Variant } from "./types";

/** The card renderer draws PNG and JPEG only: a photo saved as WebP or AVIF would come out blank. */
const drawable = (u?: string): u is string => !!u?.startsWith("https://") && !/\.(webp|avif)(\?|$)/i.test(u);

/**
 * The store rows a share card draws for one product: the variant sold by the most stores today (in stock,
 * outright, never a plan or eBay), each store once at its own lowest price, cheapest first. Four rows at most:
 * the three cheapest and the dearest, so the card shows the real gap. Null when fewer than `minStores` stores sell it.
 */
export function shareRows(p: Phone, minStores = 3): { variant: Variant; rows: ShareRow[]; spread: number; stores: number } | null {
  let best: { variant: Variant; byStore: Map<string, number> } | null = null;
  for (const v of p.variants) {
    const byStore = new Map<string, number>();
    for (const o of v.offers) {
      if (!o.inStock || o.kind === "plan" || !(o.price > 0)) continue;
      const name = RETAILERS[o.retailer]?.name;
      if (!name) continue;
      byStore.set(name, Math.min(byStore.get(name) ?? Infinity, o.price));
    }
    if (!best || byStore.size > best.byStore.size) best = { variant: v, byStore };
  }
  if (!best || best.byStore.size < minStores) return null;
  const all = [...best.byStore].map(([s, price]) => ({ s, p: price })).sort((a, b) => a.p - b.p || a.s.localeCompare(b.s));
  const rows = all.length > 4 ? [...all.slice(0, 3), all[all.length - 1]] : all;
  const lo = all[0].p;
  const hi = all[all.length - 1].p;
  return { variant: best.variant, rows, spread: (hi - lo) / hi, stores: all.length };
}

/**
 * The product a home or category card leads with: a photo, the most stores, and a visible gap between the cheapest
 * and the dearest (a card where every store charges the same says little; a gap over 35% is usually a list price
 * against a sale, which reads as a trick). When no product has that, two stores will do, and then any gap.
 */
export function pickShareProduct(products: Phone[], exclude: Set<string> = new Set()): { p: Phone; rows: ShareRow[] } | null {
  const tiers = [
    { min: 3, ok: (s: number) => s >= 0.04 && s <= 0.35 },
    { min: 2, ok: (s: number) => s >= 0.02 && s <= 0.35 },
    { min: 2, ok: (s: number) => s <= 0.5 },
  ];
  for (const t of tiers) {
    let top: { p: Phone; rows: ShareRow[]; score: number } | null = null;
    for (const p of products) {
      if (!drawable(p.image) || exclude.has(p.slug)) continue;
      const r = shareRows(p, t.min);
      if (!r || !t.ok(r.spread)) continue;
      const score = Math.min(r.stores, 8) + r.spread * 25 + p.generation / 1e6;
      if (!top || score > top.score) top = { p, rows: r.rows, score };
    }
    if (top) return { p: top.p, rows: top.rows };
  }
  return null;
}

/** Photos of the products sold by the most stores, for the row of tiles on a home or category card. */
export function sharePhotos(products: Phone[], n: number, exclude: Set<string> = new Set()): string[] {
  return products
    .filter((p) => drawable(p.image) && !exclude.has(p.slug))
    .sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)
    .map((p) => p.image!)
    .filter((u, i, all) => all.indexOf(u) === i)
    .slice(0, n);
}
