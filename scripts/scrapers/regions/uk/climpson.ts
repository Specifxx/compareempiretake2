/** Climpson & Sons (climpsonandsons.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-climpson",
  base: "https://www.climpsonandsons.com",
  cats: ["coffee-machines", "coffee-gear"],
});
