/** Toyworld Frankston (toyworldfrankston.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "toyworldfrankston",
  base: "https://www.toyworldfrankston.com.au",
  cats: ["lego"],
});
