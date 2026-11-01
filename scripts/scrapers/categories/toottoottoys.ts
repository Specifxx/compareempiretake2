/** Toot Toot Toys (toottoottoys.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "toottoottoys",
  base: "https://www.toottoottoys.com.au",
  cats: ["lego"],
});
