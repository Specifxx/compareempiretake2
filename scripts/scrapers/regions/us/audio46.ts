/** Audio46 (audio46.com, New York) — Shopify headphone shop. Headphones and in-ear headphones by product_type; open-box and bundles dropped. SKU = model code. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-audio46",
  base: "https://www.audio46.com",
  skuIsMpn: (s) => (/open|-ob$|bundle|^\d+$/i.test(s) ? undefined : s),
  exclude: /open box|bundle|\+|b-stock|demo|cable|ear ?tips|ear ?pads?/i,
  cats: { headphones: { keep: (p) => /^(headphones|in-ear headphones)$/i.test(p.product_type ?? "") } },
});
