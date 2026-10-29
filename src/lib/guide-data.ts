import { CATEGORIES } from "./categories";
import type { CategoryId, Phone, RetailerId } from "./types";

/**
 * The numbers behind the guides' live blocks (GuideBody): which store is cheapest how often, and
 * ranked product tables. Pure reads of today's Australian catalogue, computed at build time, so a
 * guide never carries a typed-in price or a claim the data stopped supporting.
 */

/** "tvs+soundbars" or "all" → category ids that exist. */
export function parseCats(arg: string | undefined): CategoryId[] {
  if (!arg || arg === "all") return CATEGORIES.map((c) => c.id);
  return arg.split("+").map((s) => s.trim()).filter((s): s is CategoryId => CATEGORIES.some((c) => c.id === s));
}

/**
 * Stores that are one business with one price list: MSY and Umart list the same price on all but a
 * handful of the ~1,770 variants both sell (checked 2026-10-29), so head to head they would "beat"
 * each other on every product. Counted as one store, shown as "MSY / Umart".
 */
export const PRICE_TWINS: Partial<Record<RetailerId, RetailerId>> = { umart: "msy" };

export interface StoreWin {
  retailer: RetailerId;
  /** Product variants this store and at least one other store both sell, in stock, outright. */
  compared: number;
  /** How many of those it was cheapest on (ties count for every store at the lowest price). */
  wins: number;
  /** Median % above the cheapest store when it wasn't the cheapest. */
  medianGap: number;
}

/**
 * For every variant that two or more stores sell in stock (outright, never carrier plans), who had
 * the lowest price. A store with fewer than `minCompared` head-to-heads is left out: a 3-for-3 record
 * says nothing.
 */
export function storeWins(products: Phone[], opts: { only?: RetailerId[]; minCompared?: number } = {}): StoreWin[] {
  const acc = new Map<RetailerId, { compared: number; wins: number; gaps: number[] }>();
  for (const p of products) {
    for (const v of p.variants) {
      const best = new Map<RetailerId, number>();
      for (const o of v.offers) {
        if (!o.inStock || o.kind === "plan" || !(o.price > 0)) continue;
        const r = PRICE_TWINS[o.retailer] ?? o.retailer;
        const cur = best.get(r);
        if (cur === undefined || o.price < cur) best.set(r, o.price);
      }
      if (best.size < 2) continue;
      const low = Math.min(...best.values());
      for (const [r, price] of best) {
        const a = acc.get(r) ?? { compared: 0, wins: 0, gaps: [] };
        a.compared++;
        if (price <= low) a.wins++;
        else a.gaps.push(((price - low) / low) * 100);
        acc.set(r, a);
      }
    }
  }
  const min = opts.minCompared ?? 10;
  return [...acc]
    .filter(([r, a]) => a.compared >= min && (!opts.only || opts.only.includes(r)))
    .map(([retailer, a]) => ({ retailer, compared: a.compared, wins: a.wins, medianGap: median(a.gaps) }))
    .sort((a, b) => b.wins / b.compared - a.wins / a.compared || b.compared - a.compared);
}

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export interface TopOptions {
  cats: CategoryId[];
  /** Case-insensitive pattern on the product name. */
  q?: string;
  brand?: string;
  /** "Screen size:65\"" matches a spec row with that label whose value contains that; "GPU:=RTX 5070" must equal it. */
  spec?: string[];
  min?: number;
  max?: number;
  /** Fewest stores selling it (default 2, so a price is a comparison). */
  stores?: number;
  n?: number;
  sort?: "stores" | "price" | "price-desc" | "newest";
}

/** A ranked, filtered product list for a guide's table. In stock and photographed only. */
export function topProducts(products: Phone[], o: TopOptions): Phone[] {
  let re: RegExp | undefined;
  try {
    re = o.q ? new RegExp(o.q, "i") : undefined;
  } catch {
    return [];
  }
  const specs = (o.spec ?? []).map((s) => {
    const i = s.indexOf(":");
    return [s.slice(0, i).trim().toLowerCase(), s.slice(i + 1).trim().toLowerCase()] as const;
  });
  const list = products
    .filter(
      (p) =>
        o.cats.includes(p.category) &&
        p.variants.some((v) => v.offers.some((x) => x.inStock)) &&
        p.retailerCount >= (o.stores ?? 2) &&
        (!re || re.test(p.name)) &&
        (!o.brand || p.brand.toLowerCase() === o.brand.toLowerCase()) &&
        (o.min === undefined || p.bestPrice >= o.min) &&
        (o.max === undefined || p.bestPrice <= o.max) &&
        specs.every(([k, val]) => specMatches(p, k, val)),
    );
  const by: Record<NonNullable<TopOptions["sort"]>, (a: Phone, b: Phone) => number> = {
    stores: (a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation || a.bestPrice - b.bestPrice,
    price: (a, b) => a.bestPrice - b.bestPrice || b.retailerCount - a.retailerCount,
    "price-desc": (a, b) => b.bestPrice - a.bestPrice || b.retailerCount - a.retailerCount,
    newest: (a, b) => b.generation - a.generation || b.retailerCount - a.retailerCount,
  };
  // One row per model: store listings of the same product under two names (a colour in the title)
  // would otherwise fill a table with near-duplicates.
  const seen = new Set<string>();
  return list
    .sort(by[o.sort ?? "stores"])
    .filter((p) => {
      const key = `${p.brand}|${p.model}`.toLowerCase().replace(/[^a-z0-9|]+/g, "");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, o.n ?? 10);
}

function specMatches(p: Phone, label: string, val: string): boolean {
  return (p.specs.extra ?? []).some(([a, b]) => a.toLowerCase() === label && (val.startsWith("=") ? b.toLowerCase() === val.slice(1) : b.toLowerCase().includes(val)));
}

export interface ByRow {
  value: string;
  /** In-stock models with this spec value. */
  models: number;
  cheapest: Phone;
}

/**
 * The cheapest in-stock product for each value of one spec ("GPU" → RTX 5060, RTX 5070, …): the
 * "cheapest RTX 5070 today" table. `values` fixes which values and their order; otherwise every value
 * with at least `minModels` models, cheapest first.
 */
export function cheapestBy(products: Phone[], o: { cats: CategoryId[]; spec: string; values?: string[]; minModels?: number; stores?: number; max?: number }): ByRow[] {
  const label = o.spec.toLowerCase();
  const groups = new Map<string, Phone[]>();
  for (const p of products) {
    if (!o.cats.includes(p.category) || p.retailerCount < (o.stores ?? 1) || !p.variants.some((v) => v.offers.some((x) => x.inStock))) continue;
    if (o.max !== undefined && p.bestPrice > o.max) continue;
    const row = (p.specs.extra ?? []).find(([a]) => a.toLowerCase() === label);
    if (!row) continue;
    const key = row[1];
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const rows = [...groups].map(([value, ps]) => ({ value, models: ps.length, cheapest: ps.reduce((a, b) => (b.bestPrice < a.bestPrice ? b : a)) }));
  if (o.values?.length) {
    const want = o.values.map((v) => v.toLowerCase());
    return want.map((v) => rows.find((r) => r.value.toLowerCase() === v)).filter((r): r is ByRow => !!r);
  }
  return rows.filter((r) => r.models >= (o.minModels ?? 2)).sort((a, b) => a.cheapest.bestPrice - b.cheapest.bestPrice);
}

/** The store selling a product's cheapest in-stock variant at its lowest price. */
export function cheapestStore(p: Phone): RetailerId | undefined {
  let best: { r: RetailerId; price: number } | undefined;
  for (const v of p.variants) for (const o of v.offers) if (o.inStock && o.kind !== "plan" && (!best || o.price < best.price)) best = { r: o.retailer, price: o.price };
  return best?.r;
}

/** Parses a block's `key=value,key=value` argument; repeated keys (spec=…) collect into a list. */
export function blockArgs(arg: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const kv of arg.split(",")) {
    const i = kv.indexOf("=");
    if (i < 0) continue;
    (out[kv.slice(0, i).trim()] ??= []).push(kv.slice(i + 1).trim());
  }
  return out;
}

export function topOptions(arg: string): TopOptions {
  const a = blockArgs(arg);
  const one = (k: string) => a[k]?.[0];
  const num = (k: string) => (one(k) !== undefined && Number.isFinite(Number(one(k))) ? Number(one(k)) : undefined);
  const sort = one("sort");
  return {
    cats: parseCats(one("cat") ?? "phones"),
    q: one("q"),
    brand: one("brand"),
    spec: a.spec,
    min: num("min"),
    max: num("max"),
    stores: num("stores"),
    n: num("n"),
    sort: sort === "price" || sort === "price-desc" || sort === "newest" || sort === "stores" ? sort : undefined,
  };
}

export interface PlanRow {
  phone: Phone;
  storageGb: number;
  outright: { retailer: RetailerId; price: number };
  plan: { retailer: RetailerId; price: number; monthly?: number; months?: number };
}

/**
 * Outright vs on a carrier plan, per phone: the lowest in-stock outright price against the lowest
 * device total a carrier charges in repayments (the phone only, never the plan's own monthly fee),
 * for each phone's cheapest storage that both sell. Most-stocked phones first.
 */
export function planVsOutright(phones: Phone[], n = 10): PlanRow[] {
  const rows: PlanRow[] = [];
  for (const p of [...phones].sort((a, b) => b.retailerCount - a.retailerCount || b.generation - a.generation)) {
    for (const v of [...p.variants].sort((a, b) => a.storageGb - b.storageGb)) {
      const out = v.offers.filter((o) => o.inStock && o.kind !== "plan").sort((a, b) => a.price - b.price)[0];
      const plan = v.offers.filter((o) => o.kind === "plan" && o.price > 0).sort((a, b) => a.price - b.price)[0];
      if (!out || !plan) continue;
      rows.push({ phone: p, storageGb: v.storageGb, outright: { retailer: out.retailer, price: out.price }, plan: { retailer: plan.retailer, price: plan.price, monthly: plan.monthly, months: plan.months } });
      break;
    }
    if (rows.length >= n) break;
  }
  return rows;
}
