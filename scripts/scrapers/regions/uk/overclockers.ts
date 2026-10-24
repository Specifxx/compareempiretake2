/**
 * Overclockers UK (overclockers.co.uk, Salesforce Commerce Cloud): GPUs, CPUs, motherboards, RAM, storage, monitors,
 * laptops, gaming PCs and routers. Every listing page (?page=N, 40 per page) carries a JSON-LD ItemList of Products
 * with name, url, sku (OcUK's own code, e.g. GRA-ZTC-09262), brand and an Offer (GBP incl. VAT, availability).
 * OcUK shows no manufacturer part number in the listing, so mpn stays empty. Bundles ("… Bundle"), ex-demo and
 * refurbished systems are dropped.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { IS, badPrice, junk } from "../../categories/jbhifi";

const BASE = "https://www.overclockers.co.uk";

type Item = { name?: string; url?: string; image?: string; sku?: string; brand?: { name?: string }; offers?: { price?: number; availability?: string } };

function items(html: string): Item[] {
  const out: Item[] = [];
  for (const [, body] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(body);
      if (d["@type"] === "ItemList") for (const li of d.itemListElement ?? []) if (li.item) out.push(li.item);
    } catch {}
  }
  return out;
}

async function crawl(path: string): Promise<Item[]> {
  const first = await get(`${BASE}/${path}`);
  const last = Math.min(40, Math.max(1, ...[...first.matchAll(/\?page=(\d+)/g)].map((m) => Number(m[1]))));
  const out = items(first);
  for (let page = 2; page <= last; page++) {
    await sleep(1000);
    try {
      out.push(...items(await get(`${BASE}/${path}?page=${page}`, 2)));
    } catch {
      break;
    }
  }
  return out;
}

async function scrape(cat: Exclude<CategoryId, "phones">, paths: string[]): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of paths) {
    for (const it of await crawl(path)) {
      const title = decodeEntities(it.name ?? "").replace(/\s+/g, " ").trim();
      const price = Number(it.offers?.price);
      const sku = it.sku ?? it.url ?? "";
      if (!title || !sku || out.has(sku) || !it.url) continue;
      if (/\bbundle\b|ex[- ]?demo|refurb|b[- ]grade|open box|pre-?owned/i.test(title) || junk(cat, title) || !IS[cat](title) || badPrice(cat, price)) continue;
      out.set(sku, {
        retailer: "uk-overclockers",
        sku,
        brand: it.brand?.name || undefined,
        title,
        url: it.url,
        price,
        image: it.image,
        inStock: /InStock|LimitedAvailability/i.test(it.offers?.availability ?? ""),
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  "graphics-cards": () => scrape("graphics-cards", ["pc-components/graphics-cards"]),
  cpus: () => scrape("cpus", ["pc-components/processors"]),
  motherboards: () => scrape("motherboards", ["pc-components/motherboards"]),
  ram: () => scrape("ram", ["pc-components/ram-computer-memory"]),
  ssds: () => scrape("ssds", ["pc-components/computer-storage"]),
  monitors: () => scrape("monitors", ["monitors"]),
  laptops: () => scrape("laptops", ["laptops"]),
  desktops: () => scrape("desktops", ["pc-systems"]),
  routers: () => scrape("routers", ["networking/routers"]),
};
