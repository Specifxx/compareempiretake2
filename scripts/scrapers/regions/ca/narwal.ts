/** Narwal (ca.narwal.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-narwal",
  base: "https://ca.narwal.com",
  brand: "Narwal",
  cats: ["robot-vacuums", "vacuums"],
  exclude: /\bkit\b/i,
});
