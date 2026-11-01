/** MOVA (mova-tech.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-mova",
  base: "https://www.mova-tech.com",
  brand: "MOVA",
  cats: ["robot-vacuums", "vacuums"],
});
