/** Narwal (au.narwal.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "narwalau",
  base: "https://au.narwal.com",
  brand: "Narwal",
  cats: ["robot-vacuums"],
});
