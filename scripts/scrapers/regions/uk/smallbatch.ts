/** Small Batch Coffee (smallbatchcoffee.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 10). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-smallbatch",
  base: "https://www.smallbatchcoffee.co.uk",
  exclude: /\+ ?free/i,
  cats: ["coffee-machines", "coffee-gear"],
});
