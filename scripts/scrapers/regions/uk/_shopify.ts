/**
 * Shared loader for UK Shopify stores (not a store: exports no `scrapers`, so the runner skips it).
 * Reads the whole catalogue once from /products.json (public, what the storefront serves anonymously),
 * then each category keeps the variants whose product_type / title pass that store's rules plus the shared
 * AU title checks (`IS`, `junk`, `badPrice` in categories/jbhifi.ts). Phones use `looksLikePhone`.
 * Shopify UK prices are the storefront's GBP prices incl. VAT.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../../src/lib/types";
import { decodeEntities, getJson, sleep } from "../../../lib/http";
import { IS, badPrice, junk, mpnFromSku, type ShopifyProduct } from "../../categories/jbhifi";
import { looksLikePhone } from "../../filter";

const caches = new Map<string, Promise<ShopifyProduct[]>>();

export function catalogue(base: string, maxPages = 40): Promise<ShopifyProduct[]> {
  let c = caches.get(base);
  if (!c) {
    c = (async () => {
      const all: ShopifyProduct[] = [];
      for (let page = 1; page <= maxPages; page++) {
        const { products } = await getJson<{ products: ShopifyProduct[] }>(`${base}/products.json?limit=250&page=${page}`);
        all.push(...products);
        if (products.length < 250) break;
        await sleep(700);
      }
      return all;
    })();
    caches.set(base, c);
  }
  return c;
}

const USED = /refurb|renewed|re-newed|pre-?owned|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|\bused\b|second[- ]?hand|grade [abc]\b|\bpristine\b|\bexcellent\b|\bvery good\b|\bgood\b condition/i;

export interface ShopOpts {
  /** Product types (exact, case-insensitive) or a test on the product that admits it to this category. */
  pick: (p: ShopifyProduct) => boolean;
  /** Skip the shared title check (`IS[cat]`), for stores whose titles are reliable but terse. */
  noTitleCheck?: boolean;
  mpn?: (p: ShopifyProduct, v: ShopifyProduct["variants"][0]) => string | undefined;
  extraJunk?: RegExp;
}

export async function shopifyUk(retailer: RetailerId, base: string, cat: CategoryId, o: ShopOpts): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const p of await catalogue(base)) {
    if (!o.pick(p)) continue;
    const pt = decodeEntities(p.title).replace(/\s+/g, " ").trim();
    const tags = Array.isArray(p.tags) ? p.tags.join(" ") : p.tags ?? "";
    if (USED.test(pt) || USED.test(p.product_type ?? "") || /refurb|pre-?owned|\bused\b/i.test(tags)) continue;
    for (const v of p.variants) {
      if (USED.test(v.title ?? "")) continue;
      const vt = v.title && v.title !== "Default Title" && !pt.includes(v.title) ? ` ${v.title.replace(/\s*\/\s*/g, " ")}` : "";
      const title = pt + vt;
      if (o.extraJunk?.test(title)) continue;
      if (cat === "phones") {
        if (!looksLikePhone(title)) continue;
      } else {
        if (junk(cat, title)) continue;
        if (!o.noTitleCheck && !IS[cat](title)) continue;
      }
      const price = Number(v.price);
      if (cat === "phones" ? !price || price < 40 : badPrice(cat, price)) continue;
      if (price >= 9999) continue; // placeholder
      const was = Number(v.compare_at_price);
      const brand = p.vendor && !/default|vendor|clove|^[A-Z0-9]{2,3}$/i.test(p.vendor) ? p.vendor : undefined;
      let image = p.images[0]?.src;
      if (image?.startsWith("//")) image = `https:${image}`;
      out.set(String(v.id), {
        retailer,
        sku: String(v.sku || v.id),
        title,
        url: `${base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
        price,
        wasPrice: was > price ? was : undefined,
        image,
        inStock: v.available !== false,
        mpn: o.mpn ? o.mpn(p, v) : mpnFromSku(v.sku),
        brand,
      });
    }
  }
  return [...out.values()];
}

export const typeIs = (...types: string[]) => {
  const set = new Set(types.map((t) => t.toLowerCase()));
  return (p: ShopifyProduct) => set.has((p.product_type ?? "").toLowerCase());
};
