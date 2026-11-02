/** Ratio (ratiocoffee.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-ratio",
  base: "https://www.ratiocoffee.com",
  brand: "Ratio",
  cats: ["coffee-machines", "coffee-gear"],
});
