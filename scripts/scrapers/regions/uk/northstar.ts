/** North Star Coffee (northstarroast.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-northstar",
  base: "https://www.northstarroast.com",
  cats: ["coffee-machines", "coffee-gear"],
});
