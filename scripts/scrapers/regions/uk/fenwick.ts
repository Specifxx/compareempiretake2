/** Fenwick (fenwick.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 7). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-fenwick",
  base: "https://www.fenwick.co.uk",
  cats: ["headphones", "coffee-machines", "lego"],
});
