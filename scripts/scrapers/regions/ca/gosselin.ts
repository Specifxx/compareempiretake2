/** Gosselin (gosselinphoto.ca): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-gosselin",
  base: "https://www.gosselinphoto.ca",
  cats: ["cameras", "drones"],
  exclude: /\busag|\bsac\b|étui|\bsangle\b/i,
});
