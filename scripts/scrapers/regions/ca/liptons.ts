/** Lipton's (liptons.ca): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-06 round 22b, Canada). */
import { autoShopify } from "../../auto-shopify";

export const scrapers = autoShopify({
  retailer: "ca-liptons",
  base: "https://liptons.ca",
  cats: ["tvs", "soundbars", "headphones", "speakers"],
});
