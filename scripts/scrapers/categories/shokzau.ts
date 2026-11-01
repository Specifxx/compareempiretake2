/** Shokz (au.shokz.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "shokzau",
  base: "https://au.shokz.com",
  brand: "Shokz",
  cats: ["headphones"],
});
