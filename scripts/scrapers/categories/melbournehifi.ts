/** Melbourne Hi-Fi (melbournehifi.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 3). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "melbournehifi",
  base: "https://www.melbournehifi.com.au",
  cats: ["speakers", "tvs"],
});
