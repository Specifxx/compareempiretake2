/** Shokz (ca.shokz.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-shokz",
  base: "https://ca.shokz.com",
  brand: "Shokz",
  cats: ["headphones"],
});
