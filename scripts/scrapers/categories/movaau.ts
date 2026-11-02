/** MOVA (au.mova-tech.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "movaau",
  base: "https://au.mova-tech.com",
  brand: "MOVA",
  cats: ["robot-vacuums", "hair-care"],
});
