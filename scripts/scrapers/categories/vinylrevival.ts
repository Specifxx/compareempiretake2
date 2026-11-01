/** Vinyl Revival (vinylrevival.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 7). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "vinylrevival",
  base: "https://www.vinylrevival.com.au",
  cats: ["speakers", "headphones"],
});
