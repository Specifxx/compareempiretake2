/**
 * Brand stores on Shopify that sell their own appliances (SharkNinja, Tefal, Bissell): the whole
 * /products.json once per run, sorted into categories by the store's own product_type, then the shared
 * appliance title checks. The SKU is the maker's model code on these stores (IP3251ANZ, FB7018).
 */
import type { RawOffer, RetailerId } from "../../src/lib/types";
import { decodeEntities, get, sleep } from "../lib/http";
import { APPLIANCE_MIN_PRICE, isAppliance, type ApplianceCat } from "./appliances";

type Variant = { id: number; title: string; sku?: string | null; price: string; compare_at_price?: string | null; available?: boolean };
type Product = { title: string; handle: string; product_type?: string; vendor?: string; variants: Variant[]; images?: { src: string }[] };

const feeds = new Map<string, Promise<Product[]>>();
function allProducts(base: string): Promise<Product[]> {
  if (!feeds.has(base))
    feeds.set(
      base,
      (async () => {
        const out: Product[] = [];
        for (let page = 1; page <= 30; page++) {
          const { products } = JSON.parse(await get(`${base}/products.json?limit=250&page=${page}`)) as { products: Product[] };
          out.push(...products);
          if (products.length < 250) break;
          await sleep(1200);
        }
        return out;
      })(),
    );
  return feeds.get(base)!;
}

export interface ShopOpts {
  retailer: RetailerId;
  base: string;
  /** The store's product_type for each category. */
  types: Partial<Record<ApplianceCat, RegExp>>;
  brand: (p: Product) => string;
  /** Prefix the brand when the store's titles leave it out ("CleanView Turbo" → "Bissell CleanView Turbo"). */
  addBrand?: boolean;
}

export async function shopAppliances(cat: ApplianceCat, o: ShopOpts): Promise<RawOffer[]> {
  const re = o.types[cat];
  if (!re) return [];
  const out: RawOffer[] = [];
  for (const p of await allProducts(o.base)) {
    if (!re.test(p.product_type ?? "")) continue;
    const brand = o.brand(p);
    let title = decodeEntities(p.title).replace(/[®™ª]/g, "").replace(/\s+/g, " ").trim();
    if (o.addBrand && !title.toLowerCase().startsWith(brand.toLowerCase())) title = `${brand} ${title}`;
    for (const v of p.variants) {
      const t = v.title && v.title !== "Default Title" ? `${title} - ${v.title}` : title;
      const price = Number(v.price);
      if (!isAppliance(cat, t) || !price || price < APPLIANCE_MIN_PRICE[cat]) continue;
      const was = Number(v.compare_at_price) || 0;
      const sku = (v.sku ?? "").trim().toUpperCase();
      out.push({
        retailer: o.retailer,
        sku: sku || String(v.id),
        title: t,
        url: `${o.base}/products/${p.handle}${p.variants.length > 1 ? `?variant=${v.id}` : ""}`,
        price,
        wasPrice: was > price ? was : undefined,
        image: p.images?.[0]?.src,
        inStock: v.available !== false,
        // A model code has letters and digits; Tefal's ten-digit SKUs are internal (its titles end with the code).
        mpn: /^[A-Z0-9-]{4,20}$/.test(sku) && /[A-Z]/.test(sku) && /\d/.test(sku) ? sku : undefined,
        brand,
      });
    }
  }
  return out;
}
