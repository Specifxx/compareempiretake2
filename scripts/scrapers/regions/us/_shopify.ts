/**
 * Shared helper for the US Shopify stores (not a store: it exports no `scrapers`, so the runner skips it).
 * Reads the public `/products.json` or `/collections/<handle>/products.json` feeds a browser can load anonymously,
 * one offer per variant (variant names such as `65"` or `Black` are appended to the title only when the product
 * title does not already contain them). Prices are the store's base currency (USD for every store using this).
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../../src/lib/types";
import { decodeEntities, getJson, sleep } from "../../../lib/http";

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor?: string;
  product_type?: string;
  tags?: string[] | string;
  images: { src: string }[];
  variants: {
    id: number;
    title: string;
    sku?: string | null;
    price: string;
    compare_at_price: string | null;
    available: boolean;
    featured_image?: { src: string } | null;
  }[];
}

/** Never compared: second-hand, refurbished, plans, gift cards and bundles we cannot match. */
export const NOT_NEW =
  /\b(refurb\w*|renewed|re-?certified|open[- ]?box|pre-?owned|used|ex-?demo|demo|b-?stock|scratch|dent|protection plan|warranty|extend|gift ?card|trade-?in|clearance outlet|mystery|grade [abc])\b/i;

const feeds = new Map<string, Promise<ShopifyProduct[]>>();

/** Every product in one feed ("" = the whole store), paged politely, cached per run. */
export function feed(base: string, collection = "", maxPages = 20): Promise<ShopifyProduct[]> {
  const key = `${base}|${collection}`;
  let p = feeds.get(key);
  if (!p) {
    p = (async () => {
      const all: ShopifyProduct[] = [];
      for (let page = 1; page <= maxPages; page++) {
        const path = collection ? `/collections/${collection}/products.json` : "/products.json";
        const { products } = await getJson<{ products: ShopifyProduct[] }>(`${base}${path}?limit=250&page=${page}`);
        all.push(...products);
        if (products.length < 250) break;
        await sleep(500);
      }
      return all;
    })();
    feeds.set(key, p);
  }
  return p;
}

export interface CatRule {
  /** Collections to read; omit to read the whole store. */
  collections?: string[];
  /** Keep a product only when this returns true. */
  keep: (p: ShopifyProduct, title: string) => boolean;
}

export interface StoreCfg {
  retailer: RetailerId;
  base: string;
  cats: Partial<Record<CategoryId, CatRule>>;
  /** The variant SKU is the manufacturer part number / model code (true for brand stores and some retailers). */
  skuIsMpn?: boolean | ((sku: string) => string | undefined);
  /** Brand when the store sells only its own (vendor is used otherwise). */
  brand?: string;
  /** Extra exclusion applied to every title. */
  exclude?: RegExp;
  /** Tidies a variant's title after the exclusions ran (drops shipping notes such as "CN warehouse - US plug"). */
  clean?: (title: string) => string;
}

export function variantTitle(p: ShopifyProduct, v: ShopifyProduct["variants"][number]): string {
  const base = decodeEntities(p.title).trim();
  const vt = (v.title ?? "").trim();
  if (!vt || /^default( title)?$/i.test(vt)) return base;
  const parts = vt.split(/\s*\/\s*/).filter((x) => x && !base.toLowerCase().includes(x.toLowerCase()));
  return parts.length ? `${base} ${parts.join(" ")}` : base;
}

export async function scrapeCat(cfg: StoreCfg, rule: CatRule): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const c of rule.collections ?? [""]) {
    for (const p of await feed(cfg.base, c)) {
      const ptitle = decodeEntities(p.title);
      if (NOT_NEW.test(ptitle) || NOT_NEW.test(p.product_type ?? "") || cfg.exclude?.test(ptitle)) continue;
      if (!rule.keep(p, ptitle)) continue;
      for (const v of p.variants) {
        const raw = variantTitle(p, v);
        if (NOT_NEW.test(v.title ?? "") || cfg.exclude?.test(raw)) continue;
        const title = cfg.clean ? cfg.clean(raw) : raw;
        const price = Number(v.price);
        const was = Number(v.compare_at_price);
        if (!price || price < 5) continue;
        const sku = (v.sku ?? "").trim();
        const mpn = !sku ? undefined : typeof cfg.skuIsMpn === "function" ? cfg.skuIsMpn(sku) : cfg.skuIsMpn ? sku : undefined;
        let image = v.featured_image?.src ?? p.images[0]?.src;
        if (image?.startsWith("//")) image = `https:${image}`;
        out.set(String(v.id), {
          retailer: cfg.retailer,
          sku: String(v.id),
          title,
          url: `${cfg.base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
          price,
          wasPrice: was > price ? was : undefined,
          image,
          inStock: v.available !== false,
          brand: cfg.brand ?? (p.vendor?.trim() || undefined),
          mpn,
        });
      }
    }
  }
  return [...out.values()];
}

export function shopifyScrapers(cfg: StoreCfg): Partial<Record<CategoryId, () => Promise<RawOffer[]>>> {
  const s: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {};
  for (const [cat, rule] of Object.entries(cfg.cats) as [CategoryId, CatRule][]) s[cat] = () => scrapeCat(cfg, rule);
  return s;
}

/** product_type matches. */
export const type = (re: RegExp) => (p: ShopifyProduct) => re.test(p.product_type ?? "");
