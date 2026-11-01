/** Dreame (dreame.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "dreameau",
  base: "https://www.dreame.com.au",
  brand: "Dreame",
  cats: ["robot-vacuums", "vacuums", "air-fryers"],
});
