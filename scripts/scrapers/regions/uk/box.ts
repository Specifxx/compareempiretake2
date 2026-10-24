/**
 * Box (box.co.uk, Angular): laptops, desktops, monitors, PC parts, tablets, phones, printers, routers, headsets.
 * A category page's HTML names its category_id; the listing then pages through the JSON the page itself calls
 * anonymously (box.co.uk/api/products?category_id=…&page=N&limit=100). Each product carries sku (the
 * manufacturer part number, e.g. BM2U1EA#ABU), name, brand, url_key, price.price (RRP) / price.final_price
 * (today's price, GBP incl. VAT) and qty (stock). Several listings are unioned per category and the shared title checks
 * decide what belongs.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, getJson, sleep } from "../../../lib/http";
import { IS, badPrice, junk } from "../../categories/jbhifi";
import { looksLikePhone } from "../../filter";

const BASE = "https://www.box.co.uk";

type Product = {
  sku: string;
  qty?: number;
  price: { price?: number; final_price?: number };
  attributes: { name: string; url_key: string; brand?: string; image?: string; status?: string; is_delisted?: unknown; is_rental?: unknown };
};

const listings = new Map<string, Promise<Product[]>>();
function listing(slug: string): Promise<Product[]> {
  let l = listings.get(slug);
  if (!l) {
    l = (async () => {
      const html = await get(`${BASE}/${slug}`);
      const id = html.match(/category_id["=:]*\s*"?(\d+)/)?.[1];
      if (!id) return [];
      const out: Product[] = [];
      for (let page = 1; page <= 30; page++) {
        const d = await getJson<{ products: Product[]; total: number }>(`${BASE}/api/products?category_id=${id}&page=${page}&limit=100&showBy=position&sort_by=asc`);
        out.push(...d.products);
        if (!d.products.length || page * 100 >= d.total) break;
        await sleep(800);
      }
      return out;
    })();
    listings.set(slug, l);
  }
  return l;
}

async function scrape(cat: CategoryId, slugs: string[]): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const slug of slugs) {
    let products: Product[];
    try {
      products = await listing(slug);
    } catch {
      continue;
    }
    for (const p of products) {
      const title = decodeEntities(p.attributes.name ?? "").replace(/\s+/g, " ").trim();
      const price = Number(p.price?.final_price ?? p.price?.price);
      if (!title || out.has(p.sku) || /refurb|renewed|open box|b grade|ex[- ]display|\(?used\)?|-nos$/i.test(`${title} ${p.sku}`)) continue;
      if (/^(1|true)$/.test(String(p.attributes.is_rental ?? "")) || /^(1|true)$/.test(String(p.attributes.is_delisted ?? ""))) continue;
      if (cat === "phones" ? !looksLikePhone(title) || !price : junk(cat, title) || !IS[cat](title) || badPrice(cat, price)) continue;
      const rrp = Number(p.price?.price);
      let image = p.attributes.image;
      if (image && !/^https?:/.test(image)) image = `https://media.box.co.uk/product${image.startsWith("/") ? "" : "/"}${image}`;
      out.set(p.sku, {
        retailer: "uk-box",
        sku: p.sku,
        mpn: p.sku,
        brand: p.attributes.brand || undefined,
        title,
        url: `${BASE}/${p.attributes.url_key}`,
        price,
        wasPrice: rrp > price ? rrp : undefined,
        image,
        inStock: (p.qty ?? 0) > 0,
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  laptops: () => scrape("laptops", ["laptops", "gaming-laptops"]),
  desktops: () => scrape("desktops", ["desktop-computers", "gaming-pcs", "all-in-one-pcs"]),
  monitors: () => scrape("monitors", ["monitors", "gaming-monitors"]),
  "graphics-cards": () => scrape("graphics-cards", ["components", "amd-graphics-cards"]),
  cpus: () => scrape("cpus", ["processors", "components"]),
  motherboards: () => scrape("motherboards", ["motherboards"]),
  ram: () => scrape("ram", ["memory"]),
  ssds: () => scrape("ssds", ["ssds", "components"]),
  tablets: () => scrape("tablets", ["tablets", "ipad"]),
  phones: () => scrape("phones", ["smartphones", "phones", "android-phones", "samsung-phones", "iphones"]),
  printers: () => scrape("printers", ["printers"]),
  routers: () => scrape("routers", ["routers"]),
  headphones: () => scrape("headphones", ["headsets", "headphones", "gaming-headsets"]),
};
