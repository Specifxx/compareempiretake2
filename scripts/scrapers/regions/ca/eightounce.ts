/** Eight Ounce Coffee (eightouncecoffee.ca): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-eightounce",
  base: "https://www.eightouncecoffee.ca",
  cats: ["coffee-machines", "coffee-gear"],
  exclude: /yard sale|aesthetic defect|\bdemo\b/i,
});
