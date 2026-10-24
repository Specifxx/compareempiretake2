/** Dreame US (dreametech.com) — official Shopify store. Robot vacuums by product_type; bundles and "for business" dropped. No mpn on the store. */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-dreame",
  base: "https://www.dreametech.com",
  brand: "Dreame",
  exclude: /bundle|&|\+|with accessory kit|refurb/i,
  cats: { "robot-vacuums": { keep: (p) => /^robot vacuums?(-1)?$/i.test(p.product_type ?? "") } },
});
