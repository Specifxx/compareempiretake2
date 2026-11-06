/** O.P. Taylor"s (optaylors.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 22). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-optaylors",
  base: "https://optaylors.com",
  cats: ["lego"],
});
