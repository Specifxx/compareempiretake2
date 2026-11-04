/**
 * Peter's of Kensington (petersofkensington.com.au, Sydney): kitchen appliances and homewares. Each category page
 * server-renders a schema.org ItemList (`<script type="application/ld+json">`) with every product's name, URL, SKU,
 * brand, image, price (AUD) and availability, 50 or so a page (`?page=N`; the last page repeats page 1's footer link
 * only). Probed from GitHub Actions 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { get, sleep } from "../../lib/http";
import { classify } from "../auto-shopify";

const BASE = "https://www.petersofkensington.com.au";
type Item = {
  name?: string;
  url?: string;
  sku?: string;
  image?: string;
  brand?: { name?: string };
  offers?: { price?: number | string; availability?: string; priceSpecification?: { price?: number | string } };
};

async function crawl(path: string, maxPages = 8): Promise<Item[]> {
  const out = new Map<string, Item>();
  for (let page = 1; page <= maxPages; page++) {
    const html = await get(`${BASE}${path}${page > 1 ? `?page=${page}` : ""}`);
    let n = 0;
    for (const m of html.matchAll(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
      let j: { "@type"?: string | string[]; itemListElement?: { item?: Item }[] };
      try {
        j = JSON.parse(m[1]);
      } catch {
        continue;
      }
      if (!Array.isArray(j.itemListElement)) continue;
      for (const li of j.itemListElement) {
        const it = li.item;
        if (!it?.sku || !it.name || out.has(it.sku)) continue;
        out.set(it.sku, it);
        n++;
      }
    }
    if (!n || !html.includes(`?page=${page + 1}`)) break;
    await sleep(900);
  }
  return [...out.values()];
}

const PATHS: Partial<Record<CategoryId, string[]>> = {
  "coffee-machines": ["/electrical-appliances/kitchen-appliances/coffee-machines/"],
  "coffee-gear": ["/electrical-appliances/kitchen-appliances/coffee-grinders/"],
  "air-fryers": ["/electrical-appliances/kitchen-appliances/air-fryers--deep-fryers/"],
  "small-kitchen": [
    "/electrical-appliances/kitchen-appliances/food-processors/",
    "/electrical-appliances/kitchen-appliances/hand-mixers-blenders/",
    "/electrical-appliances/kitchen-appliances/juicers/",
    "/electrical-appliances/kitchen-appliances/kettles/",
    "/electrical-appliances/kitchen-appliances/stand-mixers/",
    "/electrical-appliances/kitchen-appliances/toasters/",
    "/electrical-appliances/kitchen-appliances/multi-cookers/",
    "/electrical-appliances/kitchen-appliances/grills-sandwich-makers/",
  ],
  fridges: ["/electrical-appliances/kitchen-appliances/refrigerators/"],
};

async function scrape(cat: CategoryId): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of PATHS[cat] ?? []) {
    for (const it of await crawl(path)) {
      const title = it.name!.replace(/\s+/g, " ").trim();
      const price = Number(it.offers?.price);
      // Every category this store is read for, so a kettle in the coffee list still lands as small-kitchen.
      const c = classify(Object.keys(PATHS) as CategoryId[], title, price, it.brand?.name);
      if (c !== cat) continue;
      const was = Number(it.offers?.priceSpecification?.price);
      const url = it.url ? new URL(it.url, BASE).href : undefined;
      if (!url) continue;
      out.set(it.sku!, {
        retailer: "petersofkensington",
        sku: it.sku!,
        title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: it.image,
        inStock: !/OutOfStock|SoldOut|Discontinued/i.test(it.offers?.availability ?? ""),
        brand: it.brand?.name,
        mpn: title.match(/\b([A-Z]{2,5}\d{3,5}[A-Z0-9]{0,4})\s*$/)?.[1],
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = Object.fromEntries((Object.keys(PATHS) as CategoryId[]).map((c) => [c, () => scrape(c)]));
