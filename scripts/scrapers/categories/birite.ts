/** BiRite (birite.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 12). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "birite",
  base: "https://www.birite.com.au",
  exclude: /box opened|ex[- ]display|seconds stock/i,
  cats: ["vacuums", "tvs", "coffee-machines", "air-fryers", "soundbars", "fridges", "dishwashers", "washing-machines", "robot-vacuums"],
});
