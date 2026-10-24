/** Roborock US (us.roborock.com) — official Shopify store. Robot vacuums by product_type; refurbished and warranty items dropped.  */
import { shopifyScrapers } from "./_shopify";

export const scrapers = shopifyScrapers({
  retailer: "us-roborock",
  base: "https://us.roborock.com",
  brand: "Roborock",
  exclude: /refurbished|【|bundle|\+ .*(pack|kit)|accessor/i,
  cats: { "robot-vacuums": { keep: (p) => /^robot vacuums$/i.test(p.product_type ?? "") } },
});
