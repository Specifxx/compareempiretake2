/**
 * Appliance Central (appliancecentral.com.au, Sydney): fridges, laundry, TVs, coffee machines, air fryers and small
 * appliances. OpenCart category pages (`/<category>?page=N`, 50 a page, "Showing 1 to 50 of 228 (5 Pages)")
 * server-render one `prod-grid-base` block per product with the name link, the maker's model code in
 * `<div class="model">` and the price (AUD, GST inclusive). Probed from GitHub Actions 2026-11-04.
 */
import type { CategoryId, RawOffer } from "../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../lib/http";
import { classify } from "../auto-shopify";

const BASE = "https://www.appliancecentral.com.au";
type Card = { url: string; title: string; model?: string; price: number; image?: string; out: boolean };

function cards(html: string): Card[] {
  return html
    .split(/class="prod-grid-base/)
    .slice(1)
    .map((b) => b.slice(0, 6000))
    .flatMap((b) => {
      const link = b.match(/class="name"><a href="([^"]+)">([^<]+)<\/a>/);
      const price = Number(b.match(/class="price">\s*\$([\d,]+(?:\.\d+)?)/)?.[1]?.replace(/,/g, ""));
      if (!link || !price) return [];
      return [
        {
          url: link[1],
          title: decodeEntities(link[2]).replace(/\s+/g, " ").trim(),
          model: b.match(/class="model">([^<]+)</)?.[1]?.trim(),
          price,
          image: b.match(/<img[^>]+src="(https?:[^"]+)"/)?.[1],
          out: /out of stock|sold out/i.test(b.replace(/<[^>]+>/g, " ")),
        },
      ];
    });
}

async function crawl(path: string): Promise<Card[]> {
  const out = new Map<string, Card>();
  for (let page = 1; page <= 12; page++) {
    const html = await get(`${BASE}${path}${page > 1 ? `?page=${page}` : ""}`);
    const cs = cards(html);
    for (const c of cs) out.set(c.url, c);
    if (!cs.length || !html.includes(`${path}?page=${page + 1}"`)) break;
    await sleep(900);
  }
  return [...out.values()];
}

const PATHS: Partial<Record<CategoryId, string[]>> = {
  fridges: ["/fridges"],
  "washing-machines": ["/washing-machines"],
  dishwashers: ["/dishwashers-c274/"],
  tvs: ["/televisions"],
  "coffee-machines": ["/coffee-machines"],
  "air-fryers": ["/air-fryers"],
  "small-kitchen": ["/small-appliances"],
};
const ALL = Object.keys(PATHS) as CategoryId[];

async function scrape(cat: CategoryId): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of PATHS[cat] ?? []) {
    for (const c of await crawl(path)) {
      // Titles lead with the model code ("HRF420BS Haier 420 L Bottom Mount Fridge"); the brand is the word after it.
      const title = c.model && c.title.toUpperCase().startsWith(c.model.toUpperCase()) ? c.title.slice(c.model.length).trim() : c.title;
      const brand = title.match(/^([A-Z][A-Za-z&'-]+)/)?.[1];
      if (classify(ALL, title, c.price, brand) !== cat) continue;
      out.set(c.url, { retailer: "appliancecentral", sku: c.model ?? c.url, title, url: c.url, price: c.price, image: c.image, inStock: !c.out, brand, mpn: c.model });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = Object.fromEntries(ALL.map((c) => [c, () => scrape(c)]));
