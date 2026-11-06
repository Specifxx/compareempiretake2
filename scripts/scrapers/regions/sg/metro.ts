/** Metro (metro.com.sg): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06 round 22b, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-metro",
  base: "https://metro.com.sg",
  cats: ["lego"],
});
