/** Eastwood Hi-Fi (eastwoodhifi.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 8). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "eastwoodhifi",
  base: "https://www.eastwoodhifi.com.au",
  exclude: /in[- ]wall|in[- ]ceiling|passive soundbar|\blcr\b/i,
  cats: ["speakers", "soundbars"],
});
