/** Gibson McDonald (gibsonmcdonald.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 22). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-gibsonmcdonald",
  base: "https://gibsonmcdonald.com",
  cats: ["dishwashers", "small-kitchen"],
});
