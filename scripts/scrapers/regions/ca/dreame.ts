/** Dreame (ca.dreametech.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-dreame",
  base: "https://ca.dreametech.com",
  brand: "Dreame",
  cats: ["robot-vacuums", "vacuums", "hair-care", "air-fryers"],
});
