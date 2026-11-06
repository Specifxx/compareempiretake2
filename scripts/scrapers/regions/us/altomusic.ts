/** Alto Music (altomusic.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 23). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-altomusic",
  base: "https://altomusic.com",
  // Demo and B-stock units are left out.
  exclude: /\bdemo\b|b-stock|used/i,
  cats: ["headphones", "speakers"],
});
