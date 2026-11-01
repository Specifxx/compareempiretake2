/** Shark Ninja (sharkclean.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sharkau",
  base: "https://www.sharkclean.com.au",
  exclude: /tank|main body|filter|brushroll|battery|replacement/i,
  cats: ["vacuums", "coffee-machines", "air-fryers"],
});
