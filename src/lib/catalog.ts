import "server-only";
import catalogJson from "../../data/catalog.json";
import seriesJson from "../../data/series.json";
import { storageLabel } from "./normalize";
import type { Catalog, Offer, Phone, RetailerId, Variant } from "./types";

const catalog = catalogJson as unknown as Catalog;
const series = seriesJson as unknown as Record<string, Record<string, [string, number][]>>;

export const getCatalog = () => catalog;
export const getPhones = () => catalog.phones;
export const getPhone = (slug: string) => catalog.phones.find((p) => p.slug === slug);
export const getSeries = (slug: string) => series[slug] ?? {};

/** What the browser needs to list, filter and search phones. */
export interface PhoneSummary {
  slug: string;
  name: string;
  brand: string;
  model: string;
  image?: string;
  bestPrice: number;
  topPrice: number;
  storages: number[];
  retailerCount: number;
  offerCount: number;
  network: "5G" | "4G";
  foldable: boolean;
  generation: number;
  /** Biggest saving on any variant vs the dearest retailer or the RRP. */
  saving: number;
  inStock: boolean;
  atLowest: boolean;
}

export function summarise(p: Phone): PhoneSummary {
  const deals = p.variants.map(variantDeal);
  return {
    slug: p.slug,
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
    atLowest: p.variants.some((v) => v.previousBest !== undefined && v.bestPrice <= (v.lowestEver ?? Infinity) && v.bestPrice < v.previousBest),
  };
}

export const getSummaries = () => catalog.phones.map(summarise);

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
  const live = v.offers.filter((o) => o.inStock);
  const pool = live.length ? live : v.offers;
  const offer = pool[0];
  let best = { saving: 0, reference: offer.price, kind: "spread" as Deal["kind"], offer };
  if (v.previousBest && v.previousBest > offer.price) {
    best = { saving: v.previousBest - offer.price, reference: v.previousBest, kind: "drop", offer };
  }
  for (const o of pool) {
    if (o.wasPrice && o.wasPrice - o.price > best.saving && o.price <= offer.price * 1.02) {
      best = { saving: o.wasPrice - o.price, reference: o.wasPrice, kind: "rrp", offer: o };
    }
  }
  const retailers = new Set(pool.map((o) => o.retailer));
  if (retailers.size > 1) {
    const dearest = Math.max(...pool.map((o) => o.price));
    if (dearest - offer.price > best.saving) best = { saving: dearest - offer.price, reference: dearest, kind: "spread", offer };
  }
  return best;
}

export function getDeals(limit = 60): Deal[] {
  const out: Deal[] = [];
  for (const phone of catalog.phones) {
    // A single store's "RRP" on an old phone is not a deal anyone can check.
    if (phone.retailerCount < 2) continue;
    for (const variant of phone.variants) {
      const d = variantDeal(variant);
      if (d.saving < 20) continue;
      const percent = Math.round((d.saving / d.reference) * 100);
      if (percent < 4) continue;
      const label =
        d.kind === "drop"
          ? `Down $${fmt(d.saving)} this week`
          : d.kind === "rrp"
            ? `$${fmt(d.saving)} off RRP`
            : `$${fmt(d.saving)} less than other stores`;
      out.push({ phone, variant, offer: d.offer, saving: d.saving, percent, reference: d.reference, kind: d.kind, label });
    }
  }
  // One deal per phone: its best variant.
  const byPhone = new Map<string, Deal>();
  for (const d of out.sort((a, b) => score(b) - score(a))) if (!byPhone.has(d.phone.slug)) byPhone.set(d.phone.slug, d);
  return [...byPhone.values()].slice(0, limit);
}

/** Percent matters more than dollars, but a $400 saving on a flagship should still rank. */
function score(d: Deal) {
  return d.percent * 2 + Math.sqrt(d.saving) * 3 + (d.kind === "drop" ? 15 : 0) + d.phone.retailerCount * 2;
}

export function getBrands(): { brand: string; slug: string; count: number; from: number; image?: string }[] {
  const m = new Map<string, Phone[]>();
  for (const p of catalog.phones) m.set(p.brand, [...(m.get(p.brand) ?? []), p]);
  return [...m]
    .map(([brand, ps]) => ({
      brand,
      slug: brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      count: ps.length,
      from: Math.min(...ps.map((p) => p.bestPrice)),
      image: ps.find((p) => p.image)?.image,
    }))
    .sort((a, b) => b.count - a.count);
}

export function similarPhones(p: Phone, n = 4): Phone[] {
  return catalog.phones
    .filter((q) => q.slug !== p.slug)
    .map((q) => ({ q, d: Math.abs(Math.log(q.bestPrice / p.bestPrice)) - (q.brand === p.brand ? 0.15 : 0) - q.retailerCount * 0.02 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, n)
    .map((x) => x.q);
}

export function fmt(n: number): string {
  return n.toLocaleString("en-AU", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 });
}

export function storageRange(p: { storages: number[] } | Phone): string {
  const s = "variants" in p ? p.variants.map((v) => v.storageGb) : p.storages;
  return s.length > 1 ? `${storageLabel(s[0])} – ${storageLabel(s[s.length - 1])}` : storageLabel(s[0]);
}

export const retailerIds = (): RetailerId[] => catalog.retailers.map((r) => r.id);
