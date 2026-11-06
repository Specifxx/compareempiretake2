/** DB Domestics (dbdomestics.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 21). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-dbdomestics",
  base: "https://dbdomestics.com",
  cats: ["dishwashers", "washing-machines", "fridges", "coffee-machines", "vacuums", "small-kitchen", "air-fryers"],
});
