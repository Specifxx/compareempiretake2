/** Doug Brady Hi-Fi (dougbradyhifi.com): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 11). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "uk-dougbrady",
  base: "https://www.dougbradyhifi.com",
  exclude: /\bwith\b|system|\bpackage\b|\+/i,
  cats: ["headphones", "speakers"],
});
