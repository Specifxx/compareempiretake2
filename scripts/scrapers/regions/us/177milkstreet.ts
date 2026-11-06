/** Milk Street Store (store.177milkstreet.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-177milkstreet",
  base: "https://store.177milkstreet.com",
  cats: ["bbqs"],
});
