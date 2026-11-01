/** The Hi-Fi Shop (thehifishop.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 9). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "thehifishop",
  base: "https://www.thehifishop.com.au",
  exclude: /in[- ]wall|in[- ]ceiling|\(each\)/i,
  cats: ["speakers", "soundbars"],
});
