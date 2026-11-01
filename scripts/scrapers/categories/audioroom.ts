/** The Audio Room (audioroom.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 11). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "audioroom",
  base: "https://www.audioroom.com.au",
  exclude: /in[- ]wall|in[- ]ceiling|\(each\)/i,
  cats: ["headphones", "speakers"],
});
