/**
 * LEGO sets from toy stores on Shopify (Toys R Us, Toyworld, Kidstuff, Hobbyco). A set is identified by its
 * LEGO set number and nothing else: read from the store's SKU when it carries one ("LEG-42171", "LEG75447"),
 * else from the title ("LEGO 77053 …", "11205 Sweet Treat …"). A listing with no set number, or two, is
 * left out. Only the store's LEGO collection is read and only LEGO-made product kept: keychains, lights,
 * display frames, storage, books, other brands' bricks and boxes of blind bags are refused.
 */
import type { RawOffer, RetailerId } from "../../src/lib/types";
import { decodeEntities, get, sleep } from "../lib/http";

type Variant = { id: number; title: string; sku?: string | null; price: string; compare_at_price?: string | null; available?: boolean };
type Product = { title: string; handle: string; product_type?: string; vendor?: string; variants: Variant[]; images?: { src: string }[] };

/** Never a LEGO set itself. */
export const NOT_A_SET =
  /key ?chain|key ?ring|\blight(s|ing)? (kit|set)\b|\bled\b|\bdisplay (case|frame|box|stand)\b|\bframe\b|\bstorage\b|\bbook\b|\bmagazine\b|\bwatch\b|\bclock\b|\bbag\b(?! of)|\bbackpack\b|\bpencil\b|\bstationery\b|\bmagnet\b|\bplush\b|\bcostume\b|\bmug\b|\blunch\b|\bdrink bottle\b|\bpuzzle\b|\bsocks?\b|\bt-?shirt\b|\bvideo game\b|\b(ps5|ps4|xbox|nintendo switch)\b|\bbox set\b|\bfull box\b|\bcase of\b|\b\d{2,3}\s?pcs box\b|\bdisplay box\b|\bbundle\b|\bpre-?owned\b|\bused\b|\bopen box\b|\bdamaged\b|\bincomplete\b|\bcompatible\b/i;

/** "LEG-42171", "LEG75447", "LEGO-10326" → the set number; anything with a suffix ("LEG-71053-BOX") is not a single set. */
export function setFromSku(sku: string | null | undefined): string | undefined {
  return sku?.trim().toUpperCase().match(/^LEG(?:O)?-?(\d{4,6})$/)?.[1];
}

/** The one set number in a title (4–6 digits, not a piece count, a year or an age). Two different numbers: none. */
export function setFromTitle(title: string): string | undefined {
  const t = title.replace(/\b\d{1,2}\s?\+/g, " ").replace(/\b\d[\d,]*\s?(pcs|pieces|piece|pc|pce)\b/gi, " ");
  const nums = [...new Set([...t.matchAll(/(?<![\d.$])(\d{4,6})(?![\d.%])/g)].map((m) => m[1]).filter((n) => !(n.length === 4 && /^(19|20)\d\d$/.test(n))))];
  return nums.length === 1 ? nums[0] : undefined;
}

const feeds = new Map<string, Promise<Product[]>>();
function collection(base: string, handle: string): Promise<Product[]> {
  const k = `${base}/${handle}`;
  if (!feeds.has(k))
    feeds.set(
      k,
      (async () => {
        const out: Product[] = [];
        for (let page = 1; page <= 20; page++) {
          const { products } = JSON.parse(await get(`${base}/collections/${handle}/products.json?limit=250&page=${page}`)) as { products: Product[] };
          out.push(...products);
          if (products.length < 250) break;
          await sleep(1200);
        }
        return out;
      })(),
    );
  return feeds.get(k)!;
}

export interface LegoShop {
  retailer: RetailerId;
  base: string;
  collections: string[];
}

export async function legoShop(o: LegoShop): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const handle of o.collections) {
    for (const p of await collection(o.base, handle)) {
      if (!/^lego$/i.test((p.vendor ?? "").trim())) continue;
      const title = decodeEntities(p.title).replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
      if (NOT_A_SET.test(`${title} ${p.product_type ?? ""}`)) continue;
      // One listing per set: a multi-variant product is a bundle or a colour pick, never a set.
      if (p.variants.length !== 1) continue;
      const v = p.variants[0];
      const set = setFromSku(v.sku) ?? setFromTitle(title);
      if (!set) continue;
      // A SKU naming one set and a title naming another is a mistake on the store's side.
      const inTitle = setFromTitle(title);
      if (inTitle && inTitle !== set) continue;
      const price = Number(v.price);
      if (!price || price < 10) continue;
      const was = Number(v.compare_at_price) || 0;
      const named = /\blego\b/i.test(title) ? title : `LEGO ${title}`;
      out.set(String(v.id), {
        retailer: o.retailer,
        sku: (v.sku ?? "").trim() || String(v.id),
        title: named.includes(set) ? named : `${named} ${set}`,
        url: `${o.base}/products/${p.handle}`,
        price,
        wasPrice: was > price ? was : undefined,
        image: p.images?.[0]?.src,
        inStock: v.available !== false,
        mpn: set,
        brand: "LEGO",
      });
    }
  }
  return [...out.values()];
}
