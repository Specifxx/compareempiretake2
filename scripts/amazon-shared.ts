// Helpers the two Amazon scripts share: the AU catalogue, read straight from data/ (lib/catalog.ts is server-only).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { liveCategories } from "../src/lib/categories";
import { dataPath } from "../src/lib/region";
import type { Catalog, Phone } from "../src/lib/types";

export function auProducts(): Phone[] {
  const out: Phone[] = [];
  for (const c of liveCategories()) {
    const f = path.join(process.cwd(), dataPath("au", c.id), "catalog.json");
    if (!existsSync(f)) continue;
    for (const p of (JSON.parse(readFileSync(f, "utf8")) as Catalog).phones) out.push({ ...p, category: p.category ?? c.id });
  }
  // Most-compared first: more stores, then dearer (more commission, more shoppers checking Amazon).
  return out.sort((a, b) => b.retailerCount - a.retailerCount || b.bestPrice - a.bestPrice);
}

/** The variant's median outright store price, the reference an Amazon price must sit near. */
export function storeMedian(p: Phone, variantId: string): number | undefined {
  const xs = (p.variants.find((v) => v.id === variantId)?.offers ?? []).filter((o) => o.kind !== "plan" && o.inStock).map((o) => o.price).sort((a, b) => a - b);
  if (!xs.length) return undefined;
  const m = xs.length >> 1;
  return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
}
