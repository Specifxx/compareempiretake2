/** Market Lane Coffee (marketlane.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "marketlane",
  base: "https://www.marketlane.com.au",
  cats: ["coffee-machines"],
});
