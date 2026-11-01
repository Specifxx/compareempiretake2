/** Raycon (rayconglobal.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-raycon",
  base: "https://rayconglobal.com",
  brand: "Raycon",
  cats: ["headphones"],
});
