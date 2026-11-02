/** Three Bears Coffee (threebearscoffee.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 4). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "threebearscoffee",
  base: "https://www.threebearscoffee.com.au",
  cats: ["coffee-machines", "coffee-gear"],
});
