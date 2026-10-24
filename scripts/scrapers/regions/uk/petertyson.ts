/**
 * Peter Tyson (petertyson.co.uk, Magento/Hyvä): soundbars, headphones and wireless speakers.
 * (The TV listings answer 403 to non-browser clients, so TVs are not scraped.)
 * Listing pages (?p=N, product_list_limit=36) server-render one add-to-cart form per product with the name link,
 * image, data-price-amount for finalPrice (today, GBP incl. VAT) and oldPrice ("Regular Price"), and an Amasty stock pill
 * ("In Stock" / "Out of Stock" / "Pre-order"). Ex-display units are dropped.
 */
import type { CategoryId, RawOffer } from "../../../../src/lib/types";
import { decodeEntities, get, sleep } from "../../../lib/http";
import { IS, badPrice, junk, mpnFromCode, mpnFromTitle } from "../../categories/jbhifi";

const BASE = "https://petertyson.co.uk";

type Card = { id: string; name: string; url: string; price?: number; was?: number; image?: string; inStock: boolean };

function cards(html: string): Card[] {
  return html
    .split("product_addtocart_form")
    .slice(1)
    .map((c) => {
      const a = c.match(/<a class="product-item-link" href="([^"]+)">([\s\S]*?)<\/a>/);
      const stock = c.match(/stockstatus\/[^"]*"\s+alt="([^"]+)"/)?.[1] ?? "";
      return {
        id: c.match(/name="product" value="(\d+)"/)?.[1] ?? "",
        name: decodeEntities(a?.[2] ?? "").replace(/\s+/g, " ").trim(),
        url: a?.[1] ?? "",
        price: Number(c.match(/data-price-amount="([\d.]+)" data-price-type="finalPrice"/)?.[1]) || undefined,
        was: Number(c.match(/data-price-amount="([\d.]+)" data-price-type="oldPrice"/)?.[1]) || undefined,
        image: c.match(/<img[^>]+src="(https:\/\/petertyson\.co\.uk\/media[^"]+)"/)?.[1],
        inStock: /in stock/i.test(stock),
      };
    });
}

async function crawl(path: string): Promise<Card[]> {
  const out: Card[] = [];
  const seen = new Set<string>();
  for (let p = 1; p <= 30; p++) {
    const html = await get(`${BASE}/${path}?product_list_limit=36${p > 1 ? `&p=${p}` : ""}`, p > 1 ? 2 : 4);
    const cs = cards(html).filter((c) => c.id && !seen.has(c.id));
    if (!cs.length) break;
    for (const c of cs) seen.add(c.id);
    out.push(...cs);
    await sleep(1000);
  }
  return out;
}

async function scrape(cat: Exclude<CategoryId, "phones">, paths: string[]): Promise<RawOffer[]> {
  const out = new Map<string, RawOffer>();
  for (const path of paths) {
    for (const c of await crawl(path)) {
      if (!c.name || !c.price || !c.url || out.has(c.id)) continue;
      if (/ex[- ]?display|ex[- ]?demo|b[- ]grade|refurb|open box|pre-?owned/i.test(c.name) || junk(cat, c.name) || !IS[cat](c.name) || badPrice(cat, c.price)) continue;
      out.set(c.id, {
        retailer: "uk-petertyson",
        sku: c.id,
        mpn: mpnFromCode(c.name) ?? (cat === "tvs" ? mpnFromTitle(c.name) : undefined),
        title: c.name,
        url: c.url,
        price: c.price,
        wasPrice: c.was && c.was > c.price ? c.was : undefined,
        image: c.image,
        inStock: c.inStock,
      });
    }
  }
  return [...out.values()];
}

export const scrapers: Partial<Record<CategoryId, () => Promise<RawOffer[]>>> = {
  soundbars: () => scrape("soundbars", ["speakerssubs/soundbars-bases/all-soundbars"]),
  headphones: () => scrape("headphones", ["headphones/all-headphones"]),
  speakers: () => scrape("speakers", ["speakerssubs/wireless-speakers/bluetooth", "speakerssubs/wireless-speakers/portable", "speakerssubs/wireless-speakers/wifi", "speakerssubs/wireless-speakers/wireless-multi-room"]),
};
