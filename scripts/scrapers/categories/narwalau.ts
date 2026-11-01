/** Narwal (narwal.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "narwalau",
  base: "https://www.narwal.com.au",
  brand: "Narwal",
  cats: ["robot-vacuums"],
});
