/**
 * Dreame AU (dreame.com.au, Shopify): robot vacuums from /products.json (product_type "Robot vacuum").
 * Spare parts, kits, filters, brushes and mop pads share that product_type, so they are dropped by title.
 * The store SKU (e.g. DRE-L40SPU) is Dreame AU's own code; the model is in the title, so mpn is left empty.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";

const BASE = "https://www.dreame.com.au";

type Variant = { id: number; title: string; sku?: string; price: string; compare_at_price?: string | null; available: boolean };
type Product = { title: string; handle: string; product_type?: string; vendor?: string; variants: Variant[]; images?: { src: string }[] };

const JUNK = /accessor|\bkit\b|filter|brush|mop pad|dust ?bag|bag\b|module|solution|replacement|spare|roller(?! with)|tank\b|refurb|ex-?demo|warranty/i;

async function robotVacuums(): Promise<RawOffer[]> {
  const out: RawOffer[] = [];
  for (let page = 1; page <= 10; page++) {
    const { products } = JSON.parse(await get(`${BASE}/products.json?limit=250&page=${page}`)) as { products: Product[] };
    if (!products.length) break;
    for (const p of products) {
      const title = decodeEntities(p.title).replace(/\s+/g, " ").trim();
      if (!/robot vacuum/i.test(p.product_type ?? "") || !/robot|vacuum|ultra|roller|aqua|matrix|x\d0|l\d0/i.test(title)) continue;
      if (JUNK.test(title.replace(/vacuum and mop|vacuum & mop|robot vacuum and mop cleaner/i, ""))) continue;
      for (const v of p.variants) {
        const price = Number(v.price);
        if (!price || price < 200) continue; // nothing below this is a robot
        const was = Number(v.compare_at_price) || undefined;
        out.push({
          retailer: "dreame" as RetailerId,
          sku: v.sku || String(v.id),
          brand: "Dreame",
          title: v.title && v.title !== "Default Title" ? `${title} - ${v.title}` : title,
          url: `${BASE}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
          price,
          wasPrice: was && was > price ? was : undefined,
          image: p.images?.[0]?.src,
          inStock: v.available,
        });
      }
    }
    await sleep(1000);
  }
  return out;
}

export const scrapers: Partial<Record<Exclude<CategoryId, "phones">, () => Promise<RawOffer[]>>> = {
  "robot-vacuums": robotVacuums,
};
