/** Klapp AV (klappav.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 6). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "klappav",
  base: "https://www.klappav.com.au",
  cats: ["speakers", "soundbars", "headphones"],
  exclude: /isolator|alarm clock|\(each\)|stand\b|in[- ]wall|in[- ]ceiling/i,
});
