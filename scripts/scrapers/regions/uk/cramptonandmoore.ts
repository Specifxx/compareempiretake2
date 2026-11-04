/**
 * Crampton & Moore (cramptonandmoore.co.uk, Yorkshire): TVs, home cinema and appliances. Magento (Porto theme): a
 * category page carries a JSON list of every product on it (`{"id","name","price","brand"}` in page order, prices in
 * pounds inc. VAT, matching the cards' `finalPrice`), a second list with each id's `sku` (the maker's model code),
 * and the cards themselves (`<li class="item product product-item">` with the product link and
 * `data-price-type="finalPrice"` / `"oldPrice"`). `?p=N` pages. Probed from GitHub Actions 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { classify } from "../../auto-shopify";

const BASE = "https://www.cramptonandmoore.co.uk";

const PATHS: Partial<Record<CategoryId, string[]>> = {
  tvs: ["/televisions.html"],
  soundbars: ["/home-cinema-hifi/soundbars.html"],
  speakers: ["/home-cinema-hifi/bluetooth-speakers.html", "/home-cinema-hifi/multi-room-and-smart-speakers.html"],
  headphones: ["/home-cinema-hifi/headphones.html"],
  "washing-machines": ["/laundry/washing-machines.html"],
  dishwashers: ["/dishwashers.html", "/kitchen-appliances/dishwashers.html"],
  fridges: ["/refrigeration.html"],
};
const CATS = Object.keys(PATHS) as CategoryId[];

type Meta = { id?: string | number; name?: string; price?: number | string; brand?: string; sku?: string };

function lists(html: string): Map<string, Meta> {
  const out = new Map<string, Meta>();
  for (const m of html.matchAll(/\[\{"id":"\d+","(?:name|sku)":[\s\S]*?\}\]/g)) {
    try {
      for (const p of JSON.parse(m[0]) as Meta[]) {
        if (p.id === undefined) continue;
        out.set(String(p.id), { ...out.get(String(p.id)), ...p });
      }
    } catch {
      /* not one of the product lists */
    }
  }
  return out;
}

async function crawl(path: string, maxPages = 12): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (let p = 1; p <= maxPages; p++) {
    let html: string;
    try {
      html = await get(`${BASE}${path}${p > 1 ? `?p=${p}` : ""}`);
    } catch {
      break;
    }
    const meta = lists(html);
    let fresh = 0;
    for (const card of html.split(/<li class="item product product-item">/).slice(1)) {
      const id = card.match(/product-price-(\d+)"/)?.[1];
      const url = card.match(/href="(https:\/\/www\.cramptonandmoore\.co\.uk\/[^"]+\.html)"/)?.[1];
      const price = Number(card.match(/data-price-amount="([\d.]+)"\s+data-price-type="finalPrice"/)?.[1]);
      const was = Number(card.match(/data-price-amount="([\d.]+)"\s+data-price-type="oldPrice"/)?.[1]);
      if (!id || !url || !(price > 0) || out.has(id)) continue;
      const m = meta.get(id);
      const title = decodeEntities(m?.name ?? card.match(/class="product-item-link"[^>]*>\s*([^<]+)</)?.[1] ?? "").replace(/\s+/g, " ").trim();
      if (!title) continue;
      fresh++;
      out.set(id, {
        retailer: "uk-cramptonandmoore",
        sku: id,
        title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: card.match(/data-src="(https:[^"]+)"/)?.[1],
        inStock: !/out of stock/i.test(card),
        brand: m?.brand,
        mpn: m?.sku,
      });
    }
    if (!fresh || !html.includes(`?p=${p + 1}"`)) break;
    await sleep(1000);
  }
  return [...out.values()];
}

async function scrape(cat: CategoryId): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of PATHS[cat] ?? []) {
    for (const o of await crawl(path)) if (classify(CATS, o.title, o.price, o.brand) === cat) out.set(o.sku, o);
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = Object.fromEntries(CATS.map((c) => [c, () => scrape(c)]));
