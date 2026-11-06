/** Panasonic (shop.panasonic.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, round 23). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "us-panasonic",
  base: "https://shop.panasonic.com",
  cats: ["tvs", "small-kitchen", "hair-care", "headphones"],
});
