/** Quarter Horse Coffee (quarterhorsecoffee.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 10). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-quarterhorse",
  base: "https://www.quarterhorsecoffee.com",
  cats: ["coffee-machines", "coffee-gear"],
});
