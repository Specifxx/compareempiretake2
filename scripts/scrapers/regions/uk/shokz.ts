/** Shokz (uk.shokz.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-shokz",
  base: "https://uk.shokz.com",
  brand: "Shokz",
  cats: ["headphones"],
});
