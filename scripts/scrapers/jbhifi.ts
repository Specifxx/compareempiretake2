import type { RawOffer } from "../../src/lib/types";
import { get, getJson, pool, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";

const BASE = "https://www.jbhifi.com.au";
const HANDLE =
  /\/products\/(apple-iphone|samsung-galaxy-(s|z|a)\d|google-pixel-\d|oppo-|motorola-|nothing-phone|cmf-phone|honor-|xiaomi-|redmi-|poco-|vivo-|tcl-|nokia-|hmd-|asus-|sony-xperia|realme-|zte-|alcatel-|fairphone)/i;

interface ShopifyProduct {
  title: string;
  handle: string;
  product_type: string;
  body_html: string;
  tags: string | string[];
  images: { src: string }[];
  variants: { id: number; sku: string; price: string; compare_at_price: string | null; available?: boolean }[];
}

/**
 * JB Hi-Fi runs on Shopify. Its collection feeds are capped, so we walk the
 * product sitemaps for phone-looking handles and read each product's JSON.
 */
export async function scrapeJbHifi(): Promise<RawOffer[]> {
  const index = await get(`${BASE}/sitemap.xml`);
  const maps = [...index.matchAll(/<loc>([^<]*sitemap_products[^<]*)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const urls = new Set<string>();
  await pool(maps, 4, async (m) => {
    const xml = await get(m);
    for (const [, loc] of xml.matchAll(/<loc>(https:\/\/www\.jbhifi\.com\.au\/products\/[^<]+)<\/loc>/g)) {
      if (HANDLE.test(loc) && looksLikePhone(loc.replace(/-/g, " ").replace(/(\d+)(gb|tb)/gi, "$1$2 "))) urls.add(loc);
    }
  });
  console.log(`  jbhifi: ${urls.size} candidate products`);
  const offers: RawOffer[] = [];
  await pool([...urls], 4, async (url) => {
    try {
      const { product: p } = await getJson<{ product: ShopifyProduct }>(`${url}.json`);
      if (p.product_type !== "COMMUNICATIONS" || !looksLikePhone(p.title)) return;
      const tags = Array.isArray(p.tags) ? p.tags.join(",") : p.tags;
      // Discontinued listings stay in the sitemap with their last price.
      if (/NoLongerAvailable|Discontinued|(^|,)\s*Unknown\s*(,|$)/i.test(tags)) return;
      const v = p.variants[0];
      const price = Number(v.price);
      if (!price) return;
      const was = Number(v.compare_at_price);
      offers.push({
        retailer: "jbhifi",
        sku: String(v.sku || v.id),
        title: p.title,
        url,
        price,
        wasPrice: was > price ? was : undefined,
        image: p.images[0]?.src,
        inStock: !/AwaitingStock|PreOrder|NotAvailable|SoldOut/i.test(tags),
        blurb: blurbFrom(p.body_html),
      });
    } catch (e) {
      console.warn(`  jbhifi: skip ${url}: ${(e as Error).message}`);
    }
    await sleep(150);
  });
  return offers;
}

function blurbFrom(html: string): string | undefined {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.slice(0, 1500);
}
