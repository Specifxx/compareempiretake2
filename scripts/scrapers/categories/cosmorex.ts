/** Cosmorex Coffee (cosmorex.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 10). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "cosmorex",
  base: "https://www.cosmorex.com.au",
  cats: ["coffee-machines"],
});
