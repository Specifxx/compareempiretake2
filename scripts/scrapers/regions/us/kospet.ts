/** KOSPET (kospet.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-kospet",
  base: "https://www.kospet.com",
  brand: "KOSPET",
  cats: ["smartwatches"],
});
