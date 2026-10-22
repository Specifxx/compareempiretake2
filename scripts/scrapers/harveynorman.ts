import type { RawOffer } from "../../src/lib/types";
import { get, sleep } from "../lib/http";
import { looksLikePhone } from "./filter";

const BASE = "https://www.harveynorman.com.au";

interface HnVariant {
  sku: string;
  name: string;
  url_key: string;
  thumbnail_url?: string;
  final_price: number;
  stock_status: string;
}
interface HnItem {
  sku: string;
  name: string;
  url_key: string;
  url_suffix: string;
  small_image?: { url: string };
  price_range?: { minimum_price: { final_price: { value: number }; discount?: { amount_off: number } } };
  configurable_variants?: { variants: HnVariant[] } | null;
}

/** Harvey Norman's category page embeds the product grid in __NEXT_DATA__. */
export async function scrapeHarveyNorman(): Promise<RawOffer[]> {
  const offers = new Map<string, RawOffer>();
  for (let page = 1; page <= 20; page++) {
    const html = await get(`${BASE}/mobile-phones-wearables/mobile-phones?p=${page}`);
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!m) throw new Error("harveynorman: no __NEXT_DATA__");
    const data = JSON.parse(m[1]);
    const pd = data.props.pageProps.pageProps.pageData.productsData;
    const items: HnItem[] = pd.items ?? [];
    for (const it of items) {
      const variants = it.configurable_variants?.variants?.length
        ? it.configurable_variants.variants
        : [
            {
              sku: it.sku,
              name: it.name,
              url_key: it.url_key,
              thumbnail_url: undefined,
              final_price: it.price_range?.minimum_price.final_price.value ?? 0,
              stock_status: "IN_STOCK",
            },
          ];
      for (const v of variants) {
        if (!v.final_price || !looksLikePhone(v.name)) continue;
        const off = it.price_range?.minimum_price.discount?.amount_off ?? 0;
        offers.set(v.sku, {
          retailer: "harveynorman",
          sku: v.sku,
          title: v.name,
          url: `${BASE}/${v.url_key}${it.url_suffix || ".html"}`,
          price: v.final_price,
          wasPrice: off > 0 ? Math.round(v.final_price + off) : undefined,
          image: v.thumbnail_url ? `https://hnau.imgix.net/media/catalog/product${v.thumbnail_url}` : it.small_image?.url,
          inStock: v.stock_status === "IN_STOCK",
        });
      }
    }
    const info = pd.page_info;
    if (!info || page >= info.total_pages) break;
    await sleep(800);
  }
  return [...offers.values()];
}
