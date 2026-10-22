import type { RawOffer } from "../../src/lib/types";
import { decodeEntities, get, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";

const BASE = "https://www.mobileciti.com.au";

/** Mobileciti is Magento: plain server-rendered product grid, paged by ?p=. */
export async function scrapeMobileciti(): Promise<RawOffer[]> {
  const offers = new Map<string, RawOffer>();
  for (let page = 1; page <= 40; page++) {
    const html = await get(`${BASE}/mobile-phones?p=${page}&product_list_limit=48`);
    const items = html.split('<li class="item product product-item').slice(1);
    let added = 0;
    for (const raw of items) {
      const it = raw.slice(0, 12000);
      const link = it.match(/class="product-item-link"\s+href="([^"]+)">\s*([^<]+?)\s*<\/a>/);
      if (!link) continue;
      const [, url, name] = link;
      const title = decodeEntities(name);
      if (offers.has(url) || !looksLikePhone(title)) continue;
      const price = Number(it.match(/data-price-amount="([\d.]+)"\s+data-price-type="finalPrice"/)?.[1]);
      if (!price) continue;
      const was = Number(it.match(/data-price-amount="([\d.]+)"\s+data-price-type="oldPrice"/)?.[1]);
      const img = it.match(/<img src="([^"]+)"[^>]*class="product-image-photo default_image/)?.[1];
      added++;
      offers.set(url, {
        retailer: "mobileciti",
        sku: url.replace(BASE + "/", ""),
        title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: img ? decodeEntities(img).replace(/\?.*$/, "?width=600&height=600&store=mobileciti&image-type=image") : undefined,
        inStock: /class="stock available"/.test(it),
      });
    }
    if (added === 0) break;
    await sleep(800);
  }
  return [...offers.values()];
}
