/**
 * One reader for the many Shopify stores that need no rules of their own (2026-11-01, "100+ stores"): the whole
 * public `/products.json` is read once, and every variant is put in the FIRST of the store's categories whose shared
 * title check passes (`IS`, `junk`, `badPrice` from categories/jbhifi.ts: the same checks the AU, US and UK stores
 * already go through), so a store file is a single line naming its categories. A title that passes no check is left
 * out; nothing is guessed from a product_type alone. LEGO uses the set-number rules of `lego.ts`, phones need a
 * phone model name as well as `looksLikePhone`.
 *
 * Prices are the shop's base currency (`/products.json` ignores the visitor's market), which `probe-auto.ts`
 * checked against the region's currency before a store was added.
 */
import type { CategoryId, RawOffer, RetailerId } from "../../src/lib/types";
import { decodeEntities, getJson, sleep } from "../lib/http";
import { IS, badPrice, junk, mpnFromSku, type ShopifyProduct } from "./categories/jbhifi";
import { looksLikePhone } from "./filter";
import { NOT_A_SET, setFromSku, setFromTitle } from "./lego";

type Cat = CategoryId;

/** Never new stock, whatever the category. */
const USED =
  /refurb|renewed|re-newed|pre-?owned|open[- ]?box|ex[- ]?(display|demo)|b[- ]grade|b-?stock|\bused\b|second[- ]?hand|grade [abc]\b|\bpristine\b|\bexcellent condition\b|\bvery good\b|\bgood condition\b|\bdamaged\b|\bscratch(ed)?\b|\bdent(ed)?\b|gift ?card|e-?gift|protection plan|extended warranty|\bwarranty\b|trade-?in|mystery|\brental\b|\bdeposit\b|\bpre-?order deposit\b/i;

/** A phone model name: `looksLikePhone` alone would take any title with "GB" in it. */
const PHONE =
  /\biphone \d|\bgalaxy (s|z|a)\d|\bpixel \d|\boneplus \d|\bnord\b|\bmoto(rola)? (g|edge|razr)|\brazr\b|\bnothing phone|\bcmf phone|\bxiaomi \d|\bredmi note|\bpoco [fxm]\d|\boppo (find|reno|a)\d?|\bvivo [xyv]\d|\bhonor (magic|\d)|\bsony xperia|\bfairphone|\bnokia (g|x|c)\d/i;
const NOT_PHONE = /\b(ssd|nvme|ram|ddr\d|memory card|micro ?sd|usb|flash drive|tablet|ipad|laptop|watch|router|case|cover|protector|charger|cable)\b/i;

const catalogues = new Map<string, Promise<ShopifyProduct[]>>();
/** The whole store, paged politely, once per run. */
export function catalogue(base: string, maxPages = 40): Promise<ShopifyProduct[]> {
  let c = catalogues.get(base);
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
    catalogues.set(base, c);
  }
  return c;
}

/** Which of `cats` this title is, or undefined. */
export function classify(cats: readonly Cat[], title: string, price: number, vendor?: string): Cat | undefined {
  for (const cat of cats) {
    if (cat === "lego") {
      if (/^lego$/i.test(vendor?.trim() ?? "") && !NOT_A_SET.test(title) && setFromTitle(title)) return cat;
      continue;
    }
    if (cat === "phones") {
      if (PHONE.test(title) && !NOT_PHONE.test(title) && looksLikePhone(title) && price >= 80) return cat;
      continue;
    }
    const c = cat as Exclude<Cat, "phones">;
    if (junk(c, title) || !IS[c](title) || badPrice(c, price)) continue;
    return cat;
  }
  return undefined;
}

export interface AutoStore {
  retailer: RetailerId;
  base: string;
  /** In priority order: a variant goes to the first that takes it. */
  cats: readonly Cat[];
  /** Brand when the store sells only its own. */
  brand?: string;
  /** Extra titles to refuse (store-made bundles, a store's own wording for display stock). */
  exclude?: RegExp;
  /** SKUs are the maker's model codes (brand stores and some dealers); default: `mpnFromSku`'s guess. */
  skuIsMpn?: boolean;
}

/** Every listed category's offers from one read of the store. */
export async function readAuto(s: AutoStore): Promise<Map<Cat, RawOffer[]>> {
  const out = new Map<Cat, Map<string, RawOffer>>();
  for (const p of await catalogue(s.base)) {
    const pt = decodeEntities(p.title).replace(/[®™]/g, "").replace(/\s+/g, " ").trim();
    const tags = Array.isArray(p.tags) ? p.tags.join(" ") : p.tags ?? "";
    if (USED.test(pt) || USED.test(p.product_type ?? "") || /refurb|pre-?owned|\bused\b|open-?box/i.test(tags) || s.exclude?.test(pt)) continue;
    for (const v of p.variants) {
      const vt0 = (v.title ?? "").trim();
      if (USED.test(vt0)) continue;
      const parts = /^default( title)?$/i.test(vt0) ? [] : vt0.split(/\s*\/\s*/).filter((x) => x && !pt.toLowerCase().includes(x.toLowerCase()));
      const title = parts.length ? `${pt} ${parts.join(" ")}` : pt;
      if (s.exclude?.test(title)) continue;
      const price = Number(v.price);
      if (!price || price >= 9999) continue;
      const cat = classify(s.cats, title, price, p.vendor);
      if (!cat) continue;
      if (cat === "lego") {
        // One listing per set; a SKU naming another set than the title is the store's mistake.
        if (p.variants.length !== 1) continue;
        const set = setFromSku(v.sku) ?? setFromTitle(title);
        if (!set || setFromTitle(title) !== set) continue;
      }
      const was = Number(v.compare_at_price);
      let image = (v as { featured_image?: { src: string } | null }).featured_image?.src ?? p.images[0]?.src;
      if (image?.startsWith("//")) image = `https:${image}`;
      const sku = (v.sku ?? "").trim();
      const vendor = p.vendor?.trim();
      const brand = cat === "lego" ? "LEGO" : s.brand ?? (vendor && !/default|vendor|^[A-Z0-9]{2,3}$/i.test(vendor) ? vendor : undefined);
      const set = cat === "lego" ? setFromTitle(title) : undefined;
      const offer: RawOffer = {
        retailer: s.retailer,
        sku: sku || String(v.id),
        title: cat === "lego" && !/\blego\b/i.test(title) ? `LEGO ${title}` : title,
        url: `${s.base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
        price,
        wasPrice: was > price ? was : undefined,
        image,
        inStock: v.available !== false,
        brand,
        mpn: set ?? (s.skuIsMpn ? sku || undefined : mpnFromSku(sku)),
      };
      if (!out.has(cat)) out.set(cat, new Map());
      out.get(cat)!.set(String(v.id), offer);
    }
  }
  return new Map([...out].map(([c, m]) => [c, [...m.values()]]));
}

/** The `scrapers` export of a one-line store file. */
export function autoShopify(s: AutoStore): Partial<Record<Cat, () => Promise<RawOffer[]>>> {
  let all: Promise<Map<Cat, RawOffer[]>> | undefined;
  return Object.fromEntries(s.cats.map((c) => [c, async () => (await (all ??= readAuto(s))).get(c) ?? []]));
}
