/** Start Fitness (startfitness.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-startfitness",
  base: "https://www.startfitness.co.uk",
  exclude: /cycling computer|bike computer|strap|band\b|charger/i,
  cats: ["smartwatches"],
});
