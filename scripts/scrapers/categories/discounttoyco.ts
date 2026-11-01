/** Discount Toy Co (discounttoyco.com.au): read whole by the one-line Shopify/WooCommerce reader (`auto-shopify.ts`; store survey 2026-11-01, round 5). */
import { autoShopify } from "../auto-shopify";

export const scrapers = autoShopify({
  retailer: "discounttoyco",
  base: "https://www.discounttoyco.com.au",
  cats: ["lego"],
});
