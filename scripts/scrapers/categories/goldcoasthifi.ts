/** Gold Coast Hi-Fi (goldcoasthifi.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 9). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "goldcoasthifi",
  base: "https://www.goldcoasthifi.com.au",
  exclude: /in[- ]wall|in[- ]ceiling|\(each\)/i,
  cats: ["speakers"],
});
