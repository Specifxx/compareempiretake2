import type { RawOffer, RetailerId } from "../../src/lib/types";
import { getJson, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";

interface Product {
  title: string;
  handle: string;
  images: { src: string }[];
  variants: { id: number; title: string; price: string; compare_at_price: string | null; available: boolean }[];
}

/**
 * Any Shopify store's collection feed. One offer per variant: variant titles
 * ("256GB / Black") are appended so storage and colour reach the parser.
 */
export async function scrapeShopify(retailer: RetailerId, base: string, collections: string[], keep: (title: string) => boolean = () => true): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const c of collections) {
    for (let page = 1; page <= 10; page++) {
      const { products } = await getJson<{ products: Product[] }>(`${base}/collections/${c}/products.json?limit=250&page=${page}`);
      for (const p of products) {
        for (const v of p.variants) {
          const title = v.title && v.title !== "Default Title" && !p.title.includes(v.title) ? `${p.title} ${v.title.replace(/\s*\/\s*/g, " ")}` : p.title;
          if (!keep(title) || !looksLikePhone(title)) continue;
          const price = Number(v.price);
          const was = Number(v.compare_at_price);
          if (!price) continue;
          out.set(String(v.id), {
            retailer,
            sku: String(v.id),
            title,
            url: `${base}/products/${p.handle}?variant=${v.id}`,
            price,
            wasPrice: was > price ? was : undefined,
            image: p.images[0]?.src,
            inStock: v.available !== false,
          });
        }
      }
      if (products.length < 250) break;
      await sleep(600);
    }
  }
  return [...out.values()];
}
