/** BestVacuum.com (bestvacuum.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 23). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-bestvacuum",
  base: "https://bestvacuum.com",
  cats: ["vacuums", "robot-vacuums", "air-fryers", "small-kitchen", "coffee-machines"],
});
