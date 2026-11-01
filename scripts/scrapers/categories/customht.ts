/** Custom Home Theatre (customht.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "customht",
  base: "https://www.customht.com.au",
  exclude: /in[- ]wall|in[- ]ceiling|outdoor|\(each\)|switch\b/i,
  cats: ["speakers", "soundbars"],
});
