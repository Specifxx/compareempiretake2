import type { RawOffer } from "../../src/lib/types";
import { decodeEntities, get, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";

const BASE = "https://www.thegoodguys.com.au";

/** The Good Guys renders each product card with data-cnstrc-* attributes. */
export async function scrapeGoodGuys(): Promise<RawOffer[]> {
  const offers = new Map<string, RawOffer>();
  for (let page = 1; page <= 30; page++) {
    const html = await get(`${BASE}/phones-and-wearables/mobile-phones?page=${page}`);
    const cards = html.split('data-testid="product-card"').slice(1);
    let added = 0;
    for (const c of cards) {
      const name = c.match(/data-cnstrc-item-name="([^"]*)"/)?.[1];
      const price = Number(c.match(/data-cnstrc-item-price="([\d.]+)"/)?.[1]);
      const href = c.match(/href="(\/[^"#?]+)"/)?.[1];
      if (!name || !price || !href) continue;
      const title = decodeEntities(name);
      if (!looksLikePhone(title)) continue;
      const img = c.match(/<img[^>]*src="([^"]+)"/)?.[1];
      const body = c.slice(0, 20000);
      const was = Number(body.match(/(?:was|Was|RRP)[^$]{0,80}\$\s?([\d,]+(?:\.\d\d)?)/)?.[1]?.replace(/,/g, ""));
      const key = href;
      if (offers.has(key)) continue;
      added++;
      offers.set(key, {
        retailer: "thegoodguys",
        sku: href.match(/-(\d+)$/)?.[1] ?? href,
        title,
        url: BASE + href,
        price,
        wasPrice: was > price ? was : undefined,
        image: img ? decodeEntities(img) : undefined,
        inStock: !/sold out|out of stock|unavailable/i.test(body.slice(0, 6000)),
      });
    }
    const total = Number(html.match(/Showing\s*(?:<!-- -->)?\d+(?:<!-- -->)?\s*of\s*(?:<!-- -->)?(\d+)/)?.[1] ?? 0);
    if (cards.length === 0 || added === 0 || (total && page * 29 >= total)) break;
    await sleep(800);
  }
  return [...offers.values()];
}
