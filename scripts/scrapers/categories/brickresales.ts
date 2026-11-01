/** Brick Resales (brickresales.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "brickresales",
  base: "https://www.brickresales.com.au",
  cats: ["lego"],
});
