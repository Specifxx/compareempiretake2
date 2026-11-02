/** Chefman (chefman.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-chefman",
  base: "https://www.chefman.com",
  brand: "Chefman",
  cats: ["air-fryers", "coffee-machines", "coffee-gear", "small-kitchen"],
});
