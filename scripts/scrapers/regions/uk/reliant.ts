/**
 * Reliant (reliant.co.uk, Lytham St Annes): TVs, audio and white goods. Magento with the Hyvä theme: each category
 * page server-renders its product cards (`<li class="item product product-item …">` with a hidden `product` id, the
 * product link, and `data-price-type="finalPrice"` / `"oldPrice"` amounts in pounds inc. VAT) and a `data = [...]`
 * analytics list with each product's id, name and brand. The analytics prices are ex-VAT (499.17 for a £599
 * soundbar), so the card's finalPrice is the price. `?p=N` pages; a page past the end has no products.
 * Probed from GitHub Actions 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { classify } from "../../auto-shopify";

const BASE = "https://www.reliant.co.uk";

const PATHS: Partial<Record<CategoryId, string[]>> = {
  tvs: ["/televisions"],
  soundbars: ["/audio/soundbars"],
  speakers: ["/audio/bluetooth-speakers"],
  "washing-machines": ["/washers-dryers/washing-machines"],
  dishwashers: ["/washers-dryers/dishwashers", "/dishwashers"],
  fridges: ["/fridges-freezers", "/refrigeration"],
};
const CATS = Object.keys(PATHS) as CategoryId[];

type Meta = { id?: string; name?: string; brand?: string; url?: string };

function page(html: string): { id: string; url: string; price: number; was?: number; image?: string }[] {
  const out: { id: string; url: string; price: number; was?: number; image?: string }[] = [];
  const parts = html.split(/class="item product product-item/).slice(1);
  for (const card of parts) {
    const url = card.match(/href="(https:\/\/www\.reliant\.co\.uk\/[^"]+)"/)?.[1];
    const price = Number(card.match(/data-price-amount="([\d.]+)"\s+data-price-type="finalPrice"/)?.[1]);
    const was = Number(card.match(/data-price-amount="([\d.]+)"\s+data-price-type="oldPrice"/)?.[1]);
    const id = url?.match(/-(\d{6,})$/)?.[1];
    if (!url || !id || !(price > 0)) continue;
    out.push({ id, url, price, was: was > price ? was : undefined, image: card.match(/srcset="(https:[^"]+\.(?:jpe?g|png))"/)?.[1] });
  }
  return out;
}

function metas(html: string): Map<string, Meta> {
  const out = new Map<string, Meta>();
  const m = html.match(/\bdata = (\[\{"id":[\s\S]*?\}\]);/);
  if (!m) return out;
  try {
    for (const p of JSON.parse(m[1]) as Meta[]) if (p.id) out.set(p.id, p);
  } catch {
    /* no list on this page */
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
    const cards = page(html);
    const meta = metas(html);
    let fresh = 0;
    for (const c of cards) {
      if (out.has(c.id)) continue;
      const m = meta.get(c.id);
      const title = decodeEntities(m?.name ?? "").replace(/\s+/g, " ").trim();
      if (!title) continue;
      fresh++;
      out.set(c.id, { retailer: "uk-reliant", sku: c.id, title, url: c.url, price: c.price, wasPrice: c.was, image: c.image, inStock: true, brand: m?.brand, mpn: title.match(/\b([A-Z]{1,4}\d{2,3}[A-Z0-9-]{3,})\b/)?.[1] });
    }
    if (!fresh) break;
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
