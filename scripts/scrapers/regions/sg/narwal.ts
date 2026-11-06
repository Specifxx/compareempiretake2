/** Narwal (sg.narwal.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Singapore). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "sg-narwal",
  base: "https://sg.narwal.com",
  brand: "Narwal",
  cats: ["robot-vacuums", "vacuums"],
  exclude: /\bkit\b/i,
});
