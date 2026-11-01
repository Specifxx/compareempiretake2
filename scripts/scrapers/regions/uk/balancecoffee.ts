/** Balance Coffee (balancecoffee.co.uk): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 14). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-balancecoffee",
  base: "https://www.balancecoffee.co.uk",
  cats: ["coffee-machines"],
});
