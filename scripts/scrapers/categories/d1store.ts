/** D1 Store (d1store.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "d1store",
  base: "https://www.d1store.com.au",
  cats: ["drones", "cameras"],
});
